// Ban điều hành trên laptop: khung trang, trang chủ, thành viên và đơn xin vào, điểm danh, sổ quỹ (xem), bàn giao.

import { requireBoard, requireRight } from "../access.ts";
import {
  approveApplication, checkIn, closeEvent, membershipOf, nowIso, openEvent, rejectApplication, saveHandoverAccount, setHandoverStep,
  type AppState, type ClubEvent,
} from "../domain.ts";
import { conflict, HttpError, invalid, notFound } from "../errors.ts";
import { QR_STEP_MS, qrStep, qrToken } from "../qr.ts";
import { manualCheckinBody, parseBody, setReceiverBody, setStepBody } from "../schemas.ts";
import { applicationDto, attendanceDto, boardRes, dashboardRes, eventDetailRes, eventDto, eventsRes, handoverRes, ledgerRes, membersRes } from "../views.ts";
import type { Handlers } from "./types.ts";

type Keys =
  | "getBoard" | "getDashboard" | "listMembers" | "listApplications" | "approveApplication" | "rejectApplication"
  | "listEvents" | "getEvent" | "openEvent" | "closeEvent" | "getEventQr" | "manualCheckIn"
  | "getLedger" | "getHandover" | "setHandoverReceiver" | "setHandoverStep";

const APPLICATION_STATUS = ["pending", "approved", "rejected"] as const;

function findEvent(s: AppState, clubId: string, eventId: string): ClubEvent {
  const ev = s.events.find((e) => e.id === eventId && e.clubId === clubId);
  if (!ev) throw notFound("Không tìm thấy buổi này.");
  return ev;
}

function findApplication(s: AppState, clubId: string, applicationId: string) {
  const app = s.applications.find((a) => a.id === applicationId && a.clubId === clubId);
  if (!app) throw notFound("Không tìm thấy đơn xin vào.");
  if (app.status !== "pending") throw conflict("Đơn này đã được xử lý.");
  return app;
}

function findHandover(s: AppState, clubId: string) {
  const h = s.handovers.find((x) => x.clubId === clubId);
  if (!h) throw notFound("CLB chưa khởi tạo bàn giao.");
  return h;
}

