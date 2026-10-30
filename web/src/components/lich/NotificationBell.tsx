"use client";

// Chuông thông báo của mọi vai (Hiệu yêu cầu 30/10/2026: thấy ở mọi nơi). Bấm mở danh sách thông báo của chính mình, mới nhất trước.
// Số chưa đọc nằm trong ô xanh mực (đỏ chỉ dành cho tờ lịch hôm nay và hạn gấp). Thông báo giữ lại cả khi vai đã đổi:
// chủ nhiệm cũ bị đưa ra khỏi ban điều hành thì hộp tự mở để thấy "Bàn giao xong" (BoardFrame đặt cờ OPEN_BELL_KEY).
// Hỏi lại máy chủ mỗi 3 giây (chưa phải đẩy tức thời); thông báo mới tới lúc đang xem thì hiện thêm một dòng nhắc nhỏ.

import { useRouter } from "next/navigation";
import { Popover as P } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { NotificationDto } from "@contract";
import { useNotifications, useReadNotifications } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { dm, hm } from "@/lib/format";

/** Cờ trong sessionStorage: trang kế tiếp tự mở hộp thông báo một lần. */
export const OPEN_BELL_KEY = "campushub.bell.open";

export function NotificationBell({ side = "bottom", align = "end" }: { side?: "top" | "bottom"; align?: "start" | "end" }) {
  const router = useRouter();
  const query = useNotifications();
  const read = useReadNotifications();
  const [open, setOpen] = useState(false);
  const data = query.data;
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    // Lần tải đầu chỉ ghi nhớ; từ lần sau, thông báo chưa đọc mới tới thì nhắc nhỏ.
    if (seen.current) {
      for (const n of data.items) if (!n.read && !seen.current.has(n.id)) toast(n.title);
    }
    seen.current = new Set(data.items.map((n) => n.id));
  }, [data]);

  // Vừa bị đưa ra khỏi ban điều hành (cờ do BoardFrame đặt): tải lại danh sách rồi mở hộp, để thấy ngay "Bàn giao xong".
  const refetch = query.refetch;
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(OPEN_BELL_KEY)) return;
      sessionStorage.removeItem(OPEN_BELL_KEY);
    } catch {
      return; // Trình duyệt chặn sessionStorage: hộp không tự mở, thông báo vẫn nằm trong chuông.
    }
    void refetch().then(() => setOpen(true));
  }, [refetch]);

  if (!data) return null;
  const unread = data.unread;

  function openItem(n: NotificationDto) {
    if (!n.read) read.mutate([n.id]);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger asChild>
        <button type="button" className="l-bell" data-tour="bell" aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}>
          <Icon name="bell" size={20} />
          {unread > 0 && <span className="l-bell-cnt" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </P.Trigger>
      <P.Portal>
        <P.Content className="l-notif" side={side} align={align} sideOffset={8} collisionPadding={12} aria-label="Thông báo">
          <div className="l-notif-head">
            <h2>Thông báo</h2>
            {unread > 0 && <button type="button" className="l-linkbtn" aria-busy={read.isPending || undefined} onClick={() => read.mutate(undefined)}>Đánh dấu đã đọc hết</button>}
          </div>
          {data.items.length === 0 ? (
            <p className="l-fine l-notif-empty">Chưa có thông báo nào.</p>
          ) : (
            <ul className="l-notif-list">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`l-notif-item${n.read ? "" : " unread"}`} onClick={() => openItem(n)}>
                    <span className="l-notif-title">{!n.read && <span className="l-notif-dot" aria-label="Chưa đọc" />}{n.title}</span>
                    <span className="l-notif-body">{n.body}</span>
                    <span className="l-meta">{dm(n.at)} · {hm(n.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
