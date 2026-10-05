"use client";

// Chuyển động của thế giới "Lịch bloc": chỉ để cho thấy cái gì vừa đổi, 150–250 ms, tắt khi máy bật giảm chuyển động
// (lich.css có luật prefers-reduced-motion; Motion dùng reducedMotion="user" trong MotionProvider).

import { useLinkStatus } from "next/link";
import * as m from "motion/react-m";
import { useRef, ViewTransition, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";

/** Bọc cả trang: khi chuyển trang, trang cũ mờ đi nhanh, trang mới hiện dần và nhích lên 6px (CSS: .l-enter, .l-exit). */
export function LichPage({ children }: { children: ReactNode }) {
  return <ViewTransition enter="l-enter" exit="l-exit" default="none">{children}</ViewTransition>;
}

/** Đã từng hiện khung xương trong lần mở màn này chưa. Có thì nội dung hiện dần; dữ liệu có sẵn thì hiện ngay, không nháy. */
export function useSawPending(pending: boolean): boolean {
  const saw = useRef(pending);
  if (pending) saw.current = true;
  return saw.current;
}

/** Nội dung thay chỗ khung xương: hiện dần 200 ms. */
export function Reveal({ from, className, children }: { from: boolean; className?: string; children: ReactNode }) {
  return (
    <m.div className={className} initial={from ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      {children}
    </m.div>
  );
}

/** Một thanh giữ chỗ trong khung xương. */
export function Skel({ w, h = 14, className, style }: { w: number | string; h?: number; className?: string; style?: CSSProperties }) {
  return <span className={className ? `l-skel ${className}` : "l-skel"} style={{ width: w, height: h, ...style }} aria-hidden="true" />;
}

/** Thanh giữ chỗ nằm trong dòng chữ: đặt trong đúng thẻ chữ của trang thật (ví dụ .l-cell-value), nên dòng cao đúng bằng chữ thật,
 *  dữ liệu tới thì không có gì bị xô. */
export function SkelLine({ w }: { w: number | string }) {
  return <span className="l-skel l-skel-line" style={{ width: w }} aria-hidden="true" />;
}

/** Tờ lịch nhỏ đang tải: dựng bằng chính khung tờ lịch, chữ trong suốt, nên đúng kích thước tờ lịch thật. */
export function LeafSkel({ sub = "còn 7 ngày" }: { sub?: string }) {
  return (
    <span className="l-leaf l-leaf-skel" aria-hidden="true">
      <span className="l-leaf-band">Tháng 10</span>
      <span className="l-leaf-day">00</span>
      <span className="l-leaf-sub">{sub}</span>
    </span>
  );
}

/** Vùng khung xương: trình đọc màn hình đọc "Đang tải", mắt thấy các thanh giữ chỗ. */
export function Loading({ className, label = "Đang tải…", children }: { className?: string; label?: string; children: ReactNode }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="l-sr">{label}</span>
      {children}
    </div>
  );
}

/** Vòng xoay nhỏ, cỡ theo chữ. */
export function Spinner() {
  return <span className="l-spin" aria-hidden="true" />;
}

/** Đặt trong <Link>: hiện vòng xoay khi đã bấm mà trang mới chưa mở. Luôn giữ chỗ để không xô chữ bên cạnh. */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return <span className={`l-link-pending${pending ? " on" : ""}${className ? ` ${className}` : ""}`} aria-hidden="true"><span className="l-spin" /></span>;
}

/** Biểu tượng của một <Link>: bấm rồi mà trang mới chưa mở thì vòng xoay hiện đúng chỗ biểu tượng, không xô chữ. */
export function LinkIcon({ name, size, className }: { name: IconName; size?: number; className?: string }) {
  return <span className={className ? `l-ico ${className}` : "l-ico"}><Icon name={name} size={size} /><LinkPending /></span>;
}
