"use client";

// Trợ lý cho bàn giao (bản mẫu; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.5). Không phải chatbot chung.
// AiAsk: hỏi đáp trong Kho bàn giao, chỉ từ nội dung kho, luôn kèm mục nguồn. AiSummary: bản nháp tóm tắt cho ban mới, ban điều hành sửa rồi mới lưu vào biên bản.
// Trợ lý không tự gửi cho ai và không tự đổi dữ liệu. Bản mẫu tính từ dữ liệu của CLB nên màn ghi rõ "Bản mẫu, chưa dùng AI thật".

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { AiAskRes, AiSourceDto, AiSummaryRes, AiUsageDto, HandoverRes } from "@contract";
import { apiPost, apiPut } from "@/api/client";
import { errorText, useAiStatus, useClubMutation } from "@/api/queries";
import { SkelLine } from "./motion";

export const MOCK_NOTE = "Bản mẫu: câu trả lời lấy từ dữ liệu mẫu, chưa dùng AI thật.";

function usageText(u: AiUsageDto) {
  return u.limit !== undefined
    ? `Đã hỏi ${u.asks} / ${u.limit} lượt trong kỳ này (bản miễn phí).`
    : `Đã hỏi ${u.asks} lượt trong kỳ này. Bản miễn phí giới hạn lượt hỏi theo kỳ; mức giới hạn: chưa có.`;
}

const KIND_LABEL: Record<AiSourceDto["kind"], string> = { document: "Biểu mẫu", process: "Quy trình", account: "Tài khoản" };

