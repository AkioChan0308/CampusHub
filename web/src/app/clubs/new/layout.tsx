import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Tạo CLB mới" };

// Dựng lúc có người mở trang, không dựng sẵn lúc build: đầu màn có tờ lịch hôm nay.
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
