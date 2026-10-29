"use client";

// Cộng đồng (tên cũ: Trang chung; Hiệu yêu cầu 29/10/2026): nơi các CLB đăng sự kiện, quảng bá, tin tức; ai đã đăng nhập cũng vào được, logo CampusHub ở mọi màn dẫn về đây.
// Tin lấy từ GET /feed. Duyệt trước, hiện sau: chỉ tin đã được trường duyệt hiện cho mọi người; tin chưa duyệt hoặc bị từ chối của chính người xem hiện mờ kèm nhãn.
// Việc lọc "CLB của tôi" làm ở màn này theo danh sách CLB của người xem. Mô tả đầy đủ: docs/mo-ta-bang-tin-chung.md.

import Link from "next/link";
import { useState } from "react";
import { useFeed, useMe } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, Loading, Reveal, SkelLine, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { PostRow } from "@/components/lich/Post";
import { POST_KIND_LABEL, type PostKind } from "@/lib/types";

type Scope = "all" | "mine";
const SCOPES: { key: Scope; label: string }[] = [
  { key: "all", label: "Tin chung" },
  { key: "mine", label: "CLB của tôi" },
];
const KINDS: { key: PostKind | "all"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  ...(Object.keys(POST_KIND_LABEL) as PostKind[]).map((k) => ({ key: k, label: POST_KIND_LABEL[k] })),
];

/** Đầu màn: tờ lịch hôm nay và tiêu đề. Dùng chung cho màn thật và khung xương để vị trí luôn khớp. */
function Top({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="l-ptop">
        <TodayLeaf size="md" />
        <div className="l-ptop-text"><h1 className="l-phone-title">Cộng đồng</h1><span className="l-ptop-sub">Tin của các CLB</span></div>
      </div>
      {children}
    </>
  );
}

function FeedSkeleton() {
  return (
    <PhoneFrame brand tab="feed">
      <div className="l-pay-body">
        <Top>
          <div className="l-seg" aria-hidden="true">{SCOPES.map((s) => <span key={s.key} className="l-chip">{s.label}</span>)}</div>
          <div className="l-seg" aria-hidden="true">{KINDS.map((k) => <span key={k.key} className="l-chip">{k.label}</span>)}</div>
        </Top>
        <Loading className="l-pay-card l-att-rows">
          {[0, 1, 2].map((i) => (
            <div key={i} className="l-att-row">
              <LeafSkel sub="Thứ Bảy" />
              <span className="l-field"><span className="l-att-row-title"><SkelLine w={[190, 150, 210][i]} /></span><span className="l-att-present"><SkelLine w={120} /></span></span>
            </div>
          ))}
        </Loading>
      </div>
    </PhoneFrame>
  );
}

export default function FeedPage() {
  const me = useMe();
  const [scope, setScope] = useState<Scope>("all");
  const [kind, setKind] = useState<PostKind | "all">("all");
  const feed = useFeed();
  const saw = useSawPending(me.isPending || feed.isPending);

  if (me.isError) return <ErrorGate error={me.error} onRetry={() => void me.refetch()} />;
  if (feed.isError) return <ErrorGate error={feed.error} onRetry={() => void feed.refetch()} />;
  if (me.isPending || feed.isPending) return <LichPage><FeedSkeleton /></LichPage>;
  const mine = new Set(me.data.memberships.filter((m) => m.invite === "accepted").map((m) => m.clubId));
  const shown = feed.data.posts.filter((p) => (scope === "all" || mine.has(p.club.id)) && (kind === "all" || p.kind === kind));

  return (
    <LichPage>
      <PhoneFrame brand personName={me.data.person.name} tab="feed" fade={saw}>
        <div className="l-pay-body">
          <Top>
            <div className="l-seg" role="group" aria-label="Chọn phần của Cộng đồng">
              {SCOPES.map((s) => <button key={s.key} type="button" className="l-chip" aria-pressed={scope === s.key} onClick={() => setScope(s.key)}>{s.label}</button>)}
            </div>
            <div className="l-seg" role="group" aria-label="Lọc theo loại tin">
              {KINDS.map((k) => <button key={k.key} type="button" className="l-chip" aria-pressed={kind === k.key} onClick={() => setKind(k.key)}>{k.label}</button>)}
            </div>
          </Top>
          <Reveal from={saw} className="l-pay-body">
            <section className="l-pay-card l-rows" aria-live="polite" aria-label="Tin của các CLB">
              {scope === "mine" && mine.size === 0 ? (
                <>
                  <p className="l-fine">Bạn chưa ở CLB nào, nên chưa có tin của CLB mình.</p>
                  <Link className="l-btn2 l-lg" href="/explore">Khám phá CLB</Link>
                </>
              ) : shown.length === 0 ? (
                <p className="l-fine">{scope === "mine" ? "CLB của bạn chưa có tin nào." : "Không có tin nào khớp bộ lọc."}</p>
              ) : (
                <ul className="l-posts">{shown.map((p) => <PostRow key={p.id} post={p} />)}</ul>
              )}
            </section>
          </Reveal>
        </div>
      </PhoneFrame>
    </LichPage>
  );
}
