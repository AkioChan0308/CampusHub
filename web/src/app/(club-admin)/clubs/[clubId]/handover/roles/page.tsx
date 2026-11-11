"use client";

// Ban điều hành · Bàn giao từng vai (09/11/2026; chưa có bản vẽ, mô tả ở docs/mo-ta-ban-giao-theo-vai.md, mục 2.11), thế giới "Lịch bloc".
// Phó chủ nhiệm, thủ quỹ, trưởng ban gửi đơn lên chủ nhiệm; chủ nhiệm duyệt hoặc từ chối (ghi lý do); duyệt xong người giao làm các bước 2 đến 5;
// người nhận (có thể còn là thành viên thường) xác nhận ở bước 6. Dữ liệu từ GET /clubs/:clubId/role-handovers.

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { RoleHandoverDto, RoleHandoversRes } from "@contract";
import { ApiError, apiDelete, apiPost } from "@/api/client";
import { errorText, keys, useClubMutation, useRoleHandovers } from "@/api/queries";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { DialogClose, LichDialog } from "@/components/lich/Dialog";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { ContactLog, ProxyReview } from "@/components/lich/Proxy";
import { TypedConfirm } from "@/components/lich/TypedConfirm";
import { CONTACT_CHANNEL_LABEL } from "@/lib/actions";
import { bareDept, dmy, hm, money } from "@/lib/format";
import { HANDOVER_STEPS } from "@/lib/handover-steps";
import { ROLE_LABEL } from "@/lib/types";

const TITLE = "Bàn giao từng vai";
const STATUS_TEXT: Record<RoleHandoverDto["status"], string> = { requested: "Chờ duyệt", waiting: "Chờ người giữ vai phản hồi", kept: "Người giữ vai vẫn đảm nhận", active: "Đang bàn giao", done: "Đã xong", rejected: "Bị từ chối", cancelled: "Đã hủy" };
/** Tên bước theo vai: bước 1 là đơn xin; bước 2 và 4 chỉ có với thủ quỹ. */
const stepName = (n: number) => (n === 1 ? "Đơn lên chủ nhiệm" : HANDOVER_STEPS[n - 1]);
const applies = (role: RoleHandoverDto["role"], n: number) => !((n === 2 || n === 4) && role !== "treasurer");
const label = (h: { role: RoleHandoverDto["role"]; department?: string }) => (h.role === "head" && h.department ? `trưởng ban ${bareDept(h.department)}` : ROLE_LABEL[h.role].toLowerCase());
const optionLabel = (m: { role: RoleHandoverDto["role"]; department?: string }) => (m.role === "head" ? `Trưởng ban ${bareDept(m.department ?? "")}` : ROLE_LABEL[m.role]);

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useRoleHandovers(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="handover" fallback={<RolesSkeleton />}>
        <RolesPage />
      </BoardFrame>
    </LichPage>
  );
}

const toWholeBoard = (clubId: string) => <Link className="l-btn2" href={`/clubs/${clubId}/handover`}>Bàn giao cả ban</Link>;

function RolesSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub="Mỗi người tự bàn giao vai của mình" />
      <Loading label="Đang tải các đơn bàn giao" className="l-sheet">
        <div className="l-sec"><Skel w={260} h={24} /><Skel w="100%" h={120} /></div>
      </Loading>
    </>
  );
}

