// Chạy: npm test. Tin của CLB trên Cộng đồng: duyệt trước, hiện sau. Ai đăng được, ai thấy gì ở từng trạng thái, cán bộ trường duyệt và từ chối.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}`;
const STAFF = "p-thu-trang";
const draft = { kind: "news", title: "Thông báo mới", body: "Nội dung thông báo." };
const post = (as: string, body: unknown = draft) => srv.call("POST", `${C}/posts`, { as, body });
const feed = async (as: string) => (await srv.call("GET", "/feed", { as })).body.posts as { id: string; status: string; title: string; author?: unknown; rejectReason?: string }[];

test("dữ liệu mẫu: Cộng đồng có tin đã duyệt, và tin chờ duyệt của CLB mẫu chỉ người đăng thấy", async () => {
  const sinhVien = await feed("a017");
  assert.ok(sinhVien.length >= 6);
  assert.ok(sinhVien.every((p) => p.status === "approved"));
  assert.ok(!sinhVien.some((p) => p.id === "doi-gio-sinh-hoat"));
  const nguoiDang = await feed("a001");
  const pending = nguoiDang.find((p) => p.id === "doi-gio-sinh-hoat");
  assert.equal(pending?.status, "pending");
  assert.equal(nguoiDang.filter((p) => p.status === "approved").length, sinhVien.length);
});

test("Cộng đồng chung không nêu tên người đăng", async () => {
  for (const p of await feed("a017")) assert.equal(p.author, undefined, p.id);
  const detail = (await srv.call("GET", "/posts/giai-noi-bo", { as: "a017" })).body.post;
  assert.equal(detail.author, undefined);
  assert.equal(detail.club.id, CLUB);
});

test("đăng tin: chỉ chủ nhiệm, phó chủ nhiệm, trưởng ban; tin luôn chờ duyệt", async () => {
  for (const as of ["a001", "a003", "a005"]) {
    const r = await post(as);
    assert.equal(r.status, 201, as);
    assert.equal(r.body.post.status, "pending", as);
    assert.equal(r.body.post.author.personId, as);
  }
  assert.equal((await post("a002")).status, 403, "thủ quỹ không có quyền đăng tin");
  assert.equal((await post("a017")).status, 403, "thành viên thường");
  assert.equal((await post(STAFF)).status, 403, "cán bộ trường không đăng tin của CLB");
  assert.equal((await srv.call("POST", `${C}/posts`, { body: draft })).status, 401);
});

test("tin chờ duyệt: người đăng thấy, người khác không thấy (kể cả mở thẳng bằng mã); ban điều hành CLB và cán bộ trường xem được", async () => {
  const id = (await post("a005")).body.post.id;
  assert.ok((await feed("a005")).some((p) => p.id === id && p.status === "pending"), "người đăng thấy (hiện mờ)");
  assert.ok(!(await feed("a017")).some((p) => p.id === id), "thành viên thường không thấy");
  assert.ok(!(await feed("a001")).some((p) => p.id === id), "ban điều hành khác chỉ thấy ở Bảng tin của CLB, không thấy ở Cộng đồng chung");
  assert.equal((await srv.call("GET", `/posts/${id}`, { as: "a017" })).status, 404);
  assert.equal((await srv.call("GET", `/posts/${id}`, { as: "p-bao-chau" })).status, 404);
  assert.equal((await srv.call("GET", `/posts/${id}`, { as: "a005" })).status, 200);
  assert.equal((await srv.call("GET", `/posts/${id}`, { as: "a001" })).status, 200, "chủ nhiệm CLB");
  assert.equal((await srv.call("GET", `/posts/${id}`, { as: STAFF })).status, 200, "cán bộ trường");
  const board = (await srv.call("GET", `${C}/posts`, { as: "a001" })).body.posts as { id: string; status: string }[];
  assert.ok(board.some((p) => p.id === id && p.status === "pending"), "Bảng tin của CLB thấy tin chờ");
  assert.equal((await srv.call("GET", `${C}/posts`, { as: "a017" })).status, 403, "thành viên thường không vào Bảng tin của CLB");
});

test("cán bộ trường duyệt: tin hiện cho mọi người, rời hàng chờ, ghi người duyệt", async () => {
  const id = (await post("a005")).body.post.id;
  const queue = (await srv.call("GET", "/school/posts", { as: STAFF })).body;
  assert.ok(queue.pending.some((p: { id: string }) => p.id === id));
  assert.ok(queue.pending.some((p: { id: string }) => p.id === "doi-gio-sinh-hoat"));
  const r = await srv.call("POST", `/school/posts/${id}/review`, { as: STAFF, body: { decision: "approve" } });
  assert.equal(r.status, 200);
  assert.equal(r.body.post.status, "approved");
  assert.equal(r.body.post.reviewedBy.personId, STAFF);
  assert.ok((await feed("a017")).some((p) => p.id === id), "tin đã duyệt hiện cho mọi người");
  const after = (await srv.call("GET", "/school/posts", { as: STAFF })).body;
  assert.ok(!after.pending.some((p: { id: string }) => p.id === id));
  assert.equal(after.reviewed[0].id, id);
  assert.equal((await srv.call("POST", `/school/posts/${id}/review`, { as: STAFF, body: { decision: "approve" } })).status, 409, "đã duyệt rồi thì không duyệt lại");
});

