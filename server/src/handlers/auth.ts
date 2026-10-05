// Đăng nhập: Google (luồng mã có PKCE), tên tài khoản hoặc email kèm mật khẩu, đăng nhập nhanh bằng tài khoản mẫu
// (chỉ ở chế độ demo), đăng xuất. Đăng nhập xong máy chủ giữ phiên bằng cookie httpOnly; web không thấy mã phiên.
// Đăng ký là lần đầu đăng nhập Google; sau đó web hỏi đặt tên tài khoản và mật khẩu (PUT /me/account).

import { API_PREFIX, type LoginErrorCode, type RedirectRes } from "../contract.ts";
import { MAX_FAILED_LOGINS, normalizeUsername, nowIso, type Person } from "../domain.ts";
import { invalid, notFound, tooManyAttempts, unauthenticated } from "../errors.ts";
import { googleAuthUrl, type GoogleProfile } from "../google.ts";
import { dummyHash, verifyPassword } from "../password.ts";
import { devLoginBody, parseBody, passwordLoginBody } from "../schemas.ts";
import { OAUTH_COOKIE, OAUTH_SECONDS, randomToken } from "../sessions.ts";
import { meRes } from "../views.ts";
import type { Ctx, Handlers } from "./types.ts";

type Keys = "googleLogin" | "googleCallback" | "devLogin" | "passwordLogin" | "logout";

/** Chỉ nhận đường dẫn bên trong web ("/me"), không nhận "//trang-khac" hay "https://...": không cho mượn link đăng nhập để chuyển người dùng ra trang lạ. */
function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Google gọi lại qua web (Next.js chuyển tiếp /api/v1 sang máy chủ), nên cookie phiên thuộc về địa chỉ của web. */
const redirectUri = (ctx: Ctx<Keys>) => `${ctx.config.webOrigin}${API_PREFIX}/auth/google/callback`;
/** Về trang đăng nhập kèm mã lý do (không kèm câu: web tự có câu cho từng mã). */
const toLogin = (ctx: Ctx<Keys>, code: LoginErrorCode): RedirectRes => ({ location: `${ctx.config.webOrigin}/login?loi=${code}` });

/** Không nói rõ sai tên hay sai mật khẩu, để không ai dò được tên tài khoản nào có thật. */
const wrongLogin = () => unauthenticated("Tên tài khoản, email hoặc mật khẩu không đúng.");

/** Đang tạm khóa đăng nhập bằng mật khẩu (nhập sai quá nhiều lần). Giờ hết khóa ghi theo giờ Việt Nam. */
export const lockedError = (until: number) => tooManyAttempts(
  `Bạn đã nhập sai mật khẩu ${MAX_FAILED_LOGINS} lần. Thử lại sau ${nowIso(until).slice(11, 16)}, hoặc đăng nhập bằng Google.`,
  nowIso(until),
);

