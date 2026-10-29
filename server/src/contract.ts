// Hợp đồng API giữa web (giao diện) và server. BẢN NHÁP v0: chờ Khoa (Tech Lead) và nhóm giao diện duyệt.
// Bản để đọc: docs/api.md. Sửa ở đây thì sửa cả docs/api.md; test/contract.test.ts kiểm tra hai bên khớp nhau.
// File này không import gì, để web dùng được bằng `import type` mà không kéo theo code của server.

/** Mọi đường dẫn dưới đây đều nằm sau tiền tố này, ví dụ GET /api/v1/me. */
export const API_PREFIX = "/api/v1";

// ---------- Quy ước chung ----------

/** Tiền: số nguyên, đơn vị đồng. */
export type Money = number;
/** Thời điểm: chuỗi ISO 8601 có múi giờ, ví dụ "2026-10-02T19:02:00+07:00". */
export type IsoTime = string;

export type Role = "president" | "vice" | "treasurer" | "head" | "member";
export type PaymentStatus = "unpaid" | "reported" | "paid" | "partial";
export type ExpenseStatus = "pending" | "mentor" | "approved" | "rejected" | "spent";
export type EventStatus = "upcoming" | "open" | "closed";
export type ConsentPurpose = "membership" | "phone" | "age16" | "application";
export type KitCategory = "permit" | "finance" | "media" | "other";

export interface PersonRef {
  personId: string;
  name: string;
}

export type ErrorCode =
  | "UNAUTHENTICATED" // 401: chưa đăng nhập
  | "FORBIDDEN" // 403: vai trò không có quyền làm việc này
  | "SELF_APPROVAL" // 403: duyệt hoặc từ chối khoản do chính mình đề xuất
  | "NOT_FOUND" // 404
  | "VALIDATION" // 400: dữ liệu gửi lên thiếu hoặc sai
  | "CONFLICT" // 409: trạng thái hiện tại không cho làm việc này (đã duyệt, đã đóng, đã đóng tiền...)
  | "CHECKIN_NOT_OPEN" // 409: buổi chưa mở điểm danh
  | "CHECKIN_CLOSED" // 409: buổi đã đóng điểm danh
  | "QR_INVALID" // 400: mã QR sai hoặc hết hạn
  | "NOT_MEMBER" // 403: chưa là thành viên CLB; details: { clubId, clubName }
  | "INVITE_PENDING" // 403: chưa nhận lời mời; details: { clubName, inviteCode }
  | "DEVICE_USED" // 409: điện thoại đã điểm danh cho người khác trong buổi này
  | "TOO_MANY_ATTEMPTS" // 429: nhập sai mật khẩu quá nhiều lần, tạm khóa đăng nhập bằng mật khẩu; details: { until }
  | "NOT_IMPLEMENTED" // 501: chưa làm (ví dụ trợ lý AI thật)
  | "INTERNAL"; // 500

/**
 * Lý do đăng nhập Google không xong, máy chủ gửi về web bằng `/login?error=<mã>`. Web đổi mã thành câu có sẵn
 * (web/src/app/(auth)/login/auth-screen.tsx); mã lạ thì hiện một câu chung, để không ai gửi được link kèm câu báo giả.
 */
export type LoginErrorCode = "google-disabled" | "cancelled" | "expired" | "google-failed" | "email-unverified";

/** Mọi lỗi đều trả về dạng này. `message` là câu tiếng Việt hiện được cho người dùng. */
export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; details?: Record<string, unknown> };
}

// ---------- Kiểu dữ liệu dùng lại ----------

export interface ClubRef {
  id: string;
  name: string;
  term: string;
}

export interface MembershipDto {
  clubId: string;
  clubName: string;
  term: string;
  code: string; // mã trong nội dung chuyển khoản, ví dụ A017
  department: string;
  role: Role;
  invite: "accepted" | "pending";
  inviteCode?: string; // chỉ có khi chính người này chưa nhận lời mời
}

export interface EventDto {
  id: string;
  title: string;
  kind: "session" | "open"; // session: buổi sinh hoạt có điểm danh; open: sự kiện mở cho cả người ngoài CLB
  start: IsoTime;
  end: IsoTime;
  location: string;
  checkinUntil: IsoTime;
  status: EventStatus;
  closedAt?: IsoTime;
}

export interface CollectionDto {
  id: string;
  name: string;
  term: string;
  amount: Money; // mức thu mỗi người
  dueDate: IsoTime;
  codePrefix: string; // phần đầu nội dung chuyển khoản, ví dụ QFALL26
  receiver: PersonRef & { role?: Role }; // người nhận tiền (thường là thủ quỹ) và vai hiện tại của họ trong CLB
}

export interface CollectionStatsDto {
  total: number;
  paid: number;
  transfer: number;
  cash: number;
  reported: number;
  unpaid: number; // gồm cả người đóng thiếu
  paidAmount: Money;
  unpaidAmount: Money;
  expectedAmount: Money; // còn phải thu, tính cả người đã báo chuyển
  expectedCount: number;
}

export interface ApplicationDto {
  id: string;
  personId: string;
  name: string;
  email: string;
  year: number;
  reason: string;
  submittedAt: IsoTime;
  status: "pending" | "approved" | "rejected";
  decidedAt?: IsoTime;
}

export interface AttendanceDto {
  eventId: string;
  personId: string;
  name: string;
  code: string;
  at: IsoTime;
  method: "qr" | "manual";
  by?: PersonRef; // người điểm danh tay
}

export interface PaymentRowDto {
  personId: string;
  name: string;
  code: string;
  status: PaymentStatus;
  method?: "transfer" | "cash";
  amountPaid: Money;
  paidAt?: IsoTime;
  reportedAt?: IsoTime;
}

/** Trạng thái đóng quỹ của một người, dùng ở màn đối soát. hand-confirmed: thủ quỹ đã "Ghi nhận tay", chưa thấy trong sao kê. */
export type PayState = PaymentStatus | "hand-confirmed";

export interface ReconRowDto {
  statementId: string;
  txnId: string;
  fromEarlierFile: boolean; // giao dịch còn treo từ lần tải trước
  date: IsoTime;
  amount: Money;
  sender: string;
  content: string;
  reason: string; // vì sao chưa khớp, tính lúc tải file
  suggestion: { personId: string; name: string; code: string; state: PayState; amountPaid: Money }[];
  resolvedTo?: PersonRef[];
  resolvedAt?: IsoTime;
}

export interface ExpenseDto {
  id: string;
  kind: "proposal" | "reimbursement"; // đề xuất chi (chi trước khi tiêu) hoặc hoàn ứng (đã tiêu trước)
  title: string;
  amount: Money;
  status: ExpenseStatus;
  requester: PersonRef & { role?: Role; department?: string };
  createdAt: IsoTime;
  budgetItem?: { id: string; name: string; planned: Money; remaining: Money };
  receipt?: string; // bản MVP chưa tải ảnh, chỉ ghi có chứng từ hay không
  reason: string;
  rejectNote?: string;
  history: { at: IsoTime; by: PersonRef; text: string }[];
}

export interface BudgetItemDto {
  id: string;
  name: string;
  period: string;
  source: string;
  planned: Money;
  spent: Money; // lấy từ sổ quỹ
  remaining: Money;
}

export interface SupportDto {
  amount: Money;
  purpose: string;
  status: "pending" | "approved" | "rejected";
}

