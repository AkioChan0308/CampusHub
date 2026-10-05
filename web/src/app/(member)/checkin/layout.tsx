import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Quét mã điểm danh" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
