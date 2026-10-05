// Sổ quỹ của ban điều hành: đợt thu, đối soát sao kê, đề xuất và duyệt chi, dự trù kỳ.
// Luật tiền nằm trong domain (web/src/lib/actions.ts); ở đây kiểm tra quyền, trạng thái và dữ liệu gửi lên trước khi gọi.

import { requireBoard, requireRight } from "../access.ts";
import {
  addBudgetItem, approveExpense, balance, confirmPayment, createExpense, expensesOf, importStatement, markSpent, MENTOR_THRESHOLD,
  personName, readStatement, rejectExpense, resolveTxn, submitBudget, uid,
  type AppState, type Collection, type ExpenseRequest,
} from "../domain.ts";
import { conflict, HttpError, invalid, notFound } from "../errors.ts";
import { addBudgetItemBody, approveBody, createExpenseBody, parseBody, recordPaymentBody, rejectBody, resolveTxnBody, uploadStatementBody } from "../schemas.ts";
import { budgetRes, collectionRes, expenseDto, paymentRowDto, reconciliationRes, reconRow } from "../views.ts";
import type { Handlers } from "./types.ts";

type Keys =
  | "getCollection" | "recordPayment" | "getReconciliation" | "uploadStatement" | "resolveTxn"
  | "listExpenses" | "createExpense" | "approveExpense" | "rejectExpense" | "markExpenseSpent"
  | "getBudget" | "addBudgetItem" | "submitBudget";

function findCollection(s: AppState, clubId: string, collectionId: string): Collection {
  const c = s.collections.find((x) => x.id === collectionId && x.clubId === clubId);
  if (!c) throw notFound("Không tìm thấy đợt thu.");
  return c;
}

function findExpense(s: AppState, clubId: string, expenseId: string): ExpenseRequest {
  const e = s.expenses.find((x) => x.id === expenseId && x.clubId === clubId);
  if (!e) throw notFound("Không tìm thấy khoản chi.");
  return e;
}

/** Duyệt hoặc từ chối ở ban điều hành: khoản phải đang chờ duyệt và không do chính người bấm đề xuất. */
function checkBoardDecision(e: ExpenseRequest, meId: string): void {
  if (e.status !== "pending") throw conflict("Khoản này không ở trạng thái chờ duyệt.");
  if (e.requesterId === meId) throw new HttpError(403, "SELF_APPROVAL", "Bạn đề xuất khoản này, cần người khác duyệt.");
}

const expenseOf = (s: AppState, id: string) => expenseDto(s, s.expenses.find((x) => x.id === id)!);

