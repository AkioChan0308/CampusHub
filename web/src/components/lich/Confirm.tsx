"use client";

// Nút phải hỏi lại trước khi làm.
// Hộp hỏi có nút "Hủy" (nhận focus khi mở) và nút xác nhận. Đóng hộp thì focus về lại nút;
// focusAfter dùng khi xác nhận xong nút biến mất, để focus không rơi về đầu trang.

import { AlertDialog as D } from "radix-ui";
import { useRef, useState, type ReactNode } from "react";

export function LichConfirm({ className, children, title, description, confirm, onConfirm, disabled, describedBy, focusAfter, busy = false, label }: {
  className: string; children: ReactNode; title: string; description: string; confirm: string; onConfirm: () => void;
  disabled?: boolean; describedBy?: string; focusAfter?: () => void;
  /** Đang gửi lên máy chủ: nút hiện vòng xoay và không mở lại hộp hỏi. */
  busy?: boolean;
  /** Tên đầy đủ của nút cho trình đọc màn hình, khi nhiều nút cùng chữ (ví dụ "Xóa biểu mẫu Mẫu báo cáo"). Chữ đầu nên trùng chữ hiển thị. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const confirmed = useRef(false);
  return (
    <D.Root open={open} onOpenChange={(next) => { if (next && busy) return; if (next) confirmed.current = false; setOpen(next); }}>
      <D.Trigger asChild>
        <button type="button" className={className} disabled={disabled} aria-label={label} aria-describedby={describedBy} aria-busy={busy || undefined}>{children}</button>
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="l-dialog-overlay" />
        <D.Content className="l-dialog" onCloseAutoFocus={(e) => { if (confirmed.current && focusAfter) { e.preventDefault(); focusAfter(); } }}>
          <div>
            <D.Title asChild><h2>{title}</h2></D.Title>
            <D.Description asChild><p>{description}</p></D.Description>
          </div>
          <div className="l-dialog-actions">
            <D.Cancel className="l-btn2">Hủy</D.Cancel>
            <D.Action className="l-btn" onClick={() => { confirmed.current = true; onConfirm(); }}>{confirm}</D.Action>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
