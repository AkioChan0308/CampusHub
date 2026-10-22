"use client";

// Bảng tin của CLB (ban điều hành): KHUNG RỖNG (22/10/2026). Mô tả đang chờ Hiệu duyệt ở docs/mo-ta-bang-tin-chung.md, mục 3.2; chưa có API, chưa có dữ liệu.
// Có sẵn: đường dẫn /clubs/[clubId]/posts trong khung ban điều hành, khung xương lúc tải, trạng thái rỗng.
// Chưa có: danh sách tin của CLB, nút "Đăng tin", form, ẩn tin, mục menu (chờ Hiệu chọn nhóm quyền và chỗ đặt menu, câu hỏi 5 và 6).
// Về sau đắp danh sách và form vào chỗ đã ghi; không cần đổi khung.

import { useParams } from "next/navigation";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichPage, Loading, Reveal, Skel, SkelLine } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";

const TITLE = "Bảng tin của CLB";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="home" fallback={<PostsSkeleton />}>
        <Posts />
      </BoardFrame>
    </LichPage>
  );
}

/** Khung xương: tiêu đề là chữ thật; ba dòng tin là thanh giữ chỗ. */
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
  const { club } = useLichBoard();
  const saw = useFrameSawPending();
  return (
    <>
      <PageTop title={TITLE} sub={`Tin công khai của ${club.name}`} />
      <Reveal from={saw} className="l-sheet">
        <section className="l-sec" aria-labelledby="posts-title">
          <div className="l-sec-head"><h2 id="posts-title">Tin đã đăng</h2></div>
          {/* Về sau: nút "Đăng tin", form và danh sách tin của CLB đặt ở đây. */}
          <p className="l-empty">Chưa có tin nào. Bảng tin đang được dựng; ban điều hành sẽ đăng tin công khai của CLB ở đây.</p>
        </section>
      </Reveal>
    </>
  );
}
