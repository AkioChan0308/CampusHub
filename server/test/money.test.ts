// Chạy: npm test. Sổ quỹ: đợt thu, đối soát sao kê, duyệt chi, dự trù. Mọi số tiền phải khớp sổ quỹ.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, COL, csv, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}`;
const K = `${C}/collections/${COL}`;

test("đợt thu: thủ quỹ ghi tiền mặt; trưởng ban không có quyền; ghi lần hai báo đã đóng", async () => {
  const noRight = await srv.call("POST", `${K}/payments/a021`, { as: "a005", body: { method: "cash" } });
  assert.equal(noRight.status, 403);
  assert.equal(noRight.body.error.message, "Chỉ thủ quỹ và chủ nhiệm ghi nhận tiền.");
  const r = await srv.call("POST", `${K}/payments/a021`, { as: "a002", body: { method: "cash" } });
  assert.equal(r.status, 200);
  assert.equal(r.body.payment.status, "paid");
  assert.equal(r.body.payment.method, "cash");
  assert.equal(r.body.balance, 3_220_000);
  const again = await srv.call("POST", `${K}/payments/a021`, { as: "a002", body: { method: "cash" } });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.message, "Đỗ Bảo Ngọc đã đóng rồi.");
});

test("danh sách đợt thu: báo đã chuyển lên đầu, đã đóng xuống cuối", async () => {
  const r = (await srv.call("GET", K, { as: "a002" })).body;
  assert.equal(r.payments.length, 42);
  assert.equal(r.payments[0].status, "reported");
  assert.equal(r.payments[r.payments.length - 1].status, "paid");
  assert.deepEqual([r.stats.paid, r.stats.reported, r.stats.unpaid], [29, 2, 11]);
});

test("đối soát: gán chuyển hộ khi Ngọc đã đóng tiền mặt, sổ quỹ vẫn nhận đủ 200.000 ₫ của ngân hàng", async () => {
  const before = (await srv.call("GET", `${K}/reconciliation`, { as: "a002" })).body;
  assert.equal(before.openManual, 4);
  assert.equal(before.assignable.length, 13);
  assert.equal(before.assignable[before.assignable.length - 1].state, "reported");

  await srv.call("POST", `${K}/payments/a021`, { as: "a002", body: { method: "cash" } });
  const rows = (await srv.call("GET", `${K}/reconciliation`, { as: "a002" })).body.rows;
  const row = rows.find((x: { content: string }) => x.content.includes("A021"));
  assert.deepEqual(row.suggestion.map((p: { state: string }) => p.state), ["paid", "unpaid"]);

  const path = `${K}/statements/${row.statementId}/txns/${row.txnId}/resolve`;
  assert.equal((await srv.call("POST", path, { as: "a002", body: { personIds: [] } })).status, 400);
  assert.equal((await srv.call("POST", path, { as: "a002", body: { personIds: ["a021", "a021"] } })).status, 400);
  assert.equal((await srv.call("POST", path, { as: "a002", body: { personIds: ["p-bao-chau"] } })).status, 400); // không ở đợt thu
  const r = await srv.call("POST", path, { as: "a002", body: { personIds: ["a021", "a022"] } });
  assert.equal(r.status, 200);
  assert.equal(r.body.balance, 3_120_000 + 100_000 + 200_000);
  assert.equal(r.body.row.resolvedTo.length, 2);
  assert.equal((await srv.call("POST", path, { as: "a002", body: { personIds: ["a021"] } })).status, 409); // đã gán rồi
});

