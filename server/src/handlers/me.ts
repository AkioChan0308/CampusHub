// Thành viên trên điện thoại: trang Của tôi, lịch sử điểm danh, đóng quỹ, quét QR điểm danh; tên tài khoản và mật khẩu của mình.

import { findClub, requireMember } from "../access.ts";
import { checkIn, displayNameError, markNotificationsRead, normalizeUsername, passwordError, reportTransfer, requestDeletion, setPersonName, usernameError, withdrawPhoneConsent } from "../domain.ts";
import { conflict, HttpError, invalid, notFound } from "../errors.ts";
import { hashPassword, verifyPassword } from "../password.ts";
import { verifyQrToken } from "../qr.ts";
import { checkinBody, parseBody, readNotificationsBody, updateAccountBody } from "../schemas.ts";
import { attendanceDto, meRes, myAttendanceRes, notificationsRes, myClubRes, myExportRes, myPaymentRes } from "../responses.ts";
import { lockedError } from "./auth.ts";
import type { Handlers } from "./types.ts";

type Keys = "getMe" | "getNotifications" | "readNotifications" | "updateAccount" | "getMyClub" | "getMyAttendance" | "withdrawPhoneConsent" | "requestDeletion" | "exportMyData" | "getMyPayment" | "reportTransfer" | "checkIn";

