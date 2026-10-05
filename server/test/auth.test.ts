// Chạy: npm test. Đăng nhập: phiên bằng cookie, đăng nhập nhanh ở chế độ demo, đăng nhập Google (Google giả), đăng xuất.

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GoogleProfile } from "../src/google.ts";
import { startServer, type TestServer } from "./helpers.ts";

const WEB = "http://localhost:3000";
const GOOGLE_ENV = { GOOGLE_CLIENT_ID: "client-test", GOOGLE_CLIENT_SECRET: "secret-test", LOGIN_AS: "hieu@example.com=a001" };

let demo: TestServer;
let google: TestServer;
/** Google giả: mã "ma-<email>" đăng nhập bằng email đó; mã "chua-xac-nhan" là email chưa xác nhận. */
const fakeGoogle = async (code: string): Promise<GoogleProfile> =>
  code === "chua-xac-nhan" ? { email: "x@example.com", emailVerified: false, name: "X" } : { email: code.slice(3), emailVerified: true, name: "Người Mới" };

before(async () => {
  demo = await startServer({ env: GOOGLE_ENV, exchangeGoogleCode: fakeGoogle });
  google = await startServer({ env: { ...GOOGLE_ENV, AUTH_MODE: "google", QR_SECRET: "khoa-that" }, exchangeGoogleCode: fakeGoogle });
});
after(async () => {
  await demo.close();
  await google.close();
});

/** Đi hết luồng Google trên một máy chủ: bắt đầu, rồi Google gọi lại với mã giả. Trả lời lần gọi lại và cookie phiên. */
async function googleLogin(srv: TestServer, code: string, next = "/me") {
  const start = await srv.call("GET", `/auth/google/start?next=${encodeURIComponent(next)}`);
  const state = new URL(start.location!).searchParams.get("state")!;
  const back = await srv.call("GET", `/auth/google/callback?code=${encodeURIComponent(code)}&state=${state}`, { cookie: start.cookies.find((c) => c.startsWith("ch_oauth="))! });
  return { start, back, session: back.cookies.find((c) => c.startsWith("ch_session=") && c !== "ch_session=") };
}

test("đăng nhập nhanh (chế độ demo): cookie phiên dùng được, đăng xuất thì hết", async () => {
  const login = await demo.call("POST", "/auth/dev-login", { body: { personId: "a002" } });
  assert.equal(login.status, 200);
  assert.equal(login.body.person.name, "Lê Thu Hà");
  const session = login.cookies.find((c) => c.startsWith("ch_session="))!;
  assert.ok(session.length > "ch_session=".length);
  assert.equal((await demo.call("GET", "/me", { cookie: session })).body.person.id, "a002");

  const out = await demo.call("POST", "/auth/logout", { cookie: session });
  assert.deepEqual(out.body, { ok: true });
  assert.ok(out.cookies.includes("ch_session="), "đăng xuất phải xóa cookie phiên");
  assert.equal((await demo.call("GET", "/me", { cookie: session })).status, 401);
});

test("chế độ demo: header X-Demo-User được ưu tiên hơn cookie (tab thử điểm danh không đổi người của tab khác)", async () => {
  const login = await demo.call("POST", "/auth/dev-login", { body: { personId: "a001" } });
  const session = login.cookies.find((c) => c.startsWith("ch_session="))!;
  assert.equal((await demo.call("GET", "/me", { cookie: session })).body.person.id, "a001");
  assert.equal((await demo.call("GET", "/me", { cookie: session, as: "a017" })).body.person.id, "a017");
  assert.equal((await demo.call("GET", "/me", { cookie: session })).body.person.id, "a001"); // phiên vẫn là của chủ nhiệm
});

test("đăng nhập nhanh: người không có trong dữ liệu mẫu bị từ chối", async () => {
  const r = await demo.call("POST", "/auth/dev-login", { body: { personId: "khong-co-ai" } });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, "VALIDATION");
});

