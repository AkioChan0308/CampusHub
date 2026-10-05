// Chạy: npm test. Luật tên tài khoản và mật khẩu (Hiệu duyệt mức "chặt hơn" ngày 05/10/2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { displayNameError, normalizeUsername, passwordError, usernameError } from "./account.ts";

test("tên tài khoản: 3–30 ký tự, chữ không dấu, số, dấu chấm, gạch dưới; không phân biệt hoa thường", () => {
  for (const ok of ["abc", "minh.anh_2026", "A".repeat(30), "  MinhAnh  "]) assert.equal(usernameError(ok), undefined, ok);
  assert.equal(usernameError("ab"), "Tên tài khoản dài 3–30 ký tự.");
  assert.equal(usernameError("a".repeat(31)), "Tên tài khoản dài 3–30 ký tự.");
  for (const bad of ["minh anh", "minhánh", "minh@anh.com", "minh-anh"]) {
    assert.equal(usernameError(bad), "Tên tài khoản chỉ gồm chữ không dấu, số, dấu chấm và gạch dưới.", bad);
  }
  assert.equal(normalizeUsername("  Minh.Anh "), "minh.anh");
});

test("mật khẩu: ít nhất 10 ký tự, có chữ hoa, chữ số, ký tự đặc biệt", () => {
  assert.equal(passwordError("Mua-Cau-2026"), undefined);
  assert.equal(passwordError("Ab1!"), "Mật khẩu cần ít nhất 10 ký tự.");
  assert.equal(passwordError("x".repeat(129)), "Mật khẩu dài tối đa 128 ký tự.");
  assert.equal(passwordError("mua-cau-2026"), "Mật khẩu cần có ít nhất một chữ hoa.");
  assert.equal(passwordError("Mua-Cau-Long"), "Mật khẩu cần có ít nhất một chữ số.");
  assert.equal(passwordError("MuaCauLong2026"), "Mật khẩu cần có ít nhất một ký tự đặc biệt, ví dụ ! @ # ?");
  assert.equal(passwordError("Mua Cau Long 2026"), "Mật khẩu cần có ít nhất một ký tự đặc biệt, ví dụ ! @ # ?"); // khoảng trắng không tính
});

test("mật khẩu không được chứa tên tài khoản hay phần trước @ của email", () => {
  assert.equal(passwordError("MinhAnh#2026", { username: "minhanh" }), "Mật khẩu không được chứa tên tài khoản hay email.");
  assert.equal(passwordError("X!minhanh.nguyen9", { email: "minhanh.nguyen@example.com" }), "Mật khẩu không được chứa tên tài khoản hay email.");
  assert.equal(passwordError("Mua-Cau-2026", { username: "minhanh", email: "minhanh.nguyen@example.com" }), undefined);
});

test("tên hiển thị: không trống, tối đa 80 ký tự", () => {
  assert.equal(displayNameError("  Nguyễn Minh Anh "), undefined);
  assert.equal(displayNameError("   "), "Cần nhập tên hiển thị.");
  assert.equal(displayNameError("a".repeat(81)), "Tên hiển thị dài tối đa 80 ký tự.");
});
