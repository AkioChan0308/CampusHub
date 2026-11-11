// Chạy: npm test. Bàn giao một vai (09/11/2026): đơn gửi chủ nhiệm, duyệt hoặc từ chối, các bước, người nhận xác nhận, quyền.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createSeed } from "../src/domain.ts";
import { CLUB, startServer, useMidHandover, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}/role-handovers`;
type Item = { id: string; status: string; step: number; role: string; can: { decide: boolean; cancel: boolean; step: boolean; accept: boolean }; rejectReason?: string };
const list = async (as: string) => (await srv.call("GET", C, { as })).body as { items: Item[]; mine: { role: string; department?: string }[]; candidates: { personId: string }[] };
const create = (as: string, body: object) => srv.call("POST", C, { as, body });
const decide = (as: string, id: string, body: object) => srv.call("POST", `${C}/${id}/decision`, { as, body });
const step = (as: string, id: string, body: object) => srv.call("POST", `${C}/${id}/step`, { as, body });
const roleOf = async (id: string, as = "a001") => ((await srv.call("GET", `/clubs/${CLUB}/members`, { as })).body.members as { personId: string; role: string }[]).find((m) => m.personId === id)!.role;

test("danh sách: mỗi người thấy vai mình bàn giao được; người nhận chọn trong thành viên đủ điều kiện", async () => {
  const t = await list("a002");
  assert.deepEqual(t.mine, [{ role: "treasurer" }]);
  assert.equal(t.candidates.some((c) => c.personId === "a002"), false);
  assert.equal(t.candidates.some((c) => c.personId === "a003"), false); // phó chủ nhiệm giữ chức danh khác
  assert.equal(t.candidates.some((c) => c.personId === "a006"), true);
  assert.deepEqual((await list("a005")).mine, [{ role: "head", department: "Hậu cần" }]);
  assert.deepEqual((await list("a006")).mine, []); // thành viên thường không bàn giao được
  assert.equal((await srv.call("GET", C, { as: "a022" })).status, 403); // chưa nhận lời mời
});

test("gửi đơn rồi chủ nhiệm duyệt: thủ quỹ đi hết các bước, người nhận xác nhận thì đổi vai", async () => {
  const r = await create("a002", { role: "treasurer", toId: "a006", reason: "Sắp tốt nghiệp" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body.items[0].id as string;
  assert.equal(r.body.items[0].status, "requested");
  assert.equal(r.body.items[0].step, 1);
  assert.equal((await step("a002", id, { action: "lockBalance" })).status, 409); // chưa được duyệt
  assert.equal((await list("a001")).items[0].can.decide, true);
  assert.equal((await decide("a002", id, { approve: true })).status, 403); // người gửi không tự duyệt
  assert.equal((await decide("a003", id, { approve: true })).status, 403); // phó chủ nhiệm không duyệt
  const ok = await decide("a001", id, { approve: true });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.items[0].step, 2);
  assert.equal((await decide("a001", id, { approve: true })).status, 409); // đã xử lý

  assert.equal((await step("a001", id, { action: "lockBalance" })).status, 403); // chỉ người giao
  assert.equal((await step("a002", id, { action: "reviewKit" })).status, 409); // sai bước
  assert.equal((await step("a002", id, { action: "lockBalance" })).body.items[0].lockedBalance, 3_120_000);
  assert.equal((await step("a002", id, { action: "reviewKit" })).body.items[0].step, 4);
  const bad = await step("a002", id, { action: "setReceiver", bank: "[Ngân hàng thử]", account: "12ab" });
  assert.equal(bad.status, 400);
  const rec = await step("a002", id, { action: "setReceiver", bank: "[Ngân hàng thử]", account: "0123456789" });
  assert.equal(rec.body.items[0].newReceiver.accountLast4, "6789");
  assert.equal(JSON.stringify(rec.body).includes("0123456789"), false); // không trả số tài khoản đầy đủ
  assert.equal((await step("a002", id, { action: "finishTransfer" })).status, 409); // còn tài khoản bắt buộc
  assert.equal((await step("a002", id, { action: "transferAccount", accountId: "kit-fanpage" })).status, 404); // không phải tài khoản người giao giữ
  assert.equal((await step("a002", id, { action: "transferAccount", accountId: "kit-ngan-hang" })).status, 200);
  const fin = await step("a002", id, { action: "finishTransfer" });
  assert.equal(fin.body.items[0].step, 6);
  // Người nhận (thành viên thường) thấy đơn và xác nhận được; người giao thì không.
  const mine = (await list("a006")).items[0];
  assert.equal(mine.can.accept, true);
  assert.equal((await step("a002", id, { action: "accept" })).status, 403);
  const done = await step("a006", id, { action: "accept" });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(done.body.items[0].status, "done");
  assert.equal(done.body.items[0].step, 7);
  assert.equal(await roleOf("a006"), "treasurer");
  assert.equal(await roleOf("a002"), "member");
  assert.equal((await step("a006", id, { action: "accept" })).status, 409); // đã xong
  // Người giao đã về thành viên thường vẫn xem lại được biên bản của chính mình (không thấy phần ban điều hành).
  const oldBoard = await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a002" });
  assert.equal(oldBoard.status, 200);
  assert.equal(oldBoard.body.canViewHandover, false);
  assert.equal(((await list("a002")).items[0] as Item).status, "done");
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/dashboard`, { as: "a002" })).status, 403);
  const notices = (await srv.call("GET", "/me/notifications", { as: "a001" })).body.items as { kind: string }[];
  assert.equal(notices.some((n) => n.kind === "role-handover-request"), true);
});

