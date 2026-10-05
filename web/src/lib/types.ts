// Kiểu dữ liệu của bản MVP. Lấy từ các màn trong design/README.md (mục 6).
// Khi có backend, các kiểu này là hợp đồng giữa giao diện và API; Khoa chốt lại khi thiết kế cơ sở dữ liệu.

export type Role = "president" | "vice" | "treasurer" | "head" | "member";

export const ROLE_LABEL: Record<Role, string> = {
  president: "Chủ nhiệm",
  vice: "Phó chủ nhiệm",
  treasurer: "Thủ quỹ",
  head: "Trưởng ban",
  member: "Thành viên",
};

export const FIELDS = [
  "Học thuật, nghiên cứu",
  "Nghệ thuật, thể thao",
  "Tình nguyện, xã hội, kỹ năng sống",
  "Tổ chức sự kiện, truyền thông",
  "Khởi nghiệp, hướng nghiệp",
  "Khác",
] as const;
export type Field = (typeof FIELDS)[number];

export interface Person {
  id: string;
  name: string;
  email: string;
  year?: number;
  kind: "student" | "staff";
  staffTitle?: string;
}

/** Số liệu tĩnh của các CLB khác (bản demo chỉ có dữ liệu chi tiết của một CLB). */
export interface StaticClubStats {
  members: number;
  sessions: number;
  lastActivity: string;
  planned?: number;
  spent?: number;
  budgetSubmitted: boolean;
}

export interface Club {
  id: string;
  name: string;
  field: Field;
  schedule: string;
  location: string;
  acceptingApplications: boolean;
  mentor?: string;
  term: string;
  staticStats?: StaticClubStats;
}

export interface Membership {
  clubId: string;
  personId: string;
  code: string; // mã thành viên trong nội dung chuyển khoản, ví dụ A017
  department: string;
  role: Role;
  invite: "accepted" | "pending";
  inviteCode?: string;
  deletionRequestedAt?: string;
}

export interface Application {
  id: string;
  clubId: string;
  personId: string;
  name: string;
  email: string;
  year: number;
  reason: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: string;
  decidedBy?: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  kind: "session" | "open";
  start: string;
  end: string;
  location: string;
  checkinUntil: string;
  status: "upcoming" | "open" | "closed";
  closedAt?: string;
}

export interface Attendance {
  eventId: string;
  personId: string;
  at: string;
  method: "qr" | "manual";
  byPersonId?: string;
  deviceId?: string;
}

export interface Collection {
  id: string;
  clubId: string;
  term: string;
  name: string;
  amount: number;
  dueDate: string;
  codePrefix: string; // phần đầu nội dung chuyển khoản, ví dụ QFALL26
  receiverId: string;
  accountName: string; // tên chủ tài khoản như app ngân hàng hiện: viết hoa, không dấu
  bankLabel: string;
  last4: string;
}

export type PaymentStatus = "unpaid" | "reported" | "paid" | "partial";

export interface Payment {
  collectionId: string;
  personId: string;
  status: PaymentStatus;
  method?: "transfer" | "cash";
  amountPaid: number;
  reportedAt?: string;
  paidAt?: string;
  /** Tiền chuyển khoản thủ quỹ đã "Ghi nhận tay" mà chưa thấy trong sao kê. Dòng sao kê của khoản đó về thì chỉ nối, không ghi lần hai. */
  awaitingStatement?: number;
}

export interface LedgerEntry {
  id: string;
  clubId: string;
  date: string;
  direction: "in" | "out";
  amount: number;
  description: string;
  collectionId?: string;
  personId?: string;
  expenseId?: string;
  budgetItemId?: string;
  createdBy: string;
  createdAt: string;
}

export type TxnResult =
  | { kind: "auto"; personIds: string[]; alreadyRecorded?: true } // alreadyRecorded: thủ quỹ đã "Ghi nhận tay" trước đó, chỉ nối với sao kê
  | { kind: "manual"; reason: string; suggestion?: string[]; resolvedTo?: string[]; resolvedAt?: string }
  | { kind: "ignored"; reason: string };

export interface StatementTxn {
  id: string;
  date: string;
  amount: number;
  sender: string;
  content: string;
  result: TxnResult;
}

export interface Statement {
  id: string;
  clubId: string;
  collectionId: string;
  fileName: string;
  from: string;
  to: string;
  uploadedAt: string;
  txns: StatementTxn[];
}

export type ExpenseStatus = "pending" | "mentor" | "approved" | "rejected" | "spent";

export interface ExpenseRequest {
  id: string;
  clubId: string;
  kind: "proposal" | "reimbursement";
  title: string;
  amount: number;
  requesterId: string;
  createdAt: string;
  budgetItemId?: string;
  receipt?: string;
  reason: string;
  status: ExpenseStatus;
  history: { at: string; by: string; text: string }[];
  rejectNote?: string;
}

export interface BudgetItem {
  id: string;
  clubId: string;
  term: string;
  name: string;
  period: string;
  source: string;
  planned: number;
}

export interface Budget {
  clubId: string;
  term: string;
  submittedAt?: string;
  support: { amount: number; purpose: string; status: "pending" | "approved" | "rejected" };
}

export interface Handover {
  clubId: string;
  fromTerm: string;
  toTerm: string;
  step: number; // 1..6
  lockedBalance: number;
  newReceiver?: { personId: string; bank: string; account: string };
  transferRef?: string;
}

export interface Consent {
  personId: string;
  clubId: string;
  purpose: "membership" | "phone" | "age16" | "application";
  version: string;
  at: string;
  withdrawnAt?: string;
}

export interface AppState {
  v: number;
  persona: string | null;
  persons: Person[];
  clubs: Club[];
  memberships: Membership[];
  applications: Application[];
  events: ClubEvent[];
  attendance: Attendance[];
  collections: Collection[];
  payments: Payment[];
  ledger: LedgerEntry[];
  statements: Statement[];
  expenses: ExpenseRequest[];
  budgetItems: BudgetItem[];
  budgets: Budget[];
  handovers: Handover[];
  consents: Consent[];
}
