// Dữ liệu mẫu tự đặt, khớp với bản vẽ (design/README.md, mục 8). Không phải số liệu thật.
// Tên người và email là tên giả; email dùng tên miền example.com (tên miền dành riêng cho ví dụ).

import { classify, type MemberRef } from "./reconcile.ts";
import { toAsciiUpper } from "./text.ts";
import type {
  AppState, Attendance, Club, ClubEvent, ClubPost, ClubTask, Consent, KitAccount, KitDocument, KitProcess, LedgerEntry, Membership, Payment, Person, Role, StatementTxn,
} from "./types.ts";

export const STATE_VERSION = 7;
export const DEMO_CLUB_ID = "cau-long-san-nha";
export const DEMO_COLLECTION_ID = "quy-fall-2026";
export const DEMO_TERM = "Fall 2026";
const FEE = 100_000;
const CONSENT_VERSION = "chinh-sach-du-lieu-v1";

type Pay = "ck26" | "ck01" | "cash" | "rep" | "no";

// mã, họ tên, ban, vai trò, đóng quỹ, lời mời (a: đã nhận, p: chưa nhận)
const MEMBERS: [string, string, string, Role, Pay, "a" | "p"][] = [
  ["A001", "Phạm Quốc Bảo", "Ban chủ nhiệm", "president", "ck26", "a"],
  ["A002", "Lê Thu Hà", "Ban chủ nhiệm", "treasurer", "cash", "a"],
  ["A003", "Đinh Công Minh", "Ban chủ nhiệm", "vice", "ck26", "a"],
  ["A004", "Phan Thanh Tâm", "Chuyên môn", "member", "cash", "a"],
  ["A005", "Trần Gia Huy", "Hậu cần", "head", "ck26", "a"],
  ["A006", "Võ Ngọc Lan", "Hậu cần", "member", "ck26", "a"],
  ["A007", "Nguyễn Hải Đăng", "Truyền thông", "head", "ck26", "a"],
  ["A008", "Lương Khánh Linh", "Chuyên môn", "head", "ck26", "a"],
  ["A009", "Hoàng Minh Khôi", "Chuyên môn", "member", "ck26", "a"],
  ["A010", "Trương Mỹ Duyên", "Truyền thông", "member", "cash", "a"],
  ["A011", "Bùi Đức Thịnh", "Hậu cần", "member", "ck26", "a"],
  ["A012", "Ngô Gia Bảo", "Chuyên môn", "member", "ck26", "a"],
  ["A013", "Phùng Thảo Nhi", "Truyền thông", "member", "ck26", "a"],
  ["A014", "Tạ Quang Vinh", "Chuyên môn", "member", "ck26", "a"],
  ["A015", "Lâm Ngọc Hân", "Hậu cần", "member", "ck26", "a"],
  ["A016", "Châu Minh Triết", "Chuyên môn", "member", "ck26", "a"],
  ["A017", "Nguyễn Minh Anh", "Truyền thông", "member", "rep", "a"],
  ["A018", "Võ Hoàng Long", "Chuyên môn", "member", "ck26", "a"],
  ["A019", "Huỳnh Gia Hân", "Truyền thông", "member", "ck26", "a"],
  ["A020", "Đặng Tuấn Kiệt", "Hậu cần", "member", "ck26", "a"],
  ["A021", "Đỗ Bảo Ngọc", "Hậu cần", "member", "no", "a"],
  ["A022", "Lý Hoàng Nam", "Chuyên môn", "member", "no", "p"],
  ["A023", "Mai Phương Thảo", "Truyền thông", "member", "ck26", "a"],
  ["A024", "Hoàng Đức Trí", "Chuyên môn", "member", "rep", "a"],
  ["A025", "Kiều Anh Thư", "Truyền thông", "member", "ck01", "a"],
  ["A026", "Phạm Nhật Minh", "Chuyên môn", "member", "ck01", "a"],
  ["A027", "Trần Bảo Ngân", "Hậu cần", "member", "ck01", "a"],
  ["A028", "Lê Hữu Phước", "Chuyên môn", "member", "ck01", "a"],
  ["A029", "Vũ Thùy Dương", "Truyền thông", "member", "ck01", "a"],
  ["A030", "Bùi Khánh Vy", "Truyền thông", "member", "no", "a"],
  ["A031", "Nguyễn Thành Đạt", "Hậu cần", "member", "ck01", "a"],
  ["A032", "Tô Minh Châu", "Chuyên môn", "member", "ck26", "a"],
  ["A033", "Dương Quốc Huy", "Chuyên môn", "member", "no", "a"],
  ["A034", "Hà Phương Linh", "Truyền thông", "member", "ck26", "a"],
  ["A035", "Nguyễn Văn Sơn", "Hậu cần", "member", "no", "a"],
  ["A036", "Trịnh Gia Khang", "Chuyên môn", "member", "no", "p"],
  ["A037", "Lê Ngọc Ánh", "Truyền thông", "member", "no", "a"],
  ["A038", "Phan Đức Duy", "Hậu cần", "member", "no", "p"],
  ["A039", "Cao Thị Yến", "Truyền thông", "member", "no", "p"],
  ["A040", "Đoàn Minh Quân", "Chuyên môn", "member", "no", "p"],
  ["A041", "Lưu Thanh Hương", "Hậu cần", "member", "ck26", "a"],
  ["A042", "Mạc Tuấn Anh", "Chuyên môn", "member", "no", "p"],
];

