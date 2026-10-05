// Phiên đăng nhập và lượt đăng nhập Google đang dở.
// createSessions: giữ trong bộ nhớ, tắt máy chủ là phải đăng nhập lại (khi chưa đặt DATABASE_URL, và trong test).
// createDbSessions (src/db/sessions.ts): phiên lưu trong PostgreSQL. Lượt đăng nhập Google đang dở (10 phút) luôn chỉ ở bộ nhớ.

import { randomBytes } from "node:crypto";

export const SESSION_COOKIE = "ch_session";
export const OAUTH_COOKIE = "ch_oauth";
export const SESSION_SECONDS = 30 * 24 * 3600;
export const OAUTH_SECONDS = 10 * 60;

/** Lượt đăng nhập Google đang chờ Google gọi lại: mã PKCE và trang cần mở lại sau khi xong. */
export interface PendingLogin {
  verifier: string;
  next: string;
}

export interface Sessions {
  /** Tạo phiên mới, trả mã phiên để đặt vào cookie. */
  start(personId: string): string;
  personId(sessionId: string | undefined): string | undefined;
  end(sessionId: string | undefined): void;
  savePending(state: string, login: PendingLogin): void;
  /** Lấy và xóa lượt đăng nhập đang chờ; mỗi `state` chỉ dùng được một lần. */
  takePending(state: string | undefined): PendingLogin | undefined;
  /** Lần mở hay xóa phiên gần nhất đã vào cơ sở dữ liệu chưa (bản trong bộ nhớ: xong ngay). */
  persisted(): Promise<void>;
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function createSessions(now: () => number = Date.now): Sessions {
  const sessions = new Map<string, { personId: string; expires: number }>();
  const pending = new Map<string, PendingLogin & { expires: number }>();
  return {
    start(personId) {
      const id = randomToken();
      sessions.set(id, { personId, expires: now() + SESSION_SECONDS * 1000 });
      return id;
    },
    personId(sessionId) {
      const s = sessionId ? sessions.get(sessionId) : undefined;
      if (!s) return undefined;
      if (s.expires < now()) {
        sessions.delete(sessionId!);
        return undefined;
      }
      return s.personId;
    },
    end(sessionId) {
      if (sessionId) sessions.delete(sessionId);
    },
    savePending(state, login) {
      pending.set(state, { ...login, expires: now() + OAUTH_SECONDS * 1000 });
    },
    takePending(state) {
      const p = state ? pending.get(state) : undefined;
      if (!p) return undefined;
      pending.delete(state!);
      return p.expires < now() ? undefined : { verifier: p.verifier, next: p.next };
    },
    persisted: () => Promise.resolve(),
  };
}
