import type { MeRes } from "@contract";

/** Trang mở đầu sau khi đăng nhập, theo vai của người đó. */
export function homeFor(me: MeRes): string {
  if (me.person.kind === "staff") return "/school";
  const accepted = me.memberships.filter((m) => m.invite === "accepted");
  const board = accepted.find((m) => m.role !== "member");
  if (board) return `/clubs/${board.clubId}`;
  if (accepted.length > 0) return "/me";
  const invite = me.memberships.find((m) => m.invite === "pending" && m.inviteCode);
  if (invite) return `/invite/${invite.inviteCode}`;
  return "/explore";
}

/** Chỉ nhận đường dẫn bên trong web, như máy chủ (server/src/handlers/auth.ts). */
export function safeNext(value: string | null): string | undefined {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}