export interface ClubCardDto {
  id: string;
  name: string;
  field: string;
  schedule: string;
  location: string;
  acceptingApplications: boolean;
  members: number;
  lastActivity?: IsoTime;
  /** Quan hệ của người đang đăng nhập với CLB. invited: được duyệt nhưng chưa nhận lời mời. */
  my: { status: "member" | "invited" | "applied" | "rejected" | "none"; applicationSubmittedAt?: IsoTime; inviteCode?: string };
}

export interface SchoolClubRowDto {
  id: string;
  name: string;
  field: string;
  members: number;
  sessions: number; // số buổi có điểm danh trong kỳ
  lastActivity?: IsoTime;
  activeIn30Days: boolean; // có ít nhất một buổi điểm danh trong 30 ngày
  budgetSubmitted: boolean;
  planned?: Money;
  spent?: Money;
  waitingMentor: number; // số khoản của CLB này đang chờ mentor duyệt
  detailed: boolean; // false: bản demo chỉ có số tổng hợp của CLB này
}

// ---------- Kết quả trả về của từng API ----------

export interface MeRes {
  person: { id: string; name: string; email: string; kind: "student" | "staff"; staffTitle?: string; year?: number };
  memberships: MembershipDto[];
  /** Đăng nhập bằng mật khẩu: tên tài khoản đã đặt (chữ thường) và đã có mật khẩu chưa. Không bao giờ có mật khẩu hay mã băm. */
  account: { username?: string; hasPassword: boolean };
}

export interface MyClubRes {
  club: ClubRef;
  membership: { code: string; department: string; role: Role; deletionRequestedAt?: IsoTime };
  attendance: { attended: number; held: number };
  collection?: { id: string; name: string; amount: Money; payment?: { status: PaymentStatus; amountPaid: Money } };
  consents: { purpose: ConsentPurpose; version: string; at: IsoTime; withdrawnAt?: IsoTime }[];
}

export interface MyAttendanceRes {
  club: ClubRef;
  held: { eventId: string; title: string; start: IsoTime }[]; // các buổi đã mở điểm danh trong kỳ, cũ trước
  mine: { eventId: string; title: string; at: IsoTime; method: "qr" | "manual" }[]; // mới nhất trước
}

export interface MyExportRes {
  exportedAt: IsoTime;
  person: MeRes["person"];
  memberships: MembershipDto[];
  attendance: { clubId: string; eventId: string; title: string; at: IsoTime; method: "qr" | "manual" }[];
  payments: { collectionId: string; collectionName: string; status: PaymentStatus; amountPaid: Money; paidAt?: IsoTime }[];
  consents: { clubId: string; purpose: ConsentPurpose; version: string; at: IsoTime; withdrawnAt?: IsoTime }[];
  applications: ApplicationDto[];
}

export interface MyPaymentRes {
  club: { id: string; name: string };
  collection: { id: string; name: string; term: string; amount: Money; dueDate: IsoTime };
  payment: { status: PaymentStatus; amountPaid: Money; method?: "transfer" | "cash"; paidAt?: IsoTime; reportedAt?: IsoTime };
  transfer: {
    amountDue: Money;
    content: string; // nội dung chuyển khoản, ví dụ "QFALL26 A017"
    accountName: string; // tên chủ tài khoản như app ngân hàng hiện
    bankLabel: string;
    last4: string;
    receiver: PersonRef & { role?: Role }; // vai hiện tại trong CLB, để màn ghi đúng "Thủ quỹ…" hay "Chủ nhiệm…"
    qrPayload: string; // chuỗi để vẽ mã QR
    qrIsDemo: boolean; // true: chuỗi giả, quét không chuyển được tiền
  };
}

export interface ConsentRes {
  consents: MyClubRes["consents"];
}

export interface CheckinRes {
  attendance: AttendanceDto;
  created: boolean; // false: người này đã điểm danh buổi này từ trước
  event: { id: string; title: string; clubId: string; clubName: string };
}

export interface ClubsRes {
  term: string; // học kỳ đang xem. Bản demo: mọi CLB cùng một học kỳ
  clubs: ClubCardDto[];
}

export interface ClubRes {
  club: ClubCardDto;
}

export interface ApplicationRes {
  application: ApplicationDto;
}

export interface InviteRes {
  club: ClubRef;
  invitedBy?: PersonRef & { role: Role };
  email: string; // email được mời; phải trùng tài khoản đang đăng nhập
  consentVersion: string;
}

export interface AcceptInviteRes {
  membership: MembershipDto;
}

export interface BoardRes {
  club: ClubRef;
  me: PersonRef & { role: Role };
  counts: { pendingApplications: number; openManualTxns: number; pendingExpenses: number };
  nextSessionId?: string;
  collectionId?: string;
}

export interface DashboardRes {
  pendingApplications: { count: number; oldestAt?: IsoTime };
  pendingExpenses: { count: number; total: Money; titles: string[] };
  reconcile: { openManual: number; lastUploadAt?: IsoTime; reconciledTo?: IsoTime };
  budget: { term: string; forecast: Money };
  upcomingEvents: EventDto[]; // tối đa 2
  nextSessionId?: string;
  collection?: CollectionDto & { stats: CollectionStatsDto };
  balance: Money;
  recentLedger: { date: IsoTime; direction: "in" | "out"; amount: Money; label: string; count: number }[]; // khoản thu cùng ngày của cùng đợt thu được gộp
  /** CLB mới: trang chủ nhắc thêm thành viên, tạo buổi, tạo đợt thu khi còn trống. */
  setup: { members: number; events: number };
  /** Việc chưa xong: quá hạn trước, rồi hạn gần nhất; tối đa 4. */
  tasks: { open: number; overdue: number; items: { id: string; title: string; assignee: PersonRef; due: IsoTime; status: TaskStatus; overdue: boolean }[] };
  /** Có khi CLB đã bắt đầu bàn giao. */
  handover?: { step: number; toTerm: string; accepted: boolean };
  kit: { documents: number; processes: number; accounts: number; missing: number };
  /** Phân tích tự động từ dữ liệu điểm danh (phép đếm, không phải AI). Hiện ở khung "Có trong bản trả phí". */
  participation: { sessions: number; rate?: number; absentRuns: number };
}

export interface MembersRes {
  term: string;
  heldSessions: number;
  collection?: { id: string; amount: Money };
  members: {
    personId: string;
    code: string;
    name: string;
    email: string;
    department: string;
    role: Role;
    invite: "accepted" | "pending";
    inviteCode?: string; // chỉ có khi chưa nhận lời mời: ban điều hành sao chép link mời gửi qua Zalo
    deletionRequestedAt?: IsoTime;
    attended: number;
    payment?: { status: PaymentStatus; amountPaid: Money; method?: "transfer" | "cash" }; // method: để màn Thành viên ghi "Đã đóng · tiền mặt"
  }[];
}

export interface ApplicationsRes {
  applications: ApplicationDto[];
}

export interface ApproveApplicationRes {
  application: ApplicationDto;
  member: { personId: string; code: string; invite: "pending" | "accepted" };
}

export interface EventsRes {
  events: (EventDto & { attended: number })[]; // chưa đóng trước (sớm nhất trước), rồi tới buổi đã đóng; attended: số người đã điểm danh
  memberCount: number; // số thành viên, để ghi "N / tổng"
}

export interface CollectionsRes {
  collections: (CollectionDto & { stats: CollectionStatsDto })[]; // đợt tạo gần nhất trước
}

export interface CollectionInfoRes {
  collection: CollectionDto;
}

export interface CreateClubRes {
  club: ClubRef;
}