function RolesPage() {
  const { club } = useLichBoard();
  const query = useRoleHandovers(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <RolesSkeleton />;
  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <RolesBody data={query.data} fade={sawHere || sawFrame} />;
}

function RolesBody({ data, fade }: { data: RoleHandoversRes; fade: boolean }) {
  const board = useLichBoard();
  const { club } = board;
  const isOpen = (h: RoleHandoverDto) => h.status === "requested" || h.status === "waiting" || h.status === "active";
  const open = data.items.filter(isOpen);
  const closed = data.items.filter((h) => !isOpen(h));
  // Vai nào đã có đơn chưa xong (tự bàn giao hay bàn giao hộ) thì không hiện form gửi đơn cho vai đó: đơn đang chạy mới là việc cần xem.
  const free = data.mine.filter((m) => !open.some((h) => h.role === m.role && h.department === m.department));
  return (
    <>
      <PageTop title={TITLE} sub={`${club.name} · ${club.term}`} actions={board.canViewHandover ? toWholeBoard(club.id) : undefined} />
      <Reveal from={fade} className="l-sheet">
        {/* Việc đang chờ bạn nằm trên cùng; form gửi đơn ở dưới. */}
        {open.length > 0 && (
          <div className="l-sec">
            <div className="l-sec-head"><h2>Đơn đang chạy ({open.length})</h2></div>
            {open.map((h) => <Item key={h.id} h={h} />)}
          </div>
        )}
        {free.length > 0 && <RequestForm data={{ ...data, mine: free }} />}
        {data.proxyable.length > 0 && <ProxyForm data={data} />}
        {data.mine.length === 0 && data.proxyable.length === 0 && data.items.length === 0 && (
          <div className="l-sec"><p className="l-empty">Chưa có đơn bàn giao nào. Chỉ người đang giữ vai (chủ nhiệm, phó chủ nhiệm, thủ quỹ, trưởng ban) gửi được đơn.</p></div>
        )}
        {closed.length > 0 && (
          <div className="l-sec">
            <div className="l-sec-head"><h2>Lịch sử ({closed.length})</h2></div>
            {closed.map((h) => <Item key={h.id} h={h} />)}
          </div>
        )}
      </Reveal>
    </>
  );
}

/** Gửi một yêu cầu tới máy chủ; xong thì làm mới cả CLB và tài khoản (vai mới, thông báo). */
function useRoleCall<V>(path: (v: V) => string, onDone?: (r: RoleHandoversRes, v: V) => void, onError?: (e: unknown) => void) {
  const { club } = useLichBoard();
  const client = useQueryClient();
  return useClubMutation(club.id, (v: V & { body?: unknown }) => apiPost<RoleHandoversRes>(`/clubs/${club.id}/role-handovers${path(v)}`, v.body), {
    onSuccess: (r, v) => { void client.invalidateQueries({ queryKey: keys.me }); onDone?.(r, v); },
    onError,
  });
}

// ---------- Gửi đơn ----------

function RequestForm({ data }: { data: RoleHandoversRes }) {
  const { me } = useLichBoard();
  const direct = me.role === "president";
  const [pick, setPick] = useState(data.mine.length === 1 ? "0" : "");
  const [toId, setToId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const send = useRoleCall<{ body: object }>(() => "", () => { toast.success(direct ? "Đã bắt đầu bàn giao." : "Đã gửi đơn lên chủ nhiệm."); setPick(data.mine.length === 1 ? "0" : ""); setToId(""); setReason(""); }, (e) => setError(errorText(e)));
  const mine = pick === "" ? undefined : data.mine[Number(pick)];
  const busy = data.items.some((h) => (h.status === "requested" || h.status === "waiting" || h.status === "active") && h.kind === "self" && mine && h.role === mine.role && h.department === mine.department && (mine.role === "head" || h.from.personId === me.personId));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (send.isPending) return;
    if (!mine) { setError("Cần chọn vai muốn bàn giao."); document.getElementById("role-pick")?.focus(); return; }
    if (!toId) { setError("Cần chọn người nhận."); document.getElementById("role-to")?.focus(); return; }
    if (!reason.trim()) { setError("Cần ghi lý do bàn giao."); document.getElementById("role-reason")?.focus(); return; }
    setError("");
    send.mutate({ body: { role: mine.role, ...(mine.department ? { department: mine.department } : {}), toId, reason: reason.trim() } });
  }

  return (
    <section className="l-sec">
    <form className="l-detail l-form" onSubmit={submit} noValidate aria-labelledby="role-request-title">
      <div className="l-field">
        <h2 id="role-request-title">Bàn giao vai của bạn</h2>
        <p className="l-fine">
          {direct
            ? "Chủ nhiệm bàn giao vai của mình không cần đơn. Người nhận vẫn tự xác nhận ở bước 6."
            : "Bước 1 là gửi đơn lên chủ nhiệm. Chủ nhiệm duyệt xong thì bạn làm các bước tiếp theo; người nhận tự xác nhận ở bước 6."}
        </p>
      </div>
      <div className="l-form-grid">
        <div className="l-field">
          <label className="l-flabel" htmlFor="role-pick">Vai bàn giao</label>
          <select id="role-pick" className="l-select" value={pick} onChange={(e) => { setPick(e.target.value); setError(""); }}>
            <option value="">Chọn vai</option>
            {data.mine.map((m, i) => <option key={`${m.role}-${m.department ?? ""}`} value={i}>{optionLabel(m)}</option>)}
          </select>
        </div>
        <div className="l-field">
          <label className="l-flabel" htmlFor="role-to">Người nhận (đề xuất)</label>
          <select id="role-to" className="l-select" value={toId} onChange={(e) => { setToId(e.target.value); setError(""); }}>
            <option value="">Chọn người</option>
            {data.candidates.filter((c) => mine?.role === "head" || c.role === "member").map((c) => <option key={c.personId} value={c.personId}>{c.name}</option>)}
          </select>
          <span className="l-hint">Thành viên đã nhận lời mời, chưa giữ chức danh khác.</span>
        </div>
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="role-reason">Lý do</label>
        <textarea id="role-reason" className="l-textarea" rows={3} maxLength={500} value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} />
      </div>
      {error && <p className="l-alert" role="alert">{error}</p>}
      {busy && <p className="l-note">Vai này đang có một đơn chưa xong. Hủy đơn đó hoặc chờ xong rồi mới gửi đơn mới.</p>}
      <div className="l-row-actions"><button type="submit" className="l-btn" disabled={busy} aria-busy={send.isPending || undefined}>{direct ? "Bắt đầu bàn giao" : "Gửi đơn bàn giao"}</button></div>
    </form>
    </section>
  );
}

