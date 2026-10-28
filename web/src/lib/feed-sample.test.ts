// Chạy: npm test. Dữ liệu mẫu của trang chung: mới nhất trước, sự kiện có ngày giờ ở tương lai, mỗi tin trỏ tới một CLB mẫu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleAbout, samplePost, samplePosts } from "./feed-sample.ts";
import { createSeed } from "./seed.ts";

const NOW = Date.parse("2026-10-29T10:00:00+07:00");

test("tin mẫu xếp mới nhất trước và không có tin đăng trong tương lai", () => {
  const posts = samplePosts(NOW);
  assert.ok(posts.length >= 5);
  for (let i = 1; i < posts.length; i++) assert.ok(posts[i - 1].postedAt >= posts[i].postedAt);
  assert.ok(posts.every((p) => p.postedAt <= NOW));
});

test("sự kiện có ngày giờ sau lúc đăng; loại khác không có", () => {
  for (const p of samplePosts(NOW)) {
    if (p.kind === "event") assert.ok(p.eventAt && p.eventAt > p.postedAt, p.id);
    else assert.equal(p.eventAt, undefined, p.id);
  }
});

test("mỗi tin mẫu thuộc một CLB có trong dữ liệu mẫu, đúng tên", () => {
  const clubs = createSeed().clubs;
  for (const p of samplePosts(NOW)) assert.equal(clubs.find((c) => c.id === p.clubId)?.name, p.clubName, p.id);
});

test("tìm tin theo mã; CLB lạ vẫn có câu giới thiệu chung", () => {
  assert.equal(samplePost("giai-noi-bo", NOW)?.clubId, "cau-long-san-nha");
  assert.equal(samplePost("khong-co", NOW), undefined);
  assert.ok(sampleAbout("clb-moi-tao").length > 0);
});
