"use client";

// Ban quản lý CLB của trường, mentor · Chi tiết một CLB (design/screens/NT-ChiTietCLB.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /school/clubs/:clubId: chỉ số tổng hợp (dự trù, đã chi, sinh hoạt), không có danh sách thành viên.
// Mentor duyệt hoặc từ chối khoản chờ: POST /school/expenses/:expenseId/approve | reject (từ chối phải ghi chú).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";
import type { ExpenseRes, SchoolClubRes, SchoolClubRowDto } from "@contract";
import { apiPost } from "@/api/client";
import { schoolBudgetRows } from "@/api/excel-rows";
import { errorText, keys, useSchoolClub, useSchoolClubs } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { ErrorGate, NOT_IN_MVP } from "@/components/lich/Gate";
import { daysLeft, Leaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, LinkIcon, Loading, Reveal, SkelLine, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop, TableSkeleton } from "@/components/lich/PageTop";
import { SchoolFrame } from "@/components/lich/SchoolFrame";
import { downloadCsv } from "@/lib/csv";
import { dm, dmy, longDate, money, num } from "@/lib/format";
import { MENTOR_THRESHOLD } from "@/lib/selectors";

type Detail = NonNullable<SchoolClubRes["detail"]>;
type Waiting = Detail["waitingMentor"][number];

// Cùng câu lỗi với màn Duyệt chi của ban điều hành (clubs/[clubId]/expenses).
const REJECT_NOTE_REQUIRED = "Cần ghi chú lý do khi từ chối.";
const BUDGET_COLS = ["Hoạt động", "Dự trù (₫)", "Đã chi (₫)"];
const BUDGET_WIDTHS = ["56%", "22%", "22%"];
const SUPPORT: Record<"pending" | "approved" | "rejected", [string, string]> = {
  pending: ["wait", "Chờ duyệt"], approved: ["ok", "Đã duyệt"], rejected: ["off", "Từ chối"],
};

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useSchoolClub(clubId); // tải song song với khung
  return <LichPage><SchoolFrame active="detail"><ClubDetail clubId={clubId} /></SchoolFrame></LichPage>;
}

function BackLink() {
  return <Link href="/school" className="l-back"><LinkIcon name="chevronLeft" size={18} />Các CLB</Link>;
}

/** Đầu trang: link về danh sách, tờ lịch hôm nay, tên CLB và dòng phụ. */
function Head({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return <div className="l-top-wrap"><BackLink /><PageTop title={title} sub={sub} /></div>;
}

/** Khung xương vẽ trạng thái hay gặp nhất: CLB có dữ liệu chi tiết, một khoản chờ duyệt. Tên phần, nhãn và tiêu đề cột là chữ thật. */
function DetailSkeleton() {
  return (
    <>
      <Head title={<SkelLine w={300} />} sub={<SkelLine w={620} />} />
      <Loading className="l-sheet l-nt-split">
        <div className="l-stack">
          <div className="l-sec">
            <div className="l-sec-head">
              <div className="l-field"><h2><SkelLine w={260} /></h2><span className="l-note"><SkelLine w={150} /></span></div>
              <span className="l-btn2 l-sm l-inert"><Icon name="download" size={16} />Tải bản dự trù</span>
            </div>
            <TableSkeleton className="l-fixed-narrow" headers={BUDGET_COLS} widths={BUDGET_WIDTHS} rows={4} right={[1, 2]} action={false} foot />
            <p className="l-foot">Số đã chi lấy từ sổ quỹ của CLB, cập nhật khi CLB ghi nhận khoản chi.</p>
          </div>
          <div className="l-sec">
            <div className="l-sec-head"><h2>Sinh hoạt kỳ này</h2></div>
            <div className="l-strip l-strip-top">
              <div className="l-cell"><span className="l-cell-label">Buổi có điểm danh</span><span className="l-cell-value"><SkelLine w={70} /></span></div>
              <div className="l-cell"><span className="l-cell-label">Trung bình mỗi buổi</span><span className="l-cell-value"><SkelLine w={90} /></span></div>
              <div className="l-cell leaf"><LeafSkel sub="Thứ Bảy" /><span className="l-field"><span className="l-cell-label">Buổi gần nhất</span><span className="l-cell-note"><SkelLine w={120} /></span></span></div>
            </div>
          </div>
        </div>
        <div className="l-stack">
          <div className="l-sec"><WaitingHead /><div className="l-detail">
            <div className="l-detail-head"><h3><SkelLine w={220} /></h3><span className="l-detail-amount"><SkelLine w={120} /></span></div>
            <dl className="l-dl">
              {["Ban điều hành", "Thuộc dự trù", "Chứng từ"].map((t) => <div key={t} className="l-dl-row"><dt>{t}</dt><dd><SkelLine w="70%" /></dd></div>)}
            </dl>
            <div className="l-field"><span className="l-flabel">Ghi chú (bắt buộc khi từ chối)</span><span className="l-textarea l-sm-area" /></div>
            <div className="l-row-actions"><span className="l-btn2 l-inert">Từ chối</span><span className="l-btn l-inert">Duyệt</span></div>
          </div></div>
          <div className="l-sec">
            <div className="l-sec-head"><h2>Đề nghị hỗ trợ từ trường</h2><span className="l-tag wait"><SkelLine w={64} /></span></div>
            <div className="l-sec-body"><p className="l-support-text"><SkelLine w={380} /><br /><SkelLine w={150} /></p><SupportAction inert /></div>
          </div>
          <div className="l-sec">
            <div className="l-sec-head"><h2>Nhiệm kỳ</h2></div>
            <div className="l-sec-body"><dl className="l-dl">{["Ban hiện tại", "Bàn giao gần nhất"].map((t) => <div key={t} className="l-dl-row"><dt>{t}</dt><dd><SkelLine w="80%" /></dd></div>)}</dl></div>
          </div>
        </div>
      </Loading>
    </>
  );
}

function ClubDetail({ clubId }: { clubId: string }) {
  const query = useSchoolClub(clubId);
  const list = useSchoolClubs();
  const saw = useSawPending(query.isPending);
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    return <><Head title="Chi tiết CLB" /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: "/school", label: "Về danh sách CLB" }} /></>;
  }
  const { club, detail } = query.data;
  if (!detail) return <SummaryOnly club={club} detailed={list.data?.clubs.find((c) => c.detailed)} fade={saw} />;
  return <DetailBody data={query.data} detail={detail} fade={saw} />;
}

