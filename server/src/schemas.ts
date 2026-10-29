// Kiểm tra dữ liệu gửi lên. Mỗi schema phải khớp kiểu body trong contract.ts (`satisfies` báo lỗi khi lệch).
// Câu báo lỗi viết tiếng Việt vì web hiện thẳng cho người dùng.

import { z } from "zod";
import type * as C from "./contract.ts";
import { FIELDS, PASSWORD_MAX, ROLE_LABEL, type Role } from "./domain.ts";

/** Kiểm tra body; sai thì ném ZodError, app.ts đổi thành lỗi 400 VALIDATION. Request không có body coi như {}. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body ?? {});
}

const id = z.string().trim().min(1).max(120);
const text = (max: number, required: string) => z.string({ error: required }).trim().min(1, { error: required }).max(max, { error: `Tối đa ${max} ký tự.` });
const optionalText = (max: number) => z.string().trim().max(max, { error: `Tối đa ${max} ký tự.` }).optional();
const money = (required: string) => z.number({ error: required }).int({ error: "Số tiền phải là số nguyên, đơn vị đồng." }).positive({ error: required });

export const applyBody = z.object({
  year: z.number({ error: "Cần chọn năm học." }).int().min(1, { error: "Năm học từ 1 đến 5." }).max(5, { error: "Năm học từ 1 đến 5." }),
  reason: optionalText(2000),
  consent: z.literal(true, { error: "Cần đồng ý cho ban điều hành xem thông tin thì mới gửi được đơn." }),
}) satisfies z.ZodType<C.ApplyBody>;

export const acceptInviteBody = z.object({
  membership: z.literal(true, { error: "Cần đồng ý cho CLB lưu dữ liệu thì mới tham gia được." }),
  age16: z.literal(true, { error: "Cần xác nhận đã đủ 16 tuổi." }),
  phone: z.boolean().default(false),
}) satisfies z.ZodType<C.AcceptInviteBody>;

export const checkinBody = z.object({
  eventId: id,
  token: z.string().trim().min(1).max(64),
  deviceId: z.string().trim().min(8).max(120),
}) satisfies z.ZodType<C.CheckinBody>;

export const manualCheckinBody = z.object({ personId: id }) satisfies z.ZodType<C.ManualCheckinBody>;

export const recordPaymentBody = z.object({
  method: z.enum(["cash", "transfer"], { error: "Cách đóng phải là cash hoặc transfer." }),
}) satisfies z.ZodType<C.RecordPaymentBody>;

export const uploadStatementBody = z.object({
  fileName: text(200, "Thiếu tên file."),
  csv: z.string({ error: "Thiếu nội dung file." }).min(1, { error: "File trống." }).max(2_000_000, { error: "File quá lớn." }),
}) satisfies z.ZodType<C.UploadStatementBody>;

export const resolveTxnBody = z.object({
  personIds: z.array(id).min(1, { error: "Chọn ít nhất một thành viên." }).max(20)
    .refine((ids) => new Set(ids).size === ids.length, { error: "Một người được chọn hai lần." }),
}) satisfies z.ZodType<C.ResolveTxnBody>;

export const createExpenseBody = z.object({
  kind: z.enum(["proposal", "reimbursement"]),
  title: text(200, "Cần ghi nội dung chi."),
  amount: money("Cần ghi số tiền."),
  budgetItemId: id.optional(),
  reason: optionalText(2000),
  hasReceipt: z.boolean().optional(),
}) satisfies z.ZodType<C.CreateExpenseBody>;

export const rejectBody = z.object({
  note: text(1000, "Cần ghi chú lý do khi từ chối."),
}) satisfies z.ZodType<C.RejectBody>;

export const approveBody = z.object({
  note: optionalText(1000),
}) satisfies z.ZodType<C.ApproveBody>;

export const devLoginBody = z.object({ personId: id }) satisfies z.ZodType<C.DevLoginBody>;

// Mật khẩu không trim: khoảng trắng đầu cuối cũng là một phần của mật khẩu. Luật chi tiết kiểm ở handler (web/src/lib/account.ts).
const password = z.string({ error: "Cần nhập mật khẩu." }).min(1, { error: "Cần nhập mật khẩu." }).max(PASSWORD_MAX, { error: `Mật khẩu dài tối đa ${PASSWORD_MAX} ký tự.` });

export const passwordLoginBody = z.object({
  login: text(254, "Cần nhập tên tài khoản hoặc email."),
  password,
}) satisfies z.ZodType<C.PasswordLoginBody>;

export const updateAccountBody = z.object({
  name: z.string({ error: "Cần nhập tên hiển thị." }),
  username: z.string({ error: "Cần nhập tên tài khoản." }),
  password,
  currentPassword: password.optional(),
}) satisfies z.ZodType<C.UpdateAccountBody>;

export const addBudgetItemBody = z.object({
  name: text(200, "Cần ghi tên hoạt động."),
  period: optionalText(100),
  source: optionalText(200),
  planned: money("Cần ghi số tiền dự trù."),
}) satisfies z.ZodType<C.AddBudgetItemBody>;

export const setReceiverBody = z.object({
  personId: z.string({ error: "Cần chọn chủ tài khoản mới." }).trim().min(1, { error: "Cần chọn chủ tài khoản mới." }),
  bank: text(100, "Cần ghi ngân hàng."),
  account: z.string({ error: "Cần ghi số tài khoản." }).trim().regex(/^\d{4,30}$/, { error: "Số tài khoản chỉ gồm chữ số." }),
  transferRef: optionalText(100),
}) satisfies z.ZodType<C.SetReceiverBody>;

export const setStepBody = z.object({
  step: z.number().int().min(1).max(7),
}) satisfies z.ZodType<C.SetStepBody>;

// ---------- Tạo dữ liệu từ đầu (04/10/2026) ----------

const ROLES = Object.keys(ROLE_LABEL) as [Role, ...Role[]];
/** Thời điểm có múi giờ, ví dụ "2026-10-10T07:30:00+07:00". */
const time = (required: string) => z.iso.datetime({ offset: true, error: required });

