"use client";

// Bong bóng chat của trang chung (Hiệu yêu cầu 29/10/2026): nút tròn ở góc phải dưới, bấm thì khung chat mở lên phía trên nó.
// KHUNG MẪU (Hiệu chọn: phần nặng chỉ làm khung và ghi "đang phát triển"): có đủ khung, ô viết và nút gửi khóa kèm lý do nhìn thấy được.
// Các nút "Nhắn cho CLB" (ChatButton) mở cùng khung, đề tên CLB. Khung là hộp thoại không chặn trang: Esc hoặc nút đóng thì đóng,
// đóng thì focus về chỗ đã mở. Mỗi màn dựng khung riêng (PhoneFrame), nên đổi trang thì khung chat đóng; làm thật thì nâng lên layout dùng chung.
// Mô tả: docs/mo-ta-bang-tin-chung.md, mục 3.5.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

export interface ChatTarget { id: string; name: string }

const ChatCtx = createContext<{ open: (to?: ChatTarget) => void } | null>(null);

export function useChat() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat và ChatButton phải nằm trong khung của trang chung (PhoneFrame có thanh tab của trang chung)");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  const [to, setTo] = useState<ChatTarget | undefined>();
  const returnTo = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLElement>(null);
  const fab = useRef<HTMLButtonElement>(null);

  const open = useCallback((target?: ChatTarget) => {
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTo(target);
    setShown(true);
  }, []);
  const close = useCallback(() => {
    setShown(false);
    // Chỗ đã mở không còn trong trang (ví dụ nút của màn vừa đổi) thì focus về bong bóng.
    (returnTo.current?.isConnected ? returnTo.current : fab.current)?.focus();
    returnTo.current = null;
  }, []);

  // Mở thì đưa focus vào khung, để bàn phím và trình đọc màn hình biết khung vừa hiện. Esc ở đâu trong trang cũng đóng được,
  // trừ khi Esc đó đã đóng một hộp thoại khác (Radix đã gọi preventDefault).
  useEffect(() => {
    if (!shown) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown, to, close]);

  return (
    <ChatCtx.Provider value={{ open }}>
      {children}
      {/* Tên cố định "Tin nhắn"; trạng thái mở nằm ở aria-expanded, để trình đọc màn hình không đọc trạng thái hai lần. */}
      <button ref={fab} type="button" className="l-chatfab" aria-label="Tin nhắn" aria-expanded={shown} aria-controls={shown ? "chat-panel" : undefined} onClick={() => (shown ? close() : open())}>
        <Icon name={shown ? "close" : "message"} size={26} />
      </button>
      {shown && (
        <section id="chat-panel" ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="chat-title" className="l-chatw">
          <header className="l-chatw-head">
            <h2 id="chat-title">{to ? `Nhắn cho ${to.name}` : "Tin nhắn"}</h2>
            <span className="l-tag warn">Đang phát triển</span>
            <button type="button" className="l-chatw-x" aria-label="Đóng khung chat" onClick={close}><Icon name="close" size={20} /></button>
          </header>
          <div className="l-chatw-body">
            <strong>Tính năng nhắn tin đang phát triển</strong>
            <p className="l-fine">Khi xong, bạn nhắn trực tiếp với ban điều hành của từng CLB ngay tại đây. Hiện bạn liên hệ CLB qua Zalo hoặc Facebook ở phần giới thiệu của CLB.</p>
          </div>
          <div className="l-chatw-bar">
            <input className="l-input" disabled aria-label="Tin nhắn cho ban điều hành" aria-describedby="chat-unavailable" placeholder="Viết tin nhắn" />
            <button type="button" className="l-btn" disabled aria-describedby="chat-unavailable">Gửi</button>
          </div>
          <p id="chat-unavailable" className="l-note l-chatw-note">Chưa gửi được: tính năng đang phát triển.</p>
        </section>
      )}
    </ChatCtx.Provider>
  );
}

/** Nút "Nhắn cho CLB": mở khung chat, đề tên CLB. Phải nằm trong khung của trang chung (PhoneFrame có thanh tab của trang chung). */
export function ChatButton({ to, className, children }: { to: ChatTarget; className?: string; children: ReactNode }) {
  const chat = useChat();
  return <button type="button" className={className} onClick={() => chat.open(to)}>{children}</button>;
}
