/** Link đầy đủ (kèm tên miền) để chép vào nhóm Zalo hoặc nhúng vào mã QR. Chỉ gọi ở trình duyệt. */
export function appUrl(path: string): string {
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).href;
}