// ---------- Một đơn ----------

function Item({ h }: { h: RoleHandoverDto }) {
  const { club } = useLichBoard();
  const rejected = h.status === "rejected";
  return (
    <article className="l-detail l-form" aria-labelledby={`role-${h.id}`}>
      <div className="l-field">
        <h3 id={`role-${h.id}`}>{h.kind === "proxy" ? "Bàn giao hộ vai " : "Vai "}{label(h)}: {h.from.name} → {h.to.name}</h3>
        <span className="l-meta">{h.status === "requested" && h.kind === "proxy" ? "Chờ duyệt bằng chứng" : STATUS_TEXT[h.status]}{h.status === "active" || h.status === "done" ? ` · bước ${h.step} / 7` : ""} · gửi {dmy(h.requestedAt)}{h.requester ? ` bởi ${h.requester.name}` : ""}</span>
        <p className="l-fine">Lý do: {h.reason}</p>
        {h.status === "waiting" && h.waitUntil && <p className="l-note">{h.can.keep ? `Ban điều hành xin bàn giao vai này vì chưa liên lạc được với bạn. Nếu bạn vẫn đảm nhận, bấm "Tôi vẫn đảm nhận" trước ${dmy(h.waitUntil)}.` : `Chờ ${h.from.name} phản hồi đến ${dmy(h.waitUntil)}. Im lặng thì việc bàn giao hộ được làm tiếp.`}</p>}
        {h.status === "kept" && <p className="l-note">{h.from.name} đã bấm "Tôi vẫn đảm nhận". Yêu cầu bị hủy; 7 ngày không gửi lại cùng vai được.</p>}
        {rejected && h.rejectReason && <p className="l-note" role="status"><strong>Bị từ chối</strong> bởi {h.decidedBy?.name ?? "chủ nhiệm"}: {h.rejectReason}. Người gửi sửa rồi gửi đơn mới.</p>}
      </div>
      {h.kind === "proxy" && <ContactLog clubId={club.id} h={h} />}
      {(h.status === "active" || h.status === "done") && <Progress h={h} />}
      {(h.snapshot || h.note) && <Handed h={h} />}
      <Actions h={h} />
      <details className="l-fine">
        <summary>Lịch sử của đơn ({h.history.length})</summary>
        <ul className="l-ho-list">{h.history.map((x, i) => <li key={i}>{dmy(x.at)} {hm(x.at)} · {x.by.name} {x.text}</li>)}</ul>
      </details>
    </article>
  );
}

function Progress({ h }: { h: RoleHandoverDto }) {
  return (
    <ol className="l-steps" aria-label={`Các bước bàn giao vai ${label(h)}`}>
      {HANDOVER_STEPS.map((_, i) => {
        const n = i + 1;
        const na = !applies(h.role, n);
        const status = h.status === "done" || n < h.step ? "done" : n === h.step ? "now" : "todo";
        return (
          <li key={n} className={`l-step ${status}`} aria-current={status === "now" ? "step" : undefined}>
            <span className="l-step-n">{n}</span>
            <span className="l-step-name">{stepName(n)}{na ? " (không áp dụng)" : ""}</span>
            <span className="l-sr"> ({na ? "không áp dụng" : status === "done" ? "xong" : status === "now" ? "đang làm" : "chưa làm"})</span>
          </li>
        );
      })}
    </ol>
  );
}

