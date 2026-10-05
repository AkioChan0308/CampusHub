import type { Api, EndpointId } from "../contract.ts";
import type { Config } from "../config.ts";
import type { AppState, Person, Update } from "../domain.ts";
import type { ExchangeGoogleCode } from "../google.ts";
import type { Sessions } from "../sessions.ts";

/** Những gì một handler được dùng. Handler không đụng tới req/res của Express, để dễ test và dễ đổi framework. */
export interface Ctx<K extends EndpointId> {
  /** Người đang đăng nhập. API công khai mà đọc tới đây sẽ bị trả 401. */
  readonly me: Person;
  params: Api[K]["params"];
  query: Record<string, unknown>;
  body: unknown;
  /** Dữ liệu hiện tại; đọc lại sau mỗi lần `update`. */
  readonly state: AppState;
  update(fn: Update): AppState;
  /** Thời điểm hiện tại (mili giây) và dạng ISO giờ Việt Nam. */
  now(): number;
  nowIso(): string;
  config: Config;
  resetStore(): void;
  /** Chỉ các API đăng nhập dùng: cookie, phiên, lượt đăng nhập Google đang dở. */
  auth: AuthKit;
}

export interface AuthKit {
  cookie(name: string): string | undefined;
  setCookie(name: string, value: string, maxAgeSeconds: number): void;
  clearCookie(name: string): void;
  /** Mở phiên cho người này và đặt cookie phiên. */
  startSession(personId: string): void;
  /** Xóa phiên hiện tại (nếu có) và cookie phiên. */
  endSession(): void;
  sessions: Sessions;
  exchangeGoogleCode: ExchangeGoogleCode;
}

export type Handler<K extends EndpointId> = (ctx: Ctx<K>) => Api[K]["res"] | Promise<Api[K]["res"]>;

/** Đủ một handler cho mỗi API trong contract.ts. Thiếu API nào thì TypeScript báo lỗi. */
export type Handlers = { [K in EndpointId]: Handler<K> };
