// Cộng đồng (tên cũ: Trang chung; Hiệu yêu cầu 29/10/2026): mọi người đã đăng nhập đều vào được; mỗi vai có thêm một mục riêng, nằm trong menu avatar (Hiệu chỉnh 29/10/2026).
// File này chỉ có luật chọn mục theo vai (không dùng API trình duyệt), để test được bằng `npm test`.

import type { MeRes } from "@contract";
import type { IconName } from "../components/Icon.tsx";

export interface RoleEntry {
  key: "school" | "board" | "me" | "new";
  label: string;
  href: string;
  icon: IconName;
}

/**
 * Mục theo vai trong menu avatar.
 * - Cán bộ trường: Nhà trường.
 * - Ban điều hành: Của tôi, dẫn tới trang quản lý CLB (CLB đầu tiên mà họ giữ vai ban điều hành; chọn CLB khi ở nhiều CLB chưa làm).
 *   Nếu người đó còn là thành viên thường ở CLB khác thì đã có mục Của tôi (giao diện thành viên), nên mục này giữ tên Quản lý CLB để khỏi trùng.
 * - Thành viên thường, hoặc chưa ở CLB nào: Của tôi (chưa ở CLB nào thì trang đó giới hạn tính năng).
 * - Chưa ở CLB nào: thêm Tạo CLB.
 * Ban điều hành không có mục Của tôi, vì /me là giao diện thành viên (xem landingAfterLogin).
 */
export function roleEntries(me: MeRes): RoleEntry[] {
  if (me.person.kind === "staff") return [{ key: "school", label: "Nhà trường", href: "/school", icon: "users" }];
  const accepted = me.memberships.filter((m) => m.invite === "accepted");
  const board = accepted.find((m) => m.role !== "member");
  const entries: RoleEntry[] = [];
  const hasMe = accepted.some((m) => m.role === "member") || accepted.length === 0;
  if (board) entries.push({ key: "board", label: hasMe ? "Quản lý CLB" : "Của tôi", href: `/clubs/${board.clubId}`, icon: "home" });
  if (hasMe) entries.push({ key: "me", label: "Của tôi", href: "/me", icon: "user" });
  if (accepted.length === 0) entries.push({ key: "new", label: "Tạo CLB", href: "/clubs/new", icon: "plus" });
  return entries;
}
