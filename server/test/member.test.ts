// Chạy: npm test. Thành viên và sinh viên: Của tôi, đóng quỹ, quyền với dữ liệu cá nhân, tìm CLB, gửi đơn, nhận lời mời.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, COL, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

test("GET /me: người chưa nhận lời mời thấy mã mời của chính mình", async () => {
  const nam = (await srv.call("GET", "/me", { as: "a022" })).body;
  assert.equal(nam.person.name, "Lý Hoàng Nam");
  assert.deepEqual([nam.memberships[0].invite, nam.memberships[0].inviteCode], ["pending", "moi-a022"]);
  const minhAnh = (await srv.call("GET", "/me", { as: "a017" })).body.memberships[0];
  assert.equal(minhAnh.invite, "accepted");
  assert.equal(minhAnh.inviteCode, undefined);
});

test("Của tôi: điểm danh 3/4, quỹ đang báo đã chuyển, các mục đã đồng ý", async () => {
  const r = (await srv.call("GET", `/me/clubs/${CLUB}`, { as: "a017" })).body;
  assert.deepEqual(r.attendance, { attended: 3, held: 4 });
  assert.equal(r.collection.payment.status, "reported");
  assert.deepEqual(r.consents.map((c: { purpose: string }) => c.purpose).sort(), ["age16", "membership", "phone"]);
  assert.equal((await srv.call("GET", `/me/clubs/${CLUB}`, { as: "a022" })).body.error.code, "INVITE_PENDING");
  assert.equal((await srv.call("GET", `/me/clubs/${CLUB}`, { as: "p-bao-chau" })).body.error.code, "NOT_MEMBER");
});

test("lịch sử điểm danh: 4 buổi đã mở, của mình mới nhất trước", async () => {
  const r = (await srv.call("GET", `/me/clubs/${CLUB}/attendance`, { as: "a017" })).body;
  assert.equal(r.held.length, 4);
  assert.equal(r.mine.length, 3);
  assert.ok(r.mine[0].at > r.mine[1].at);
});

test("rút đồng ý lưu số điện thoại; rút lần hai báo không còn gì để rút", async () => {
  const r = await srv.call("POST", `/me/clubs/${CLUB}/consents/phone/withdraw`, { as: "a017" });
  assert.equal(r.status, 200);
  assert.equal(r.body.consents.find((c: { purpose: string }) => c.purpose === "phone").withdrawnAt, "2026-10-03T07:40:00+07:00");
  assert.equal((await srv.call("POST", `/me/clubs/${CLUB}/consents/phone/withdraw`, { as: "a017" })).status, 409);
});

test("yêu cầu xóa dữ liệu: gửi lại thì giữ ngày gửi đầu tiên", async () => {
  const first = (await srv.call("POST", `/me/clubs/${CLUB}/deletion-request`, { as: "a017" })).body;
  assert.equal(first.membership.deletionRequestedAt, "2026-10-03T07:40:00+07:00");
  const again = (await srv.call("POST", `/me/clubs/${CLUB}/deletion-request`, { as: "a017" })).body;
  assert.equal(again.membership.deletionRequestedAt, first.membership.deletionRequestedAt);
  const members = (await srv.call("GET", `/clubs/${CLUB}/members`, { as: "a001" })).body.members;
  assert.ok(members.find((m: { personId: string }) => m.personId === "a017").deletionRequestedAt);
});

test("đóng quỹ: nội dung chuyển khoản theo mã thành viên; mã QR là chuỗi giả; báo đã chuyển", async () => {
  const r = (await srv.call("GET", `/me/collections/${COL}`, { as: "a021" })).body;
  assert.equal(r.transfer.content, "QFALL26 A021");
  assert.equal(r.transfer.amountDue, 100_000);
  assert.equal(r.transfer.receiver.name, "Lê Thu Hà");
  assert.equal(r.transfer.qrIsDemo, true);
  assert.match(r.transfer.qrPayload, /^CAMPUSHUB-DEMO\|KHONG-PHAI-MA-CHUYEN-KHOAN\|/);
  const reported = (await srv.call("POST", `/me/collections/${COL}/report-transfer`, { as: "a021" })).body;
  assert.equal(reported.payment.status, "reported");
  assert.equal(reported.payment.reportedAt, "2026-10-03T07:40:00+07:00");
  assert.equal((await srv.call("POST", `/me/collections/${COL}/report-transfer`, { as: "a021" })).body.payment.status, "reported");
  assert.equal((await srv.call("POST", `/me/collections/${COL}/report-transfer`, { as: "a001" })).status, 409); // đã đóng rồi
});

