// Đăng nhập: Google (luồng mã có PKCE), đăng nhập nhanh bằng tài khoản mẫu (chỉ ở chế độ demo), đăng xuất.
// Đăng nhập xong máy chủ giữ phiên bằng cookie httpOnly; web không thấy mã phiên.

import { API_PREFIX, type RedirectRes } from "../contract.ts";
import type { Person } from "../domain.ts";
import { invalid, notFound } from "../errors.ts";
import { googleAuthUrl, type GoogleProfile } from "../google.ts";
import { devLoginBody, parseBody } from "../schemas.ts";
import { OAUTH_COOKIE, OAUTH_SECONDS, randomToken } from "../sessions.ts";
import { meRes } from "../views.ts";
import type { Ctx, Handlers } from "./types.ts";

type Keys = "googleLogin" | "googleCallback" | "devLogin" | "logout";

/** Chỉ nhận đường dẫn bên trong web ("/me"), không nhận "//trang-khac" hay "https://...": không cho mượn link đăng nhập để chuyển người dùng ra trang lạ. */
function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Google gọi lại qua web (Next.js chuyển tiếp /api/v1 sang máy chủ), nên cookie phiên thuộc về địa chỉ của web. */
const redirectUri = (ctx: Ctx<Keys>) => `${ctx.config.webOrigin}${API_PREFIX}/auth/google/callback`;
const toLogin = (ctx: Ctx<Keys>, message: string): RedirectRes => ({ location: `${ctx.config.webOrigin}/login?loi=${encodeURIComponent(message)}` });

export const authHandlers: Pick<Handlers, Keys> = {
  googleLogin: (ctx) => {
    if (!ctx.config.googleClientId || !ctx.config.googleClientSecret) return toLogin(ctx, "Máy chủ chưa bật đăng nhập Google.");
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
    if (ctx.query.error) return toLogin(ctx, "Bạn đã hủy đăng nhập Google.");
    if (!pending || typeof ctx.query.code !== "string") return toLogin(ctx, "Lượt đăng nhập đã hết hạn. Bạn bấm đăng nhập lại.");
    let profile: GoogleProfile;
    try {
      profile = await ctx.auth.exchangeGoogleCode(ctx.query.code, pending.verifier, redirectUri(ctx));
    } catch {
      return toLogin(ctx, "Không đăng nhập được bằng Google. Bạn thử lại.");
    }
    if (!profile.email || !profile.emailVerified) return toLogin(ctx, "Google chưa xác nhận email của tài khoản này.");
    ctx.auth.startSession(findOrCreatePerson(ctx, profile).id);
    return { location: `${ctx.config.webOrigin}${pending.next}` };
  },

  devLogin: (ctx) => {
    if (ctx.config.authMode !== "demo") throw notFound("Không có API này.");
    const body = parseBody(devLoginBody, ctx.body);
    const person = ctx.state.persons.find((p) => p.id === body.personId);
    if (!person) throw invalid("Không có người này trong dữ liệu mẫu.");
    ctx.auth.startSession(person.id);
    return meRes(ctx.state, person);
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
