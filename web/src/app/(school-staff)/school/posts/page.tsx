"use client";

// Ban quản lý CLB của trường · Duyệt tin (Hiệu chốt 29/10/2026: duyệt trước, hiện sau; chưa có bản vẽ), thế giới "Lịch bloc".
// Dữ liệu từ GET /school/posts: hàng chờ (chờ lâu nhất trước) và các tin vừa xem xét. Duyệt hoặc từ chối: POST /school/posts/:postId/review;
// từ chối thì bắt buộc ghi lý do (người đăng sẽ thấy lý do). Tin đã duyệt hiện cho mọi người trên Cộng đồng.

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PostDto, PostRes, PostReviewBody } from "@contract";
import { apiPost } from "@/api/client";
import { errorText, keys, useSchoolPosts } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { SchoolFrame } from "@/components/lich/SchoolFrame";
import { agoLabel, dmy } from "@/lib/format";
import { POST_KIND_LABEL, POST_STATUS_LABEL } from "@/lib/types";

const TITLE = "Duyệt tin của CLB";
const SUB = "Tin của CLB chỉ hiện cho mọi người trên Cộng đồng sau khi bạn duyệt. Từ chối thì cần ghi lý do để CLB biết sửa.";

export default function Page() {
  return <LichPage><SchoolFrame active="posts"><Review /></SchoolFrame></LichPage>;
}

function ReviewSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={SUB} />
      <Loading className="l-sheet">
        <section className="l-sec">
          {[0, 1].map((i) => (
            <div key={i} className="l-kit-row">
              <span className="l-kit-main"><span className="l-kit-name"><SkelLine w={[260, 220][i]} /></span><span className="l-note"><SkelLine w={340} /></span></span>
              <span className="l-row-actions"><Skel w={72} h={34} /><Skel w={84} h={34} /></span>
            </div>
          ))}
        </section>
      </Loading>
    </>
  );
}

function Review() {
  const query = useSchoolPosts();
  const client = useQueryClient();
  const saw = useSawPending(!query.data);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const review = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PostReviewBody }) => apiPost<PostRes>(`/school/posts/${id}/review`, body),
    onSuccess: async (r, v) => {
      await Promise.all([client.invalidateQueries({ queryKey: keys.schoolPosts }), client.invalidateQueries({ queryKey: keys.feed })]);
      toast.success(v.body.decision === "approve" ? `Đã duyệt: ${r.post.title}. Tin đã hiện trên Cộng đồng.` : `Đã từ chối: ${r.post.title}.`);
      setRejecting(null); setReason(""); setError("");
    },
    onError: (e) => { toast.error(errorText(e)); void client.invalidateQueries({ queryKey: keys.schoolPosts }); },
  });

  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} /></>;
  if (!query.data) return <ReviewSkeleton />;
  const { pending, reviewed } = query.data;

  function submitReject(e: FormEvent, id: string) {
    e.preventDefault();
    if (review.isPending) return;
    if (!reason.trim()) { setError("Từ chối thì cần ghi lý do."); document.getElementById(`reject-${id}`)?.focus(); return; }
    review.mutate({ id, body: { decision: "reject", reason: reason.trim() } });
  }

  const preview = (p: PostDto) => (
    <span className="l-kit-main">
      <span className="l-kit-name">{p.title}</span>
      <span className="l-note">{p.club.name} · {POST_KIND_LABEL[p.kind]}{p.eventAt ? ` · diễn ra ${dmy(p.eventAt)}` : ""} · {p.author?.name ?? "chưa rõ người đăng"} · gửi {agoLabel(p.createdAt)}</span>
      <span className="l-post-sum">{p.body}</span>
    </span>
  );

  return (
    <>
      <PageTop title={TITLE} sub={SUB} />
      <Reveal from={saw} className="l-sheet">
        <section className="l-sec" aria-labelledby="queue-title">
          <div className="l-sec-head"><h2 id="queue-title">Chờ duyệt ({pending.length})</h2></div>
          {pending.length === 0 && <p className="l-sec-pad l-empty">Không có tin nào chờ duyệt.</p>}
          {pending.map((p) => (
            <div key={p.id} className="l-kit-row">
              {preview(p)}
              <span className="l-row-actions">
                <button type="button" className="l-btn l-sm" aria-label={`Duyệt: ${p.title}`} aria-busy={(review.isPending && review.variables?.id === p.id && review.variables.body.decision === "approve") || undefined}
                  onClick={() => { if (!review.isPending) review.mutate({ id: p.id, body: { decision: "approve" } }); }}>Duyệt</button>
                <button type="button" className="l-btn2 l-sm" aria-label={`Từ chối: ${p.title}`} aria-expanded={rejecting === p.id} onClick={() => { setRejecting(rejecting === p.id ? null : p.id); setReason(""); setError(""); }}>Từ chối</button>
                <Link className="l-btn2 l-sm" href={`/feed/${p.id}`}>Xem</Link>
              </span>
              {rejecting === p.id && (
                <form className="l-form l-span-all" onSubmit={(e) => submitReject(e, p.id)} noValidate aria-label={`Lý do từ chối ${p.title}`}>
                  <label className="l-flabel" htmlFor={`reject-${p.id}`}>Lý do từ chối (CLB sẽ thấy)</label>
                  <textarea id={`reject-${p.id}`} className="l-textarea" rows={2} maxLength={300} value={reason} autoFocus aria-invalid={error ? true : undefined} aria-describedby={error ? `reject-${p.id}-error` : undefined}
                    placeholder="Ví dụ: Thiếu thông tin địa điểm." onChange={(e) => { setReason(e.target.value); setError(""); }} />
                  {error && <span id={`reject-${p.id}-error`} className="l-error">{error}</span>}
                  <div className="l-form-actions">
                    <button type="button" className="l-btn2" onClick={() => setRejecting(null)}>Hủy</button>
                    <button type="submit" className="l-btn" aria-busy={(review.isPending && review.variables?.id === p.id) || undefined}>Gửi từ chối</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </section>
        <section className="l-sec" aria-labelledby="reviewed-title">
          <div className="l-sec-head"><h2 id="reviewed-title">Vừa xem xét</h2></div>
          {reviewed.length === 0 && <p className="l-sec-pad l-empty">Chưa xem xét tin nào.</p>}
          {reviewed.map((p) => (
            <div key={p.id} className="l-kit-row">
              {preview(p)}
              <span className="l-row-actions">
                <span className={`l-tag ${p.status === "approved" ? "ok" : "warn"}`}>{POST_STATUS_LABEL[p.status]}</span>
                {p.status === "rejected" && p.rejectReason && <span className="l-note">Lý do: {p.rejectReason}</span>}
              </span>
            </div>
          ))}
        </section>
      </Reveal>
    </>
  );
}