export const moneyHandlers: Pick<Handlers, Keys> = {
  getCollection: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    return collectionRes(ctx.state, club.id, findCollection(ctx.state, club.id, ctx.params.collectionId));
  },

  /** Ghi tiền mặt, hoặc "Ghi nhận tay" một khoản chuyển khoản. Số tiền do máy chủ tính: phần còn thiếu của người đó. */
  recordPayment: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "money");
    const c = findCollection(ctx.state, club.id, ctx.params.collectionId);
    const body = parseBody(recordPaymentBody, ctx.body);
    const p = ctx.state.payments.find((x) => x.collectionId === c.id && x.personId === ctx.params.personId);
    if (!p) throw notFound("Người này không có trong đợt thu.");
    if (p.status === "paid") throw conflict(`${personName(ctx.state, p.personId)} đã đóng rồi.`);
    const s = ctx.update(confirmPayment({
      collectionId: c.id, personId: p.personId, method: body.method, amount: c.amount - p.amountPaid, at: ctx.nowIso(), by: ctx.me.id, ledgerId: uid("l"),
    }));
    return { payment: paymentRowDto(s, club.id, s.payments.find((x) => x.collectionId === c.id && x.personId === p.personId)!), balance: balance(s, club.id) };
  },

  getReconciliation: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    return reconciliationRes(ctx.state, findCollection(ctx.state, club.id, ctx.params.collectionId));
  },

  /** Thủ quỹ tải file sao kê. Giao dịch đúng mã, đúng tiền được ghi luôn vào sổ quỹ; dòng đã có ở lần tải trước không ghi lại. */
  uploadStatement: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "money");
    const c = findCollection(ctx.state, club.id, ctx.params.collectionId);
    const body = parseBody(uploadStatementBody, ctx.body);
    const { rows, badDates } = readStatement(body.csv);
    if (rows.length === 0) {
      throw invalid(badDates > 0
        ? `Không đọc được giao dịch tiền vào nào: ${badDates} dòng có ngày không có thật. Ngày ghi dạng ngày/tháng/năm, ví dụ 27/09/2026.`
        : "Không đọc được giao dịch tiền vào nào. File cần 4 cột: ngày (dd/mm/yyyy), số tiền, người chuyển, nội dung chuyển khoản.");
    }
    const id = uid("sk");
    const s = ctx.update(importStatement({ id, collectionId: c.id, fileName: body.fileName, rows, at: ctx.nowIso(), by: ctx.me.id }));
    const kinds = s.statements.find((x) => x.id === id)!.txns.map((t) => t.result.kind);
    return {
      statementId: id,
      txnCount: kinds.length,
      auto: kinds.filter((k) => k === "auto").length,
      manual: kinds.filter((k) => k === "manual").length,
      ignored: kinds.filter((k) => k === "ignored").length,
      skippedDates: badDates,
      balance: balance(s, club.id),
    };
  },

  /**
   * Gán tay một giao dịch cho một hay nhiều người. Tiền trong sao kê luôn được ghi đủ vào sổ quỹ:
   * người đã đóng rồi thì phần của họ ghi là đóng thừa; người đã "Ghi nhận tay" thì chỉ nối, không ghi lần hai.
   */
  resolveTxn: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "money");
    const c = findCollection(ctx.state, club.id, ctx.params.collectionId);
    const st = ctx.state.statements.find((x) => x.id === ctx.params.statementId && x.collectionId === c.id);
    if (!st) throw notFound("Không tìm thấy file sao kê.");
    const t = st.txns.find((x) => x.id === ctx.params.txnId);
    if (!t) throw notFound("Không tìm thấy giao dịch.");
    if (t.result.kind !== "manual") throw conflict("Giao dịch này không cần gán tay.");
    if (t.result.resolvedTo) throw conflict("Giao dịch này đã được gán rồi.");
    const body = parseBody(resolveTxnBody, ctx.body);
    const unknown = body.personIds.filter((id) => !ctx.state.payments.some((p) => p.collectionId === c.id && p.personId === id));
    if (unknown.length > 0) throw invalid("Có người được chọn không thuộc đợt thu này.", { personIds: unknown });
    const s = ctx.update(resolveTxn(st.id, t.id, body.personIds, ctx.me.id, ctx.nowIso()));
    return { row: reconRow(s, c, st.id, t.id), balance: balance(s, club.id) };
  },

  listExpenses: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    return { mentorThreshold: MENTOR_THRESHOLD, expenses: expensesOf(ctx.state, club.id).map((e) => expenseDto(ctx.state, e)) };
  },

  createExpense: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    const body = parseBody(createExpenseBody, ctx.body);
    if (body.budgetItemId && !ctx.state.budgetItems.some((b) => b.id === body.budgetItemId && b.clubId === club.id && b.term === club.term)) {
      throw invalid("Không tìm thấy khoản dự trù này.");
    }
    const id = uid("chi");
    const s = ctx.update(createExpense({
      id, clubId: club.id, kind: body.kind, title: body.title, amount: body.amount, requesterId: ctx.me.id, createdAt: ctx.nowIso(),
      budgetItemId: body.budgetItemId, receipt: body.hasReceipt ? "Có chứng từ (bản MVP chưa tải ảnh lên được)" : undefined, reason: body.reason ?? "",
    }));
    return { expense: expenseOf(s, id) };
  },

  /** Khoản trên mức mentor thì sau khi ban điều hành duyệt sẽ chuyển sang "chờ mentor". */
  approveExpense: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "approveExpense");
    const e = findExpense(ctx.state, club.id, ctx.params.expenseId);
    checkBoardDecision(e, ctx.me.id);
    const { note } = parseBody(approveBody, ctx.body);
    return { expense: expenseOf(ctx.update(approveExpense(e.id, ctx.me.id, ctx.nowIso(), note ?? "")), e.id) };
  },

  rejectExpense: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "approveExpense");
    const e = findExpense(ctx.state, club.id, ctx.params.expenseId);
    checkBoardDecision(e, ctx.me.id);
    const body = parseBody(rejectBody, ctx.body);
    return { expense: expenseOf(ctx.update(rejectExpense(e.id, ctx.me.id, ctx.nowIso(), body.note)), e.id) };
  },

  /** Thủ quỹ ghi khoản đã chi thật vào sổ quỹ. Chỉ khoản đã duyệt (kể cả mentor duyệt) mới ghi được. */
  markExpenseSpent: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "money");
    const e = findExpense(ctx.state, club.id, ctx.params.expenseId);
    if (e.status !== "approved") throw conflict("Chỉ ghi đã chi cho khoản đã duyệt.");
    const s = ctx.update(markSpent(e.id, ctx.me.id, ctx.nowIso(), uid("l")));
    return { expense: expenseOf(s, e.id), balance: balance(s, club.id) };
  },

  getBudget: (ctx) => budgetRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club),

  addBudgetItem: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "budget");
    const body = parseBody(addBudgetItemBody, ctx.body);
    const id = uid("dt");
    const s = ctx.update(addBudgetItem({
      id, clubId: club.id, term: club.term, name: body.name, period: body.period || "Chưa rõ", source: body.source || "Quỹ thành viên", planned: body.planned,
    }));
    return { item: budgetRes(s, club).items.find((b) => b.id === id)! };
  },

  submitBudget: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "budget");
    if (!ctx.state.budgets.some((b) => b.clubId === club.id && b.term === club.term)) throw conflict("CLB chưa có bản dự trù kỳ này.");
    return budgetRes(ctx.update(submitBudget(club.id, club.term, ctx.nowIso())), club);
  },
};
