"use client";

// Ban điều hành · Đề xuất và duyệt chi (design/screens/BDH-DuyetChi.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/expenses. Duyệt, từ chối, ghi đã chi, tạo khoản mới: các POST của /expenses.
// Luật "không tự duyệt khoản của mình", "từ chối phải ghi lý do" kiểm tra ở máy chủ; giao diện chỉ khóa nút cho dễ hiểu.

import * as m from "motion/react-m";
import { useParams } from "next/navigation";
import { Tabs as T } from "radix-ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { ExpenseDto, ExpenseRes, ExpensesRes, MarkSpentRes } from "@contract";
import { apiPost } from "@/api/client";
import { useBudget, useClubMutation, useExpenses } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { parseMoneyInput } from "@/components/money-input";
import { dm, dmy, hm, money } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { ROLE_LABEL } from "@/lib/types";

const TITLE = "Đề xuất và duyệt chi";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useExpenses(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="expenses" fallback={<ExpensesSkeleton />}>
        <Expenses />
      </BoardFrame>
    </LichPage>
  );
}

type Tab = "pending" | "mentor" | "approved" | "rejected";
type FormKind = "proposal" | "reimbursement";
const TABS: [Tab, string][] = [["pending", "Chờ duyệt"], ["mentor", "Chờ mentor"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"]];
const EMPTY: Record<Tab, string> = {
  pending: "Chưa có khoản nào chờ duyệt.",
  mentor: "Chưa có khoản nào chờ mentor duyệt.",
  approved: "Chưa có khoản nào đã duyệt.",
  rejected: "Chưa có khoản nào bị từ chối.",
};

/** Tab của một khoản: khoản đã ghi vào sổ quỹ vẫn nằm ở tab "Đã duyệt". */
const tabOf = (e: ExpenseDto): Tab => (e.status === "spent" ? "approved" : e.status);

/** "trưởng ban Hậu cần", "chủ nhiệm". */
const roleText = (r: ExpenseDto["requester"]) => (r.role ? `${ROLE_LABEL[r.role].toLowerCase()}${r.role === "head" && r.department ? ` ${r.department}` : ""}` : "");

/** Số còn lại của khoản dự trù: "còn 1.600.000 ₫" hoặc "đã vượt 50.000 ₫". */
const remainingText = (remaining: number) => (remaining >= 0 ? `còn ${money(remaining)}` : `đã vượt ${money(-remaining)}`);

const FACTS = ["Người đề xuất", "Gửi lúc", "Thuộc dự trù", "Chứng từ", "Lý do"];

/** Khung xương đúng cấu trúc màn: thẻ tab, nhãn các dòng thông tin, ô ghi chú và tiêu đề "Lịch sử" là thật; số liệu là thanh trong dòng chữ. */
function ExpensesSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={520} />} actions={<><Skel w={190} h={40} /><Skel w={140} h={40} /></>} />
      <Loading className="l-sheet l-sheet-split">
        <div>
          <div className="l-tabs-list">{TABS.map(([k, label]) => <span key={k} className="l-tab-trigger">{label}</span>)}</div>
          {[0, 1].map((i) => (
            <div key={i} className="l-pick">
              <span className="l-pick-top"><span><SkelLine w={150} /></span><span className="l-pick-amount"><SkelLine w={70} /></span></span>
              <span className="l-note"><SkelLine w={190} /></span>
              <span className="l-tag off"><SkelLine w={110} /></span>
            </div>
          ))}
        </div>
        <div className="l-detail">
          <div className="l-detail-head">
            <div className="l-field"><h2><SkelLine w={220} /></h2><span className="l-meta"><SkelLine w={190} /></span></div>
            <span className="l-detail-amount"><SkelLine w={130} /></span>
          </div>
          <dl className="l-dl">
            {FACTS.map((f) => <div key={f} className="l-dl-row"><dt>{f}</dt><dd>{f === "Chứng từ" ? <span className="l-tag off"><SkelLine w={110} /></span> : <SkelLine w="60%" />}</dd></div>)}
          </dl>
          <div className="l-form">
            <div className="l-field">
              <span className="l-flabel">Ghi chú (bắt buộc khi từ chối)</span>
              <textarea className="l-textarea" rows={3} disabled tabIndex={-1} aria-hidden="true" />
            </div>
            <div className="l-row-actions"><Skel w={92} h={40} /><Skel w={96} h={40} /></div>
          </div>
          <div className="l-field">
            <h3 className="l-subhead">Lịch sử</h3>
            <ol className="l-history"><li><time><SkelLine w={84} /></time><span><SkelLine w="55%" /></span></li></ol>
            <p className="l-note">Sổ quỹ không sửa, không xóa được. Muốn điều chỉnh thì thêm bút toán mới.</p>
          </div>
        </div>
      </Loading>
    </>
  );
}

