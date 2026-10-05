// Các phép tính đọc từ state: số dư, đợt thu, điểm danh, dự trù, việc chờ, quyền.
// Không sửa state ở đây. Khi có backend, phần lớn các phép tính này chuyển lên máy chủ.

import type { AppState, Club, Collection, ExpenseRequest, LedgerEntry, Membership, Payment, Person, Role, Statement } from "./types.ts";

export const MENTOR_THRESHOLD = 2_000_000; // mặc định trong "Phương án nghiệp vụ"; chưa chốt

type Action = "approveApplication" | "money" | "approveExpense" | "budget" | "handover" | "checkin" | "assignRole";

const RIGHTS: Record<Action, Role[]> = {
  approveApplication: ["president", "vice", "head"],
  money: ["president", "treasurer"],
  approveExpense: ["president", "vice", "head"],
  budget: ["president", "vice", "treasurer"],
  handover: ["president"],
  checkin: ["president", "vice", "head", "treasurer"],
  assignRole: ["president"],
};

export const RIGHT_LABEL: Record<Action, string> = {
  approveApplication: "Chỉ chủ nhiệm, phó chủ nhiệm và trưởng ban duyệt đơn.",
  money: "Chỉ thủ quỹ và chủ nhiệm ghi nhận tiền.",
  approveExpense: "Chỉ chủ nhiệm, phó chủ nhiệm và trưởng ban duyệt chi.",
  budget: "Chỉ chủ nhiệm, phó chủ nhiệm và thủ quỹ sửa dự trù.",
  handover: "Chỉ chủ nhiệm khởi tạo bàn giao.",
  checkin: "Chỉ ban điều hành mở điểm danh.",
  assignRole: "Chỉ chủ nhiệm đổi vai trò và ban của thành viên.",
};

export function can(role: Role | undefined, action: Action): boolean {
  return !!role && RIGHTS[action].includes(role);
}

export function person(s: AppState, id: string | undefined | null): Person | undefined {
  return id ? s.persons.find((p) => p.id === id) : undefined;
}

export function personName(s: AppState, id: string | undefined | null): string {
  return person(s, id)?.name ?? "Không rõ";
}

export function membershipOf(s: AppState, clubId: string, personId: string | null | undefined): Membership | undefined {
  return personId ? s.memberships.find((m) => m.clubId === clubId && m.personId === personId) : undefined;
}

export function clubMembers(s: AppState, clubId: string): Membership[] {
  return s.memberships.filter((m) => m.clubId === clubId);
}

export function balance(s: AppState, clubId: string): number {
  return s.ledger.filter((l) => l.clubId === clubId).reduce((sum, l) => sum + (l.direction === "in" ? l.amount : -l.amount), 0);
}

/** Đợt thu đang dùng của CLB: đợt tạo gần nhất. Các đợt cũ vẫn xem được ở màn Đợt thu. */
export function clubCollection(s: AppState, clubId: string): Collection | undefined {
  return s.collections.filter((c) => c.clubId === clubId).at(-1);
}

export function paymentsOf(s: AppState, collectionId: string): Payment[] {
  return s.payments.filter((p) => p.collectionId === collectionId);
}

export function collectionStats(s: AppState, collectionId: string) {
  const c = s.collections.find((x) => x.id === collectionId);
  const list = paymentsOf(s, collectionId);
  const paid = list.filter((p) => p.status === "paid");
  const reported = list.filter((p) => p.status === "reported");
  const unpaid = list.filter((p) => p.status === "unpaid" || p.status === "partial");
  const fee = c?.amount ?? 0;
  return {
    total: list.length,
    paid: paid.length,
    transfer: paid.filter((p) => p.method === "transfer").length,
    cash: paid.filter((p) => p.method === "cash").length,
    reported: reported.length,
    unpaid: unpaid.length,
    paidAmount: list.reduce((sum, p) => sum + p.amountPaid, 0),
    unpaidAmount: unpaid.reduce((sum, p) => sum + (fee - p.amountPaid), 0),
    expectedAmount: [...unpaid, ...reported].reduce((sum, p) => sum + (fee - p.amountPaid), 0),
    expectedCount: unpaid.length + reported.length,
  };
}

