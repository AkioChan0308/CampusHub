"use client";

import { LichGate } from "@/components/lich/Gate";

/** Trang bị lỗi lúc chạy. Bản vẽ chưa có trạng thái này: dùng trang chặn của Lịch bloc. */
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <LichGate title="Trang bị lỗi khi mở" text="Tải lại trang để thử lần nữa.">
      <button type="button" className="l-btn" onClick={retry}>Tải lại trang</button>
    </LichGate>
  );
}
