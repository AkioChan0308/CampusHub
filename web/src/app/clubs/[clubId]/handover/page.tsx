"use client";

// Ban điều hành · Bàn giao nhiệm kỳ (design/screens/BDH-BanGiao.html), thế giới "Lịch bloc". Bản vẽ mới có bước 3.
// Dữ liệu từ GET /clubs/:clubId/handover. Bước 3 lưu tài khoản nhận quỹ mới: PUT /handover/receiver (xong thì sang bước 4).
// Quay lại bước trước: PUT /handover/step. Máy chủ chỉ cho quay lại; đi tiếp làm bằng thao tác của từng bước.

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { HandoverRes } from "@contract";
import { ApiError, apiPut } from "@/api/client";
import { budgetRows, ledgerRows, memberRows } from "@/api/exports";
import { budgetQuery, errorText, ledgerQuery, membersQuery, useClubMutation, useHandover } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate, useDemoMode } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { downloadCsv } from "@/lib/csv";
import { money } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";

const TITLE = "Bàn giao nhiệm kỳ";
const STEPS = ["Chọn ban mới", "Chốt số dư", "Đổi tài khoản nhận quỹ", "Chuyển quyền quản trị", "Ban mới xác nhận", "Biên bản bàn giao"];
type StepStatus = "done" | "now" | "todo";
const STATUS_TEXT: Record<StepStatus, string> = { done: "xong", now: "đang làm", todo: "chưa làm" };
type RequiredField = "receiverId" | "bank" | "account";
const FIELD_ID: Record<RequiredField, string> = { receiverId: "chu-tk", bank: "ngan-hang", account: "so-tk" };
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
        const status: StepStatus = !step ? "todo" : n < step ? "done" : n === step ? "now" : "todo";
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
  return (
    <aside className="l-detail l-ho-side">
      {(!data || data.step < 4) && (
        <section className="l-field">
          <h2 className="l-subhead">Bước 4: chuyển quyền quản trị</h2>
          <p className="l-fine">{ADMIN_NOTE}</p>
        </section>
      )}
      <section className="l-field">
        <h2 className="l-subhead">Biên bản bàn giao gồm</h2>
        <ul className="l-ho-list">
          <li>Danh sách {data ? data.memberCount : <SkelLine w={24} />} thành viên và vai trò</li>
          <li>Sổ quỹ, số dư chốt {data ? money(data.lockedBalance) : <SkelLine w={90} />} và tài khoản nhận quỹ mới</li>
          <li>Các sự kiện và điểm danh của kỳ</li>
          <li>Dự trù và báo cáo {data ? data.fromTerm : <SkelLine w={70} />}</li>
        </ul>
        <p className="l-note">Ban cũ được xem thêm 30 ngày, sau đó thành thành viên cũ.</p>
      </section>
    </aside>
  );
}

/** Khung xương đúng cấu trúc màn: các bước, tiêu đề bước 3, nhãn các ô và cột bên phải là thật; số liệu là thanh trong dòng chữ. */
function HandoverSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={260} />} actions={<Skel w={250} h={40} />} />
      <Loading className="l-sheet">
        {/* Khung xương vẽ theo bước 3 (bước có bản vẽ, cũng là bước của dữ liệu mẫu), nên dải bước cũng theo bước 3. */}
        <Steps step={3} />
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
  const canDo = can(me.role, "handover");
  // Đổi bước thì đưa focus tới tiêu đề của bước mới; lúc mới mở trang thì không.
  const shownStep = useRef(data.step);
  useEffect(() => {
    if (shownStep.current === data.step) return;
    shownStep.current = data.step;
    document.getElementById("ho-buoc")?.focus();
  }, [data.step]);

  return (
    <>
      <PageTop title={TITLE} sub={`Từ ban ${data.fromTerm} sang ban ${data.toTerm}`} actions={<ExportAllButton />} />
      <Reveal from={fade} className="l-sheet">
        <Steps step={data.step} />
        <div className="l-sec l-ho-split">
          {data.step === 3 ? <AccountStepForm data={data} canDo={canDo} /> : <StepNotBuilt data={data} canDo={canDo} />}
          <Side data={data} />
        </div>
      </Reveal>
    </>
  );
}

