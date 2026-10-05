import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Thành viên và đơn xin vào" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