test("từ chối bắt buộc có lý do; gửi lại được; hủy được trước khi xong", async () => {
  const id = (await create("a003", { role: "vice", toId: "a004", reason: "Bận học" })).body.items[0].id as string;
  assert.equal((await decide("a001", id, { approve: false })).status, 400);
  const rej = await decide("a001", id, { approve: false, reason: "Chưa tìm được người hợp hơn" });
  assert.equal(rej.body.items[0].status, "rejected");
  assert.equal(rej.body.items[0].rejectReason, "Chưa tìm được người hợp hơn");
  assert.equal((await list("a004")).items.length, 1); // người nhận thấy đơn có tên mình
  assert.equal((await list("a006")).items.length, 0); // người không liên quan không thấy
  const again = await create("a003", { role: "vice", toId: "a006", reason: "Gửi lại" });
  assert.equal(again.status, 201);
  assert.equal((await create("a003", { role: "vice", toId: "a006", reason: "Trùng" })).status, 400); // mỗi vai một đơn
  const id2 = again.body.items[0].id as string;
  assert.equal((await srv.call("POST", `${C}/${id2}/cancel`, { as: "a005" })).status, 403);
  const cancelled = await srv.call("POST", `${C}/${id2}/cancel`, { as: "a003" });
  assert.equal(cancelled.body.items[0].status, "cancelled");
  assert.equal((await srv.call("POST", `${C}/${id2}/cancel`, { as: "a003" })).status, 409);
});

test("gửi đơn sai: không giữ vai, người nhận không đủ điều kiện, trưởng ban sai ban", async () => {
  assert.equal((await create("a006", { role: "treasurer", toId: "a004", reason: "x" })).status, 400);
  assert.equal((await create("a002", { role: "treasurer", toId: "a002", reason: "x" })).status, 400);
  assert.equal((await create("a002", { role: "treasurer", toId: "a003", reason: "x" })).status, 400);
  assert.equal((await create("a002", { role: "treasurer", toId: "a022", reason: "x" })).status, 400); // chưa nhận lời mời
  assert.equal((await create("a002", { role: "treasurer", toId: "a006", reason: "  " })).status, 400);
  assert.equal((await create("a005", { role: "head", toId: "a006", reason: "x" })).status, 400); // thiếu ban
  assert.equal((await create("a005", { role: "head", department: "Truyền thông", toId: "a006", reason: "x" })).status, 400);
  assert.equal((await create("a005", { role: "head", department: "Hậu cần", toId: "a007", reason: "Chuyển ban" })).status, 201); // a007 đã là trưởng ban khác
});

