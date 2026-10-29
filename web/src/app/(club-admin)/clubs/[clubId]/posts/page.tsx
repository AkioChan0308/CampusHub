"use client";

// Bảng tin của CLB (ban điều hành; Hiệu chốt 29/10/2026: duyệt trước, hiện sau). Dữ liệu từ GET /clubs/:clubId/posts (mọi trạng thái, kèm người đăng), đăng tin: POST .../posts.
// Chủ nhiệm, phó chủ nhiệm, trưởng ban đăng được (quyền `post`); thủ quỹ thấy nút khóa kèm lý do. Tin mới luôn chờ cán bộ trường duyệt: ở đây hiện mờ kèm nhãn
// "Chờ trường duyệt" (người đăng cũng thấy mờ ở Cộng đồng), được duyệt thì hiện cho mọi người. Bị từ chối thì kèm lý do.
// Chưa có: sửa tin bị từ chối rồi gửi lại, ẩn tin đã duyệt, ảnh đính kèm. Mô tả: docs/mo-ta-bang-tin-chung.md.

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PostBody, PostDto, PostKind, PostRes } from "@contract";
import { apiPost, apiPut } from "@/api/client";
import { keys, useClubMutation, useClubPosts } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { PostRow } from "@/components/lich/Post";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { POST_KIND_LABEL } from "@/lib/types";

const TITLE = "Bảng tin của CLB";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useClubPosts(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="posts" fallback={<PostsSkeleton />}>
        <Posts />
      </BoardFrame>
    </LichPage>
  );
}

/** Khung xương: tiêu đề và nút là chữ thật; ba dòng tin là thanh giữ chỗ. */
function PostsSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={260} />} actions={<Skel w={110} h={40} />} />
      <Loading className="l-sheet">
        <section className="l-sec">
          {[0, 1, 2].map((i) => (
            <div key={i} className="l-kit-row">
              <span className="l-kit-main"><span className="l-kit-name"><SkelLine w={[240, 190, 260][i]} /></span><span className="l-note"><SkelLine w={320} /></span></span>
              <span className="l-row-actions"><Skel w={56} h={34} /></span>
            </div>
          ))}
        </section>
      </Loading>
    </>
  );
}

