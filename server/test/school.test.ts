// Chạy: npm test. Phía nhà trường: chỉ số tổng hợp, mentor duyệt khoản lớn.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

test("các CLB: 6 CLB, 5 có hoạt động trong 30 ngày, 4 đã nộp dự trù, 1 khoản chờ mentor", async () => {
  const r = (await srv.call("GET", "/school/clubs", { as: "p-thu-trang" })).body;
  assert.equal(r.clubs.length, 6);
  assert.equal(r.clubs.filter((c: { activeIn30Days: boolean }) => c.activeIn30Days).length, 5);
  assert.equal(r.clubs.filter((c: { budgetSubmitted: boolean }) => c.budgetSubmitted).length, 4);
  assert.equal(r.waitingMentor, 1);
  assert.equal(r.term, "Fall 2026");
  // Khoản chờ mentor nằm ở CLB nào: menu "Khoản chờ duyệt" mở thẳng CLB đó.
  assert.deepEqual(r.clubs.filter((c: { waitingMentor: number }) => c.waitingMentor > 0).map((c: { id: string }) => c.id), [CLUB]);
});

test("sinh viên, kể cả chủ nhiệm CLB, không vào được trang nhà trường", async () => {
  assert.equal((await srv.call("GET", "/school/clubs", { as: "a001" })).status, 403);
  assert.equal((await srv.call("POST", "/school/expenses/chi-3/approve", { as: "a001" })).status, 403);
});

test("chi tiết một CLB: số tổng hợp theo hoạt động, không lộ danh sách thành viên", async () => {
  const r = (await srv.call("GET", `/school/clubs/${CLUB}`, { as: "p-thu-trang" })).body;
  assert.deepEqual(r.detail.budget.totals, { planned: 6_050_000, spent: 800_000 });
  assert.equal(r.detail.sessions.count, 4);
  assert.equal(r.detail.waitingMentor[0].boardApproval.by.name, "Phạm Quốc Bảo");
  assert.equal(r.club.president.name, "Phạm Quốc Bảo");
  const text = JSON.stringify(r);
  for (const memberName of ["Nguyễn Minh Anh", "Đỗ Bảo Ngọc", "Lê Thu Hà"]) assert.ok(!text.includes(memberName), memberName);
});

test("CLB mà bản demo chỉ có số tổng hợp thì không có phần chi tiết", async () => {
  const r = (await srv.call("GET", "/school/clubs/vong-lap", { as: "p-thu-trang" })).body;
  assert.equal(r.club.detailed, false);
  assert.equal(r.detail, undefined);
});

test("mentor không tự duyệt, không tự từ chối khoản do chính mình đề xuất", async () => {
  srv.store.update((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === "chi-3" ? { ...e, requesterId: "p-thu-trang" } : e)) }));
  const r = await srv.call("POST", "/school/expenses/chi-3/approve", { as: "p-thu-trang" });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, "SELF_APPROVAL");
  assert.equal((await srv.call("POST", "/school/expenses/chi-3/reject", { as: "p-thu-trang", body: { note: "Tự rút" } })).status, 403);
  assert.equal(srv.store.state.expenses.find((e) => e.id === "chi-3")?.status, "mentor");
});

test("mentor từ chối phải ghi lý do; khoản không chờ mentor thì không duyệt được", async () => {
  assert.equal((await srv.call("POST", "/school/expenses/chi-3/reject", { as: "p-thu-trang", body: {} })).status, 400);
  const r = await srv.call("POST", "/school/expenses/chi-3/reject", { as: "p-thu-trang", body: { note: "Cần báo giá của hai sân để so" } });
  assert.equal(r.body.expense.status, "rejected");
  assert.equal((await srv.call("POST", "/school/expenses/chi-1/approve", { as: "p-thu-trang" })).status, 409);
});

test("mentor xác nhận biên bản bàn giao: chỉ cán bộ trường, chỉ sau khi ban mới xác nhận, chỉ một lần", async () => {
  const confirm = (as: string) => srv.call("POST", `/school/clubs/${CLUB}/handover/confirm`, { as });
  assert.equal((await confirm("a001")).status, 403, "ban điều hành không xác nhận hộ mentor");
  assert.equal((await srv.call("POST", `/school/clubs/${CLUB}/handover/confirm`, {})).status, 401, "chưa đăng nhập");
  assert.equal((await confirm("p-thu-trang")).status, 409, "ban mới chưa xác nhận nhận bàn giao");
  const before = (await srv.call("GET", `/school/clubs/${CLUB}`, { as: "p-thu-trang" })).body.detail.handover;
  assert.deepEqual([before.accepted, before.mentorConfirmed], [false, undefined]);

  // Đi tới cuối: bước 4 và 5 qua API của ban điều hành, rồi chủ nhiệm mới xác nhận.
  const H = `/clubs/${CLUB}/handover`;
  await srv.call("PUT", `${H}/receiver`, { as: "a001", body: { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" } });
  for (const a of ["kit-fanpage", "kit-drive", "kit-email", "kit-ngan-hang"]) await srv.call("POST", `${H}/accounts/${a}/transfer`, { as: "a001", body: { holderId: "a017" } });
  await srv.call("POST", `${H}/transfer-done`, { as: "a001" });
  await srv.call("POST", `${H}/accept`, { as: "a017" });

  const done = await confirm("p-thu-trang");
  assert.equal(done.status, 200);
  assert.deepEqual([done.body.handover.accepted, done.body.handover.mentorConfirmed.by.personId], [true, "p-thu-trang"]);
  assert.ok(done.body.handover.mentorConfirmed.at);
  assert.equal((await confirm("p-thu-trang")).status, 409, "xác nhận rồi thì không xác nhận lại");
  const record = (await srv.call("GET", H, { as: "a017" })).body;
  assert.equal(record.mentorConfirmed.by.personId, "p-thu-trang");
  assert.match(record.history.at(-1).text, /\(mentor\) xác nhận biên bản bàn giao/);
});
