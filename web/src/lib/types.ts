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

/**
 * Ban của một CLB (Hiệu chốt 09/11/2026): do chủ nhiệm cấu hình trước; mỗi ban đúng một trưởng ban,
 * một người được làm trưởng nhiều ban. Thành viên thuộc ban qua Membership.department (tên ban).
 */
export interface Department {
  id: string;
  clubId: string;
  name: string;
  headId?: string;
}

/** Thành viên chưa xếp ban. Không phải một ban: không có trong danh sách ban và không có trưởng ban. */
export const NO_DEPARTMENT = "Chưa xếp ban";

/** Ban gợi ý khi tạo CLB mới. Chỉ là gợi ý, chưa có nguồn nào nói CLB thường có những ban này. */
export const SAMPLE_DEPARTMENTS = ["Ban chủ nhiệm", "Hậu cần", "Truyền thông", "Sự kiện"];

/** Ban điều hành mới do chủ nhiệm cũ chọn ở bước 1. heads: trưởng của từng ban (mỗi ban một người; một người có thể làm trưởng nhiều ban). */
export interface NewBoard {
  president: string;
  vice?: string;
  treasurer?: string;
  heads: { department: string; personId: string }[];
}

/**
 * Bàn giao nhiệm kỳ, 7 bước: 1 chọn ban mới, 2 chốt số dư, 3 kiểm tra kho bàn giao, 4 đổi tài khoản nhận quỹ,
 * 5 chuyển quyền quản trị, 6 ban mới xác nhận, 7 biên bản. history là nội dung của biên bản.
 */
export interface Handover {
  clubId: string;
  fromTerm: string;
  toTerm: string;
  step: number; // 1..7
  lockedBalance: number;
  lockedAt?: string;
  newBoard?: NewBoard;
  newReceiver?: { personId: string; bank: string; account: string };
  transferRef?: string;
  /** Mã các mục kho (tài khoản) đã được chuyển quyền quản trị ở bước 5. */
  transferred: string[];
  acceptedAt?: string;
  acceptedBy?: string;
  /** Mentor (cán bộ trường) xác nhận biên bản sau khi ban mới đã nhận bàn giao (29/10/2026). */
  mentorConfirmedBy?: string;
  mentorConfirmedAt?: string;
  history: { at: string; by: string; text: string }[];
  /** Bản tóm tắt cho ban mới, do ban điều hành duyệt và sửa trước khi lưu vào biên bản. mock: viết bằng bản mẫu, chưa dùng AI thật. */
  summary?: { text: string; by: string; at: string; mock: boolean };
}

/**
 * Bàn giao MỘT vai (09/11/2026), tách khỏi bàn giao cả ban (`Handover`, mỗi CLB một bản).
 * Phó chủ nhiệm, thủ quỹ, trưởng ban gửi đơn lên chủ nhiệm (status "requested"); duyệt xong thì "active" và đi bước 2 đến 6; xác nhận xong là "done" (bước 7, biên bản).
 * Chủ nhiệm bàn giao vai của mình thì không cần đơn: vào "active" ngay.
 */
export type RoleHandoverStatus = "requested" | "waiting" | "kept" | "rejected" | "cancelled" | "active" | "done";

/** Kênh liên hệ trong nhật ký bàn giao hộ. */
export type ContactChannel = "phone" | "zalo" | "email" | "friend";

/** Một lần liên hệ với người giữ vai (bàn giao hộ): ngày (YYYY-MM-DD), kênh, kết quả, ảnh chụp màn hình đính kèm. */
export interface ContactAttempt {
  date: string;
  channel: ContactChannel;
  result: string;
  evidenceIds: string[];
}

/** Ảnh bằng chứng. Chỉ người gửi yêu cầu và cán bộ trường xem được; xóa sau 30 ngày. `data` là base64, chỉ máy chủ giữ. */
export interface EvidenceFile {
  id: string;
  clubId: string;
  uploaderId: string;
  /** Yêu cầu bàn giao hộ mà ảnh được gắn vào; trống là chưa gắn. */
  handoverId?: string;
  name: string;
  mime: "image/jpeg" | "image/png";
  size: number;
  uploadedAt: string;
  data: string;
}

export interface RoleHandover {
  id: string;
  clubId: string;
  role: Exclude<Role, "member">;
  /** Chỉ có khi role là "head": tên ban được bàn giao (mỗi ban một trưởng). */
  department?: string;
  fromId: string;
  /** Người nhận do người gửi đề xuất; người nhận vẫn tự xác nhận ở bước 6. */
  toId: string;
  reason: string;
  status: RoleHandoverStatus;
  /** 1 là đơn xin (chờ chủ nhiệm duyệt), 2 đến 6 là các bước làm, 7 là biên bản. */
  step: number;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  /** Lý do từ chối (bắt buộc khi status là "rejected"). */
  rejectReason?: string;
  lockedBalance?: number;
  lockedAt?: string;
  newReceiver?: { personId: string; bank: string; account: string };
  transferRef?: string;
  transferred: string[];
  acceptedAt?: string;
  history: { at: string; by: string; text: string }[];
  /** Lời dặn của người giao (hoặc người gửi, khi bàn giao hộ) cho người nhận, viết ở bước 3; người nhận đọc ở bước 6 và nằm trong biên bản. */
  note?: string;
  /** Những gì người giao đang giữ lúc làm bước 3 (biểu mẫu, tài khoản, việc chưa xong). Giữ lại để người nhận và biên bản còn thấy, dù quyền tài khoản đã chuyển ở bước 5. */
  snapshot?: { documents: { id: string; name: string }[]; accounts: { id: string; service: string; label: string; required: boolean }[]; tasks: { id: string; title: string; due: string }[] };
  /**
   * Chỉ có khi là bàn giao hộ: `fromId` là người giữ vai (không liên lạc được), `requesterId` là người gửi yêu cầu và làm các bước 2 đến 5 thay.
   * status "requested" là chờ duyệt bằng chứng; "waiting" là chờ hết `waitUntil` (3 ngày); "kept" là người giữ vai bấm "Tôi vẫn đảm nhận".
   */
  proxy?: { requesterId: string; contacts: ContactAttempt[]; approverId?: string; waitUntil?: string; keptAt?: string; executedBy?: string };
}

