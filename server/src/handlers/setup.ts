// Tạo dữ liệu từ đầu (04/10/2026, mô tả màn được Hiệu duyệt; bản vẽ chưa có):
// tạo CLB, thêm thành viên và đổi vai, tạo/sửa/xóa buổi, tạo/sửa đợt thu.

import { findClub, requireBoard, requireRight } from "../access.ts";
import {
  addMembers, createClub, createCollection, createEvent, deleteEvent, membershipOf, nowIso, slugify, toAsciiUpper, uid, updateCollection,
  updateEvent, updateMember, type AppState, type ClubEvent, type Collection,
} from "../domain.ts";
import { conflict, HttpError, invalid, notFound } from "../errors.ts";
import { addMembersBody, createClubBody, createCollectionBody, eventBody, parseBody, updateCollectionBody, updateMemberBody } from "../schemas.ts";
import { randomToken } from "../sessions.ts";
import { clubRef, collectionDto, collectionsRes, eventDto, memberRow } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys = "createClub" | "addMembers" | "updateMember" | "createEvent" | "updateEvent" | "deleteEvent" | "listCollections" | "createCollection" | "updateCollection";

const PAST_EVENT = "Buổi này đã qua. Chọn ngày giờ sau bây giờ.";

/** Mã CLB trùng tên trang của web (/clubs/new) thì không dùng. */
const RESERVED_CLUB_IDS = new Set(["new"]);

/** Thời điểm gửi lên đổi về đúng dạng mọi thời điểm trong dữ liệu ("2026-10-10T07:30:00+07:00"). */
const at = (iso: string) => nowIso(Date.parse(iso));

function findEvent(s: AppState, clubId: string, eventId: string): ClubEvent {
  const ev = s.events.find((e) => e.id === eventId && e.clubId === clubId);
  if (!ev) throw notFound("Không tìm thấy buổi này.");
  return ev;
}

function findCollection(s: AppState, clubId: string, collectionId: string): Collection {
  const c = s.collections.find((x) => x.id === collectionId && x.clubId === clubId);
  if (!c) throw notFound("Không tìm thấy đợt thu.");
  return c;
}

