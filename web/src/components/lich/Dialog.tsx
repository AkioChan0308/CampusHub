"use client";

// Hộp nhập liệu kiểu Lịch bloc (Radix Dialog): mở bằng nút ở màn, đóng bằng Esc, nút Hủy hoặc bấm ra ngoài.
// Đóng hộp thì focus về lại nút đã mở nó. Nội dung (form và các nút) do màn truyền vào.

import { Dialog as D } from "radix-ui";
import type { ReactNode } from "react";

export function LichDialog({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="l-dialog-overlay" />
        {/* Không có câu mô tả thì báo cho Radix biết (aria-describedby={undefined}), để nó không cảnh báo thiếu mô tả. */}
        <D.Content className="l-dialog l-dialog-form" {...(description ? {} : { "aria-describedby": undefined })}>
          <div>
            <D.Title asChild><h2>{title}</h2></D.Title>
            {description && <D.Description asChild><p>{description}</p></D.Description>}
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Nút "Hủy" trong hộp: đóng hộp. */
export const DialogClose = D.Close;
