// Cộng đồng (tên cũ: Trang chung; Hiệu yêu cầu 29/10/2026): mọi người đã đăng nhập đều vào được; mỗi vai có thêm một mục riêng, nằm trong menu avatar (Hiệu chỉnh 29/10/2026).
// File này chỉ có luật chọn mục theo vai (không dùng API trình duyệt), để test được bằng `npm test`.

import type { MeRes } from "@contract";
import type { IconName } from "../components/Icon.tsx";

export interface RoleEntry {
  key: "school" | "board" | "me" | "new";
  label: string;
  href: string;
  icon: IconName;
  /** Mục của một CLB cụ thể (người ở nhiều CLB có một mục cho từng CLB). */
  clubId?: string;
}

/**
 * Mục theo vai trong menu avatar. Người ở nhiều CLB có một mục cho từng CLB, ghi kèm tên CLB (Hiệu chọn 29/10/2026).
 * - Cán bộ trường: Nhà trường.
 * - Ban điều hành của một CLB: Của tôi, dẫn tới trang quản lý CLB đó. Nếu người đó còn là thành viên thường ở CLB khác thì mục này
 *   ghi "Quản lý CLB" cho khỏi trùng với Của tôi của phía thành viên. Ở nhiều CLB thì ghi "Quản lý <tên CLB>".
 * - Thành viên thường của một CLB: Của tôi (giao diện thành viên, /me); ở nhiều CLB thì "Của tôi · <tên CLB>", bấm vào là chọn CLB đó (api/active-club.ts).
 * - Chưa ở CLB nào: Của tôi (trang đó giới hạn tính năng) và Tạo CLB.
 */
export function roleEntries(me: MeRes): RoleEntry[] {
  if (me.person.kind === "staff") return [{ key: "school", label: "Nhà trường", href: "/school", icon: "users" }];
  const accepted = me.memberships.filter((m) => m.invite === "accepted");
  if (accepted.length === 0) return [{ key: "me", label: "Của tôi", href: "/me", icon: "user" }, { key: "new", label: "Tạo CLB", href: "/clubs/new", icon: "plus" }];
  const many = accepted.length > 1;
  const board = accepted.filter((m) => m.role !== "member");
  const plain = accepted.filter((m) => m.role === "member");
  return [
    ...board.map((m): RoleEntry => ({ key: "board", clubId: m.clubId, href: `/clubs/${m.clubId}`, icon: "home", label: many ? `Quản lý ${m.clubName}` : "Của tôi" })),
    ...plain.map((m): RoleEntry => ({ key: "me", clubId: m.clubId, href: "/me", icon: "user", label: many ? `Của tôi · ${m.clubName}` : "Của tôi" })),
  ];
}