export const meHandlers: Pick<Handlers, Keys> = {
  getMe: (ctx) => meRes(ctx.state, ctx.me, ctx.auth.accounts.get(ctx.me.id)),

  /** Chỉ thấy thông báo của chính mình. */
  getNotifications: (ctx) => notificationsRes(ctx.state, ctx.me.id),

  readNotifications: (ctx) => {
    const body = parseBody(readNotificationsBody, ctx.body ?? {});
    ctx.update(markNotificationsRead(ctx.me.id, body.ids, ctx.nowIso()));
    return notificationsRes(ctx.state, ctx.me.id);
  },

  /**
   * Đặt hoặc đổi tên hiển thị, tên tài khoản, mật khẩu. Đã có mật khẩu thì phải nhập mật khẩu hiện tại,
   * trừ khi vừa đăng nhập Google (cách lấy lại mật khẩu khi quên). Nhập sai mật khẩu hiện tại cũng tính vào lần sai.
   */
  updateAccount: async (ctx) => {
    const body = parseBody(updateAccountBody, ctx.body);
    const me = ctx.me;
    const username = normalizeUsername(body.username);
    const fields: Record<string, string> = {};
    const nameError = displayNameError(body.name);
    if (nameError) fields.name = nameError;
    const userError = usernameError(body.username);
    if (userError) fields.username = userError;
    const pwError = passwordError(body.password, { username, email: me.email });
    if (pwError) fields.password = pwError;
    const first = Object.values(fields)[0];
    if (first) throw invalid(first, { fields });
    const taken = ctx.auth.accounts.byUsername(username);
    if (taken && taken.personId !== me.id) {
      const message = "Tên tài khoản này đã có người dùng. Chọn tên khác.";
      throw new HttpError(409, "CONFLICT", message, { fields: { username: message } });
    }
    const account = ctx.auth.accounts.get(me.id);
    if (account?.passwordHash && !ctx.auth.accounts.googleLoginRecent(me.id, ctx.now())) {
      if (account.lockedUntil && account.lockedUntil > ctx.now()) throw lockedError(account.lockedUntil);
      if (!body.currentPassword || !(await verifyPassword(body.currentPassword, account.passwordHash))) {
        const after = ctx.auth.accounts.recordFailure(me.id, ctx.now());
        if (after.lockedUntil && after.lockedUntil > ctx.now()) throw lockedError(after.lockedUntil);
        const message = body.currentPassword ? "Mật khẩu hiện tại không đúng." : "Cần nhập mật khẩu hiện tại.";
        throw invalid(message, { fields: { currentPassword: message } });
      }
    }
    ctx.auth.accounts.setCredentials(me.id, username, await hashPassword(body.password));
    if (body.name.trim() !== me.name) ctx.update(setPersonName(me.id, body.name));
    const person = ctx.state.persons.find((p) => p.id === me.id) ?? me;
    return meRes(ctx.state, person, ctx.auth.accounts.get(me.id));
  },

  getMyClub: (ctx) => {
    const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    return myClubRes(ctx.state, club, ctx.me, ms);
  },

  getMyAttendance: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    return myAttendanceRes(ctx.state, club, ctx.me);
  },

  withdrawPhoneConsent: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    const active = ctx.state.consents.some((c) => c.personId === ctx.me.id && c.clubId === club.id && c.purpose === "phone" && !c.withdrawnAt);
    if (!active) throw conflict("Bạn chưa cho lưu số điện thoại, hoặc đã rút đồng ý rồi.");
    const s = ctx.update(withdrawPhoneConsent(ctx.me.id, club.id, ctx.nowIso()));
    const ms = s.memberships.find((m) => m.clubId === club.id && m.personId === ctx.me.id)!;
    return { consents: myClubRes(s, club, ctx.me, ms).consents };
  },

  /** Gửi yêu cầu xóa dữ liệu. Gửi lại khi đã gửi thì giữ nguyên ngày gửi đầu tiên. */
  requestDeletion: (ctx) => {
    const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    if (ms.deletionRequestedAt) return myClubRes(ctx.state, club, ctx.me, ms);
    const s = ctx.update(requestDeletion(ctx.me.id, club.id, ctx.nowIso()));
    return myClubRes(s, club, ctx.me, s.memberships.find((m) => m.clubId === club.id && m.personId === ctx.me.id)!);
  },

  exportMyData: (ctx) => myExportRes(ctx.state, ctx.me, ctx.nowIso()),

  getMyPayment: (ctx) => {
    const c = ctx.state.collections.find((x) => x.id === ctx.params.collectionId);
    if (!c) throw notFound("Không tìm thấy đợt thu.");
    const { club, ms } = requireMember(ctx.state, c.clubId, ctx.me);
    return myPaymentRes(ctx.state, club, ms, c, ctx.me);
  },

  /** Thành viên bấm "Mình đã chuyển khoản". Bấm lại khi đã báo thì không đổi gì. */
  reportTransfer: (ctx) => {
    const c = ctx.state.collections.find((x) => x.id === ctx.params.collectionId);
    if (!c) throw notFound("Không tìm thấy đợt thu.");
    const { club, ms } = requireMember(ctx.state, c.clubId, ctx.me);
    const p = ctx.state.payments.find((x) => x.collectionId === c.id && x.personId === ctx.me.id);
    if (!p) throw notFound("Bạn không có trong đợt thu này.");
    if (p.status === "paid") throw conflict("Bạn đã đóng khoản này rồi.");
    const s = p.status === "reported" ? ctx.state : ctx.update(reportTransfer(c.id, ctx.me.id, ctx.nowIso()));
    return myPaymentRes(s, club, ms, c, ctx.me);
  },

  /**
   * Quét QR điểm danh. Thứ tự kiểm tra giống màn TV-DiemDanh: buổi có thật → đang mở → mã QR còn hạn
   * → là thành viên → đã nhận lời mời → điện thoại chưa điểm danh cho người khác trong buổi này.
   */
  checkIn: (ctx) => {
    const body = parseBody(checkinBody, ctx.body);
    const ev = ctx.state.events.find((e) => e.id === body.eventId);
    if (!ev) throw notFound("Không tìm thấy buổi này. Quét lại mã đang chiếu trên màn hình.");
    const club = findClub(ctx.state, ev.clubId);
    if (ev.status === "closed") throw new HttpError(409, "CHECKIN_CLOSED", "Buổi này đã đóng điểm danh. Nếu bạn có mặt mà chưa điểm danh, nhờ ban điều hành điểm danh tay.");
    if (ev.status === "upcoming") throw new HttpError(409, "CHECKIN_NOT_OPEN", "Buổi này chưa mở điểm danh. Chờ ban điều hành mở mã QR rồi quét lại.");
    if (!verifyQrToken(ctx.config.qrSecret, ev.id, body.token, ctx.now())) {
      throw new HttpError(400, "QR_INVALID", "Mã QR đã hết hạn. Mã đổi mỗi 30 giây, quét lại mã đang chiếu trên màn hình.");
    }
    requireMember(ctx.state, club.id, ctx.me);
    const event = { id: ev.id, title: ev.title, clubId: club.id, clubName: club.name };
    const mine = ctx.state.attendance.find((a) => a.eventId === ev.id && a.personId === ctx.me.id);
    if (mine) return { attendance: attendanceDto(ctx.state, club.id, mine), created: false, event };
    const usedByOther = ctx.state.attendance.some((a) => a.eventId === ev.id && a.deviceId === body.deviceId && a.personId !== ctx.me.id);
    if (usedByOther) {
      throw new HttpError(409, "DEVICE_USED", "Điện thoại này đã điểm danh cho người khác trong buổi này. Mỗi điện thoại chỉ điểm danh cho một người; nhờ ban điều hành điểm danh tay cho bạn.");
    }
    const s = ctx.update(checkIn({ eventId: ev.id, personId: ctx.me.id, at: ctx.nowIso(), method: "qr", deviceId: body.deviceId }));
    const a = s.attendance.find((x) => x.eventId === ev.id && x.personId === ctx.me.id)!;
    return { attendance: attendanceDto(s, club.id, a), created: true, event };
  },
};
