// Sinh viên tìm CLB, gửi đơn xin vào; người được duyệt nhận lời mời và đồng ý lưu dữ liệu.

import { findClub } from "../access.ts";
import { acceptInvite, membershipOf, submitApplication, uid } from "../domain.ts";
import { conflict, forbidden, notFound } from "../errors.ts";
import { acceptInviteBody, applyBody, parseBody } from "../schemas.ts";
import { applicationDto, clubCardDto, clubRef, CONSENT_VERSION, membershipDto, personRef } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys = "listClubs" | "getClub" | "applyToClub" | "getInvite" | "acceptInvite";

export const exploreHandlers: Pick<Handlers, Keys> = {
  // Bản demo: mọi CLB cùng một học kỳ. Khi có dữ liệu thật thì lấy học kỳ hiện tại của trường.
  listClubs: (ctx) => ({ term: ctx.state.clubs[0]?.term ?? "", clubs: ctx.state.clubs.map((c) => clubCardDto(ctx.state, c, ctx.me)) }),

  getClub: (ctx) => ({ club: clubCardDto(ctx.state, findClub(ctx.state, ctx.params.clubId), ctx.me) }),

  applyToClub: (ctx) => {
    const club = findClub(ctx.state, ctx.params.clubId);
    const body = parseBody(applyBody, ctx.body);
    if (membershipOf(ctx.state, club.id, ctx.me.id)) throw conflict("Bạn đã ở CLB này rồi.");
    const last = ctx.state.applications.filter((a) => a.clubId === club.id && a.personId === ctx.me.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    if (last?.status === "pending") throw conflict("Bạn đã gửi đơn vào CLB này, đơn đang chờ duyệt.");
    if (!club.acceptingApplications) throw conflict("CLB đang tạm ngưng nhận đơn.");
    const id = uid("don");
    const s = ctx.update(submitApplication({ id, clubId: club.id, personId: ctx.me.id, year: body.year, reason: body.reason ?? "", at: ctx.nowIso() }));
    return { application: applicationDto(s.applications.find((a) => a.id === id)!) };
  },

  getInvite: (ctx) => {
    const m = pendingInvite(ctx.state.memberships, ctx.params.code, ctx.me.id);
    const club = findClub(ctx.state, m.clubId);
    const president = ctx.state.memberships.find((x) => x.clubId === club.id && x.role === "president");
    return {
      club: clubRef(club),
      invitedBy: president ? { ...personRef(ctx.state, president.personId), role: president.role } : undefined,
      email: ctx.me.email,
      consentVersion: CONSENT_VERSION,
    };
  },

  acceptInvite: (ctx) => {
    const m = pendingInvite(ctx.state.memberships, ctx.params.code, ctx.me.id);
    const body = parseBody(acceptInviteBody, ctx.body);
    const s = ctx.update(acceptInvite(ctx.params.code, body.phone, ctx.nowIso()));
    return { membership: membershipDto(s, s.memberships.find((x) => x.clubId === m.clubId && x.personId === m.personId)!) };
  },
};

/** Lời mời còn hiệu lực và đúng là gửi cho người đang đăng nhập. */
function pendingInvite<M extends { inviteCode?: string; invite: string; personId: string }>(memberships: M[], code: string, personId: string): M {
  const m = memberships.find((x) => x.inviteCode === code && x.invite === "pending");
  if (!m) throw notFound("Link mời không còn dùng được. Có thể bạn đã nhận lời mời này rồi, hoặc CLB đã thu hồi link.");
  if (m.personId !== personId) throw forbidden("Lời mời này gửi cho tài khoản khác. Đăng nhập bằng đúng email được mời.");
  return m;
}
