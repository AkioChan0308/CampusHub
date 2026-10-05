// Các bảng xuất Excel (file CSV) dựng từ dữ liệu máy chủ. Thành viên, Dự trù và Bàn giao dùng chung để mỗi bảng chỉ có một bộ cột.
// Chỉ dựng dòng; tải file là việc của lib/csv.ts.

import type { BudgetRes, ConsentPurpose, LedgerRes, MembersRes, MyExportRes, PaymentStatus, SchoolClubRes, SchoolClubsRes } from "@contract";
import { dmy, hm, money } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";
import { payText } from "@/components/lich/PayTag";

type Row = (string | number)[];

/** Bảng thành viên, sắp theo mã. Điểm danh tách hai cột số vì Excel đổi ô "4/4" thành ngày tháng. */
export function memberRows(res: MembersRes): Row[] {
  const fee = res.collection?.amount ?? 0;
  return [
    ["Mã", "Họ tên", "Email", "Ban", "Vai trò", "Buổi có mặt", "Buổi đã mở điểm danh", `Quỹ ${res.term}`, "Tài khoản"],
    ...res.members.map((m) => [
      m.code, m.name, m.email, m.department, ROLE_LABEL[m.role], m.attended, res.heldSessions,
      m.payment ? payText(m.payment, fee) : "",
      m.invite === "accepted" ? "Đã nhận lời mời" : "Chưa nhận lời mời",
    ]),
  ];
}

export function ledgerRows(res: LedgerRes): Row[] {
  return [
    ["Ngày", "Thu/Chi", "Số tiền (₫)", "Nội dung", "Người ghi"],
    ...res.entries.map((e) => [dmy(e.date), e.direction === "in" ? "Thu" : "Chi", e.amount, e.description, e.createdBy.name]),
  ];
}

/** Bảng dự trù như trên màn Dự trù, kèm dòng Tổng. */
export function budgetRows(res: BudgetRes): Row[] {
  return [
    ["Hoạt động", "Thời gian", "Nguồn tiền", "Dự trù (₫)", "Đã chi (₫)", "Còn lại (₫)"],
    ...res.items.map((i) => [i.name, i.period, i.source, i.planned, i.spent, i.remaining]),
    ["Tổng", "", "", res.totals.planned, res.totals.spent, res.totals.planned - res.totals.spent],
  ];
}

export const PURPOSE_LABEL: Record<ConsentPurpose, string> = {
  membership: "Lưu dữ liệu để quản lý thành viên",
  phone: "Lưu số điện thoại",
  age16: "Xác nhận đủ 16 tuổi",
  application: "Cho xem thông tin khi xét đơn",
};

const PAY_STATUS: Record<PaymentStatus, string> = { paid: "Đã đóng", reported: "Báo đã chuyển", partial: "Đóng thiếu", unpaid: "Chưa đóng" };

/** File "Tải dữ liệu của tôi": mọi thứ máy chủ lưu về người này, ở mọi CLB (quyền xem dữ liệu của mình, Luật 91/2025). */
export function myDataRows(res: MyExportRes): Row[] {
  const clubName = new Map(res.memberships.map((m) => [m.clubId, m.clubName]));
  const club = (id: string) => clubName.get(id) ?? id;
  return [
    ["Mục", "Nội dung", "Thời điểm"],
    ["Họ tên", res.person.name, ""],
    ["Email", res.person.email, ""],
    ...res.memberships.map((m) => ["CLB", `${m.clubName} · ${m.department} · mã ${m.code}${m.invite === "pending" ? " (chưa nhận lời mời)" : ""}`, ""]),
    ...res.attendance.map((a) => ["Điểm danh", `${club(a.clubId)}: ${a.title}${a.method === "manual" ? " (điểm danh tay)" : ""}`, `${dmy(a.at)} ${hm(a.at)}`]),
    ...res.payments.map((p) => ["Đóng quỹ", `${p.collectionName}: ${PAY_STATUS[p.status]}${p.amountPaid > 0 ? `, đã đóng ${money(p.amountPaid)}` : ""}`, p.paidAt ? dmy(p.paidAt) : ""]),
    ...res.consents.map((c) => ["Đồng ý", `${club(c.clubId)}: ${PURPOSE_LABEL[c.purpose]} (bản ${c.version})${c.withdrawnAt ? `, đã rút ngày ${dmy(c.withdrawnAt)}` : ""}`, dmy(c.at)]),
    ...res.applications.map((a) => ["Đơn xin vào", `${a.status === "pending" ? "Đang chờ duyệt" : a.status === "approved" ? "Được duyệt" : "Bị từ chối"}${a.reason ? `: ${a.reason}` : ""}`, dmy(a.submittedAt)]),
    ["Ngày tải", "", `${dmy(res.exportedAt)} ${hm(res.exportedAt)}`],
  ];
}

/** Bảng các CLB phía trường (nút "Xuất Excel" ở NT-TongQuan và mục "Xuất Excel" trên thanh bên). Thiếu số thì để ô trống. */
export function schoolRows(res: SchoolClubsRes): Row[] {
  return [
    ["CLB", "Lĩnh vực", "Thành viên", "Buổi có điểm danh", "Hoạt động gần nhất", `Dự trù ${res.term}`.trim(), "Đã chi (₫)", "Dự trù (₫)"],
    ...res.clubs.map((c) => {
      const spending = c.budgetSubmitted && c.planned !== undefined && c.spent !== undefined ? { spent: c.spent, planned: c.planned } : undefined;
      return [c.name, c.field, c.members, c.sessions, c.lastActivity ? dmy(c.lastActivity) : "", c.budgetSubmitted ? "Đã nộp" : "Chưa nộp", spending?.spent ?? "", spending?.planned ?? ""];
    }),
  ];
}

/** Bản dự trù phía trường: chỉ dự trù và đã chi theo hoạt động, kèm dòng Tổng. */
export function schoolBudgetRows(budget: NonNullable<SchoolClubRes["detail"]>["budget"]): Row[] {
  return [
    ["Hoạt động", "Dự trù (₫)", "Đã chi (₫)"],
    ...budget.items.map((b) => [b.name, b.planned, b.spent]),
    ["Tổng", budget.totals.planned, budget.totals.spent],
  ];
}