export interface AddMembersRes {
  /** Người vừa thêm, kèm mã lời mời để ban điều hành gửi link qua Zalo (bản demo chưa gửi email). */
  added: { personId: string; name: string; email: string; code: string; inviteCode: string }[];
}

export interface UpdateMemberRes {
  member: MembersRes["members"][number];
}

export interface EventDetailRes {
  event: EventDto;
  totalMembers: number;
  attendance: AttendanceDto[]; // mới nhất trước
  notCheckedIn: { personId: string; name: string; code: string; invite: "accepted" | "pending" }[];
}

export interface EventRes {
  event: EventDto;
}

export interface QrRes {
  token: string;
  checkinPath: string; // web ghép với địa chỉ của mình: `${origin}${checkinPath}`
  stepSeconds: number;
  refreshAt: IsoTime; // lúc nên lấy mã mới
  validUntil: IsoTime; // mã cũ vẫn nhận thêm một bước sau khi đổi
}

export interface ManualCheckinRes {
  attendance: AttendanceDto;
  created: boolean;
}

export interface CollectionRes {
  collection: CollectionDto;
  stats: CollectionStatsDto;
  payments: PaymentRowDto[]; // báo đã chuyển trước, rồi chưa đóng, rồi đã đóng; cùng nhóm thì theo mã
}

export interface RecordPaymentRes {
  payment: PaymentRowDto;
  balance: Money;
}

export interface ReconciliationRes {
  collection: CollectionDto;
  /** ignored gồm cả duplicates (giao dịch đã có ở lần tải trước, không ghi lại). */
  latest?: { id: string; fileName: string; txnCount: number; from: IsoTime; to: IsoTime; uploadedAt: IsoTime; auto: number; ignored: number; duplicates: number; resolvedManual: number };
  openManual: number;
  rows: ReconRowDto[]; // còn treo ở mọi lần tải, cộng những dòng đã gán trong file mới nhất
  reportedUnseen: { personId: string; name: string; code: string; reportedAt?: IsoTime }[];
  assignable: { personId: string; name: string; code: string; state: PayState }[]; // người chưa đóng đủ; báo đã chuyển xếp cuối
}

export interface UploadStatementRes {
  statementId: string;
  txnCount: number;
  auto: number;
  manual: number;
  ignored: number;
  skippedDates: number; // dòng tiền vào bị bỏ vì ngày không có thật (ví dụ 31/02)
  balance: Money;
}

export interface ResolveTxnRes {
  row: ReconRowDto;
  balance: Money;
}

export interface LedgerRes {
  balance: Money;
  entries: { id: string; date: IsoTime; direction: "in" | "out"; amount: Money; description: string; createdBy: PersonRef }[]; // cũ trước
}

export interface ExpensesRes {
  mentorThreshold: Money; // khoản lớn hơn mức này cần mentor duyệt thêm
  expenses: ExpenseDto[]; // mới nhất trước
}

export interface ExpenseRes {
  expense: ExpenseDto;
}

export interface MarkSpentRes {
  expense: ExpenseDto;
  balance: Money;
}

export interface BudgetRes {
  term: string;
  submittedAt?: IsoTime;
  support?: SupportDto;
  items: BudgetItemDto[];
  totals: { planned: Money; spent: Money; toSpend: Money };
  /**
   * Số dư cuối kỳ dự kiến = số dư hiện tại + còn phải thu + trường hỗ trợ − dự trù còn phải chi.
   * Còn phải thu cộng mọi đợt thu của kỳ (collections: số đợt). fee: mức thu khi kỳ chỉ có một đợt; nhiều đợt thì 0.
   */
  forecast: { current: Money; expected: Money; expectedCount: number; collections: number; fee: Money; support: Money; toSpend: Money; result: Money };
}

export interface BudgetItemRes {
  item: BudgetItemDto;
}

export interface HandoverRes {
  fromTerm: string;
  toTerm: string;
  /** 1 chọn ban mới, 2 chốt số dư, 3 kiểm tra kho bàn giao, 4 đổi tài khoản nhận quỹ, 5 chuyển quyền quản trị, 6 ban mới xác nhận, 7 biên bản. */
  step: number;
  lockedBalance: Money; // số dư đã chốt ở bước 2
  lockedAt?: IsoTime;
  currentBalance: Money;
  currentPresident?: PersonRef;
  currentReceiver?: PersonRef & { bankLabel: string; last4: string };
  newReceiver?: PersonRef & { bank: string; accountLast4: string };
  transferRef?: string;
  candidates: PersonRef[]; // thành viên đã nhận lời mời: chọn vào ban mới, làm chủ tài khoản mới
  memberCount: number;
  newBoard?: { president: PersonRef; vice?: PersonRef; treasurer?: PersonRef; heads: PersonRef[] };
  /** Việc còn dở lúc bàn giao, hiện ở bước 2 và 3. */
  open: { unpaid: number; reported: number; pendingExpenses: number; pendingExpenseTotal: Money; openManual: number; openTasks: number };
  kit: { documents: number; processes: number; accounts: number; missing: number; personal: number };
  /** Các tài khoản trong kho, cho bước 5. transferred: đã chuyển quyền quản trị ở bước 5. */
  accounts: { id: string; service: string; label: string; holder?: PersonRef; ownership: "club" | "personal"; required: boolean; transferred: boolean }[];
  acceptedAt?: IsoTime;
  acceptedBy?: PersonRef;
  /** Mentor (cán bộ trường) đã xác nhận biên bản. */
  mentorConfirmed?: { by: PersonRef; at: IsoTime };
  /** Nội dung biên bản: mỗi bước đã làm một dòng. */
  history: { at: IsoTime; by: PersonRef; text: string }[];
  mentor?: string;
  /** Người đang xem là chủ nhiệm mới: được bấm xác nhận ở bước 6. */
  canAccept: boolean;
  /** Bản tóm tắt cho ban mới đã lưu vào biên bản. mock: viết bằng bản mẫu, chưa dùng AI thật. */
  summary?: { text: string; by: PersonRef; at: IsoTime; mock: boolean };
}

export type TaskStatus = "todo" | "doing" | "done";

export interface TaskDto {
  id: string;
  title: string;
  assignee: PersonRef;
  due: IsoTime;
  status: TaskStatus;
  event?: { id: string; title: string };
  process?: { id: string; name: string };
  createdAt: IsoTime;
  history: { at: IsoTime; by: PersonRef; text: string }[];
}

export interface TasksRes {
  tasks: TaskDto[]; // hạn gần nhất trước
  /** Chọn người phụ trách, buổi và quy trình khi tạo việc. */
  assignees: PersonRef[];
  events: { id: string; title: string }[];
  processes: { id: string; name: string }[];
}

export interface TaskRes {
  task: TaskDto;
}

export interface MyTasksRes {
  tasks: (TaskDto & { club: ClubRef })[];
}

export type PostKind = "event" | "promo" | "news";
/** Duyệt trước, hiện sau: chỉ tin đã duyệt hiện cho mọi người (Hiệu chốt 29/10/2026). */
export type PostStatus = "pending" | "approved" | "rejected";

export interface PostDto {
  id: string;
  club: ClubRef;
  kind: PostKind;
  title: string;
  body: string;
  eventAt?: IsoTime; // sự kiện: ngày giờ diễn ra
  place?: string; // sự kiện: nơi diễn ra
  status: PostStatus;
  createdAt: IsoTime;
  /** Chỉ có khi chưa duyệt hoặc bị từ chối (người xem được những tin này vốn là người đăng, ban điều hành CLB đó hoặc cán bộ trường). */
  rejectReason?: string;
  /** Người đăng và người duyệt: chỉ có ở màn của ban điều hành CLB và của cán bộ trường, không có ở Cộng đồng chung. */
  author?: PersonRef;
  reviewedBy?: PersonRef;
  reviewedAt?: IsoTime;
}