const p2 = (n: number) => String(n).padStart(2, "0");

export function emailOf(name: string): string {
  const t = toAsciiUpper(name).toLowerCase().split(" ");
  return `${t.slice(1).slice(-2).join("")}.${t[0]}@example.com`;
}

const SESSIONS: [string, string][] = [
  ["tuan-1", "2026-09-05"],
  ["tuan-2", "2026-09-12"],
  ["tuan-3", "2026-09-19"],
  ["tuan-4", "2026-09-26"],
  ["tuan-5", "2026-10-03"],
];

// Kho bàn giao mẫu của CLB mẫu. Đường link dùng tên miền example.com (dành riêng cho ví dụ); không có mật khẩu nào.
const KIT_DOCUMENTS: KitDocument[] = [
  { id: "kit-mau-xin-phep", clubId: DEMO_CLUB_ID, name: "Mẫu xin phép tổ chức sự kiện", category: "permit", link: "https://example.com/mau-xin-phep-su-kien", holderId: "a001", updatedAt: "2026-08-20T09:00:00+07:00" },
  { id: "kit-bao-cao-cuoi-ky", clubId: DEMO_CLUB_ID, name: "Mẫu báo cáo cuối kỳ", category: "permit", link: "https://example.com/mau-bao-cao-cuoi-ky", holderId: "a001", updatedAt: "2026-06-15T09:00:00+07:00" },
  { id: "kit-de-xuat-chi", clubId: DEMO_CLUB_ID, name: "Mẫu đề xuất chi", category: "finance", link: "https://example.com/mau-de-xuat-chi", holderId: "a002", updatedAt: "2026-09-01T09:00:00+07:00" },
  { id: "kit-dang-ky-thanh-vien", clubId: DEMO_CLUB_ID, name: "Đơn đăng ký thành viên", category: "other", link: "https://example.com/don-dang-ky-thanh-vien", holderId: "a003", updatedAt: "2026-08-25T09:00:00+07:00" },
  { id: "kit-ke-hoach-ky", clubId: DEMO_CLUB_ID, name: "Kế hoạch học kỳ (mẫu)", category: "other", link: "https://example.com/ke-hoach-hoc-ky", holderId: "a003", updatedAt: "2026-08-25T09:00:00+07:00" },
];

const KIT_PROCESSES: KitProcess[] = [
  {
    id: "kit-xin-phong", clubId: DEMO_CLUB_ID, name: "Xin phòng họp", leadDays: 3, documentIds: [], updatedAt: "2026-08-20T09:00:00+07:00",
    steps: [
      { text: "Chọn ngày giờ và số người dự kiến", who: "Trưởng ban Hậu cần" },
      { text: "Gửi yêu cầu cho phòng quản lý CLB qua email của CLB", who: "Phó chủ nhiệm" },
      { text: "Chờ phòng xác nhận, thường trong 2 ngày làm việc", who: "Phó chủ nhiệm" },
      { text: "Báo lại cho nhóm Zalo của CLB", who: "Trưởng ban Truyền thông" },
    ],
  },
  {
    id: "kit-xin-phep-su-kien", clubId: DEMO_CLUB_ID, name: "Xin phép tổ chức sự kiện", leadDays: 7, documentIds: ["kit-mau-xin-phep", "kit-de-xuat-chi"], updatedAt: "2026-08-20T09:00:00+07:00",
    steps: [
      { text: "Viết kế hoạch sự kiện theo mẫu xin phép", who: "Chủ nhiệm" },
      { text: "Mentor ký xác nhận", who: "Chủ nhiệm" },
      { text: "Nộp cho phòng quản lý CLB", who: "Phó chủ nhiệm" },
      { text: "Nhận kết quả và gửi bản sao cho thủ quỹ", who: "Phó chủ nhiệm" },
      { text: "Đặt sân, đặt đồ theo kế hoạch đã duyệt", who: "Trưởng ban Hậu cần" },
    ],
  },
  {
    id: "kit-bao-cao-ky", clubId: DEMO_CLUB_ID, name: "Báo cáo cuối kỳ cho phòng quản lý CLB", leadDays: 14, documentIds: ["kit-bao-cao-cuoi-ky"], updatedAt: "2026-06-15T09:00:00+07:00",
    steps: [
      { text: "Gom số buổi sinh hoạt và điểm danh trong kỳ", who: "Chủ nhiệm" },
      { text: "Gom thu chi từ sổ quỹ", who: "Thủ quỹ" },
      { text: "Điền mẫu báo cáo và nộp trước hạn của phòng", who: "Chủ nhiệm" },
    ],
  },
];