export const createClubBody = z.object({
  name: text(100, "Cần ghi tên CLB."),
  field: z.enum(FIELDS, { error: "Cần chọn lĩnh vực." }),
  schedule: text(120, "Cần ghi lịch sinh hoạt."),
  location: text(120, "Cần ghi nơi sinh hoạt."),
  term: z.string({ error: "Cần chọn học kỳ." }).trim().regex(/^(Spring|Summer|Fall) 20\d{2}$/, { error: "Học kỳ ghi dạng \"Fall 2026\"." }),
  acceptingApplications: z.boolean(),
  mentor: optionalText(100),
}) satisfies z.ZodType<C.CreateClubBody>;

export const addMembersBody = z.object({
  members: z.array(z.object({
    name: text(100, "Thiếu họ tên."),
    email: z.string({ error: "Thiếu email." }).trim().pipe(z.email({ error: "Email không hợp lệ." })),
    department: optionalText(60),
    year: z.number().int().min(1, { error: "Năm học từ 1 đến 5." }).max(5, { error: "Năm học từ 1 đến 5." }).optional(),
  })).min(1, { error: "Danh sách trống." }).max(300, { error: "Mỗi lần thêm tối đa 300 người." })
    .refine((list) => new Set(list.map((m) => m.email.toLowerCase())).size === list.length, { error: "Có email bị trùng trong danh sách." }),
}) satisfies z.ZodType<C.AddMembersBody>;

export const updateMemberBody = z.object({
  role: z.enum(ROLES, { error: "Vai trò không hợp lệ." }),
  department: text(60, "Cần ghi ban."),
}) satisfies z.ZodType<C.UpdateMemberBody>;