export interface FeedRes {
  /** Mọi tin đã duyệt, cộng tin chưa duyệt hoặc bị từ chối của chính người xem (hiện mờ); mới nhất trước. */
  posts: PostDto[];
}

export interface PostRes {
  post: PostDto;
}

export interface ClubPostsRes {
  posts: PostDto[]; // mọi trạng thái, mới nhất trước
}

export interface SchoolPostsRes {
  pending: PostDto[]; // chờ lâu nhất trước
  reviewed: PostDto[]; // đã duyệt hoặc từ chối gần đây, mới nhất trước, tối đa 10
}

export interface KitDocumentDto {
  id: string;
  name: string;
  category: KitCategory;
  link: string; // đường link (Google Drive...). Bản demo không lưu file
  holder: PersonRef; // người đang giữ
  updatedAt: IsoTime;
}

export interface KitProcessDto {
  id: string;
  name: string;
  steps: { text: string; who: string }[]; // thứ tự là thứ tự làm
  leadDays?: number; // thường phải xong trước ngày diễn ra bao nhiêu ngày
  documents: { id: string; name: string }[]; // biểu mẫu đi kèm
  updatedAt: IsoTime;
}

/** Tài khoản hay dịch vụ của CLB. Không có mật khẩu: kho này không lưu mật khẩu. */
export interface KitAccountDto {
  id: string;
  service: string;
  label: string; // tên tài khoản hoặc đường link
  holder?: PersonRef; // vắng: chưa ai nhận quyền quản trị
  ownership: "club" | "personal";
  required: boolean; // phải chuyển khi bàn giao
  updatedAt: IsoTime;
}

export interface KitRes {
  documents: KitDocumentDto[];
  processes: KitProcessDto[];
  /** Chỉ ban điều hành có. Thành viên thường không thấy tài khoản và quyền truy cập. */
  accounts?: KitAccountDto[];
  /** accounts, missing, personal chỉ ban điều hành có. missing: tài khoản bắt buộc mà chưa ghi người giữ; personal: tài khoản đứng tên cá nhân. */
  summary: { documents: number; processes: number; accounts?: number; missing?: number; personal?: number };
  /** Chỉ ban điều hành có: các thành viên có thể chọn làm người giữ. */
  holders?: PersonRef[];
}

export interface KitDocumentRes {
  document: KitDocumentDto;
}

export interface KitProcessRes {
  process: KitProcessDto;
}

export interface KitAccountRes {
  account: KitAccountDto;
}

export type AiMode = "mock" | "real";

/** Số lượt dùng trợ lý của CLB trong học kỳ. limit: mức giới hạn lượt hỏi của bản miễn phí; vắng là chưa có mức giới hạn. */
export interface AiUsageDto {
  asks: number;
  summaries: number;
  limit?: number;
}

export interface AiStatusRes {
  mode: AiMode;
  usage: AiUsageDto;
}

export interface AiSummaryRes {
  mode: AiMode;
  text: string; // bản nháp, ban điều hành sửa được trước khi lưu vào biên bản
  bullets: string[];
  usage: AiUsageDto;
}

export interface AiSourceDto {
  kind: "document" | "process" | "account";
  id: string;
  name: string;
}

export interface AiAskRes {
  mode: AiMode;
  found: boolean; // false: không có trong kho, hoặc câu hỏi ngoài phạm vi (tiền, dữ liệu cá nhân)
  answer: string;
  sources: AiSourceDto[]; // mục kho đã dùng để trả lời, mở được từ màn
  usage: AiUsageDto;
}

export interface SchoolClubsRes {
  term: string; // học kỳ đang xem. Bản demo: mọi CLB cùng một học kỳ
  waitingMentor: number; // số khoản chờ mentor duyệt, mọi CLB
  clubs: SchoolClubRowDto[];
}

export interface SchoolClubRes {
  club: SchoolClubRowDto & { term: string; mentor?: string; president?: PersonRef };
  /** Không có khi bản demo chỉ có số tổng hợp của CLB này. Phía trường không thấy danh sách thành viên hay từng khoản đóng quỹ. */
  detail?: {
    budget: { submittedAt?: IsoTime; items: { id: string; name: string; planned: Money; spent: Money }[]; totals: { planned: Money; spent: Money }; support?: SupportDto };
    sessions: { count: number; averageAttendance: number; lastSessionStart?: IsoTime };
    waitingMentor: { id: string; title: string; amount: Money; boardApproval?: { by: PersonRef; at: IsoTime }; budgetItem?: { name: string; planned: Money }; receipt?: string }[];
    handover?: SchoolHandoverDto;
  };
}

/** Bàn giao của một CLB nhìn từ phía trường: accepted là ban mới đã xác nhận nhận; mentor chỉ xác nhận được sau đó. */
export interface SchoolHandoverDto {
  toTerm: string;
  step: number;
  accepted: boolean;
  mentorConfirmed?: { by: PersonRef; at: IsoTime };
}

export interface SchoolHandoverRes {
  handover: SchoolHandoverDto;
}

export interface HealthRes {
  ok: true;
  authMode: "demo" | "google";
  googleLogin: boolean; // máy chủ đã có khóa Google (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET): trang đăng nhập hiện nút Google
}

export interface ResetRes {
  ok: true;
}

export interface OkRes {
  ok: true;
}

/** API đăng nhập Google không trả JSON: máy chủ chuyển trình duyệt tới `location` (HTTP 302). */
export interface RedirectRes {
  location: string;
}

// ---------- Dữ liệu gửi lên ----------

export interface ApplyBody {
  year: number; // 1..5, 5 là "năm 5 trở lên"
  reason?: string;
  consent: true; // đồng ý cho ban điều hành xem họ tên, email, năm học để xét đơn
}

export interface AcceptInviteBody {
  membership: true; // bắt buộc: cho CLB lưu dữ liệu để quản lý thành viên
  age16: true; // bắt buộc: xác nhận đủ 16 tuổi
  phone: boolean; // không bắt buộc: cho lưu số điện thoại
}

export interface CheckinBody {
  eventId: string;
  token: string;
  deviceId: string; // mã ngẫu nhiên web lưu trong trình duyệt của điện thoại
}

export interface ManualCheckinBody {
  personId: string;
}

export interface RecordPaymentBody {
  method: "cash" | "transfer"; // cash: ghi tiền mặt; transfer: "Ghi nhận tay" khi đã thấy tiền vào tài khoản
}

export interface UploadStatementBody {
  fileName: string;
  csv: string; // nội dung file CSV: ngày, số tiền, người chuyển, nội dung chuyển khoản
}

export interface ResolveTxnBody {
  personIds: string[]; // một người, hoặc nhiều người khi chuyển hộ (tiền chia đều)
}

export interface CreateExpenseBody {
  kind: "proposal" | "reimbursement";
  title: string;
  amount: Money;
  budgetItemId?: string;
  reason?: string;
  hasReceipt?: boolean;
}

export interface RejectBody {
  note: string; // bắt buộc
}

export interface ApproveBody {
  note?: string; // không bắt buộc; có thì lưu vào lịch sử của khoản chi
}

export interface DevLoginBody {
  personId: string; // mã người trong dữ liệu mẫu, ví dụ a001
}

export interface PasswordLoginBody {
  login: string; // tên tài khoản hoặc email
  password: string;
}