test("bàn giao trưởng ban: bỏ qua bước thủ quỹ; chỉ ban đó đổi trưởng", async () => {
  const id = (await create("a005", { role: "head", department: "Hậu cần", toId: "a006", reason: "Chuyển ban" })).body.items[0].id as string;
  const ok = await decide("a001", id, { approve: true });
  assert.equal(ok.body.items[0].step, 3); // không có bước 2
  assert.equal((await step("a005", id, { action: "lockBalance" })).status, 409);
  await step("a005", id, { action: "reviewKit" });
  const fin = await step("a005", id, { action: "finishTransfer" });
  assert.equal(fin.body.items[0].step, 6);
  await step("a006", id, { action: "accept" });
  const deps = (await srv.call("GET", `/clubs/${CLUB}/members`, { as: "a001" })).body.departments as { name: string; head?: { personId: string } }[];
  assert.equal(deps.find((d) => d.name === "Hậu cần")!.head!.personId, "a006");
  assert.equal(await roleOf("a006"), "head");
  assert.equal(await roleOf("a005"), "member");
});

test("chủ nhiệm bàn giao vai của mình: không cần đơn, người nhận xác nhận thì đổi chủ nhiệm", async () => {
  const r = await create("a001", { role: "president", toId: "a017", reason: "Hết nhiệm kỳ" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body.items[0].id as string;
  assert.equal(r.body.items[0].status, "active");
  assert.equal(r.body.items[0].step, 3);
  await step("a001", id, { action: "reviewKit" });
  // Chủ nhiệm giữ tài khoản bắt buộc (fanpage, drive): phải chuyển hết trước khi sang bước 6.
  assert.equal((await step("a001", id, { action: "finishTransfer" })).status, 409);
  await step("a001", id, { action: "transferAccount", accountId: "kit-fanpage" });
  await step("a001", id, { action: "transferAccount", accountId: "kit-drive" });
  await step("a001", id, { action: "finishTransfer" });
  assert.equal((await step("a017", id, { action: "accept" })).status, 200);
  assert.equal(await roleOf("a017", "a017"), "president");
  assert.equal(await roleOf("a001", "a017"), "member");
});

test("trang Bàn giao cả ban chỉ có chủ nhiệm (và chủ nhiệm mới); vai khác chỉ có bàn giao vai của mình", async () => {
  useMidHandover(srv); // đợt bàn giao mẫu ở bước 4, đã chọn Nguyễn Minh Anh (a017) làm chủ nhiệm mới
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as: "a001" })).status, 200);
  for (const as of ["a003", "a002", "a005"]) { // phó chủ nhiệm, thủ quỹ, trưởng ban
    assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as })).status, 403, as);
    assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as })).body.canViewHandover, false, as);
    assert.equal((await srv.call("GET", C, { as })).status, 200, as); // vẫn vào được bàn giao vai của mình
  }
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a001" })).body.canViewHandover, true);
  // Chủ nhiệm mới được chọn ở bước 1 vẫn là thành viên thường: chỉ vào được khi bàn giao tới bước 6, lúc họ phải xác nhận.
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as: "a017" })).status, 403); // dữ liệu mẫu: đã chọn a017, đang ở bước 4
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a017" })).status, 403);
  srv.store.update((st) => ({ ...st, handovers: st.handovers.map((h) => ({ ...h, step: 6 })) }));
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as: "a017" })).status, 200);
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a017" })).body.canViewHandover, true);
});

