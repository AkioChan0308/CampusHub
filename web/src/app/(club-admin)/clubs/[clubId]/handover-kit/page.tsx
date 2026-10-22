"use client";

// Ban điều hành · Kho bàn giao (chưa có bản vẽ; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.2), thế giới "Lịch bloc".
// Ba phần: biểu mẫu, quy trình, tài khoản và quyền truy cập. Dữ liệu từ GET /clubs/:clubId/handover-kit.
// Thêm, sửa, xóa: POST, PUT, DELETE .../handover-kit/documents|processes|accounts. Kho KHÔNG lưu mật khẩu.

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { AiSourceDto, KitAccountBody, KitAccountDto, KitDocumentBody, KitDocumentDto, KitProcessBody, KitProcessDto, KitRes, OkRes, PersonRef } from "@contract";
import { apiDelete, apiPost, apiPut } from "@/api/client";
import { useClubMutation, useKit } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { AiAsk, AiSummary } from "@/components/lich/Assistant";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { dmy } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { matchesSearch } from "@/lib/text";
import { KIT_CATEGORY_LABEL, type KitCategory } from "@/lib/types";

const TITLE = "Kho bàn giao";
type Tab = "documents" | "processes" | "accounts";
const TABS: { key: Tab; label: string }[] = [
  { key: "documents", label: "Biểu mẫu" },
  { key: "processes", label: "Quy trình" },
  { key: "accounts", label: "Tài khoản và quyền truy cập" },
];
const isLink = (s: string) => /^https?:\/\/\S+$/i.test(s);

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useKit(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="kit" fallback={<KitSkeleton />}>
        <Kit />
      </BoardFrame>
    </LichPage>
  );
}

/** Khung xương: tiêu đề và ba nút chọn phần là chữ thật; các dòng của phần đầu tiên là thanh giữ chỗ. */
function KitSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={330} />} />
      <Loading className="l-sheet">
        <section className="l-sec l-sec-pad l-ai-box">
          <div className="l-form"><h3 className="l-subhead">Hỏi về bàn giao</h3><div className="l-ai-row"><Skel w={200} h={40} style={{ flex: 1, minWidth: 200 }} /><Skel w={84} h={40} /></div><p className="l-note" style={{ minHeight: 34 }}><SkelLine w="96%" /></p></div>
          <div className="l-form"><div className="l-ai-row"><h3 className="l-subhead">Tóm tắt cho ban mới</h3><Skel w={84} h={40} /></div><p className="l-note"><SkelLine w="72%" /></p></div>
        </section>
        <section className="l-sec">
          <div className="l-sec-head"><div className="l-seg">{TABS.map((t) => <span key={t.key} className="l-chip">{t.label}</span>)}</div></div>
          <div className="l-sec-pad l-kit-bar"><Skel w={260} h={40} /><Skel w={150} h={34} /></div>
          <p className="l-note l-kit-notice"><SkelLine w={420} /></p>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="l-kit-row">
              <span className="l-kit-main"><span className="l-kit-name"><SkelLine w={220} /></span><span className="l-note"><SkelLine w={300} /></span></span>
              <span className="l-row-actions"><Skel w={56} h={34} /><Skel w={56} h={34} /></span>
            </div>
          ))}
        </section>
      </Loading>
    </>
  );
}

