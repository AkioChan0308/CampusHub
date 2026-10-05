// Kiểm tra dữ liệu gửi lên. Mỗi schema phải khớp kiểu body trong contract.ts (`satisfies` báo lỗi khi lệch).
// Câu báo lỗi viết tiếng Việt vì web hiện thẳng cho người dùng.

import { z } from "zod";
import type * as C from "./contract.ts";
import { FIELDS, ROLE_LABEL, type Role } from "./domain.ts";

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
  step: z.number().int().min(1).max(6),
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