function Actions({ h }: { h: RoleHandoverDto }) {
  const { club } = useLichBoard();
  const [reject, setReject] = useState(false);
  const [why, setWhy] = useState("");
  const [error, setError] = useState("");
  const decide = useRoleCall<{ approve: boolean; reason?: string }>(() => `/${h.id}/decision`, (r, v) => { toast.success(v.approve ? "Đã duyệt đơn." : "Đã từ chối đơn."); setReject(false); }, (e) => setError(errorText(e)));
  const cancel = useRoleCall<object>(() => `/${h.id}/cancel`, () => toast.success("Đã hủy bàn giao."));
  const keep = useRoleCall<object>(() => `/${h.id}/keep`, () => toast.success("Đã ghi nhận: bạn vẫn đảm nhận vai này."));
  return (
    <>
      {h.can.decide && h.kind === "proxy" && <ProxyReview clubId={club.id} h={h} />}
      {h.can.decide && h.kind === "self" && (
        <div className="l-row-actions">
          <LichConfirm className="l-btn" busy={decide.isPending} title="Duyệt đơn bàn giao?" confirm="Duyệt đơn" label={`Duyệt đơn bàn giao vai ${label(h)}`}
            description={`${h.from.name} sẽ làm các bước tiếp theo để bàn giao vai ${label(h)} cho ${h.to.name}. Vai chỉ đổi khi ${h.to.name} xác nhận ở bước 6.`}
            onConfirm={() => decide.mutate({ approve: true, body: { approve: true } })}>Duyệt đơn</LichConfirm>
          <button type="button" className="l-btn2" aria-label={`Từ chối đơn bàn giao vai ${label(h)}`} onClick={() => { setWhy(""); setError(""); setReject(true); }}>Từ chối</button>
          <LichDialog open={reject} onOpenChange={setReject} title="Từ chối đơn bàn giao" description="Ghi lý do để người gửi biết cần sửa gì. Người gửi nhận thông báo và gửi lại được.">
            <form className="l-form" noValidate onSubmit={(e) => {
              e.preventDefault();
              if (decide.isPending) return;
              if (!why.trim()) { setError("Cần ghi lý do từ chối."); document.getElementById(`reject-${h.id}`)?.focus(); return; }
              decide.mutate({ approve: false, reason: why.trim(), body: { approve: false, reason: why.trim() } });
            }}>
              <div className="l-field">
                <label className="l-flabel" htmlFor={`reject-${h.id}`}>Lý do</label>
                <textarea id={`reject-${h.id}`} className="l-textarea" rows={3} maxLength={500} value={why} onChange={(e) => { setWhy(e.target.value); setError(""); }} />
                {error && <span className="l-error" role="alert">{error}</span>}
              </div>
              <div className="l-dialog-actions">
                <DialogClose className="l-btn2">Hủy</DialogClose>
                <button type="submit" className="l-btn" aria-busy={decide.isPending || undefined}>Từ chối đơn</button>
              </div>
            </form>
          </LichDialog>
        </div>
      )}
      {h.can.keep && (
        <div className="l-row-actions">
          <LichConfirm className="l-btn" busy={keep.isPending} title="Bạn vẫn đảm nhận vai này?" confirm="Tôi vẫn đảm nhận" label={`Tôi vẫn đảm nhận vai ${label(h)}`}
            description="Yêu cầu bàn giao hộ bị hủy và bạn giữ nguyên vai. Người gửi không gửi lại cùng vai được trong 7 ngày."
            onConfirm={() => keep.mutate({})}>Tôi vẫn đảm nhận</LichConfirm>
        </div>
      )}
      {h.status === "requested" && !h.can.decide && <p className="l-note">{h.kind === "proxy" ? "Chờ mentor (hoặc phó chủ nhiệm khi CLB chưa có mentor) duyệt bằng chứng. Người giữ vai chưa được báo." : "Chờ chủ nhiệm duyệt. Chủ nhiệm đã nhận thông báo."}</p>}
      {h.can.step && <StepPanel h={h} />}
      {h.status === "active" && h.step === 6 && <AcceptPanel h={h} />}
      {h.status === "active" && h.step >= 2 && h.step <= 5 && !h.can.step && <p className="l-note">{h.role === "president" && h.kind === "proxy" ? "Chờ mentor thực hiện bàn giao hộ vai chủ nhiệm." : `Chờ ${(h.requester ?? h.from).name} làm bước ${h.step}: ${stepName(h.step).toLowerCase()}.`}</p>}
      {h.can.cancel && (
        <div className="l-row-actions">
          <LichConfirm className="l-btn2" busy={cancel.isPending} title="Hủy bàn giao vai này?" confirm="Hủy bàn giao" label={`Hủy bàn giao vai ${label(h)}`}
            description="Vai giữ nguyên người hiện tại. Đơn ở lại trong lịch sử, đánh dấu đã hủy; muốn bàn giao lại thì gửi đơn mới."
            onConfirm={() => cancel.mutate({})}>Hủy bàn giao</LichConfirm>
        </div>
      )}
    </>
  );
}