/** Số lượt dùng trợ lý theo CLB và học kỳ. Bản miễn phí giới hạn lượt hỏi theo kỳ; mức giới hạn chưa có. */
export interface AiUsage {
  clubId: string;
  term: string;
  asks: number;
  summaries: number;
}

export type PostKind = "event" | "promo" | "news";

export const POST_KIND_LABEL: Record<PostKind, string> = { event: "Sự kiện", promo: "Quảng bá", news: "Tin tức" };

/** Tin của CLB trên Cộng đồng: duyệt trước, hiện sau (Hiệu chốt 29/10/2026). Chỉ tin đã duyệt mới hiện cho mọi người. */
export type PostStatus = "pending" | "approved" | "rejected";

export const POST_STATUS_LABEL: Record<PostStatus, string> = { pending: "Chờ trường duyệt", approved: "Đã duyệt", rejected: "Bị từ chối" };

export interface ClubPost {
  id: string;
  clubId: string;
  kind: PostKind;
  title: string;
  body: string;
  /** Sự kiện: ngày giờ diễn ra và nơi diễn ra. */
  eventAt?: string;
  place?: string;
  status: PostStatus;
  createdBy: string;
  createdAt: string;
  /** Cán bộ trường duyệt hoặc từ chối, và lúc nào. Từ chối thì kèm lý do. */
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

export type TaskStatus = "todo" | "doing" | "done";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: "Chưa làm", doing: "Đang làm", done: "Xong" };

/** Việc cần làm của ban điều hành. */
export interface ClubTask {
  id: string;
  clubId: string;
  title: string;
  assigneeId: string;
  due: string;
  status: TaskStatus;
  /** Gắn với một buổi hay một quy trình của kho bàn giao, nếu có. */
  eventId?: string;
  processId?: string;
  createdBy: string;
  createdAt: string;
  history: { at: string; by: string; text: string }[];
}


// ---------- Kho bàn giao: những thứ ban cũ hay mang đi (biểu mẫu, cách làm, tài khoản). Không lưu mật khẩu. ----------

export type KitCategory = "permit" | "finance" | "media" | "other";

export const KIT_CATEGORY_LABEL: Record<KitCategory, string> = {
  permit: "Xin phép trường",
  finance: "Tài chính",
  media: "Truyền thông",
  other: "Khác",
};

/** Biểu mẫu hay tài liệu. Bản demo chỉ lưu tên và đường link, không lưu file. */
export interface KitDocument {
  id: string;
  clubId: string;
  name: string;
  category: KitCategory;
  link: string;
  holderId: string;
  updatedAt: string;
}

export interface KitStep {
  text: string;
  /** Ai làm bước này, ví dụ "Trưởng ban Hậu cần". */
  who: string;
}

/** Cách làm một việc: các bước đánh số, hạn thường gặp, biểu mẫu đi kèm. */
export interface KitProcess {
  id: string;
  clubId: string;
  name: string;
  steps: KitStep[];
  /** Thường phải xong trước ngày diễn ra bao nhiêu ngày. */
  leadDays?: number;
  documentIds: string[];
  updatedAt: string;
}

/** Tài khoản hay dịch vụ của CLB. Chỉ lưu tên dịch vụ, đường link và người giữ quyền quản trị. */
export interface KitAccount {
  id: string;
  clubId: string;
  service: string;
  /** Tên tài khoản hoặc đường link. */
  label: string;
  /** Người đang giữ quyền quản trị; trống là chưa ai nhận. */
  holderId?: string;
  ownership: "club" | "personal";
  /** Phải chuyển khi bàn giao. */
  required: boolean;
  updatedAt: string;
}

export interface Consent {
  personId: string;
  clubId: string;
  purpose: "membership" | "phone" | "age16" | "application";
  version: string;
  at: string;
  withdrawnAt?: string;
}

/** Loại thông báo trong mục Thông báo (chuông) của mỗi người. */
export type NotificationKind = "handover-accept" | "handover-done" | "handover-mentor" | "post-pending" | "post-approved" | "post-rejected"
  | "role-handover-request" | "role-handover-decision" | "role-handover-accept" | "role-handover-done" | "role-handover-proxy";

/** Một thông báo gửi cho một người, giữ lại cả khi vai của họ đã đổi (ví dụ chủ nhiệm cũ vẫn thấy "Bàn giao xong"). Chưa có readAt là chưa đọc. */
export interface AppNotification {
  id: string;
  personId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  /** Đường dẫn trong web để mở khi bấm vào thông báo. */
  href?: string;
  readAt?: string;
}

export interface AppState {
  v: number;
  persona: string | null;
  persons: Person[];
  clubs: Club[];
  memberships: Membership[];
  departments: Department[];
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
  roleHandovers: RoleHandover[];
  evidence: EvidenceFile[];
  kitDocuments: KitDocument[];
  kitProcesses: KitProcess[];
  kitAccounts: KitAccount[];
  tasks: ClubTask[];
  posts: ClubPost[];
  aiUsage: AiUsage[];
  notifications: AppNotification[];
  consents: Consent[];
}