export const eventBody = z.object({
  title: text(120, "Cần ghi tên buổi."),
  kind: z.enum(["session", "open"], { error: "Cần chọn loại buổi." }),
  start: time("Cần ghi giờ bắt đầu."),
  end: time("Cần ghi giờ kết thúc."),
  location: text(120, "Cần ghi nơi diễn ra."),
  checkinUntil: time("Cần ghi giờ đóng điểm danh."),
}).superRefine((e, ctx) => {
  const [start, end, until] = [Date.parse(e.start), Date.parse(e.end), Date.parse(e.checkinUntil)];
  if (end <= start) ctx.addIssue({ code: "custom", path: ["end"], message: "Giờ kết thúc phải sau giờ bắt đầu." });
  else if (until <= start || until > end) ctx.addIssue({ code: "custom", path: ["checkinUntil"], message: "Điểm danh mở tới một giờ trong buổi: sau giờ bắt đầu, không quá giờ kết thúc." });
}) satisfies z.ZodType<C.EventBody>;

export const createCollectionBody = z.object({
  name: text(120, "Cần ghi tên đợt thu."),
  amount: money("Cần ghi mức thu.").max(100_000_000, { error: "Mức thu quá lớn." }),
  dueDate: time("Cần ghi hạn đóng."),
  codePrefix: z.string({ error: "Cần ghi mã đầu nội dung chuyển khoản." }).trim().toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, { error: "Mã đầu nội dung chỉ gồm chữ không dấu và số, 2–10 ký tự." }),
  receiverId: z.string({ error: "Cần chọn người nhận tiền." }).trim().min(1, { error: "Cần chọn người nhận tiền." }),
  accountName: text(60, "Cần ghi tên chủ tài khoản."),
  bank: text(60, "Cần ghi ngân hàng."),
  account: z.string({ error: "Cần ghi số tài khoản." }).trim().regex(/^\d{4,30}$/, { error: "Số tài khoản chỉ gồm chữ số." }),
}) satisfies z.ZodType<C.CreateCollectionBody>;

export const updateCollectionBody = z.object({
  dueDate: time("Hạn đóng không hợp lệ.").optional(),
  amount: money("Mức thu không hợp lệ.").max(100_000_000, { error: "Mức thu quá lớn." }).optional(),
}).refine((b) => b.dueDate !== undefined || b.amount !== undefined, { error: "Chưa có gì để sửa." }) satisfies z.ZodType<C.UpdateCollectionBody>;

// ---------- Kho bàn giao (22/10/2026) ----------

/** Chỉ nhận đường link http(s): giao diện mở link này, nên không nhận javascript: hay đường dẫn lạ. */
const link = z.string({ error: "Cần ghi đường link." }).trim().min(1, { error: "Cần ghi đường link." })
  .max(500, { error: "Tối đa 500 ký tự." }).regex(/^https?:\/\/\S+$/i, { error: "Đường link phải bắt đầu bằng http:// hoặc https://." });

export const kitDocumentBody = z.object({
  name: text(150, "Cần ghi tên biểu mẫu."),
  category: z.enum(["permit", "finance", "media", "other"], { error: "Cần chọn nhóm." }),
  link,
  holderId: z.string({ error: "Cần chọn người giữ." }).trim().min(1, { error: "Cần chọn người giữ." }),
}) satisfies z.ZodType<C.KitDocumentBody>;

export const kitProcessBody = z.object({
  name: text(150, "Cần ghi tên quy trình."),
  steps: z.array(z.object({
    text: text(300, "Cần ghi nội dung bước."),
    who: z.string().trim().max(100, { error: "Tối đa 100 ký tự." }),
  })).min(1, { error: "Cần ít nhất một bước." }).max(20, { error: "Tối đa 20 bước." }),
  leadDays: z.number().int({ error: "Số ngày phải là số nguyên." }).min(0, { error: "Từ 0 đến 365 ngày." }).max(365, { error: "Từ 0 đến 365 ngày." }).optional(),
  documentIds: z.array(id).max(20).refine((ids) => new Set(ids).size === ids.length, { error: "Một biểu mẫu được chọn hai lần." }),
}) satisfies z.ZodType<C.KitProcessBody>;

