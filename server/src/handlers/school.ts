// Ban quản lý CLB của trường, mentor: chỉ thấy số tổng hợp, không thấy danh sách thành viên hay từng khoản đóng quỹ.

import { findClub, requireStaff } from "../access.ts";
import { approveExpense, rejectExpense, type AppState } from "../domain.ts";
import { conflict, HttpError, notFound } from "../errors.ts";
import { approveBody, parseBody, rejectBody } from "../schemas.ts";
import { expenseDto, schoolClubRes, schoolRowDto } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys = "listSchoolClubs" | "getSchoolClub" | "mentorApproveExpense" | "mentorRejectExpense";

/** Khoản đang chờ mentor duyệt (đã qua ban điều hành, trên mức mentor). */
/** Khoản đang chờ mentor, và người bấm không phải người đề xuất (không ai tự duyệt hay tự từ chối khoản của mình). */
function waitingExpense(s: AppState, expenseId: string, meId: string) {
  const e = s.expenses.find((x) => x.id === expenseId);
  if (!e) throw notFound("Không tìm thấy khoản chi.");
  if (e.status !== "mentor") throw conflict("Khoản này không chờ mentor duyệt.");
  if (e.requesterId === meId) throw new HttpError(403, "SELF_APPROVAL", "Bạn đề xuất khoản này, cần người khác duyệt.");
  return e;
}

export const schoolHandlers: Pick<Handlers, Keys> = {
  listSchoolClubs: (ctx) => {
    requireStaff(ctx.me);
    return {
      // Bản demo: mọi CLB cùng một học kỳ. Khi có dữ liệu thật thì lấy học kỳ hiện tại của trường.
      term: ctx.state.clubs[0]?.term ?? "",
      waitingMentor: ctx.state.expenses.filter((e) => e.status === "mentor").length,
      clubs: ctx.state.clubs.map((c) => schoolRowDto(ctx.state, c, ctx.now())),
    };
  },

  getSchoolClub: (ctx) => {
    requireStaff(ctx.me);
    return schoolClubRes(ctx.state, findClub(ctx.state, ctx.params.clubId), ctx.now());
  },

  mentorApproveExpense: (ctx) => {
    requireStaff(ctx.me);
    const e = waitingExpense(ctx.state, ctx.params.expenseId, ctx.me.id);
    const { note } = parseBody(approveBody, ctx.body);
    const s = ctx.update(approveExpense(e.id, ctx.me.id, ctx.nowIso(), note ?? ""));
    return { expense: expenseDto(s, s.expenses.find((x) => x.id === e.id)!) };
  },

  mentorRejectExpense: (ctx) => {
    requireStaff(ctx.me);
    const e = waitingExpense(ctx.state, ctx.params.expenseId, ctx.me.id);
    const body = parseBody(rejectBody, ctx.body);
    const s = ctx.update(rejectExpense(e.id, ctx.me.id, ctx.nowIso(), body.note));
    return { expense: expenseDto(s, s.expenses.find((x) => x.id === e.id)!) };
  },
};
