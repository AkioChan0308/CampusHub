"use client";

// Khung laptop của ban quản lý CLB của trường (design/screens/NT-*) trong thế giới "Lịch bloc".
// Dữ liệu từ GET /me (tên, chức danh) và GET /school/clubs (học kỳ, số khoản chờ mentor, bảng để xuất Excel).
// Sinh viên mở trang này: máy chủ trả 403, khung hiện trang chặn với câu của máy chủ.
// Lúc đang tải: mục menu hiện chữ thật, chỉ học kỳ, số đếm và tên người là thanh giữ chỗ.

import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { schoolRows } from "@/api/excel-rows";
import { useMe, useSchoolClubs } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { downloadCsv } from "@/lib/csv";
import { initials } from "@/lib/format";
import { ErrorGate, NOT_IN_MVP, useLogout } from "./Gate";
import { LinkIcon, Loading, Skel, useSawPending } from "./motion";

export function SchoolFrame({ active, children }: { active: "clubs" | "detail"; children: ReactNode }) {
  const me = useMe();
  const list = useSchoolClubs();
  const { logout, pending: leaving } = useLogout();
  const saw = useSawPending(!list.data || !me.data);
  const fade = saw ? " l-fade-in" : "";

  const error = list.error ?? me.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void list.refetch(); void me.refetch(); }} />;

  const data = list.data;
  // Số đếm gồm khoản chờ của mọi CLB; link mở CLB có khoản chờ đầu tiên.
  const firstWaiting = data?.clubs.find((c) => c.waitingMentor > 0);
  const person = me.data?.person;

  return (
    <div className="lich">
      <div className="l-board">
        <aside className="l-side">
          <Link className="l-brand" href="/feed" aria-label="CampusHub, trang chung"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></Link>
          <div className="l-club">
            <strong>[Tên trường]</strong>
            {data ? <span className={fade.trim() || undefined}>{data.term ? `Ban quản lý CLB · ${data.term}` : "Ban quản lý CLB"}</span> : <Loading><Skel w="72%" h={12} /></Loading>}
          </div>
          <nav aria-label="Menu nhà trường" className="l-navlist">
            {/* Trang chung là của mọi vai (Hiệu yêu cầu 29/10/2026). */}
            <Link className="l-nav" href="/feed"><LinkIcon name="feed" />Trang chung</Link>
            {/* Trang chi tiết một CLB nằm trong mục "Các CLB", nên mục này luôn sáng. */}
            <Link className="l-nav on" href="/school" aria-current={active === "clubs" ? "page" : undefined}><LinkIcon name="users" />Các CLB</Link>
            <button type="button" className="l-nav" aria-disabled="true" aria-describedby="budget-report-unavailable" onClick={() => toast(NOT_IN_MVP)}>
              <Icon name="calendar" />Dự trù và báo cáo<span id="budget-report-unavailable" className="l-nav-note">chưa có</span>
            </button>
            {data ? (
              <Link className="l-nav" href={firstWaiting ? `/school/clubs/${firstWaiting.id}` : "/school"}>
                <LinkIcon name="docCheck" />Khoản chờ duyệt{data.waitingMentor > 0 && <span className={`l-cnt${fade}`}>{data.waitingMentor}</span>}
              </Link>
            ) : <span className="l-nav"><Icon name="docCheck" />Khoản chờ duyệt</span>}
            {data ? (
              <button type="button" className="l-nav" onClick={() => downloadCsv("cac-clb.csv", schoolRows(data))}><Icon name="download" />Xuất Excel</button>
            ) : <span className="l-nav"><Icon name="download" />Xuất Excel</span>}
          </nav>
          <div className="l-who">
            {person ? (
              <>
                <span className={`l-avatar${fade}`} aria-hidden="true">{initials(person.name)}</span>
                <div className={`l-who-text${fade}`}>
                  <strong>{person.name}</strong>
                  {person.staffTitle && <span className="l-who-title">{person.staffTitle}</span>}
                  <div className="l-who-links">
                    <button type="button" className="l-linkbtn" aria-busy={leaving || undefined} onClick={() => logout()}>Đăng xuất</button>
                  </div>
                </div>
              </>
            ) : (
              <><span className="l-avatar l-skel" aria-hidden="true" /><span className="l-who-text"><Skel w={120} /><Skel w={150} h={12} /><Skel w={84} h={12} /></span></>
            )}
          </div>
        </aside>
        <main className="l-main">{children}</main>
      </div>
    </div>
  );
}
