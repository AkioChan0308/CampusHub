"use client";

// Thanh tab của Cộng đồng (tên cũ: Trang chung; Hiệu yêu cầu 29/10/2026): hai mục chung cho mọi vai (Cộng đồng, Khám phá).
// Mục theo vai (Của tôi, Nhà trường, Tạo CLB; luật chọn ở lib/hub.ts) nằm trong menu avatar (AccountMenu) cho thanh cân đối (Hiệu chỉnh 29/10/2026).
// Tin nhắn không còn là tab: là bong bóng chat ở góc phải dưới (ChatBubble).
// Trên điện thoại là thanh tab dưới đáy; từ 1024px là thanh ngang trên cùng (lich.css).

import Link from "next/link";
import type { IconName } from "@/components/Icon";
import { LinkIcon } from "./motion";

export type HubTab = "feed" | "explore";

const TABS: { key: HubTab; href: string; icon: IconName; label: string }[] = [
  { key: "feed", href: "/feed", icon: "feed", label: "Cộng đồng" },
  { key: "explore", href: "/explore", icon: "compass", label: "Khám phá" },
];

/** "hub": dùng thanh tab của Cộng đồng nhưng không mục chung nào sáng (ví dụ trang Của tôi của người chưa ở CLB nào). */
export const isHubTab = (tab: string | undefined): tab is HubTab | "hub" => tab === "hub" || TABS.some((t) => t.key === tab);

export function HubNav({ tab }: { tab: HubTab | "hub" }) {
  return (
    <nav aria-label="Menu Cộng đồng" className="l-tabs hub">
      {TABS.map((t) => (
        <Link key={t.key} className={`l-tab${tab === t.key ? " on" : ""}`} href={t.href} aria-current={tab === t.key ? "page" : undefined}>
          <LinkIcon name={t.icon} size={22} /><span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
