import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Trang chung" };

// Dựng lúc có người mở trang: đầu màn có tờ lịch hôm nay (như các màn thành viên khác).
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