function Posts() {
  const { club, me } = useLichBoard();
  const fade = useFrameSawPending();
  const query = useClubPosts(club.id);
  const saw = useSawPending(query.isPending) || fade;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PostDto | null>(null); // tin bị từ chối đang sửa để gửi lại
  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  if (!query.data) return <PostsSkeleton />;
  const posts = query.data.posts;
  const waiting = posts.filter((p) => p.status === "pending").length;
  const allowed = can(me.role, "post");
  return (
    <>
      <PageTop
        title={TITLE}
        sub={`Tin của ${club.name} trên Cộng đồng${waiting > 0 ? ` · ${waiting} tin chờ trường duyệt` : ""}`}
        actions={allowed
          ? <button type="button" className="l-btn" aria-expanded={open && !editing} onClick={() => { setEditing(null); setOpen((v) => (editing ? true : !v)); }}><Icon name="plus" size={18} />Đăng tin</button>
          : <span className="l-top-lock"><button type="button" className="l-btn" aria-disabled="true" aria-describedby="post-locked" onClick={() => toast(RIGHT_LABEL.post)}>Đăng tin</button><span id="post-locked" className="l-note">{RIGHT_LABEL.post}</span></span>}
      />
      <Reveal from={saw} className="l-sheet">
        <AnimatePresence initial={false}>
          {open && (
            <m.div key={editing?.id ?? "form"} className="l-sec l-collapse" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <PostForm key={editing?.id ?? "new"} clubId={club.id} post={editing ?? undefined} onDone={() => { setOpen(false); setEditing(null); }} />
            </m.div>
          )}
        </AnimatePresence>
        <section className="l-sec" aria-labelledby="posts-title">
          <div className="l-sec-head"><h2 id="posts-title">Tin đã đăng</h2></div>
          <div className="l-sec-pad">
            <p className="l-fine">Tin mới cần cán bộ trường duyệt rồi mới hiện cho mọi người trên Cộng đồng. Tin chờ duyệt hoặc bị từ chối hiện mờ.</p>
            {posts.length > 0
              ? (
                <ul className="l-posts">
                  {posts.map((p) => (
                    <PostRow key={p.id} post={p} internal action={allowed && p.status === "rejected"
                      ? <button type="button" className="l-btn2 l-sm" aria-label={`Sửa và gửi lại: ${p.title}`} onClick={() => { setEditing(p); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Sửa và gửi lại</button>
                      : undefined} />
                  ))}
                </ul>
              )
              : <p className="l-empty">CLB chưa có tin nào. Bấm Đăng tin để viết tin đầu tiên.</p>}
          </div>
        </section>
      </Reveal>
    </>
  );
}

interface Fields { kind: PostKind; title: string; body: string; date: string; time: string; place: string }

/** post: tin bị từ chối đang sửa để gửi lại (điền sẵn nội dung cũ); không có thì là tin mới. Giờ trong tin là giờ Việt Nam ("2026-10-24T08:00:00+07:00"), cắt chuỗi để lấy ngày và giờ. */
function PostForm({ clubId, post, onDone }: { clubId: string; post?: PostDto; onDone: () => void }) {
  const client = useQueryClient();
  const [f, setF] = useState<Fields>({ kind: post?.kind ?? "news", title: post?.title ?? "", body: post?.body ?? "", date: post?.eventAt?.slice(0, 10) ?? "", time: post?.eventAt?.slice(11, 16) ?? "", place: post?.place ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((x) => ({ ...x, [k]: undefined })); };
  useEffect(() => { document.getElementById("post-title")?.focus(); }, []);
  const save = useClubMutation(clubId, (body: PostBody) => (post ? apiPut<PostRes>(`/clubs/${clubId}/posts/${post.id}`, body) : apiPost<PostRes>(`/clubs/${clubId}/posts`, body)), {
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.feed });
      toast.success(post ? "Đã gửi lại. Tin chờ cán bộ trường duyệt." : "Đã gửi tin. Tin hiện cho mọi người sau khi cán bộ trường duyệt.");
      onDone();
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!f.title.trim()) next.title = "Cần ghi tiêu đề.";
    if (!f.body.trim()) next.body = "Cần ghi nội dung.";
    if (f.kind === "event" && !f.date) next.date = "Sự kiện cần ghi ngày diễn ra.";
    setErrors(next);
    const first = (Object.keys(next) as (keyof Fields)[])[0];
    if (first) { document.getElementById(`post-${first}`)?.focus(); return; }
    save.mutate({
      kind: f.kind, title: f.title.trim(), body: f.body.trim(),
      ...(f.kind === "event" ? { eventAt: `${f.date}T${f.time || "08:00"}:00+07:00`, ...(f.place.trim() ? { place: f.place.trim() } : {}) } : {}),
    });
  }
  const field = (k: keyof Fields, label: string, input: ReactNode, wide = false) => (
    <div className={`l-field${wide ? " l-span-2" : ""}`}>
      <label className="l-flabel" htmlFor={`post-${k}`}>{label}</label>
      {input}
      {errors[k] && <span id={`post-${k}-error`} className="l-error">{errors[k]}</span>}
    </div>
  );
  const inv = (k: keyof Fields) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `post-${k}-error` : undefined });
  return (
    <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-labelledby="post-form">
      <h2 id="post-form" className="l-subhead">{post ? "Sửa và gửi lại" : "Đăng tin"}</h2>
      {post?.rejectReason && <p className="l-attn" role="status">Trường đã từ chối tin này: {post.rejectReason}</p>}
      <div className="l-form-grid">
        {field("kind", "Loại tin", (
          <select id="post-kind" className="l-select" value={f.kind} onChange={(e) => set("kind", e.target.value as PostKind)}>
            {(Object.keys(POST_KIND_LABEL) as PostKind[]).map((k) => <option key={k} value={k}>{POST_KIND_LABEL[k]}</option>)}
          </select>
        ), true)}
        {field("title", "Tiêu đề", <input id="post-title" className="l-input" value={f.title} maxLength={120} placeholder="Ví dụ: Giải cầu lông nội bộ Fall 2026" onChange={(e) => set("title", e.target.value)} {...inv("title")} />, true)}
        {field("body", "Nội dung", <textarea id="post-body" className="l-textarea" rows={4} value={f.body} maxLength={2000} onChange={(e) => set("body", e.target.value)} {...inv("body")} />, true)}
        {f.kind === "event" && field("date", "Ngày diễn ra", <input id="post-date" className="l-input" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} {...inv("date")} />)}
        {f.kind === "event" && field("time", "Giờ (không bắt buộc, mặc định 08:00)", <input id="post-time" className="l-input" type="time" value={f.time} onChange={(e) => set("time", e.target.value)} />)}
        {f.kind === "event" && field("place", "Nơi diễn ra (không bắt buộc)", <input id="post-place" className="l-input" value={f.place} maxLength={120} onChange={(e) => set("place", e.target.value)} />, true)}
      </div>
      <p className="l-fine">Tin chưa hiện cho mọi người cho tới khi cán bộ trường duyệt. Bạn vẫn thấy tin của mình, hiện mờ kèm nhãn "Chờ trường duyệt".</p>
      <div className="l-form-actions">
        <button type="button" className="l-btn2" onClick={onDone}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>{post ? "Gửi lại" : "Gửi tin"}</button>
      </div>
    </form>
  );
}