test("đã ghi nhận tay rồi tải sao kê có đúng khoản đó: chỉ nối, không cộng lần hai", async () => {
  await srv.call("POST", `${K}/payments/a024`, { as: "a002", body: { method: "transfer" } });
  const r = await srv.call("POST", `${K}/statements`, {
    as: "a002",
    body: { fileName: "sao-ke-02-10.csv", csv: csv([["02/10/2026 21:40", "100000", "HOANG DUC TRI", "QFALL26 A024"]]) },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.auto, 1);
  assert.equal(r.body.balance, 3_220_000);
});

test("tải sao kê: đọc số tiền kiểu ngân hàng, bỏ dòng tiền ra; file không đọc được thì báo lỗi", async () => {
  const file = csv([
    ["02/10/2026 09:15:07", "100,000.00", "LE NGOC ANH", "QFALL26 A037"],
    ["02/10/2026 11:40:51", "100,000.00", "AI DO", "chuyen tien"],
    ["02/10/2026 12:00:00", "-200,000.00", "CLB CAU LONG", "THUE SAN TUAN 5"],
  ]);
  const r = await srv.call("POST", `${K}/statements`, { as: "a001", body: { fileName: "sao-ke.csv", csv: file } });
  assert.deepEqual([r.body.txnCount, r.body.auto, r.body.manual, r.body.ignored], [2, 1, 1, 0]);
  assert.equal(r.body.balance, 3_220_000);
  const recon = (await srv.call("GET", `${K}/reconciliation`, { as: "a001" })).body;
  assert.equal(recon.openManual, 5); // 4 việc còn treo của file cũ vẫn còn
  assert.equal(recon.latest.fileName, "sao-ke.csv");
  assert.equal(recon.latest.duplicates, 0);
  assert.equal(r.body.skippedDates, 0);

  // Ngày không có thật bị bỏ và được đếm; dòng đã có ở lần tải trước đếm riêng trong ignored
  const again = await srv.call("POST", `${K}/statements`, {
    as: "a001",
    body: { fileName: "sao-ke-2.csv", csv: csv([["31/02/2026", "100000", "AI DO", "QFALL26 A030"], ["02/10/2026 09:15:07", "100,000.00", "LE NGOC ANH", "QFALL26 A037"]]) },
  });
  assert.equal(again.status, 201);
  assert.deepEqual([again.body.txnCount, again.body.ignored, again.body.skippedDates], [1, 1, 1]);
  assert.equal((await srv.call("GET", `${K}/reconciliation`, { as: "a001" })).body.latest.duplicates, 1);
  const badOnly = await srv.call("POST", `${K}/statements`, { as: "a001", body: { fileName: "sai-ngay.csv", csv: csv([["31/02/2026", "100000", "AI DO", "QFALL26 A030"]]) } });
  assert.equal(badOnly.status, 400);
  assert.match(badOnly.body.error.message, /1 dòng có ngày không có thật/);

  const empty = await srv.call("POST", `${K}/statements`, { as: "a001", body: { fileName: "rong.csv", csv: "Ngày,Số tiền\n" } });
  assert.equal(empty.status, 400);
  assert.match(empty.body.error.message, /^Không đọc được giao dịch tiền vào nào/);
  assert.equal((await srv.call("POST", `${K}/statements`, { as: "a005", body: { fileName: "x.csv", csv: file } })).status, 403);
});

test("duyệt chi: không tự duyệt; không đúng vai thì bị chặn; từ chối phải có lý do", async () => {
  const self = await srv.call("POST", `${C}/expenses/chi-2/approve`, { as: "a001" });
  assert.equal(self.status, 403);
  assert.equal(self.body.error.code, "SELF_APPROVAL");
  assert.equal((await srv.call("POST", `${C}/expenses/chi-2/approve`, { as: "a002" })).body.error.code, "FORBIDDEN");
  assert.equal((await srv.call("POST", `${C}/expenses/chi-2/approve`, { as: "a005" })).body.expense.status, "approved");
  assert.equal((await srv.call("POST", `${C}/expenses/chi-2/approve`, { as: "a003" })).status, 409);

  const noNote = await srv.call("POST", `${C}/expenses/chi-1/reject`, { as: "a001", body: { note: "  " } });
  assert.equal(noNote.status, 400);
  assert.equal(noNote.body.error.message, "Cần ghi chú lý do khi từ chối.");
  const rejected = (await srv.call("POST", `${C}/expenses/chi-1/reject`, { as: "a001", body: { note: "Chờ báo giá của sân" } })).body.expense;
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.rejectNote, "Chờ báo giá của sân");
});