export const authHandlers: Pick<Handlers, Keys> = {
  googleLogin: (ctx) => {
    if (!ctx.config.googleClientId || !ctx.config.googleClientSecret) return toLogin(ctx, "google-chua-bat");
    const state = randomToken();
    const verifier = randomToken();
    ctx.auth.sessions.savePending(state, { verifier, next: safeNext(ctx.query.next) });
    ctx.auth.setCookie(OAUTH_COOKIE, state, OAUTH_SECONDS);
    return { location: googleAuthUrl(ctx.config, redirectUri(ctx), state, verifier) };
  },

  googleCallback: async (ctx) => {
    const state = typeof ctx.query.state === "string" ? ctx.query.state : undefined;
    // state phải khớp cookie của chính trình duyệt này: trang khác không dụ được trình duyệt mở link gọi lại.
    const pending = state && state === ctx.auth.cookie(OAUTH_COOKIE) ? ctx.auth.sessions.takePending(state) : undefined;
    ctx.auth.clearCookie(OAUTH_COOKIE);
    if (ctx.query.error) return toLogin(ctx, "huy");
    if (!pending || typeof ctx.query.code !== "string") return toLogin(ctx, "het-han");
    let profile: GoogleProfile;
    try {
      profile = await ctx.auth.exchangeGoogleCode(ctx.query.code, pending.verifier, redirectUri(ctx));
    } catch {
      return toLogin(ctx, "google-loi");
    }
    if (!profile.email || !profile.emailVerified) return toLogin(ctx, "email-chua-xac-minh");
    const person = findOrCreatePerson(ctx, profile);
    ctx.auth.startSession(person.id);
    // Vừa đăng nhập Google: trong ít phút tới đổi mật khẩu không cần mật khẩu cũ (cách lấy lại khi quên).
    ctx.auth.accounts.markGoogleLogin(person.id, ctx.now());
    // Lần đầu đăng nhập Google: hỏi đặt tên tài khoản và mật khẩu (web có nút "Để sau"), xong mới về trang `next`.
    if (ctx.auth.accounts.ensure(person.id)) return { location: `${ctx.config.webOrigin}/account?moi=1&next=${encodeURIComponent(pending.next)}` };
    return { location: `${ctx.config.webOrigin}${pending.next}` };
  },

  devLogin: (ctx) => {
    if (ctx.config.authMode !== "demo") throw notFound("Không có API này.");
    const body = parseBody(devLoginBody, ctx.body);
    const person = ctx.state.persons.find((p) => p.id === body.personId);
    if (!person) throw invalid("Không có người này trong dữ liệu mẫu.");
    ctx.auth.startSession(person.id);
    return meRes(ctx.state, person, ctx.auth.accounts.get(person.id));
  },

  /** Tên tài khoản (hoặc email) và mật khẩu. Sai 5 lần liền thì khóa đăng nhập bằng mật khẩu 15 phút; Google vẫn dùng được. */
  passwordLogin: async (ctx) => {
    const body = parseBody(passwordLoginBody, ctx.body);
    const login = body.login.trim().toLowerCase();
    const person = login.includes("@")
      ? ctx.state.persons.find((p) => p.email.toLowerCase() === login)
      : ctx.state.persons.find((p) => p.id === ctx.auth.accounts.byUsername(normalizeUsername(login))?.personId);
    const account = person ? ctx.auth.accounts.get(person.id) : undefined;
    if (!person || !account?.passwordHash) {
      await verifyPassword(body.password, await dummyHash()); // tốn thời gian như khi có tài khoản thật
      throw wrongLogin();
    }
    if (account.lockedUntil && account.lockedUntil > ctx.now()) throw lockedError(account.lockedUntil);
    if (!(await verifyPassword(body.password, account.passwordHash))) {
      const after = ctx.auth.accounts.recordFailure(person.id, ctx.now());
      if (after.lockedUntil && after.lockedUntil > ctx.now()) throw lockedError(after.lockedUntil);
      throw wrongLogin();
    }
    ctx.auth.accounts.clearFailures(person.id);
    ctx.auth.startSession(person.id);
    return meRes(ctx.state, person, ctx.auth.accounts.get(person.id));
  },

  logout: (ctx) => {
    ctx.auth.endSession();
    return { ok: true };
  },
};

/** Email đã ghép trong LOGIN_AS, rồi email có sẵn trong dữ liệu; email lạ thì tạo tài khoản sinh viên mới (chưa ở CLB nào). */
function findOrCreatePerson(ctx: Ctx<Keys>, profile: GoogleProfile): Person {
  const mapped = ctx.config.loginAs[profile.email];
  const existing = ctx.state.persons.find((p) => p.id === mapped) ?? ctx.state.persons.find((p) => p.email.toLowerCase() === profile.email);
  if (existing) return existing;
  const person: Person = { id: `g-${randomToken(9)}`, name: profile.name, email: profile.email, kind: "student" };
  ctx.update((s) => ({ ...s, persons: [...s.persons, person] }));
  return person;
}
