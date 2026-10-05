import type { ReactNode } from "react";

// Dựng lúc có người mở trang, không dựng sẵn lúc build: đầu màn có tờ lịch hôm nay,
// dựng sẵn thì trang mang ngày build và lệch với ngày trên máy người dùng.
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
