// Đổi qua lại giữa AppState (dữ liệu luật nghiệp vụ dùng) và các bảng trong db/migrations/001_khoi_tao.sql.
// Mỗi bảng: tên cột theo đúng thứ tự, cột khóa, cách lấy các dòng từ AppState và cách dựng lại đối tượng từ một dòng.
// Thứ tự các bảng trong TABLES là thứ tự thêm dòng (bảng cha trước bảng con); xóa thì đi ngược lại.

import { nowIso, STATE_VERSION, type AppState, type Budget, type Club, type Consent, type ExpenseRequest, type Handover, type Statement } from "../domain.ts";

export type Val = string | number | boolean | null;
type Row = Record<string, unknown>;

export interface TableDef {
  name: string;
  cols: string[];
  /** Số cột đầu tiên của cols là khóa chính. */
  keyCount: number;
  /** Danh sách trong AppState sinh ra bảng này: danh sách không đổi (cùng tham chiếu) thì bỏ qua bảng khi so. */
  source: keyof AppState;
  rows(s: AppState): Val[][];
}

const n = <T,>(v: T | undefined): T | null => (v === undefined ? null : v);

export const TABLES: TableDef[] = [
  {
    name: "persons", source: "persons", keyCount: 1,
    cols: ["id", "name", "email", "school_year", "kind", "staff_title"],
    rows: (s) => s.persons.map((p) => [p.id, p.name, p.email, n(p.year), p.kind, n(p.staffTitle)]),
  },
  {
    name: "clubs", source: "clubs", keyCount: 1,
    cols: ["id", "name", "field", "schedule", "location", "accepting_applications", "mentor", "term", "static_stats"],
    rows: (s) => s.clubs.map((c) => [c.id, c.name, c.field, c.schedule, c.location, c.acceptingApplications, n(c.mentor), c.term, c.staticStats ? JSON.stringify(c.staticStats) : null]),
  },
  {
    name: "memberships", source: "memberships", keyCount: 2,
    cols: ["club_id", "person_id", "code", "department", "role", "invite", "invite_code", "deletion_requested_at"],
    rows: (s) => s.memberships.map((m) => [m.clubId, m.personId, m.code, m.department, m.role, m.invite, n(m.inviteCode), n(m.deletionRequestedAt)]),
  },
  {
    name: "applications", source: "applications", keyCount: 1,
    cols: ["id", "club_id", "person_id", "name", "email", "school_year", "reason", "submitted_at", "status", "decided_at", "decided_by"],
    rows: (s) => s.applications.map((a) => [a.id, a.clubId, a.personId, a.name, a.email, a.year, a.reason, a.submittedAt, a.status, n(a.decidedAt), n(a.decidedBy)]),
  },
  {
    name: "events", source: "events", keyCount: 1,
    cols: ["id", "club_id", "title", "kind", "start_at", "end_at", "location", "checkin_until", "status", "closed_at"],
    rows: (s) => s.events.map((e) => [e.id, e.clubId, e.title, e.kind, e.start, e.end, e.location, e.checkinUntil, e.status, n(e.closedAt)]),
  },
  {
    name: "attendance", source: "attendance", keyCount: 2,
    cols: ["event_id", "person_id", "at", "method", "by_person_id", "device_id"],
    rows: (s) => s.attendance.map((a) => [a.eventId, a.personId, a.at, a.method, n(a.byPersonId), n(a.deviceId)]),
  },
  {
    name: "collections", source: "collections", keyCount: 1,
    cols: ["id", "club_id", "term", "name", "amount", "due_date", "code_prefix", "receiver_id", "account_name", "bank_label", "last4"],
    rows: (s) => s.collections.map((c) => [c.id, c.clubId, c.term, c.name, c.amount, c.dueDate, c.codePrefix, c.receiverId, c.accountName, c.bankLabel, c.last4]),
  },
  {
    name: "payments", source: "payments", keyCount: 2,
    cols: ["collection_id", "person_id", "status", "method", "amount_paid", "reported_at", "paid_at", "awaiting_statement"],
    rows: (s) => s.payments.map((p) => [p.collectionId, p.personId, p.status, n(p.method), p.amountPaid, n(p.reportedAt), n(p.paidAt), n(p.awaitingStatement)]),
  },
  {
    name: "budget_items", source: "budgetItems", keyCount: 1,
    cols: ["id", "club_id", "term", "name", "period", "source", "planned"],
    rows: (s) => s.budgetItems.map((b) => [b.id, b.clubId, b.term, b.name, b.period, b.source, b.planned]),
  },
  {
    name: "expenses", source: "expenses", keyCount: 1,
    cols: ["id", "club_id", "kind", "title", "amount", "requester_id", "created_at", "budget_item_id", "receipt", "reason", "status", "reject_note"],
    rows: (s) => s.expenses.map((e) => [e.id, e.clubId, e.kind, e.title, e.amount, e.requesterId, e.createdAt, n(e.budgetItemId), n(e.receipt), e.reason, e.status, n(e.rejectNote)]),
  },
  {
    name: "expense_history", source: "expenses", keyCount: 2,
    cols: ["expense_id", "pos", "at", "by_person_id", "note"],
    rows: (s) => s.expenses.flatMap((e) => e.history.map((h, i) => [e.id, i, h.at, h.by, h.text])),
  },
  {
    name: "ledger", source: "ledger", keyCount: 1,
    cols: ["id", "club_id", "entry_date", "direction", "amount", "description", "collection_id", "person_id", "expense_id", "budget_item_id", "created_by", "created_at"],
    rows: (s) => s.ledger.map((l) => [l.id, l.clubId, l.date, l.direction, l.amount, l.description, n(l.collectionId), n(l.personId), n(l.expenseId), n(l.budgetItemId), l.createdBy, l.createdAt]),
  },
  {
    name: "statements", source: "statements", keyCount: 1,
    cols: ["id", "club_id", "collection_id", "file_name", "from_at", "to_at", "uploaded_at"],
    rows: (s) => s.statements.map((st) => [st.id, st.clubId, st.collectionId, st.fileName, st.from, st.to, st.uploadedAt]),
  },
  {
    name: "statement_txns", source: "statements", keyCount: 2,
    cols: ["statement_id", "id", "txn_date", "amount", "sender", "content", "result"],
    rows: (s) => s.statements.flatMap((st) => st.txns.map((t) => [st.id, t.id, t.date, t.amount, t.sender, t.content, JSON.stringify(t.result)])),
  },
  {
    name: "budgets", source: "budgets", keyCount: 2,
    cols: ["club_id", "term", "submitted_at", "support_amount", "support_purpose", "support_status"],
    rows: (s) => s.budgets.map((b) => [b.clubId, b.term, n(b.submittedAt), b.support.amount, b.support.purpose, b.support.status]),
  },
  {
    name: "handovers", source: "handovers", keyCount: 2,
    cols: ["club_id", "from_term", "to_term", "step", "locked_balance", "new_receiver_person_id", "new_receiver_bank", "new_receiver_account", "transfer_ref"],
    rows: (s) => s.handovers.map((h) => [h.clubId, h.fromTerm, h.toTerm, h.step, h.lockedBalance, n(h.newReceiver?.personId), n(h.newReceiver?.bank), n(h.newReceiver?.account), n(h.transferRef)]),
  },
  {
    // Nhật ký chỉ thêm vào cuối, không xóa (trigger chặn), nên vị trí trong danh sách là khóa ổn định.
    name: "consents", source: "consents", keyCount: 1,
    cols: ["pos", "person_id", "club_id", "purpose", "at", "version", "withdrawn_at"],
    rows: (s) => s.consents.map((c, i) => [i, c.personId, c.clubId, c.purpose, c.at, c.version, n(c.withdrawnAt)]),
  },
];

