// Dựng ứng dụng Express từ bảng API trong contract.ts: mỗi dòng của bảng gắn với đúng một handler.

import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { API_PREFIX, ENDPOINTS, type ApiErrorBody, type EndpointId, type ErrorCode, type RedirectRes } from "./contract.ts";
import type { Config } from "./config.ts";
import { nowIso, type Person } from "./domain.ts";
import { HttpError, unauthenticated } from "./errors.ts";
import { googleExchange, type ExchangeGoogleCode } from "./google.ts";
import { aiHandlers } from "./handlers/ai.ts";
import { authHandlers } from "./handlers/auth.ts";
import { boardHandlers } from "./handlers/board.ts";
import { exploreHandlers } from "./handlers/explore.ts";
import { kitHandlers } from "./handlers/kit.ts";
import { meHandlers } from "./handlers/me.ts";
import { moneyHandlers } from "./handlers/money.ts";
import { schoolHandlers } from "./handlers/school.ts";
import { setupHandlers } from "./handlers/setup.ts";
import { systemHandlers } from "./handlers/system.ts";
import { postHandlers } from "./handlers/posts.ts";
import { taskHandlers } from "./handlers/tasks.ts";
import type { AuthKit, Ctx, Handlers } from "./handlers/types.ts";
import { createAccounts, type Accounts } from "./accounts.ts";
import { createSessions, SESSION_COOKIE, SESSION_SECONDS, type Sessions } from "./sessions.ts";
import { createStore, type Store } from "./store.ts";

z.config(z.locales.vi());

export interface AppOptions {
  config: Config;
  store?: Store;
  /** Đồng hồ, để test cố định được thời điểm. */
  now?: () => number;
  sessions?: Sessions;
  accounts?: Accounts;
  /** Test thay bằng hàm giả để không gọi Google thật. */
  exchangeGoogleCode?: ExchangeGoogleCode;
}

const handlers: Handlers = { ...systemHandlers, ...authHandlers, ...meHandlers, ...exploreHandlers, ...boardHandlers, ...moneyHandlers, ...schoolHandlers, ...setupHandlers, ...kitHandlers, ...taskHandlers, ...postHandlers, ...aiHandlers };

export function createApp({ config, store = createStore(), now = Date.now, sessions = createSessions(now), accounts = createAccounts(), exchangeGoogleCode = googleExchange(config, now) }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors(config.webOrigin));
  app.use(express.json({ limit: "3mb" }));

  const router = express.Router();
  for (const id of Object.keys(ENDPOINTS) as EndpointId[]) {
    const meta: { method: string; path: string; auth: string; status?: number; redirect?: true } = ENDPOINTS[id];
    const handler = handlers[id] as unknown as (ctx: Ctx<EndpointId>) => unknown;
    const run = async (req: Request, res: Response) => {
      const cookies = parseCookies(req.get("cookie"));
      const person = meta.auth === "user" ? authenticate(req, cookies, store, sessions, config) : null;
      // Các lần ghi của yêu cầu này. Có cơ sở dữ liệu thì API chỉ trả lời khi mọi lần ghi đã vào cơ sở dữ liệu.
      const writes: Promise<void>[] = [];
      const setCookie = (name: string, value: string, maxAge: number) => res.append("Set-Cookie", serializeCookie(name, value, maxAge, config.cookieSecure));
      const auth: AuthKit = {
        cookie: (name) => cookies[name],
        setCookie,
        clearCookie: (name) => setCookie(name, "", 0),
        startSession: (personId) => {
          sessions.end(cookies[SESSION_COOKIE]);
          setCookie(SESSION_COOKIE, sessions.start(personId), SESSION_SECONDS);
          writes.push(sessions.persisted());
        },
        endSession: () => {
          sessions.end(cookies[SESSION_COOKIE]);
          writes.push(sessions.persisted());
          setCookie(SESSION_COOKIE, "", 0);
        },
        sessions,
        accounts: trackAccounts(accounts, (w) => writes.push(w)),
        exchangeGoogleCode,
      };
      const ctx: Ctx<EndpointId> = {
        get me(): Person {
          if (!person) throw unauthenticated();
          return person;
        },
        params: req.params as Ctx<EndpointId>["params"],
        query: req.query as Record<string, unknown>,
        body: req.body,
        get state() {
          return store.state;
        },
        update: (fn) => {
          const before = store.state;
          const next = store.update(fn);
          if (next !== before) writes.push(store.persisted());
          return next;
        },
        now,
        nowIso: () => nowIso(now()),
        config,
        resetStore: () => {
          store.reset();
          writes.push(store.persisted());
        },
        auth,
      };
      const result = await handler(ctx);
      await Promise.all(writes);
      if (meta.redirect) res.redirect(302, (result as RedirectRes).location);
      else res.status(meta.status ?? 200).json(result);
    };
    if (meta.method === "GET") router.get(meta.path, run);
    else if (meta.method === "POST") router.post(meta.path, run);
    else if (meta.method === "PUT") router.put(meta.path, run);
    else router.delete(meta.path, run);
  }

  app.use(API_PREFIX, router);
  app.use((_req: Request, res: Response) => {
    res.status(404).json(errorBody("NOT_FOUND", "Không có API này."));
  });
  app.use(errorHandler);
  return app;
}