test("người nhận bàn giao một vai (thành viên thường, không phải chủ nhiệm mới) chỉ vào được trang bàn giao vai: không thấy bàn giao cả ban, không thấy kho", async () => {
  const id = (await create("a002", { role: "treasurer", toId: "a006", reason: "Sắp tốt nghiệp" })).body.items[0].id as string;
  await decide("a001", id, { approve: true });
  await step("a002", id, { action: "lockBalance" });
  await step("a002", id, { action: "reviewKit" });
  await step("a002", id, { action: "setReceiver", bank: "[Ngân hàng thử]", account: "0123456789" });
  await step("a002", id, { action: "transferAccount", accountId: "kit-ngan-hang" });
  await step("a002", id, { action: "finishTransfer" });
  // a006 đang ở bước 6, chưa xác nhận: vai vẫn là thành viên.
  const board = await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a006" });
  assert.equal(board.status, 200);
  assert.equal(board.body.canViewHandover, false);
  assert.equal(board.body.me.role, "member");
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as: "a006" })).status, 403);
  // Kho bàn giao: thành viên thường vẫn đọc được bản rút gọn (không có phần tài khoản) như trước; chỉ menu của người nhận ẩn mục này cho tới khi nhận vai.
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover-kit`, { as: "a006" })).body.accounts, undefined);
  assert.equal((await srv.call("GET", C, { as: "a006" })).status, 200);
  // Xác nhận xong có vai thủ quỹ: kho bàn giao đầy đủ.
  await step("a006", id, { action: "accept" });
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover-kit`, { as: "a006" })).body.accounts !== undefined, true);
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as: "a006" })).status, 403); // thủ quỹ cũng không xem bàn giao cả ban
});

test("bước 3: lời dặn và danh sách người giao đang giữ được chụp lại cho người nhận, kể cả sau khi tài khoản đã chuyển", async () => {
  const id = (await create("a002", { role: "treasurer", toId: "a006", reason: "Sắp tốt nghiệp" })).body.items[0].id as string;
  const dto = (await decide("a001", id, { approve: true })).body.items[0];
  assert.deepEqual(dto.holding.accounts.map((a: { id: string }) => a.id), ["kit-ngan-hang"]); // thủ quỹ chỉ giữ tài khoản ngân hàng
  assert.equal(dto.note, undefined);
  await step("a002", id, { action: "lockBalance" });
  const r = await step("a002", id, { action: "reviewKit", note: "  Báo cáo quỹ nộp trước ngày 15.  " });
  assert.equal(r.body.items[0].note, "Báo cáo quỹ nộp trước ngày 15.");
  assert.deepEqual(r.body.items[0].snapshot.accounts.map((a: { id: string }) => a.id), ["kit-ngan-hang"]);
  await step("a002", id, { action: "setReceiver", bank: "[Ngân hàng thử]", account: "0123456789" });
  await step("a002", id, { action: "transferAccount", accountId: "kit-ngan-hang" });
  await step("a002", id, { action: "finishTransfer" });
  // Người nhận (thành viên thường) vẫn thấy danh sách đã chụp dù tài khoản đã chuyển khỏi người giao.
  const mine = (await list("a006")).items[0] as unknown as { note: string; snapshot: { accounts: { id: string }[] }; holding: { accounts: unknown[] } };
  assert.equal(mine.note, "Báo cáo quỹ nộp trước ngày 15.");
  assert.equal(mine.snapshot.accounts.length, 1);
  assert.equal(mine.holding.accounts.length, 0);
  // Lời dặn không công khai: người khác trong ban điều hành (kể cả chủ nhiệm) và cán bộ trường không nhận.
  for (const as of ["a001", "a003", "a005", "p-thu-trang"]) {
    const other = (await list(as)).items.find((x) => x.id === id) as unknown as { note?: string; snapshot?: unknown } | undefined;
    if (other) { assert.equal(other.note, undefined, as); assert.equal(other.snapshot, undefined, as); }
  }
  assert.equal(((await list("a002")).items.find((x) => x.id === id) as unknown as { note: string }).note, "Báo cáo quỹ nộp trước ngày 15."); // người giao vẫn thấy
  // Lời dặn quá dài bị chặn.
  const id2 = (await create("a005", { role: "head", department: "Hậu cần", toId: "a006", reason: "x" })).body.items[0].id as string;
  await decide("a001", id2, { approve: true });
  assert.equal((await step("a005", id2, { action: "reviewKit", note: "x".repeat(1001) })).status, 400);
});