/** Các buổi sinh hoạt đã mở điểm danh (đang mở hoặc đã đóng). */
export function heldSessions(s: AppState, clubId: string) {
  return s.events.filter((e) => e.clubId === clubId && e.kind === "session" && e.status !== "upcoming").sort((a, b) => a.start.localeCompare(b.start));
}

export function attendanceOf(s: AppState, clubId: string, personId: string) {
  const held = heldSessions(s, clubId);
  const ids = new Set(held.map((e) => e.id));
  const attended = new Set(s.attendance.filter((a) => a.personId === personId && ids.has(a.eventId)).map((a) => a.eventId));
  return { held, attendedIds: attended, attended: attended.size };
}

export function upcomingEvents(s: AppState, clubId: string) {
  return s.events.filter((e) => e.clubId === clubId && e.status !== "closed").sort((a, b) => a.start.localeCompare(b.start));
}

export function nextSession(s: AppState, clubId: string) {
  return upcomingEvents(s, clubId).find((e) => e.kind === "session");
}

/** Gộp các khoản thu cùng ngày của cùng đợt thu, như trên màn Trang chủ. */
export function recentLedger(s: AppState, clubId: string, limit = 3) {
  const groups: { key: string; date: string; direction: "in" | "out"; amount: number; label: string; count: number }[] = [];
  const sorted = s.ledger.filter((l) => l.clubId === clubId).sort((a, b) => b.date.localeCompare(a.date));
  for (const l of sorted) {
    const day = l.date.slice(0, 10);
    const key = l.collectionId ? `${day}|${l.direction}|${l.collectionId}` : l.id;
    const g = groups.find((x) => x.key === key);
    if (g) { g.amount += l.amount; g.count += 1; continue; }
    const collection = l.collectionId ? s.collections.find((c) => c.id === l.collectionId) : undefined;
    groups.push({ key, date: l.date, direction: l.direction, amount: l.amount, label: collection ? collection.name : l.description, count: 1 });
  }
  return groups.slice(0, limit);
}

export function ledgerOf(s: AppState, clubId: string): LedgerEntry[] {
  return s.ledger.filter((l) => l.clubId === clubId).sort((a, b) => a.date.localeCompare(b.date));
}

/** Đợt thu thành viên mới phải đóng: đợt của kỳ hiện tại mà chưa quá hạn. Đợt kỳ trước, đợt đã quá hạn thì không tính. */
export function openCollections(s: AppState, clubId: string, at: string): Collection[] {
  const term = s.clubs.find((c) => c.id === clubId)?.term;
  return s.collections.filter((c) => c.clubId === clubId && c.term === term && Date.parse(c.dueDate) >= Date.parse(at));
}

/**
 * Dự trù kỳ. Số dư cuối kỳ dự kiến = số dư hiện tại + tiền còn phải thu + hỗ trợ dự kiến − phần dự trù chưa chi.
 * Trừ phần CHƯA CHI, vì khoản đã chi đã nằm trong số dư hiện tại. Tiền còn phải thu cộng mọi đợt thu của kỳ.
 * fee: mức thu khi kỳ chỉ có một đợt; nhiều đợt thì 0 (mỗi đợt một mức).
 */