const KIT_ACCOUNTS: KitAccount[] = [
  { id: "kit-fanpage", clubId: DEMO_CLUB_ID, service: "Fanpage Facebook", label: "https://example.com/fanpage-clb", holderId: "a001", ownership: "personal", required: true, updatedAt: "2026-09-01T09:00:00+07:00" },
  { id: "kit-zalo", clubId: DEMO_CLUB_ID, service: "Nhóm Zalo của CLB", label: "Nhóm chung của CLB", holderId: "a003", ownership: "club", required: false, updatedAt: "2026-09-01T09:00:00+07:00" },
  { id: "kit-drive", clubId: DEMO_CLUB_ID, service: "Google Drive", label: "https://example.com/drive-clb", holderId: "a001", ownership: "personal", required: true, updatedAt: "2026-09-01T09:00:00+07:00" },
  { id: "kit-email", clubId: DEMO_CLUB_ID, service: "Email của CLB", label: "clb.caulong.mau@example.com", ownership: "club", required: true, updatedAt: "2026-09-01T09:00:00+07:00" },
  { id: "kit-ngan-hang", clubId: DEMO_CLUB_ID, service: "Tài khoản ngân hàng nhận quỹ", label: "Tài khoản nhận quỹ kỳ Fall 2026", holderId: "a002", ownership: "personal", required: true, updatedAt: "2026-09-01T09:00:00+07:00" },
];

// Việc cần làm mẫu của CLB mẫu. Hạn đặt quanh ngày 22/10/2026 để có việc quá hạn khi xem demo; test dùng đồng hồ riêng.
const TASKS: ClubTask[] = [
  {
    id: "viec-dat-san", clubId: DEMO_CLUB_ID, title: "Đặt sân buổi giao lưu thứ Bảy", assigneeId: "a005", due: "2026-10-24T23:59:00+07:00", status: "doing", eventId: "giai-noi-bo",
    createdBy: "a001", createdAt: "2026-10-12T09:00:00+07:00",
    history: [{ at: "2026-10-12T09:00:00+07:00", by: "a001", text: "tạo việc, giao cho Trần Gia Huy" }, { at: "2026-10-14T20:00:00+07:00", by: "a005", text: "đổi trạng thái: đang làm" }],
  },
  {
    id: "viec-bao-cao", clubId: DEMO_CLUB_ID, title: "Gửi báo cáo giữa kỳ cho phòng quản lý CLB", assigneeId: "a001", due: "2026-10-15T23:59:00+07:00", status: "todo", processId: "kit-bao-cao-ky",
    createdBy: "a001", createdAt: "2026-10-05T09:00:00+07:00", history: [{ at: "2026-10-05T09:00:00+07:00", by: "a001", text: "tạo việc, giao cho Phạm Quốc Bảo" }],
  },
  {
    id: "viec-ao", clubId: DEMO_CLUB_ID, title: "Chốt mẫu và số lượng áo đồng phục", assigneeId: "a006", due: "2026-11-05T23:59:00+07:00", status: "todo",
    createdBy: "a003", createdAt: "2026-10-16T10:00:00+07:00", history: [{ at: "2026-10-16T10:00:00+07:00", by: "a003", text: "tạo việc, giao cho Võ Ngọc Lan" }],
  },
  {
    id: "viec-bai-tuyen", clubId: DEMO_CLUB_ID, title: "Đăng bài tuyển thành viên kỳ Spring 2027", assigneeId: "a007", due: "2026-10-18T23:59:00+07:00", status: "doing",
    createdBy: "a001", createdAt: "2026-10-08T09:00:00+07:00",
    history: [{ at: "2026-10-08T09:00:00+07:00", by: "a001", text: "tạo việc, giao cho Nguyễn Hải Đăng" }, { at: "2026-10-10T21:00:00+07:00", by: "a007", text: "đổi trạng thái: đang làm" }],
  },
  {
    id: "viec-danh-sach-giai", clubId: DEMO_CLUB_ID, title: "Chốt danh sách thi đấu giải nội bộ", assigneeId: "a003", due: "2026-10-12T23:59:00+07:00", status: "done", eventId: "giai-noi-bo",
    createdBy: "a001", createdAt: "2026-10-02T09:00:00+07:00",
    history: [{ at: "2026-10-02T09:00:00+07:00", by: "a001", text: "tạo việc, giao cho Đinh Công Minh" }, { at: "2026-10-11T18:30:00+07:00", by: "a003", text: "đổi trạng thái: xong" }],
  },
  {
    id: "viec-mua-nuoc", clubId: DEMO_CLUB_ID, title: "Mua nước uống cho giải nội bộ", assigneeId: "a017", due: "2026-10-17T23:59:00+07:00", status: "todo", eventId: "giai-noi-bo",
    createdBy: "a005", createdAt: "2026-10-13T19:00:00+07:00", history: [{ at: "2026-10-13T19:00:00+07:00", by: "a005", text: "tạo việc, giao cho Nguyễn Minh Anh" }],
  },
];

