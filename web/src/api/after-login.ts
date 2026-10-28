import type { MeRes } from "@contract";

/**
 * Trang mở đầu sau khi đăng nhập, theo vai của người đó (Hiệu chốt 29/10/2026): ban điều hành vào trang CLB, cán bộ trường vào /school,
 * thành viên thường vào thẳng trang chung (/feed) rồi bấm tab Của tôi để vào /me. Người chưa ở CLB nào cũng vào trang chung
 * (có lời mời đang chờ thì vào lời mời).
 */
export function homeFor(me: MeRes): string {
  if (me.person.kind === "staff") return "/school";
  const accepted = me.memberships.filter((m) => m.invite === "accepted");
  const board = accepted.find((m) => m.role !== "member");
  if (board) return `/clubs/${board.clubId}`;
  if (accepted.length > 0) return "/feed";
  const invite = me.memberships.find((m) => m.invite === "pending" && m.inviteCode);
  if (invite) return `/invite/${invite.inviteCode}`;
  return "/feed";
}

/** Chỉ nhận đường dẫn bên trong web, như máy chủ (server/src/handlers/auth.ts). */
export function safeNext(value: string | null): string | undefined {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

/**
 * Trang mở sau khi đăng nhập: `next` nếu có, trừ một trường hợp. Người ban điều hành đăng nhập mà `next` chỉ là trang Của tôi (/me)
 * thì về trang CLB của họ: `next=/me` thường là phần còn sót lại của người đăng nhập trước (phiên hết hạn khi đang ở /me),
 * và /me là giao diện thành viên. Link mời, link đóng quỹ, link điểm danh (/me/pay/..., /checkin, /invite/...) vẫn mở đúng.
 */
export function landingAfterLogin(me: MeRes, next: string | undefined): string {
  const isBoard = me.person.kind !== "staff" && me.memberships.some((m) => m.invite === "accepted" && m.role !== "member");
  if (next && isBoard && /^\/me(\?.*)?$/.test(next)) return homeFor(me);
  return next ?? homeFor(me);
}