/** Ô "Hỏi về bàn giao". onOpenSource: mở mục nguồn ở màn kho. */
export function AiAsk({ clubId, onOpenSource }: { clubId: string; onOpenSource: (source: AiSourceDto) => void }) {
  const status = useAiStatus(clubId);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AiAskRes | null>(null);
  const [error, setError] = useState("");
  const ask = useClubMutation(clubId, (q: string) => apiPost<AiAskRes>(`/clubs/${clubId}/ai/ask`, { question: q }), {
    onSuccess: (r) => { setResult(r); setError(""); },
    onError: (e) => { setError(errorText(e)); setResult(null); },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ask.isPending) return;
    const q = question.trim();
    if (q.length < 3) { setError("Gõ câu hỏi dài hơn, ví dụ: Mẫu xin phép sự kiện ở đâu?"); document.getElementById("ai-question")?.focus(); return; }
    setError("");
    ask.mutate(q);
  }

  const usage = result?.usage ?? status.data?.usage;
  const mock = (result?.mode ?? status.data?.mode) !== "real";
  return (
    <form className="l-form" onSubmit={submit} noValidate aria-labelledby="ai-ask-title">
      <h2 id="ai-ask-title" className="l-subhead">Hỏi về bàn giao</h2>
      <div className="l-ai-row">
        <input id="ai-question" className="l-input" value={question} maxLength={300} placeholder="Ví dụ: Mẫu xin phép sự kiện ở đâu? Ai giữ quyền fanpage?" aria-label="Câu hỏi về bàn giao"
          aria-invalid={error ? true : undefined} aria-describedby={error ? "ai-ask-error ai-ask-note" : "ai-ask-note"} onChange={(e) => { setQuestion(e.target.value); setError(""); }} />
        <button type="submit" className="l-btn" aria-busy={ask.isPending || undefined}>Hỏi</button>
      </div>
      {error && <span id="ai-ask-error" className="l-error" role="alert">{error}</span>}
      <div aria-live="polite">
        {result && (
          <div className="l-ai-answer">
            <p className="l-ai-text">{result.answer}</p>
            {result.sources.length > 0 && (
              <div className="l-kit-tags">
                <span className="l-note">Nguồn:</span>
                {result.sources.map((src) => (
                  <button key={`${src.kind}-${src.id}`} type="button" className="l-chip" onClick={() => onOpenSource(src)}>{KIND_LABEL[src.kind]}: {src.name}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p id="ai-ask-note" className="l-note">
        {mock && <>{MOCK_NOTE} </>}
        Trợ lý chỉ trả lời từ nội dung kho bàn giao, không trả lời về tiền hay dữ liệu cá nhân. {usage ? usageText(usage) : <SkelLine w={220} />}
      </p>
    </form>
  );
}

/**
 * Nút "Tóm tắt cho ban mới" và bản nháp. canSave: người xem được lưu vào biên bản (chủ nhiệm, và biên bản chưa khóa).
 * Lưu rồi mới vào biên bản; đóng bản nháp thì bỏ, không lưu gì.
 */
export function AiSummary({ clubId, canSave, saveHint, onSaved }: { clubId: string; canSave: boolean; saveHint?: string; onSaved?: (r: HandoverRes) => void }) {
  const [draft, setDraft] = useState<AiSummaryRes | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const makeBtn = useRef<HTMLButtonElement>(null);
  const closeDraft = () => { setDraft(null); setError(""); setTimeout(() => makeBtn.current?.focus(), 0); };
  const make = useClubMutation(clubId, () => apiPost<AiSummaryRes>(`/clubs/${clubId}/ai/summary`), {
    onSuccess: (r) => { setDraft(r); setText(r.text); setError(""); setTimeout(() => document.getElementById("ai-summary-text")?.focus(), 0); },
    onError: (e) => setError(errorText(e)),
  });
  const save = useClubMutation(clubId, (t: string) => apiPut<HandoverRes>(`/clubs/${clubId}/handover/summary`, { text: t }), {
    onSuccess: (r) => { toast.success("Đã lưu bản tóm tắt vào biên bản."); closeDraft(); onSaved?.(r); },
    onError: (e) => setError(errorText(e)),
  });

  return (
    <div className="l-form">
      <div className="l-ai-row">
        <h2 className="l-subhead">Tóm tắt cho ban mới</h2>
        {!draft && <button ref={makeBtn} type="button" className="l-btn2" aria-busy={make.isPending || undefined} onClick={() => { if (!make.isPending) make.mutate(undefined); }}>Tóm tắt</button>}
      </div>
      {!draft && <p className="l-note">Một bản nháp: việc còn dở, hạn sắp tới, kho còn thiếu, tài khoản chưa chuyển, ai hỏi lại. Bạn sửa rồi mới lưu vào biên bản. Bản mẫu, chưa dùng AI thật.</p>}
      {error && <span className="l-error" role="alert">{error}</span>}
      {draft && (
        <div className="l-form">
          <div className="l-kit-tags">
            {/* Bản mẫu thì nhãn là "Bản mẫu, chưa dùng AI thật" thay cho "AI viết, cần kiểm tra" (mục 5.5): không vừa nói AI viết vừa nói chưa dùng AI. */}
            {draft.mode === "mock" ? <span className="l-tag warn">Bản mẫu, chưa dùng AI thật</span> : <span className="l-tag off">AI viết, cần kiểm tra</span>}
          </div>
          <label className="l-flabel" htmlFor="ai-summary-text">Bản tóm tắt (sửa được)</label>
          <textarea id="ai-summary-text" className="l-input l-ai-textarea" rows={9} value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} />
          <p className="l-note">Trợ lý không tự gửi cho ai và không tự đổi dữ liệu. Chỉ khi bạn bấm lưu thì bản này mới vào biên bản (ghi ai lưu, lúc nào).</p>
          {!canSave && <p className="l-note" id="ai-save-hint">{saveHint ?? "Chỉ chủ nhiệm lưu được vào biên bản."}</p>}
          <div className="l-form-actions">
            <button type="button" className="l-btn2" onClick={closeDraft}>Đóng, không lưu</button>
            <button type="button" className="l-btn" disabled={!canSave || !text.trim()} aria-describedby={canSave ? undefined : "ai-save-hint"} aria-busy={save.isPending || undefined}
              onClick={() => { if (!save.isPending) save.mutate(text.trim()); }}>Lưu vào biên bản</button>
          </div>
        </div>
      )}
    </div>
  );
}
