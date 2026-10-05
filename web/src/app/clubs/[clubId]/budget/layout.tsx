import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Dự trù kinh phí kỳ" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
