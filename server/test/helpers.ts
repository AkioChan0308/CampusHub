// Dựng máy chủ thật trên một cổng ngẫu nhiên và gọi API qua HTTP, như web sẽ gọi.
// npm test: dữ liệu trong bộ nhớ. npm run test:db: cùng các test đó nhưng dữ liệu và phiên lưu trong PostgreSQL (PGlite).

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";
import type { AppState } from "../src/domain.ts";
import { loadConfig } from "../src/config.ts";
import type { ExchangeGoogleCode } from "../src/google.ts";
import { qrStep, qrToken } from "../src/qr.ts";
import type { Db } from "../src/db/client.ts";
import { createAccounts, type Accounts } from "../src/accounts.ts";
import { createDbAccounts } from "../src/db/accounts.ts";
import { createDbSessions } from "../src/db/sessions.ts";
import { createDbStore } from "../src/db/store.ts";
import { createSessions, type Sessions } from "../src/sessions.ts";
import { createStore, type Store } from "../src/store.ts";
import { createPgliteDb } from "./pglite.ts";

/** TEST_DB=pglite (đặt trong test/pglite.env, dùng bởi npm run test:db): chạy mọi test trên PostgreSQL. */
export const WITH_DB = process.env.TEST_DB === "pglite";

/** Đồng hồ cố định: 07:40 Thứ Bảy 03/10/2026, giữa buổi sinh hoạt tuần 5. Test không phụ thuộc ngày chạy. */
export const NOW = Date.parse("2026-10-03T07:40:00+07:00");
export const CLUB = "cau-long-san-nha";
export const COL = "quy-fall-2026";

export interface Reply {
  status: number;
  // Test đọc tự do các trường của kết quả; kiểu chính xác của từng API nằm ở src/contract.ts.
  body: any;
  /** Cookie máy chủ đặt ("tên=giá trị", bỏ thuộc tính) và địa chỉ chuyển hướng, để test luồng đăng nhập. */
  cookies: string[];
  location: string | null;
}

/** env: biến môi trường thêm vào (ví dụ AUTH_MODE, GOOGLE_CLIENT_ID); exchangeGoogleCode: Google giả.
 *  db: dùng cơ sở dữ liệu này (test riêng phần lưu); không truyền thì theo WITH_DB. */
export async function startServer(opts: { env?: Record<string, string>; exchangeGoogleCode?: ExchangeGoogleCode; db?: Db } = {}) {
  const db = opts.db ?? (WITH_DB ? await createPgliteDb() : undefined);
  const store: Store = db ? await createDbStore(db) : createStore();
  const sessions: Sessions = db ? await createDbSessions(db, () => NOW) : createSessions(() => NOW);
  const accounts: Accounts = db ? await createDbAccounts(db) : createAccounts();
  const config = loadConfig({ AUTH_MODE: "demo", QR_SECRET: "khoa-chi-de-test", WEB_ORIGIN: "http://localhost:3000", ...opts.env });
  // Dữ liệu mẫu có sẵn một kịch bản bàn giao hộ; test cần dữ liệu không có đơn nào nên bỏ nó ở lần dựng đầu và mỗi lần đặt lại (test kịch bản mẫu tự nạp lại bằng createSeed).
  const stripScenario = (s: AppState): AppState => ({ ...s, roleHandovers: [], evidence: [], notifications: s.notifications.filter((n) => !n.kind.startsWith("role-handover")) });
  store.update(stripScenario);
  const resetStore = store.reset.bind(store);
  store.reset = () => { resetStore(); store.update(stripScenario); };
  let clock = NOW; // đồng hồ của máy chủ; test đổi bằng setNow để thử việc phụ thuộc thời gian (ví dụ 3 ngày chờ)
  const app = createApp({ config, store, sessions, accounts, now: () => clock, exchangeGoogleCode: opts.exchangeGoogleCode });
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

  async function call(method: string, path: string, opts: { as?: string; body?: unknown; raw?: string; headers?: Record<string, string>; cookie?: string } = {}): Promise<Reply> {
    const headers: Record<string, string> = { ...opts.headers };
    if (opts.as) headers["X-Demo-User"] = opts.as;
    if (opts.cookie) headers.Cookie = opts.cookie;
    if (opts.body !== undefined || opts.raw !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(base + path, { method, headers, redirect: "manual", body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)) });
    const text = await res.text();
    const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0]);
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, body, cookies, location: res.headers.get("location") };
  }

  return {
    store,
    sessions,
    accounts,
    db,
    config,
    base,
    call,
    setNow: (ms: number) => { clock = ms; },
    /** Mã QR đúng của buổi tại thời điểm NOW; offset âm là mã của các bước 30 giây trước đó. */
    qr: (eventId: string, offset = 0) => qrToken(config.qrSecret, eventId, qrStep(NOW) + offset),
    close: async () => {
      await new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      });
      // Chờ các lần ghi đang dở; cơ sở dữ liệu do test truyền vào thì test tự đóng.
      await Promise.allSettled([store.persisted(), sessions.persisted(), accounts.persisted()]);
      if (db && !opts.db) await db.close();
    },
  };
}

export type TestServer = Awaited<ReturnType<typeof startServer>>;

/** Tạo CSV đúng mẫu: dòng tiêu đề rồi các dòng giao dịch. */
export function csv(rows: string[][]): string {
  const cell = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return ["Ngày,Số tiền,Người chuyển,Nội dung", ...rows.map((r) => r.map(cell).join(","))].join("\n");
}

/**
 * Đợt bàn giao cả ban đang ở giữa chừng (bước 4: đã chọn ban mới, chốt số dư, kiểm kho), như dữ liệu mẫu trước 09/11/2026.
 * Dữ liệu mẫu hiện nay bắt đầu ở bước 1, nên test nào cần đợt bàn giao đã đi một đoạn thì gọi hàm này sau khi đặt lại dữ liệu.
 */
export function useMidHandover(srv: { store: Store }): void {
  srv.store.update((s) => ({
    ...s,
    handovers: [{
      clubId: CLUB, fromTerm: "Fall 2026", toTerm: "Spring 2027", step: 4, lockedBalance: 3_120_000, lockedAt: "2026-10-10T20:00:00+07:00",
      newBoard: { president: "a017", vice: "a003", treasurer: "a006", heads: [{ department: "Hậu cần", personId: "a005" }, { department: "Chuyên môn", personId: "a008" }] },
      newReceiver: { personId: "a006", bank: "", account: "" }, transferred: [],
      history: [
        { at: "2026-10-10T19:40:00+07:00", by: "a001", text: "chọn ban mới: chủ nhiệm Nguyễn Minh Anh" },
        { at: "2026-10-10T20:00:00+07:00", by: "a001", text: "chốt số dư 3.120.000 ₫" },
        { at: "2026-10-10T20:05:00+07:00", by: "a001", text: "kiểm tra kho bàn giao: 5 biểu mẫu, 3 quy trình, 5 tài khoản, 1 mục thiếu" },
      ],
    }],
  }));
}
