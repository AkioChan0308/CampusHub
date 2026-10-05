// Mã QR điểm danh do máy chủ ký (HMAC-SHA256), đổi mỗi 30 giây, nhận thêm một bước trễ.
// Khác bản demo trên web (tính ngay trong trình duyệt nên đoán được): ở đây không có khóa thì không tạo được mã đúng.

import { createHmac, timingSafeEqual } from "node:crypto";

export const QR_STEP_MS = 30_000;

/** Số thứ tự của bước 30 giây chứa thời điểm `now`. */
export function qrStep(now: number): number {
  return Math.floor(now / QR_STEP_MS);
}

export function qrToken(secret: string, eventId: string, step: number): string {
  return createHmac("sha256", secret).update(`checkin|${eventId}|${step}`).digest("base64url").slice(0, 16);
}

export function verifyQrToken(secret: string, eventId: string, token: string, now: number): boolean {
  const got = Buffer.from(token);
  const step = qrStep(now);
  return [step, step - 1].some((x) => {
    const want = Buffer.from(qrToken(secret, eventId, x));
    return want.length === got.length && timingSafeEqual(want, got);
  });
}
