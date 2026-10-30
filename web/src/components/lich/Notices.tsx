"use client";

// Việc đang chờ chính người đăng nhập (MeRes.notices), hiện ở đầu Cộng đồng và Của tôi.
// Hiện chỉ có một loại: ban cũ đã chuyển bàn giao tới bước 6, chờ chủ nhiệm mới xác nhận nhận bàn giao (Hiệu yêu cầu 30/10/2026).
// Chưa có bản vẽ: ghi ở mục "Chỗ code khác bản vẽ" của web/README.md để Hiệu duyệt.

import Link from "next/link";
import type { NoticeDto } from "@contract";
import { LinkIcon } from "./motion";

export function Notices({ notices }: { notices: NoticeDto[] | undefined }) {
  if (!notices?.length) return null;
  return (
    <>
      {notices.map((n) => (
        <section key={`${n.kind}-${n.clubId}`} className="l-pay-card" role="status" aria-labelledby={`notice-${n.clubId}`}>
          <h2 id={`notice-${n.clubId}`}>Cần bạn xác nhận</h2>
          <p className="l-fine">
            {n.fromName ?? "Ban điều hành cũ"} đã chuyển bàn giao {n.clubName} (từ {n.fromTerm} sang {n.toTerm}) cho bạn.
            Bạn xem rồi xác nhận nhận bàn giao thì quyền chủ nhiệm chuyển sang bạn.
          </p>
          <Link className="l-btn l-lg" href={`/clubs/${n.clubId}/handover`}>
            <LinkIcon name="swap" size={18} />Xem và xác nhận
          </Link>
        </section>
      ))}
    </>
  );
}
