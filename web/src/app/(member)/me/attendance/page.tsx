"use client";

// Thành viên · Điểm danh xong / lịch sử điểm danh (design/screens/TV-DiemDanh.html), thế giới "Lịch bloc".
// Bản vẽ chỉ có trạng thái vừa điểm danh (?checkedIn=1). Trạng thái lịch sử chưa có bản vẽ: đã duyệt ngày 03/10/2026 (web/README.md).
// Dữ liệu từ GET /me (CLB của người đang xem), /me/clubs/:clubId (đợt thu cho tab Quỹ) và /me/clubs/:clubId/attendance.

import * as m from "motion/react-m";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { MyAttendanceRes } from "@contract";
import { useMe, useMyAttendance, useMyClub } from "@/api/queries";
import { useActiveMembership } from "@/api/active-club";
import { Icon } from "@/components/Icon";
import { ErrorGate } from "@/components/lich/Gate";
import { daysLeft, Leaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, Loading, Reveal, SkelLine, useSawPending } from "@/components/lich/motion";
import { NoClubGate } from "@/components/lich/NoClub";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { dm, dmy, hm, weekday } from "@/lib/format";

export default function Page() {
  return <Suspense fallback={<AttendanceSkeleton />}><Attendance /></Suspense>;
}

type Held = MyAttendanceRes["held"][number];
const WEEK = /^Sinh hoạt tuần (\d+)$/;

/** Nhãn dưới ô tuần: "Tuần 2"; buổi có tên khác thì "Buổi 3". */
const weekLabel = (e: Held, i: number) => {
  const n = WEEK.exec(e.title)?.[1];
  return n ? `Tuần ${n}` : `Buổi ${i + 1}`;
};

/** Tên buổi trong câu "Vắng buổi …": "tuần 2"; buổi có tên khác thì dùng tên đó, hạ chữ cái đầu. */
const absentLabel = (e: Held) => {
  const n = WEEK.exec(e.title)?.[1];
  return n ? `tuần ${n}` : e.title.charAt(0).toLowerCase() + e.title.slice(1);
};

/** "Vắng buổi tuần 2 (Thứ Bảy 12/09)."; từ 3 buổi thì gộp ngắn: "Vắng 3 buổi: tuần 2, 5, 6." */
function absentText(absent: Held[]): string {
  if (absent.length < 3) return `Vắng buổi ${absent.map((e) => `${absentLabel(e)} (${weekday(e.start)} ${dm(e.start)})`).join(", ")}.`;
  const weeks = absent.map((e) => WEEK.exec(e.title)?.[1]);
  const list = weeks.every(Boolean) ? `tuần ${weeks.join(", ")}` : absent.map(absentLabel).join(", ");
  return `Vắng ${absent.length} buổi: ${list}.`;
}

/** Khung xương: thẻ kỳ và danh sách buổi đúng chỗ; Next dựng sẵn phần này lúc build nên không có ngày thật. */
function AttendanceSkeleton() {
  return (
    <PhoneFrame tab="attendance">
      <Loading className="l-pay-body">
        <h1 className="l-phone-title"><SkelLine w={200} /></h1>
        <section className="l-pay-card"><h2 className="l-subhead"><SkelLine w="80%" /></h2><div className="l-weeks">{[0, 1, 2, 3].map((i) => <span key={i} className="l-week"><span className="l-week-bar" /><SkelLine w={40} /></span>)}</div></section>
        <section className="l-pay-card l-att-rows">{[0, 1, 2, 3].map((i) => <div key={i} className="l-att-row"><LeafSkel sub="Thứ Bảy" /><span className="l-field"><span className="l-att-row-title"><SkelLine w={150} /></span><span className="l-att-present"><SkelLine w={90} /></span></span></div>)}</section>
      </Loading>
    </PhoneFrame>
  );
}