test("chế độ google: không có đăng nhập nhanh, header X-Demo-User không còn tác dụng", async () => {
  assert.equal((await google.call("POST", "/auth/dev-login", { body: { personId: "a001" } })).status, 404);
  assert.equal((await google.call("GET", "/me", { as: "a001" })).status, 401);
  assert.deepEqual((await google.call("GET", "/health")).body, { ok: true, authMode: "google", googleLogin: true });
});

test("Google: email đã ghép trong LOGIN_AS vào đúng người, về lại trang đang mở", async () => {
  const { start, back, session } = await googleLogin(google, "ma-hieu@example.com", "/clubs/cau-long-san-nha");
  assert.equal(start.status, 302);
  const auth = new URL(start.location!);
  assert.equal(auth.origin, "https://accounts.google.com");
  assert.equal(auth.searchParams.get("code_challenge_method"), "S256");
  assert.equal(auth.searchParams.get("redirect_uri"), `${WEB}/api/v1/auth/google/callback`);
  assert.equal(back.status, 302);
  // Lần đầu đăng nhập Google: sang màn đặt tên tài khoản và mật khẩu, kèm trang cần mở lại. Lần sau về thẳng trang đó.
  assert.equal(back.location, `${WEB}/account?moi=1&next=${encodeURIComponent("/clubs/cau-long-san-nha")}`);
  assert.equal((await google.call("GET", "/me", { cookie: session })).body.person.id, "a001");
  assert.equal((await googleLogin(google, "ma-hieu@example.com", "/clubs/cau-long-san-nha")).back.location, `${WEB}/clubs/cau-long-san-nha`);
});

test("Google: email lạ thành tài khoản sinh viên mới, chưa ở CLB nào", async () => {
  const { session } = await googleLogin(google, "ma-sinhvienmoi@example.com");
  const me = (await google.call("GET", "/me", { cookie: session })).body;
  assert.equal(me.person.email, "sinhvienmoi@example.com");
  assert.equal(me.person.kind, "student");
  assert.deepEqual(me.memberships, []);
  // Đăng nhập lần hai không tạo thêm người.
  const again = await googleLogin(google, "ma-sinhvienmoi@example.com");
  assert.equal((await google.call("GET", "/me", { cookie: again.session })).body.person.id, me.person.id);
});

test("Google: state không khớp cookie thì không cấp phiên (chặn trang khác giả lượt gọi lại)", async () => {
  const start = await google.call("GET", "/auth/google/start");
  const state = new URL(start.location!).searchParams.get("state")!;
  const back = await google.call("GET", `/auth/google/callback?code=ma-hieu@example.com&state=${state}`, { cookie: "ch_oauth=cookie-cua-trang-khac" });
  assert.equal(back.status, 302);
  assert.equal(back.location, `${WEB}/login?loi=het-han`);
  assert.equal(back.cookies.find((c) => c.startsWith("ch_session=") && c !== "ch_session="), undefined);
});

test("Google: không cho chuyển ra trang ngoài sau khi đăng nhập", async () => {
  const { back } = await googleLogin(google, "ma-hieu@example.com", "//trang-la.example/lua-dao");
  assert.equal(back.location, `${WEB}/`);
});

test("Google: email chưa xác nhận, hoặc người dùng hủy, thì về trang đăng nhập kèm lý do", async () => {
  const unverified = await googleLogin(google, "chua-xac-nhan");
  assert.equal(unverified.back.location, `${WEB}/login?loi=email-chua-xac-minh`);
  assert.equal(unverified.session, undefined);
  const start = await google.call("GET", "/auth/google/start");
  const state = new URL(start.location!).searchParams.get("state")!;
  const cancelled = await google.call("GET", `/auth/google/callback?error=access_denied&state=${state}`, { cookie: start.cookies[0] });
  assert.equal(cancelled.location, `${WEB}/login?loi=huy`);
});

test("Google chưa có khóa: nút bắt đầu đưa về trang đăng nhập kèm lý do", async () => {
  const bare = await startServer();
  try {
    const r = await bare.call("GET", "/auth/google/start");
    assert.equal(r.status, 302);
    assert.equal(r.location, `${WEB}/login?loi=google-chua-bat`);
  } finally {
    await bare.close();
  }
});
