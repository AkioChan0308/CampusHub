import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TourHost } from "@/components/lich/Tour";

// Ghi lại template của layout gốc: nếu title là chuỗi thì các layout con bên dưới mất đuôi "· CampusHub".
export const metadata: Metadata = { title: { default: "Trang chủ CLB", template: "%s · CampusHub" } };

// TourHost ở đây (không ở từng trang) để hướng dẫn đi qua nhiều trang của CLB mà không bị dựng lại.
export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}<TourHost /></>;
}
