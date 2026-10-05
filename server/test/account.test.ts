// Chạy: npm test. Đăng nhập bằng tên tài khoản (hoặc email) và mật khẩu (Hiệu duyệt ngày 05/10/2026):
// đặt tên tài khoản và mật khẩu sau lần đầu đăng nhập Google, luật "chặt hơn", khóa 15 phút sau 5 lần sai, đổi mật khẩu.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/domain.ts";
import type { GoogleProfile } from "../src/google.ts";
import { NOW, startServer, type TestServer } from "./helpers.ts";

const PASSWORD = "Cau-Long-2026";
// Người thử: Võ Hoàng Long (a018), không có trong danh sách tài khoản mẫu của bản demo nên chưa có mật khẩu.
const account = (extra: Record<string, string> = {}) => ({ name: "Võ Hoàng Long", username: "Hoang.Long", password: PASSWORD, ...extra });
const fakeGoogle = async (code: string): Promise<GoogleProfile> => ({ email: code.slice(3), emailVerified: true, name: "Người Mới" });

let srv: TestServer;
before(async () => { srv = await startServer({ env: { GOOGLE_CLIENT_ID: "client-test", GOOGLE_CLIENT_SECRET: "secret-test" }, exchangeGoogleCode: fakeGoogle }); });
after(async () => { await srv.close(); });
beforeEach(async () => { await srv.call("POST", "/demo/reset"); });

const login = (loginName: string, password: string) => srv.call("POST", "/auth/login", { body: { login: loginName, password } });
const session = (r: { cookies: string[] }) => r.cookies.find((c) => c.startsWith("ch_session=") && c !== "ch_session=");

async function googleLogin(code: string, next = "/me") {
  const start = await srv.call("GET", `/auth/google/start?next=${encodeURIComponent(next)}`);
  const state = new URL(start.location!).searchParams.get("state")!;
  const back = await srv.call("GET", `/auth/google/callback?code=${encodeURIComponent(code)}&state=${state}`, { cookie: start.cookies.find((c) => c.startsWith("ch_oauth="))! });
  return { back, cookie: session(back)! };
}

test("đặt tên tài khoản và mật khẩu rồi đăng nhập bằng tên tài khoản hoặc email; không lộ mã băm", async () => {
  const me = (await srv.call("GET", "/me", { as: "a018" })).body;
  assert.deepEqual(me.account, { hasPassword: false });
  const set = await srv.call("PUT", "/me/account", { as: "a018", body: account({ name: "  Hoàng Long  " }) });
  assert.equal(set.status, 200, JSON.stringify(set.body));
  assert.deepEqual(set.body.account, { username: "hoang.long", hasPassword: true });
  assert.equal(set.body.person.name, "Hoàng Long"); // tên hiển thị đổi được, khác tên tài khoản

  for (const name of ["hoang.long", "HOANG.LONG", "hoanglong.vo@example.com"]) {
    const r = await login(name, PASSWORD);
    assert.equal(r.status, 200, name);
    assert.equal(r.body.person.id, "a018");
    assert.equal((await srv.call("GET", "/me", { cookie: session(r) })).body.person.id, "a018");
  }
  const stored = srv.accounts.get("a018")!;
  assert.match(stored.passwordHash!, /^scrypt\$131072\$8\$1\$/);
  assert.ok(!stored.passwordHash!.includes(PASSWORD));
  for (const r of [set, await login("hoang.long", PASSWORD), await srv.call("GET", "/me", { as: "a018" })]) {
    assert.ok(!JSON.stringify(r.body).includes("scrypt"), "API không được trả mã băm");
  }
});

test("sai tên hay sai mật khẩu đều cùng một câu báo; người chưa đặt mật khẩu cũng vậy", async () => {
  await srv.call("PUT", "/me/account", { as: "a018", body: account() });
  const wrong = await login("hoang.long", "Sai-Mat-Khau-1");
  const nobody = await login("khong.ai.co", PASSWORD);
  const noPassword = await login("ductri.hoang@example.com", PASSWORD);
  for (const r of [wrong, nobody, noPassword]) {
    assert.equal(r.status, 401);
    assert.equal(r.body.error.message, "Tên tài khoản, email hoặc mật khẩu không đúng.");
  }
  assert.equal((await login("", PASSWORD)).status, 400);
});

test("luật chặt hơn: thiếu chữ hoa, số, ký tự đặc biệt, quá ngắn, chứa tên tài khoản thì báo đúng ô", async () => {
  const bad = async (body: Record<string, string>) => (await srv.call("PUT", "/me/account", { as: "a018", body: account(body) })).body.error;
  assert.equal((await bad({ password: "Ngan-1" })).details.fields.password, "Mật khẩu cần ít nhất 10 ký tự.");
  assert.equal((await bad({ password: "cau-long-2026" })).details.fields.password, "Mật khẩu cần có ít nhất một chữ hoa.");
  assert.equal((await bad({ password: "Cau-Long-Sai" })).details.fields.password, "Mật khẩu cần có ít nhất một chữ số.");
  assert.equal((await bad({ password: "CauLong2026x" })).details.fields.password, "Mật khẩu cần có ít nhất một ký tự đặc biệt, ví dụ ! @ # ?");
  assert.equal((await bad({ password: "Hoang.Long#2026" })).details.fields.password, "Mật khẩu không được chứa tên tài khoản hay email.");
  assert.equal((await bad({ username: "minh anh" })).details.fields.username, "Tên tài khoản chỉ gồm chữ không dấu, số, dấu chấm và gạch dưới.");
  assert.equal((await bad({ name: " " })).details.fields.name, "Cần nhập tên hiển thị.");
  // Tên tài khoản đã có người dùng (không phân biệt hoa thường)
  await srv.call("PUT", "/me/account", { as: "a018", body: account() });
  const taken = await srv.call("PUT", "/me/account", { as: "a019", body: account({ username: "HOANG.long" }) });
  assert.equal(taken.status, 409);
  assert.equal(taken.body.error.details.fields.username, "Tên tài khoản này đã có người dùng. Chọn tên khác.");
});