/** Bước 2 đến 5, do người giao làm. */
function StepPanel({ h }: { h: RoleHandoverDto }) {
  const [error, setError] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");
  const call = useRoleCall<{ body: object }>(() => `/${h.id}/step`, undefined, (e) => setError(errorText(e)));
  const go = (body: object) => { setError(""); call.mutate({ body }); };
  const left = h.holding.accounts.filter((a) => a.required && !a.transferred);
  const shell = (title: string, lead: ReactNode, body?: ReactNode) => (
    <section className="l-field" aria-label={`Bước ${h.step}: ${title}`}>
      <h4>Bước {h.step}: {title}</h4>
      <p className="l-fine">{lead}</p>
      {body}
      {error && <p className="l-alert" role="alert">{error}</p>}
    </section>
  );
  const busy = call.isPending || undefined;
  if (h.step === 2) {
    return shell("Chốt số dư", "Số dư sổ quỹ lúc bấm được chốt vào biên bản. Sổ quỹ chỉ thêm được bút toán nên số này không bị sửa lùi.",
      <div className="l-row-actions"><button type="button" className="l-btn" aria-busy={busy} onClick={() => go({ action: "lockBalance" })}>Chốt số dư</button></div>);
  }
  if (h.step === 3) {
    const k = h.holding;
    const who = h.requester ? h.from.name : "bạn";
    return shell("Kiểm tra phần đang giữ", `Đây là những gì ${who} đang giữ. Người nhận ${h.to.name} sẽ thấy danh sách này và lời dặn bên dưới trước khi xác nhận. Tài khoản chuyển quyền ở bước 5; biểu mẫu và việc chưa xong thì giao lại cho người khác ở màn Kho bàn giao và Việc cần làm nếu cần.`,
      <>
        <HeldList documents={k.documents} accounts={k.accounts} tasks={k.tasks} />
        <div className="l-field">
          <label className="l-flabel" htmlFor={`note-${h.id}`}>Lời dặn cho {h.to.name} (không bắt buộc)</label>
          <textarea id={`note-${h.id}`} className="l-textarea" rows={4} maxLength={1000} value={note} placeholder="Ví dụ: việc nào đang làm dở tới đâu, cần liên hệ ai, lưu ý gì khi nhận vai"
            onChange={(e) => { setNote(e.target.value); setError(""); }} />
        </div>
        <div className="l-row-actions"><button type="button" className="l-btn" aria-busy={busy} onClick={() => go({ action: "reviewKit", ...(note.trim() ? { note: note.trim() } : {}) })}>Đã xem xong</button></div>
      </>);
  }
  if (h.step === 4) {
    return shell("Đổi tài khoản nhận quỹ", `Tài khoản cá nhân của thủ quỹ cũ không chuyển cho người khác được. Ghi tài khoản nhận quỹ mới của ${h.to.name}${h.lockedBalance !== undefined ? `; số dư cần chuyển sang là ${money(h.lockedBalance)}` : ""}. Bản demo không lưu số tài khoản thật.`,
      <form className="l-form" noValidate onSubmit={(e) => {
        e.preventDefault();
        if (call.isPending) return;
        if (!bank.trim()) { setError("Cần ghi ngân hàng."); document.getElementById(`bank-${h.id}`)?.focus(); return; }
        if (!/^\d{4,30}$/.test(account.trim())) { setError("Số tài khoản chỉ gồm chữ số (4 đến 30 số)."); document.getElementById(`account-${h.id}`)?.focus(); return; }
        go({ action: "setReceiver", bank: bank.trim(), account: account.trim() });
      }}>
        <div className="l-form-grid">
          <div className="l-field"><label className="l-flabel" htmlFor={`bank-${h.id}`}>Ngân hàng</label><input id={`bank-${h.id}`} className="l-input" value={bank} onChange={(e) => { setBank(e.target.value); setError(""); }} /></div>
          <div className="l-field"><label className="l-flabel" htmlFor={`account-${h.id}`}>Số tài khoản</label><input id={`account-${h.id}`} className="l-input" inputMode="numeric" value={account} onChange={(e) => { setAccount(e.target.value); setError(""); }} /></div>
        </div>
        <div className="l-row-actions"><button type="submit" className="l-btn" aria-busy={busy}>Lưu và sang bước 5</button></div>
      </form>);
  }
  return shell("Chuyển quyền quản trị", `Tài khoản trong kho bàn giao do bạn đang giữ. Đổi quyền thật làm ở chính dịch vụ (Facebook, Drive, email...); ở đây chỉ ghi lại việc chuyển cho ${h.to.name}. Tài khoản bắt buộc phải chuyển hết mới sang được bước 6.`,
    <>
      {h.holding.accounts.length === 0 && <p className="l-note">Bạn không giữ tài khoản nào trong kho bàn giao.</p>}
      <ul className="l-ho-list">
        {h.holding.accounts.map((a) => (
          <li key={a.id}>
            {a.service}{a.required ? " (bắt buộc)" : ""}: {a.transferred ? <strong>đã chuyển cho {h.to.name}</strong>
              : <button type="button" className="l-btn2 l-sm" aria-label={`Chuyển ${a.service} cho ${h.to.name}`} aria-busy={busy} onClick={() => go({ action: "transferAccount", accountId: a.id })}>Chuyển cho {h.to.name}</button>}
          </li>
        ))}
      </ul>
      <div className="l-row-actions">
        <button type="button" className="l-btn" aria-busy={busy} onClick={() => go({ action: "finishTransfer" })}>Xong bước 5</button>
        {left.length > 0 && <span className="l-note">Còn {left.length} tài khoản bắt buộc chưa chuyển.</span>}
      </div>
    </>);
}

