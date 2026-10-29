"use client";

// Chi tiết một tin của trang chung (DỮ LIỆU MẪU, lib/feed-sample.ts). Từ đây bấm tên CLB để xem giới thiệu, hoặc "Nhắn cho CLB" (khung chat mẫu).

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMe } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { isUrgent, Leaf, TodayLeaf } from "@/components/lich/Leaf";
import { ChatButton } from "@/components/lich/ChatBubble";
import { LichPage, Reveal, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { POST_KIND_LABEL, samplePost } from "@/lib/feed-sample";
import { agoLabel, hm, longDate } from "@/lib/format";

const BACK = { href: "/feed", label: "Trang chung" };

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const me = useMe();
  const saw = useSawPending(me.isPending);
  const post = useMemo(() => samplePost(postId), [postId]);

  if (me.isError) return <ErrorGate error={me.error} onRetry={() => void me.refetch()} back={{ href: "/feed", label: "Về trang chung" }} />;

  return (
    <LichPage>
      <PhoneFrame back={BACK} personName={me.data?.person.name} tab="feed" fade={saw}>
        <Reveal from={saw} className="l-pay-body">
          {!post ? (
            <section className="l-pay-card">
              <h1 className="l-subhead">Không tìm thấy tin này</h1>
              <p className="l-fine">Tin có thể đã bị ẩn hoặc đường dẫn bị sai.</p>
              <Link className="l-btn2 l-lg" href="/feed">Về trang chung</Link>
            </section>
          ) : (
            <>
              <div className="l-ptop">
                {post.eventAt ? <Leaf date={post.eventAt} size="md" tone={isUrgent(post.eventAt) ? "urgent" : undefined} /> : <TodayLeaf size="md" />}
                <div className="l-ptop-text">
                  <h1 className="l-phone-title">{post.title}</h1>
                  <span className="l-ptop-sub"><Link href={`/explore/${post.clubId}`}>{post.clubName}</Link> · {POST_KIND_LABEL[post.kind]} · đăng {agoLabel(post.postedAt)}</span>
                </div>
              </div>
              {post.eventAt && (
                <section className="l-pay-card l-list" aria-label="Thời gian và nơi diễn ra">
                  <div className="l-kv"><span>Thời gian</span><span className="l-kv-value">{longDate(post.eventAt)}, {hm(post.eventAt)}</span></div>
                  {post.place && <div className="l-kv"><span>Nơi diễn ra</span><span className="l-kv-value">{post.place}</span></div>}
                </section>
              )}
              <p className="l-club-about">{post.body}</p>
              <p className="l-note">Dữ liệu mẫu: tin này do nhóm viết để minh họa.</p>
              <div className="l-row-actions">
                <ChatButton className="l-btn2 l-lg" to={{ id: post.clubId, name: post.clubName }}>Nhắn cho CLB</ChatButton>
                <Link className="l-btn2 l-lg" href={`/explore/${post.clubId}`}>Xem CLB</Link>
              </div>
            </>
          )}
        </Reveal>
      </PhoneFrame>
    </LichPage>
  );
}
