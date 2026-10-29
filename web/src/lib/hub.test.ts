// Chạy: npm test. Mục theo vai trên thanh công cụ của trang chung.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { MeRes } from "@contract";
import { roleEntries } from "./hub.ts";

type Ms = MeRes["memberships"][number];
const ms = (role: Ms["role"], clubId = "cau-long", invite: Ms["invite"] = "accepted"): Ms => ({ clubId, clubName: "CLB", term: "Fall 2026", code: "A001", department: "Ban", role, invite });
const me = (memberships: Ms[], kind: "student" | "staff" = "student"): MeRes => ({
  person: { id: "p", name: "Người thử", email: "thu@example.com", kind },
  memberships,
  account: { hasPassword: false },
});
const keys = (m: MeRes) => roleEntries(m).map((e) => e.key);

test("cán bộ trường chỉ có mục Nhà trường", () => {
  assert.deepEqual(keys(me([], "staff")), ["school"]);
  assert.equal(roleEntries(me([], "staff"))[0].href, "/school");
});

test("ban điều hành có Quản lý CLB, không có Của tôi", () => {
  assert.deepEqual(keys(me([ms("president")])), ["board"]);
  assert.equal(roleEntries(me([ms("treasurer", "vong-lap")]))[0].href, "/clubs/vong-lap");
});

test("thành viên thường có Của tôi", () => {
  assert.deepEqual(keys(me([ms("member")])), ["me"]);
});

test("ở hai vai (thành viên CLB này, ban điều hành CLB kia) thấy cả hai mục", () => {
  assert.deepEqual(keys(me([ms("member", "a"), ms("vice", "b")])), ["board", "me"]);
});

test("chưa ở CLB nào (kể cả mới có lời mời chờ) có Của tôi và Tạo CLB", () => {
  assert.deepEqual(keys(me([])), ["me", "new"]);
  assert.deepEqual(keys(me([ms("member", "a", "pending")])), ["me", "new"]);
});
