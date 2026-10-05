// Tài khoản đăng nhập bằng mật khẩu: tên tài khoản, mã băm mật khẩu, số lần nhập sai, thời điểm hết khóa.
// Tách khỏi AppState như phiên đăng nhập: mã băm không đi qua luật nghiệp vụ, không nằm trong dữ liệu xuất ra, không ra API.
// createAccounts: giữ trong bộ nhớ (khi chưa đặt DATABASE_URL, và trong test). createDbAccounts (src/db/accounts.ts): lưu PostgreSQL.

import { LOCK_MINUTES, MAX_FAILED_LOGINS } from "./domain.ts";

export interface Account {
  personId: string;
  /** Đã chuẩn hóa chữ thường. Chưa đặt thì không có. */
  username?: string;
  passwordHash?: string;
  failedCount: number;
  /** Mili giây; còn khóa khi lớn hơn thời điểm hiện tại. */
  lockedUntil?: number;
}

/** Đăng nhập Google gần đây trong chừng này phút thì đổi mật khẩu không cần mật khẩu cũ (cách lấy lại mật khẩu khi quên). */
export const GOOGLE_RECENT_MINUTES = 15;

export interface Accounts {
  get(personId: string): Account | undefined;
  byUsername(username: string): Account | undefined;
  /** Tạo bản ghi chưa có mật khẩu nếu người này chưa có. Trả true khi vừa tạo: lần đầu đăng nhập Google, web hỏi đặt mật khẩu. */
  ensure(personId: string): boolean;
  setCredentials(personId: string, username: string, passwordHash: string): void;
  /** Ghi một lần nhập sai; đủ số lần thì khóa tới `now + LOCK_MINUTES`. Trả bản ghi sau khi ghi. */
  recordFailure(personId: string, now: number): Account;
  clearFailures(personId: string): void;
  /** Ghi nhớ (chỉ trong bộ nhớ) lúc người này vừa đăng nhập Google. */
  markGoogleLogin(personId: string, now: number): void;
  googleLoginRecent(personId: string, now: number): boolean;
  /** Bản demo: đặt lại dữ liệu mẫu thì xóa hết tài khoản. */
  reset(): void;
  persisted(): Promise<void>;
}

/** Phần chung của hai bản: bảng tài khoản trong bộ nhớ; `save`, `clear` là chỗ bản PostgreSQL ghi xuống. */
export function accountsOn(rows: Map<string, Account>, save: (a: Account) => void = () => {}, clear: () => void = () => {}, persisted: () => Promise<void> = () => Promise.resolve()): Accounts {
  const google = new Map<string, number>();
  const put = (a: Account) => {
    rows.set(a.personId, a);
    save(a);
    return a;
  };
  return {
    get: (personId) => rows.get(personId),
    byUsername: (username) => [...rows.values()].find((a) => a.username === username),
    ensure(personId) {
      if (rows.has(personId)) return false;
      put({ personId, failedCount: 0 });
      return true;
    },
    setCredentials(personId, username, passwordHash) {
      put({ ...(rows.get(personId) ?? { personId }), username, passwordHash, failedCount: 0, lockedUntil: undefined });
    },
    recordFailure(personId, now) {
      const a = rows.get(personId) ?? { personId, failedCount: 0 };
      const failed = a.failedCount + 1;
      return put(failed >= MAX_FAILED_LOGINS
        ? { ...a, failedCount: 0, lockedUntil: now + LOCK_MINUTES * 60_000 }
        : { ...a, failedCount: failed });
    },
    clearFailures(personId) {
      const a = rows.get(personId);
      if (a && (a.failedCount > 0 || a.lockedUntil)) put({ ...a, failedCount: 0, lockedUntil: undefined });
    },
    markGoogleLogin: (personId, now) => void google.set(personId, now),
    googleLoginRecent: (personId, now) => now - (google.get(personId) ?? -Infinity) <= GOOGLE_RECENT_MINUTES * 60_000,
    reset() {
      rows.clear();
      google.clear();
      clear();
    },
    persisted,
  };
}

export const createAccounts = (): Accounts => accountsOn(new Map());
