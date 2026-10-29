// Chạy: npm test. Bàn giao 7 bước (ai làm được bước nào, đi hết các bước, biên bản) và việc cần làm.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}`;
const H = `${C}/handover`;
const get = async (as: string) => (await srv.call("GET", H, { as })).body;

test("dữ liệu mẫu: bàn giao ở bước 4, đã có ban mới, số dư chốt, kho và việc còn dở", async () => {
  const h = await get("a001");
  assert.equal(h.step, 4);
  assert.equal(h.newBoard.president.name, "Nguyễn Minh Anh");
  assert.deepEqual(h.newBoard.heads.map((p: { personId: string }) => p.personId), ["a005", "a008"]);
  assert.equal(h.lockedBalance, 3_120_000);
  assert.deepEqual(h.kit, { documents: 5, processes: 3, accounts: 5, missing: 1, personal: 3 });
  assert.equal(h.open.openTasks, 5);
  assert.equal(h.open.pendingExpenses, 2);
  assert.equal(h.currentPresident.personId, "a001");
  assert.equal(h.history.length, 3);
  assert.equal(h.canAccept, false);
  assert.equal(h.accounts.length, 5);
});

test("chủ nhiệm mới (đang là thành viên thường) xem được bàn giao và khung của nó, nhưng không vào được trang ban điều hành khác", async () => {
  assert.equal((await srv.call("GET", `${C}/board`, { as: "a017" })).status, 200);
  const h = await get("a017");
  assert.equal(h.canAccept, true);
  for (const path of ["/dashboard", "/members", "/ledger", "/expenses", "/tasks"]) assert.equal((await srv.call("GET", `${C}${path}`, { as: "a017" })).status, 403, path);
  // Người khác trong ban mới (a006 là thành viên thường) chưa phải chủ nhiệm mới nên không xem được.
  assert.equal((await srv.call("GET", H, { as: "a006" })).status, 403);
});

test("mỗi bước chỉ làm được khi đang ở đúng bước, và chỉ chủ nhiệm hiện tại làm được", async () => {
  assert.equal((await srv.call("POST", `${H}/lock-balance`, { as: "a001" })).status, 409); // đang bước 4
  assert.equal((await srv.call("POST", `${H}/kit-review`, { as: "a001" })).status, 409);
  assert.equal((await srv.call("POST", `${H}/transfer-done`, { as: "a001" })).status, 409);
  assert.equal((await srv.call("POST", `${H}/accept`, { as: "a017" })).status, 409);
  await srv.call("PUT", `${H}/step`, { as: "a001", body: { step: 2 } });
  assert.equal((await srv.call("POST", `${H}/lock-balance`, { as: "a002" })).status, 403); // thủ quỹ không được
  assert.equal((await srv.call("POST", `${H}/lock-balance`, { as: "a017" })).status, 403); // chủ nhiệm mới chưa có quyền làm bước của chủ nhiệm cũ
  assert.equal((await srv.call("POST", `${H}/lock-balance`, { as: "a001" })).body.step, 3);
});

