// Lỗi trả về cho web. Mọi lỗi có mã (để web xử lý) và câu tiếng Việt (để hiện cho người dùng).

import type { ErrorCode } from "./contract.ts";

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const unauthenticated = (message = "Bạn cần đăng nhập.") => new HttpError(401, "UNAUTHENTICATED", message);
export const forbidden = (message: string) => new HttpError(403, "FORBIDDEN", message);
export const notFound = (message: string) => new HttpError(404, "NOT_FOUND", message);
export const invalid = (message: string, details?: Record<string, unknown>) => new HttpError(400, "VALIDATION", message, details);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);
