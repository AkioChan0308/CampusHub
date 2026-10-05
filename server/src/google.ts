// Đăng nhập Google (OpenID Connect, luồng mã có PKCE). Máy chủ đổi mã lấy thông tin người dùng, trình duyệt không thấy khóa bí mật.

import { createHash } from "node:crypto";
import type { Config } from "./config.ts";

export interface GoogleProfile {
  email: string; // đã viết thường
  emailVerified: boolean;
  name: string;
}

/** Đổi mã Google gửi về lấy thông tin người dùng. Test thay hàm này để không gọi Google thật. */
export type ExchangeGoogleCode = (code: string, verifier: string, redirectUri: string) => Promise<GoogleProfile>;

export const pkceChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

export function googleAuthUrl(config: Config, redirectUri: string, state: string, verifier: string): string {
  const q = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export function googleExchange(config: Config, now: () => number = Date.now): ExchangeGoogleCode {
  return async (code, verifier, redirectUri) => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        code_verifier: verifier,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error(`Google không đổi được mã đăng nhập (HTTP ${res.status}).`);
    const { id_token } = (await res.json()) as { id_token?: string };
    if (!id_token) throw new Error("Google không trả id_token.");
    // id_token lấy thẳng từ Google qua HTTPS nên không cần kiểm chữ ký (OpenID Connect Core 3.1.3.7);
    // vẫn kiểm nơi phát, người nhận và hạn dùng.
    const claims = JSON.parse(Buffer.from(id_token.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
    const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    if (!issuerOk || claims.aud !== config.googleClientId || Number(claims.exp) * 1000 < now()) throw new Error("Mã đăng nhập Google không hợp lệ.");
    const email = String(claims.email ?? "").toLowerCase();
    return { email, emailVerified: claims.email_verified === true, name: String(claims.name ?? email) };
  };
}