function Expenses() {
  const { club } = useLichBoard();
  const query = useExpenses(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <ExpensesSkeleton />;
  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <ExpensesBody data={query.data} fade={sawHere || sawFrame} />;
}

function ExpensesBody({ data, fade }: { data: ExpensesRes; fade: boolean }) {
  const { club, me } = useLichBoard();
  const [pickedTab, setPickedTab] = useState<Tab>("pending");
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState<FormKind | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const all = data.expenses;
  // Khoản đang mở quyết định tab: duyệt hay từ chối xong thì tab đi theo khoản đó, không nhảy sang khoản khác.
  const chosen = selId ? all.find((e) => e.id === selId) : undefined;
  const tab = chosen ? tabOf(chosen) : pickedTab;
  const list = all.filter((e) => tabOf(e) === tab);
  const sel = chosen ?? list[0];

  function openItem(id: string | null) { setSelId(id); setForm(null); }
  function pickTab(t: string) { setPickedTab(t as Tab); openItem(null); }
  function openForm(kind: FormKind, button: HTMLButtonElement) { opener.current = button; setForm(kind); }
  function closeForm() { setForm(null); opener.current?.focus(); }

  return (
    <>
      <PageTop
        title={TITLE}
        sub={`Không ai được duyệt khoản do chính mình đề xuất. Khoản trên ${money(data.mentorThreshold)} cần mentor duyệt thêm.`}
        actions={<>
          <button type="button" className="l-btn2" onClick={(e) => openForm("reimbursement", e.currentTarget)}>Gửi yêu cầu hoàn ứng</button>
          <button type="button" className="l-btn" onClick={(e) => openForm("proposal", e.currentTarget)}><Icon name="plus" size={18} />Đề xuất chi</button>
        </>}
      />

      <Reveal from={fade} className="l-sheet l-sheet-split">
        <T.Root value={tab} onValueChange={pickTab}>
          <T.List className="l-tabs-list" aria-label="Lọc khoản chi">
            {TABS.map(([key, label]) => {
              const n = all.filter((e) => tabOf(e) === key).length;
              return <T.Trigger key={key} value={key} className="l-tab-trigger">{label}{key === "pending" || key === "mentor" ? ` (${n})` : ""}</T.Trigger>;
            })}
          </T.List>
          <T.Content value={tab}>
            {list.length === 0 && <p className="l-empty">{EMPTY[tab]}</p>}
            {list.map((e) => {
              const open = sel?.id === e.id && !form;
              const mine = e.requester.personId === me.personId;
              const badge = e.status === "pending" && mine ? <span className="l-tag off">Bạn đề xuất, cần người khác duyệt</span>
                : e.status === "spent" ? <span className="l-tag ok">Đã chi</span>
                : !e.receipt ? <span className="l-tag warn">Chưa có chứng từ</span>
                : null;
              return (
                <button key={e.id} type="button" className="l-pick" aria-pressed={open} onClick={() => openItem(e.id)}>
                  <span className="l-pick-top"><span>{e.title}</span><span className="l-pick-amount">{money(e.amount)}</span></span>
                  <span className="l-note">{e.requester.name}{mine ? " (bạn)" : roleText(e.requester) ? ` · ${roleText(e.requester)}` : ""} · {dm(e.createdAt)}</span>
                  {badge}
                </button>
              );
            })}
          </T.Content>
        </T.Root>

        {form ? <NewExpense key={form} kind={form} onCancel={closeForm} onCreated={(id) => { openItem(id); opener.current?.focus(); }} />
          : sel ? <Detail key={sel.id} expense={sel} /> : <div className="l-detail"><p className="l-note">Chọn một khoản ở bên trái để xem.</p></div>}
      </Reveal>
    </>
  );
}

function Detail({ expense }: { expense: ExpenseDto }) {
  const { club, me } = useLichBoard();
  const item = expense.budgetItem;
  return (
    <section className="l-detail" aria-labelledby="expense-title">
      <div className="l-detail-head">
        <div className="l-field">
          <h2 id="expense-title">{expense.title}</h2>
          <span className="l-meta">{expense.kind === "proposal" ? "Đề xuất chi · chi trước khi tiêu" : "Hoàn ứng · đã tiêu trước"}</span>
        </div>
        <span className="l-detail-amount">{money(expense.amount)}</span>
      </div>
      <dl className="l-dl">
        <div className="l-dl-row"><dt>Người đề xuất</dt><dd>{expense.requester.name}{roleText(expense.requester) ? `, ${roleText(expense.requester)}` : ""}</dd></div>
        <div className="l-dl-row"><dt>Gửi lúc</dt><dd>{hm(expense.createdAt)} ngày {dmy(expense.createdAt)}</dd></div>
        <div className="l-dl-row"><dt>Thuộc dự trù</dt><dd>{item ? `${item.name} · ${remainingText(item.remaining)}${item.remaining >= 0 ? " trong dự trù" : " so với dự trù"}` : "Không thuộc khoản dự trù nào"}</dd></div>
        <div className="l-dl-row"><dt>Chứng từ</dt><dd>{expense.receipt ? <span>{expense.receipt}</span> : <><span className="l-tag warn">Chưa có chứng từ</span><span className="l-note">Vẫn ghi sổ được. Nhãn này hiện cho mọi thành viên thấy.</span></>}</dd></div>
        <div className="l-dl-row"><dt>Lý do</dt><dd>{expense.reason ? `“${expense.reason}”` : <span className="l-note">Không ghi lý do.</span>}</dd></div>
        {expense.rejectNote && <div className="l-dl-row"><dt>Lý do từ chối</dt><dd>“{expense.rejectNote}”</dd></div>}
      </dl>

      <Decision expense={expense} clubId={club.id} isMine={expense.requester.personId === me.personId} canApprove={can(me.role, "approveExpense")} canMoney={can(me.role, "money")} />

      <div className="l-field">
        <h3 className="l-subhead">Lịch sử</h3>
        <ol className="l-history">
          {expense.history.map((h, i) => <li key={i}><time dateTime={h.at}>{dm(h.at)} {hm(h.at)}</time><span>{h.by.name} {h.text}</span></li>)}
        </ol>
        <p className="l-note">Sổ quỹ không sửa, không xóa được. Muốn điều chỉnh thì thêm bút toán mới.</p>
      </div>
    </section>
  );
}

function Decision({ expense, clubId, isMine, canApprove, canMoney }: { expense: ExpenseDto; clubId: string; isMine: boolean; canApprove: boolean; canMoney: boolean }) {
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const base = `/clubs/${clubId}/expenses/${expense.id}`;
  const approve = useClubMutation(clubId, (n: string) => apiPost<ExpenseRes>(`${base}/approve`, n ? { note: n } : {}),
    { onSuccess: (res) => toast.success(res.expense.status === "mentor" ? "Đã duyệt. Khoản này chờ mentor duyệt thêm." : "Đã duyệt khoản chi.") });
  const reject = useClubMutation(clubId, (n: string) => apiPost<ExpenseRes>(`${base}/reject`, { note: n }), { onSuccess: () => toast.success("Đã từ chối khoản chi.") });
  const spent = useClubMutation(clubId, () => apiPost<MarkSpentRes>(`${base}/spent`), { onSuccess: (res) => toast.success(`Đã ghi vào sổ quỹ. Số dư còn ${money(res.balance)}.`) });
  // Nhãn trạng thái chỉ hiện dần khi trạng thái đổi lúc đang xem (vừa bấm duyệt, từ chối, ghi sổ).
  const openedWith = useRef(expense.status);
  const fadeIn = { initial: expense.status === openedWith.current ? false : { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: "easeOut" } } as const;
  const busy = approve.isPending || reject.isPending;

  if (expense.status === "mentor") return <m.span className="l-tag wait" {...fadeIn}>Chờ mentor duyệt</m.span>;
  if (expense.status === "rejected") return <m.span className="l-tag off" {...fadeIn}>Đã từ chối</m.span>;
  if (expense.status === "spent") return <m.span className="l-tag ok" {...fadeIn}>Đã ghi vào sổ quỹ</m.span>;
  if (expense.status === "approved") {
    return (
      <m.div className="l-decision" {...fadeIn}>
        <span className="l-tag ok">Đã duyệt · chờ chi</span>
        {!canMoney && <p className="l-note" id="record-spent-locked-reason">{RIGHT_LABEL.money}</p>}
        <LichConfirm className="l-btn" disabled={!canMoney} describedBy={canMoney ? undefined : "record-spent-locked-reason"} busy={spent.isPending} onConfirm={() => spent.mutate(undefined)} confirm="Ghi vào sổ"
          title={`Ghi khoản chi “${expense.title}” ${money(expense.amount)} vào sổ quỹ?`} description="Chỉ bấm khi tiền đã chi thật. Sổ quỹ không sửa, không xóa được.">
          Ghi đã chi vào sổ quỹ
        </LichConfirm>
      </m.div>
    );
  }

  const blocked = isMine ? "Bạn đề xuất khoản này, cần người khác duyệt." : !canApprove ? RIGHT_LABEL.approveExpense : "";
  const onReject = () => {
    if (busy) return;
    if (!note.trim()) { setNoteErr("Cần ghi chú lý do khi từ chối."); noteRef.current?.focus(); return; }
    reject.mutate(note.trim());
  };
  return (
    <div className="l-form">
      <div className="l-field">
        <label className="l-flabel" htmlFor="expense-note">Ghi chú (bắt buộc khi từ chối)</label>
        <textarea ref={noteRef} id="expense-note" className="l-textarea" rows={3} placeholder="Ví dụ: cần báo giá của sân trước khi duyệt" value={note} disabled={!!blocked}
          onChange={(ev) => { setNote(ev.target.value); setNoteErr(""); }} aria-invalid={noteErr ? true : undefined} aria-describedby={noteErr ? "expense-note-error" : blocked ? "approve-locked-reason" : undefined} />
        {noteErr && <span id="expense-note-error" className="l-error" role="alert">{noteErr}</span>}
      </div>
      {blocked && <p className="l-note" id="approve-locked-reason">{blocked}</p>}
      <div className="l-row-actions">
        <button type="button" className="l-btn2" disabled={!!blocked} aria-busy={reject.isPending || undefined} onClick={onReject}>Từ chối</button>
        <button type="button" className="l-btn" disabled={!!blocked} aria-busy={approve.isPending || undefined} onClick={() => { if (!busy) approve.mutate(note.trim()); }}>
          <Icon name="check" size={18} strokeWidth={2} />Duyệt
        </button>
      </div>
    </div>
  );
}

/** Form đề xuất chi, hoàn ứng. Bản vẽ chưa có màn này: làm bằng các thành phần sẵn có. */
function NewExpense({ kind, onCancel, onCreated }: { kind: FormKind; onCancel: () => void; onCreated: (id: string) => void }) {
  const { club } = useLichBoard();
  const budget = useBudget(club.id);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetItemId, setBudgetItemId] = useState("");
  const [reason, setReason] = useState("");
  const [hasReceipt, setHasReceipt] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const create = useClubMutation(club.id,
    (body: { kind: FormKind; title: string; amount: number; budgetItemId?: string; reason?: string; hasReceipt: boolean }) => apiPost<ExpenseRes>(`/clubs/${club.id}/expenses`, body),
    { onSuccess: (res) => { toast.success(kind === "proposal" ? "Đã gửi đề xuất chi." : "Đã gửi yêu cầu hoàn ứng."); onCreated(res.expense.id); } });

  useEffect(() => { titleRef.current?.focus(); }, []);

  const parsed = parseMoneyInput(amount);
  // Gõ sai dạng số thì báo ngay; ô trống chỉ báo khi bấm "Gửi".
  const amountError = errors.amount ?? (amount.trim() && parsed === null ? "Số tiền chỉ gồm chữ số, ví dụ 150000." : undefined);

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (create.isPending) return;
    const next = {
      title: title.trim() ? undefined : "Cần ghi nội dung chi.",
      amount: !amount.trim() ? "Cần ghi số tiền." : parsed === null ? "Số tiền chỉ gồm chữ số, ví dụ 150000." : parsed === 0 ? "Số tiền phải lớn hơn 0." : undefined,
    };
    setErrors(next);
    if (next.title) { titleRef.current?.focus(); return; }
    if (next.amount || !parsed) { amountRef.current?.focus(); return; }
    create.mutate({ kind, title: title.trim(), amount: parsed, budgetItemId: budgetItemId || undefined, reason: reason.trim() || undefined, hasReceipt });
  }

  return (
    <form className="l-detail l-form" onSubmit={submit} aria-labelledby="expense-form-title">
      <div className="l-field">
        <h2 id="expense-form-title">{kind === "proposal" ? "Đề xuất chi mới" : "Yêu cầu hoàn ứng"}</h2>
        <span className="l-meta">{kind === "proposal" ? "Chi trước khi tiêu" : "Đã tiêu trước"}</span>
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="expense-content">Nội dung chi</label>
        <input ref={titleRef} id="expense-content" className="l-input" value={title} placeholder="Ví dụ: Mua nước cho buổi sinh hoạt"
          onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: undefined })); }}
          aria-invalid={errors.title ? true : undefined} aria-describedby={errors.title ? "expense-content-error" : undefined} />
        {errors.title && <span id="expense-content-error" className="l-error">{errors.title}</span>}
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="expense-amount">Số tiền (₫)</label>
        <input ref={amountRef} id="expense-amount" className="l-input l-amount" inputMode="numeric" value={amount} placeholder="Ví dụ: 150000"
          onChange={(e) => { setAmount(e.target.value); setErrors((x) => ({ ...x, amount: undefined })); }}
          aria-invalid={amountError ? true : undefined} aria-describedby={amountError || parsed ? "expense-amount-hint" : undefined} />
        {amountError ? <span id="expense-amount-hint" className="l-error">{amountError}</span> : parsed ? <span id="expense-amount-hint" className="l-hint">Sẽ ghi: {money(parsed)}</span> : null}
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="expense-budget-item">Thuộc khoản dự trù</label>
        <select id="expense-budget-item" className="l-select" value={budgetItemId} onChange={(e) => setBudgetItemId(e.target.value)}>
          <option value="">Không thuộc khoản nào</option>
          {(budget.data?.items ?? []).map((b) => <option key={b.id} value={b.id}>{b.name} · {remainingText(b.remaining)}</option>)}
        </select>
      </div>
      <div className="l-field"><label className="l-flabel" htmlFor="expense-reason">Lý do (không bắt buộc)</label><textarea id="expense-reason" className="l-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <label className="l-check" htmlFor="expense-has-receipt">
        <input id="expense-has-receipt" type="checkbox" checked={hasReceipt} onChange={(e) => setHasReceipt(e.target.checked)} />
        <span>Đã có chứng từ (hóa đơn, ảnh). Bản demo chưa tải ảnh lên được.</span>
      </label>
      <div className="l-row-actions">
        <button type="button" className="l-btn2" onClick={onCancel}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={create.isPending || undefined}>Gửi</button>
      </div>
    </form>
  );
}