test("từ chối: bắt buộc có lý do; người khác không thấy, người đăng thấy lý do", async () => {
  const id = (await post("a005")).body.post.id;
  const review = (decision: unknown, reason?: string) => srv.call("POST", `/school/posts/${id}/review`, { as: STAFF, body: { decision, ...(reason !== undefined ? { reason } : {}) } });
  assert.equal((await review("reject")).status, 400, "thiếu lý do");
  assert.equal((await review("reject", "   ")).status, 400, "lý do trống");
  assert.equal((await review("maybe")).status, 400);
  const r = await review("reject", "Thiếu thông tin địa điểm.");
  assert.equal(r.status, 200);
  assert.equal(r.body.post.status, "rejected");
  assert.equal(r.body.post.rejectReason, "Thiếu thông tin địa điểm.");
  assert.ok(!(await feed("a017")).some((p) => p.id === id));
  const mine = (await feed("a005")).find((p) => p.id === id);
  assert.equal(mine?.status, "rejected");
  assert.equal(mine?.rejectReason, "Thiếu thông tin địa điểm.");
});

test("chỉ cán bộ trường duyệt; tin không có thì 404", async () => {
  const id = (await post("a005")).body.post.id;
  for (const as of ["a001", "a005", "a017"]) assert.equal((await srv.call("POST", `/school/posts/${id}/review`, { as, body: { decision: "approve" } })).status, 403, as);
  assert.equal((await srv.call("GET", "/school/posts", { as: "a001" })).status, 403);
  assert.equal((await srv.call("POST", "/school/posts/khong-co/review", { as: STAFF, body: { decision: "approve" } })).status, 404);
  assert.equal((await srv.call("GET", "/posts/khong-co", { as: "a017" })).status, 404);
});

test("kiểm tra dữ liệu gửi lên: sự kiện cần ngày giờ; loại khác không có ngày giờ; độ dài", async () => {
  assert.equal((await post("a001", { ...draft, kind: "event" })).status, 400, "sự kiện thiếu ngày giờ");
  assert.equal((await post("a001", { ...draft, kind: "news", eventAt: "2026-11-05T10:00:00+07:00" })).status, 400, "tin tức không có ngày giờ");
  assert.equal((await post("a001", { ...draft, title: "  " })).status, 400);
  assert.equal((await post("a001", { ...draft, body: "x".repeat(2001) })).status, 400);
  assert.equal((await post("a001", { ...draft, kind: "khac" })).status, 400);
  const ok = await post("a001", { kind: "event", title: "Buổi giao lưu", body: "Mời mọi người.", eventAt: "2026-11-07T08:00:00+07:00", place: "Sân cầu lông" });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.post.eventAt, "2026-11-07T08:00:00+07:00");
  assert.equal(ok.body.post.place, "Sân cầu lông");
});

test("sửa tin bị từ chối rồi gửi lại: quay về chờ duyệt, xóa lý do, vào lại hàng chờ; chỉ tin bị từ chối, chỉ người có quyền đăng", async () => {
  const id = (await post("a005")).body.post.id;
  const edit = (as: string, body: unknown = { kind: "news", title: "Thông báo đã sửa", body: "Đã bổ sung địa điểm." }, postId = id) => srv.call("PUT", `${C}/posts/${postId}`, { as, body });
  assert.equal((await edit("a005")).status, 409, "tin đang chờ thì chưa sửa gửi lại");
  await srv.call("POST", `/school/posts/${id}/review`, { as: STAFF, body: { decision: "reject", reason: "Thiếu địa điểm." } });
  assert.equal((await edit("a017")).status, 403, "thành viên thường");
  assert.equal((await edit("a002")).status, 403, "thủ quỹ không có quyền đăng tin");
  assert.equal((await edit("a005", { kind: "event", title: "x", body: "y" })).status, 400, "sự kiện thiếu ngày giờ");
  assert.equal((await edit("a005", undefined, "khong-co")).status, 404);
  const r = await edit("a001");
  assert.equal(r.status, 200, "chủ nhiệm cùng CLB cũng gửi lại được");
  assert.deepEqual([r.body.post.status, r.body.post.title, r.body.post.rejectReason, r.body.post.reviewedBy], ["pending", "Thông báo đã sửa", undefined, undefined]);
  const queue = (await srv.call("GET", "/school/posts", { as: STAFF })).body.pending as { id: string }[];
  assert.ok(queue.some((p) => p.id === id), "tin gửi lại vào lại hàng chờ");
  assert.ok(!(await feed("a017")).some((p) => p.id === id), "chưa duyệt thì chưa hiện");
  assert.equal((await srv.call("POST", `/school/posts/${id}/review`, { as: STAFF, body: { decision: "approve" } })).status, 200);
  assert.equal((await edit("a005")).status, 409, "đã duyệt rồi thì không sửa gửi lại");
});