export const setupHandlers: Pick<Handlers, Keys> = {
  /** Ai đã đăng nhập cũng tạo được CLB (phương án nghiệp vụ N1: không cần xác minh). Người tạo là chủ nhiệm. */
  createClub: (ctx) => {
    const body = parseBody(createClubBody, ctx.body);
    const name = body.name.replace(/\s+/g, " ");
    if (ctx.state.clubs.some((c) => toAsciiUpper(c.name) === toAsciiUpper(name))) throw conflict("Đã có CLB tên này. Chọn tên khác.");
    const base = slugify(name) || "clb";
    let id = base;
    for (let i = 2; RESERVED_CLUB_IDS.has(id) || ctx.state.clubs.some((c) => c.id === id); i++) id = `${base}-${i}`;
    const s = ctx.update(createClub({
      id, name, field: body.field, schedule: body.schedule, location: body.location, term: body.term,
      acceptingApplications: body.acceptingApplications, ...(body.mentor ? { mentor: body.mentor } : {}), personId: ctx.me.id,
    }));
    return { club: clubRef(findClub(s, id)) };
  },

  /** Thêm thành viên. Người đã có tài khoản (cùng email) thì dùng lại; ai đã ở CLB thì báo lỗi cả danh sách để sửa trước. */
  addMembers: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "approveApplication");
    const body = parseBody(addMembersBody, ctx.body);
    const byEmail = (email: string) => ctx.state.persons.find((p) => p.email.toLowerCase() === email.toLowerCase());
    const already = body.members.filter((m) => { const p = byEmail(m.email); return p && membershipOf(ctx.state, club.id, p.id); });
    if (already.length) throw new HttpError(409, "CONFLICT", `Đã có trong CLB: ${already.map((m) => m.email).join(", ")}.`, { emails: already.map((m) => m.email) });
    const usedCodes = new Set(ctx.state.memberships.map((m) => m.inviteCode).filter(Boolean));
    const inviteCode = () => {
      let code = `moi-${randomToken(6)}`;
      while (usedCodes.has(code)) code = `moi-${randomToken(6)}`;
      usedCodes.add(code);
      return code;
    };
    const people = body.members.map((m) => {
      const p = byEmail(m.email);
      return {
        personId: p?.id ?? uid("p"), name: p?.name ?? m.name.replace(/\s+/g, " "), email: p?.email ?? m.email,
        year: m.year, department: m.department || "Chưa xếp ban", inviteCode: inviteCode(),
      };
    });
    const s = ctx.update(addMembers(club.id, people, ctx.nowIso()));
    return {
      added: people.map((p) => {
        const m = membershipOf(s, club.id, p.personId)!;
        return { personId: p.personId, name: p.name, email: p.email, code: m.code, inviteCode: m.inviteCode ?? p.inviteCode };
      }),
    };
  },

  /** Đổi vai trò và ban. Chủ nhiệm chỉ đổi khi bàn giao, nên không đổi ai thành chủ nhiệm và không đổi vai của chủ nhiệm ở đây. */
  updateMember: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "assignRole");
    const target = membershipOf(ctx.state, club.id, ctx.params.personId);
    if (!target) throw notFound("Người này không có trong danh sách thành viên.");
    const body = parseBody(updateMemberBody, ctx.body);
    if ((target.role === "president") !== (body.role === "president")) throw conflict("Đổi chủ nhiệm làm ở màn Bàn giao.");
    const s = ctx.update(updateMember(club.id, target.personId, { role: body.role, department: body.department }));
    return { member: memberRow(s, club, membershipOf(s, club.id, target.personId)!) };
  },

  createEvent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const b = parseBody(eventBody, ctx.body);
    if (Date.parse(b.end) <= ctx.now()) throw invalid(PAST_EVENT);
    const id = uid("buoi");
    const s = ctx.update(createEvent({ id, clubId: club.id, title: b.title, kind: b.kind, start: at(b.start), end: at(b.end), location: b.location, checkinUntil: at(b.checkinUntil) }));
    return { event: eventDto(findEvent(s, club.id, id)) };
  },

  /** Sửa buổi: chỉ khi chưa mở điểm danh. */
  updateEvent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const ev = findEvent(ctx.state, club.id, ctx.params.eventId);
    if (ev.status !== "upcoming") throw conflict("Buổi này đã mở điểm danh, không sửa được nữa.");
    const b = parseBody(eventBody, ctx.body);
    if (Date.parse(b.end) <= ctx.now()) throw invalid(PAST_EVENT);
    const s = ctx.update(updateEvent(ev.id, { title: b.title, kind: b.kind, start: at(b.start), end: at(b.end), location: b.location, checkinUntil: at(b.checkinUntil) }));
    return { event: eventDto(findEvent(s, club.id, ev.id)) };
  },

  /** Xóa buổi: chỉ khi chưa mở điểm danh và chưa ai điểm danh. */
  deleteEvent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const ev = findEvent(ctx.state, club.id, ctx.params.eventId);
    if (ev.status !== "upcoming" || ctx.state.attendance.some((a) => a.eventId === ev.id)) throw conflict("Buổi này đã mở điểm danh, không xóa được.");
    ctx.update(deleteEvent(ev.id));
    return { ok: true };
  },

  listCollections: (ctx) => collectionsRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club.id),

  /** Tạo đợt thu. Chỉ lưu 4 số cuối của số tài khoản (mã QR của bản demo là mã giả). */
  createCollection: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "money");
    const b = parseBody(createCollectionBody, ctx.body);
    if (ctx.state.collections.some((c) => c.clubId === club.id && c.codePrefix === b.codePrefix)) throw conflict(`Mã ${b.codePrefix} đã dùng cho một đợt thu khác của CLB.`);
    const receiver = membershipOf(ctx.state, club.id, b.receiverId);
    if (!receiver || receiver.invite !== "accepted") throw invalid("Người nhận tiền phải là thành viên đã nhận lời mời.");
    const accountName = toAsciiUpper(b.accountName);
    if (!/^[A-Z ]+$/.test(accountName)) throw invalid("Tên chủ tài khoản chỉ gồm chữ cái, như app ngân hàng hiện.");
    const id = uid("dot-thu");
    const s = ctx.update(createCollection({
      id, clubId: club.id, term: club.term, name: b.name, amount: b.amount, dueDate: at(b.dueDate), codePrefix: b.codePrefix,
      receiverId: b.receiverId, accountName, bankLabel: b.bank, last4: b.account.slice(-4),
    }));
    return { collection: collectionDto(s, findCollection(s, club.id, id)) };
  },

  /** Sửa hạn đóng; mức thu chỉ sửa được khi chưa ai đóng hay báo đã chuyển. */
  updateCollection: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "money");
    const c = findCollection(ctx.state, club.id, ctx.params.collectionId);
    const b = parseBody(updateCollectionBody, ctx.body);
    const touched = ctx.state.payments.some((p) => p.collectionId === c.id && (p.status !== "unpaid" || p.amountPaid > 0));
    if (b.amount !== undefined && b.amount !== c.amount && touched) throw conflict("Đã có người đóng hoặc báo đã chuyển, không đổi mức thu được nữa.");
    const s = ctx.update(updateCollection(c.id, { dueDate: b.dueDate ? at(b.dueDate) : undefined, amount: b.amount }));
    return { collection: collectionDto(s, findCollection(s, club.id, c.id)) };
  },
};