test("tìm CLB: 6 CLB và quan hệ của mình với từng CLB", async () => {
  const list = (await srv.call("GET", "/clubs", { as: "p-bao-chau" })).body;
  assert.equal(list.term, "Fall 2026");
  const clubs = list.clubs;
  assert.equal(clubs.length, 6);
  const byId = Object.fromEntries(clubs.map((c: { id: string }) => [c.id, c]));
  assert.equal(byId["vong-lap"].my.status, "applied");
  assert.equal(byId[CLUB].my.status, "none");
  assert.equal(byId[CLUB].members, 42);
  assert.equal(byId["gieo-mam"].acceptingApplications, false);
  assert.equal((await srv.call("GET", `/clubs/${CLUB}`, { as: "a022" })).body.club.my.status, "invited");
});

test("gửi đơn: phải đồng ý cho xem thông tin; không gửi trùng; CLB tạm ngưng thì không nhận", async () => {
  const path = `/clubs/${CLUB}/applications`;
  const noConsent = await srv.call("POST", path, { as: "p-bao-chau", body: { year: 1, consent: false } });
  assert.equal(noConsent.status, 400);
  assert.equal(noConsent.body.error.message, "Cần đồng ý cho ban điều hành xem thông tin thì mới gửi được đơn.");
  const ok = await srv.call("POST", path, { as: "p-bao-chau", body: { year: 1, consent: true, reason: "Muốn chơi cầu lông mỗi tuần" } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.application.status, "pending");
  assert.equal((await srv.call("POST", path, { as: "p-bao-chau", body: { year: 1, consent: true } })).status, 409);
  assert.equal((await srv.call("POST", "/clubs/gieo-mam/applications", { as: "p-bao-chau", body: { year: 1, consent: true } })).body.error.message, "CLB đang tạm ngưng nhận đơn.");
  assert.equal((await srv.call("POST", path, { as: "a017", body: { year: 2, consent: true } })).body.error.message, "Bạn đã ở CLB này rồi.");
  assert.equal((await srv.call("GET", `/clubs/${CLUB}/applications`, { as: "a001" })).body.applications.length, 4);
});

test("nhận lời mời: chỉ đúng người được mời; phải chọn 2 ô bắt buộc; nhận xong link hết hiệu lực", async () => {
  assert.equal((await srv.call("GET", "/invites/moi-a022", { as: "a017" })).status, 403);
  const invite = (await srv.call("GET", "/invites/moi-a022", { as: "a022" })).body;
  assert.equal(invite.club.name, "CLB Cầu lông Sân Nhà");
  assert.deepEqual([invite.invitedBy.name, invite.invitedBy.role], ["Phạm Quốc Bảo", "president"]);
  const noAge = await srv.call("POST", "/invites/moi-a022/accept", { as: "a022", body: { membership: true, age16: false, phone: false } });
  assert.equal(noAge.status, 400);
  assert.equal(noAge.body.error.message, "Cần xác nhận đã đủ 16 tuổi.");
  const ok = await srv.call("POST", "/invites/moi-a022/accept", { as: "a022", body: { membership: true, age16: true, phone: true } });
  assert.equal(ok.body.membership.invite, "accepted");
  assert.equal((await srv.call("GET", "/invites/moi-a022", { as: "a022" })).status, 404);
  const mine = (await srv.call("GET", `/me/clubs/${CLUB}`, { as: "a022" })).body;
  assert.deepEqual(mine.consents.map((c: { purpose: string }) => c.purpose).sort(), ["age16", "membership", "phone"]);
});

test("tải dữ liệu của tôi: đủ điểm danh, đóng quỹ, đồng ý", async () => {
  const r = (await srv.call("GET", "/me/export", { as: "a017" })).body;
  assert.equal(r.person.id, "a017");
  assert.equal(r.attendance.length, 3);
  assert.equal(r.payments.length, 1);
  assert.equal(r.consents.length, 3);
  assert.equal(r.exportedAt, "2026-10-03T07:40:00+07:00");
});

test("đơn bị từ chối thì gửi đơn mới được (luật chốt ngày 03/10/2026)", async () => {
  const path = `/clubs/${CLUB}/applications`;
  const first = await srv.call("POST", path, { as: "p-bao-chau", body: { year: 1, consent: true } });
  assert.equal(first.status, 201);
  await srv.call("POST", `${path}/${first.body.application.id}/reject`, { as: "a001" });
  const again = await srv.call("POST", path, { as: "p-bao-chau", body: { year: 1, reason: "Mình đã tập thêm.", consent: true } });
  assert.equal(again.status, 201);
  assert.equal(again.body.application.status, "pending");
});