/** Bước 6: người nhận xác nhận (hai bước: mở hộp rồi gõ BAN GIAO). Người khác chỉ thấy dòng chờ. */
function AcceptPanel({ h }: { h: RoleHandoverDto }) {
  const accept = useRoleCall<object>(() => `/${h.id}/step`, () => toast.success("Đã xác nhận nhận bàn giao."));
  if (!h.can.accept) return <p className="l-note">Chờ {h.to.name} xác nhận. Chỉ người này bấm được.</p>;
  const effects = [
    `Bạn nhận vai ${label(h)}.`,
    h.role === "head" ? `${h.from.name} thôi làm trưởng ban ${h.department}; nếu không còn làm trưởng ban nào khác thì về thành viên thường.` : `${h.from.name} về thành viên thường.`,
    "Biên bản bàn giao khóa lại, không sửa được nữa.",
  ];
  return (
    <section className="l-danger" aria-labelledby={`danger-${h.id}`}>
      <h4 id={`danger-${h.id}`}>Vùng nguy hiểm: nhận vai {label(h)}</h4>
      <p>{h.from.name} đã làm xong phần của mình. Xác nhận sẽ <strong>đổi vai trò ngay</strong> và không hoàn tác được.</p>
      <ul>{effects.map((x) => <li key={x}>{x}</li>)}</ul>
      <TypedConfirm className="l-btn-ghost-warn" busy={accept.isPending} title="Nhận bàn giao và đổi vai?" phrase="BAN GIAO" confirm="Nhận vai"
        body={<><p>Bạn sắp làm những việc sau, không hoàn tác được:</p><ul>{effects.map((x) => <li key={x}>{x}</li>)}</ul></>}
        onConfirm={() => accept.mutate({ body: { action: "accept" } })}>Xác nhận đã nhận bàn giao</TypedConfirm>
    </section>
  );
}

// ---------- Bàn giao hộ: gửi yêu cầu ----------

type Channel = "phone" | "zalo" | "email" | "friend";
interface ContactRow { date: string; channel: Channel; result: string; photos: { id: string; name: string }[] }
const emptyContact = (): ContactRow => ({ date: "", channel: "phone", result: "", photos: [] });
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Đọc file ảnh thành base64 (bỏ phần "data:...;base64,"). */
const readBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
  r.onerror = () => reject(new Error("Không đọc được file."));
  r.readAsDataURL(file);
});

/**
 * Người giữ vai không liên lạc được: chủ nhiệm (vai chủ nhiệm: ban điều hành khác) ghi tối thiểu 3 lần liên hệ kèm ảnh chụp màn hình.
 * Ảnh tải lên ngay khi chọn; yêu cầu chỉ gửi đi khi đủ. Người giữ vai chưa bị báo cho tới khi mentor duyệt bằng chứng.
 */
