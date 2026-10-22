// Chạy: npm test. Ban điều hành: khung trang, trang chủ, thành viên và đơn xin vào, điểm danh QR, bàn giao, sổ quỹ.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}`;

test("khung ban điều hành: vai của mình và số việc đang chờ", async () => {
  const r = await srv.call("GET", `${C}/board`, { as: "a001" });
  assert.equal(r.status, 200);
  assert.equal(r.body.me.role, "president");
  assert.deepEqual(r.body.counts, { pendingApplications: 3, openManualTxns: 4, pendingExpenses: 2 });
  assert.equal(r.body.nextSessionId, "tuan-5");
  assert.equal(r.body.collectionId, "quy-fall-2026");
});

test("trang chủ ra đúng số của bản vẽ (design/README.md mục 8)", async () => {
  const d = (await srv.call("GET", `${C}/dashboard`, { as: "a001" })).body;
  assert.equal(d.balance, 3_120_000);
  assert.equal(d.collection.stats.paid, 29);
  assert.equal(d.collection.stats.total, 42);
  assert.equal(d.budget.forecast, 170_000);
  assert.equal(d.pendingExpenses.total, 650_000);
  assert.equal(d.reconcile.openManual, 4);
  assert.equal(d.upcomingEvents.length, 2);
  assert.equal(d.recentLedger.length, 3);
});

test("thành viên thường không vào được các API của ban điều hành", async () => {
  // a018 là thành viên thường. a017 được chọn làm chủ nhiệm mới nên riêng /board và /handover mở cho a017 (xem handover-steps.test.ts).
  for (const path of ["/board", "/dashboard", "/members", "/applications", "/expenses", "/budget", "/ledger", "/handover", "/tasks"]) {
    const r = await srv.call("GET", `${C}${path}`, { as: "a018" });
    assert.equal(r.status, 403, path);
    assert.equal(r.body.error.code, "FORBIDDEN");
  }
});

test("danh sách thành viên: 42 người theo mã, kèm điểm danh và quỹ", async () => {
  const r = (await srv.call("GET", `${C}/members`, { as: "a003" })).body;
  assert.equal(r.members.length, 42);
  assert.equal(r.members[0].code, "A001");
  assert.equal(r.heldSessions, 4);
  const minhAnh = r.members.find((m: { personId: string }) => m.personId === "a017");
  assert.equal(minhAnh.attended, 3);
  assert.equal(minhAnh.payment.status, "reported");
});

