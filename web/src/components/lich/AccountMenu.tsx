"use client";

// Menu tài khoản ở đầu khung điện thoại (Hiệu yêu cầu 29/10/2026: mọi vai đều phải có nút đăng xuất): bấm avatar thì mở menu có tên người đăng nhập,
// "Của tôi" (chỉ khi người đó có mục Của tôi, xem lib/hub.ts) và "Đăng xuất". Trước đây avatar là link thẳng tới /me, nên các màn của thành viên và
// trang chung không có đăng xuất. Ban điều hành và nhà trường có đăng xuất ở thanh bên của khung riêng (BoardFrame, SchoolFrame).

import Link from "next/link";
import { DropdownMenu as M } from "radix-ui";
import { useMe } from "@/api/queries";
import { initials } from "@/lib/format";
import { roleEntries } from "@/lib/hub";
import { useLogout } from "./Gate";
import { Spinner } from "./motion";

export function AccountMenu({ name, fade = false }: { name: string; fade?: boolean }) {
  const me = useMe();
  const { logout, pending } = useLogout();
  // Chưa biết vai thì cứ hiện "Của tôi": phần lớn người dùng khung điện thoại là thành viên hoặc sinh viên.
  const hasMe = me.data ? roleEntries(me.data).some((r) => r.key === "me") : true;
  return (
    <M.Root>
      <M.Trigger asChild>
        <button type="button" className={`l-avatar l-phead-avatar${fade ? " l-fade-in" : ""}`} aria-label={`${name}, tài khoản`}>{initials(name)}</button>
      </M.Trigger>
      <M.Portal>
        <M.Content className="l-menu" align="end" sideOffset={8} collisionPadding={12}>
          <div className="l-menu-who">{name}</div>
          {hasMe && <M.Item asChild><Link className="l-menu-item" href="/me">Của tôi</Link></M.Item>}
          {/* Chờ máy chủ đăng xuất xong mới đóng menu: onSelect chặn việc tự đóng, vòng xoay báo đang chờ. */}
          <M.Item className="l-menu-item" aria-busy={pending || undefined} onSelect={(e) => { e.preventDefault(); void logout(); }}>
            <span>Đăng xuất</span>{pending && <Spinner />}
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
