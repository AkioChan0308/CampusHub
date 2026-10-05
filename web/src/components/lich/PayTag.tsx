// Nhãn trạng thái đóng quỹ của một người (nghĩa màu theo design/README.md, mục 6): đã đóng xanh lá, báo đã chuyển xanh mực,
// chưa đóng và đóng thiếu màu cam. Dùng ở Đợt thu và Thành viên.

import type { PaymentStatus } from "@contract";
import { dm, money } from "@/lib/format";

type Pay = { status: PaymentStatus; amountPaid: number; reportedAt?: string; method?: "transfer" | "cash" };

/** Chữ của trạng thái, dùng cả cho nhãn và cho file Excel. showMethod: ghi "· tiền mặt" khi đóng tiền mặt (màn Thành viên). */
export function payText(p: Pay, fee: number, showMethod = true): string {
  switch (p.status) {
    case "paid": return showMethod && p.method === "cash" ? "Đã đóng · tiền mặt" : "Đã đóng";
    case "reported": return p.reportedAt ? `Báo đã chuyển ${dm(p.reportedAt)}` : "Báo đã chuyển";
    case "partial": return `Đóng thiếu · còn nợ ${money(fee - p.amountPaid)}`;
    default: return "Chưa đóng";
  }
}

export function PayTag({ payment, fee, showMethod = true }: { payment?: Pay; fee: number; showMethod?: boolean }) {
  if (!payment) return <span className="l-note">–</span>;
  const tone = payment.status === "paid" ? "ok" : payment.status === "reported" ? "wait" : "warn";
  return <span className={`l-tag ${tone}`}>{payText(payment, fee, showMethod)}</span>;
}