export function budgetView(s: AppState, clubId: string, term: string) {
  const items = s.budgetItems.filter((b) => b.clubId === clubId && b.term === term).map((b) => {
    const spent = s.ledger.filter((l) => l.direction === "out" && l.budgetItemId === b.id).reduce((sum, l) => sum + l.amount, 0);
    return { ...b, spent, remaining: b.planned - spent };
  });
  const budget = s.budgets.find((b) => b.clubId === clubId && b.term === term);
  const planned = items.reduce((sum, b) => sum + b.planned, 0);
  const spent = items.reduce((sum, b) => sum + b.spent, 0);
  const toSpend = items.reduce((sum, b) => sum + Math.max(0, b.remaining), 0);
  const collections = s.collections.filter((c) => c.clubId === clubId && c.term === term);
  const stats = collections.map((c) => collectionStats(s, c.id));
  const expected = stats.reduce((sum, st) => sum + st.expectedAmount, 0);
  const expectedCount = stats.reduce((sum, st) => sum + st.expectedCount, 0);
  const support = budget && budget.support.status !== "rejected" ? budget.support.amount : 0;
  const current = balance(s, clubId);
  return {
    items, budget, planned, spent, toSpend, expected, expectedCount, collections: collections.length,
    fee: collections.length === 1 ? collections[0].amount : 0, support, current, forecast: current + expected + support - toSpend,
  };
}

/** File sao kê tải lên sau cùng. Hai file cùng giờ tải (cùng một giây) thì lấy file được thêm vào sau. */
export function latestStatement(s: AppState, collectionId: string): Statement | undefined {
  const list = s.statements.filter((x) => x.collectionId === collectionId);
  return list.reduce<Statement | undefined>((best, x) => (!best || x.uploadedAt >= best.uploadedAt ? x : best), undefined);
}

export function openManualTxns(st: Statement | undefined) {
  return st ? st.txns.filter((t) => t.result.kind === "manual" && !t.result.resolvedTo) : [];
}

export function statementsOf(s: AppState, collectionId: string): Statement[] {
  return s.statements.filter((x) => x.collectionId === collectionId).sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

/** Người thủ quỹ đã "Ghi nhận tay" là đã chuyển khoản, mà khoản đó chưa thấy trong sao kê (còn tiền chờ nối). */
export function handConfirmedTransfers(s: AppState, collectionId: string): Set<string> {
  return new Set(paymentsOf(s, collectionId).filter((p) => (p.awaitingStatement ?? 0) > 0).map((p) => p.personId));
}

/** Mọi giao dịch còn chờ gán tay, gom từ tất cả các lần tải sao kê (tải file mới không làm mất việc còn treo). */
export function openManualAll(s: AppState, collectionId: string) {
  return statementsOf(s, collectionId).flatMap((st) => openManualTxns(st).map((txn) => ({ statementId: st.id, txn })));
}

export function pendingApplications(s: AppState, clubId: string) {
  return s.applications.filter((a) => a.clubId === clubId && a.status === "pending").sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export function expensesOf(s: AppState, clubId: string): ExpenseRequest[] {
  return s.expenses.filter((e) => e.clubId === clubId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pendingExpenses(s: AppState, clubId: string) {
  return expensesOf(s, clubId).filter((e) => e.status === "pending");
}

/** Số liệu một CLB cho phía nhà trường: CLB demo tính từ dữ liệu, CLB khác dùng số tĩnh. */
export function clubSummary(s: AppState, club: Club) {
  if (club.staticStats) {
    const st = club.staticStats;
    return { members: st.members, sessions: st.sessions, lastActivity: st.lastActivity, budgetSubmitted: st.budgetSubmitted, planned: st.planned, spent: st.spent, detailed: false };
  }
  const held = heldSessions(s, club.id);
  const withAttendance = held.filter((e) => s.attendance.some((a) => a.eventId === e.id));
  const times = s.attendance.filter((a) => held.some((e) => e.id === a.eventId)).map((a) => a.at).sort();
  const bv = budgetView(s, club.id, club.term);
  return {
    members: clubMembers(s, club.id).length,
    sessions: withAttendance.length,
    lastActivity: times[times.length - 1] ?? "",
    budgetSubmitted: !!bv.budget?.submittedAt,
    planned: bv.planned,
    spent: bv.spent,
    detailed: true,
  };
}

export function averageAttendance(s: AppState, clubId: string) {
  const held = heldSessions(s, clubId).filter((e) => e.status === "closed");
  if (held.length === 0) return 0;
  const total = held.reduce((sum, e) => sum + s.attendance.filter((a) => a.eventId === e.id).length, 0);
  return Math.round(total / held.length);
}