/** Đặt hoặc đổi tên hiển thị, tên tài khoản và mật khẩu. currentPassword: bắt buộc khi đã có mật khẩu, trừ khi vừa đăng nhập Google. */
export interface UpdateAccountBody {
  name: string;
  username: string;
  password: string;
  currentPassword?: string;
}

export interface AddBudgetItemBody {
  name: string;
  period?: string;
  source?: string;
  planned: Money;
}

export interface SetReceiverBody {
  personId: string;
  bank: string;
  account: string; // chỉ gồm chữ số
  transferRef?: string;
}

export interface SetStepBody {
  step: number; // 1..7, chỉ được quay lại bước trước
}

export interface SetBoardBody {
  presidentId: string; // thành viên đã nhận lời mời
  viceId?: string;
  treasurerId?: string;
  headIds: string[];
  /** Chủ nhiệm hiện tại chọn lại chính mình thì phải gửi true. */
  confirmSelf?: true;
}

export interface TransferAccountBody {
  holderId: string; // người nhận quyền quản trị mới (thường là chủ nhiệm mới)
}

export interface TaskBody {
  title: string;
  assigneeId: string; // thành viên đã nhận lời mời
  due: IsoTime;
  eventId?: string; // buổi của CLB
  processId?: string; // quy trình trong kho bàn giao
}

export interface TaskStatusBody {
  status: TaskStatus;
}

export interface PostBody {
  kind: PostKind;
  title: string; // 1–120 ký tự
  body: string; // 1–2000 ký tự
  eventAt?: IsoTime; // bắt buộc khi kind là event, không có ở loại khác
  place?: string; // chỉ khi kind là event, tối đa 120 ký tự
}

export interface PostReviewBody {
  decision: "approve" | "reject";
  reason?: string; // bắt buộc khi từ chối, tối đa 300 ký tự
}

export interface AiAskBody {
  question: string; // 3–300 ký tự
}

export interface SaveSummaryBody {
  text: string; // bản tóm tắt đã sửa, 1–4000 ký tự
}

export interface KitDocumentBody {
  name: string;
  category: KitCategory;
  link: string; // bắt đầu bằng http:// hoặc https://
  holderId: string; // thành viên của CLB
}

export interface KitProcessBody {
  name: string;
  steps: { text: string; who: string }[]; // 1–20 bước
  leadDays?: number; // 0–365
  documentIds: string[]; // biểu mẫu của chính CLB này
}

export interface KitAccountBody {
  service: string;
  label: string;
  holderId?: string; // thành viên của CLB; bỏ trống là chưa ai nhận
  ownership: "club" | "personal";
  required: boolean;
}

export interface CreateClubBody {
  name: string;
  field: string; // một trong các lĩnh vực của web/src/lib/types.ts (FIELDS)
  schedule: string;
  location: string;
  term: string; // "Spring 2027", "Summer 2027", "Fall 2026"
  acceptingApplications: boolean;
  mentor?: string;
}

export interface AddMembersBody {
  members: { name: string; email: string; department?: string; year?: number }[]; // 1–300 người; email không trùng
}

export interface UpdateMemberBody {
  role: Role; // không đổi được thành chủ nhiệm hay đổi vai của chủ nhiệm (làm khi bàn giao)
  department: string;
}

export interface EventBody {
  title: string;
  kind: "session" | "open";
  start: IsoTime;
  end: IsoTime;
  location: string;
  checkinUntil: IsoTime; // từ lúc bắt đầu tới lúc kết thúc
}

export interface CreateCollectionBody {
  name: string;
  amount: Money;
  dueDate: IsoTime;
  codePrefix: string; // chữ in hoa và số, 2–10 ký tự, không trùng đợt thu khác của CLB
  receiverId: string; // thành viên đã nhận lời mời, thường là thủ quỹ
  accountName: string; // tên chủ tài khoản như app ngân hàng hiện; máy chủ đổi về chữ in hoa không dấu
  bank: string;
  account: string; // chỉ gồm chữ số; máy chủ chỉ lưu 4 số cuối
}

export interface UpdateCollectionBody {
  dueDate?: IsoTime;
  amount?: Money; // chỉ đổi được khi chưa ai đóng hay báo đã chuyển
}

// ---------- Bảng API ----------

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface EndpointMeta {
  method: Method;
  path: string;
  auth: "user" | "public";
  status?: 201;
  redirect?: true; // trả HTTP 302 tới RedirectRes.location thay cho JSON
  who: string; // ai được gọi
  screen: string; // màn dùng API này (tên màn trong design/screens)
}

