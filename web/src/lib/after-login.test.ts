// Chạy: npm test. Trang mở sau khi đăng nhập: ban điều hành không bị đưa vào trang Của tôi bởi `next=/me` còn sót lại.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { MeRes } from "@contract";
import { homeFor, landingAfterLogin } from "../api/after-login.ts";

const me = (role: "president" | "member", extra: Partial<MeRes["person"]> = {}): MeRes => ({
  person: { id: "p", name: "Người thử", email: "thu@example.com", kind: "student", ...extra },
  memberships: [{ clubId: "cau-long", clubName: "CLB", term: "Fall 2026", code: "A001", department: "Ban", role, invite: "accepted" }],
  account: { hasPassword: false },
  notices: [],
});

test("ban điều hành đăng nhập với next=/me thì về trang CLB", () => {
  assert.equal(landingAfterLogin(me("president"), "/me"), "/clubs/cau-long");
  assert.equal(landingAfterLogin(me("president"), "/me?checkedIn=1"), "/clubs/cau-long");
});

test("next khác /me vẫn được giữ cho ban điều hành (link đóng quỹ, điểm danh, lời mời, trang CLB)", () => {
  for (const next of ["/me/pay/quy-fall-2026", "/me/attendance", "/checkin?e=tuan-5&t=abc", "/invite/moi-a022", "/clubs/cau-long/handover"]) {
    assert.equal(landingAfterLogin(me("president"), next), next);
  }
});

test("thành viên thường đăng nhập với next=/me thì vào /me; không có next thì vào trang chung", () => {
  assert.equal(landingAfterLogin(me("member"), "/me"), "/me");
  assert.equal(landingAfterLogin(me("member"), undefined), "/feed");
  assert.equal(landingAfterLogin(me("president"), undefined), homeFor(me("president")));
  assert.equal(landingAfterLogin(me("president", { kind: "staff" }), "/me"), "/me"); // cán bộ trường: không đụng
});

test("người chưa ở CLB nào vào trang chung; có lời mời đang chờ thì vào lời mời", () => {
  const none: MeRes = { person: { id: "p", name: "Người thử", email: "thu@example.com", kind: "student" }, memberships: [], account: { hasPassword: false }, notices: [] };
  assert.equal(homeFor(none), "/feed");
  const invited: MeRes = { ...none, memberships: [{ clubId: "cau-long", clubName: "CLB", term: "Fall 2026", code: "A001", department: "Ban", role: "member", invite: "pending", inviteCode: "moi-a022" }] };
  assert.equal(homeFor(invited), "/invite/moi-a022");
});
