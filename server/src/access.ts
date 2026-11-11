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

/**
 * Ban điều hành, hoặc người được chọn làm chủ nhiệm mới trong bàn giao (đã nhận lời mời, kể cả khi đang là thành viên thường).
 * Chủ nhiệm mới cần xem trang Bàn giao để xác nhận ở bước 6, nên chỉ trang này và khung của nó mở cho họ.
 */
export function requireBoardOrIncoming(s: AppState, clubId: string, me: Person): { club: Club; ms: Membership } {
  const club = findClub(s, clubId);
  const ms = membershipOf(s, clubId, me.id);
  if (ms && ms.invite === "accepted" && isIncomingPresident(s, clubId, me.id)) return { club, ms };
  return requireBoard(s, clubId, me);
}

/**
 * Trang Bàn giao cả ban (09/11/2026): chỉ chủ nhiệm và chủ nhiệm mới (được chọn ở bước 1). Phó chủ nhiệm, thủ quỹ, trưởng ban chỉ bàn giao vai của chính mình
 * (API /role-handovers), nên không xem tiến độ bàn giao cả ban.
 */
export function canViewWholeHandover(s: AppState, clubId: string, me: Person): boolean {
  const ms = membershipOf(s, clubId, me.id);
  if (!ms || ms.invite !== "accepted") return false;
  return ms.role === "president" || isIncomingPresident(s, clubId, me.id);
}

/**
 * Chủ nhiệm mới được chọn ở bước 1 chỉ có quyền vào đúng lúc bàn giao ở bước 6 (họ phải xác nhận). Trước đó họ vẫn là thành viên thường,
 * chưa thuộc ban điều hành (Hiệu chọn 09/11/2026); sang bước 7 họ đã là chủ nhiệm thật. Bản ghi bàn giao ở lại mãi, nên không dùng `step >= 6`: người này sau đó có thể bàn giao
 * vai chủ nhiệm và về thành viên thường mà không được giữ quyền xem.
 */
export function isIncomingPresident(s: AppState, clubId: string, personId: string): boolean {
  return s.handovers.some((h) => h.clubId === clubId && h.step === 6 && !h.acceptedAt && h.newBoard?.president === personId);
}

/**
 * Ban điều hành, hoặc thành viên đang là người nhận của một đơn bàn giao một vai (09/11/2026): họ cần khung trang để vào trang Bàn giao từng vai và xác nhận ở bước 6.
 * Chỉ dùng cho khung trang (getBoard); các trang khác của ban điều hành vẫn chặn họ.
 */
export function requireBoardOrRoleReceiver(s: AppState, clubId: string, me: Person): { club: Club; ms: Membership } {
  const club = findClub(s, clubId);
  const ms = membershipOf(s, clubId, me.id);
  // Người nhận (đang làm bước 6 hoặc đã xong) và người giao đã xong (xem lại biên bản của mình, dù đã về thành viên thường).
  const receiving = s.roleHandovers.some((h) => h.clubId === clubId && ((h.toId === me.id && (h.status === "active" || h.status === "done")) || (h.fromId === me.id && h.status === "done")));
  if (ms && ms.invite === "accepted" && receiving) return { club, ms };
  return requireBoardOrIncoming(s, clubId, me);
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