// Tin mẫu trên Cộng đồng (chuyển từ feed-sample.ts khi làm thật, 29/10/2026). Tin đã được cán bộ trường duyệt, trừ một tin chờ duyệt của CLB mẫu để thấy luồng duyệt.
// Người đăng ghi là chủ nhiệm CLB mẫu (a001) cho mọi CLB vì các CLB còn lại chưa có thành viên trong dữ liệu mẫu. Ngày đặt quanh 03/10/2026 như phần còn lại của dữ liệu mẫu.
const REVIEWER = "p-thu-trang";
const approved = (p: Omit<ClubPost, "status" | "createdBy" | "reviewedBy" | "reviewedAt">): ClubPost => ({ ...p, status: "approved", createdBy: "a001", reviewedBy: REVIEWER, reviewedAt: p.createdAt.replace(/T\d\d:\d\d/, "T21:00") });
const POSTS: ClubPost[] = [
  approved({
    id: "giai-noi-bo", clubId: DEMO_CLUB_ID, kind: "event", title: "Giải cầu lông nội bộ Fall 2026",
    body: "Giải giao hữu mở cho thành viên và khách mời. Thi đấu đôi, xếp cặp ngay tại buổi sinh hoạt. Mang theo vợt của bạn.",
    createdAt: "2026-10-02T09:00:00+07:00", eventAt: "2026-10-18T07:30:00+07:00", place: "[sân sinh hoạt]",
  }),
  approved({
    id: "tuyen-spring", clubId: "vong-lap", kind: "promo", title: "Tuyển thành viên kỳ Spring 2027",
    body: "Vòng Lặp mở đơn cho bạn nào muốn tập code cùng nhóm. Không cần biết lập trình từ trước, buổi đầu cả CLB làm bài cùng nhau.",
    createdAt: "2026-10-01T10:00:00+07:00",
  }),
  approved({
    id: "hau-can", clubId: "hau-truong", kind: "promo", title: "Cần thêm bạn hỗ trợ hậu cần cho sự kiện các CLB",
    body: "Hậu Trường tìm CLB muốn cùng tổ chức sự kiện chung và bạn muốn thử sức làm hậu cần. Nhắn cho CLB để hẹn trao đổi.",
    createdAt: "2026-09-30T10:00:00+07:00",
  }),
  approved({
    id: "tong-ket-tinh-nguyen", clubId: "gieo-mam", kind: "news", title: "Tổng kết đợt tình nguyện cuối tuần",
    body: "Cảm ơn các bạn đã tham gia đợt tình nguyện vừa rồi. Đội sẽ gửi tổng kết hoạt động và thông báo đợt tiếp theo trong tuần này.",
    createdAt: "2026-09-29T10:00:00+07:00",
  }),
  approved({
    id: "dem-nhac", clubId: "day-nam", kind: "event", title: "Đêm nhạc cuối kỳ",
    body: "Buổi biểu diễn cuối kỳ của các thành viên Dây Năm, mở cho mọi người đến nghe. Bạn nào muốn lên sân khấu thì nhắn cho CLB.",
    createdAt: "2026-09-28T10:00:00+07:00", eventAt: "2026-10-31T19:00:00+07:00", place: "[phòng sinh hoạt]",
  }),
  approved({
    id: "sach-thang", clubId: "trang-mo", kind: "news", title: "Sách của tháng này",
    body: "Tháng này Trang Mở đọc chung một cuốn và trao đổi vào chiều Chủ nhật. Ai muốn mượn sách của CLB thì đến sớm buổi sinh hoạt.",
    createdAt: "2026-09-27T10:00:00+07:00",
  }),
  {
    id: "doi-gio-sinh-hoat", clubId: DEMO_CLUB_ID, kind: "news", title: "Đổi giờ sinh hoạt tuần sau",
    body: "Buổi sinh hoạt Thứ Bảy tuần sau dời sang 08:30 vì sân có lịch bảo trì. Các bạn nhớ đến đúng giờ mới.",
    status: "pending", createdBy: "a001", createdAt: "2026-10-03T08:00:00+07:00",
  },
];

