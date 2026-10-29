"use client";

// Bảng tin của CLB (ban điều hành): KHUNG MẪU (Hiệu chọn 29/10/2026: phần nặng chỉ làm khung và ghi "đang phát triển").
// Có: mục menu "Bảng tin của CLB", danh sách tin mẫu của CLB (lib/feed-sample.ts), nút "Đăng tin" chỉ báo đang phát triển.
// Quyền đăng tin (`post`: chủ nhiệm, phó chủ nhiệm, trưởng ban) đã có trong bảng quyền; thủ quỹ thấy nút khóa kèm lý do.
// Chưa có: form đăng tin, sửa, ẩn tin, API. Việc cán bộ trường duyệt tin để sau. Mô tả: docs/mo-ta-bang-tin-chung.md, mục 3.4b.

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichPage, Loading, Reveal, Skel, SkelLine } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { PostRow } from "@/components/lich/Post";
import { samplePosts } from "@/lib/feed-sample";
import { can, RIGHT_LABEL } from "@/lib/selectors";

const TITLE = "Bảng tin của CLB";
const POSTING_SOON = "Tính năng đăng tin đang phát triển";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
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
  const saw = useFrameSawPending();
  const mine = useMemo(() => samplePosts().filter((p) => p.clubId === club.id), [club.id]);
  const allowed = can(me.role, "post");
  return (
    <>
      <PageTop
        title={TITLE}
        sub={`Tin công khai của ${club.name}`}
        actions={allowed
          ? <button type="button" className="l-btn" onClick={() => toast(POSTING_SOON)}>Đăng tin</button>
          : <span className="l-top-lock"><button type="button" className="l-btn" aria-disabled="true" aria-describedby="post-locked" onClick={() => toast(RIGHT_LABEL.post)}>Đăng tin</button><span id="post-locked" className="l-note">{RIGHT_LABEL.post}</span></span>}
      />
      <Reveal from={saw} className="l-sheet">
        <section className="l-sec" aria-labelledby="posts-title">
          <div className="l-sec-head"><h2 id="posts-title">Tin đã đăng</h2></div>
          <div className="l-sec-pad">
            <p className="l-placeholder">Dữ liệu mẫu: bảng tin đang phát triển. Đăng tin thật, sửa và ẩn tin chưa làm được; tin dưới đây do nhóm viết để minh họa.</p>
            {mine.length > 0
              ? <ul className="l-posts">{mine.map((p) => <PostRow key={p.id} post={p} />)}</ul>
              : <p className="l-empty">CLB chưa có tin nào.</p>}
          </div>
        </section>
      </Reveal>
    </>
  );
}