/** Thiếu số thì chỉ ghi "Đã nộp", không tự ghi 0 ₫. */
function budgetText(c: SchoolClubRowDto): string {
  if (!c.budgetSubmitted) return "Chưa nộp";
  if (c.spent === undefined || c.planned === undefined) return "Đã nộp";
  return `Đã nộp · đã chi ${money(c.spent)} / ${money(c.planned)}`;
}

/** CLB chưa có dữ liệu chi tiết trong bản demo: chỉ có số tổng. */
function SummaryOnly({ club, detailed, fade }: { club: SchoolClubRes["club"]; detailed?: SchoolClubRowDto; fade: boolean }) {
  return (
    <>
      <Head title={club.name} sub={`${club.field} · ${club.members} thành viên`} />
      <Reveal from={fade} className="l-sheet">
        <div className="l-sec l-sec-body">
          <dl className="l-dl">
            <div className="l-dl-row"><dt>Buổi có điểm danh</dt><dd>{club.sessions} buổi</dd></div>
            <div className="l-dl-row"><dt>Hoạt động gần nhất</dt><dd>{club.lastActivity ? dmy(club.lastActivity) : "–"}</dd></div>
            <div className="l-dl-row"><dt>{`Dự trù ${club.term}`}</dt><dd>{budgetText(club)}</dd></div>
          </dl>
          {detailed && <p className="l-note">Bản demo chỉ có dữ liệu chi tiết của <Link href={`/school/clubs/${detailed.id}`}>{detailed.name}</Link>.</p>}
        </div>
      </Reveal>
    </>
  );
}