test("khoản trên 2.000.000 ₫: ban điều hành duyệt rồi chờ mentor; mentor duyệt xong thủ quỹ mới ghi đã chi", async () => {
  const created = await srv.call("POST", `${C}/expenses`, {
    as: "a005", body: { kind: "proposal", title: "Thuê thêm sân cho giải", amount: 2_500_000, budgetItemId: "giai-noi-bo", hasReceipt: true },
  });
  assert.equal(created.status, 201);
  const id = created.body.expense.id;
  assert.equal(created.body.expense.budgetItem.name, "Giải nội bộ Fall 2026");
  assert.equal((await srv.call("POST", `${C}/expenses/${id}/approve`, { as: "a001" })).body.expense.status, "mentor");
  assert.equal((await srv.call("POST", `${C}/expenses/${id}/spent`, { as: "a002" })).status, 409); // chưa đủ duyệt
  assert.equal((await srv.call("POST", `/school/expenses/${id}/approve`, { as: "p-thu-trang" })).body.expense.status, "approved");
  assert.equal((await srv.call("POST", `${C}/expenses/${id}/spent`, { as: "a005" })).status, 403);
  const spent = await srv.call("POST", `${C}/expenses/${id}/spent`, { as: "a002" });
  assert.equal(spent.body.expense.status, "spent");
  assert.equal(spent.body.balance, 3_120_000 - 2_500_000);
  assert.equal((await srv.call("POST", `${C}/expenses/${id}/spent`, { as: "a002" })).status, 409);
});

test("đề xuất chi: kiểm tra số tiền và khoản dự trù", async () => {
  const send = (body: object) => srv.call("POST", `${C}/expenses`, { as: "a005", body: { kind: "proposal", title: "Mua nước", ...body } });
  assert.equal((await send({ amount: -5 })).status, 400);
  assert.equal((await send({ amount: 1.5 })).status, 400);
  assert.equal((await send({ amount: 50_000, budgetItemId: "khong-co" })).status, 400);
  assert.equal((await send({ amount: 50_000 })).status, 201);
});

test("dự trù: ra +170.000 ₫; trưởng ban không sửa được; thủ quỹ thêm khoản thì dự báo đổi theo", async () => {
  const b = (await srv.call("GET", `${C}/budget`, { as: "a005" })).body;
  assert.equal(b.forecast.result, 170_000);
  assert.equal(b.totals.toSpend, 5_250_000);
  assert.equal((await srv.call("POST", `${C}/budget/items`, { as: "a005", body: { name: "Mua lưới", planned: 1_500_000 } })).status, 403);
  const added = await srv.call("POST", `${C}/budget/items`, { as: "a002", body: { name: "Mua lưới", planned: 1_500_000 } });
  assert.equal(added.status, 201);
  assert.deepEqual([added.body.item.period, added.body.item.source, added.body.item.spent], ["Chưa rõ", "Quỹ thành viên", 0]);
  assert.equal((await srv.call("GET", `${C}/budget`, { as: "a002" })).body.forecast.result, 170_000 - 1_500_000);
  assert.equal((await srv.call("POST", `${C}/budget/submit`, { as: "a002" })).body.submittedAt, "2026-10-03T07:40:00+07:00");
});

test("duyệt khoản chi kèm ghi chú: ghi chú nằm trong lịch sử (luật chốt ngày 03/10/2026)", async () => {
  const r = await srv.call("POST", `${C}/expenses/chi-2/approve`, { as: "a005", body: { note: "Nhớ lấy hóa đơn" } });
  assert.equal(r.status, 200);
  assert.equal(r.body.expense.history.at(-1).text, "duyệt: “Nhớ lấy hóa đơn”");
  const mentor = await srv.call("POST", "/school/expenses/chi-3/approve", { as: "p-thu-trang", body: {} });
  assert.equal(mentor.body.expense.history.at(-1).text, "mentor duyệt");
});
