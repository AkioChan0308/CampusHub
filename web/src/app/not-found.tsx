import type { Metadata } from "next";
import Link from "next/link";
import { LichGate } from "@/components/lich/Gate";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/** Đường dẫn không có. Bản vẽ chưa có trạng thái này: dùng trang chặn của Lịch bloc. */
export default function NotFound() {
  return (
    <LichGate title="Không tìm thấy trang" text="Đường dẫn này không có trong bản demo.">
      <Link className="l-btn" href="/">Về trang đầu</Link>
    </LichGate>
  );
}
