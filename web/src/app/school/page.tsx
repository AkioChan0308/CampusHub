"use client";

// Ban quản lý CLB của trường · Các CLB (design/screens/NT-TongQuan.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /school/clubs: chỉ số tổng hợp của từng CLB, không có danh sách thành viên hay từng khoản đóng quỹ.

import Link from "next/link";
import { useState } from "react";
import type { SchoolClubRowDto, SchoolClubsRes } from "@contract";
import { schoolRows } from "@/api/exports";
import { useSchoolClubs } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop, TableSkeleton } from "@/components/lich/PageTop";
import { SchoolFrame } from "@/components/lich/SchoolFrame";
import { downloadCsv } from "@/lib/csv";
import { dm, num } from "@/lib/format";

// "Có hoạt động" = có ít nhất một buổi được điểm danh trên CampusHub trong ACTIVE_DAYS ngày gần nhất (máy chủ tính activeIn30Days).
const ACTIVE_DAYS = 30;
const TITLE = "Các CLB đang dùng CampusHub";
const subText = (term: string) => `Học kỳ ${term} · chỉ gồm CLB đã dùng CampusHub. CLB chưa dùng thì chưa có trong danh sách này.`;
const WIDTHS = ["16%", "15%", "8%", "9%", "17%", "11%", "16%", "8%"];
const columns = (term: string) => ["CLB", "Lĩnh vực", "Thành viên", "Buổi có điểm danh", "Hoạt động gần nhất", `Dự trù ${term}`, "Đã chi / dự trù (₫)", "Chi tiết"];
const NOTE = "“Hoạt động gần nhất” là ngày có buổi điểm danh gần nhất trên CampusHub. “Đã chi” lấy từ sổ quỹ của từng CLB.";

export default function SchoolPage() {
  return <LichPage><SchoolFrame active="clubs"><Overview /></SchoolFrame></LichPage>;
}

type Filter = "all" | "inactive" | "nobudget";

/** Khung xương: nhãn ô số, bộ lọc, tiêu đề cột là chữ thật; học kỳ và số liệu là thanh giữ chỗ. */
function OverviewSkeleton() {
  const cells = [`Có hoạt động trong ${ACTIVE_DAYS} ngày`, `Không có hoạt động trong ${ACTIVE_DAYS} ngày`, "Đã nộp dự trù"];
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={560} />} actions={<span className="l-btn2 l-inert"><Icon name="download" size={18} />Xuất Excel</span>} />
      <Loading className="l-sheet">
        <div className="l-sec l-strip">
          {cells.map((label) => (
            <div key={label} className="l-cell">
              <span className="l-cell-label">{label}</span>
              <span className="l-cell-value"><SkelLine w={84} /></span>
              <span className="l-cell-note"><SkelLine w="70%" /></span>
            </div>
          ))}
        </div>
        <div className="l-sec">
          <div className="l-sec-head"><div className="l-seg">{["Tất cả", `Không hoạt động ${ACTIVE_DAYS} ngày`, "Chưa nộp dự trù"].map((c, i) => <span key={c} className={`l-chip l-chip-skel${i === 0 ? " l-on" : ""}`}>{c}<Skel w={22} h={12} /></span>)}</div></div>
          <TableSkeleton className="l-rows-2 l-school-table" headers={columns("").map((h, i) => (i === 5 ? <>{h}<SkelLine w={64} /></> : i === 7 ? <span className="l-sr">{h}</span> : h))} widths={WIDTHS} rows={6} right={[2, 3, 6, 7]} tags={[5]} action={false} />
          <p className="l-foot">{NOTE}</p>
        </div>
      </Loading>
    </>
  );
}

function Overview() {
  const query = useSchoolClubs();
  const saw = useSawPending(!query.data);
  // Lỗi đã có khung hiện (cùng một truy vấn).
  if (!query.data) return <OverviewSkeleton />;
  return <OverviewBody data={query.data} fade={saw} />;
}

