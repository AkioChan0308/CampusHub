"use client";

// Ban điều hành · Dự trù kinh phí kỳ (design/screens/BDH-DuTru.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/budget. Thêm hoạt động: POST /budget/items. Gửi cho mentor: POST /budget/submit.
// Số dư cuối kỳ dự kiến = số dư hiện tại + tiền còn phải thu + hỗ trợ dự kiến − phần dự trù chưa chi (máy chủ tính).

import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { BudgetItemRes, BudgetRes } from "@contract";
import { apiPost } from "@/api/client";
import { budgetRows } from "@/api/excel-rows";
import { errorText, useBudget, useClubMutation } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop, TableSkeleton } from "@/components/lich/PageTop";
import { parseMoneyInput } from "@/components/money-input";
import { downloadCsv } from "@/lib/csv";
import { dm, money, num } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useBudget(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="budget" fallback={<BudgetSkeleton />}>
        <BudgetPage />
      </BoardFrame>
    </LichPage>
  );
}

const SUPPORT_LABEL = { pending: "chờ duyệt", approved: "đã duyệt", rejected: "bị từ chối" } as const;
const COLUMNS = ["Hoạt động", "Thời gian", "Nguồn tiền", "Dự trù (₫)", "Đã chi (₫)", "Còn lại (₫)"];
const WIDTHS = ["30%", "11%", "29%", "10%", "10%", "10%"];
const TERMS = ["Số dư hiện tại", "Thu dự kiến", "Trường hỗ trợ", "Dự trù còn phải chi", "Số dư cuối kỳ dự kiến"];
const OPS = ["", "+", "+", "−", "="];
const FOOTNOTE = "Cột “Đã chi” lấy từ sổ quỹ. Khi CLB đã có ít nhất một kỳ dữ liệu, CampusHub mới gợi ý dự trù dựa trên các kỳ trước.";
const LOCK_ID = "budget-quyen";
const NONE_ID = "budget-chua-co";

/** Dòng phụ của ô "Thu dự kiến". Chỉ ghi phép nhân khi số người × mức thu đúng bằng số tiền ở trên; có người đóng thiếu thì không bằng.
 *  Kỳ có nhiều đợt thu (mỗi đợt một mức) thì ghi số khoản và số đợt. */
function expectedNote(f: BudgetRes["forecast"]): string {
  if (f.collections === 0) return "Chưa có đợt thu";
  if (f.expectedCount === 0) return "Đã thu đủ";
  if (f.collections > 1) return `${f.expectedCount} khoản chưa xác nhận, từ ${f.collections} đợt thu`;
  if (f.expected === f.expectedCount * f.fee) return `${f.expectedCount} người chưa xác nhận × ${money(f.fee)}`;
  return `${f.expectedCount} người chưa xác nhận, có người đóng thiếu`;
}

/** Khung xương đúng cấu trúc màn: nhãn của phép tính, dấu + − =, tiêu đề bảng, tiêu đề cột và dòng "Tổng" là thật; số liệu là thanh trong dòng chữ. */
function BudgetSkeleton({ term }: { term?: string }) {
  return (
    <>
      <PageTop title={term ? `Dự trù kinh phí học kỳ ${term}` : <SkelLine w={340} />}
        sub="Tự kiểm tra quỹ đủ hay thiếu, rồi xuất bản dự trù để nộp cho mentor và ban quản lý CLB của trường."
        actions={<><Skel w={300} h={40} /><Skel w={240} h={40} /></>} />
      <Loading className="l-sheet">
        <div className="l-sec l-formula">
          {TERMS.map((t, i) => (
            <div key={t} className="l-formula-slot">
              {i > 0 && <span className="l-op" aria-hidden="true">{OPS[i]}</span>}
              <div className={`l-cell${i === 4 ? " result" : ""}`}>
                <span className="l-cell-label">{t}</span>
                <span className="l-cell-value"><SkelLine w="80%" /></span>
                {/* Dòng phụ thường dài hai dòng ("10 người chưa xác nhận × 100.000 ₫"). */}
                <span className="l-cell-note"><SkelLine w="90%" /><br /><SkelLine w="40%" /></span>
              </div>
            </div>
          ))}
        </div>
        <p className="l-sec l-sec-pad l-budget-note"><span className="l-grow"><SkelLine w="58%" /></span></p>
        <div className="l-sec">
          {/* Chữ trên nút là chữ cố định: hiện thật (chưa bấm được) để hàng tiêu đề cao đúng như khi đã tải. */}
          <div className="l-sec-head"><h2>Các khoản dự trù</h2><span className="l-btn2 l-sm l-skel-btn" aria-hidden="true"><Icon name="plus" size={16} />Thêm hoạt động</span></div>
          <TableSkeleton headers={COLUMNS} widths={WIDTHS} rows={4} right={[3, 4, 5]} action={false} foot />
          <p className="l-foot">{FOOTNOTE}</p>
        </div>
      </Loading>
    </>
  );
}

