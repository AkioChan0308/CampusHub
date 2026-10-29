"use client";

// Chi tiết một tin của Cộng đồng (GET /posts/:postId). Từ đây bấm tên CLB để xem giới thiệu, hoặc "Nhắn cho CLB" (khung chat mẫu).
// Tin chưa duyệt chỉ người đăng, ban điều hành CLB đó và cán bộ trường mở được (người khác nhận "không tìm thấy"); màn ghi rõ trạng thái và lý do từ chối.

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePost, useMe } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { isUrgent, Leaf, TodayLeaf } from "@/components/lich/Leaf";
import { ChatButton } from "@/components/lich/ChatBubble";
import { LichPage, Reveal, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { agoLabel, hm, longDate } from "@/lib/format";
import { POST_KIND_LABEL, POST_STATUS_LABEL } from "@/lib/types";

const BACK = { href: "/feed", label: "Cộng đồng" };

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const me = useMe();
  const query = usePost(postId);
  const saw = useSawPending(me.isPending || query.isPending);
  const post = query.data?.post;
  const event = post?.eventAt ? Date.parse(post.eventAt) : undefined;

  if (me.isError) return <ErrorGate error={me.error} onRetry={() => void me.refetch()} back={{ href: "/feed", label: "Về Cộng đồng" }} />;

  return (
    <LichPage>
      <PhoneFrame back={BACK} personName={me.data?.person.name} tab="feed" fade={saw}>
        <Reveal from={saw} className="l-pay-body">
          {query.isPending ? (
            <section className="l-pay-card" aria-busy="true"><h1 className="l-subhead">Đang mở tin…</h1></section>
          ) : !post ? (
            <section className="l-pay-card">
              <h1 className="l-subhead">Không tìm thấy tin này</h1>
              <p className="l-fine">Tin có thể đã bị ẩn hoặc đường dẫn bị sai.</p>
              <Link className="l-btn2 l-lg" href="/feed">Về Cộng đồng</Link>
            </section>
          ) : (
            <>
              <div className="l-ptop">
                {event !== undefined ? <Leaf date={event} size="md" tone={isUrgent(event) ? "urgent" : undefined} /> : <TodayLeaf size="md" />}
                <div className="l-ptop-text">
                  <h1 className="l-phone-title">{post.title}</h1>
                  <span className="l-ptop-sub"><Link href={`/explore/${post.club.id}`}>{post.club.name}</Link> · {POST_KIND_LABEL[post.kind]} · đăng {agoLabel(post.createdAt)}</span>
                </div>
              </div>
              {post.status !== "approved" && (
                <section className="l-pay-card" aria-label="Trạng thái tin">
                  <p><span className={`l-tag ${post.status === "rejected" ? "warn" : "wait"}`}>{POST_STATUS_LABEL[post.status]}</span></p>
                  <p className="l-fine">{post.status === "rejected"
                    ? `Cán bộ trường đã từ chối tin này${post.rejectReason ? `: ${post.rejectReason}` : "."} Tin không hiện cho mọi người.`
                    : "Tin chưa hiện cho mọi người. Khi cán bộ trường duyệt, tin sẽ hiện trên Cộng đồng."}</p>
                </section>
              )}
              {event !== undefined && (
                <section className="l-pay-card l-list" aria-label="Thời gian và nơi diễn ra">
                  <div className="l-kv"><span>Thời gian</span><span className="l-kv-value">{longDate(event)}, {hm(event)}</span></div>
                  {post.place && <div className="l-kv"><span>Nơi diễn ra</span><span className="l-kv-value">{post.place}</span></div>}
                </section>
              )}
              <p className="l-club-about">{post.body}</p>
              <div className="l-row-actions">
                <ChatButton className="l-btn2 l-lg" to={{ id: post.club.id, name: post.club.name }}>Nhắn cho CLB</ChatButton>
                <Link className="l-btn2 l-lg" href={`/explore/${post.club.id}`}>Xem CLB</Link>
              </div>
            </>
          )}
        </Reveal>
      </PhoneFrame>
    </LichPage>
  );
}
