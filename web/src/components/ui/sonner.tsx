"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Icon } from "@/components/Icon";

// Sonner tự chèn CSS riêng; màu, bo góc và chữ của thông báo đặt ở lich.css ([data-sonner-toast]).

/** Màn rộng (laptop) hay không. Lần vẽ đầu coi là hẹp, để máy chủ và trình duyệt vẽ giống nhau. */
function useWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

/** Thông báo ngắn, ví dụ "Đã sao chép". Điện thoại: ở giữa phía trên, vì nút chính và menu nằm ở đáy màn.
 *  Laptop: góc dưới bên phải, để không che tiêu đề trang. */
function Toaster(props: ToasterProps) {
  const wide = useWide();
  return (
    <Sonner
      theme="light"
      position={wide ? "bottom-right" : "top-center"}
      duration={2500}
      visibleToasts={1}
      icons={{ success: <Icon name="check" size={18} />, error: <Icon name="alert" size={18} /> }}
      {...props}
    />
  );
}

export { Toaster };
