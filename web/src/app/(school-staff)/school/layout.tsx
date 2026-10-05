import type { Metadata } from "next";
import type { ReactNode } from "react";

// Ghi lại template của layout gốc: nếu title là chuỗi thì trang chi tiết CLB bên dưới mất đuôi "· CampusHub".
export const metadata: Metadata = { title: { default: "Các CLB của trường", template: "%s · CampusHub" } };

// Dựng lúc có người mở trang, không dựng sẵn lúc build: đầu màn có tờ lịch hôm nay,
// dựng sẵn thì trang mang ngày build và lệch với ngày trên máy người dùng.
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