test("duyệt đơn: thành viên mới A043 chờ nhận lời mời; duyệt lại báo đã xử lý; thủ quỹ không duyệt được", async () => {
  const noRight = await srv.call("POST", `${C}/applications/don-1/approve`, { as: "a002" });
  assert.equal(noRight.status, 403);
  assert.equal(noRight.body.error.message, "Chỉ chủ nhiệm, phó chủ nhiệm và trưởng ban duyệt đơn.");
  const r = await srv.call("POST", `${C}/applications/don-1/approve`, { as: "a001" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.member, { personId: "p-hong-nhung", code: "A043", invite: "pending" });
  assert.equal(r.body.application.status, "approved");
  assert.equal((await srv.call("POST", `${C}/applications/don-1/approve`, { as: "a001" })).status, 409);
  const stats = (await srv.call("GET", `${C}/dashboard`, { as: "a001" })).body.collection.stats;
  assert.equal(stats.total, 43); // người mới có khoản quỹ phải đóng
});

test("từ chối đơn và lọc đơn theo trạng thái", async () => {
  assert.equal((await srv.call("POST", `${C}/applications/don-2/reject`, { as: "a005" })).body.application.status, "rejected");
  const rejected = (await srv.call("GET", `${C}/applications?status=rejected`, { as: "a005" })).body.applications;
  assert.deepEqual(rejected.map((a: { id: string }) => a.id), ["don-2"]);
  assert.equal((await srv.call("GET", `${C}/applications`, { as: "a005" })).body.applications.length, 2);
  assert.equal((await srv.call("GET", `${C}/applications?status=lung-tung`, { as: "a005" })).status, 400);
});

test("điểm danh QR: mở buổi, lấy mã, quét; chặn mã hết hạn, sai người, trùng điện thoại", async () => {
  const E = `${C}/events/tuan-5`;
  assert.equal((await srv.call("GET", `${E}/qr`, { as: "a001" })).body.error.code, "CHECKIN_NOT_OPEN");
  assert.equal((await srv.call("POST", `${E}/open`, { as: "a001" })).body.event.status, "open");
  assert.equal((await srv.call("POST", `${E}/open`, { as: "a001" })).body.event.status, "open"); // gọi lại không sao

  const qr = (await srv.call("GET", `${E}/qr`, { as: "a001" })).body;
  assert.equal(qr.token, srv.qr("tuan-5"));
  assert.equal(qr.checkinPath, `/checkin?e=tuan-5&t=${qr.token}`);
  assert.equal(qr.stepSeconds, 30);

  const scan = (as: string, token: string, deviceId: string) => srv.call("POST", "/checkin", { as, body: { eventId: "tuan-5", token, deviceId } });
  const ok = await scan("a017", qr.token, "dien-thoai-minh-anh");
  assert.equal(ok.status, 200);
  assert.equal(ok.body.created, true);
  assert.equal(ok.body.event.clubName, "CLB Cầu lông Sân Nhà");
  assert.equal((await scan("a017", qr.token, "dien-thoai-minh-anh")).body.created, false);

  assert.equal((await scan("a009", qr.token, "dien-thoai-minh-anh")).body.error.code, "DEVICE_USED");
  assert.equal((await scan("a009", srv.qr("tuan-5", -1), "dien-thoai-khoi")).status, 200); // mã của bước trước vẫn nhận
  assert.equal((await scan("a011", srv.qr("tuan-5", -2), "dien-thoai-thinh")).body.error.code, "QR_INVALID");
  const pending = await scan("a022", qr.token, "dien-thoai-nam");
  assert.equal(pending.body.error.code, "INVITE_PENDING");
  assert.equal(pending.body.error.details.inviteCode, "moi-a022");
  const outsider = await scan("p-bao-chau", qr.token, "dien-thoai-chau");
  assert.equal(outsider.body.error.code, "NOT_MEMBER");
  assert.equal(outsider.body.error.details.clubId, CLUB);

  const manual = await srv.call("POST", `${E}/attendance`, { as: "a005", body: { personId: "a022" } });
  assert.equal(manual.body.created, true);
  assert.equal(manual.body.attendance.by.name, "Trần Gia Huy");
  assert.equal((await srv.call("POST", `${E}/attendance`, { as: "a005", body: { personId: "a022" } })).body.created, false);

  const detail = (await srv.call("GET", E, { as: "a001" })).body;
  assert.equal(detail.attendance.length, 3);
  assert.equal(detail.totalMembers, 42);
  assert.equal(detail.notCheckedIn.length, 39);

  assert.equal((await srv.call("POST", `${E}/close`, { as: "a001" })).body.event.status, "closed");
  assert.equal((await scan("a011", qr.token, "dien-thoai-thinh")).body.error.code, "CHECKIN_CLOSED");
  assert.equal((await srv.call("GET", `${E}/qr`, { as: "a001" })).body.error.code, "CHECKIN_CLOSED");
  assert.equal((await srv.call("GET", `${C}/events/khong-co`, { as: "a001" })).status, 404);
});

test("bàn giao: chỉ chủ nhiệm đổi tài khoản nhận quỹ; máy chủ chỉ trả 4 số cuối", async () => {
  const body = { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" };
  assert.equal((await srv.call("PUT", `${C}/handover/receiver`, { as: "a002", body })).status, 403);
  const bad = await srv.call("PUT", `${C}/handover/receiver`, { as: "a001", body: { ...body, account: "12ab" } });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.message, "Số tài khoản chỉ gồm chữ số.");
  assert.equal((await srv.call("PUT", `${C}/handover/receiver`, { as: "a001", body: { ...body, personId: "p-bao-chau" } })).status, 400);

  const r = await srv.call("PUT", `${C}/handover/receiver`, { as: "a001", body });
  assert.equal(r.status, 200);
  assert.equal(r.body.step, 5);
  assert.equal(r.body.newReceiver.accountLast4, "6789");
  assert.ok(!JSON.stringify(r.body).includes("0123456789"));
  assert.equal((await srv.call("PUT", `${C}/handover/receiver`, { as: "a001", body })).status, 409); // đã qua bước 4

  assert.equal((await srv.call("PUT", `${C}/handover/step`, { as: "a001", body: { step: 4 } })).body.step, 4);
  assert.equal((await srv.call("PUT", `${C}/handover/step`, { as: "a001", body: { step: 6 } })).status, 409);
});

test("sổ quỹ: số dư bằng tổng các bút toán", async () => {
  const r = (await srv.call("GET", `${C}/ledger`, { as: "a005" })).body;
  assert.equal(r.balance, 3_120_000);
  assert.equal(r.entries.length, 34); // số dư đầu kỳ + 4 lần thuê sân + 29 người đã đóng
  const sum = r.entries.reduce((s: number, e: { direction: string; amount: number }) => s + (e.direction === "in" ? e.amount : -e.amount), 0);
  assert.equal(sum, r.balance);
});
