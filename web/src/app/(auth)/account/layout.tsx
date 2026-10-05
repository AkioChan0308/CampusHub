import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Tên tài khoản và mật khẩu" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
