// Ban điều hành trên laptop: khung trang, trang chủ, thành viên và đơn xin vào, điểm danh, sổ quỹ (xem), bàn giao.

import { requireBoard, requireBoardOrIncoming, requireRight } from "../access.ts";
import {
  acceptHandover, approveApplication, checkIn, closeEvent, finishHandoverTransfer, lockHandoverBalance, membershipOf, nowIso, openEvent, rejectApplication,
  reviewHandoverKit, saveHandoverAccount, saveHandoverBoard, setHandoverStep, transferHandoverAccount,
  type AppState, type ClubEvent, type Handover,
} from "../domain.ts";
import { conflict, forbidden, HttpError, invalid, notFound } from "../errors.ts";
import { QR_STEP_MS, qrStep, qrToken } from "../qr.ts";
import { manualCheckinBody, parseBody, setBoardBody, setReceiverBody, setStepBody, transferAccountBody } from "../schemas.ts";
import { applicationDto, attendanceDto, boardRes, dashboardRes, eventDetailRes, eventDto, eventsRes, handoverRes, ledgerRes, membersRes } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys =
  | "getBoard" | "getDashboard" | "listMembers" | "listApplications" | "approveApplication" | "rejectApplication"
  | "listEvents" | "getEvent" | "openEvent" | "closeEvent" | "getEventQr" | "manualCheckIn"
  | "getLedger" | "getHandover" | "setHandoverReceiver" | "setHandoverStep" | "setHandoverBoard" | "lockHandoverBalance" | "reviewHandoverKit"
  | "transferHandoverAccount" | "finishHandoverTransfer" | "acceptHandover";

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

/** Bàn giao phải đang đúng ở bước này thì mới làm được thao tác của bước. */
function atStep(h: Handover, step: number, message: string): Handover {
  if (h.step !== step) throw conflict(message);
  return h;
}