export const kitAccountBody = z.object({
  service: text(100, "Cần ghi tên dịch vụ."),
  label: text(300, "Cần ghi tên tài khoản hoặc đường link."),
  holderId: id.optional(),
  ownership: z.enum(["club", "personal"], { error: "Cần chọn tài khoản đứng tên ai." }),
  required: z.boolean(),
}) satisfies z.ZodType<C.KitAccountBody>;

// ---------- Bàn giao 7 bước và việc cần làm (22/10/2026) ----------

export const setBoardBody = z.object({
  presidentId: z.string({ error: "Cần chọn chủ nhiệm mới." }).trim().min(1, { error: "Cần chọn chủ nhiệm mới." }),
  viceId: id.optional(),
  treasurerId: id.optional(),
  headIds: z.array(id).max(10, { error: "Tối đa 10 trưởng ban." }),
  confirmSelf: z.literal(true).optional(),
}) satisfies z.ZodType<C.SetBoardBody>;

export const transferAccountBody = z.object({
  holderId: z.string({ error: "Cần chọn người nhận quyền quản trị." }).trim().min(1, { error: "Cần chọn người nhận quyền quản trị." }),
}) satisfies z.ZodType<C.TransferAccountBody>;

export const taskBody = z.object({
  title: text(200, "Cần ghi tên việc."),
  assigneeId: z.string({ error: "Cần chọn người phụ trách." }).trim().min(1, { error: "Cần chọn người phụ trách." }),
  due: time("Cần ghi hạn."),
  eventId: id.optional(),
  processId: id.optional(),
}) satisfies z.ZodType<C.TaskBody>;

const POST_KINDS = ["event", "promo", "news"] as const;

/** Tin của CLB: sự kiện phải có ngày giờ diễn ra; loại khác không có ngày giờ và nơi diễn ra. */
export const postBody = z.object({
  kind: z.enum(POST_KINDS, { error: "Cần chọn loại tin." }),
  title: text(120, "Cần ghi tiêu đề."),
  body: text(2000, "Cần ghi nội dung."),
  eventAt: time("Cần ghi ngày giờ diễn ra.").optional(),
  place: z.string().trim().max(120, { error: "Tối đa 120 ký tự." }).optional(),
}).superRefine((v, ctx) => {
  if (v.kind === "event" && !v.eventAt) ctx.addIssue({ code: "custom", path: ["eventAt"], message: "Sự kiện cần ghi ngày giờ diễn ra." });
  if (v.kind !== "event" && (v.eventAt || v.place)) ctx.addIssue({ code: "custom", path: ["eventAt"], message: "Chỉ sự kiện mới có ngày giờ và nơi diễn ra." });
}) satisfies z.ZodType<C.PostBody>;

/** Từ chối thì bắt buộc có lý do, như luật duyệt chi. */
export const postReviewBody = z.object({
  decision: z.enum(["approve", "reject"], { error: "Cần chọn duyệt hoặc từ chối." }),
  reason: z.string().trim().max(300, { error: "Tối đa 300 ký tự." }).optional(),
}).superRefine((v, ctx) => {
  if (v.decision === "reject" && !v.reason) ctx.addIssue({ code: "custom", path: ["reason"], message: "Từ chối thì cần ghi lý do." });
}) satisfies z.ZodType<C.PostReviewBody>;

export const aiAskBody = z.object({
  question: text(300, "Cần gõ câu hỏi.").pipe(z.string().min(3, { error: "Câu hỏi quá ngắn." })),
}) satisfies z.ZodType<C.AiAskBody>;

export const saveSummaryBody = z.object({
  text: text(4000, "Bản tóm tắt đang trống."),
}) satisfies z.ZodType<C.SaveSummaryBody>;

export const taskStatusBody = z.object({
  status: z.enum(["todo", "doing", "done"], { error: "Trạng thái phải là todo, doing hoặc done." }),
}) satisfies z.ZodType<C.TaskStatusBody>;
