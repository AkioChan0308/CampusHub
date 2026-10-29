"use client";

// Hỏi lại hai bước cho việc không hoàn tác được (Hiệu yêu cầu 29/10/2026, ví dụ ban mới xác nhận bàn giao làm đổi vai trò cả ban):
// bước một là bấm nút mở hộp hỏi, bước hai là gõ đúng cụm từ (không phân biệt hoa thường và dấu) thì nút xác nhận mới bấm được.
// Ô gõ nhận focus khi mở hộp (không phải nút xác nhận), để Enter lỡ tay không xác nhận được. body là phần mô tả hậu quả trong hộp.
// Việc nhẹ hơn dùng LichConfirm (Confirm.tsx).

import { AlertDialog as D } from "radix-ui";
import { useRef, useState, type ReactNode } from "react";
import { toAsciiUpper } from "@/lib/text";

export function TypedConfirm({ className, children, title, body, phrase, confirm, onConfirm, busy = false }: {
  className: string; children: ReactNode; title: string; body: ReactNode; phrase: string; confirm: string; onConfirm: () => void;
  /** Đang gửi lên máy chủ: nút hiện vòng xoay và không mở lại hộp hỏi. */
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const match = toAsciiUpper(typed.trim()) === toAsciiUpper(phrase);
  return (
    <D.Root open={open} onOpenChange={(next) => { if (next && busy) return; if (next) setTyped(""); setOpen(next); }}>
      <D.Trigger asChild>
        <button type="button" className={className} aria-busy={busy || undefined}>{children}</button>
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="l-dialog-overlay" />
        <D.Content className="l-dialog l-dialog-danger" onOpenAutoFocus={(e) => { e.preventDefault(); input.current?.focus(); }}>
          <div>
            <D.Title asChild><h2>{title}</h2></D.Title>
            <D.Description asChild><div className="l-dialog-body">{body}</div></D.Description>
          </div>
          <div className="l-field">
            <label className="l-flabel" htmlFor="typed-confirm">Gõ <strong>{phrase}</strong> để xác nhận</label>
            <input id="typed-confirm" ref={input} className="l-input" value={typed} autoComplete="off" spellCheck={false} onChange={(e) => setTyped(e.target.value)} />
          </div>
          <div className="l-dialog-actions">
            <D.Cancel className="l-btn2">Hủy</D.Cancel>
            <D.Action className="l-btn l-btn-warn" disabled={!match} onClick={(e) => { if (!match) { e.preventDefault(); return; } onConfirm(); }}>{confirm}</D.Action>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