/** Kho tài khoản của một yêu cầu: lần nào đổi tài khoản thì yêu cầu chờ lần ghi đó vào cơ sở dữ liệu rồi mới trả lời. */
function trackAccounts(accounts: Accounts, wrote: (w: Promise<void>) => void): Accounts {
  const changes = <A extends unknown[], R>(fn: (personId: string, ...rest: A) => R) => (personId: string, ...rest: A): R => {
    const before = accounts.get(personId);
    const result = fn(personId, ...rest);
    if (accounts.get(personId) !== before) wrote(accounts.persisted());
    return result;
  };
  return {
    ...accounts,
    ensure: changes(accounts.ensure),
    setCredentials: changes(accounts.setCredentials),
    recordFailure: changes(accounts.recordFailure),
    clearFailures: changes(accounts.clearFailures),
    reset: () => {
      accounts.reset();
      wrote(accounts.persisted());
    },
  };
}

/**
 * Người đang gọi API: theo cookie phiên (đăng nhập Google, hoặc đăng nhập nhanh ở chế độ demo).
 * Chế độ demo còn nhận header X-Demo-User (mã người trong dữ liệu mẫu) cho test, curl và "thử điểm danh với vai" ở màn chiếu QR.
 * Có header thì header được ưu tiên hơn cookie: cookie dùng chung cho mọi tab, còn header chỉ của một tab,
 * nên tab thử điểm danh bằng vai thành viên không làm tab chiếu QR (chủ nhiệm) đổi người. Chế độ google bỏ qua header.
 */
function authenticate(req: Request, cookies: Record<string, string>, store: Store, sessions: Sessions, config: Config): Person {
  const find = (id: string | undefined) => store.state.persons.find((p) => p.id === id);
  const demoId = config.authMode === "demo" ? req.get("x-demo-user") : undefined;
  if (demoId) {
    const person = find(demoId);
    if (!person) throw unauthenticated(`Không có người dùng ${demoId} trong dữ liệu mẫu.`);
    return person;
  }
  const fromSession = find(sessions.personId(cookies[SESSION_COOKIE]));
  if (fromSession) return fromSession;
  throw unauthenticated("Bạn cần đăng nhập.");
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    try {
      cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      // Cookie hỏng thì bỏ qua, coi như chưa đăng nhập.
    }
  }
  return cookies;
}

/** Cookie httpOnly (trang không đọc được bằng JavaScript), SameSite=Lax (trang khác không gửi kèm được khi POST). */
function serializeCookie(name: string, value: string, maxAgeSeconds: number, secure: boolean): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? "; Secure" : ""}`;
}

/** Cho phép web (WEB_ORIGIN) gọi API từ trình duyệt. */
function cors(origin: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.get("origin") === origin) {
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type, X-Demo-User",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        Vary: "Origin",
      });
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

function errorBody(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiErrorBody {
  return { error: { code, message, details } };
}

function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json(errorBody(err.code, err.message, err.details));
    return;
  }
  if (err instanceof z.ZodError) {
    const issues = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    res.status(400).json(errorBody("VALIDATION", issues[0]?.message ?? "Dữ liệu gửi lên không hợp lệ.", { issues }));
    return;
  }
  const e = err as { type?: string };
  if (e?.type === "entity.parse.failed") {
    res.status(400).json(errorBody("VALIDATION", "Dữ liệu gửi lên không phải JSON hợp lệ."));
    return;
  }
  if (e?.type === "entity.too.large") {
    res.status(413).json(errorBody("VALIDATION", "Dữ liệu gửi lên quá lớn."));
    return;
  }
  console.error(err);
  res.status(500).json(errorBody("INTERNAL", "Máy chủ gặp lỗi. Thử lại sau."));
}
