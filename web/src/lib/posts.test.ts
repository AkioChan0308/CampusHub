// Chạy: npm test. Tin của CLB trên Cộng đồng: duyệt trước, hiện sau. Ai thấy tin nào, tin mới luôn chờ duyệt, duyệt và từ chối.
import { test } from "node:test";
import assert from "node:assert/strict";
import { approvePost, createPost, rejectPost, resubmitPost } from "./actions.ts";
import { sampleAbout } from "./feed-sample.ts";
import { createSeed, DEMO_CLUB_ID } from "./seed.ts";
import { canSeePost, feedFor, pendingPosts, postsOf } from "./selectors.ts";
import type { ClubPost } from "./types.ts";

const at = "2026-10-29T10:00:00+07:00";
const base = { id: "tin-moi", clubId: DEMO_CLUB_ID, kind: "news" as const, title: "Tin mới", body: "Nội dung", createdBy: "a005", createdAt: at };
const person = (s: ReturnType<typeof createSeed>, id: string) => s.persons.find((p) => p.id === id)!;

test("dữ liệu mẫu: mọi tin đã duyệt có người duyệt, một tin của CLB mẫu đang chờ; mỗi tin trỏ tới CLB có thật", () => {
  const s = createSeed();
  const clubs = new Set(s.clubs.map((c) => c.id));
  for (const p of s.posts) {
    assert.ok(clubs.has(p.clubId), p.id);
    if (p.status === "approved") assert.ok(p.reviewedBy && p.reviewedAt, p.id);
    if (p.kind === "event") assert.ok(p.eventAt && Date.parse(p.eventAt) > Date.parse(p.createdAt), p.id);
    else assert.equal(p.eventAt, undefined, p.id);
  }
  assert.deepEqual(s.posts.filter((p) => p.status === "pending").map((p) => p.id), ["doi-gio-sinh-hoat"]);
});

test("tin mới luôn chờ duyệt, chưa ai khác thấy; người đăng thấy (hiện mờ)", () => {
  let s = createSeed();
  s = createPost(base)(s);
  const p = s.posts.find((x) => x.id === "tin-moi")!;
  assert.equal(p.status, "pending");
  assert.ok(!feedFor(s, "a017").some((x) => x.id === "tin-moi"), "thành viên thường không thấy");
  assert.ok(!feedFor(s, "p-thu-trang").some((x) => x.id === "tin-moi"), "cộng đồng chung không có tin chờ, kể cả của cán bộ trường (họ duyệt ở hàng chờ)");
  assert.ok(feedFor(s, "a005").some((x) => x.id === "tin-moi"), "người đăng thấy tin của mình");
  assert.ok(pendingPosts(s).some((x) => x.id === "tin-moi"));
});

test("ai xem được tin chưa duyệt: người đăng, ban điều hành CLB đó, cán bộ trường; thành viên thường và người ngoài thì không", () => {
  const s = createPost(base)(createSeed());
  const p = s.posts.find((x) => x.id === "tin-moi")!;
  assert.equal(canSeePost(s, p, person(s, "a005")), true, "người đăng");
  assert.equal(canSeePost(s, p, person(s, "a001")), true, "chủ nhiệm CLB");
  assert.equal(canSeePost(s, p, person(s, "a002")), true, "thủ quỹ cùng CLB");
  assert.equal(canSeePost(s, p, person(s, "p-thu-trang")), true, "cán bộ trường");
  assert.equal(canSeePost(s, p, person(s, "a017")), false, "thành viên thường");
  assert.equal(canSeePost(s, p, person(s, "p-bao-chau")), false, "sinh viên ngoài CLB");
  const done = s.posts.find((x) => x.id === "giai-noi-bo")!;
  assert.equal(canSeePost(s, done, person(s, "p-bao-chau")), true, "tin đã duyệt ai cũng xem");
});

test("duyệt: tin hiện cho mọi người, ghi người duyệt và lúc nào, rời hàng chờ", () => {
  let s = createPost(base)(createSeed());
  s = approvePost("tin-moi", "p-thu-trang", at)(s);
  const p = s.posts.find((x) => x.id === "tin-moi")!;
  assert.deepEqual([p.status, p.reviewedBy, p.reviewedAt], ["approved", "p-thu-trang", at]);
  assert.ok(feedFor(s, "a017").some((x) => x.id === "tin-moi"));
  assert.ok(!pendingPosts(s).some((x) => x.id === "tin-moi"));
});

test("từ chối: kèm lý do, người khác vẫn không thấy, người đăng thấy lý do", () => {
  let s = createPost(base)(createSeed());
  s = rejectPost("tin-moi", "Thiếu thông tin địa điểm.", "p-thu-trang", at)(s);
  const p = s.posts.find((x) => x.id === "tin-moi")!;
  assert.deepEqual([p.status, p.rejectReason, p.reviewedBy], ["rejected", "Thiếu thông tin địa điểm.", "p-thu-trang"]);
  assert.ok(!feedFor(s, "a017").some((x) => x.id === "tin-moi"));
  assert.ok(feedFor(s, "a005").some((x) => x.id === "tin-moi" && x.rejectReason));
  assert.ok(!pendingPosts(s).some((x) => x.id === "tin-moi"));
});

test("tin của CLB: mọi trạng thái, mới nhất trước; CLB lạ vẫn có câu giới thiệu chung", () => {
  const s = createPost(base)(createSeed());
  const mine = postsOf(s, DEMO_CLUB_ID);
  assert.equal(mine[0].id, "tin-moi");
  for (let i = 1; i < mine.length; i++) assert.ok(mine[i - 1].createdAt >= mine[i].createdAt);
  assert.ok(mine.some((p: ClubPost) => p.status === "pending"));
  assert.ok(sampleAbout("clb-moi-tao").length > 0);
});

test("sửa tin bị từ chối rồi gửi lại: về chờ duyệt, xóa lý do và người duyệt, đổi nội dung, giờ gửi mới", () => {
  let s = createPost({ ...base, kind: "event", eventAt: "2026-11-20T08:00:00+07:00", place: "Sân A" })(createSeed());
  s = rejectPost("tin-moi", "Thiếu thông tin.", "p-thu-trang", at)(s);
  const later = "2026-10-30T10:00:00+07:00";
  s = resubmitPost("tin-moi", { kind: "news", title: "Tin đã sửa", body: "Nội dung mới" }, later)(s);
  const p = s.posts.find((x) => x.id === "tin-moi")!;
  assert.deepEqual([p.status, p.title, p.kind, p.createdAt], ["pending", "Tin đã sửa", "news", later]);
  assert.equal(p.eventAt, undefined, "đổi sang tin tức thì bỏ ngày giờ và nơi diễn ra");
  assert.equal(p.place, undefined);
  assert.equal(p.rejectReason, undefined);
  assert.equal(p.reviewedBy, undefined);
  assert.equal(pendingPosts(s).at(-1)?.id, "tin-moi");
});