function AccountStepForm({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const { club } = useLichBoard();
  const demo = useDemoMode();
  const [draft, setDraft] = useState({ receiverId: data.newReceiver?.personId ?? "", bank: data.newReceiver?.bank ?? "", account: "", ref: data.transferRef ?? "" });
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const [serverError, setServerError] = useState("");
  const save = useClubMutation(club.id, (body: { personId: string; bank: string; account: string; transferRef?: string }) => apiPut<HandoverRes>(`/clubs/${club.id}/handover/receiver`, body), {
    onSuccess: () => toast.success("Đã lưu tài khoản nhận quỹ mới. Bàn giao sang bước 4."),
    onError: (e) => setServerError(errorText(e)),
  });
  const back = useClubMutation(club.id, (step: number) => apiPut<HandoverRes>(`/clubs/${club.id}/handover/step`, { step }));
  const edit = (patch: Partial<typeof draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setServerError("");
    setErrors((x) => Object.fromEntries(Object.entries(x).filter(([key]) => !(key in patch))));
  };
  // Ô bắt buộc: báo lỗi ngay dưới ô và nối với ô bằng aria-describedby.
  const required = (field: RequiredField) => ({
    id: FIELD_ID[field], "aria-required": true, "aria-invalid": errors[field] ? true : undefined, "aria-describedby": errors[field] ? `${FIELD_ID[field]}-loi` : undefined,
  });
  const fieldError = (field: RequiredField) => errors[field] && <span id={`${FIELD_ID[field]}-loi`} className="l-error">{errors[field]}</span>;

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
    save.mutate({ personId: draft.receiverId, bank, account, transferRef: draft.ref.trim() || undefined });
  }

  const old = data.currentReceiver;
  return (
    <form className="l-detail l-form" onSubmit={submit} aria-labelledby="ho-buoc">
      <div className="l-field">
        <h2 id="ho-buoc" tabIndex={-1}>Đổi tài khoản nhận quỹ</h2>
        <span className="l-meta">Bước 3 / 6</span>
        <p className="l-fine">{LEAD}</p>
      </div>
      <div className="l-ho-accounts">
        <div className="l-ho-old">
          <span className="l-label">Tài khoản đang nhận quỹ</span>
          <span className="l-ho-old-name">{old?.name ?? "Chưa có"}</span>
          {old && <span className="l-ho-old-bank">{old.bankLabel} · •••• {old.last4}</span>}
          <span className="l-note">Ngừng nhận quỹ khi bàn giao xong. Mã VietQR của các đợt thu sẽ đổi sang tài khoản mới.</span>
        </div>
        <div className="l-form">
          <div className="l-field">
            <label className="l-flabel" htmlFor="chu-tk">Chủ tài khoản mới</label>
            <select {...required("receiverId")} className="l-select" value={draft.receiverId} onChange={(e) => edit({ receiverId: e.target.value })} disabled={!canDo}>
              <option value="">Chọn người</option>
              {data.candidates.map((p) => <option key={p.personId} value={p.personId}>{p.name}{p.personId === data.newReceiver?.personId ? ` (thủ quỹ ${data.toTerm})` : ""}</option>)}
            </select>
            {fieldError("receiverId")}
          </div>
          <div className="l-ho-bank">
            <div className="l-field">
              <label className="l-flabel" htmlFor="ngan-hang">Ngân hàng</label>
              <input {...required("bank")} className="l-input" value={draft.bank} onChange={(e) => edit({ bank: e.target.value })} placeholder="Chọn ngân hàng" disabled={!canDo} />
              {fieldError("bank")}
            </div>
            <div className="l-field">
              <label className="l-flabel" htmlFor="so-tk">Số tài khoản</label>
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
          <label className="l-flabel" htmlFor="ma-gd">Mã giao dịch chuyển số dư (không bắt buộc)</label>
          <div className="l-ho-ref">
            <input id="ma-gd" className="l-input" value={draft.ref} onChange={(e) => edit({ ref: e.target.value })} placeholder="Ví dụ: mã trong biên lai chuyển khoản" disabled={!canDo} />
            <button type="button" className="l-btn2" disabled aria-describedby="ho-bien-lai"><Icon name="upload" size={18} />Ảnh biên lai</button>
          </div>
          <span id="ho-bien-lai" className="l-note">Che số tài khoản trong ảnh trước khi tải lên. Bản demo chưa tải ảnh lên được.</span>
        </div>
      </div>
      {serverError && <p className="l-alert" role="alert">{serverError}</p>}
      {!canDo && <p className="l-note" id="ho-quyen">{RIGHT_LABEL.handover}</p>}
      <div className="l-row-actions">
        <LichConfirm className="l-btn2" disabled={!canDo} describedBy={canDo ? undefined : "ho-quyen"} busy={back.isPending} confirm="Quay lại bước 2"
          title="Quay lại bước 2?"
          description={demo ? "Bản demo chưa làm bước 2 (chốt số dư), nên quay lại rồi thì chưa sang lại bước 3 được. Muốn thử lại bước 3, đặt lại dữ liệu mẫu ở trang đăng nhập." : "Bước 2 chốt lại số dư; chốt xong thì bàn giao sang lại bước 3."}
          onConfirm={() => back.mutate(2)}>Quay lại bước 2</LichConfirm>
        <button type="submit" className="l-btn" disabled={!canDo} aria-describedby={canDo ? undefined : "ho-quyen"} aria-busy={save.isPending || undefined}>Lưu và sang bước 4</button>
      </div>
    </form>
  );
}

/** Các bước khác bước 3 chưa có bản vẽ. */
function StepNotBuilt({ data, canDo }: { data: HandoverRes; canDo: boolean }) {
  const { club } = useLichBoard();
  const back = useClubMutation(club.id, (step: number) => apiPut<HandoverRes>(`/clubs/${club.id}/handover/step`, { step }));
  const r = data.newReceiver;
  return (
    <section className="l-detail" aria-labelledby="ho-buoc">
      <div className="l-field">
        <h2 id="ho-buoc" tabIndex={-1}>{STEPS[data.step - 1]}</h2>
        <span className="l-meta">Bước {data.step} / 6</span>
        {data.step === 4 && <p className="l-fine">{ADMIN_NOTE}</p>}
      </div>
      {data.step > 3 && r && (
        <p>Đã lưu tài khoản nhận quỹ mới: <strong>{r.name}</strong> · {r.bank} · •••• {r.accountLast4}{data.transferRef ? ` · mã giao dịch ${data.transferRef}` : ""}.</p>
      )}
      <p className="l-note">{data.step < 3 ? "Bản demo chưa làm bước này, nên chưa sang được bước 3. Muốn thử lại bước 3, đặt lại dữ liệu mẫu ở trang đăng nhập." : "Bản demo chưa làm bước này."}</p>
      {data.step > 3 && (
        <div className="l-row-actions">
          <button type="button" className="l-btn2" disabled={!canDo} aria-busy={back.isPending || undefined} onClick={() => { if (!back.isPending) back.mutate(3); }}>Quay lại bước 3</button>
        </div>
      )}
    </section>
  );
}
