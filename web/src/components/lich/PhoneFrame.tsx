"use client";

// Khung điện thoại của thành viên trong thế giới "Lịch bloc": tên CLB và avatar ở trên, ba tab ở dưới.
// Chưa có clubName (đang tải): tên CLB và avatar là thanh giữ chỗ, ba tab vẫn hiện như thật.
// brand: đầu màn là chữ CampusHub (màn quét mã điểm danh, lời mời, danh sách CLB: chưa biết hoặc chưa ở CLB nào).
// back: đầu màn là link quay lại (trang một CLB: "Danh sách CLB").
// Ở hai kiểu này, avatar chỉ hiện khi có personName, ở mép phải nên không xô gì.

import Link from "next/link";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import { LinkIcon, Skel } from "./motion";

export type PhoneTab = "attendance" | "pay" | "me";

export function PhoneFrame({ clubName, personName, tab, payHref, fade = false, brand = false, back, children }: {
  clubName?: string; personName?: string; tab?: PhoneTab; payHref?: string; brand?: boolean;
  back?: { href: string; label: string };
  /** Tên CLB vừa thay thanh giữ chỗ: hiện dần. */
  fade?: boolean;
  children: ReactNode;
}) {
  const tabLink = (key: PhoneTab, href: string, icon: "qr" | "wallet" | "user", label: string) => (
    <Link className={`l-tab${tab === key ? " on" : ""}`} href={href} aria-current={tab === key ? "page" : undefined}><LinkIcon name={icon} size={22} /><span>{label}</span></Link>
  );
  // Bấm avatar: về trang của tôi.
  const fadeCls = fade ? " l-fade-in" : "";
  const avatar = () => personName && (
    <Link className={`l-avatar l-phead-avatar${fadeCls}`} href="/me" aria-label={`${personName}, trang của tôi`}>{initials(personName)}</Link>
  );
  return (
    <div className="lich">
      <div className="l-phone-page">
        <div className="l-phone">
          <header className="l-phead">
            {back ? (
              <><Link className="l-back" href={back.href}><LinkIcon name="chevronLeft" size={18} />{back.label}</Link>{avatar()}</>
            ) : brand ? (
              <><span className="l-brand"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></span>{avatar()}</>
            ) : clubName && personName ? (
              <>
                <span className={`l-phead-club${fadeCls}`}>{clubName}</span>
                {avatar()}
              </>
            ) : (
              <><Skel w={170} h={16} /><span className="l-avatar l-skel" aria-hidden="true" /></>
            )}
          </header>
          <main className="l-pmain">{children}</main>
          {tab && (
            <nav aria-label="Menu thành viên" className="l-tabs">
              {tabLink("attendance", "/me/attendance", "qr", "Điểm danh")}
              {tabLink("pay", payHref ?? "/me/pay", "wallet", "Quỹ")}
              {tabLink("me", "/me", "user", "Của tôi")}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