export const boardHandlers: Pick<Handlers, Keys> = {
  getBoard: (ctx) => {
    const { club, ms } = requireBoardOrIncoming(ctx.state, ctx.params.clubId, ctx.me);
    return boardRes(ctx.state, club, ctx.me, ms);
  },

  getDashboard: (ctx) => dashboardRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club, ctx.now()),

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
    const { club } = requireBoardOrIncoming(ctx.state, ctx.params.clubId, ctx.me);
    findHandover(ctx.state, club.id);
    return handoverRes(ctx.state, club, ctx.me.id)!;
  },

  /** Bước 1: chọn ban mới. Chỉ chọn người đã nhận lời mời, mỗi người một vai. Chủ nhiệm cũ chọn lại chính mình thì phải xác nhận. */
  setHandoverBoard: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    atStep(findHandover(ctx.state, club.id), 1, "Bàn giao đang không ở bước chọn ban mới.");
    const body = parseBody(setBoardBody, ctx.body);
    const ids = [body.presidentId, ...(body.viceId ? [body.viceId] : []), ...(body.treasurerId ? [body.treasurerId] : []), ...body.headIds];
    if (new Set(ids).size !== ids.length) throw invalid("Mỗi người chỉ giữ một vai trong ban mới.");
    for (const id of ids) {
      const m = membershipOf(ctx.state, club.id, id);
      if (!m || m.invite !== "accepted") throw invalid("Ban mới chỉ gồm thành viên đã nhận lời mời.");
    }
    const sitting = ctx.state.memberships.find((m) => m.clubId === club.id && m.role === "president");
    if (sitting?.personId === body.presidentId && !body.confirmSelf) throw invalid("Chủ nhiệm hiện tại đang chọn lại chính mình. Cần xác nhận.");
    const s = ctx.update(saveHandoverBoard(club.id, { president: body.presidentId, vice: body.viceId, treasurer: body.treasurerId, heads: body.headIds }, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Bước 2: chốt số dư bằng số dư sổ quỹ lúc này. */
  lockHandoverBalance: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    atStep(findHandover(ctx.state, club.id), 2, "Bàn giao đang không ở bước chốt số dư.");
    const s = ctx.update(lockHandoverBalance(club.id, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Bước 3: đã xem kho bàn giao. Không chặn khi kho còn thiếu; số mục thiếu được ghi vào biên bản. */
  reviewHandoverKit: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    atStep(findHandover(ctx.state, club.id), 3, "Bàn giao đang không ở bước kiểm tra kho.");
    const s = ctx.update(reviewHandoverKit(club.id, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Bước 4: đổi tài khoản nhận quỹ. Lưu xong thì sang bước 5. Chỉ trả về 4 số cuối của tài khoản. */
  setHandoverReceiver: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    atStep(findHandover(ctx.state, club.id), 4, "Bàn giao đang không ở bước đổi tài khoản nhận quỹ.");
    const body = parseBody(setReceiverBody, ctx.body);
    const receiver = membershipOf(ctx.state, club.id, body.personId);
    if (!receiver || receiver.invite !== "accepted") throw invalid("Chủ tài khoản mới phải là thành viên đã nhận lời mời.");
    const s = ctx.update(saveHandoverAccount(club.id, { personId: body.personId, bank: body.bank, account: body.account }, body.transferRef ?? "", ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Bước 5, từng dòng: ghi người nhận quyền quản trị của một tài khoản trong kho. Đổi quyền thật làm ở chính dịch vụ. */
  transferHandoverAccount: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    atStep(findHandover(ctx.state, club.id), 5, "Bàn giao đang không ở bước chuyển quyền quản trị.");
    const account = ctx.state.kitAccounts.find((a) => a.id === ctx.params.itemId && a.clubId === club.id);
    if (!account) throw notFound("Không tìm thấy tài khoản này trong kho.");
    const body = parseBody(transferAccountBody, ctx.body);
    const holder = membershipOf(ctx.state, club.id, body.holderId);
    if (!holder || holder.invite !== "accepted") throw invalid("Người nhận quyền quản trị phải là thành viên đã nhận lời mời.");
    const s = ctx.update(transferHandoverAccount(club.id, account.id, body.holderId, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Hết bước 5 khi mọi tài khoản "bắt buộc chuyển khi bàn giao" đã chuyển. */
  finishHandoverTransfer: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    const h = atStep(findHandover(ctx.state, club.id), 5, "Bàn giao đang không ở bước chuyển quyền quản trị.");
    const left = ctx.state.kitAccounts.filter((a) => a.clubId === club.id && a.required && !h.transferred.includes(a.id));
    if (left.length) throw conflict(`Còn ${left.length} tài khoản bắt buộc chưa chuyển: ${left.map((a) => a.service).join(", ")}.`);
    const s = ctx.update(finishHandoverTransfer(club.id, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Bước 6: chỉ chủ nhiệm mới (người được chọn ở bước 1) bấm được. Xong thì biên bản không sửa được nữa. */
  acceptHandover: (ctx) => {
    const { club } = requireBoardOrIncoming(ctx.state, ctx.params.clubId, ctx.me);
    const h = atStep(findHandover(ctx.state, club.id), 6, "Bàn giao đang không ở bước ban mới xác nhận.");
    if (h.newBoard?.president !== ctx.me.id) throw forbidden("Chỉ chủ nhiệm mới được chọn ở bước 1 mới xác nhận đã nhận bàn giao.");
    const s = ctx.update(acceptHandover(club.id, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },

  /** Chỉ quay lại bước trước, và chỉ khi ban mới chưa xác nhận. Đi tiếp thì làm bằng thao tác của từng bước. */
  setHandoverStep: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    const h = findHandover(ctx.state, club.id);
    if (h.acceptedAt) throw conflict("Ban mới đã xác nhận nên biên bản không sửa được nữa.");
    const body = parseBody(setStepBody, ctx.body);
    if (body.step >= h.step) throw conflict("Chỉ quay lại được bước trước.");
    const s = ctx.update(setHandoverStep(club.id, body.step, ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },
};