function BudgetPage() {
  const { club } = useLichBoard();
  const query = useBudget(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <BudgetSkeleton term={club.term} />;
  if (query.isError) return <><PageTop title={`Dự trù kinh phí học kỳ ${club.term}`} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <BudgetBody plan={query.data} fade={sawHere || sawFrame} />;
}

function BudgetBody({ plan, fade }: { plan: BudgetRes; fade: boolean }) {
  const { club, me } = useLichBoard();
  const [adding, setAdding] = useState(false);
  const f = plan.forecast;
  const canEdit = can(me.role, "budget");
  const short = f.result < 0;
  // Bản dự trù của kỳ luôn kèm dòng hỗ trợ của trường, nên có `support` nghĩa là CLB đã có bản dự trù kỳ này.
  const hasBudget = !!plan.support;
  const sendLock = !canEdit ? LOCK_ID : !hasBudget ? NONE_ID : undefined;
  // Đóng form thêm hoạt động (Hủy hoặc Thêm xong) thì focus về lại nút "Thêm hoạt động".
  const addButton = useRef<HTMLButtonElement>(null);
  const wasAdding = useRef(false);
  useEffect(() => {
    if (wasAdding.current && !adding) addButton.current?.focus();
    wasAdding.current = adding;
  }, [adding]);

  const submit = useClubMutation(club.id, () => apiPost<BudgetRes>(`/clubs/${club.id}/budget/submit`), { onSuccess: () => toast.success("Đã gửi bản dự trù cho mentor.") });

  function exportCsv() {
    downloadCsv(`du-tru-${club.id}-${plan.term.replace(/\s+/g, "-").toLowerCase()}.csv`, budgetRows(plan));
  }

  const cell = (label: string, value: string, note: string, extra = "") => (
    <div className={`l-cell${extra}`}><span className="l-cell-label">{label}</span><span className="l-cell-value">{value}</span><span className="l-cell-note">{note}</span></div>
  );

  return (
    <>
      <PageTop
        title={`Dự trù kinh phí học kỳ ${plan.term}`}
        sub="Tự kiểm tra quỹ đủ hay thiếu, rồi xuất bản dự trù để nộp cho mentor và ban quản lý CLB của trường."
        actions={<>
          <button type="button" className="l-btn2" onClick={exportCsv}><Icon name="download" size={18} />Xuất Excel theo [mẫu dự trù của trường]</button>
          <button type="button" className="l-btn" disabled={!!sendLock} aria-describedby={sendLock} aria-busy={submit.isPending || undefined}
            onClick={() => { if (!submit.isPending) submit.mutate(undefined); }}>
            {plan.submittedAt ? `Đã gửi ${dm(plan.submittedAt)} · Gửi lại cho mentor` : "Gửi cho mentor"}
          </button>
        </>}
      />
      {!canEdit && <p className="l-note" id={LOCK_ID}>{RIGHT_LABEL.budget}</p>}
      {canEdit && !hasBudget && <p className="l-note" id={NONE_ID}>CLB chưa có bản dự trù kỳ này.</p>}

      <Reveal from={fade} className="l-sheet">
        <div className="l-sec l-formula" role="group" aria-label="Phép tính số dư cuối kỳ dự kiến">
          <div className="l-formula-slot">{cell("Số dư hiện tại", money(f.current), "Theo sổ quỹ")}</div>
          <div className="l-formula-slot"><span className="l-op" aria-hidden="true">+</span>{cell("Thu dự kiến", money(f.expected), expectedNote(f))}</div>
          <div className="l-formula-slot"><span className="l-op" aria-hidden="true">+</span>{cell("Trường hỗ trợ", money(f.support), plan.support ? `Cho giải nội bộ, ${SUPPORT_LABEL[plan.support.status]}` : "Không có")}</div>
          <div className="l-formula-slot"><span className="l-op" aria-hidden="true">−</span>{cell("Dự trù còn phải chi", money(f.toSpend), `Dự trù ${money(plan.totals.planned)}, đã chi ${money(plan.totals.spent)}`)}</div>
          <div className="l-formula-slot"><span className="l-op" aria-hidden="true">=</span>
            {cell("Số dư cuối kỳ dự kiến", `${f.result > 0 ? "+" : ""}${money(f.result)}`, short ? "Đang thiếu" : "Đủ chi", ` result${short ? " short" : ""}`)}
          </div>
        </div>
        <p className="l-sec l-sec-pad l-budget-note">
          {short
            ? <><Icon name="alert" size={18} />Quỹ đang thiếu {money(-f.result)} so với dự trù.</>
            : <>Quỹ đủ cho các khoản dự trù còn lại. Khoản đã chi đã nằm trong số dư, nên chỉ trừ phần dự trù chưa chi.</>}
        </p>

        <div className="l-sec">
          <div className="l-sec-head">
            <h2>Các khoản dự trù</h2>
            {!adding && (
              <button ref={addButton} type="button" className="l-btn2 l-sm" disabled={!canEdit} aria-describedby={canEdit ? undefined : LOCK_ID} onClick={() => setAdding(true)}>
                <Icon name="plus" size={16} />Thêm hoạt động
              </button>
            )}
          </div>
          {adding && <AddItem clubId={club.id} onDone={() => setAdding(false)} />}
          <div className="l-table-wrap">
            <table className="l-table l-fixed">
              <ColGroup widths={WIDTHS} />
              <thead>
                <tr>{COLUMNS.map((h, i) => <th key={h} className={i >= 3 ? "r" : undefined}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {plan.items.map((item) => (
                  <tr key={item.id}>
                    <td className="name">{item.name}</td><td>{item.period}</td><td>{item.source}</td>
                    <td className="r">{num(item.planned)}</td><td className="r">{num(item.spent)}</td>
                    <td className={`r${item.remaining < 0 ? " warn" : ""}`}>{num(item.remaining)}</td>
                  </tr>
                ))}
                {plan.items.length === 0 && (
                  <tr><td colSpan={6} className="l-empty-cell">Chưa có khoản dự trù nào cho kỳ {plan.term}.{canEdit ? " Bấm “Thêm hoạt động” để thêm khoản đầu tiên." : ""}</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr><td>Tổng</td><td /><td /><td className="r">{num(plan.totals.planned)}</td><td className="r">{num(plan.totals.spent)}</td><td className="r">{num(plan.totals.planned - plan.totals.spent)}</td></tr>
              </tfoot>
            </table>
          </div>
          <p className="l-foot">{FOOTNOTE}</p>
        </div>
      </Reveal>
    </>
  );
}

/** Thêm khoản dự trù. Bản vẽ chưa có form này: làm ngay trong tờ giấy, phía trên bảng. */
function AddItem({ clubId, onDone }: { clubId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("Quỹ thành viên");
  const [planned, setPlanned] = useState("");
  // Lỗi gắn với một ô: dòng lỗi nằm dưới hàng ô (để các ô vẫn thẳng hàng) và nối với ô bằng aria-describedby.
  const [error, setError] = useState<{ field: "budget-name" | "budget-amount" | "server"; text: string } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);
  const add = useClubMutation(clubId, (body: { name: string; period?: string; source?: string; planned: number }) => apiPost<BudgetItemRes>(`/clubs/${clubId}/budget/items`, body), {
    onSuccess: (res) => { toast.success(`Đã thêm “${res.item.name}” vào dự trù.`); onDone(); },
    onError: (e) => setError({ field: "server", text: errorText(e) }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (add.isPending) return;
    const amount = parseMoneyInput(planned);
    if (!name.trim()) { setError({ field: "budget-name", text: "Cần ghi tên hoạt động." }); nameRef.current?.focus(); return; }
    if (!amount) {
      setError({ field: "budget-amount", text: planned.trim() ? "Số tiền chỉ gồm chữ số, ví dụ 1500000." : "Cần ghi số tiền dự trù." });
      amountRef.current?.focus();
      return;
    }
    add.mutate({ name: name.trim(), period: period.trim() || undefined, source: source.trim() || undefined, planned: amount });
  }
  const parsed = parseMoneyInput(planned);
  const invalid = (id: "budget-name" | "budget-amount") => (error?.field === id ? { "aria-invalid": true, "aria-describedby": "budget-error" } : id === "budget-amount" && parsed ? { "aria-describedby": "budget-amount-hint" } : {});
  return (
    <form className="l-budget-add" onSubmit={submit} aria-label="Thêm hoạt động dự trù">
      <div className="l-field"><label className="l-flabel" htmlFor="budget-name">Hoạt động</label><input ref={nameRef} id="budget-name" className="l-input" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} {...invalid("budget-name")} /></div>
      <div className="l-field"><label className="l-flabel" htmlFor="budget-time">Thời gian</label><input id="budget-time" className="l-input" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ví dụ: 11/2026" /></div>
      <div className="l-field"><label className="l-flabel" htmlFor="budget-source">Nguồn tiền</label><input id="budget-source" className="l-input" value={source} onChange={(e) => setSource(e.target.value)} /></div>
      <div className="l-field"><label className="l-flabel" htmlFor="budget-amount">Dự trù (₫)</label><input ref={amountRef} id="budget-amount" className="l-input" inputMode="numeric" value={planned} onChange={(e) => { setPlanned(e.target.value); setError(null); }} {...invalid("budget-amount")} /></div>
      <div className="l-row-actions l-budget-add-actions">
        <button type="button" className="l-btn2" onClick={onDone}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={add.isPending || undefined}>Thêm</button>
      </div>
      {error ? <p id="budget-error" className="l-error l-budget-add-error" role="alert">{error.text}</p>
        : parsed ? <p id="budget-amount-hint" className="l-hint l-budget-add-error">Sẽ ghi: {money(parsed)}</p> : null}
    </form>
  );
}
