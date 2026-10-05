// Kiểm tra quyền ở máy chủ. Giao diện có khóa nút theo vai, nhưng chỉ kiểm tra ở đây mới chặn được thật.

import { can, membershipOf, RIGHT_LABEL, type AppState, type Club, type Membership, type Person } from "./domain.ts";
import { forbidden, HttpError, notFound } from "./errors.ts";

export type Right = Parameters<typeof can>[1];

export function findClub(s: AppState, clubId: string): Club {
  const club = s.clubs.find((c) => c.id === clubId);
  if (!club) throw notFound("Không tìm thấy CLB.");
  return club;
}

/** Người đang đăng nhập phải ở ban điều hành của CLB: đã nhận lời mời và vai khác "thành viên". */
export function requireBoard(s: AppState, clubId: string, me: Person): { club: Club; ms: Membership } {
  const club = findClub(s, clubId);
  const ms = membershipOf(s, clubId, me.id);
  if (!ms || ms.role === "member" || ms.invite !== "accepted") throw forbidden(`Trang này dành cho ban điều hành ${club.name}.`);
  return { club, ms };
}

/** Vai trò phải có quyền làm việc này (bảng quyền ở web/src/lib/selectors.ts). */
export function requireRight(ms: Membership, right: Right): void {
  if (!can(ms.role, right)) throw forbidden(RIGHT_LABEL[right]);
}

/** Thành viên đã nhận lời mời của CLB. */
export function requireMember(s: AppState, clubId: string, me: Person): { club: Club; ms: Membership } {
  const club = findClub(s, clubId);
  const ms = membershipOf(s, clubId, me.id);
  if (!ms) throw new HttpError(403, "NOT_MEMBER", `Bạn chưa là thành viên ${club.name}.`, { clubId: club.id, clubName: club.name });
  if (ms.invite !== "accepted") {
    throw new HttpError(403, "INVITE_PENDING", `Bạn chưa nhận lời mời của ${club.name}.`, { clubName: club.name, inviteCode: ms.inviteCode });
  }
  return { club, ms };
}

/** Cán bộ của trường (ban quản lý CLB, mentor). */
export function requireStaff(me: Person): void {
  if (me.kind !== "staff") throw forbidden("Trang này dành cho ban quản lý CLB của trường.");
}
