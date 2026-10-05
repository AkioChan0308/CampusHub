// Định dạng tiền, ngày giờ theo giờ Việt Nam (UTC+7, không đổi giờ mùa hè).
// Tính bằng cách cộng 7 giờ rồi đọc theo UTC, để máy chủ và trình duyệt ra cùng một kết quả.

const VN_OFFSET = 7 * 3600_000;
const nf = new Intl.NumberFormat("vi-VN");
const p2 = (n: number) => String(n).padStart(2, "0");
const WEEKDAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function vn(t: string | number | Date): Date {
  return new Date(new Date(t).getTime() + VN_OFFSET);
}

/** 3120000 → "3.120.000 ₫"; số âm dùng dấu trừ "−". */
export function money(n: number): string {
  return `${n < 0 ? "−" : ""}${nf.format(Math.abs(n))} ₫`;
}

/** 3120000 → "3.120.000" (không kèm ₫, dùng trong bảng có ghi đơn vị ở đầu cột). */
export function num(n: number): string {
  return `${n < 0 ? "−" : ""}${nf.format(Math.abs(n))}`;
}

export function dmy(t: string | number | Date): string {
  const d = vn(t);
  return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

export function dm(t: string | number | Date): string {
  const d = vn(t);
  return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth() + 1)}`;
}

export function hm(t: string | number | Date): string {
  const d = vn(t);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}

export function weekday(t: string | number | Date): string {
  return WEEKDAY[vn(t).getUTCDay()];
}

/** Số ngày lịch (theo giờ Việt Nam) từ `t` tới `now`. */
export function daysAgo(t: string | number | Date, now: number = Date.now()): number {
  const a = vn(t);
  const b = vn(now);
  const da = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const db = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((db - da) / 86400_000);
}

export function agoLabel(t: string | number | Date): string {
  const n = daysAgo(t);
  if (n <= 0) return "hôm nay";
  if (n === 1) return "hôm qua";
  return `${n} ngày trước`;
}

/** Thời điểm hiện tại dạng ISO có múi giờ +07:00, dùng để lưu. */
export function nowIso(now: number = Date.now()): string {
  const d = vn(now);
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}T${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}+07:00`;
}

/** "Thứ Sáu 02/10/2026" */
export function longDate(t: string | number | Date): string {
  return `${weekday(t)} ${dmy(t)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts.slice(-2);
  return last.map((w) => w[0]).join("").toUpperCase();
}