test("đi hết 7 bước, biên bản ghi từng bước, ban mới xác nhận xong thì biên bản khóa", async () => {
  const call = (method: string, path: string, as: string, body?: unknown) => srv.call(method, `${H}${path}`, { as, body });
  assert.equal((await call("PUT", "/step", "a001", { step: 1 })).body.step, 1);

  // Bước 1: ban mới.
  const board = { presidentId: "a017", viceId: "a003", treasurerId: "a006", headIds: ["a005", "a008"] };
  assert.equal((await call("PUT", "/board", "a001", { ...board, headIds: ["a003"] })).status, 400); // a003 giữ hai vai
  assert.equal((await call("PUT", "/board", "a001", { ...board, presidentId: "a022" })).status, 400); // a022 chưa nhận lời mời
  assert.equal((await call("PUT", "/board", "a001", { ...board, presidentId: "a001" })).status, 400); // chọn lại chính mình mà không xác nhận
  assert.equal((await call("PUT", "/board", "a001", { ...board, presidentId: "a001", confirmSelf: true, viceId: "a003" })).status, 200);
  assert.equal((await call("PUT", "/step", "a001", { step: 1 })).body.step, 1);
  assert.equal((await call("PUT", "/board", "a001", board)).body.step, 2);

  // Bước 2: chốt số dư, sổ quỹ không đổi.
  const ledgerBefore = (await srv.call("GET", `${C}/ledger`, { as: "a001" })).body.entries.length;
  const locked = (await call("POST", "/lock-balance", "a001")).body;
  assert.equal(locked.step, 3);
  assert.equal(locked.lockedBalance, 3_120_000);
  assert.ok(locked.lockedAt);
  assert.equal((await srv.call("GET", `${C}/ledger`, { as: "a001" })).body.entries.length, ledgerBefore);

  // Bước 3: kho còn thiếu vẫn đi tiếp được; biên bản ghi số mục thiếu.
  const reviewed = (await call("POST", "/kit-review", "a001")).body;
  assert.equal(reviewed.step, 4);
  assert.match(reviewed.history.at(-1).text, /1 mục thiếu/);

  // Bước 4: tài khoản nhận quỹ.
  assert.equal((await call("PUT", "/receiver", "a001", { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" })).body.step, 5);

  // Bước 5: chuyển quyền quản trị; còn tài khoản bắt buộc thì chưa qua được.
  assert.equal((await call("POST", "/transfer-done", "a001")).status, 409);
  const required = (await get("a001")).accounts.filter((a: { required: boolean }) => a.required);
  assert.equal(required.length, 4);
  assert.equal((await call("POST", `/accounts/${required[0].id}/transfer`, "a001", { holderId: "a022" })).status, 400); // người nhận chưa nhận lời mời
  for (const a of required) assert.equal((await call("POST", `/accounts/${a.id}/transfer`, "a001", { holderId: "a017" })).status, 200);
  const kit = (await srv.call("GET", `${C}/handover-kit`, { as: "a001" })).body;
  assert.ok(kit.accounts.filter((a: { required: boolean }) => a.required).every((a: { holder: { personId: string } }) => a.holder.personId === "a017"));
  assert.equal(kit.summary.missing, 0); // chuyển xong thì Email không còn thiếu người giữ
  assert.equal((await call("POST", "/transfer-done", "a001")).body.step, 6);

  // Bước 6: chỉ chủ nhiệm mới bấm được.
  assert.equal((await call("POST", "/accept", "a001")).status, 403);
  assert.equal((await call("POST", "/accept", "a002")).status, 403);
  const done = (await call("POST", "/accept", "a017")).body;
  assert.equal(done.step, 7);
  assert.equal(done.acceptedBy.personId, "a017");
  assert.ok(done.acceptedAt);
  assert.match(done.history.at(-2).text, /xác nhận đã nhận bàn giao/);
  assert.match(done.history.at(-1).text, /đổi vai trò theo ban mới: 2 người nhận vai trong ban điều hành, 3 người ban cũ về thành viên/);

  // Đổi vai theo ban mới: chủ nhiệm, thủ quỹ cũ và trưởng ban không có tên trong ban mới về thành viên; ai đã giữ đúng vai thì giữ.
  const role = (id: string) => srv.store.state.memberships.find((m) => m.clubId === CLUB && m.personId === id)?.role;
  assert.deepEqual(["a017", "a003", "a006", "a005", "a008", "a001", "a002", "a007"].map(role), ["president", "vice", "treasurer", "head", "head", "member", "member", "member"]);

  // Bước 7: biên bản không sửa được; ban cũ đã về thành viên nên không còn quyền bàn giao.
  assert.equal((await call("PUT", "/step", "a001", { step: 5 })).status, 403);
  assert.equal((await call("PUT", "/step", "a017", { step: 5 })).status, 409);
  assert.equal((await call("POST", "/accept", "a017")).status, 409);
  assert.ok(done.history.length >= 10);
});

test("việc cần làm: ban điều hành thấy đủ, tạo và giao lại; ai được đổi trạng thái", async () => {
  const T = `${C}/tasks`;
  const list = (await srv.call("GET", T, { as: "a003" })).body;
  assert.equal(list.tasks.length, 6);
  assert.deepEqual(list.tasks.slice(0, 2).map((t: { id: string }) => t.id), ["viec-danh-sach-giai", "viec-bao-cao"]); // hạn gần nhất trước
  assert.ok(list.assignees.length > 30 && list.events.length >= 6 && list.processes.length === 3);

  const body = { title: "Gửi thư mời giải nội bộ", assigneeId: "a007", due: "2026-10-28T23:59:00+07:00", eventId: "giai-noi-bo", processId: "kit-xin-phep-su-kien" };
  assert.equal((await srv.call("POST", T, { as: "a017", body })).status, 403); // thành viên thường không tạo việc
  assert.equal((await srv.call("POST", T, { as: "a001", body: { ...body, assigneeId: "a022" } })).status, 400); // chưa nhận lời mời
  assert.equal((await srv.call("POST", T, { as: "a001", body: { ...body, eventId: "khong-co" } })).status, 400);
  const made = await srv.call("POST", T, { as: "a001", body });
  assert.equal(made.status, 201);
  const id = made.body.task.id;
  assert.equal(made.body.task.status, "todo");
  assert.equal(made.body.task.event.title, "Giải nội bộ Fall 2026");
  assert.equal(made.body.task.process.name, "Xin phép tổ chức sự kiện");

  const re = await srv.call("PUT", `${T}/${id}`, { as: "a001", body: { ...body, assigneeId: "a005" } });
  assert.equal(re.body.task.assignee.personId, "a005");
  assert.match(re.body.task.history.at(-1).text, /giao lại cho Trần Gia Huy/);

  // Người được giao đổi được trạng thái việc của mình; người khác thì không.
  assert.equal((await srv.call("POST", `${T}/${id}/status`, { as: "a018", body: { status: "doing" } })).status, 403);
  const doing = await srv.call("POST", `${T}/${id}/status`, { as: "a005", body: { status: "doing" } });
  assert.equal(doing.body.task.status, "doing");
  assert.equal((await srv.call("POST", `${T}/${id}/status`, { as: "a005", body: { status: "xong" } })).status, 400);
  assert.equal((await srv.call("POST", `${T}/${id}/status`, { as: "a002", body: { status: "done" } })).body.task.status, "done"); // thủ quỹ là ban điều hành
  const history = (await srv.call("GET", T, { as: "a001" })).body.tasks.find((t: { id: string }) => t.id === id).history;
  assert.deepEqual(history.map((h: { by: { personId: string } }) => h.by.personId), ["a001", "a001", "a005", "a002"]);
});

test("việc của tôi: chỉ việc được giao cho mình", async () => {
  const mine = (await srv.call("GET", "/me/tasks", { as: "a017" })).body.tasks;
  assert.deepEqual(mine.map((t: { id: string }) => t.id), ["viec-mua-nuoc"]);
  assert.equal(mine[0].club.id, CLUB);
  assert.equal((await srv.call("GET", "/me/tasks", { as: "a018" })).body.tasks.length, 0);
  // Cán bộ trường không ở CLB nào thì không có việc.
  assert.equal((await srv.call("GET", "/me/tasks", { as: "p-thu-trang" })).body.tasks.length, 0);
  // Thành viên tự đánh dấu xong việc của mình.
  const r = await srv.call("POST", `${C}/tasks/viec-mua-nuoc/status`, { as: "a017", body: { status: "done" } });
  assert.equal(r.body.task.status, "done");
});