function Kit() {
  const { club } = useLichBoard();
  const query = useKit(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <KitSkeleton />;
  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <KitBody data={query.data} fade={sawHere || sawFrame} />;
}

/** Form đang mở: thêm mới (id trống) hoặc sửa một mục. */
type Editing = { tab: Tab; id?: string } | null;

function KitBody({ data, fade }: { data: KitRes; fade: boolean }) {
  const { club, me } = useLichBoard();
  const canEdit = can(me.role, "kit");
  const [tab, setTab] = useState<Tab>("documents");
  const [editing, setEditing] = useState<Editing>(null);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openForm = (next: Editing) => { opener.current = document.activeElement as HTMLElement | null; setEditing(next); };
  const closeForm = (saved: boolean) => {
    setEditing(null);
    requestAnimationFrame(() => (saved || !opener.current?.isConnected ? heading.current : opener.current)?.focus());
  };
  const base = `/clubs/${club.id}/handover-kit`;
  const sum = data.summary;
  const accounts = data.accounts ?? [];
  const empty = sum.documents === 0 && sum.processes === 0 && (sum.accounts ?? 0) === 0;

  const subParts = [`${sum.documents} biểu mẫu`, `${sum.processes} quy trình`, `${sum.accounts ?? 0} tài khoản`];
  const sub = <>{subParts.join(" · ")} · <span className={sum.missing ? "l-attn" : undefined}>{sum.missing ? `${sum.missing} mục thiếu` : "không thiếu mục nào"}</span></>;

  const go = (t: Tab) => { setTab(t); setEditing(null); };
  /** Mở mục nguồn mà trợ lý dẫn: chuyển tới đúng phần, bỏ ô tìm, tô nền mục đó và đưa con trỏ tới nó. */
  const openSource = (src: AiSourceDto) => {
    setTab(src.kind === "document" ? "documents" : src.kind === "process" ? "processes" : "accounts");
    setEditing(null);
    setSearch("");
    setHighlight(src.id);
    setTimeout(() => setHighlight(""), 4000);
    setTimeout(() => { const el = document.getElementById(`kit-item-${src.id}`); el?.scrollIntoView({ block: "center" }); el?.focus(); }, 60);
  };
  const removeDoc = useClubMutation(club.id, (d: KitDocumentDto) => apiDelete<OkRes>(`${base}/documents/${d.id}`), { onSuccess: (_r, d) => { toast.success(`Đã xóa biểu mẫu ${d.name}.`); heading.current?.focus(); } });
  const removeProc = useClubMutation(club.id, (p: KitProcessDto) => apiDelete<OkRes>(`${base}/processes/${p.id}`), { onSuccess: (_r, p) => { toast.success(`Đã xóa quy trình ${p.name}.`); heading.current?.focus(); } });
  const removeAcc = useClubMutation(club.id, (a: KitAccountDto) => apiDelete<OkRes>(`${base}/accounts/${a.id}`), { onSuccess: (_r, a) => { toast.success(`Đã xóa ${a.service}.`); heading.current?.focus(); } });

  const addButton = (label: string) => canEdit && (
    <button type="button" className="l-btn l-sm" aria-expanded={editing?.tab === tab && !editing.id} onClick={() => openForm({ tab })}><Icon name="plus" size={16} />{label}</button>
  );
  const formBlock = (children: ReactNode, key: string) => (
    <AnimatePresence initial={false}>
      {editing?.tab === tab && (
        <m.div key={key} className="l-collapse" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
  const rowActions = (edit: () => void, label: string, remove: ReactNode) => canEdit && (
    <span className="l-row-actions">
      <button type="button" className="l-btn2 l-sm" aria-label={`Sửa ${label}`} onClick={edit}>Sửa</button>
      {remove}
    </span>
  );

  const docs = data.documents.filter((d) => matchesSearch(`${d.name} ${KIT_CATEGORY_LABEL[d.category]} ${d.holder.name}`, search));

  return (
    <>
      <PageTop title={TITLE} sub={sub} actions={canEdit ? undefined : <span className="l-note">{RIGHT_LABEL.kit}</span>} />
      <Reveal from={fade} className="l-sheet">
        <section className="l-sec l-sec-pad l-ai-box" aria-label="Trợ lý bàn giao">
          <AiAsk clubId={club.id} onOpenSource={openSource} />
          {me.role !== "member" && <AiSummary clubId={club.id} canSave={can(me.role, "handover")} />}
        </section>

        <section className="l-sec" aria-labelledby="kit-title">
          <div className="l-sec-head">
            <h2 id="kit-title" ref={heading} tabIndex={-1} className="l-sr">Các phần của kho bàn giao</h2>
            <div className="l-seg" role="group" aria-label="Chọn phần của kho">
              {TABS.map((t) => <button key={t.key} type="button" className="l-chip" aria-pressed={tab === t.key} onClick={() => go(t.key)}>{t.label}</button>)}
            </div>
          </div>

          {empty && canEdit && (
            <div className="l-kit-notice">
              <p className="l-fine">Kho còn trống. Bắt đầu với 3 việc:</p>
              <div className="l-seg">
                <button type="button" className="l-chip" onClick={() => { setTab("documents"); openForm({ tab: "documents" }); }}>Thêm mẫu xin phép sự kiện</button>
                <button type="button" className="l-chip" onClick={() => { setTab("accounts"); openForm({ tab: "accounts" }); }}>Ghi fanpage, nhóm Zalo, Drive</button>
                <button type="button" className="l-chip" onClick={() => { setTab("processes"); openForm({ tab: "processes" }); }}>Viết cách xin phòng họp</button>
              </div>
            </div>
          )}

          {tab === "documents" && (
            <div role="region" aria-label="Biểu mẫu">
              <div className="l-sec-pad l-kit-bar">
                <input className="l-input" type="search" aria-label="Tìm biểu mẫu" placeholder="Tìm biểu mẫu" value={search} onChange={(e) => setSearch(e.target.value)} />
                {addButton("Thêm biểu mẫu")}
              </div>
              <p className="l-note l-kit-notice">Không tải lên file có danh sách thành viên thật. Bản demo chỉ lưu tên và đường link, không lưu file.</p>
              {formBlock(<DocumentForm key={editing?.id ?? "new"} doc={data.documents.find((d) => d.id === editing?.id)} holders={data.holders ?? []} onDone={closeForm} />, editing?.id ?? "new")}
              {docs.length === 0 && <p className="l-empty">{data.documents.length === 0 ? "Chưa có biểu mẫu nào." : "Không có biểu mẫu nào khớp."}</p>}
              {docs.map((d) => (
                <div key={d.id} id={`kit-item-${d.id}`} tabIndex={-1} className={`l-kit-row${highlight === d.id ? " l-hl" : ""}`}>
                  <span className="l-kit-main">
                    <span className="l-kit-name">{isLink(d.link) ? <a href={d.link} target="_blank" rel="noopener noreferrer">{d.name}</a> : d.name}</span>
                    <span className="l-note">{KIT_CATEGORY_LABEL[d.category]} · người giữ: {d.holder.name} · cập nhật {dmy(d.updatedAt)}</span>
                  </span>
                  {rowActions(() => openForm({ tab, id: d.id }), d.name, (
                    <LichConfirm className="l-btn2 l-sm" label={`Xóa biểu mẫu ${d.name}`} busy={removeDoc.isPending && removeDoc.variables?.id === d.id} title={`Xóa biểu mẫu ${d.name}?`}
                      description="Biểu mẫu cũng được gỡ khỏi các quy trình đang dùng nó. Việc này không hoàn tác được." confirm="Xóa biểu mẫu" focusAfter={() => heading.current?.focus()}
                      onConfirm={() => removeDoc.mutate(d)}>Xóa</LichConfirm>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === "processes" && (
            <div role="region" aria-label="Quy trình">
              <div className="l-sec-pad l-kit-bar"><span className="l-note">Cách làm từng việc, theo thứ tự các bước.</span>{addButton("Thêm quy trình")}</div>
              {formBlock(<ProcessForm key={editing?.id ?? "new"} process={data.processes.find((p) => p.id === editing?.id)} documents={data.documents} onDone={closeForm} />, editing?.id ?? "new")}
              {data.processes.length === 0 && <p className="l-empty">Chưa có quy trình nào.</p>}
              {data.processes.map((p) => (
                <div key={p.id} id={`kit-item-${p.id}`} tabIndex={-1} className={`l-kit-row${highlight === p.id ? " l-hl" : ""}`}>
                  <span className="l-kit-main">
                    <span className="l-kit-name">{p.name}</span>
                    <span className="l-note">{p.steps.length} bước{p.leadDays !== undefined ? ` · thường phải xong trước ${p.leadDays} ngày` : ""} · cập nhật {dmy(p.updatedAt)}</span>
                    <ol className="l-kit-steps" aria-label={`Các bước của ${p.name}`}>
                      {p.steps.map((st, i) => <li key={i}>{st.text}{st.who && <span className="l-note"> · {st.who}</span>}</li>)}
                    </ol>
                    {p.documents.length > 0 && <span className="l-kit-tags"><span className="l-note">Biểu mẫu đi kèm:</span>{p.documents.map((d) => <span key={d.id} className="l-tag off">{d.name}</span>)}</span>}
                  </span>
                  {rowActions(() => openForm({ tab, id: p.id }), p.name, (
                    <LichConfirm className="l-btn2 l-sm" label={`Xóa quy trình ${p.name}`} busy={removeProc.isPending && removeProc.variables?.id === p.id} title={`Xóa quy trình ${p.name}?`}
                      description="Việc này không hoàn tác được." confirm="Xóa quy trình" focusAfter={() => heading.current?.focus()}
                      onConfirm={() => removeProc.mutate(p)}>Xóa</LichConfirm>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === "accounts" && (
            <div role="region" aria-label="Tài khoản và quyền truy cập">
              <div className="l-sec-pad l-kit-bar">
                <span className="l-note">CampusHub không lưu mật khẩu. Đổi quyền quản trị ở chính dịch vụ đó.</span>
                {addButton("Thêm tài khoản")}
              </div>
              {formBlock(<AccountForm key={editing?.id ?? "new"} account={accounts.find((a) => a.id === editing?.id)} holders={data.holders ?? []} onDone={closeForm} />, editing?.id ?? "new")}
              {accounts.length === 0 && <p className="l-empty">Chưa có tài khoản nào.</p>}
              {accounts.map((a) => (
                <div key={a.id} id={`kit-item-${a.id}`} tabIndex={-1} className={`l-kit-row${highlight === a.id ? " l-hl" : ""}`}>
                  <span className="l-kit-main">
                    <span className="l-kit-name">{a.service}</span>
                    <span className="l-note">{isLink(a.label) ? <a href={a.label} target="_blank" rel="noopener noreferrer">{a.label}</a> : a.label}</span>
                    <span className="l-kit-tags">
                      {a.holder ? <span className="l-note">Người giữ quyền quản trị: {a.holder.name}</span> : <span className="l-tag warn">Chưa có người giữ</span>}
                      {a.required && <span className="l-tag wait">Bắt buộc chuyển khi bàn giao</span>}
                      {a.ownership === "personal" && <span className="l-tag off">Đứng tên cá nhân: nên chuyển sang tài khoản CLB</span>}
                    </span>
                  </span>
                  {rowActions(() => openForm({ tab, id: a.id }), a.service, (
                    <LichConfirm className="l-btn2 l-sm" label={`Xóa ${a.service} khỏi kho`} busy={removeAcc.isPending && removeAcc.variables?.id === a.id} title={`Xóa ${a.service} khỏi kho?`}
                      description="Chỉ xóa dòng ghi trong kho, không đụng tới tài khoản thật. Việc này không hoàn tác được." confirm="Xóa khỏi kho" focusAfter={() => heading.current?.focus()}
                      onConfirm={() => removeAcc.mutate(a)}>Xóa</LichConfirm>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </>
  );
}

type FormErrors = Record<string, string | undefined>;

function useFormShell(id: string, errors: FormErrors, setErrors: (e: FormErrors) => void) {
  useEffect(() => { document.getElementById(`${id}-name`)?.focus(); }, [id]);
  const field = (k: string, label: string, input: ReactNode, wide = false) => (
    <div className={`l-field${wide ? " l-span-2" : ""}`}>
      <label className="l-flabel" htmlFor={`${id}-${k}`}>{label}</label>
      {input}
      {errors[k] && <span id={`${id}-${k}-error`} className="l-error">{errors[k]}</span>}
    </div>
  );
  const inv = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${id}-${k}-error` : undefined });
  const clear = (k: string) => { if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const firstError = (next: FormErrors) => { const first = Object.keys(next).find((k) => next[k]); if (first) document.getElementById(`${id}-${first}`)?.focus(); return !!first; };
  return { field, inv, clear, firstError };
}

const holderOptions = (holders: PersonRef[]) => holders.map((h) => <option key={h.personId} value={h.personId}>{h.name}</option>);

function DocumentForm({ doc, holders, onDone }: { doc?: KitDocumentDto; holders: PersonRef[]; onDone: (saved: boolean) => void }) {
  const { club } = useLichBoard();
  const base = `/clubs/${club.id}/handover-kit/documents`;
  const [f, setF] = useState({ name: doc?.name ?? "", category: (doc?.category ?? "permit") as KitCategory, link: doc?.link ?? "", holderId: doc?.holder.personId ?? "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const { field, inv, clear, firstError } = useFormShell("kit-doc", errors, setErrors);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); clear(k === "holderId" ? "holder" : k); };
  const save = useClubMutation(club.id, (body: KitDocumentBody) => (doc ? apiPut<{ document: KitDocumentDto }>(`${base}/${doc.id}`, body) : apiPost<{ document: KitDocumentDto }>(base, body)), {
    onSuccess: (r) => { toast.success(doc ? `Đã lưu biểu mẫu ${r.document.name}.` : `Đã thêm biểu mẫu ${r.document.name}.`); onDone(true); },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const next: FormErrors = {};
    if (!f.name.trim()) next.name = "Cần ghi tên biểu mẫu.";
    if (!f.link.trim()) next.link = "Cần ghi đường link.";
    else if (!isLink(f.link.trim())) next.link = "Đường link phải bắt đầu bằng http:// hoặc https://.";
    if (!f.holderId) next.holder = "Cần chọn người giữ.";
    setErrors(next);
    if (firstError(next)) return;
    save.mutate({ name: f.name.trim(), category: f.category, link: f.link.trim(), holderId: f.holderId });
  }
  return (
    <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-labelledby="kit-doc-title">
      <h3 id="kit-doc-title" className="l-subhead">{doc ? `Sửa biểu mẫu ${doc.name}` : "Thêm biểu mẫu"}</h3>
      <div className="l-form-grid">
        {field("name", "Tên biểu mẫu", <input id="kit-doc-name" className="l-input" value={f.name} placeholder="Ví dụ: Mẫu xin phép tổ chức sự kiện" onChange={(e) => set("name", e.target.value)} {...inv("name")} />, true)}
        {field("category", "Nhóm", <select id="kit-doc-category" className="l-select" value={f.category} onChange={(e) => set("category", e.target.value as KitCategory)}>
          {(Object.keys(KIT_CATEGORY_LABEL) as KitCategory[]).map((c) => <option key={c} value={c}>{KIT_CATEGORY_LABEL[c]}</option>)}
        </select>)}
        {field("holder", "Người giữ", <select id="kit-doc-holder" className="l-select" value={f.holderId} onChange={(e) => set("holderId", e.target.value)} {...inv("holder")}><option value="">Chọn người</option>{holderOptions(holders)}</select>)}
        {field("link", "Đường link (Google Drive hoặc nơi lưu)", <input id="kit-doc-link" className="l-input" inputMode="url" value={f.link} placeholder="https://" onChange={(e) => set("link", e.target.value)} {...inv("link")} />, true)}
      </div>
      <div className="l-form-actions">
        <button type="button" className="l-btn2" onClick={() => onDone(false)}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>{doc ? "Lưu biểu mẫu" : "Thêm biểu mẫu"}</button>
      </div>
    </form>
  );
}

type StepDraft = { text: string; who: string };

function ProcessForm({ process, documents, onDone }: { process?: KitProcessDto; documents: KitDocumentDto[]; onDone: (saved: boolean) => void }) {
  const { club } = useLichBoard();
  const base = `/clubs/${club.id}/handover-kit/processes`;
  const [f, setF] = useState({ name: process?.name ?? "", lead: process?.leadDays === undefined ? "" : String(process.leadDays), documentIds: process?.documents.map((d) => d.id) ?? ([] as string[]) });
  const [steps, setSteps] = useState<StepDraft[]>(process?.steps.map((s) => ({ ...s })) ?? [{ text: "", who: "" }]);
  const [errors, setErrors] = useState<FormErrors>({});
  const { field, inv, clear, firstError } = useFormShell("kit-proc", errors, setErrors);
  const save = useClubMutation(club.id, (body: KitProcessBody) => (process ? apiPut<{ process: KitProcessDto }>(`${base}/${process.id}`, body) : apiPost<{ process: KitProcessDto }>(base, body)), {
    onSuccess: (r) => { toast.success(process ? `Đã lưu quy trình ${r.process.name}.` : `Đã thêm quy trình ${r.process.name}.`); onDone(true); },
  });
  const editStep = (i: number, patch: Partial<StepDraft>) => { setSteps((l) => l.map((s, j) => (j === i ? { ...s, ...patch } : s))); clear("steps"); };
  const move = (i: number, d: -1 | 1) => setSteps((l) => { const j = i + d; if (j < 0 || j >= l.length) return l; const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const toggleDoc = (id: string) => setF((x) => ({ ...x, documentIds: x.documentIds.includes(id) ? x.documentIds.filter((d) => d !== id) : [...x.documentIds, id] }));
  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const next: FormErrors = {};
    const clean = steps.map((s) => ({ text: s.text.trim(), who: s.who.trim() })).filter((s) => s.text);
    const lead = f.lead.trim();
    if (!f.name.trim()) next.name = "Cần ghi tên quy trình.";
    if (clean.length === 0) next.steps = "Cần ít nhất một bước.";
    if (lead && !(Number.isInteger(Number(lead)) && Number(lead) >= 0 && Number(lead) <= 365)) next.lead = "Từ 0 đến 365 ngày.";
    setErrors(next);
    if (firstError(next)) return;
    save.mutate({ name: f.name.trim(), steps: clean, ...(lead ? { leadDays: Number(lead) } : {}), documentIds: f.documentIds });
  }
  return (
    <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-labelledby="kit-proc-title">
      <h3 id="kit-proc-title" className="l-subhead">{process ? `Sửa quy trình ${process.name}` : "Thêm quy trình"}</h3>
      <div className="l-form-grid">
        {field("name", "Tên quy trình", <input id="kit-proc-name" className="l-input" value={f.name} placeholder="Ví dụ: Xin phòng họp" onChange={(e) => { setF((x) => ({ ...x, name: e.target.value })); clear("name"); }} {...inv("name")} />, true)}
        {field("lead", "Thường phải xong trước (ngày, không bắt buộc)", <input id="kit-proc-lead" className="l-input" inputMode="numeric" value={f.lead} placeholder="Ví dụ: 7" onChange={(e) => { setF((x) => ({ ...x, lead: e.target.value })); clear("lead"); }} {...inv("lead")} />)}
      </div>
      <fieldset className="l-field">
        <legend className="l-flabel">Các bước, theo thứ tự làm</legend>
        {steps.map((s, i) => (
          <div key={i} className="l-kit-step-edit">
            <span className="l-kit-step-n" aria-hidden="true">{i + 1}</span>
            <input id={i === 0 ? "kit-proc-steps" : undefined} className="l-input" aria-label={`Bước ${i + 1}: việc cần làm`} value={s.text} placeholder="Việc cần làm" onChange={(e) => editStep(i, { text: e.target.value })} {...(i === 0 ? inv("steps") : {})} />
            <input className="l-input" aria-label={`Bước ${i + 1}: ai làm`} value={s.who} placeholder="Ai làm" onChange={(e) => editStep(i, { who: e.target.value })} />
            <span className="l-row-actions">
              <button type="button" className="l-btn2 l-sm" aria-label={`Đưa bước ${i + 1} lên`} disabled={i === 0} onClick={() => move(i, -1)}>Lên</button>
              <button type="button" className="l-btn2 l-sm" aria-label={`Đưa bước ${i + 1} xuống`} disabled={i === steps.length - 1} onClick={() => move(i, 1)}>Xuống</button>
              <button type="button" className="l-btn2 l-sm" aria-label={`Xóa bước ${i + 1}`} disabled={steps.length === 1} onClick={() => setSteps((l) => l.filter((_, j) => j !== i))}>Xóa bước</button>
            </span>
          </div>
        ))}
        {errors.steps && <span id="kit-proc-steps-error" className="l-error">{errors.steps}</span>}
        <div><button type="button" className="l-btn2 l-sm" onClick={() => setSteps((l) => [...l, { text: "", who: "" }])}><Icon name="plus" size={16} />Thêm bước</button></div>
      </fieldset>
      <fieldset className="l-field">
        <legend className="l-flabel">Biểu mẫu đi kèm</legend>
        {documents.length === 0 ? <span className="l-note">Kho chưa có biểu mẫu nào để chọn.</span> : (
          <div className="l-seg">{documents.map((d) => <button key={d.id} type="button" className="l-chip" aria-pressed={f.documentIds.includes(d.id)} onClick={() => toggleDoc(d.id)}>{d.name}</button>)}</div>
        )}
      </fieldset>
      <div className="l-form-actions">
        <button type="button" className="l-btn2" onClick={() => onDone(false)}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>{process ? "Lưu quy trình" : "Thêm quy trình"}</button>
      </div>
    </form>
  );
}

function AccountForm({ account, holders, onDone }: { account?: KitAccountDto; holders: PersonRef[]; onDone: (saved: boolean) => void }) {
  const { club } = useLichBoard();
  const base = `/clubs/${club.id}/handover-kit/accounts`;
  const [f, setF] = useState({ service: account?.service ?? "", label: account?.label ?? "", holderId: account?.holder?.personId ?? "", ownership: (account?.ownership ?? "club") as "club" | "personal", required: account?.required ?? false });
  const [errors, setErrors] = useState<FormErrors>({});
  const { field, inv, clear, firstError } = useFormShell("kit-acc", errors, setErrors);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); clear(k === "service" ? "name" : k); };
  const save = useClubMutation(club.id, (body: KitAccountBody) => (account ? apiPut<{ account: KitAccountDto }>(`${base}/${account.id}`, body) : apiPost<{ account: KitAccountDto }>(base, body)), {
    onSuccess: (r) => { toast.success(account ? `Đã lưu ${r.account.service}.` : `Đã thêm ${r.account.service}.`); onDone(true); },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const next: FormErrors = {};
    if (!f.service.trim()) next.name = "Cần ghi tên dịch vụ.";
    if (!f.label.trim()) next.label = "Cần ghi tên tài khoản hoặc đường link.";
    setErrors(next);
    if (firstError(next)) return;
    save.mutate({ service: f.service.trim(), label: f.label.trim(), ...(f.holderId ? { holderId: f.holderId } : {}), ownership: f.ownership, required: f.required });
  }
  return (
    <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-labelledby="kit-acc-title">
      <h3 id="kit-acc-title" className="l-subhead">{account ? `Sửa ${account.service}` : "Thêm tài khoản"}</h3>
      <p className="l-note">Không ghi mật khẩu ở đây. Chỉ ghi tên dịch vụ, tên tài khoản hoặc link, và ai đang giữ quyền quản trị.</p>
      <div className="l-form-grid">
        {field("name", "Dịch vụ", <input id="kit-acc-name" className="l-input" value={f.service} placeholder="Ví dụ: Fanpage Facebook, Discord, Google Drive" onChange={(e) => set("service", e.target.value)} {...inv("name")} />, true)}
        {field("label", "Tên tài khoản hoặc đường link", <input id="kit-acc-label" className="l-input" value={f.label} onChange={(e) => set("label", e.target.value)} {...inv("label")} />, true)}
        {field("holder", "Người đang giữ quyền quản trị", <select id="kit-acc-holder" className="l-select" value={f.holderId} onChange={(e) => set("holderId", e.target.value)}><option value="">Chưa có người giữ</option>{holderOptions(holders)}</select>)}
        {field("ownership", "Đứng tên", <select id="kit-acc-ownership" className="l-select" value={f.ownership} onChange={(e) => set("ownership", e.target.value as "club" | "personal")}><option value="club">CLB</option><option value="personal">Cá nhân</option></select>)}
        <div className="l-field l-span-2">
          <label className="l-check"><input id="kit-acc-required" type="checkbox" checked={f.required} onChange={(e) => set("required", e.target.checked)} /> Bắt buộc chuyển khi bàn giao</label>
        </div>
      </div>
      <div className="l-form-actions">
        <button type="button" className="l-btn2" onClick={() => onDone(false)}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>{account ? "Lưu tài khoản" : "Thêm tài khoản"}</button>
      </div>
    </form>
  );
}
