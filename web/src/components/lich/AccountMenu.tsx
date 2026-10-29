"use client";

// Menu tài khoản ở đầu khung điện thoại (Hiệu yêu cầu 29/10/2026: mọi vai đều phải có nút đăng xuất): bấm avatar thì mở menu có tên người đăng nhập,
// các mục theo vai (Của tôi, Nhà trường, Tạo CLB; luật ở lib/hub.ts, Hiệu chuyển vào đây 29/10/2026 để thanh tab của Cộng đồng cân đối) và "Đăng xuất".
// Trước đây avatar là link thẳng tới /me, nên các màn của thành viên và Cộng đồng không có đăng xuất. Ban điều hành và nhà trường có đăng xuất ở thanh bên của khung riêng (BoardFrame, SchoolFrame).

import Link from "next/link";
import { DropdownMenu as M } from "radix-ui";
import { useMe } from "@/api/queries";
import { initials } from "@/lib/format";
import { roleEntries } from "@/lib/hub";
import { startTour } from "@/lib/tour-store";
import { useLogout } from "./Gate";
import { Spinner } from "./motion";

/** Avatar ở chân thanh bên của ban điều hành: bấm mở menu "Hướng dẫn" (chạy lại hướng dẫn nhanh, xem Tour) và "Đăng xuất". */
export function BoardAccountMenu({ name, fade = false }: { name: string; fade?: boolean }) {
  const { logout, pending } = useLogout();
  return (
    <M.Root>
      <M.Trigger asChild>
        <button type="button" data-tour="avatar" className={`l-avatar l-phead-avatar${fade ? " l-fade-in" : ""}`} aria-label={`${name}, tài khoản`}>{initials(name)}</button>
      </M.Trigger>
      <M.Portal>
        {/* Hướng dẫn tự đặt tiêu điểm vào tờ chú thích, nên menu đừng trả tiêu điểm về avatar khi đóng. */}
        <M.Content className="l-menu" side="top" align="start" sideOffset={8} collisionPadding={12} onCloseAutoFocus={(e) => e.preventDefault()}>
          <div className="l-menu-who">{name}</div>
          <M.Item className="l-menu-item" onSelect={() => startTour()}>Hướng dẫn</M.Item>
          <M.Item className="l-menu-item" aria-busy={pending || undefined} onSelect={(e) => { e.preventDefault(); void logout(); }}>
            <span>Đăng xuất</span>{pending && <Spinner />}
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

export function AccountMenu({ name, fade = false }: { name: string; fade?: boolean }) {
  const me = useMe();
  const { logout, pending } = useLogout();
  // Chưa biết vai thì cứ hiện "Của tôi": phần lớn người dùng khung điện thoại là thành viên hoặc sinh viên.
  const entries = me.data ? roleEntries(me.data) : [{ key: "me" as const, label: "Của tôi", href: "/me" }];
  return (
    <M.Root>
      <M.Trigger asChild>
        <button type="button" className={`l-avatar l-phead-avatar${fade ? " l-fade-in" : ""}`} aria-label={`${name}, tài khoản`}>{initials(name)}</button>
      </M.Trigger>
      <M.Portal>
        <M.Content className="l-menu" align="end" sideOffset={8} collisionPadding={12}>
          <div className="l-menu-who">{name}</div>
          {entries.map((r) => <M.Item key={r.key} asChild><Link className="l-menu-item" href={r.href}>{r.label}</Link></M.Item>)}
          {/* Chờ máy chủ đăng xuất xong mới đóng menu: onSelect chặn việc tự đóng, vòng xoay báo đang chờ. */}
          <M.Item className="l-menu-item" aria-busy={pending || undefined} onSelect={(e) => { e.preventDefault(); void logout(); }}>
            <span>Đăng xuất</span>{pending && <Spinner />}
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