function DetailBody({ data, detail, fade }: { data: SchoolClubRes; detail: Detail; fade: boolean }) {
  const { club } = data;
  const waitingRef = useRef<HTMLElement>(null);
  const { budget, sessions } = detail;
  const exportBudget = () => downloadCsv(`du-tru-${club.id}.csv`, schoolBudgetRows(budget));
  const last = sessions.lastSessionStart;

  return (
    <>
      <Head title={club.name}
        sub={`${club.field} · ${club.members} thành viên · chủ nhiệm ${club.president?.name ?? "chưa có"} · mentor chuyên môn ${club.mentor ?? "chưa có"}`} />

      <Reveal from={fade} className="l-sheet l-nt-split">
        <div className="l-stack">
          <section className="l-sec" aria-labelledby="budget-section">
            <div className="l-sec-head">
              <div className="l-field">
                <h2 id="budget-section">Dự trù và thực chi {club.term}</h2>
                <span className="l-note">{budget.submittedAt ? `Bản nộp ngày ${dmy(budget.submittedAt)}` : "CLB chưa nộp dự trù"}</span>
              </div>
              <button type="button" className="l-btn2 l-sm" onClick={exportBudget}><Icon name="download" size={16} />Tải bản dự trù</button>
            </div>
            <div className="l-table-wrap">
              <table className="l-table l-fixed l-fixed-narrow">
                <ColGroup widths={BUDGET_WIDTHS} />
                <thead><tr>{BUDGET_COLS.map((h, i) => <th key={h} className={i > 0 ? "r" : undefined}>{h}</th>)}</tr></thead>
                <tbody>{budget.items.map((b) => <tr key={b.id}><td>{b.name}</td><td className="r">{num(b.planned)}</td><td className="r">{num(b.spent)}</td></tr>)}</tbody>
                <tfoot><tr><td>Tổng</td><td className="r">{num(budget.totals.planned)}</td><td className="r">{num(budget.totals.spent)}</td></tr></tfoot>
              </table>
            </div>
            <p className="l-foot">Số đã chi lấy từ sổ quỹ của CLB, cập nhật khi CLB ghi nhận khoản chi.</p>
          </section>

          <section className="l-sec" aria-labelledby="activity-section">
            <div className="l-sec-head"><h2 id="activity-section">Sinh hoạt kỳ này</h2></div>
            <div className="l-strip l-strip-top">
              <div className="l-cell">
                <span className="l-cell-label">Buổi có điểm danh</span>
                <span className="l-cell-value">{sessions.count} <span className="l-cell-unit">buổi</span></span>
              </div>
              <div className="l-cell">
                <span className="l-cell-label">Trung bình mỗi buổi</span>
                {/* Chưa có buổi nào đóng điểm danh thì trung bình là 0: "0/42 người" sẽ đọc như không ai đi. */}
                {sessions.count > 0 && sessions.averageAttendance > 0
                  ? <span className="l-cell-value">{sessions.averageAttendance}/{club.members} <span className="l-cell-unit">người</span></span>
                  : <span className="l-cell-value l-cell-none">chưa có</span>}
              </div>
              <div className="l-cell leaf">
                {last ? <Leaf date={last} tone={daysLeft(last) === 0 ? "today" : undefined} label={`Buổi gần nhất ${longDate(last)}`} /> : null}
                <span className="l-field">
                  <span className="l-cell-label">Buổi gần nhất</span>
                  <span className="l-cell-note">{last ? longDate(last) : "–"}</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="l-stack">
          {/* Một đầu phần "Chờ bạn duyệt" cho cả nhóm; hết khoản chờ thì câu báo nằm ngay dưới đầu phần đó. */}
          <section className="l-sec l-waiting" ref={waitingRef} tabIndex={-1} aria-labelledby="awaiting-approval">
            <WaitingHead />
            {detail.waitingMentor.length === 0 && <p className="l-empty">Không có khoản nào chờ bạn duyệt.</p>}
            {/* Duyệt hay từ chối xong thì khoản đó thu lại, để thấy khoản đó đã rời danh sách chờ. */}
            <AnimatePresence initial={false}>
              {detail.waitingMentor.map((w) => <MentorReview key={w.id} item={w} clubId={club.id} focusAfter={waitingRef} />)}
            </AnimatePresence>
          </section>
          {budget.support && (
            <section className="l-sec" aria-labelledby="support-section">
              <div className="l-sec-head">
                <h2 id="support-section">Đề nghị hỗ trợ từ trường</h2>
                <span className={`l-tag ${SUPPORT[budget.support.status][0]}`}>{SUPPORT[budget.support.status][1]}</span>
              </div>
              <div className="l-sec-body">
                <p className="l-support-text">{money(budget.support.amount)} cho {budget.support.purpose}.</p>
                <SupportAction />
              </div>
            </section>
          )}
          <section className="l-sec" aria-labelledby="term-section">
            <div className="l-sec-head"><h2 id="term-section">Nhiệm kỳ</h2></div>
            <div className="l-sec-body">
              <dl className="l-dl">
                {/* Dữ liệu chưa có tháng bắt đầu nhiệm kỳ, nên ghi theo học kỳ. */}
                <div className="l-dl-row"><dt>Ban hiện tại</dt><dd>{`Từ ${club.term}, chủ nhiệm ${club.president?.name ?? "chưa có"}`}</dd></div>
                {/* Chưa có lần bàn giao nào đã xong (tháng, biên bản như bản vẽ); lần đang làm thì ghi kèm. */}
                <div className="l-dl-row"><dt>Bàn giao gần nhất</dt><dd>{`chưa có${detail.handover ? ` · đang bàn giao sang ${detail.handover.toTerm}` : ""}`}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      </Reveal>
    </>
  );
}

