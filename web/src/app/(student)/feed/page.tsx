"use client";

// Bảng tin chung: KHUNG RỖNG (22/10/2026). Mô tả đang chờ Hiệu duyệt ở docs/mo-ta-bang-tin-chung.md; chưa có API, chưa có dữ liệu.
// Có sẵn: đường dẫn /feed, khung xương lúc tải, hai nút chọn phần (Tin chung, CLB của tôi) và trạng thái rỗng.
// Chưa có: danh sách tin, lọc theo lĩnh vực, ô tìm, lối vào từ menu hay thanh tab (chờ Hiệu chọn, câu hỏi 5 của bản mô tả).
// Về sau chỉ cần thay <FeedList> bằng danh sách thật (GET /feed) và thêm bộ lọc ở chỗ đã ghi; khung xương, tab, trang chặn đã đủ.

import Link from "next/link";
import { useState } from "react";
import { useMe } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { LeafSkel, LichPage, Loading, Reveal, SkelLine, useSawPending } from "@/components/lich/motion";
import { TodayLeaf } from "@/components/lich/Leaf";
import { PhoneFrame } from "@/components/lich/PhoneFrame";

type Scope = "all" | "mine";
const SCOPES: { key: Scope; label: string }[] = [
  { key: "all", label: "Tin chung" },
  { key: "mine", label: "CLB của tôi" },
];

/** Đầu màn: tờ lịch hôm nay, tiêu đề, hai nút chọn phần. Dùng chung cho màn thật và khung xương để vị trí luôn khớp. */
function Top({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="l-ptop">
        <TodayLeaf size="md" />
        <div className="l-ptop-text"><h1 className="l-phone-title">Bảng tin</h1></div>
      </div>
      {children}
    </>
  );
}

function FeedSkeleton() {
  return (
    <PhoneFrame brand>
      <div className="l-pay-body">
        <Top>
          <div className="l-seg" aria-hidden="true">{SCOPES.map((s) => <span key={s.key} className="l-chip">{s.label}</span>)}</div>
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

/** Chỗ đắp nội dung: nhận phần đang chọn, trả danh sách tin. Hiện chỉ có trạng thái rỗng. */
function FeedList({ scope, inClub }: { scope: Scope; inClub: boolean }) {
  if (scope === "mine" && !inClub) {
    return (
      <section className="l-pay-card">
        <p className="l-fine">Bạn chưa ở CLB nào, nên chưa có tin của CLB mình.</p>
        <Link className="l-btn2 l-lg" href="/explore">Tìm CLB</Link>
      </section>
    );
  }
  return (
    <section className="l-pay-card" aria-live="polite">
      <p className="l-fine">Chưa có tin nào.</p>
      <p className="l-note">Bảng tin đang được dựng. Tin công khai của các CLB sẽ hiện ở đây.</p>
    </section>
  );
}

export default function FeedPage() {
  const me = useMe();
  const [scope, setScope] = useState<Scope>("all");
  const saw = useSawPending(me.isPending);

  if (me.isError) return <ErrorGate error={me.error} onRetry={() => void me.refetch()} />;
  if (me.isPending) return <LichPage><FeedSkeleton /></LichPage>;
  const inClub = me.data.memberships.some((m) => m.invite === "accepted");

  return (
    <LichPage>
      <PhoneFrame brand personName={me.data.person.name} fade={saw}>
        <div className="l-pay-body">
          <Top>
            <div className="l-seg" role="group" aria-label="Chọn phần của bảng tin">
              {SCOPES.map((s) => <button key={s.key} type="button" className="l-chip" aria-pressed={scope === s.key} onClick={() => setScope(s.key)}>{s.label}</button>)}
            </div>
          </Top>
          {/* Về sau: ô tìm và bộ lọc lĩnh vực đặt ở đây, dùng lại FIELDS của Tìm CLB. */}
          <Reveal from={saw} className="l-pay-body"><FeedList scope={scope} inClub={inClub} /></Reveal>
        </div>
      </PhoneFrame>
    </LichPage>
  );
}