/** Mỗi dòng là một API. Thêm hay đổi dòng nào thì sửa cả kiểu `Api` bên dưới và docs/api.md. */
export const ENDPOINTS = {
  health: { method: "GET", path: "/health", auth: "public", who: "Ai cũng gọi được", screen: "Kiểm tra máy chủ" },
  resetDemo: { method: "POST", path: "/demo/reset", auth: "public", who: "Chỉ khi chạy ở chế độ demo", screen: "Trang chọn vai (bản demo)" },

  googleLogin: { method: "GET", path: "/auth/google/start", auth: "public", redirect: true, who: "Ai cũng gọi được", screen: "Trang đăng nhập" },
  googleCallback: { method: "GET", path: "/auth/google/callback", auth: "public", redirect: true, who: "Google gọi lại sau khi đăng nhập", screen: "Trang đăng nhập" },
  devLogin: { method: "POST", path: "/auth/dev-login", auth: "public", who: "Chỉ khi chạy ở chế độ demo", screen: "Trang đăng nhập (bản demo)" },
  passwordLogin: { method: "POST", path: "/auth/login", auth: "public", who: "Ai cũng gọi được", screen: "Trang đăng nhập" },
  logout: { method: "POST", path: "/auth/logout", auth: "public", who: "Người đã đăng nhập", screen: "Mọi màn" },

  getMe: { method: "GET", path: "/me", auth: "user", who: "Người đã đăng nhập", screen: "Mọi màn" },
  updateAccount: { method: "PUT", path: "/me/account", auth: "user", who: "Người đã đăng nhập", screen: "Đặt tên tài khoản và mật khẩu" },
  getMyClub: { method: "GET", path: "/me/clubs/:clubId", auth: "user", who: "Thành viên đã nhận lời mời", screen: "TV-CuaToi" },
  getMyAttendance: { method: "GET", path: "/me/clubs/:clubId/attendance", auth: "user", who: "Thành viên đã nhận lời mời", screen: "TV-DiemDanh" },
  withdrawPhoneConsent: { method: "POST", path: "/me/clubs/:clubId/consents/phone/withdraw", auth: "user", who: "Thành viên đã nhận lời mời", screen: "TV-CuaToi" },
  requestDeletion: { method: "POST", path: "/me/clubs/:clubId/deletion-request", auth: "user", who: "Thành viên đã nhận lời mời", screen: "TV-CuaToi" },
  exportMyData: { method: "GET", path: "/me/export", auth: "user", who: "Người đã đăng nhập", screen: "TV-CuaToi" },
  listFeed: { method: "GET", path: "/feed", auth: "user", who: "Người đã đăng nhập", screen: "Cộng đồng (chưa có bản vẽ)" },
  getPost: { method: "GET", path: "/posts/:postId", auth: "user", who: "Người đã đăng nhập (tin chưa duyệt chỉ người đăng, ban điều hành CLB đó và cán bộ trường xem được)", screen: "Cộng đồng (chưa có bản vẽ)" },
  getMyTasks: { method: "GET", path: "/me/tasks", auth: "user", who: "Người đã đăng nhập", screen: "Việc của tôi (chưa có bản vẽ)" },
  getMyPayment: { method: "GET", path: "/me/collections/:collectionId", auth: "user", who: "Thành viên đã nhận lời mời", screen: "TV-DongQuy" },
  reportTransfer: { method: "POST", path: "/me/collections/:collectionId/report-transfer", auth: "user", who: "Thành viên đã nhận lời mời", screen: "TV-DongQuy" },
  checkIn: { method: "POST", path: "/checkin", auth: "user", who: "Thành viên quét mã QR", screen: "TV-DiemDanh" },

  listClubs: { method: "GET", path: "/clubs", auth: "user", who: "Người đã đăng nhập", screen: "SV-DanhSach" },
  getClub: { method: "GET", path: "/clubs/:clubId", auth: "user", who: "Người đã đăng nhập", screen: "SV-DonXinVao" },
  applyToClub: { method: "POST", path: "/clubs/:clubId/applications", auth: "user", status: 201, who: "Sinh viên chưa ở CLB", screen: "SV-DonXinVao" },
  createClub: { method: "POST", path: "/clubs", auth: "user", status: 201, who: "Người đã đăng nhập", screen: "Tạo CLB (chưa có bản vẽ)" },
  getInvite: { method: "GET", path: "/invites/:code", auth: "user", who: "Đúng người được mời", screen: "TV-LoiMoi" },
  acceptInvite: { method: "POST", path: "/invites/:code/accept", auth: "user", who: "Đúng người được mời", screen: "TV-LoiMoi" },

  getBoard: { method: "GET", path: "/clubs/:clubId/board", auth: "user", who: "Ban điều hành", screen: "Khung ban điều hành (sidebar)" },
  getDashboard: { method: "GET", path: "/clubs/:clubId/dashboard", auth: "user", who: "Ban điều hành", screen: "BDH-TrangChu" },
  listMembers: { method: "GET", path: "/clubs/:clubId/members", auth: "user", who: "Ban điều hành", screen: "BDH-ThanhVien" },
  addMembers: { method: "POST", path: "/clubs/:clubId/members", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Thêm thành viên (chưa có bản vẽ)" },
  updateMember: { method: "PUT", path: "/clubs/:clubId/members/:personId", auth: "user", who: "Chủ nhiệm", screen: "BDH-ThanhVien" },
  listApplications: { method: "GET", path: "/clubs/:clubId/applications", auth: "user", who: "Ban điều hành", screen: "BDH-ThanhVien" },
  approveApplication: { method: "POST", path: "/clubs/:clubId/applications/:applicationId/approve", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "BDH-ThanhVien" },
  rejectApplication: { method: "POST", path: "/clubs/:clubId/applications/:applicationId/reject", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "BDH-ThanhVien" },
  listEvents: { method: "GET", path: "/clubs/:clubId/events", auth: "user", who: "Ban điều hành", screen: "BDH-TrangChu" },
  getEvent: { method: "GET", path: "/clubs/:clubId/events/:eventId", auth: "user", who: "Ban điều hành", screen: "BDH-QR" },
  openEvent: { method: "POST", path: "/clubs/:clubId/events/:eventId/open", auth: "user", who: "Ban điều hành", screen: "BDH-QR" },
  closeEvent: { method: "POST", path: "/clubs/:clubId/events/:eventId/close", auth: "user", who: "Ban điều hành", screen: "BDH-QR" },
  getEventQr: { method: "GET", path: "/clubs/:clubId/events/:eventId/qr", auth: "user", who: "Ban điều hành", screen: "BDH-QR" },
  manualCheckIn: { method: "POST", path: "/clubs/:clubId/events/:eventId/attendance", auth: "user", who: "Ban điều hành", screen: "BDH-QR" },
  createEvent: { method: "POST", path: "/clubs/:clubId/events", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban, thủ quỹ", screen: "Danh sách buổi (chưa có bản vẽ)" },
  updateEvent: { method: "PUT", path: "/clubs/:clubId/events/:eventId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban, thủ quỹ", screen: "Danh sách buổi (chưa có bản vẽ)" },
  deleteEvent: { method: "DELETE", path: "/clubs/:clubId/events/:eventId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban, thủ quỹ", screen: "Danh sách buổi (chưa có bản vẽ)" },
  listCollections: { method: "GET", path: "/clubs/:clubId/collections", auth: "user", who: "Ban điều hành", screen: "BDH-DotThu" },
  createCollection: { method: "POST", path: "/clubs/:clubId/collections", auth: "user", status: 201, who: "Thủ quỹ, chủ nhiệm", screen: "Tạo đợt thu (chưa có bản vẽ)" },
  updateCollection: { method: "PUT", path: "/clubs/:clubId/collections/:collectionId", auth: "user", who: "Thủ quỹ, chủ nhiệm", screen: "BDH-DotThu" },
  getCollection: { method: "GET", path: "/clubs/:clubId/collections/:collectionId", auth: "user", who: "Ban điều hành", screen: "BDH-DotThu" },
  recordPayment: { method: "POST", path: "/clubs/:clubId/collections/:collectionId/payments/:personId", auth: "user", who: "Thủ quỹ, chủ nhiệm", screen: "BDH-DotThu" },
  getReconciliation: { method: "GET", path: "/clubs/:clubId/collections/:collectionId/reconciliation", auth: "user", who: "Ban điều hành", screen: "BDH-DoiSoat" },
  uploadStatement: { method: "POST", path: "/clubs/:clubId/collections/:collectionId/statements", auth: "user", status: 201, who: "Thủ quỹ, chủ nhiệm", screen: "BDH-DoiSoat" },
  resolveTxn: { method: "POST", path: "/clubs/:clubId/collections/:collectionId/statements/:statementId/txns/:txnId/resolve", auth: "user", who: "Thủ quỹ, chủ nhiệm", screen: "BDH-DoiSoat" },
  getLedger: { method: "GET", path: "/clubs/:clubId/ledger", auth: "user", who: "Ban điều hành", screen: "BDH-BanGiao (xuất sổ quỹ)" },
  listExpenses: { method: "GET", path: "/clubs/:clubId/expenses", auth: "user", who: "Ban điều hành", screen: "BDH-DuyetChi" },
  createExpense: { method: "POST", path: "/clubs/:clubId/expenses", auth: "user", status: 201, who: "Ban điều hành", screen: "BDH-DuyetChi" },
  approveExpense: { method: "POST", path: "/clubs/:clubId/expenses/:expenseId/approve", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban, trừ người đề xuất", screen: "BDH-DuyetChi" },
  rejectExpense: { method: "POST", path: "/clubs/:clubId/expenses/:expenseId/reject", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban, trừ người đề xuất", screen: "BDH-DuyetChi" },
  markExpenseSpent: { method: "POST", path: "/clubs/:clubId/expenses/:expenseId/spent", auth: "user", who: "Thủ quỹ, chủ nhiệm", screen: "BDH-DuyetChi" },
  getBudget: { method: "GET", path: "/clubs/:clubId/budget", auth: "user", who: "Ban điều hành", screen: "BDH-DuTru" },
  addBudgetItem: { method: "POST", path: "/clubs/:clubId/budget/items", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, thủ quỹ", screen: "BDH-DuTru" },
  submitBudget: { method: "POST", path: "/clubs/:clubId/budget/submit", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, thủ quỹ", screen: "BDH-DuTru" },
  getHandover: { method: "GET", path: "/clubs/:clubId/handover", auth: "user", who: "Ban điều hành", screen: "BDH-BanGiao" },
  setHandoverReceiver: { method: "PUT", path: "/clubs/:clubId/handover/receiver", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  setHandoverStep: { method: "PUT", path: "/clubs/:clubId/handover/step", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  setHandoverBoard: { method: "PUT", path: "/clubs/:clubId/handover/board", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  lockHandoverBalance: { method: "POST", path: "/clubs/:clubId/handover/lock-balance", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  reviewHandoverKit: { method: "POST", path: "/clubs/:clubId/handover/kit-review", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  transferHandoverAccount: { method: "POST", path: "/clubs/:clubId/handover/accounts/:itemId/transfer", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  finishHandoverTransfer: { method: "POST", path: "/clubs/:clubId/handover/transfer-done", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  acceptHandover: { method: "POST", path: "/clubs/:clubId/handover/accept", auth: "user", who: "Chủ nhiệm mới", screen: "BDH-BanGiao" },
  resubmitPost: { method: "PUT", path: "/clubs/:clubId/posts/:postId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Bảng tin của CLB (chưa có bản vẽ)" },
  listClubPosts: { method: "GET", path: "/clubs/:clubId/posts", auth: "user", who: "Ban điều hành", screen: "Bảng tin của CLB (chưa có bản vẽ)" },
  createPost: { method: "POST", path: "/clubs/:clubId/posts", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Bảng tin của CLB (chưa có bản vẽ)" },
  listTasks: { method: "GET", path: "/clubs/:clubId/tasks", auth: "user", who: "Ban điều hành", screen: "Việc cần làm (chưa có bản vẽ)" },
  createTask: { method: "POST", path: "/clubs/:clubId/tasks", auth: "user", status: 201, who: "Ban điều hành", screen: "Việc cần làm (chưa có bản vẽ)" },
  updateTask: { method: "PUT", path: "/clubs/:clubId/tasks/:taskId", auth: "user", who: "Ban điều hành", screen: "Việc cần làm (chưa có bản vẽ)" },
  getAiStatus: { method: "GET", path: "/clubs/:clubId/ai", auth: "user", who: "Thành viên đã nhận lời mời", screen: "Trợ lý bàn giao (chưa có bản vẽ)" },
  aiSummary: { method: "POST", path: "/clubs/:clubId/ai/summary", auth: "user", who: "Ban điều hành", screen: "Trợ lý bàn giao (chưa có bản vẽ)" },
  askAi: { method: "POST", path: "/clubs/:clubId/ai/ask", auth: "user", who: "Thành viên đã nhận lời mời (chỉ hỏi được phần mình thấy)", screen: "Trợ lý bàn giao (chưa có bản vẽ)" },
  saveHandoverSummary: { method: "PUT", path: "/clubs/:clubId/handover/summary", auth: "user", who: "Chủ nhiệm", screen: "BDH-BanGiao" },
  setTaskStatus: { method: "POST", path: "/clubs/:clubId/tasks/:taskId/status", auth: "user", who: "Ban điều hành, hoặc người được giao việc đó", screen: "Việc cần làm (chưa có bản vẽ)" },
  getKit: { method: "GET", path: "/clubs/:clubId/handover-kit", auth: "user", who: "Thành viên đã nhận lời mời (thành viên thường không thấy tài khoản)", screen: "Kho bàn giao (chưa có bản vẽ)" },
  createKitDocument: { method: "POST", path: "/clubs/:clubId/handover-kit/documents", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  updateKitDocument: { method: "PUT", path: "/clubs/:clubId/handover-kit/documents/:itemId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  deleteKitDocument: { method: "DELETE", path: "/clubs/:clubId/handover-kit/documents/:itemId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  createKitProcess: { method: "POST", path: "/clubs/:clubId/handover-kit/processes", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  updateKitProcess: { method: "PUT", path: "/clubs/:clubId/handover-kit/processes/:itemId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  deleteKitProcess: { method: "DELETE", path: "/clubs/:clubId/handover-kit/processes/:itemId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  createKitAccount: { method: "POST", path: "/clubs/:clubId/handover-kit/accounts", auth: "user", status: 201, who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  updateKitAccount: { method: "PUT", path: "/clubs/:clubId/handover-kit/accounts/:itemId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },
  deleteKitAccount: { method: "DELETE", path: "/clubs/:clubId/handover-kit/accounts/:itemId", auth: "user", who: "Chủ nhiệm, phó chủ nhiệm, trưởng ban", screen: "Kho bàn giao (chưa có bản vẽ)" },

  listSchoolPosts: { method: "GET", path: "/school/posts", auth: "user", who: "Cán bộ của trường", screen: "Duyệt tin (chưa có bản vẽ)" },
  reviewPost: { method: "POST", path: "/school/posts/:postId/review", auth: "user", who: "Cán bộ của trường", screen: "Duyệt tin (chưa có bản vẽ)" },
  listSchoolClubs: { method: "GET", path: "/school/clubs", auth: "user", who: "Cán bộ của trường", screen: "NT-TongQuan" },
  getSchoolClub: { method: "GET", path: "/school/clubs/:clubId", auth: "user", who: "Cán bộ của trường", screen: "NT-ChiTietCLB" },
  confirmHandover: { method: "POST", path: "/school/clubs/:clubId/handover/confirm", auth: "user", who: "Cán bộ của trường (mentor)", screen: "NT-ChiTietCLB" },
  mentorApproveExpense: { method: "POST", path: "/school/expenses/:expenseId/approve", auth: "user", who: "Cán bộ của trường (mentor)", screen: "NT-ChiTietCLB" },
  mentorRejectExpense: { method: "POST", path: "/school/expenses/:expenseId/reject", auth: "user", who: "Cán bộ của trường (mentor)", screen: "NT-ChiTietCLB" },
} as const satisfies Record<string, EndpointMeta>;

export type EndpointId = keyof typeof ENDPOINTS;

type NoBody = undefined;
type Club = { clubId: string };
type Item = { itemId: string };

/** Tham số trên đường dẫn, dữ liệu gửi lên và kết quả của từng API. */
export interface Api {
  health: { params: {}; body: NoBody; res: HealthRes };
  resetDemo: { params: {}; body: NoBody; res: ResetRes };

  /** ?next=/duong-dan: trang web mở lại sau khi đăng nhập xong. */
  googleLogin: { params: {}; body: NoBody; res: RedirectRes };
  /** Google gửi ?code, ?state (hoặc ?error). Xong thì về trang `next`; lỗi thì về /login?error=<LoginErrorCode> */
  googleCallback: { params: {}; body: NoBody; res: RedirectRes };
  devLogin: { params: {}; body: DevLoginBody; res: MeRes };
  passwordLogin: { params: {}; body: PasswordLoginBody; res: MeRes };
  logout: { params: {}; body: NoBody; res: OkRes };

  getMe: { params: {}; body: NoBody; res: MeRes };
  updateAccount: { params: {}; body: UpdateAccountBody; res: MeRes };
  getMyClub: { params: Club; body: NoBody; res: MyClubRes };
  getMyAttendance: { params: Club; body: NoBody; res: MyAttendanceRes };
  withdrawPhoneConsent: { params: Club; body: NoBody; res: ConsentRes };
  requestDeletion: { params: Club; body: NoBody; res: MyClubRes };
  exportMyData: { params: {}; body: NoBody; res: MyExportRes };
  listFeed: { params: {}; body: NoBody; res: FeedRes };
  getPost: { params: { postId: string }; body: NoBody; res: PostRes };
  getMyTasks: { params: {}; body: NoBody; res: MyTasksRes };
  getMyPayment: { params: { collectionId: string }; body: NoBody; res: MyPaymentRes };
  reportTransfer: { params: { collectionId: string }; body: NoBody; res: MyPaymentRes };
  checkIn: { params: {}; body: CheckinBody; res: CheckinRes };

  listClubs: { params: {}; body: NoBody; res: ClubsRes };
  getClub: { params: Club; body: NoBody; res: ClubRes };
  applyToClub: { params: Club; body: ApplyBody; res: ApplicationRes };
  createClub: { params: {}; body: CreateClubBody; res: CreateClubRes };
  getInvite: { params: { code: string }; body: NoBody; res: InviteRes };
  acceptInvite: { params: { code: string }; body: AcceptInviteBody; res: AcceptInviteRes };

  getBoard: { params: Club; body: NoBody; res: BoardRes };
  getDashboard: { params: Club; body: NoBody; res: DashboardRes };
  listMembers: { params: Club; body: NoBody; res: MembersRes };
  addMembers: { params: Club; body: AddMembersBody; res: AddMembersRes };
  updateMember: { params: Club & { personId: string }; body: UpdateMemberBody; res: UpdateMemberRes };
  /** Lọc bằng ?status=pending|approved|rejected; bỏ trống là pending. */
  listApplications: { params: Club; body: NoBody; res: ApplicationsRes };
  approveApplication: { params: Club & { applicationId: string }; body: NoBody; res: ApproveApplicationRes };
  rejectApplication: { params: Club & { applicationId: string }; body: NoBody; res: ApplicationRes };
  listEvents: { params: Club; body: NoBody; res: EventsRes };
  getEvent: { params: Club & { eventId: string }; body: NoBody; res: EventDetailRes };
  openEvent: { params: Club & { eventId: string }; body: NoBody; res: EventRes };
  closeEvent: { params: Club & { eventId: string }; body: NoBody; res: EventRes };
  getEventQr: { params: Club & { eventId: string }; body: NoBody; res: QrRes };
  manualCheckIn: { params: Club & { eventId: string }; body: ManualCheckinBody; res: ManualCheckinRes };
  createEvent: { params: Club; body: EventBody; res: EventRes };
  updateEvent: { params: Club & { eventId: string }; body: EventBody; res: EventRes };
  deleteEvent: { params: Club & { eventId: string }; body: NoBody; res: OkRes };
  listCollections: { params: Club; body: NoBody; res: CollectionsRes };
  createCollection: { params: Club; body: CreateCollectionBody; res: CollectionInfoRes };
  updateCollection: { params: Club & { collectionId: string }; body: UpdateCollectionBody; res: CollectionInfoRes };
  getCollection: { params: Club & { collectionId: string }; body: NoBody; res: CollectionRes };
  recordPayment: { params: Club & { collectionId: string; personId: string }; body: RecordPaymentBody; res: RecordPaymentRes };
  getReconciliation: { params: Club & { collectionId: string }; body: NoBody; res: ReconciliationRes };
  uploadStatement: { params: Club & { collectionId: string }; body: UploadStatementBody; res: UploadStatementRes };
  resolveTxn: { params: Club & { collectionId: string; statementId: string; txnId: string }; body: ResolveTxnBody; res: ResolveTxnRes };
  getLedger: { params: Club; body: NoBody; res: LedgerRes };
  listExpenses: { params: Club; body: NoBody; res: ExpensesRes };
  createExpense: { params: Club; body: CreateExpenseBody; res: ExpenseRes };
  approveExpense: { params: Club & { expenseId: string }; body: ApproveBody; res: ExpenseRes };
  rejectExpense: { params: Club & { expenseId: string }; body: RejectBody; res: ExpenseRes };
  markExpenseSpent: { params: Club & { expenseId: string }; body: NoBody; res: MarkSpentRes };
  getBudget: { params: Club; body: NoBody; res: BudgetRes };
  addBudgetItem: { params: Club; body: AddBudgetItemBody; res: BudgetItemRes };
  submitBudget: { params: Club; body: NoBody; res: BudgetRes };
  getHandover: { params: Club; body: NoBody; res: HandoverRes };
  setHandoverReceiver: { params: Club; body: SetReceiverBody; res: HandoverRes };
  setHandoverStep: { params: Club; body: SetStepBody; res: HandoverRes };
  setHandoverBoard: { params: Club; body: SetBoardBody; res: HandoverRes };
  lockHandoverBalance: { params: Club; body: NoBody; res: HandoverRes };
  reviewHandoverKit: { params: Club; body: NoBody; res: HandoverRes };
  transferHandoverAccount: { params: Club & Item; body: TransferAccountBody; res: HandoverRes };
  finishHandoverTransfer: { params: Club; body: NoBody; res: HandoverRes };
  acceptHandover: { params: Club; body: NoBody; res: HandoverRes };
  resubmitPost: { params: Club & { postId: string }; body: PostBody; res: PostRes };
  listClubPosts: { params: Club; body: NoBody; res: ClubPostsRes };
  createPost: { params: Club; body: PostBody; res: PostRes };
  listTasks: { params: Club; body: NoBody; res: TasksRes };
  createTask: { params: Club; body: TaskBody; res: TaskRes };
  updateTask: { params: Club & { taskId: string }; body: TaskBody; res: TaskRes };
  setTaskStatus: { params: Club & { taskId: string }; body: TaskStatusBody; res: TaskRes };
  getAiStatus: { params: Club; body: NoBody; res: AiStatusRes };
  aiSummary: { params: Club; body: NoBody; res: AiSummaryRes };
  askAi: { params: Club; body: AiAskBody; res: AiAskRes };
  saveHandoverSummary: { params: Club; body: SaveSummaryBody; res: HandoverRes };
  getKit: { params: Club; body: NoBody; res: KitRes };
  createKitDocument: { params: Club; body: KitDocumentBody; res: KitDocumentRes };
  updateKitDocument: { params: Club & Item; body: KitDocumentBody; res: KitDocumentRes };
  deleteKitDocument: { params: Club & Item; body: NoBody; res: OkRes };
  createKitProcess: { params: Club; body: KitProcessBody; res: KitProcessRes };
  updateKitProcess: { params: Club & Item; body: KitProcessBody; res: KitProcessRes };
  deleteKitProcess: { params: Club & Item; body: NoBody; res: OkRes };
  createKitAccount: { params: Club; body: KitAccountBody; res: KitAccountRes };
  updateKitAccount: { params: Club & Item; body: KitAccountBody; res: KitAccountRes };
  deleteKitAccount: { params: Club & Item; body: NoBody; res: OkRes };

  listSchoolPosts: { params: {}; body: NoBody; res: SchoolPostsRes };
  reviewPost: { params: { postId: string }; body: PostReviewBody; res: PostRes };
  listSchoolClubs: { params: {}; body: NoBody; res: SchoolClubsRes };
  getSchoolClub: { params: Club; body: NoBody; res: SchoolClubRes };
  confirmHandover: { params: Club; body: NoBody; res: SchoolHandoverRes };
  mentorApproveExpense: { params: { expenseId: string }; body: ApproveBody; res: ExpenseRes };
  mentorRejectExpense: { params: { expenseId: string }; body: RejectBody; res: ExpenseRes };
}

// Kiểm tra lúc biên dịch: bảng ENDPOINTS và kiểu Api phải có cùng danh sách API.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const CONTRACT_KEYS_MATCH: Same<EndpointId, keyof Api> = true;
