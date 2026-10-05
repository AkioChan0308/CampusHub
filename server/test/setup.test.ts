// Chạy: npm test. Tạo dữ liệu từ đầu: tạo CLB, thêm thành viên và đổi vai, tạo/sửa/xóa buổi, tạo/sửa đợt thu.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, COL, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}`;
const clubBody = { name: "CLB Bóng bàn Nhanh Tay", field: "Nghệ thuật, thể thao", schedule: "Tối Thứ Năm, 18:00–20:00", location: "Nhà thi đấu", term: "Fall 2026", acceptingApplications: true };

test("tạo CLB: người tạo là chủ nhiệm, trang trường thấy CLB mới; tên trùng thì báo lỗi", async () => {
  const r = await srv.call("POST", "/clubs", { as: "p-bao-chau", body: clubBody });
  assert.equal(r.status, 201);
  assert.equal(r.body.club.id, "clb-bong-ban-nhanh-tay");
  const id = r.body.club.id;
  const board = (await srv.call("GET", `/clubs/${id}/board`, { as: "p-bao-chau" })).body;
  assert.equal(board.me.role, "president");
  assert.equal(board.collectionId, undefined);
  const dash = (await srv.call("GET", `/clubs/${id}/dashboard`, { as: "p-bao-chau" })).body;
  assert.deepEqual(dash.setup, { members: 1, events: 0 });
  assert.equal((await srv.call("GET", `/clubs/${id}/budget`, { as: "p-bao-chau" })).status, 200);
  assert.equal((await srv.call("GET", "/school/clubs", { as: "p-thu-trang" })).body.clubs.length, 7);
  // Tên trùng (khác dấu, hoa thường) thì không tạo.
  assert.equal((await srv.call("POST", "/clubs", { as: "a017", body: { ...clubBody, name: "clb bong ban nhanh tay" } })).status, 409);
  // Học kỳ sai dạng, thiếu tên
  assert.equal((await srv.call("POST", "/clubs", { as: "a017", body: { ...clubBody, name: "CLB khác", term: "kỳ 1" } })).body.error.message, "Học kỳ ghi dạng \"Fall 2026\".");
  assert.equal((await srv.call("POST", "/clubs", { as: "a017", body: { ...clubBody, name: "" } })).status, 400);
  // Mã trùng tên trang của web (/clubs/new) thì đổi sang mã khác.
  assert.equal((await srv.call("POST", "/clubs", { as: "a017", body: { ...clubBody, name: "New" } })).body.club.id, "new-2");
});