test("chủ nhiệm mới chỉ có quyền đúng ở bước 6; xong bàn giao rồi bàn giao vai chủ nhiệm tiếp thì không giữ quyền cũ", async () => {
  useMidHandover(srv);
  srv.store.update((st) => ({ ...st, handovers: st.handovers.map((h) => ({ ...h, step: 6 })) }));
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a017" })).body.counts.roleHandovers, 1); // việc xác nhận hiện ở nhãn đếm
  assert.equal((await srv.call("POST", `/clubs/${CLUB}/handover/accept`, { as: "a017" })).status, 200);
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a017" })).body.me.role, "president"); // bước 7: đã là chủ nhiệm thật
  // Chủ nhiệm mới bàn giao vai chủ nhiệm cho người khác và về thành viên thường.
  const sent = await create("a017", { role: "president", toId: "a004", reason: "Hết nhiệm kỳ" });
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const id = sent.body.items[0].id as string;
  await step("a017", id, { action: "reviewKit" });
  for (const a of (await srv.call("GET", C, { as: "a017" })).body.items[0].holding.accounts as { id: string }[]) await step("a017", id, { action: "transferAccount", accountId: a.id });
  await step("a017", id, { action: "finishTransfer" });
  assert.equal((await step("a004", id, { action: "accept" })).status, 200);
  // a017 giờ là thành viên thường: bản ghi bàn giao cả ban ở bước 7 không cho họ giữ quyền ban điều hành hay xem bàn giao cả ban.
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/handover`, { as: "a017" })).status, 403);
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/dashboard`, { as: "a017" })).status, 403);
  const board = await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a017" }); // vẫn vào được khung vì là người giao đã xong (xem biên bản của mình)
  assert.equal(board.body.canViewHandover, false);
});

test("kịch bản bàn giao hộ có sẵn trong dữ liệu mẫu: hết 3 ngày chờ, chủ nhiệm làm thay, Võ Ngọc Lan nhận vai trưởng ban Truyền thông", async () => {
  srv.store.update(() => createSeed()); // test thường bỏ kịch bản này; ở đây nạp lại đúng dữ liệu mẫu
  const board = await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a001" });
  assert.equal(board.body.counts.roleHandovers, 1); // chủ nhiệm có việc để làm
  const item = (await list("a001")).items[0] as Item & { department: string; kind: string };
  assert.deepEqual([item.status, item.step, item.kind, item.role, item.department], ["active", 3, "proxy", "head", "Truyền thông"]);
  assert.equal(((await srv.call("GET", `${C}/${item.id}`, { as: "a001" })).status), 404); // không có API lẻ, chỉ danh sách
  // Người giữ vai (Nguyễn Hải Đăng) đã quá hạn bấm "Tôi vẫn đảm nhận".
  assert.equal((await srv.call("POST", `${C}/${item.id}/keep`, { as: "a007" })).status, 409);
  // Ngọc Lan (thành viên thường) chỉ thấy đơn của mình, chưa có việc phải làm vì còn đang ở bước 3.
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a006" })).body.counts.roleHandovers, 0);
  assert.equal((await step("a001", item.id, { action: "reviewKit" })).body.items[0].step, 5);
  assert.equal((await step("a001", item.id, { action: "finishTransfer" })).body.items[0].step, 6);
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/board`, { as: "a006" })).body.counts.roleHandovers, 1);
  assert.equal((await step("a006", item.id, { action: "accept" })).status, 200);
  assert.equal(await roleOf("a006", "a001"), "head");
  assert.equal(await roleOf("a007", "a001"), "member"); // Nguyễn Hải Đăng không còn là trưởng ban nào
});