export function createSeed(): AppState {
  const persons: Person[] = [];
  const memberships: Membership[] = [];
  const payments: Payment[] = [];
  const ledger: LedgerEntry[] = [];
  const attendance: Attendance[] = [];
  const consents: Consent[] = [];

  ledger.push({
    id: "l-dau-ky", clubId: DEMO_CLUB_ID, date: "2026-09-01T08:00:00+07:00", direction: "in", amount: 1_020_000,
    description: "Số dư chuyển từ kỳ Summer 2026", createdBy: "a002", createdAt: "2026-09-01T08:00:00+07:00",
  });
  ([["05", "09"], ["12", "09"], ["19", "09"], ["28", "09"]] as const).forEach(([d, m], i) => {
    const date = `2026-${m}-${d}T10:00:00+07:00`;
    ledger.push({
      id: `l-san-${i + 1}`, clubId: DEMO_CLUB_ID, date, direction: "out", amount: 200_000,
      description: `Thuê sân tuần ${i + 1}`, budgetItemId: "thue-san", createdBy: "a002", createdAt: date,
    });
  });

  MEMBERS.forEach(([code, name, department, role, pay, invite], i) => {
    const id = code.toLowerCase();
    persons.push({ id, name, email: emailOf(name), kind: "student", year: 1 + (i % 4) });
    memberships.push({
      clubId: DEMO_CLUB_ID, personId: id, code, department, role,
      invite: invite === "a" ? "accepted" : "pending",
      inviteCode: invite === "p" ? `moi-${id}` : undefined,
    });
    if (invite === "a") {
      const at = `2026-09-0${1 + (i % 4)}T20:${p2(10 + i)}:00+07:00`;
      consents.push({ personId: id, clubId: DEMO_CLUB_ID, purpose: "membership", version: CONSENT_VERSION, at });
      consents.push({ personId: id, clubId: DEMO_CLUB_ID, purpose: "age16", version: CONSENT_VERSION, at });
      if (i % 3 === 1 || code === "A017") consents.push({ personId: id, clubId: DEMO_CLUB_ID, purpose: "phone", version: CONSENT_VERSION, at });
    }

    const payment: Payment = { collectionId: DEMO_COLLECTION_ID, personId: id, status: "unpaid", amountPaid: 0 };
    if (pay === "ck26" || pay === "ck01" || pay === "cash") {
      const date = pay === "ck26" ? `2026-09-26T${p2(9 + (i % 10))}:${p2((i * 7) % 60)}:00+07:00`
        : pay === "ck01" ? `2026-10-01T${p2(8 + (i % 10))}:${p2((i * 11) % 60)}:00+07:00`
        : `2026-09-25T19:${p2(10 + i)}:00+07:00`;
      Object.assign(payment, { status: "paid", method: pay === "cash" ? "cash" : "transfer", amountPaid: FEE, paidAt: date });
      ledger.push({
        id: `l-quy-${id}`, clubId: DEMO_CLUB_ID, date, direction: "in", amount: FEE,
        description: `Quỹ học kỳ Fall 2026 · ${name}${pay === "cash" ? " · tiền mặt" : ""}`,
        collectionId: DEMO_COLLECTION_ID, personId: id, createdBy: "a002", createdAt: date,
      });
    } else if (pay === "rep") {
      Object.assign(payment, { status: "reported", reportedAt: code === "A017" ? "2026-10-01T20:10:00+07:00" : "2026-10-01T21:40:00+07:00" });
    }
    payments.push(payment);

    // Điểm danh 4 buổi đã qua. Người chưa nhận lời mời được điểm danh tay.
    SESSIONS.slice(0, 4).forEach(([eventId, day], w) => {
      let present: boolean;
      if (code === "A017") present = w !== 1;
      else if (role !== "member") present = true;
      else if (invite === "p") present = (i + w) % 2 === 0;
      else present = (i * 5 + w * 7) % 11 !== 0 && (i + w * 3) % 13 !== 0;
      if (!present) return;
      const minute = 32 + ((i * 7 + w * 3) % 26);
      attendance.push(invite === "p"
        ? { eventId, personId: id, at: `${day}T07:${p2(minute)}:00+07:00`, method: "manual", byPersonId: "a001" }
        : { eventId, personId: id, at: `${day}T07:${p2(minute)}:00+07:00`, method: "qr", deviceId: `seed-${id}` });
    });
  });

  const extraPersons: Person[] = [
    { id: "p-hong-nhung", name: "Võ Thị Hồng Nhung", email: emailOf("Võ Thị Hồng Nhung"), year: 2, kind: "student" },
    { id: "p-quoc-viet", name: "Đặng Quốc Việt", email: emailOf("Đặng Quốc Việt"), year: 1, kind: "student" },
    { id: "p-gia-linh", name: "Hồ Gia Linh", email: emailOf("Hồ Gia Linh"), year: 3, kind: "student" },
    { id: "p-bao-chau", name: "Trịnh Bảo Châu", email: emailOf("Trịnh Bảo Châu"), year: 1, kind: "student" },
    { id: "p-thu-trang", name: "Đặng Thu Trang", email: emailOf("Đặng Thu Trang"), kind: "staff", staffTitle: "Ban quản lý CLB, mentor" },
  ];
  persons.push(...extraPersons);

  // Sao kê 25/09–01/10: 26 giao dịch đúng mã, 4 giao dịch cần gán tay, 2 giao dịch không thuộc đợt thu.
  const raw: { date: string; amount: number; sender: string; content: string }[] = [];
  MEMBERS.forEach(([code, name, , , pay], i) => {
    if (pay !== "ck26" && pay !== "ck01") return;
    const p = payments.find((x) => x.personId === code.toLowerCase())!;
    const content = i % 3 === 0 ? `QFALL26 ${code}` : i % 3 === 1 ? `QFALL26${code} ${toAsciiUpper(name).split(" ").pop()}` : `qfall26 ${code.toLowerCase()} dong quy`;
    raw.push({ date: p.paidAt!, amount: FEE, sender: toAsciiUpper(name), content });
  });
  raw.push(
    { date: "2026-09-27T10:12:00+07:00", amount: 100_000, sender: "NGUYEN THI MAI", content: "CK" },
    { date: "2026-09-28T16:40:00+07:00", amount: 150_000, sender: "TRAN GIA HUY", content: "TRA LAI TIEN THUA MUA CAU" },
    { date: "2026-09-29T19:05:00+07:00", amount: 200_000, sender: "TRAN VAN KHOA", content: "QFALL26 A021 A022" },
    { date: "2026-09-30T08:30:00+07:00", amount: 50_000, sender: "BUI KHANH VY", content: "QFALL26 A030" },
    { date: "2026-09-30T21:15:00+07:00", amount: 100_000, sender: "NGUYEN MINH ANH", content: "quy cau long minh anh" },
    { date: "2026-09-30T23:59:00+07:00", amount: 1_873, sender: "[NGAN HANG]", content: "TIEN LAI THANG 9" },
  );
  raw.sort((a, b) => a.date.localeCompare(b.date));
  const refs: MemberRef[] = memberships.map((m) => ({ personId: m.personId, code: m.code, name: persons.find((p) => p.id === m.personId)!.name }));
  const cashPaid = new Set(MEMBERS.filter((m) => m[4] === "cash").map((m) => m[0].toLowerCase()));
  const txns: StatementTxn[] = raw.map((r, i) => ({ id: `t${p2(i + 1)}`, ...r, result: classify(r, { fee: FEE, codePrefix: "QFALL26", members: refs, settledPersonIds: cashPaid }) }));

  const events: ClubEvent[] = SESSIONS.map(([id, day], i) => ({
    id, clubId: DEMO_CLUB_ID, title: `Sinh hoạt tuần ${i + 1}`, kind: "session",
    start: `${day}T07:30:00+07:00`, end: `${day}T09:30:00+07:00`, location: "Sân cầu lông khu thể thao",
    checkinUntil: `${day}T08:00:00+07:00`, status: i < 4 ? "closed" : "upcoming", closedAt: i < 4 ? `${day}T08:00:00+07:00` : undefined,
  }));
  events.push({
    id: "giai-noi-bo", clubId: DEMO_CLUB_ID, title: "Giải nội bộ Fall 2026", kind: "open",
    start: "2026-10-18T07:00:00+07:00", end: "2026-10-18T11:30:00+07:00", location: "[địa điểm thi đấu]",
    checkinUntil: "2026-10-18T08:00:00+07:00", status: "upcoming",
  });

  const clubs: Club[] = [
    { id: DEMO_CLUB_ID, name: "CLB Cầu lông Sân Nhà", field: "Nghệ thuật, thể thao", schedule: "Sinh hoạt sáng Thứ Bảy, 07:30–09:30", location: "Sân cầu lông khu thể thao", acceptingApplications: true, mentor: "[tên giảng viên]", term: DEMO_TERM },
    { id: "vong-lap", name: "CLB Lập trình Vòng Lặp", field: "Học thuật, nghiên cứu", schedule: "Sinh hoạt tối Thứ Tư", location: "[phòng sinh hoạt]", acceptingApplications: true, term: DEMO_TERM, staticStats: { members: 38, sessions: 4, lastActivity: "2026-10-02T19:00:00+07:00", planned: 3_200_000, spent: 450_000, budgetSubmitted: true } },
    { id: "hau-truong", name: "CLB Sự kiện Hậu Trường", field: "Tổ chức sự kiện, truyền thông", schedule: "Họp chiều Thứ Năm", location: "[phòng sinh hoạt]", acceptingApplications: true, term: DEMO_TERM, staticStats: { members: 31, sessions: 4, lastActivity: "2026-10-01T16:00:00+07:00", planned: 2_000_000, spent: 0, budgetSubmitted: true } },
    { id: "gieo-mam", name: "Đội Tình nguyện Gieo Mầm", field: "Tình nguyện, xã hội, kỹ năng sống", schedule: "Hoạt động cuối tuần, theo đợt", location: "[địa điểm]", acceptingApplications: false, term: DEMO_TERM, staticStats: { members: 55, sessions: 2, lastActivity: "2026-09-21T08:00:00+07:00", planned: 4_800_000, spent: 1_150_000, budgetSubmitted: true } },
    { id: "day-nam", name: "CLB Guitar Dây Năm", field: "Nghệ thuật, thể thao", schedule: "Sinh hoạt tối Thứ Ba", location: "[phòng sinh hoạt]", acceptingApplications: true, term: DEMO_TERM, staticStats: { members: 27, sessions: 3, lastActivity: "2026-09-27T19:00:00+07:00", budgetSubmitted: false } },
    { id: "trang-mo", name: "CLB Đọc sách Trang Mở", field: "Học thuật, nghiên cứu", schedule: "Sinh hoạt chiều Chủ nhật", location: "[phòng sinh hoạt]", acceptingApplications: true, term: DEMO_TERM, staticStats: { members: 12, sessions: 0, lastActivity: "2026-08-22T15:00:00+07:00", budgetSubmitted: false } },
  ];

  return {
    v: STATE_VERSION,
    persona: null,
    persons,
    clubs,
    memberships,
    applications: [
      { id: "don-1", clubId: DEMO_CLUB_ID, personId: "p-hong-nhung", name: "Võ Thị Hồng Nhung", email: emailOf("Võ Thị Hồng Nhung"), year: 2, reason: "Mình chơi cầu lông từ cấp 3, muốn có nhóm đánh đều mỗi tuần.", submittedAt: "2026-09-28T20:15:00+07:00", status: "pending" },
      { id: "don-2", clubId: DEMO_CLUB_ID, personId: "p-quoc-viet", name: "Đặng Quốc Việt", email: emailOf("Đặng Quốc Việt"), year: 1, reason: "", submittedAt: "2026-09-30T10:05:00+07:00", status: "pending" },
      { id: "don-3", clubId: DEMO_CLUB_ID, personId: "p-gia-linh", name: "Hồ Gia Linh", email: emailOf("Hồ Gia Linh"), year: 3, reason: "Muốn tham gia giải nội bộ tháng 10.", submittedAt: "2026-10-01T21:40:00+07:00", status: "pending" },
      { id: "don-4", clubId: "vong-lap", personId: "p-bao-chau", name: "Trịnh Bảo Châu", email: emailOf("Trịnh Bảo Châu"), year: 1, reason: "Muốn luyện thuật toán cùng nhóm.", submittedAt: "2026-09-30T09:00:00+07:00", status: "pending" },
    ],
    events,
    attendance,
    collections: [
      { id: DEMO_COLLECTION_ID, clubId: DEMO_CLUB_ID, term: DEMO_TERM, name: "Quỹ học kỳ Fall 2026", amount: FEE, dueDate: "2026-10-10T23:59:00+07:00", codePrefix: "QFALL26", receiverId: "a002", accountName: "LE THU HA", bankLabel: "[ngân hàng]", last4: "6789" },
    ],
    payments,
    ledger,
    statements: [
      { id: "sk-2509-0110", clubId: DEMO_CLUB_ID, collectionId: DEMO_COLLECTION_ID, fileName: "sao-ke-25-09-den-01-10.xlsx", from: "2026-09-25T00:00:00+07:00", to: "2026-10-01T23:59:00+07:00", uploadedAt: "2026-10-01T22:05:00+07:00", txns },
    ],
    expenses: [
      { id: "chi-1", clubId: DEMO_CLUB_ID, kind: "proposal", title: "Thuê sân tuần 6–7", amount: 400_000, requesterId: "a005", createdAt: "2026-10-01T19:02:00+07:00", budgetItemId: "thue-san", reason: "Đặt trước sân cho buổi sinh hoạt tuần 6 và tuần 7, mỗi buổi 200.000 ₫.", status: "pending", history: [{ at: "2026-10-01T19:02:00+07:00", by: "a005", text: "tạo đề xuất" }] },
      { id: "chi-2", clubId: DEMO_CLUB_ID, kind: "proposal", title: "Mua 2 ống cầu", amount: 250_000, requesterId: "a001", createdAt: "2026-09-30T18:20:00+07:00", budgetItemId: "ong-cau", reason: "Ống cầu cho các buổi sinh hoạt tháng 10.", status: "pending", history: [{ at: "2026-09-30T18:20:00+07:00", by: "a001", text: "tạo đề xuất" }] },
      { id: "chi-3", clubId: DEMO_CLUB_ID, kind: "proposal", title: "Thuê sân thi đấu giải nội bộ", amount: 2_300_000, requesterId: "a005", createdAt: "2026-09-30T21:00:00+07:00", budgetItemId: "giai-noi-bo", receipt: "Báo giá của sân (1 ảnh)", reason: "Thuê 4 sân trong buổi sáng 18/10 cho giải nội bộ.", status: "mentor", history: [{ at: "2026-09-30T21:00:00+07:00", by: "a005", text: "tạo đề xuất" }, { at: "2026-10-01T09:15:00+07:00", by: "a001", text: "duyệt, chuyển mentor vì trên 2.000.000 ₫" }] },
    ],
    budgetItems: [
      { id: "thue-san", clubId: DEMO_CLUB_ID, term: DEMO_TERM, name: "Thuê sân sinh hoạt hằng tuần (12 buổi)", period: "09–12/2026", source: "Quỹ thành viên", planned: 2_400_000 },
      { id: "giai-noi-bo", clubId: DEMO_CLUB_ID, term: DEMO_TERM, name: "Giải nội bộ Fall 2026", period: "18/10/2026", source: "Quỹ thành viên, trường hỗ trợ 1.000.000 ₫", planned: 2_500_000 },
      { id: "ong-cau", clubId: DEMO_CLUB_ID, term: DEMO_TERM, name: "Ống cầu cho buổi sinh hoạt", period: "Cả kỳ", source: "Quỹ thành viên", planned: 250_000 },
      { id: "ao", clubId: DEMO_CLUB_ID, term: DEMO_TERM, name: "In thêm áo đồng phục", period: "11/2026", source: "Quỹ thành viên", planned: 900_000 },
    ],
    budgets: [
      { clubId: DEMO_CLUB_ID, term: DEMO_TERM, submittedAt: "2026-09-30T20:00:00+07:00", support: { amount: 1_000_000, purpose: "Giải nội bộ Fall 2026 (18/10/2026), mở cho cả sinh viên ngoài CLB", status: "pending" } },
    ],
    handovers: [
      {
        clubId: DEMO_CLUB_ID, fromTerm: DEMO_TERM, toTerm: "Spring 2027", step: 4, lockedBalance: 3_120_000, lockedAt: "2026-10-10T20:00:00+07:00",
        newBoard: { president: "a017", vice: "a003", treasurer: "a006", heads: ["a005", "a008"] },
        newReceiver: { personId: "a006", bank: "", account: "" }, transferred: [],
        history: [
          { at: "2026-10-10T19:40:00+07:00", by: "a001", text: "chọn ban mới: chủ nhiệm Nguyễn Minh Anh" },
          { at: "2026-10-10T20:00:00+07:00", by: "a001", text: "chốt số dư 3.120.000 ₫" },
          { at: "2026-10-10T20:05:00+07:00", by: "a001", text: "kiểm tra kho bàn giao: 5 biểu mẫu, 3 quy trình, 5 tài khoản, 1 mục thiếu" },
        ],
      },
    ],
    kitDocuments: KIT_DOCUMENTS,
    kitProcesses: KIT_PROCESSES,
    kitAccounts: KIT_ACCOUNTS,
    tasks: TASKS,
    posts: POSTS,
    aiUsage: [],
    notifications: [],
    consents,
  };
}
