"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon, type IconName } from "./Icon";

/** Chép chữ vào bộ nhớ tạm. Trả về false khi trình duyệt không cho chép. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Trình duyệt không cho dùng clipboard (ví dụ mở qua địa chỉ http trong mạng LAN): dùng cách cũ.
    const prev = document.activeElement as HTMLElement | null;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    prev?.focus();
    return ok;
  }
}

/** Nút sao chép. Chữ trên nút không đổi; kết quả báo bằng thông báo ngắn (Sonner đọc được bằng trình đọc màn hình). */
/** className: lớp nút của Lịch bloc, ví dụ "l-btn2", hoặc "l-icon-btn" khi chỉ có biểu tượng. */
export function CopyButton({ text, label, notice = "Đã sao chép.", className, iconOnly = false, icon = "copy" }: {
  text: string; label: string; notice?: string; className: string; iconOnly?: boolean; icon?: IconName;
}) {
  // Chép xong: biểu tượng thành dấu tích trong 1,5 giây (chữ trên nút không đổi; câu báo nằm ở thông báo ngắn).
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1500);
    return () => clearTimeout(t);
  }, [done]);
  async function onClick() {
    if (await copyText(text)) {
      setDone(true);
      toast.success(notice);
    } else toast.error("Trình duyệt chặn việc sao chép. Mở trang bằng Chrome hoặc Safari rồi thử lại.");
  }
  if (iconOnly) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={label}>
        <Icon name={done ? "check" : "copy"} />
      </button>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      <Icon name={done ? "check" : icon} size={16} />
      {label}
    </button>
  );
}
