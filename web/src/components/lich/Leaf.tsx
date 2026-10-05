// Tờ lịch: dải tháng ở trên, số ngày cỡ lớn, dòng nhỏ ở dưới (thứ trong tuần, hoặc số ngày còn lại tới hạn).
// Đỏ chỉ dành cho hôm nay và hạn gấp.

import { ViewTransition } from "react";
import { daysAgo, dmy, longDate, weekday } from "@/lib/format";

/** Số ngày lịch (giờ Việt Nam) từ hôm nay tới `t`: 0 là hôm nay, âm là đã qua. */
export function daysLeft(t: string | number | Date, now: number = Date.now()): number {
  return -daysAgo(t, now);
}

/** "còn 7 ngày", "hạn hôm nay", "quá hạn 2 ngày" */
export function dueLabel(t: string | number | Date): string {
  const n = daysLeft(t);
  if (n > 0) return `còn ${n} ngày`;
  if (n === 0) return "hạn hôm nay";
  return `quá hạn ${-n} ngày`;
}

/** Hạn còn 3 ngày trở xuống (hoặc đã quá hạn) thì tờ lịch chuyển đỏ. */
export const isUrgent = (t: string | number | Date) => daysLeft(t) <= 3;

export function Leaf({ date, sub, size, tone, label }: {
  date: string | number | Date;
  /** Dòng dưới số ngày; bỏ trống thì là thứ trong tuần. */
  sub?: string;
  size?: "xl" | "md";
  tone?: "today" | "urgent";
  /** Câu đầy đủ cho trình đọc màn hình, ví dụ "Hạn đóng 10/10/2026, còn 7 ngày". */
  label?: string;
}) {
  const [day, month, year] = dmy(date).split("/");
  const band = size === "xl" ? `Tháng ${Number(month)}, ${year}` : `Tháng ${Number(month)}`;
  return (
    <span className={["l-leaf", size, tone].filter(Boolean).join(" ")} role="img" aria-label={label ?? `${weekday(date)} ${dmy(date)}`}>
      <span className="l-leaf-band" aria-hidden="true">{band}</span>
      <span className="l-leaf-day" aria-hidden="true">{day}</span>
      <span className="l-leaf-sub" aria-hidden="true">{sub ?? weekday(date)}</span>
    </span>
  );
}

/** Tờ lịch hôm nay mở đầu mỗi màn. Cùng tên chuyển cảnh "l-today": khi chuyển trang (ví dụ đăng nhập xong vào trang chủ),
 *  trình duyệt dời đúng tờ lịch này sang chỗ mới thay vì xóa đi vẽ lại. */
export function TodayLeaf({ size = "xl" }: { size?: "xl" | "md" }) {
  const now = Date.now();
  return (
    <ViewTransition name="l-today" share="l-morph" default="none">
      <Leaf date={now} size={size} tone="today" label={`Hôm nay, ${longDate(now)}`} />
    </ViewTransition>
  );
}