function Attendance() {
  const params = useSearchParams();
  const justEventId = params.get("checkedIn") === "1" ? params.get("e") : null;
  const me = useMe();
  const membership = useActiveMembership(me.data);
  const club = useMyClub(membership?.clubId);
  const att = useMyAttendance(membership?.clubId);
  const saw = useSawPending(!att.data);

  const error = me.error ?? att.error ?? club.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void me.refetch(); void att.refetch(); void club.refetch(); }} />;
  if (me.data && !membership) return <NoClubGate me={me.data} />;
  if (!me.data || !att.data) return <AttendanceSkeleton />;

  const data = att.data;
  const attended = new Set(data.mine.map((a) => a.eventId));
  const heldCount = data.held.length;
  const attendedCount = data.held.filter((e) => attended.has(e.eventId)).length;
  const absent = data.held.filter((e) => !attended.has(e.eventId));
  const justRecord = justEventId ? data.mine.find((a) => a.eventId === justEventId) : undefined;
  const collectionId = club.data?.collection?.id;

  const termCard = (
    <section className="l-pay-card">
      <h2 className="l-subhead">
        {heldCount > 0 ? `Kỳ ${data.club.term}: bạn đã tham gia ${attendedCount}/${heldCount} buổi` : `Kỳ ${data.club.term} chưa có buổi sinh hoạt nào được điểm danh.`}
      </h2>
      {heldCount > 0 && (
        <ol className="l-weeks" aria-label="Các buổi trong kỳ">
          {data.held.map((e, i) => (
            <li key={e.eventId} className={`l-week${attended.has(e.eventId) ? " on" : ""}`}>
              <span className="l-week-bar" aria-hidden="true" />
              {weekLabel(e, i)}<span className="l-sr">: {attended.has(e.eventId) ? "có mặt" : "vắng"}</span>
            </li>
          ))}
        </ol>
      )}
      {justRecord && absent.length > 0 && <span className="l-note">{absentText(absent)}</span>}
    </section>
  );

  return (
    <LichPage>
      <PhoneFrame clubName={data.club.name} personName={me.data.person.name} tab="attendance" payHref={collectionId ? `/me/pay/${collectionId}` : undefined} fade={saw}>
        {justRecord ? (
          // Vừa quét mã xong (/checkin chuyển sang đây): như bản vẽ TV-DiemDanh. Tờ lịch của buổi được đóng dấu.
          <Reveal from={saw} className="l-pay-body">
            <div className="l-result">
              <span className="l-stamped">
                <Leaf date={justRecord.at} size="xl" tone={daysLeft(justRecord.at) === 0 ? "today" : undefined} label={`${weekday(justRecord.at)} ${dmy(justRecord.at)}`} />
                <m.span className="l-stamp" aria-hidden="true" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1], delay: 0.08 }}>
                  <Icon name="check" size={26} strokeWidth={2.6} />
                </m.span>
              </span>
              <h1 className="l-result-title xl">Đã điểm danh</h1>
              <div className="l-field l-result-meta">
                <span className="l-result-event">{justRecord.title}</span>
                <span className="l-meta">{weekday(justRecord.at)} {dmy(justRecord.at)} · {hm(justRecord.at)}{justRecord.method === "manual" ? " · điểm danh tay" : ""}</span>
              </div>
            </div>
            {termCard}
            <div className="l-actions"><Link className="l-btn2 l-lg" href="/me/attendance">Xem lịch sử điểm danh</Link></div>
          </Reveal>
        ) : (
          <Reveal from={saw} className="l-pay-body">
            <h1 className="l-phone-title">Lịch sử điểm danh</h1>
            {data.mine.length === 0 && <p className="l-fine">Bạn chưa điểm danh buổi nào. Quét mã QR ở buổi sinh hoạt để điểm danh.</p>}
            {termCard}
            {heldCount > 0 && (
              <section className="l-pay-card l-att-rows" aria-label="Các buổi đã điểm danh">
                {[...data.held].reverse().map((e) => {
                  const record = data.mine.find((a) => a.eventId === e.eventId);
                  return (
                    <div key={e.eventId} className="l-att-row">
                      <Leaf date={e.start} tone={daysLeft(e.start) === 0 ? "today" : undefined} label={`${e.title}, ${weekday(e.start)} ${dm(e.start)}`} />
                      <span className="l-field">
                        <span className="l-att-row-title">{e.title}</span>
                        {record ? <span className="l-att-present">Có mặt {hm(record.at)}</span> : <span className="l-note">Vắng</span>}
                      </span>
                      {record?.method === "manual" && <span className="l-tag off">Điểm danh tay</span>}
                    </div>
                  );
                })}
              </section>
            )}
          </Reveal>
        )}
      </PhoneFrame>
    </LichPage>
  );
}