test("sai 5 lần thì khóa 15 phút, đúng mật khẩu cũng không vào được; câu báo nhắc đăng nhập Google", async () => {
  await srv.call("PUT", "/me/account", { as: "a018", body: account() });
  for (let i = 1; i <= 4; i++) assert.equal((await login("hoang.long", `Sai-Lan-${i}!x`)).status, 401);
  const fifth = await login("hoang.long", "Sai-Lan-5!x");
  assert.equal(fifth.status, 429);
  assert.equal(fifth.body.error.code, "TOO_MANY_ATTEMPTS");
  assert.equal(fifth.body.error.message, "Bạn đã nhập sai mật khẩu 5 lần. Thử lại sau 07:55, hoặc đăng nhập bằng Google.");
  assert.equal(srv.accounts.get("a018")!.lockedUntil, NOW + 15 * 60_000);
  assert.equal((await login("hoang.long", PASSWORD)).status, 429);
});

test("đúng mật khẩu thì xóa đếm số lần sai", async () => {
  await srv.call("PUT", "/me/account", { as: "a018", body: account() });
  for (let i = 1; i <= 4; i++) await login("hoang.long", `Sai-Lan-${i}!x`);
  assert.equal((await login("hoang.long", PASSWORD)).status, 200);
  assert.equal(srv.accounts.get("a018")!.failedCount, 0);
  assert.equal((await login("hoang.long", "Sai-Lan-5!x")).status, 401); // đếm lại từ đầu, chưa khóa
});

test("đổi mật khẩu: cần mật khẩu hiện tại; mật khẩu cũ hết dùng được", async () => {
  await srv.call("PUT", "/me/account", { as: "a018", body: account() });
  const missing = await srv.call("PUT", "/me/account", { as: "a018", body: account({ password: "Moi-Hon-2027!" }) });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.details.fields.currentPassword, "Cần nhập mật khẩu hiện tại.");
  const wrong = await srv.call("PUT", "/me/account", { as: "a018", body: account({ password: "Moi-Hon-2027!", currentPassword: "Khong-Dung-1" }) });
  assert.equal(wrong.body.error.details.fields.currentPassword, "Mật khẩu hiện tại không đúng.");
  const ok = await srv.call("PUT", "/me/account", { as: "a018", body: account({ password: "Moi-Hon-2027!", currentPassword: PASSWORD }) });
  assert.equal(ok.status, 200);
  assert.equal((await login("hoang.long", PASSWORD)).status, 401);
  assert.equal((await login("hoang.long", "Moi-Hon-2027!")).status, 200);
});

test("đăng ký bằng Google: lần đầu sang màn đặt tài khoản; quên mật khẩu thì đăng nhập Google rồi đặt lại không cần mật khẩu cũ", async () => {
  const first = await googleLogin("ma-ban.moi@example.com", "/explore");
  assert.equal(first.back.location, `http://localhost:3000/account?new=1&next=${encodeURIComponent("/explore")}`);
  const me = (await srv.call("GET", "/me", { cookie: first.cookie })).body;
  assert.deepEqual(me.account, { hasPassword: false });
  assert.equal((await srv.call("PUT", "/me/account", { cookie: first.cookie, body: { name: "Bạn Mới", username: "ban_moi", password: PASSWORD } })).status, 200);
  // Lần sau đăng nhập Google về thẳng trang cần mở.
  const second = await googleLogin("ma-ban.moi@example.com", "/explore");
  assert.equal(second.back.location, "http://localhost:3000/explore");
  // Vừa đăng nhập Google: đặt mật khẩu mới mà không cần mật khẩu cũ.
  const reset = await srv.call("PUT", "/me/account", { cookie: second.cookie, body: { name: "Bạn Mới", username: "ban_moi", password: "Lay-Lai-2027!" } });
  assert.equal(reset.status, 200, JSON.stringify(reset.body));
  assert.equal((await login("ban_moi", "Lay-Lai-2027!")).status, 200);
});

test("bản demo: đặt lại dữ liệu mẫu thì xóa tài khoản đã đặt và tạo lại tài khoản mẫu của 7 vai", async () => {
  await srv.call("PUT", "/me/account", { as: "a018", body: account() });
  await srv.call("POST", "/demo/reset");
  assert.equal(srv.accounts.get("a018"), undefined);
  assert.equal((await login("hoang.long", PASSWORD)).status, 401);
  for (const a of DEMO_ACCOUNTS) {
    const r = await login(a.username, DEMO_PASSWORD);
    assert.equal(r.status, 200, a.username);
    assert.equal(r.body.person.id, a.personId);
  }
  // Người thử đổi mật khẩu của tài khoản mẫu, đặt lại dữ liệu thì về mật khẩu mẫu.
  await srv.call("PUT", "/me/account", { as: "a017", body: { name: "Nguyễn Minh Anh", username: "minhanh", password: PASSWORD, currentPassword: DEMO_PASSWORD } });
  assert.equal((await login("minhanh", DEMO_PASSWORD)).status, 401);
  await srv.call("POST", "/demo/reset");
  assert.equal((await login("minhanh", DEMO_PASSWORD)).status, 200);
});
