// Gọi API của máy chủ. Đường dẫn và kiểu dữ liệu theo server/src/contract.ts (bản để đọc: docs/api.md).
// Cookie phiên tự đi kèm vì web và API cùng địa chỉ (next.config.ts chuyển tiếp /api/v1 sang máy chủ).

import type { ApiErrorBody, ErrorCode } from "@contract";

export const API = "/api/v1";

// Chỉ ở bản demo: một tab gọi API bằng vai khác (header X-Demo-User), không đổi phiên đăng nhập của các tab khác.
// Dùng cho "thử điểm danh với vai" ở màn chiếu QR. Máy chủ chạy chế độ google thì bỏ qua header này.
const TAB_USER_KEY = "campushub-demo-as";

export function setTabDemoUser(personId: string | null): void {
  try {
    if (personId) sessionStorage.setItem(TAB_USER_KEY, personId);
    else sessionStorage.removeItem(TAB_USER_KEY);
  } catch {
    // Trình duyệt chặn sessionStorage: tab này dùng phiên đăng nhập chung.
  }
}

function tabDemoUser(): string | null {
  try {
    return sessionStorage.getItem(TAB_USER_KEY);
  } catch {
    return null;
  }
}

/** Lỗi API: `code` để web xử lý, `message` là câu tiếng Việt hiện thẳng cho người dùng. */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: ErrorCode | "NETWORK", message: string, readonly details?: Record<string, unknown>) {
    super(message);
  }
}

async function request<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const asUser = tabDemoUser();
    if (asUser) headers["X-Demo-User"] = asUser;
    res = await fetch(API + path, {
      method,
      credentials: "same-origin",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    // Không có thân lỗi dạng JSON: thường là máy chủ chưa chạy (Next trả lỗi khi chuyển tiếp).
    if (!error) throw new ApiError(res.status, "INTERNAL", "Máy chủ CampusHub chưa chạy hoặc đang lỗi. Thử lại sau.");
    throw new ApiError(res.status, error.code, error.message, error.details);
  }
  return data as T;
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
export const apiPut = <T>(path: string, body?: unknown) => request<T>("PUT", path, body);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
