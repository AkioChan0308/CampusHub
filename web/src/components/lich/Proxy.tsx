"use client";

// Bàn giao hộ (09/11/2026): phần dùng chung của trang Bàn giao từng vai (ban điều hành) và trang chi tiết CLB của mentor.
// Nhật ký liên hệ kèm ảnh bằng chứng (ảnh chỉ người gửi yêu cầu và mentor xem), nút duyệt hoặc từ chối bằng chứng, nút mentor thực hiện bàn giao hộ vai chủ nhiệm.

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type { EvidenceRes, RoleHandoverDto, RoleHandoversRes } from "@contract";
import { apiGet, apiPost } from "@/api/client";
import { errorText, keys, useClubMutation } from "@/api/queries";
import { LichConfirm } from "@/components/lich/Confirm";
import { DialogClose, LichDialog } from "@/components/lich/Dialog";
import { bareDept, dmy } from "@/lib/format";
import { CONTACT_CHANNEL_LABEL } from "@/lib/actions";
import { ROLE_LABEL } from "@/lib/types";

/** Một ảnh bằng chứng: bấm "Xem ảnh" thì mới tải (ảnh nặng), hiện ngay trong trang. */
export function EvidencePhoto({ clubId, id, name }: { clubId: string; id: string; name: string }) {
  const [src, setSrc] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await apiGet<EvidenceRes>(`/clubs/${clubId}/evidence/${id}`);
      setSrc(`data:${r.mime};base64,${r.dataBase64}`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (src) return <img src={src} alt={`Ảnh bằng chứng: ${name}`} className="l-evidence" />;
  return (
    <>
      <button type="button" className="l-btn2 l-sm" aria-busy={busy || undefined} onClick={load}>Xem ảnh {name}</button>
      {error && <span className="l-error" role="alert"> {error}</span>}
    </>
  );
}

/** Nhật ký liên hệ của một đơn bàn giao hộ. Người không được xem ảnh chỉ thấy số ảnh. */
export function ContactLog({ clubId, h }: { clubId: string; h: RoleHandoverDto }) {
  if (!h.contacts?.length) return null;
  return (
    <section className="l-field" aria-label="Nhật ký liên hệ với người giữ vai">
      <h4>Nhật ký liên hệ với {h.from.name} ({h.contacts.length} lần)</h4>
      <ul className="l-ho-list">
        {h.contacts.map((c, i) => (
          <li key={i}>
            {dmy(c.date)} · {CONTACT_CHANNEL_LABEL[c.channel]} · {c.result}
            {c.evidence
              ? (c.evidence.length > 0 ? <div className="l-evidence-row">{c.evidence.map((e) => <EvidencePhoto key={e.id} clubId={clubId} id={e.id} name={e.name} />)}</div>
                : c.evidenceCount > 0 ? " · ảnh đã bị xóa sau 30 ngày" : "")
              : (c.evidenceCount > 0 ? ` · ${c.evidenceCount} ảnh (chỉ người gửi và người duyệt xem)` : "")}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Duyệt hoặc từ chối bằng chứng (mentor, hoặc phó chủ nhiệm khi CLB chưa có mentor), và nút mentor thực hiện vai chủ nhiệm. Dùng được ngoài khung ban điều hành. */
export function ProxyReview({ clubId, h }: { clubId: string; h: RoleHandoverDto }) {
  const client = useQueryClient();
  const [reject, setReject] = useState(false);
  const [why, setWhy] = useState("");
  const [error, setError] = useState("");
  const done = (text: string) => { toast.success(text); setReject(false); void client.invalidateQueries({ queryKey: ["school"] }); void client.invalidateQueries({ queryKey: keys.notifications }); };
  const decide = useClubMutation(clubId, (b: { approve: boolean; reason?: string }) => apiPost<RoleHandoversRes>(`/clubs/${clubId}/role-handovers/${h.id}/decision`, b), {
    onSuccess: (_r, v) => done(v.approve ? "Đã duyệt bằng chứng. Người giữ vai được báo và bắt đầu chờ 3 ngày." : "Đã từ chối bằng chứng."),
    onError: (e) => setError(errorText(e)),
  });
  const execute = useClubMutation(clubId, () => apiPost<RoleHandoversRes>(`/clubs/${clubId}/role-handovers/${h.id}/execute`), {
    onSuccess: () => done("Đã thực hiện bàn giao hộ. Chờ người nhận xác nhận."),
  });
  if (!h.can.decide && !h.can.execute) return null;
  return (
    <div className="l-row-actions">
      {h.can.decide && (
        <>
          <LichConfirm className="l-btn" busy={decide.isPending} title="Duyệt bằng chứng?" confirm="Duyệt bằng chứng" label={`Duyệt bằng chứng bàn giao hộ vai ${h.role === "head" && h.department ? `trưởng ban ${bareDept(h.department)}` : ROLE_LABEL[h.role].toLowerCase()}`}
            description={`${h.from.name} sẽ được báo và có 3 ngày để bấm "Tôi vẫn đảm nhận". Im lặng hết 3 ngày thì việc bàn giao hộ được làm tiếp. Vai chỉ đổi khi ${h.to.name} xác nhận.`}
            onConfirm={() => decide.mutate({ approve: true })}>Duyệt bằng chứng</LichConfirm>
          <button type="button" className="l-btn2" aria-label={`Từ chối bằng chứng bàn giao hộ của ${h.from.name}`} onClick={() => { setWhy(""); setError(""); setReject(true); }}>Từ chối</button>
          <LichDialog open={reject} onOpenChange={setReject} title="Từ chối bằng chứng" description="Ghi lý do (ví dụ ảnh chưa rõ, thiếu lần liên hệ). Người gửi nhận thông báo và gửi yêu cầu mới. Người giữ vai chưa bị báo.">
            <form className="l-form" noValidate onSubmit={(e) => {
              e.preventDefault();
              if (decide.isPending) return;
              if (!why.trim()) { setError("Cần ghi lý do từ chối."); document.getElementById(`proxy-reject-${h.id}`)?.focus(); return; }
              decide.mutate({ approve: false, reason: why.trim() });
            }}>
              <div className="l-field">
                <label className="l-flabel" htmlFor={`proxy-reject-${h.id}`}>Lý do</label>
                <textarea id={`proxy-reject-${h.id}`} className="l-textarea" rows={3} maxLength={500} value={why} onChange={(e) => { setWhy(e.target.value); setError(""); }} />
                {error && <span className="l-error" role="alert">{error}</span>}
              </div>
              <div className="l-dialog-actions">
                <DialogClose className="l-btn2">Hủy</DialogClose>
                <button type="submit" className="l-btn" aria-busy={decide.isPending || undefined}>Từ chối bằng chứng</button>
              </div>
            </form>
          </LichDialog>
        </>
      )}
      {h.can.execute && (
        <LichConfirm className="l-btn" busy={execute.isPending} title="Thực hiện bàn giao hộ vai chủ nhiệm?" confirm="Thực hiện"
          description={`Mọi tài khoản trong kho bàn giao mà ${h.from.name} đang giữ sẽ ghi sang ${h.to.name}. Đổi quyền thật vẫn làm ở chính dịch vụ. Xong thì ${h.to.name} xác nhận ở bước 6 và mới nhận vai chủ nhiệm.`}
          onConfirm={() => execute.mutate(undefined)}>Thực hiện bàn giao hộ</LichConfirm>
      )}
    </div>
  );
}