/** Đầu phần khoản chờ duyệt: như các phần khác của cột (tiêu đề bên trái, chú thích bên cạnh), không dùng nhãn nhỏ trên tên khoản. */
function WaitingHead() {
  return <div className="l-sec-head"><h2 id="awaiting-approval">Chờ bạn duyệt</h2><span className="l-note">Khoản trên {money(MENTOR_THRESHOLD)}</span></div>;
}

/** "Xem đề nghị" chưa làm: nút xám kèm chữ "chưa có" (như "Xem và sửa thông tin" ở Của tôi). */
function SupportAction({ inert = false }: { inert?: boolean }) {
  if (inert) return <span className="l-inline-act l-inert"><span className="l-btn2 l-sm" aria-disabled="true">Xem đề nghị</span><span className="l-note">chưa có</span></span>;
  return (
    <span className="l-inline-act">
      <button type="button" className="l-btn2 l-sm" aria-disabled="true" aria-describedby="support-request-unavailable" onClick={() => toast(NOT_IN_MVP)}>Xem đề nghị</button>
      <span id="support-request-unavailable" className="l-note">chưa có</span>
    </span>
  );
}

function MentorReview({ item, clubId, focusAfter }: { item: Waiting; clubId: string; focusAfter: RefObject<HTMLElement | null> }) {
  const client = useQueryClient();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const noteId = `gc-${item.id}`;
  const errorId = `${noteId}-error`;

  const decide = useMutation({
    mutationFn: (v: { kind: "approve" | "reject"; note: string }) =>
      apiPost<ExpenseRes>(`/school/expenses/${item.id}/${v.kind}`, v.note ? { note: v.note } : {}),
    // Chờ màn có số mới (danh sách chờ, số đếm trên menu) rồi mới báo, để nút còn vòng xoay tới lúc đó.
    onSuccess: async (_, v) => {
      await Promise.all([client.invalidateQueries({ queryKey: keys.school }), client.invalidateQueries({ queryKey: keys.club(clubId) })]);
      toast.success(v.kind === "approve" ? `Đã duyệt khoản ${item.title}.` : `Đã từ chối khoản ${item.title}.`);
      focusAfter.current?.focus();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const busy = (kind: "approve" | "reject") => (decide.isPending && decide.variables?.kind === kind) || undefined;

  const reject = () => {
    if (decide.isPending) return;
    const reason = note.trim();
    if (!reason) { setError(REJECT_NOTE_REQUIRED); document.getElementById(noteId)?.focus(); return; }
    decide.mutate({ kind: "reject", note: reason });
  };
  const approve = () => { if (!decide.isPending) decide.mutate({ kind: "approve", note: note.trim() }); };

  return (
    <m.article className="l-collapse l-waiting-item" aria-labelledby={`expense-${item.id}`} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <div className="l-detail">
        <div className="l-detail-head">
          <h3 id={`expense-${item.id}`}>{item.title}</h3>
          <span className="l-detail-amount">{money(item.amount)}</span>
        </div>
        <dl className="l-dl">
          <div className="l-dl-row"><dt>Ban điều hành</dt><dd>{item.boardApproval ? `${item.boardApproval.by.name} đã duyệt ngày ${dm(item.boardApproval.at)}` : "Đã duyệt"}</dd></div>
          <div className="l-dl-row"><dt>Thuộc dự trù</dt><dd>{item.budgetItem ? `${item.budgetItem.name} (${money(item.budgetItem.planned)})` : "Không thuộc khoản nào"}</dd></div>
          <div className="l-dl-row"><dt>Chứng từ</dt><dd>{item.receipt ?? <span className="l-tag warn">Chưa có chứng từ</span>}</dd></div>
        </dl>
        <div className="l-field">
          <label className="l-flabel" htmlFor={noteId}>Ghi chú (bắt buộc khi từ chối)</label>
          <textarea id={noteId} className="l-textarea l-sm-area" rows={2} value={note} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
            onChange={(e) => { setNote(e.target.value); setError(""); }} />
          {error && <span id={errorId} className="l-error" role="alert">{error}</span>}
        </div>
        <div className="l-row-actions">
          <button type="button" className="l-btn2" aria-busy={busy("reject")} onClick={reject}>Từ chối</button>
          <button type="button" className="l-btn" aria-busy={busy("approve")} onClick={approve}>Duyệt</button>
        </div>
      </div>
    </m.article>
  );
}
