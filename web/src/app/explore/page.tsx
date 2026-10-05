"use client";

// Sinh viên chưa vào CLB · Danh sách CLB (design/screens/SV-DanhSach.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs: các CLB và quan hệ của người đang xem với từng CLB (đã ở, được mời, đã gửi đơn, bị từ chối).

import Link from "next/link";
import { useState } from "react";
import type { ClubCardDto } from "@contract";
import { useClubs, useMe } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { dm } from "@/lib/format";
import { matchesSearch } from "@/lib/text";
import { FIELDS } from "@/lib/types";
import { ClubTag } from "./status";

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ExplorePage() {
  const me = useMe();
  const list = useClubs();
  const [query, setQuery] = useState("");
  const [field, setField] = useState("all");
  const saw = useSawPending(!list.data);

  const error = list.error ?? me.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void list.refetch(); void me.refetch(); }} />;

  const clubs = list.data?.clubs.filter((c) => (field === "all" || c.field === field) && matchesSearch(c.name, query));

  return (
    <LichPage>
      <PhoneFrame brand personName={me.data?.person.name} fade={saw}>
        <div className="l-pay-body">
          <div className="l-ptop">
            <TodayLeaf size="md" />
            <div className="l-ptop-text">
              <h1 className="l-phone-title">CLB đang dùng CampusHub</h1>
              <span className="l-ptop-sub">[Tên trường] · học kỳ {list.data ? list.data.term || "chưa có" : <SkelLine w={70} />}</span>
            </div>
          </div>

          <div className="l-search-row">
            <div className="l-field">
              <label className="l-flabel" htmlFor="tim-clb">Tìm CLB</label>
              <input id="tim-clb" className="l-input" type="search" placeholder="Tên CLB" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="l-field">
              <label className="l-flabel" htmlFor="linh-vuc">Lĩnh vực</label>
              <select id="linh-vuc" className="l-select" value={field} onChange={(e) => setField(e.target.value)}>
                <option value="all">Tất cả</option>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {!clubs ? <ListSkeleton /> : (
            <Reveal from={saw} className="l-pay-body">
              <p className="l-sr" aria-live="polite">{clubs.length} CLB</p>
              {clubs.length === 0
                ? <p className="l-fine">Không có CLB nào khớp. Thử tên khác hoặc chọn lĩnh vực Tất cả.</p>
                : <section className="l-pay-card l-rows" aria-label="Các CLB">{clubs.map((c) => <ClubRow key={c.id} club={c} />)}</section>}
              {/* Thêm ngày 04/10/2026: chủ nhiệm tự tạo CLB (phương án nghiệp vụ N1), mô tả được Hiệu duyệt. */}
              <div className="l-create-club">
                <span className="l-fine">Chưa thấy CLB của bạn? Chủ nhiệm tự tạo được, không cần chờ duyệt.</span>
                <Link className="l-btn2 l-lg" href="/clubs/new"><LinkIcon name="plus" size={18} />Tạo CLB mới</Link>
              </div>
            </Reveal>
          )}
        </div>
      </PhoneFrame>
    </LichPage>
  );
}

/** Khung xương của danh sách: ba CLB, mỗi CLB có tên, nhãn, dòng lĩnh vực, dòng lịch sinh hoạt và nút như thật.
 *  Dòng lịch sinh hoạt kèm "hoạt động gần nhất" thường dài hai dòng, nên CLB đầu vẽ hai dòng. */
function ListSkeleton() {
  return (
    <Loading className="l-pay-card l-rows">
      {[0, 1, 2].map((i) => (
        <div key={i} className="l-clubrow">
          <div className="l-clubrow-top"><h2><SkelLine w={[200, 170, 220][i]} /></h2><span className="l-tag off"><SkelLine w={90} /></span></div>
          <span className="l-meta"><SkelLine w={210} /></span>
          <span className="l-note">{i === 0 ? <><SkelLine w={290} /><br /><SkelLine w={90} /></> : <SkelLine w={260} />}</span>
          <Skel w="100%" h={48} className="l-clubrow-btn" />
        </div>
      ))}
    </Loading>
  );
}

function ClubRow({ club }: { club: ClubCardDto }) {
  const { my } = club;
  const sub = my.status === "applied" && my.applicationSubmittedAt
    ? `Đơn của bạn gửi ${dm(my.applicationSubmittedAt)}, đang chờ ban điều hành duyệt.`
    : upperFirst([club.schedule, club.lastActivity && `hoạt động gần nhất ${dm(club.lastActivity)}`].filter(Boolean).join(" · "));
  const action = my.status === "invited" && my.inviteCode ? { href: `/invite/${my.inviteCode}`, label: "Xem lời mời" }
    : my.status === "applied" || my.status === "rejected" ? { href: `/explore/${club.id}`, label: "Xem đơn của tôi" }
    : my.status === "none" && club.acceptingApplications ? { href: `/explore/${club.id}`, label: "Xem và gửi đơn" }
    : undefined;
  return (
    <article className="l-clubrow" aria-labelledby={`clb-${club.id}`}>
      <div className="l-clubrow-top">
        <h2 id={`clb-${club.id}`}>{club.name}</h2>
        <ClubTag club={club} />
      </div>
      <span className="l-meta">{club.field} · {club.members} thành viên</span>
      {sub && <span className="l-note">{sub}</span>}
      {action && <Link className="l-btn2 l-lg l-clubrow-btn" href={action.href}>{action.label}<LinkIcon name="chevronRight" size={18} /></Link>}
    </article>
  );
}
