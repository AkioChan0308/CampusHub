// Chạy trên máy chủ web trước khi vẽ trang (Next 16 gọi là "proxy", trước đây là middleware).
// Trang đầu "/" là landing cho người chưa đăng nhập. Ai đã có cookie phiên thì chuyển ngay sang /login?xong=1
// (trang đó đưa về đúng trang theo vai), để người đã đăng nhập không thấy landing nháy lên rồi mới chuyển.
// Cookie hết hạn thì /login hiện ô đăng nhập như thường.

import { NextResponse, type NextRequest } from "next/server";

/** Tên cookie phiên do máy chủ API đặt (server/src/sessions.ts, SESSION_COOKIE). */
const SESSION_COOKIE = "ch_session";

export function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.redirect(new URL("/login?xong=1", request.url));
  return NextResponse.next();
}

export const config = { matcher: "/" };