function ProxyForm({ data }: { data: RoleHandoversRes }) {
  const { club } = useLichBoard();
  const client = useQueryClient();
  // Lối thoát cho trường hợp hiếm: đóng sẵn, bấm mới mở (Hiệu chọn 09/11/2026), để không trông như việc ai cũng làm thường xuyên.
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(data.proxyable.length === 1 ? "0" : "");
  const [toId, setToId] = useState("");
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState<ContactRow[]>([emptyContact(), emptyContact(), emptyContact()]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const target = pick === "" ? undefined : data.proxyable[Number(pick)];
  const send = useClubMutation(club.id, (body: object) => apiPost<RoleHandoversRes>(`/clubs/${club.id}/role-handovers`, body), {
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu. Mentor xem bằng chứng rồi mới báo người giữ vai.");
      setToId(""); setReason(""); setPick(data.proxyable.length === 1 ? "0" : ""); setRows([emptyContact(), emptyContact(), emptyContact()]);
      setOpen(false);
      requestAnimationFrame(() => document.getElementById("proxy-open")?.focus());
      void client.invalidateQueries({ queryKey: keys.notifications });
    },
    onError: (e) => setError(errorText(e)),
  });
  const set = (i: number, patch: Partial<ContactRow>) => { setError(""); setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x))); };
  const total = rows.reduce((n, r) => n + r.photos.length, 0);
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10); // ngày hôm nay giờ Việt Nam

  async function removePhoto(i: number, id: string) {
    setError("");
    try {
      await apiDelete(`/clubs/${club.id}/evidence/${id}`);
      setRows((r) => r.map((x, k) => (k === i ? { ...x, photos: x.photos.filter((p) => p.id !== id) } : x)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setRows((r) => r.map((x, k) => (k === i ? { ...x, photos: x.photos.filter((p) => p.id !== id) } : x))); // ảnh đã không còn trên máy chủ: bỏ khỏi form
      else setError(errorText(e));
    }
  }

  async function addPhotos(i: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      let count = total;
      for (const f of Array.from(files)) {
        if (f.type !== "image/jpeg" && f.type !== "image/png") throw new Error("Chỉ nhận ảnh JPG hoặc PNG.");
        if (f.size > MAX_PHOTO_BYTES) throw new Error("Mỗi ảnh tối đa 5 MB.");
        if (count + 1 > 10) throw new Error("Tối đa 10 ảnh mỗi yêu cầu.");
        count++;
        const meta = await apiPost<{ id: string; name: string }>(`/clubs/${club.id}/evidence`, { name: f.name, mime: f.type, dataBase64: await readBase64(f) });
        setRows((r) => r.map((x, k) => (k === i ? { ...x, photos: [...x.photos, { id: meta.id, name: f.name }] } : x)));
      }
    } catch (e) {
      // Lỗi tự đặt ở trên (loại file, dung lượng) hiện nguyên văn; lỗi của máy chủ qua errorText.
      setError(e instanceof Error && !(e instanceof ApiError) ? e.message : errorText(e));
    } finally {
      setUploading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (send.isPending || uploading) return;
    const focus = (id: string) => document.getElementById(id)?.focus();
    if (!target) { setError("Cần chọn vai muốn bàn giao hộ."); focus("proxy-pick"); return; }
    if (!toId) { setError("Cần chọn người nhận."); focus("proxy-to"); return; }
    if (!reason.trim()) { setError("Cần ghi lý do."); focus("proxy-reason"); return; }
    const i = rows.findIndex((r) => !r.date || !r.result.trim());
    if (i >= 0) { setError(`Lần liên hệ ${i + 1}: cần ghi ngày và kết quả.`); focus(`proxy-date-${i}`); return; }
    if (total === 0) { setError("Cần đính kèm ít nhất một ảnh chụp màn hình làm bằng chứng."); focus("proxy-photo-0"); return; }
    setError("");
    send.mutate({ role: target.role, ...(target.department ? { department: target.department } : {}), toId, reason: reason.trim(), proxy: { contacts: rows.map((r) => ({ date: r.date, channel: r.channel, result: r.result.trim(), evidenceIds: r.photos.map((p) => p.id) })) } });
  }

  if (!open) {
    return (
      <section className="l-sec">
        <div className="l-detail l-form">
          <p className="l-fine">Người giữ vai không liên lạc được? Ban điều hành xin bàn giao hộ kèm bằng chứng, mentor duyệt.</p>
          <div className="l-row-actions"><button type="button" id="proxy-open" className="l-btn2" aria-expanded="false" aria-controls="proxy-form" onClick={() => { setOpen(true); requestAnimationFrame(() => document.getElementById("proxy-title")?.focus()); }}>Bàn giao hộ khi không liên lạc được</button></div>
        </div>
      </section>
    );
  }
  return (
    <section className="l-sec" id="proxy-form">
      <form className="l-detail l-form" onSubmit={submit} noValidate aria-labelledby="proxy-title">
        <div className="l-field">
          <h2 id="proxy-title" tabIndex={-1}>Bàn giao hộ khi không liên lạc được</h2>
          <p className="l-fine">
            Ghi tối thiểu 3 lần liên hệ với người giữ vai, kèm ít nhất một ảnh chụp màn hình (tin nhắn, nhật ký cuộc gọi). Mentor duyệt bằng chứng trước; sau đó người giữ vai được báo và có 3 ngày để bấm &quot;Tôi vẫn đảm nhận&quot;.
            Ảnh chỉ bạn và người duyệt (mentor, hoặc phó chủ nhiệm khi CLB chưa có mentor) xem được, bị xóa sau 30 ngày. Che số điện thoại và thông tin nhạy cảm không cần thiết trước khi tải lên.
          </p>
        </div>
        <div className="l-form-grid">
          <div className="l-field">
            <label className="l-flabel" htmlFor="proxy-pick">Vai cần bàn giao hộ</label>
            <select id="proxy-pick" className="l-select" value={pick} onChange={(e) => { setPick(e.target.value); setError(""); }}>
              <option value="">Chọn vai</option>
              {data.proxyable.map((p, i) => <option key={`${p.role}-${p.department ?? ""}`} value={i}>{p.role === "head" ? `Trưởng ban ${p.department}` : ROLE_LABEL[p.role]} ({p.holder.name})</option>)}
            </select>
          </div>
          <div className="l-field">
            <label className="l-flabel" htmlFor="proxy-to">Người nhận (đề xuất)</label>
            <select id="proxy-to" className="l-select" value={toId} onChange={(e) => { setToId(e.target.value); setError(""); }}>
              <option value="">Chọn người</option>
              {data.candidates.filter((c) => c.personId !== target?.holder.personId && (target?.role === "head" || c.role === "member")).map((c) => <option key={c.personId} value={c.personId}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="l-field">
          <label className="l-flabel" htmlFor="proxy-reason">Lý do</label>
          <textarea id="proxy-reason" className="l-textarea" rows={2} maxLength={500} value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} />
        </div>
        <fieldset className="l-field">
          <legend className="l-flabel">Nhật ký liên hệ ({rows.length} lần, {total} ảnh)</legend>
          {rows.map((r, i) => (
            <div key={i} className="l-form-grid l-contact">
              <div className="l-field"><label className="l-flabel" htmlFor={`proxy-date-${i}`}>Lần {i + 1}: ngày</label><input id={`proxy-date-${i}`} type="date" max={today} className="l-input" value={r.date} onChange={(e) => set(i, { date: e.target.value })} /></div>
              <div className="l-field">
                <label className="l-flabel" htmlFor={`proxy-channel-${i}`}>Kênh</label>
                <select id={`proxy-channel-${i}`} className="l-select" value={r.channel} onChange={(e) => set(i, { channel: e.target.value as Channel })}>
                  {(Object.keys(CONTACT_CHANNEL_LABEL) as Channel[]).map((c) => <option key={c} value={c}>{CONTACT_CHANNEL_LABEL[c]}</option>)}
                </select>
              </div>
              <div className="l-field"><label className="l-flabel" htmlFor={`proxy-result-${i}`}>Kết quả</label><input id={`proxy-result-${i}`} className="l-input" maxLength={200} placeholder="Ví dụ: không nghe máy" value={r.result} onChange={(e) => set(i, { result: e.target.value })} /></div>
              <div className="l-field">
                <label className="l-flabel" htmlFor={`proxy-photo-${i}`}>Ảnh chụp màn hình (JPG, PNG, tối đa 5 MB)</label>
                <input id={`proxy-photo-${i}`} type="file" accept="image/png,image/jpeg" multiple className="l-input" disabled={uploading} onChange={(e) => { void addPhotos(i, e.target.files); e.target.value = ""; }} />
                {r.photos.length > 0 && (
                  <div className="l-evidence-row">
                    {r.photos.map((p) => <button key={p.id} type="button" className="l-btn2 l-sm" aria-label={`Gỡ ảnh ${p.name} khỏi lần ${i + 1}`} onClick={() => void removePhoto(i, p.id)}>Gỡ ảnh {p.name}</button>)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {rows.length < 10 && <div className="l-row-actions"><button type="button" className="l-btn2 l-sm" onClick={() => setRows((r) => [...r, emptyContact()])}>Thêm lần liên hệ</button></div>}
        </fieldset>
        {uploading && <p className="l-note" role="status">Đang tải ảnh lên, chờ xong rồi gửi.</p>}
        {error && <p className="l-alert" role="alert">{error}</p>}
        <div className="l-row-actions"><button type="submit" className="l-btn" aria-busy={send.isPending || uploading || undefined}>Gửi yêu cầu bàn giao hộ</button><button type="button" className="l-btn2" aria-expanded="true" aria-controls="proxy-form" onClick={() => { setOpen(false); requestAnimationFrame(() => document.getElementById("proxy-open")?.focus()); }}>Đóng</button></div>
      </form>
    </section>
  );
}

/** Danh sách những gì một người đang giữ: biểu mẫu, tài khoản trong kho, việc chưa xong. Không giữ gì thì nói rõ. */
function HeldList({ documents, accounts, tasks }: { documents: { id: string; name: string }[]; accounts: { id: string; service: string; required?: boolean }[]; tasks: { id: string; title: string }[] }) {
  if (documents.length + accounts.length + tasks.length === 0) return <p className="l-note">Không giữ biểu mẫu, tài khoản nào trong kho bàn giao và không có việc nào chưa xong.</p>;
  return (
    <ul className="l-ho-list">
      {documents.map((d) => <li key={d.id}>Biểu mẫu: {d.name}</li>)}
      {accounts.map((a) => <li key={a.id}>Tài khoản: {a.service}{a.required ? " (bắt buộc chuyển)" : ""}</li>)}
      {tasks.map((t) => <li key={t.id}>Việc chưa xong: {t.title}</li>)}
    </ul>
  );
}

/** Phần người giao để lại cho người nhận: lời dặn và danh sách đã chụp ở bước 3. Nằm trong biên bản. */
function Handed({ h }: { h: RoleHandoverDto }) {
  return (
    <section className="l-field" aria-label={`Phần ${(h.requester ?? h.from).name} để lại cho ${h.to.name}`}>
      <h4>{(h.requester ?? h.from).name} để lại cho {h.to.name}</h4>
      {h.note && <p className="l-fine">Lời dặn: {h.note}</p>}
      {h.snapshot && <HeldList documents={h.snapshot.documents} accounts={h.snapshot.accounts} tasks={h.snapshot.tasks} />}
    </section>
  );
}