/** Đã nộp dự trù và có số thì ghi "đã chi / dự trù"; còn lại để "–", không tự ghi 0. */
const spending = (c: SchoolClubRowDto) => (c.budgetSubmitted && c.planned !== undefined && c.spent !== undefined ? `${num(c.spent)} / ${num(c.planned)}` : "–");

function OverviewBody({ data, fade }: { data: SchoolClubsRes; fade: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { term, clubs } = data;
  const active = clubs.filter((c) => c.activeIn30Days).length;
  const inactive = clubs.length - active;
  const submitted = clubs.filter((c) => c.budgetSubmitted).length;
  const shown = clubs.filter((c) => filter === "all" || (filter === "inactive" ? !c.activeIn30Days : !c.budgetSubmitted));
  const cutoff = dm(Date.now() - ACTIVE_DAYS * 86_400_000);
  const chip = (k: Filter, label: string) => <button type="button" className="l-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>;

  return (
    <>
      <PageTop title={TITLE} sub={subText(term)}
        actions={<button type="button" className="l-btn2" onClick={() => downloadCsv("cac-clb.csv", schoolRows(data))}><Icon name="download" size={18} />Xuất Excel</button>} />

      <Reveal from={fade} className="l-sheet">
        <div className="l-sec l-strip">
          <div className="l-cell">
            <span className="l-cell-label">{`Có hoạt động trong ${ACTIVE_DAYS} ngày`}</span>
            <span className="l-cell-value">{active} <span className="l-cell-unit">CLB</span></span>
            <span className="l-cell-note">Có ít nhất một buổi điểm danh trên CampusHub</span>
          </div>
          <div className={`l-cell${inactive > 0 ? " attn" : ""}`}>
            <span className="l-cell-label">{`Không có hoạt động trong ${ACTIVE_DAYS} ngày`}</span>
            <span className="l-cell-value">{inactive} <span className="l-cell-unit">CLB</span></span>
            <span className="l-cell-note">{`Buổi điểm danh gần nhất từ trước ${cutoff}`}</span>
          </div>
          <div className="l-cell">
            <span className="l-cell-label">{`Đã nộp dự trù ${term}`}</span>
            <span className="l-cell-value">{submitted}/{clubs.length} <span className="l-cell-unit">CLB</span></span>
            <span className="l-cell-note">Dự trù nộp qua CampusHub</span>
          </div>
        </div>

        <div className="l-sec">
          <div className="l-sec-head">
            <div className="l-seg" role="group" aria-label="Lọc các CLB">
              {chip("all", `Tất cả (${clubs.length})`)}
              {chip("inactive", `Không hoạt động ${ACTIVE_DAYS} ngày (${inactive})`)}
              {chip("nobudget", `Chưa nộp dự trù (${clubs.length - submitted})`)}
            </div>
          </div>
          <div className="l-table-wrap">
            <table className="l-table l-fixed l-rows-2 l-school-table">
              <ColGroup widths={WIDTHS} />
              <thead>
                <tr>{columns(term).map((h, i) => <th key={h} className={[2, 3, 6, 7].includes(i) ? "r" : undefined}>{i === 7 ? <span className="l-sr">{h}</span> : h}</th>)}</tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td className="name" id={`clb-${c.id}`}>{c.name}</td>
                    <td>{c.field}</td>
                    <td className="r">{c.members}</td>
                    <td className="r">{c.sessions}</td>
                    <td><span className="l-cell-line">{c.lastActivity ? dm(c.lastActivity) : "–"}{!c.activeIn30Days && <span className="l-tag off">{`Quá ${ACTIVE_DAYS} ngày`}</span>}</span></td>
                    <td>{c.budgetSubmitted ? <span className="l-tag ok">Đã nộp</span> : <span className="l-tag warn">Chưa nộp</span>}</td>
                    <td className="r money">{spending(c)}</td>
                    <td className="r"><Link className="l-rowlink" href={`/school/clubs/${c.id}`} aria-describedby={`clb-${c.id}`}>Xem<LinkIcon name="chevronRight" size={16} /></Link></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={8} className="l-empty-cell">Không có CLB nào trong nhóm này.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="l-foot">{NOTE}</p>
        </div>
      </Reveal>
    </>
  );
}
