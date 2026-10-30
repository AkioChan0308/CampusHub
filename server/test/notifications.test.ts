// Chạy: npm test. Mục Thông báo (chuông): ai nhận gì khi bàn giao và khi duyệt tin, đọc, đánh dấu đã đọc, chỉ thấy của mình.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const H = `/clubs/${CLUB}/handover`;
const list = async (as: string) => (await srv.call("GET", "/me/notifications", { as })).body;
const titles = async (as: string) => (await list(as)).items.map((n: { title: string }) => n.title);
const call = (method: "GET" | "POST" | "PUT", path: string, as: string, body?: unknown) => srv.call(method, `${H}${path}`, { as, body });

/** Đưa bàn giao mẫu (đang ở bước 4) tới bước 6. */
async function toStep6() {
  await call("PUT", "/receiver", "a001", { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" });
  const required = (await call("GET", "", "a001")).body.accounts.filter((a: { required: boolean }) => a.required);
  for (const a of required) await call("POST", `/accounts/${a.id}/transfer`, "a001", { holderId: "a017" });
  await call("POST", "/transfer-done", "a001");
}

test("dữ liệu mẫu: chưa ai có thông báo", async () => {
  for (const id of ["a001", "a017", "p-thu-trang"]) assert.deepEqual(await list(id), { items: [], unread: 0 });
});

test("bàn giao tới bước 6: chỉ chủ nhiệm mới có thông báo cần xác nhận, chưa đọc", async () => {
  await toStep6();
  const mine = await list("a017");
  assert.equal(mine.unread, 1);
  assert.equal(mine.items[0].kind, "handover-accept");
  assert.equal(mine.items[0].read, false);
  assert.equal(mine.items[0].href, `/clubs/${CLUB}/handover`);
  assert.match(mine.items[0].body, /Phạm Quốc Bảo đã chuyển bàn giao CLB Cầu lông Sân Nhà/);
  assert.deepEqual(await list("a001"), { items: [], unread: 0 });
});

test("ban mới xác nhận: ban cũ vẫn thấy 'Bàn giao xong' dù đã mất quyền; ban mới có vai mới; trường được báo", async () => {
  await toStep6();
  assert.equal((await call("POST", "/accept", "a017")).status, 200);
  // Chủ nhiệm cũ đã về thành viên nhưng vẫn đọc được thông báo của mình.
  const old = await list("a001");
  assert.equal(old.unread, 1);
  assert.equal(old.items[0].title, "Bàn giao xong");
  assert.match(old.items[0].body, /Nguyễn Minh Anh đã xác nhận nhận bàn giao CLB Cầu lông Sân Nhà\. Bạn đã chuyển thành thành viên/);
  // Một người ban cũ khác (thủ quỹ a002) cũng được báo.
  assert.equal((await titles("a002"))[0], "Bàn giao xong");
  // Chủ nhiệm mới: thông báo cũ coi như đã đọc, thêm thông báo vai mới.
  const neo = await list("a017");
  assert.deepEqual(neo.items.map((n: { title: string; read: boolean }) => [n.title, n.read]), [["Bàn giao xong: bạn có vai mới", false], ["Cần bạn xác nhận nhận bàn giao", true]]);
  assert.match(neo.items[0].body, /vai chủ nhiệm/);
  // Cán bộ trường: chờ mentor xác nhận.
  assert.equal((await titles("p-thu-trang"))[0], "Bàn giao chờ mentor xác nhận");
});

test("mentor xác nhận biên bản: người nhận bàn giao được báo", async () => {
  await toStep6();
  await call("POST", "/accept", "a017");
  const school = (await srv.call("POST", `/school/clubs/${CLUB}/handover/confirm`, { as: "p-thu-trang" }));
  assert.equal(school.status, 200);
  assert.equal((await titles("a017"))[0], "Mentor đã xác nhận biên bản");
});

test("đăng tin, duyệt, từ chối, gửi lại: trường và người đăng nhận đúng thông báo", async () => {
  const post = (await srv.call("POST", `/clubs/${CLUB}/posts`, { as: "a005", body: { kind: "news", title: "Tin thử", body: "Nội dung thử." } })).body.post;
  assert.equal((await titles("p-thu-trang"))[0], "Tin mới chờ duyệt");
  assert.equal((await srv.call("POST", `/school/posts/${post.id}/review`, { as: "p-thu-trang", body: { decision: "reject", reason: "Thiếu địa điểm." } })).status, 200);
  const rejected = (await list("a005")).items[0];
  assert.equal(rejected.title, "Tin của bạn bị từ chối");
  assert.match(rejected.body, /Thiếu địa điểm\./);
  assert.equal((await srv.call("PUT", `/clubs/${CLUB}/posts/${post.id}`, { as: "a005", body: { kind: "news", title: "Tin thử", body: "Đã sửa." } })).status, 200);
  assert.equal((await titles("p-thu-trang"))[0], "Tin gửi lại chờ duyệt");
  assert.equal((await srv.call("POST", `/school/posts/${post.id}/review`, { as: "p-thu-trang", body: { decision: "approve" } })).status, 200);
  assert.equal((await titles("a005"))[0], "Tin của bạn đã được duyệt");
});

test("đánh dấu đã đọc: theo id hoặc tất cả, chỉ đụng thông báo của mình", async () => {
  await toStep6();
  await call("POST", "/accept", "a017");
  const neoIds = (await list("a017")).items.map((n: { id: string }) => n.id);
  // Người khác không đánh dấu hộ được, kể cả khi biết id.
  const other = await srv.call("POST", "/me/notifications/read", { as: "a001", body: { ids: neoIds } });
  assert.equal(other.status, 200);
  assert.equal(other.body.unread, 1); // a001 vẫn còn thông báo "Bàn giao xong" chưa đọc
  assert.equal((await list("a017")).items.filter((n: { read: boolean }) => !n.read).length, 1);
  // Theo id.
  const unread = (await list("a017")).items.find((n: { read: boolean }) => !n.read);
  const one = await srv.call("POST", "/me/notifications/read", { as: "a017", body: { ids: [unread.id] } });
  assert.equal(one.body.unread, 0);
  // Tất cả (không gửi ids).
  const all = await srv.call("POST", "/me/notifications/read", { as: "a001" });
  assert.equal(all.body.unread, 0);
  assert.ok(all.body.items.every((n: { read: boolean }) => n.read));
});

test("phải đăng nhập mới xem được thông báo", async () => {
  assert.equal((await srv.call("GET", "/me/notifications")).status, 401);
  assert.equal((await srv.call("POST", "/me/notifications/read")).status, 401);
});
