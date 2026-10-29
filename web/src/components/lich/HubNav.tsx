"use client";

// Thanh tab của trang chung (Hiệu yêu cầu 29/10/2026): hai mục chung cho mọi vai (Trang chung, Khám phá), rồi các mục theo vai
// (Quản lý CLB, Của tôi, Nhà trường, Tạo CLB; luật chọn ở lib/hub.ts). Mục theo vai đầu tiên là nút đặc xanh mực, các mục sau viền xanh;
// đang ở đúng trang đó thì nút đổi sang mực. Tin nhắn không còn là tab: là bong bóng chat ở góc phải dưới (ChatBubble).
// Trên điện thoại là thanh tab dưới đáy; từ 1024px là thanh ngang trên cùng, mục theo vai dồn sang phải (lich.css).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/api/queries";
import type { IconName } from "@/components/Icon";
import { roleEntries } from "@/lib/hub";
import { LinkIcon, Skel } from "./motion";

export type HubTab = "feed" | "explore";

const TABS: { key: HubTab; href: string; icon: IconName; label: string }[] = [
  { key: "feed", href: "/feed", icon: "feed", label: "Trang chung" },
  { key: "explore", href: "/explore", icon: "compass", label: "Khám phá" },
];

/** "hub": dùng thanh tab của trang chung nhưng không mục chung nào sáng (ví dụ trang Của tôi của người chưa ở CLB nào). */
export const isHubTab = (tab: string | undefined): tab is HubTab | "hub" => tab === "hub" || TABS.some((t) => t.key === tab);

export function HubNav({ tab }: { tab: HubTab | "hub" }) {
  const me = useMe();
  const path = usePathname();
  const roles = me.data ? roleEntries(me.data) : null;
  // Đang tải: giữ một chỗ cho mục theo vai (phần lớn người dùng có một mục) để thanh tab không nhảy.
  return (
    <nav aria-label="Menu trang chung" className="l-tabs hub">
      {TABS.map((t) => (
        <Link key={t.key} className={`l-tab${tab === t.key ? " on" : ""}`} href={t.href} aria-current={tab === t.key ? "page" : undefined}>
          <LinkIcon name={t.icon} size={22} /><span>{t.label}</span>
        </Link>
      ))}
      {roles
        ? roles.map((r, i) => {
            const on = path === r.href || path.startsWith(`${r.href}/`);
            return <Link key={r.key} className={`l-tab role${i > 0 ? " sec" : ""}${on ? " on" : ""}`} href={r.href} aria-current={on ? "page" : undefined}><LinkIcon name={r.icon} size={22} /><span>{r.label}</span></Link>;
          })
        : <span className="l-tab role" aria-hidden="true"><Skel w={56} h={12} /></span>}
    </nav>
  );
}
