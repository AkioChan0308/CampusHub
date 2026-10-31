"use client";

// Ban điều hành · Bàn giao nhiệm kỳ (design/screens/BDH-BanGiao.html), thế giới "Lịch bloc". Bản vẽ mới có bước đổi tài khoản nhận quỹ;
// từ 22/10/2026 làm đủ 7 bước theo docs/tien-do-mvp.md, phần B, mục 5.1 (thêm bước "Kiểm tra kho bàn giao").
// Dữ liệu từ GET /clubs/:clubId/handover. Mỗi bước có một API riêng (xem docs/api.md, mục Bàn giao); quay lại bước trước: PUT /handover/step.
// Chủ nhiệm mới (đang là thành viên thường) cũng mở được trang này để xác nhận ở bước 6.

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { HandoverRes, PersonRef } from "@contract";
import { ApiError, apiPost, apiPut } from "@/api/client";
import { budgetRows, ledgerRows, memberRows } from "@/api/excel-rows";
import { budgetQuery, errorText, keys, ledgerQuery, membersQuery, useClubMutation, useHandover } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { AiSummary } from "@/components/lich/Assistant";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { TypedConfirm } from "@/components/lich/TypedConfirm";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { downloadCsv } from "@/lib/csv";
import { dmy, hm, money } from "@/lib/format";
import { HANDOVER_STEPS } from "@/lib/handover-steps";
import { can, RIGHT_LABEL } from "@/lib/selectors";

const TITLE = "Bàn giao nhiệm kỳ";
const STEPS = HANDOVER_STEPS;
const LAST = STEPS.length;
type StepStatus = "done" | "now" | "todo";
const STATUS_TEXT: Record<StepStatus, string> = { done: "xong", now: "đang làm", todo: "chưa làm" };
type RequiredField = "receiverId" | "bank" | "account";
const FIELD_ID: Record<RequiredField, string> = { receiverId: "handover-receiver", bank: "handover-bank", account: "handover-account-number" };
const ADMIN_NOTE = "Chủ nhiệm hiện tại đăng nhập bằng email sinh viên của trường. Email này bị thu hồi khi tốt nghiệp, nên quyền quản trị phải chuyển sang tài khoản của chủ nhiệm mới trước khi bàn giao xong.";
const LEAD = "Thủ quỹ mới không dùng tiếp được tài khoản ngân hàng của thủ quỹ cũ: tài khoản cá nhân gắn với sinh trắc học của chủ tài khoản và không được cho mượn.";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useHandover(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="handover" fallback={<HandoverSkeleton />}>
        <HandoverPage />
      </BoardFrame>
    </LichPage>
  );
}