export const boardHandlers: Pick<Handlers, Keys> = {
  getBoard: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    return boardRes(ctx.state, club, ctx.me, ms);
  },

  getDashboard: (ctx) => dashboardRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club),

  listMembers: (ctx) => membersRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club),

  listApplications: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    const status = ctx.query.status ?? "pending";
    if (!APPLICATION_STATUS.some((x) => x === status)) throw invalid("status chỉ nhận pending, approved hoặc rejected.");
    return {
      applications: ctx.state.applications.filter((a) => a.clubId === club.id && a.status === status)
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)).map(applicationDto),
    };
  },

  /** Duyệt đơn: người xin vào thành thành viên "chưa nhận lời mời" và có một khoản quỹ phải đóng. */
  approveApplication: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "approveApplication");
    const app = findApplication(ctx.state, club.id, ctx.params.applicationId);
    const s = ctx.update(approveApplication(app.id, ctx.me.id, ctx.nowIso()));
    const m = membershipOf(s, club.id, app.personId)!;
    return { application: applicationDto(s.applications.find((a) => a.id === app.id)!), member: { personId: m.personId, code: m.code, invite: m.invite } };
  },

  rejectApplication: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "approveApplication");
    const app = findApplication(ctx.state, club.id, ctx.params.applicationId);
    const s = ctx.update(rejectApplication(app.id, ctx.me.id, ctx.nowIso()));
    return { application: applicationDto(s.applications.find((a) => a.id === app.id)!) };
  },

  listEvents: (ctx) => eventsRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club.id),

  getEvent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    return eventDetailRes(ctx.state, club.id, findEvent(ctx.state, club.id, ctx.params.eventId));
  },

  /** Mở màn chiếu QR là mở điểm danh. Gọi lại khi đã mở thì không đổi gì. */
  openEvent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const ev = findEvent(ctx.state, club.id, ctx.params.eventId);
    if (ev.status === "closed") throw new HttpError(409, "CHECKIN_CLOSED", "Buổi này đã đóng điểm danh.");
    const s = ev.status === "upcoming" ? ctx.update(openEvent(ev.id)) : ctx.state;
    return { event: eventDto(findEvent(s, club.id, ev.id)) };
  },

  closeEvent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const ev = findEvent(ctx.state, club.id, ctx.params.eventId);
    const s = ev.status === "closed" ? ctx.state : ctx.update(closeEvent(ev.id, ctx.nowIso()));
    return { event: eventDto(findEvent(s, club.id, ev.id)) };
  },

  /** Mã QR hiện tại của buổi. Web gọi lại mỗi khi tới `refreshAt`. */
  getEventQr: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const ev = findEvent(ctx.state, club.id, ctx.params.eventId);
    if (ev.status === "upcoming") throw new HttpError(409, "CHECKIN_NOT_OPEN", "Buổi này chưa mở điểm danh.");
    if (ev.status === "closed") throw new HttpError(409, "CHECKIN_CLOSED", "Buổi này đã đóng điểm danh.");
    const step = qrStep(ctx.now());
    const token = qrToken(ctx.config.qrSecret, ev.id, step);
    return {
      token,
      checkinPath: `/checkin?e=${encodeURIComponent(ev.id)}&t=${token}`,
      stepSeconds: QR_STEP_MS / 1000,
      refreshAt: nowIso((step + 1) * QR_STEP_MS),
      validUntil: nowIso((step + 2) * QR_STEP_MS),
    };
  },

  /** Điểm danh tay, ghi lại người thực hiện. Làm được cả sau khi đóng điểm danh, để sửa cho người có mặt mà chưa quét. */
  manualCheckIn: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "checkin");
    const ev = findEvent(ctx.state, club.id, ctx.params.eventId);
    if (ev.status === "upcoming") throw new HttpError(409, "CHECKIN_NOT_OPEN", "Buổi này chưa mở điểm danh.");
    const body = parseBody(manualCheckinBody, ctx.body);
    if (!membershipOf(ctx.state, club.id, body.personId)) throw invalid("Người này không có trong danh sách thành viên.");
    const old = ctx.state.attendance.find((a) => a.eventId === ev.id && a.personId === body.personId);
    if (old) return { attendance: attendanceDto(ctx.state, club.id, old), created: false };
    const s = ctx.update(checkIn({ eventId: ev.id, personId: body.personId, at: ctx.nowIso(), method: "manual", by: ctx.me.id }));
    return { attendance: attendanceDto(s, club.id, s.attendance.find((a) => a.eventId === ev.id && a.personId === body.personId)!), created: true };
  },

  getLedger: (ctx) => ledgerRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club.id),

  getHandover: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    findHandover(ctx.state, club.id);
    return handoverRes(ctx.state, club)!;
  },

  /** Bước 3: đổi tài khoản nhận quỹ. Lưu xong thì sang bước 4. Chỉ trả về 4 số cuối của tài khoản. */
  setHandoverReceiver: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    const h = findHandover(ctx.state, club.id);
    if (h.step !== 3) throw conflict("Bàn giao đang không ở bước đổi tài khoản nhận quỹ.");
    const body = parseBody(setReceiverBody, ctx.body);
    const receiver = membershipOf(ctx.state, club.id, body.personId);
    if (!receiver || receiver.invite !== "accepted") throw invalid("Chủ tài khoản mới phải là thành viên đã nhận lời mời.");
    const s = ctx.update(saveHandoverAccount(club.id, { personId: body.personId, bank: body.bank, account: body.account }, body.transferRef ?? ""));
    return handoverRes(s, club)!;
  },

  /** Chỉ quay lại bước trước. Đi tiếp thì làm bằng thao tác của từng bước. */
  setHandoverStep: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    const h = findHandover(ctx.state, club.id);
    const body = parseBody(setStepBody, ctx.body);
    if (body.step >= h.step) throw conflict("Chỉ quay lại được bước trước.");
    const s = ctx.update(setHandoverStep(club.id, body.step));
    return handoverRes(s, club)!;
  },
};
