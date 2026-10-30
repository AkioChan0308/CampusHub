// Chạy: npm test. Mục theo vai trên thanh công cụ của trang chung.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { MeRes } from "@contract";
import { roleEntries } from "./hub.ts";

type Ms = MeRes["memberships"][number];
const ms = (role: Ms["role"], clubId = "cau-long", invite: Ms["invite"] = "accepted", clubName = "CLB"): Ms => ({ clubId, clubName, term: "Fall 2026", code: "A001", department: "Ban", role, invite });
const me = (memberships: Ms[], kind: "student" | "staff" = "student"): MeRes => ({
  person: { id: "p", name: "Người thử", email: "thu@example.com", kind },
  memberships,
  account: { hasPassword: false },
  notices: [],
});
const keys = (m: MeRes) => roleEntries(m).map((e) => e.key);

test("cán bộ trường chỉ có mục Nhà trường", () => {
  assert.deepEqual(keys(me([], "staff")), ["school"]);
  assert.equal(roleEntries(me([], "staff"))[0].href, "/school");
});

test("ban điều hành chỉ có một mục, tên Của tôi, dẫn tới trang quản lý CLB", () => {
  assert.deepEqual(keys(me([ms("president")])), ["board"]);
  assert.equal(roleEntries(me([ms("president")]))[0].label, "Của tôi");
  assert.equal(roleEntries(me([ms("treasurer", "vong-lap")]))[0].href, "/clubs/vong-lap");
});

test("thành viên thường có Của tôi", () => {
  assert.deepEqual(keys(me([ms("member")])), ["me"]);
});

test("ở nhiều CLB: mỗi CLB một mục, ghi kèm tên CLB; ban điều hành trước, thành viên sau", () => {
  const entries = roleEntries(me([ms("member", "a", "accepted", "CLB Vòng Lặp"), ms("vice", "b", "accepted", "CLB Cầu lông")]));
  assert.deepEqual(entries.map((e) => [e.key, e.clubId, e.label, e.href]), [
    ["board", "b", "Quản lý CLB Cầu lông", "/clubs/b"],
    ["me", "a", "Của tôi · CLB Vòng Lặp", "/me"],
  ]);
});

test("ở hai CLB thành viên thường: hai mục Của tôi, mỗi mục một CLB", () => {
  const entries = roleEntries(me([ms("member", "a", "accepted", "CLB A"), ms("member", "b", "accepted", "CLB B")]));
  assert.deepEqual(entries.map((e) => [e.clubId, e.label]), [["a", "Của tôi · CLB A"], ["b", "Của tôi · CLB B"]]);
});

test("ban điều hành ở hai CLB: hai mục quản lý, lời mời chưa nhận không tính", () => {
  const entries = roleEntries(me([ms("president", "a", "accepted", "CLB A"), ms("treasurer", "b", "accepted", "CLB B"), ms("member", "c", "pending", "CLB C")]));
  assert.deepEqual(entries.map((e) => e.label), ["Quản lý CLB A", "Quản lý CLB B"]);
});

test("chưa ở CLB nào (kể cả mới có lời mời chờ) có Của tôi và Tạo CLB", () => {
  assert.deepEqual(keys(me([])), ["me", "new"]);
  assert.deepEqual(keys(me([ms("member", "a", "pending")])), ["me", "new"]);
});