/** Ba bảng chung một file: tải nhiều file một lần thì trình duyệt hỏi quyền hoặc chặn các file sau. */
function ExportAllButton() {
  const { club } = useLichBoard();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function exportAll() {
    if (busy) return;
    setBusy(true);
    try {
      const [members, ledger, budget] = await Promise.all([client.fetchQuery(membersQuery(club.id)), client.fetchQuery(ledgerQuery(club.id)), client.fetchQuery(budgetQuery(club.id))]);
      downloadCsv(`ban-giao-${club.id}.csv`, [["Thành viên"], ...memberRows(members), [], ["Sổ quỹ"], ...ledgerRows(ledger), [], ["Dự trù"], ...budgetRows(budget)]);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return <button type="button" className="l-btn2" aria-busy={busy || undefined} onClick={exportAll}><Icon name="download" size={18} />Xuất toàn bộ dữ liệu (Excel)</button>;
}

/** Dấu tick của bước đã xong bị ẩn với trình đọc màn hình, nên trạng thái từng bước ghi thêm bằng chữ ẩn. */
function Steps({ step }: { step?: number }) {
  return (
    <ol className="l-sec l-steps" aria-label="Các bước bàn giao">
      {STEPS.map((name, i) => {
        const n = i + 1;
        const status: StepStatus = !step ? "todo" : n < step || step === LAST ? "done" : n === step ? "now" : "todo";
        return (
          <li key={name} className={`l-step ${status}`} aria-current={status === "now" ? "step" : undefined}>
            <span className="l-step-n">{status === "done" ? <Icon name="check" size={16} strokeWidth={2.4} /> : n}</span>
            <span className="l-step-name">{name}</span>
            {step && <span className="l-sr"> ({STATUS_TEXT[status]})</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Side({ data }: { data?: HandoverRes }) {
  const b = data?.newBoard;
  return (
    <aside className="l-detail l-ho-side">
      {(!data || data.step < 5) && (
        <section className="l-field">
          <h2 className="l-subhead">Bước 5: chuyển quyền quản trị</h2>
          <p className="l-fine">{ADMIN_NOTE}</p>
        </section>
      )}
      {b && (
        <section className="l-field">
          <h2 className="l-subhead">Ban mới {data.toTerm}</h2>
          <ul className="l-ho-list">
            <li>Chủ nhiệm: {b.president.name}</li>
            {b.vice && <li>Phó chủ nhiệm: {b.vice.name}</li>}
            {b.treasurer && <li>Thủ quỹ: {b.treasurer.name}</li>}
            {b.heads.length > 0 && <li>Trưởng ban: {b.heads.map((h) => h.name).join(", ")}</li>}
          </ul>
        </section>
      )}
      <section className="l-field">
        <h2 className="l-subhead">Biên bản bàn giao gồm</h2>
        <ul className="l-ho-list">
          <li>Danh sách {data ? data.memberCount : <SkelLine w={24} />} thành viên và vai trò</li>
          <li>Sổ quỹ, số dư chốt {data ? money(data.lockedBalance) : <SkelLine w={90} />} và tài khoản nhận quỹ mới</li>
          <li>Kho bàn giao: biểu mẫu, quy trình, tài khoản</li>
          <li>Các sự kiện và điểm danh của kỳ</li>
          <li>Dự trù và báo cáo {data ? data.fromTerm : <SkelLine w={70} />}</li>
        </ul>
        <p className="l-note">Ban cũ được xem thêm 30 ngày, sau đó thành thành viên cũ.</p>
      </section>
    </aside>
  );
}

/** Khung xương đúng cấu trúc màn: các bước, tiêu đề bước 4, nhãn các ô và cột bên phải là thật; số liệu là thanh trong dòng chữ. */
function HandoverSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={260} />} actions={<Skel w={250} h={40} />} />
      <Loading className="l-sheet">
        {/* Khung xương vẽ theo bước 4 (bước có bản vẽ, cũng là bước của dữ liệu mẫu), nên dải bước cũng theo bước 4. */}
        <Steps step={4} />
        <div className="l-sec l-ho-split">
          <div className="l-detail l-form">
            <div className="l-field"><h2><SkelLine w={240} /></h2><span className="l-meta"><SkelLine w={70} /></span><p className="l-fine"><SkelLine w="96%" /><br /><SkelLine w="62%" /></p></div>
            <div className="l-ho-accounts l-inert">
              <div className="l-ho-old">
                <span className="l-label">Tài khoản đang nhận quỹ</span>
                <span className="l-ho-old-name"><SkelLine w={110} /></span>
                <span className="l-ho-old-bank"><SkelLine w={150} /></span>
                <span className="l-note">Ngừng nhận quỹ khi bàn giao xong. Mã VietQR của các đợt thu sẽ đổi sang tài khoản mới.</span>
              </div>
              <div className="l-form">
                <div className="l-field"><span className="l-flabel">Chủ tài khoản mới</span><select className="l-select" aria-hidden="true" tabIndex={-1}><option>Chọn người</option></select></div>
                <div className="l-ho-bank">
                  <div className="l-field"><span className="l-flabel">Ngân hàng</span><input className="l-input" readOnly aria-hidden="true" tabIndex={-1} placeholder="Chọn ngân hàng" /></div>
                  <div className="l-field"><span className="l-flabel">Số tài khoản</span><input className="l-input" readOnly aria-hidden="true" tabIndex={-1} placeholder="Nhập số tài khoản" /></div>
                </div>
              </div>
            </div>
            <div className="l-ho-transfer l-inert">
              <div className="l-field"><span className="l-label">Số dư cần chuyển sang tài khoản mới (đã chốt ở bước 2)</span><span className="l-money-big"><SkelLine w={190} /></span></div>
              <div className="l-field">
                <span className="l-flabel">Mã giao dịch chuyển số dư (không bắt buộc)</span>
                <div className="l-ho-ref"><input className="l-input" readOnly aria-hidden="true" tabIndex={-1} placeholder="Ví dụ: mã trong biên lai chuyển khoản" /><button type="button" className="l-btn2" disabled aria-hidden="true" tabIndex={-1}><Icon name="upload" size={18} />Ảnh biên lai</button></div>
                <span className="l-note">Che số tài khoản trong ảnh trước khi tải lên. Bản demo chưa tải ảnh lên được.</span>
              </div>
            </div>
            <div className="l-row-actions"><Skel w={140} h={40} /><Skel w={170} h={40} /></div>
          </div>
          <Side />
        </div>
      </Loading>
    </>
  );
}

function HandoverPage() {
  const { club } = useLichBoard();
  const query = useHandover(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <HandoverSkeleton />;
  if (query.isError) {
    // CLB chưa bắt đầu bàn giao: máy chủ trả 404. Vẫn xuất được dữ liệu bất cứ lúc nào.
    if (query.error instanceof ApiError && query.error.status === 404) return <PageTop title={TITLE} sub="CLB chưa bắt đầu bàn giao." actions={<ExportAllButton />} />;
    return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  }
  return <HandoverBody data={query.data} fade={sawHere || sawFrame} />;
}

function HandoverBody({ data, fade }: { data: HandoverRes; fade: boolean }) {
  const { me } = useLichBoard();
  // Chỉ chủ nhiệm hiện tại làm các bước 1–5; xuất dữ liệu cần quyền ban điều hành (chủ nhiệm mới chưa có).
  const canDo = can(me.role, "handover") && !data.acceptedAt;
  // Đổi bước thì đưa focus tới tiêu đề của bước mới; lúc mới mở trang thì không.
  const shownStep = useRef(data.step);
  useEffect(() => {
    if (shownStep.current === data.step) return;
    shownStep.current = data.step;
    document.getElementById("handover-steps")?.focus();
  }, [data.step]);

  return (
    <>
      <PageTop title={TITLE} sub={`Từ ban ${data.fromTerm} sang ban ${data.toTerm}`} actions={me.role === "member" ? undefined : <ExportAllButton />} />
      <Reveal from={fade} className="l-sheet">
        <Steps step={data.step} />
        <div className="l-sec l-ho-split">
          <StepBody data={data} canDo={canDo} />
          <Side data={data} />
        </div>
      </Reveal>
    </>
  );
}

function StepBody({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  switch (data.step) {
    case 1: return <BoardStep data={data} canDo={canDo} />;
    case 2: return <BalanceStep data={data} canDo={canDo} />;
    case 3: return <KitStep data={data} canDo={canDo} />;
    case 4: return <AccountStepForm data={data} canDo={canDo} />;
    case 5: return <TransferStep data={data} canDo={canDo} />;
    case 6: return <AcceptStep data={data} canDo={canDo} />;
    default: return <RecordStep data={data} />;
  }
}

/** Gửi một thao tác của bàn giao. Xong thì làm mới cả CLB; lỗi thì hiện câu của máy chủ bằng thông báo ngắn. */
function useHandoverCall(onDone?: (r: HandoverRes) => void, onError?: (e: unknown) => void) {
  const { club } = useLichBoard();
  return useClubMutation(club.id, (c: { method: "POST" | "PUT"; path: string; body?: unknown }) =>
    (c.method === "PUT" ? apiPut<HandoverRes> : apiPost<HandoverRes>)(`/clubs/${club.id}/handover${c.path}`, c.body), { onSuccess: onDone, onError });
}

/** Khung của một bước: tiêu đề (nhận focus khi sang bước), "Bước n / 7", câu dẫn, phần thân, các nút. */
function StepShell({ step, title, lead, children, actions, onSubmit }: { step: number; title: string; lead?: ReactNode; children?: ReactNode; actions?: ReactNode; onSubmit?: (e: FormEvent) => void }) {
  const head = (
    <div className="l-field">
      <h2 id="handover-steps" tabIndex={-1}>{title}</h2>
      <span className="l-meta">Bước {step} / {LAST}</span>
      {lead && <p className="l-fine">{lead}</p>}
    </div>
  );
  const rest = <>{children}{actions && <div className="l-row-actions">{actions}</div>}</>;
  return onSubmit
    ? <form className="l-detail l-form" onSubmit={onSubmit} aria-labelledby="handover-steps" noValidate>{head}{rest}</form>
    : <section className="l-detail l-form" aria-labelledby="handover-steps">{head}{rest}</section>;
}

/** Nút "Quay lại bước n": hỏi lại, vì làm lại bước đó rồi mới sang tiếp được. */
function BackButton({ step, canDo }: { step: number; canDo: boolean }) {
  const back = useHandoverCall();
  const to = step - 1;
  return (
    <LichConfirm className="l-btn2" disabled={!canDo} describedBy={canDo ? undefined : "handover-permission"} busy={back.isPending} confirm={`Quay lại bước ${to}`}
      title={`Quay lại bước ${to}?`} description={`Làm lại bước ${to} (${STEPS[to - 1].toLowerCase()}) rồi mới sang tiếp được. Các bước sau chưa mất; biên bản ghi lại việc quay lại.`}
      onConfirm={() => back.mutate({ method: "PUT", path: "/step", body: { step: to } })}>Quay lại bước {to}</LichConfirm>
  );
}

const PermissionNote = ({ canDo, accepted }: { canDo: boolean; accepted: boolean }) => !canDo && (
  <p className="l-note" id="handover-permission">{accepted ? "Ban mới đã xác nhận nên biên bản không sửa được nữa." : RIGHT_LABEL.handover}</p>
);

// ---------- Bước 1: chọn ban mới ----------

function BoardStep({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const b = data.newBoard;
  const [f, setF] = useState({ president: b?.president.personId ?? "", vice: b?.vice?.personId ?? "", treasurer: b?.treasurer?.personId ?? "", heads: b?.heads.map((h) => h.personId) ?? ([] as string[]), self: false });
  const [error, setError] = useState("");
  const save = useHandoverCall((r) => toast.success(`Đã chọn ban mới. Bàn giao sang bước ${r.step}.`), (err) => setError(errorText(err)));
  const sitting = data.currentPresident?.personId;
  const pickingSelf = !!f.president && f.president === sitting;
  const options = (exclude: string[]) => data.candidates.filter((p) => !exclude.includes(p.personId) || false).map((p) => <option key={p.personId} value={p.personId}>{p.name}</option>);
  const toggleHead = (id: string) => { setError(""); setF((x) => ({ ...x, heads: x.heads.includes(id) ? x.heads.filter((h) => h !== id) : [...x.heads, id] })); };
  const set = (patch: Partial<typeof f>) => { setError(""); setF((x) => ({ ...x, ...patch })); };

  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    if (!f.president) { setError("Cần chọn chủ nhiệm mới."); document.getElementById("handover-president")?.focus(); return; }
    const ids = [f.president, f.vice, f.treasurer, ...f.heads].filter(Boolean);
    if (new Set(ids).size !== ids.length) { setError("Mỗi người chỉ giữ một vai trong ban mới."); return; }
    if (pickingSelf && !f.self) { setError("Bạn đang chọn lại chính mình làm chủ nhiệm. Tích ô xác nhận bên dưới nếu đúng như vậy."); document.getElementById("handover-self")?.focus(); return; }
    setError("");
    save.mutate({ method: "PUT", path: "/board", body: { presidentId: f.president, ...(f.vice ? { viceId: f.vice } : {}), ...(f.treasurer ? { treasurerId: f.treasurer } : {}), headIds: f.heads, ...(pickingSelf ? { confirmSelf: true } : {}) } });
  }

  return (
    <StepShell step={1} title="Chọn ban mới" onSubmit={submit}
      lead={`Từ ban ${data.fromTerm} sang ban ${data.toTerm}. Chỉ chọn được thành viên đã nhận lời mời, mỗi người một vai.`}
      actions={<button type="submit" className="l-btn" disabled={!canDo} aria-describedby={canDo ? undefined : "handover-permission"} aria-busy={save.isPending || undefined}>Lưu và sang bước 2</button>}>
      <div className="l-form-grid">
        <div className="l-field">
          <label className="l-flabel" htmlFor="handover-president">Chủ nhiệm mới</label>
          <select id="handover-president" className="l-select" value={f.president} onChange={(e) => set({ president: e.target.value, self: false })} disabled={!canDo} aria-required="true">
            <option value="">Chọn người</option>{options([])}
          </select>
        </div>
        <div className="l-field">
          <label className="l-flabel" htmlFor="handover-vice">Phó chủ nhiệm (không bắt buộc)</label>
          <select id="handover-vice" className="l-select" value={f.vice} onChange={(e) => set({ vice: e.target.value })} disabled={!canDo}><option value="">Chưa chọn</option>{options([])}</select>
        </div>
        <div className="l-field">
          <label className="l-flabel" htmlFor="handover-treasurer">Thủ quỹ (không bắt buộc)</label>
          <select id="handover-treasurer" className="l-select" value={f.treasurer} onChange={(e) => set({ treasurer: e.target.value })} disabled={!canDo}><option value="">Chưa chọn</option>{options([])}</select>
        </div>
      </div>
      <fieldset className="l-field">
        <legend className="l-flabel">Trưởng ban (không bắt buộc)</legend>
        <div className="l-seg">{data.candidates.map((p: PersonRef) => <button key={p.personId} type="button" className="l-chip" aria-pressed={f.heads.includes(p.personId)} disabled={!canDo} onClick={() => toggleHead(p.personId)}>{p.name}</button>)}</div>
      </fieldset>
      {pickingSelf && (
        <label className="l-check"><input id="handover-self" type="checkbox" checked={f.self} onChange={(e) => set({ self: e.target.checked })} disabled={!canDo} /> Tôi là chủ nhiệm hiện tại và chọn lại chính mình cho nhiệm kỳ mới</label>
      )}
      {error && <p className="l-alert" role="alert">{error}</p>}
      <PermissionNote canDo={canDo} accepted={!!data.acceptedAt} />
    </StepShell>
  );
}

// ---------- Bước 2: chốt số dư ----------

function BalanceStep({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const lock = useHandoverCall((r) => toast.success(`Đã chốt số dư ${money(r.lockedBalance)}. Bàn giao sang bước ${r.step}.`));
  const o = data.open;
  const rows: [string, string][] = [
    ["Thành viên chưa đóng quỹ", o.unpaid > 0 ? `${o.unpaid} người` : "không có"],
    ["Thành viên đã báo chuyển khoản, chờ thủ quỹ xác nhận", o.reported > 0 ? `${o.reported} người` : "không có"],
    ["Khoản chi chờ duyệt", o.pendingExpenses > 0 ? `${o.pendingExpenses} khoản · ${money(o.pendingExpenseTotal)}` : "không có"],
    ["Giao dịch sao kê chưa khớp", o.openManual > 0 ? `${o.openManual} giao dịch` : "không có"],
  ];
  return (
    <StepShell step={2} title="Chốt số dư" lead="Số dư lấy từ sổ quỹ lúc bạn bấm chốt. Sau khi chốt, số dư khóa; muốn đổi thì quay lại bước này và chốt lại. Sổ quỹ không bị sửa, chỉ thêm bút toán."
      actions={<>
        <BackButton step={2} canDo={canDo} />
        <button type="button" className="l-btn" disabled={!canDo} aria-describedby={canDo ? undefined : "handover-permission"} aria-busy={lock.isPending || undefined} onClick={() => { if (!lock.isPending) lock.mutate({ method: "POST", path: "/lock-balance" }); }}>Chốt số dư</button>
      </>}>
      <div className="l-field">
        <span className="l-label">Số dư sổ quỹ hiện tại</span>
        <span className="l-money-big">{money(data.currentBalance)}</span>
      </div>
      <div className="l-field">
        <h3 className="l-subhead">Việc còn dở lúc chốt</h3>
        <ul className="l-ho-list">{rows.map(([label, value]) => <li key={label}>{label}: <strong>{value}</strong></li>)}</ul>
        <p className="l-note">Các khoản này không chặn việc chốt. Ban mới sẽ thấy chúng còn dở.</p>
      </div>
      <PermissionNote canDo={canDo} accepted={!!data.acceptedAt} />
    </StepShell>
  );
}

// ---------- Bước 3: kiểm tra kho bàn giao ----------

function KitStep({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const { club } = useLichBoard();
  const next = useHandoverCall(() => toast.success("Đã kiểm tra kho bàn giao. Bàn giao sang bước 4."));
  const k = data.kit;
  return (
    <StepShell step={3} title="Kiểm tra kho bàn giao" lead="Kho bàn giao giữ những thứ ban cũ hay mang đi: biểu mẫu, cách làm từng việc, tài khoản của CLB. Thiếu thì không chặn bàn giao, chỉ cảnh báo."
      actions={<>
        <BackButton step={3} canDo={canDo} />
        <Link className="l-btn2" href={`/clubs/${club.id}/handover-kit`}>Mở kho bàn giao</Link>
        <button type="button" className="l-btn" disabled={!canDo} aria-describedby={canDo ? undefined : "handover-permission"} aria-busy={next.isPending || undefined} onClick={() => { if (!next.isPending) next.mutate({ method: "POST", path: "/kit-review" }); }}>Tiếp tục</button>
      </>}>
      <ul className="l-ho-list">
        <li><strong>{k.documents}</strong> biểu mẫu</li>
        <li><strong>{k.processes}</strong> quy trình</li>
        <li><strong>{k.accounts}</strong> tài khoản, trong đó {k.personal} đứng tên cá nhân (nên chuyển sang tài khoản CLB)</li>
      </ul>
      <p className={k.missing > 0 ? "l-attn" : "l-note"} role="status">
        {k.missing > 0 ? `${k.missing} mục còn thiếu: tài khoản bắt buộc chuyển khi bàn giao mà chưa ghi người giữ.` : "Không thiếu mục nào."}
      </p>
      <p className={data.open.openTasks > 0 ? "l-fine" : "l-note"}>
        {data.open.openTasks > 0 ? <>Còn <strong>{data.open.openTasks}</strong> việc chưa xong. <Link href={`/clubs/${club.id}/tasks`} className="l-linkbtn">Xem việc còn dở</Link></> : "Không còn việc dở."}
      </p>
      <PermissionNote canDo={canDo} accepted={!!data.acceptedAt} />
    </StepShell>
  );
}

// ---------- Bước 4: đổi tài khoản nhận quỹ ----------

function AccountStepForm({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const [draft, setDraft] = useState({ receiverId: data.newReceiver?.personId ?? "", bank: data.newReceiver?.bank ?? "", account: "", ref: data.transferRef ?? "" });
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const [serverError, setServerError] = useState("");
  const save = useHandoverCall(() => toast.success("Đã lưu tài khoản nhận quỹ mới. Bàn giao sang bước 5."), (err) => setServerError(errorText(err)));
  const edit = (patch: Partial<typeof draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setServerError("");
    setErrors((x) => Object.fromEntries(Object.entries(x).filter(([key]) => !(key in patch))));
  };
  // Ô bắt buộc: báo lỗi ngay dưới ô và nối với ô bằng aria-describedby.
  const required = (field: RequiredField) => ({
    id: FIELD_ID[field], "aria-required": true, "aria-invalid": errors[field] ? true : undefined, "aria-describedby": errors[field] ? `${FIELD_ID[field]}-error` : undefined,
  });
  const fieldError = (field: RequiredField) => errors[field] && <span id={`${FIELD_ID[field]}-error`} className="l-error">{errors[field]}</span>;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const bank = draft.bank.trim();
    const account = draft.account.trim();
    const next: Partial<Record<RequiredField, string>> = {};
    if (!draft.receiverId) next.receiverId = "Cần chọn chủ tài khoản mới.";
    if (!bank) next.bank = "Cần ghi ngân hàng.";
    if (!account) next.account = "Cần ghi số tài khoản.";
    setErrors(next);
    const first = (Object.keys(FIELD_ID) as RequiredField[]).find((field) => next[field]);
    if (first) { document.getElementById(FIELD_ID[first])?.focus(); return; }
    save.mutate({ method: "PUT", path: "/receiver", body: { personId: draft.receiverId, bank, account, transferRef: draft.ref.trim() || undefined } });
  }

  const old = data.currentReceiver;
  return (
    <StepShell step={4} title="Đổi tài khoản nhận quỹ" lead={LEAD} onSubmit={submit}
      actions={<>
        <BackButton step={4} canDo={canDo} />
        <button type="submit" className="l-btn" disabled={!canDo} aria-describedby={canDo ? undefined : "handover-permission"} aria-busy={save.isPending || undefined}>Lưu và sang bước 5</button>
      </>}>
      <div className="l-ho-accounts">
        <div className="l-ho-old">
          <span className="l-label">Tài khoản đang nhận quỹ</span>
          <span className="l-ho-old-name">{old?.name ?? "Chưa có"}</span>
          {old && <span className="l-ho-old-bank">{old.bankLabel} · •••• {old.last4}</span>}
          <span className="l-note">Ngừng nhận quỹ khi bàn giao xong. Mã VietQR của các đợt thu sẽ đổi sang tài khoản mới.</span>
        </div>
        <div className="l-form">
          <div className="l-field">
            <label className="l-flabel" htmlFor="handover-receiver">Chủ tài khoản mới</label>
            <select {...required("receiverId")} className="l-select" value={draft.receiverId} onChange={(e) => edit({ receiverId: e.target.value })} disabled={!canDo}>
              <option value="">Chọn người</option>
              {data.candidates.map((p) => <option key={p.personId} value={p.personId}>{p.name}{p.personId === data.newBoard?.treasurer?.personId ? ` (thủ quỹ ${data.toTerm})` : ""}</option>)}
            </select>
            {fieldError("receiverId")}
          </div>
          <div className="l-ho-bank">
            <div className="l-field">
              <label className="l-flabel" htmlFor="handover-bank">Ngân hàng</label>
              <input {...required("bank")} className="l-input" value={draft.bank} onChange={(e) => edit({ bank: e.target.value })} placeholder="Chọn ngân hàng" disabled={!canDo} />
              {fieldError("bank")}
            </div>
            <div className="l-field">
              <label className="l-flabel" htmlFor="handover-account-number">Số tài khoản</label>
              <input {...required("account")} className="l-input" inputMode="numeric" value={draft.account} onChange={(e) => edit({ account: e.target.value })} placeholder="Nhập số tài khoản" disabled={!canDo} />
              {fieldError("account")}
            </div>
          </div>
        </div>
      </div>
      <div className="l-ho-transfer">
        <div className="l-field">
          <span className="l-label">Số dư cần chuyển sang tài khoản mới (đã chốt ở bước 2)</span>
          <span className="l-money-big">{money(data.lockedBalance)}</span>
          {data.currentBalance !== data.lockedBalance && <span className="l-ho-drift">Sổ quỹ đã đổi sau khi chốt: số dư hiện tại là {money(data.currentBalance)}.</span>}
        </div>
        <div className="l-field">
          <label className="l-flabel" htmlFor="handover-transfer-ref">Mã giao dịch chuyển số dư (không bắt buộc)</label>
          <div className="l-ho-ref">
            <input id="handover-transfer-ref" className="l-input" value={draft.ref} onChange={(e) => edit({ ref: e.target.value })} placeholder="Ví dụ: mã trong biên lai chuyển khoản" disabled={!canDo} />
            <button type="button" className="l-btn2" disabled aria-describedby="handover-receipt-note"><Icon name="upload" size={18} />Ảnh biên lai</button>
          </div>
          <span id="handover-receipt-note" className="l-note">Che số tài khoản trong ảnh trước khi tải lên. Bản demo chưa tải ảnh lên được.</span>
        </div>
      </div>
      {serverError && <p className="l-alert" role="alert">{serverError}</p>}
      <PermissionNote canDo={canDo} accepted={!!data.acceptedAt} />
    </StepShell>
  );
}

// ---------- Bước 5: chuyển quyền quản trị ----------

function TransferStep({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const president = data.newBoard?.president.personId ?? "";
  const [holder, setHolder] = useState<Record<string, string>>({});
  const transfer = useHandoverCall((r) => { if (r.step === 5) toast.success("Đã ghi chuyển quyền quản trị."); });
  const done = useHandoverCall(() => toast.success("Đã chuyển xong các tài khoản bắt buộc. Bàn giao sang bước 6."));
  const left = data.accounts.filter((a) => a.required && !a.transferred);
  return (
    <StepShell step={5} title="Chuyển quyền quản trị" lead={ADMIN_NOTE}
      actions={<>
        <BackButton step={5} canDo={canDo} />
        <button type="button" className="l-btn" disabled={!canDo || left.length > 0} aria-describedby={left.length > 0 ? "handover-transfer-left" : canDo ? undefined : "handover-permission"} aria-busy={done.isPending || undefined}
          onClick={() => { if (!done.isPending) done.mutate({ method: "POST", path: "/transfer-done" }); }}>Tiếp tục</button>
      </>}>
      <p className="l-note">CampusHub không lưu mật khẩu. Đổi quyền quản trị ở chính dịch vụ đó, rồi bấm "Ghi đã chuyển" để ghi lại.</p>
      <div className="l-table-wrap">
        <table className="l-table">
          <thead><tr><th>Tài khoản</th><th>Người giữ hiện tại</th><th>Người nhận mới</th><th className="r">Trạng thái</th></tr></thead>
          <tbody>
            {data.accounts.length === 0 && <tr><td colSpan={4} className="l-empty-cell">Kho chưa có tài khoản nào.</td></tr>}
            {data.accounts.map((a) => {
              const to = holder[a.id] ?? president;
              const busy = transfer.isPending && transfer.variables?.path === `/accounts/${a.id}/transfer`;
              return (
                <tr key={a.id}>
                  <td><strong>{a.service}</strong><br /><span className="l-note">{a.label}</span>{a.required && <><br /><span className="l-tag wait">Bắt buộc</span></>}</td>
                  <td>{a.holder?.name ?? <span className="l-tag warn">Chưa có người giữ</span>}</td>
                  <td>
                    <select className="l-select" aria-label={`Người nhận mới của ${a.service}`} value={to} disabled={!canDo || a.transferred} onChange={(e) => setHolder((h) => ({ ...h, [a.id]: e.target.value }))}>
                      {data.candidates.map((p) => <option key={p.personId} value={p.personId}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="r">
                    {a.transferred ? <span className="l-tag ok"><Icon name="check" size={14} strokeWidth={2.4} />Đã chuyển</span>
                      : <button type="button" className="l-btn2 l-sm" disabled={!canDo || !to} aria-label={`Ghi đã chuyển ${a.service}`} aria-busy={busy || undefined}
                        onClick={() => { if (!busy) transfer.mutate({ method: "POST", path: `/accounts/${a.id}/transfer`, body: { holderId: to } }); }}>Ghi đã chuyển</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {left.length > 0 && <p id="handover-transfer-left" className="l-attn" role="status">Còn {left.length} tài khoản bắt buộc chưa chuyển: {left.map((a) => a.service).join(", ")}.</p>}
      <PermissionNote canDo={canDo} accepted={!!data.acceptedAt} />
    </StepShell>
  );
}

// ---------- Bước 6: ban mới xác nhận ----------

/** Bản tóm tắt cho ban mới đã được lưu vào biên bản: ai lưu, lúc nào; bản mẫu thì ghi rõ chưa dùng AI thật. */
function SavedSummary({ data }: { data: HandoverRes }) {
  const sm = data.summary;
  if (!sm) return null;
  return (
    <div className="l-field">
      <h3 className="l-subhead">Bản tóm tắt cho ban mới</h3>
      <p className="l-ai-text">{sm.text}</p>
      <p className="l-note">Lưu bởi {sm.by.name}, {hm(sm.at)} {dmy(sm.at)}{sm.mock ? " · Bản mẫu, chưa dùng AI thật" : ""}.</p>
    </div>
  );
}

function AcceptStep({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const { club } = useLichBoard();
  const client = useQueryClient();
  const accept = useHandoverCall(() => {
    void client.invalidateQueries({ queryKey: keys.me }); // vai mới và thông báo "Cần bạn xác nhận" cập nhật ngay
    toast.success("Đã xác nhận nhận bàn giao.");
  });
  const president = data.newBoard?.president;
  const moved = data.accounts.filter((a) => a.transferred).length;
  // Hậu quả của việc đổi vai (xem acceptHandover ở lib/actions.ts), nêu rõ cho người bấm.
  const b = data.newBoard;
  const roleChanges = [
    b && `Vai mới: ${[`chủ nhiệm ${b.president.name}`, b.vice && `phó chủ nhiệm ${b.vice.name}`, b.treasurer && `thủ quỹ ${b.treasurer.name}`, b.heads.length > 0 && `trưởng ban ${b.heads.map((h) => h.name).join(", ")}`].filter(Boolean).join("; ")}.`,
    `${data.currentPresident ? `Chủ nhiệm hiện tại ${data.currentPresident.name} và mọi` : "Mọi"} người đang trong ban điều hành mà không có tên trong ban mới sẽ về thành viên thường, mất quyền ban điều hành.`,
  ].filter((x): x is string => !!x);
  return (
    <StepShell step={6} title="Ban mới xác nhận" lead={`Chủ nhiệm mới${president ? ` (${president.name})` : ""} xem lại bản tóm tắt rồi xác nhận đã nhận bàn giao. Chỉ người này bấm được.`}
      actions={<>
        {canDo && <BackButton step={6} canDo={canDo} />}
        {!data.canAccept && <span className="l-note" id="handover-accept-note">Chờ {president?.name ?? "chủ nhiệm mới"} xác nhận. Chỉ người này bấm được.</span>}
      </>}>
      <ul className="l-ho-list">
        <li>Số dư đã chốt: <strong>{money(data.lockedBalance)}</strong>{data.lockedAt ? ` (${dmy(data.lockedAt)})` : ""}</li>
        {data.newReceiver && <li>Tài khoản nhận quỹ mới: <strong>{data.newReceiver.name}</strong> · {data.newReceiver.bank} · •••• {data.newReceiver.accountLast4}</li>}
        <li>Kho bàn giao: {data.kit.documents} biểu mẫu, {data.kit.processes} quy trình, {data.kit.accounts} tài khoản{data.kit.missing > 0 ? `, ${data.kit.missing} mục thiếu` : ""}</li>
        <li>Quyền quản trị đã chuyển: {moved} / {data.accounts.length} tài khoản</li>
        <li>Việc còn dở: {data.open.openTasks} việc · khoản chi chờ duyệt: {data.open.pendingExpenses}</li>
      </ul>
      <SavedSummary data={data} />
      {canDo && <AiSummary clubId={club.id} canSave />}
      {data.canAccept && (
        <section className="l-danger" aria-labelledby="handover-danger">
          <h3 id="handover-danger">Vùng nguy hiểm: đổi ban điều hành</h3>
          <p>Xác nhận nhận bàn giao sẽ <strong>đổi vai trò của cả ban ngay lập tức</strong> và không hoàn tác được.</p>
          <ul>
            {roleChanges.map((line) => <li key={line}>{line}</li>)}
            <li>Biên bản bàn giao khóa lại, không sửa được nữa.</li>
          </ul>
          <TypedConfirm className="l-btn-ghost-warn" busy={accept.isPending} title="Đổi ban điều hành và xác nhận nhận bàn giao?" phrase="BAN GIAO" confirm="Đổi ban và xác nhận"
            body={<><p>Bạn sắp làm những việc sau, không hoàn tác được:</p><ul>{roleChanges.map((line) => <li key={line}>{line}</li>)}<li>Biên bản bàn giao khóa lại.</li></ul></>}
            onConfirm={() => accept.mutate({ method: "POST", path: "/accept" })}>Xác nhận đã nhận bàn giao</TypedConfirm>
        </section>
      )}
      {!canDo && !data.canAccept && <p className="l-note" id="handover-permission">{RIGHT_LABEL.handover}</p>}
    </StepShell>
  );
}

// ---------- Bước 7: biên bản ----------

function RecordStep({ data }: { data: HandoverRes }) {
  const { club } = useLichBoard();
  const b = data.newBoard;
  // Sau khi ban mới xác nhận, chủ nhiệm hiện tại đã là người mới; chủ nhiệm cũ là người chọn ban mới ở bước 1 (dòng đầu của biên bản).
  const oldChair = data.acceptedAt ? data.history[0]?.by : data.currentPresident;
  const lines: [string, string][] = [
    ["CLB", club.name],
    ["Nhiệm kỳ", `Từ ban ${data.fromTerm} sang ban ${data.toTerm}`],
    ["Chủ nhiệm cũ", oldChair?.name ?? "Không rõ"],
    ["Ban mới", b ? [`Chủ nhiệm ${b.president.name}`, b.vice && `phó chủ nhiệm ${b.vice.name}`, b.treasurer && `thủ quỹ ${b.treasurer.name}`, b.heads.length && `trưởng ban ${b.heads.map((h) => h.name).join(", ")}`].filter(Boolean).join("; ") : "Chưa chọn"],
    ["Số dư đã chốt", money(data.lockedBalance)],
    ["Tài khoản nhận quỹ mới", data.newReceiver ? `${data.newReceiver.name} · ${data.newReceiver.bank} · •••• ${data.newReceiver.accountLast4}` : "Chưa có"],
    ["Mentor", data.mentorConfirmed ? `${data.mentorConfirmed.by.name} (mentor) đã xác nhận, ${hm(data.mentorConfirmed.at)} ${dmy(data.mentorConfirmed.at)}` : data.mentor ? `${data.mentor} · chưa xác nhận trên CampusHub` : "CLB chưa có mentor"],
    ["Ban mới xác nhận", data.acceptedAt && data.acceptedBy ? `${data.acceptedBy.name}, ${hm(data.acceptedAt)} ${dmy(data.acceptedAt)}` : "Chưa xác nhận"],
  ];
  const exportRecord = () => downloadCsv(`bien-ban-ban-giao-${club.id}.csv`, [["Biên bản bàn giao"], ...lines.map(([k, v]) => [k, v]), [], ["Thời điểm", "Người làm", "Việc đã làm"], ...data.history.map((h) => [`${hm(h.at)} ${dmy(h.at)}`, h.by.name, h.text])]);
  return (
    <section className="l-detail l-form" aria-labelledby="handover-steps">
      <div className="l-field">
        <h2 id="handover-steps" tabIndex={-1}>Biên bản bàn giao</h2>
        <span className="l-meta">Bước {LAST} / {LAST}</span>
        <p className="l-fine">Biên bản chỉ đọc. Ban mới đã xác nhận nên không sửa được nữa.</p>
      </div>
      <dl className="l-ho-record">
        {lines.map(([k, v]) => <div key={k} className="l-kv"><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <SavedSummary data={data} />
      <div className="l-field">
        <h3 className="l-subhead">Các bước đã làm</h3>
        <ol className="l-ho-log" aria-label="Các bước đã làm">
          {data.history.map((h, i) => <li key={i}><span className="l-note">{hm(h.at)} {dmy(h.at)} · {h.by.name}</span><span>{h.text}</span></li>)}
        </ol>
      </div>
      <div className="l-row-actions">
        <button type="button" className="l-btn2" onClick={() => window.print()}>In biên bản</button>
        <button type="button" className="l-btn" onClick={exportRecord}><Icon name="download" size={18} />Xuất biên bản</button>
      </div>
    </section>
  );
}