/** Các bảng dữ liệu (không gồm phiên đăng nhập và schema_migrations). */
export const DATA_TABLES = TABLES.map((t) => t.name);

// ---------- Từ các dòng trong cơ sở dữ liệu về AppState ----------

/** Bỏ các trường trống, để đối tượng giống hệt đối tượng do luật tạo ra (trường không bắt buộc thì vắng mặt). */
function clean<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}
/** Thời điểm đọc từ timestamptz, ghi lại theo giờ Việt Nam như mọi chuỗi thời điểm trong dữ liệu ("2026-10-02T19:02:00+07:00"). */
const time = (v: unknown): string => nowIso(v instanceof Date ? v.getTime() : Date.parse(String(v)));
const optTime = (v: unknown): string | undefined => (v === null || v === undefined ? undefined : time(v));
const opt = <T,>(v: unknown): T | undefined => (v === null || v === undefined ? undefined : (v as T));
const num = (v: unknown): number => Number(v);
const str = (v: unknown): string => String(v);
/** jsonb: PGlite và pg đều trả về đối tượng; phòng trường hợp trả chuỗi thì tự đọc. */
const json = <T,>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;

export function rowsToState(t: Record<string, Row[]>): AppState {
  const history = new Map<string, ExpenseRequest["history"]>();
  for (const r of t.expense_history) {
    const list = history.get(str(r.expense_id)) ?? [];
    list[num(r.pos)] = { at: time(r.at), by: str(r.by_person_id), text: str(r.note) };
    history.set(str(r.expense_id), list);
  }
  const txns = new Map<string, Statement["txns"]>();
  for (const r of t.statement_txns) {
    const list = txns.get(str(r.statement_id)) ?? [];
    list.push({ id: str(r.id), date: time(r.txn_date), amount: num(r.amount), sender: str(r.sender), content: str(r.content), result: json(r.result) });
    txns.set(str(r.statement_id), list);
  }
  return {
    v: STATE_VERSION,
    persona: null,
    persons: t.persons.map((r) => clean({ id: str(r.id), name: str(r.name), email: str(r.email), year: opt<number>(r.school_year), kind: r.kind as "student" | "staff", staffTitle: opt<string>(r.staff_title) })),
    clubs: t.clubs.map((r) => clean({
      id: str(r.id), name: str(r.name), field: r.field as Club["field"], schedule: str(r.schedule), location: str(r.location),
      acceptingApplications: Boolean(r.accepting_applications), mentor: opt<string>(r.mentor), term: str(r.term),
      staticStats: r.static_stats === null || r.static_stats === undefined ? undefined : json<Club["staticStats"]>(r.static_stats),
    })),
    memberships: t.memberships.map((r) => clean({
      clubId: str(r.club_id), personId: str(r.person_id), code: str(r.code), department: str(r.department), role: r.role as AppState["memberships"][number]["role"],
      invite: r.invite as "accepted" | "pending", inviteCode: opt<string>(r.invite_code), deletionRequestedAt: optTime(r.deletion_requested_at),
    })),
    applications: t.applications.map((r) => clean({
      id: str(r.id), clubId: str(r.club_id), personId: str(r.person_id), name: str(r.name), email: str(r.email), year: num(r.school_year),
      reason: str(r.reason), submittedAt: time(r.submitted_at), status: r.status as "pending" | "approved" | "rejected",
      decidedAt: optTime(r.decided_at), decidedBy: opt<string>(r.decided_by),
    })),
    events: t.events.map((r) => clean({
      id: str(r.id), clubId: str(r.club_id), title: str(r.title), kind: r.kind as "session" | "open", start: time(r.start_at), end: time(r.end_at),
      location: str(r.location), checkinUntil: time(r.checkin_until), status: r.status as "upcoming" | "open" | "closed", closedAt: optTime(r.closed_at),
    })),
    attendance: t.attendance.map((r) => clean({
      eventId: str(r.event_id), personId: str(r.person_id), at: time(r.at), method: r.method as "qr" | "manual",
      byPersonId: opt<string>(r.by_person_id), deviceId: opt<string>(r.device_id),
    })),
    collections: t.collections.map((r) => ({
      id: str(r.id), clubId: str(r.club_id), term: str(r.term), name: str(r.name), amount: num(r.amount), dueDate: time(r.due_date),
      codePrefix: str(r.code_prefix), receiverId: str(r.receiver_id), accountName: str(r.account_name), bankLabel: str(r.bank_label), last4: str(r.last4),
    })),
    payments: t.payments.map((r) => clean({
      collectionId: str(r.collection_id), personId: str(r.person_id), status: r.status as AppState["payments"][number]["status"],
      method: opt<"transfer" | "cash">(r.method), amountPaid: num(r.amount_paid), reportedAt: optTime(r.reported_at), paidAt: optTime(r.paid_at),
      awaitingStatement: r.awaiting_statement === null || r.awaiting_statement === undefined ? undefined : num(r.awaiting_statement),
    })),
    ledger: t.ledger.map((r) => clean({
      id: str(r.id), clubId: str(r.club_id), date: time(r.entry_date), direction: r.direction as "in" | "out", amount: num(r.amount), description: str(r.description),
      collectionId: opt<string>(r.collection_id), personId: opt<string>(r.person_id), expenseId: opt<string>(r.expense_id), budgetItemId: opt<string>(r.budget_item_id),
      createdBy: str(r.created_by), createdAt: time(r.created_at),
    })),
    statements: t.statements.map((r) => ({
      id: str(r.id), clubId: str(r.club_id), collectionId: str(r.collection_id), fileName: str(r.file_name),
      from: time(r.from_at), to: time(r.to_at), uploadedAt: time(r.uploaded_at), txns: txns.get(str(r.id)) ?? [],
    })),
    expenses: t.expenses.map((r) => clean({
      id: str(r.id), clubId: str(r.club_id), kind: r.kind as "proposal" | "reimbursement", title: str(r.title), amount: num(r.amount),
      requesterId: str(r.requester_id), createdAt: time(r.created_at), budgetItemId: opt<string>(r.budget_item_id), receipt: opt<string>(r.receipt),
      reason: str(r.reason), status: r.status as ExpenseRequest["status"], history: history.get(str(r.id)) ?? [], rejectNote: opt<string>(r.reject_note),
    })),
    budgetItems: t.budget_items.map((r) => ({
      id: str(r.id), clubId: str(r.club_id), term: str(r.term), name: str(r.name), period: str(r.period), source: str(r.source), planned: num(r.planned),
    })),
    budgets: t.budgets.map((r) => clean<Budget>({
      clubId: str(r.club_id), term: str(r.term), submittedAt: optTime(r.submitted_at),
      support: { amount: num(r.support_amount), purpose: str(r.support_purpose), status: r.support_status as Budget["support"]["status"] },
    })),
    handovers: t.handovers.map((r) => clean<Handover>({
      clubId: str(r.club_id), fromTerm: str(r.from_term), toTerm: str(r.to_term), step: num(r.step), lockedBalance: num(r.locked_balance),
      newReceiver: r.new_receiver_person_id === null || r.new_receiver_person_id === undefined ? undefined
        : { personId: str(r.new_receiver_person_id), bank: str(r.new_receiver_bank ?? ""), account: str(r.new_receiver_account ?? "") },
      transferRef: opt<string>(r.transfer_ref),
    })),
    consents: t.consents.map((r) => clean<Consent>({
      personId: str(r.person_id), clubId: str(r.club_id), purpose: r.purpose as Consent["purpose"], version: str(r.version), at: time(r.at), withdrawnAt: optTime(r.withdrawn_at),
    })),
  };
}
