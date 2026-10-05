"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Chuyển động dùng chung: chỉ tải phần hiệu ứng cho DOM (nhẹ cho điện thoại mở link trong Zalo, Messenger),
 *  mặc định 200 ms, không nảy, và tắt khi máy đã bật giảm chuyển động. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: "easeOut" }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
