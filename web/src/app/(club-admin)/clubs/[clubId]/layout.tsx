import type { Metadata } from "next";
import type { ReactNode } from "react";

// Ghi lại template của layout gốc: nếu title là chuỗi thì các layout con bên dưới mất đuôi "· CampusHub".
export const metadata: Metadata = { title: { default: "Trang chủ CLB", template: "%s · CampusHub" } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