test("thêm thành viên: mã mới, chưa nhận lời mời, có link mời và khoản phải đóng; người cũ dùng lại tài khoản", async () => {
  const r = await srv.call("POST", `${C}/members`, { as: "a005", body: { members: [
    { name: "Ngô Thị Mẫu", email: "mau.ngo@example.com", department: "Truyền thông", year: 1 },
    { name: "Tên trong file khác", email: "BAOCHAU.TRINH@example.com" },
  ] } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const [mau, chau] = r.body.added;
  assert.match(mau.code, /^A\d{3}$/);
  assert.notEqual(mau.code, chau.code);
  assert.match(mau.inviteCode, /^moi-/);
  assert.equal(chau.personId, "p-bao-chau"); // cùng email: dùng lại tài khoản, giữ tên cũ
  assert.equal(chau.name, "Trịnh Bảo Châu");
  const members = (await srv.call("GET", `${C}/members`, { as: "a001" })).body.members;
  const row = members.find((m: { personId: string }) => m.personId === mau.personId);
  assert.equal(row.invite, "pending");
  assert.equal(row.inviteCode, mau.inviteCode);
  assert.equal(row.department, "Truyền thông");
  assert.equal(row.payment.status, "unpaid");
  // Người mới nhận lời mời bằng link riêng.
  assert.equal((await srv.call("POST", `/invites/${mau.inviteCode}/accept`, { as: mau.personId, body: { membership: true, age16: true, phone: false } })).status, 200);
  // Đã ở CLB, trùng email trong danh sách, thành viên thường
  const dup = await srv.call("POST", `${C}/members`, { as: "a005", body: { members: [{ name: "Ai đó", email: "mau.ngo@example.com" }] } });
  assert.equal(dup.status, 409);
  assert.deepEqual(dup.body.error.details.emails, ["mau.ngo@example.com"]);
  assert.equal((await srv.call("POST", `${C}/members`, { as: "a005", body: { members: [{ name: "A", email: "x@example.com" }, { name: "B", email: "X@example.com" }] } })).status, 400);
  assert.equal((await srv.call("POST", `${C}/members`, { as: "a005", body: { members: [{ name: "A", email: "khong-phai-email" }] } })).body.error.message, "Email không hợp lệ.");
  assert.equal((await srv.call("POST", `${C}/members`, { as: "a002", body: { members: [{ name: "A", email: "a@example.com" }] } })).status, 403);
});

test("đổi vai trò và ban: chỉ chủ nhiệm; không đổi chủ nhiệm ở đây", async () => {
  const r = await srv.call("PUT", `${C}/members/a017`, { as: "a001", body: { role: "head", department: "Hậu cần" } });
  assert.equal(r.status, 200);
  assert.equal(r.body.member.role, "head");
  assert.equal(r.body.member.department, "Hậu cần");
  assert.equal((await srv.call("PUT", `${C}/members/a017`, { as: "a005", body: { role: "member", department: "Hậu cần" } })).status, 403);
  assert.equal((await srv.call("PUT", `${C}/members/a017`, { as: "a001", body: { role: "president", department: "x" } })).status, 409);
  assert.equal((await srv.call("PUT", `${C}/members/a001`, { as: "a001", body: { role: "member", department: "x" } })).status, 409);
  assert.equal((await srv.call("PUT", `${C}/members/a001`, { as: "a001", body: { role: "president", department: "Ban điều hành" } })).status, 200);
  assert.equal((await srv.call("PUT", `${C}/members/khong-co`, { as: "a001", body: { role: "member", department: "x" } })).status, 404);
});

const event = { title: "Sinh hoạt tuần 6", kind: "session", start: "2026-10-10T07:30:00+07:00", end: "2026-10-10T09:30:00+07:00", location: "Sân A", checkinUntil: "2026-10-10T08:30:00+07:00" };

test("buổi: tạo, sửa, xóa khi chưa mở điểm danh; giờ phải hợp lý", async () => {
  const r = await srv.call("POST", `${C}/events`, { as: "a005", body: event });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body.event.id;
  assert.equal(r.body.event.status, "upcoming");
  const list = (await srv.call("GET", `${C}/events`, { as: "a005" })).body;
  const row = list.events.find((e: { id: string }) => e.id === id);
  assert.equal(row.attended, 0);
  assert.ok(list.memberCount >= 42);
  assert.equal((await srv.call("PUT", `${C}/events/${id}`, { as: "a005", body: { ...event, title: "Sinh hoạt tuần 6 (đổi sân)" } })).body.event.title, "Sinh hoạt tuần 6 (đổi sân)");
  assert.equal((await srv.call("POST", `${C}/events`, { as: "a005", body: { ...event, end: event.start } })).body.error.message, "Giờ kết thúc phải sau giờ bắt đầu.");
  assert.equal((await srv.call("POST", `${C}/events`, { as: "a005", body: { ...event, checkinUntil: "2026-10-10T10:00:00+07:00" } })).status, 400);
  // Buổi đã qua (đồng hồ test: 03/10/2026 07:40) thì không tạo được.
  const past = { ...event, start: "2026-10-01T07:30:00+07:00", end: "2026-10-01T09:30:00+07:00", checkinUntil: "2026-10-01T08:30:00+07:00" };
  assert.equal((await srv.call("POST", `${C}/events`, { as: "a005", body: past })).body.error.message, "Buổi này đã qua. Chọn ngày giờ sau bây giờ.");
  assert.equal((await srv.call("POST", `${C}/events`, { as: "a017", body: event })).status, 403);
  // Đã mở điểm danh: không sửa, không xóa.
  await srv.call("POST", `${C}/events/${id}/open`, { as: "a005" });
  assert.equal((await srv.call("PUT", `${C}/events/${id}`, { as: "a005", body: event })).status, 409);
  assert.equal((await srv.call("DELETE", `${C}/events/${id}`, { as: "a005" })).status, 409);
  const other = (await srv.call("POST", `${C}/events`, { as: "a005", body: event })).body.event.id;
  assert.deepEqual((await srv.call("DELETE", `${C}/events/${other}`, { as: "a005" })).body, { ok: true });
  assert.equal((await srv.call("GET", `${C}/events`, { as: "a005" })).body.events.some((e: { id: string }) => e.id === other), false);
});

const collection = { name: "Quỹ giải nội bộ", amount: 50_000, dueDate: "2026-10-20T23:59:00+07:00", codePrefix: "qgiai26", receiverId: "a002", accountName: "Lê Thu Hà", bank: "[ngân hàng]", account: "0123456789" };

test("đợt thu: tạo, thành đợt đang dùng, mọi thành viên chưa đóng; chỉ lưu 4 số cuối; sửa mức thu khi chưa ai đóng", async () => {
  const r = await srv.call("POST", `${C}/collections`, { as: "a002", body: collection });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const c = r.body.collection;
  assert.equal(c.codePrefix, "QGIAI26");
  assert.equal(c.receiver.name, "Lê Thu Hà");
  assert.equal((await srv.call("GET", `${C}/board`, { as: "a001" })).body.collectionId, c.id);
  const list = (await srv.call("GET", `${C}/collections`, { as: "a001" })).body.collections;
  assert.deepEqual(list.map((x: { id: string }) => x.id), [c.id, COL]);
  assert.equal(list[0].stats.unpaid, list[0].stats.total);
  const pay = (await srv.call("GET", `/me/collections/${c.id}`, { as: "a017" })).body;
  assert.equal(pay.transfer.content, "QGIAI26 A017");
  assert.equal(pay.transfer.accountName, "LE THU HA");
  assert.equal(pay.transfer.last4, "6789");
  assert.ok(!JSON.stringify(pay).includes("0123456789"));
  // Sửa hạn, sửa mức thu khi chưa ai đóng
  assert.equal((await srv.call("PUT", `${C}/collections/${c.id}`, { as: "a002", body: { amount: 60_000, dueDate: "2026-10-25T23:59:00+07:00" } })).body.collection.amount, 60_000);
  await srv.call("POST", `${C}/collections/${c.id}/payments/a017`, { as: "a002", body: { method: "cash" } });
  assert.equal((await srv.call("PUT", `${C}/collections/${c.id}`, { as: "a002", body: { amount: 70_000 } })).status, 409);
  assert.equal((await srv.call("PUT", `${C}/collections/${c.id}`, { as: "a002", body: { dueDate: "2026-10-30T23:59:00+07:00" } })).status, 200);
  // Mã trùng, người nhận chưa nhận lời mời, không có quyền
  assert.equal((await srv.call("POST", `${C}/collections`, { as: "a002", body: { ...collection, codePrefix: "QFALL26" } })).status, 409);
  assert.equal((await srv.call("POST", `${C}/collections`, { as: "a002", body: { ...collection, codePrefix: "QX26", receiverId: "a022" } })).status, 400);
  assert.equal((await srv.call("POST", `${C}/collections`, { as: "a005", body: { ...collection, codePrefix: "QX26" } })).status, 403);
});
