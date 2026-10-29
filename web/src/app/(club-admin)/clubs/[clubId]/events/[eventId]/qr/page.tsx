"use client";

// Ban điều hành · Chiếu QR điểm danh (design/screens/BDH-QR.html), thế giới "Lịch bloc". Màn này không có thanh bên.
// Dữ liệu từ GET /clubs/:clubId/events/:eventId (tải lại mỗi 3 giây khi đang mở) và GET .../qr (máy chủ ký mã, đổi mỗi 30 giây).
// Bắt đầu, đóng điểm danh: POST .../open | close. Điểm danh tay: POST .../attendance (máy chủ ghi tên người thực hiện).

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AttendanceDto, EventDetailRes, EventRes, ManualCheckinRes, QrRes } from "@contract";
import { apiPost } from "@/api/client";
import { useBoardQuery, useClubMutation, useEvent, useEventQr } from "@/api/queries";
import { ErrorGate, useDemoMode } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichConfirm } from "@/components/lich/Confirm";
import { LichPage, LinkIcon, Loading, Skel, SkelLine } from "@/components/lich/motion";
import { QrSvg } from "@/components/Qr";
import { appUrl } from "@/components/url";
import { dmy, hm, weekday } from "@/lib/format";
import { matchesSearch } from "@/lib/text";

const SHOW_MINUTES_LEFT_UNDER = 180; // phút, tức 3 giờ

export default function Page() {
  const { clubId, eventId } = useParams<{ clubId: string; eventId: string }>();
  const board = useBoardQuery(clubId);
  const event = useEvent(clubId, eventId, false);
  const home = { href: `/clubs/${clubId}`, label: "Về trang chủ CLB" };
  // Vai không mở được điểm danh thì máy chủ trả 403 kèm câu "Chỉ ban điều hành mở điểm danh." (kiểm tra ở máy chủ, không ở đây).
  if (board.isError) return <ErrorGate error={board.error} onRetry={() => board.refetch()} back={home} />;
  if (event.isError) return <ErrorGate error={event.error} onRetry={() => event.refetch()} back={home} />;
  return (
    <LichPage>
      {board.data && event.data ? <Projector clubId={clubId} clubName={board.data.club.name} initial={event.data} /> : <ProjectorSkeleton />}
    </LichPage>
  );
}

/** Khung xương của màn chiếu: tờ lịch hôm nay, khung mã QR và ô đếm người đúng chỗ; chữ là thanh giữ chỗ. */
function ProjectorSkeleton() {
  return (
    <div className="lich">
      <Loading className="l-proj">
        <header className="l-proj-head">
          <TodayLeaf size="md" />
          <div className="l-top-text"><h1 className="l-proj-title"><SkelLine w={260} /></h1><span className="l-top-sub"><SkelLine w={380} /></span></div>
          <div className="l-top-actions"><Skel w={170} h={40} /></div>
        </header>
        <div className="l-sheet l-proj-body">
          {/* Giữ chỗ theo trạng thái lúc mới mở màn chiếu (chưa mở điểm danh): tiêu đề, lời dẫn, nút; chưa biết trạng thái nên không in chữ. */}
          <section className="l-qr-panel">
            <div className="l-qr-message">
              <h2 className="l-qr-title"><SkelLine w={260} /></h2>
              <p className="l-qr-lead"><SkelLine w={560} /><br /><SkelLine w={300} /></p>
              <div><Skel w={210} h={52} className="l-skel-btn-big" /></div>
            </div>
          </section>
          <aside className="l-att">
            <div className="l-att-head">
              <div className="l-att-count"><span className="l-att-n"><SkelLine w={40} /></span><span className="l-att-total"><SkelLine w={46} /></span></div>
              <span className="l-att-label">thành viên đã điểm danh</span>
              <div className="l-bar" />
            </div>
            <div className="l-att-section"><h2 className="l-subhead"><SkelLine w={110} /></h2></div>
          </aside>
        </div>
      </Loading>
    </div>
  );
}

// Tới giờ, mã QR vẫn nhận điểm danh (chưa có luật tự đóng), nên chỉ ghi là đã quá giờ.
function deadlineNote(until: string, now: number): string {
  const msLeft = new Date(until).getTime() - now;
  if (msLeft <= 0) return " (đã quá giờ)";
  const minutesLeft = Math.round(msLeft / 60000);
  return minutesLeft > 0 && minutesLeft < SHOW_MINUTES_LEFT_UNDER ? ` (còn ${minutesLeft} phút)` : "";
}

function Projector({ clubId, clubName, initial }: { clubId: string; clubName: string; initial: EventDetailRes }) {
  const [manual, setManual] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  // Đang mở điểm danh hoặc đang điểm danh tay: tải lại danh sách mỗi 3 giây để thấy người vừa quét.
  const live = initial.event.status === "open" || manual;
  const detail = useEvent(clubId, initial.event.id, live).data ?? initial;
  const ev = detail.event;
  const started = ev.status !== "upcoming";
  const closed = ev.status === "closed";
  const base = `/clubs/${clubId}/events/${ev.id}`;

  const open = useClubMutation(clubId, () => apiPost<EventRes>(`${base}/open`));
  const close = useClubMutation(clubId, () => apiPost<EventRes>(`${base}/close`));
  // Bấm "Xong" ở điểm danh tay thì focus về lại nút "Điểm danh tay".
  const manualButton = useRef<HTMLButtonElement>(null);
  const wasManual = useRef(false);
  useEffect(() => {
    if (wasManual.current && !manual) manualButton.current?.focus();
    wasManual.current = manual;
  }, [manual]);

  return (
    <div className="lich">
      <div className="l-proj">
        <header className="l-proj-head">
          <TodayLeaf size="md" />
          <div className="l-top-text">
            <h1 className="l-proj-title">{ev.title}</h1>
            <span className="l-top-sub">{clubName} · {weekday(ev.start)} {dmy(ev.start)} · {hm(ev.start)}–{hm(ev.end)}</span>
          </div>
          <div className="l-top-actions">
            {!closed && <span className="l-proj-deadline">Điểm danh mở đến {hm(ev.checkinUntil)}{deadlineNote(ev.checkinUntil, now)}</span>}
            <Link className="l-btn2" href={`/clubs/${clubId}`}><LinkIcon name="chevronLeft" size={18} />Thoát chế độ chiếu</Link>
          </div>
        </header>

        <div className="l-sheet l-proj-body">
          <QrPanel clubId={clubId} detail={detail} now={now} starting={open.isPending} onStart={() => { if (!open.isPending) open.mutate(undefined); }} />
          <aside className="l-att" aria-label="Điểm danh">
            <AttendanceCount done={detail.attendance.length} total={detail.totalMembers} />
            {manual
              ? <ManualList clubId={clubId} detail={detail} onClose={() => setManual(false)} />
              : <RecentList done={detail.attendance} closed={closed} />}
            <div className="l-att-actions">
              {/* Đã đóng vẫn điểm danh tay được, cho người có mặt mà không quét được mã. */}
              <div className="l-row-actions">
                {started && !manual && <button ref={manualButton} type="button" className="l-btn2" onClick={() => setManual(true)}>Điểm danh tay</button>}
                {started && !closed && (
                  <LichConfirm className="l-btn" busy={close.isPending} title="Đóng điểm danh buổi này?" description="Sau khi đóng, mã QR không dùng được nữa. Vẫn điểm danh tay được." confirm="Xác nhận đóng"
                    onConfirm={() => close.mutate(undefined)}>Đóng điểm danh</LichConfirm>
                )}
              </div>
              <p className="l-note">Điểm danh tay được ghi lại tên người thực hiện. CampusHub không lấy vị trí của ai.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function QrPanel({ clubId, detail, now, starting, onStart }: { clubId: string; detail: EventDetailRes; now: number; starting: boolean; onStart: () => void }) {
  const ev = detail.event;
  const qr = useEventQr(clubId, ev.id, ev.status === "open");
  if (ev.status === "upcoming") {
    return (
      <section className="l-qr-panel">
        <div className="l-qr-message">
          <h2 className="l-qr-title">Chưa mở điểm danh</h2>
          <p className="l-qr-lead">Bấm khi thành viên đã có mặt. Mã QR đổi mỗi 30 giây và chỉ quét được khi đang mở.</p>
          <div><button type="button" className="l-btn l-btn-big" aria-busy={starting || undefined} onClick={onStart}>Bắt đầu điểm danh</button></div>
        </div>
      </section>
    );
  }
  if (ev.status === "closed") {
    return (
      <section className="l-qr-panel">
        <div className="l-qr-message">
          <h2 className="l-qr-title">Đã đóng điểm danh</h2>
          {ev.closedAt && <p className="l-qr-lead">Đóng lúc {hm(ev.closedAt)}.</p>}
        </div>
      </section>
    );
  }
  return (
    <section className="l-qr-panel">
      {qr.data ? <LiveQr qr={qr.data} now={now} /> : <span className="l-qr-big l-skel" aria-hidden="true" />}
      <div className="l-qr-message">
        <h2 className="l-qr-title">Mở camera điện thoại và quét mã</h2>
        <p className="l-qr-lead">Không cần cài app. Mỗi điện thoại chỉ điểm danh được cho một người.</p>
        {qr.data && <DemoCheckinPicker detail={detail} url={appUrl(qr.data.checkinPath)} />}
      </div>
    </section>
  );
}

/** Mã QR đang chiếu: đổi mã thì mã cũ mờ đi, mã mới hiện vào (200 ms); thanh dưới mã rút ngắn dần tới lúc đổi. */
function LiveQr({ qr, now }: { qr: QrRes; now: number }) {
  const secs = Math.min(qr.stepSeconds, Math.max(0, Math.ceil((Date.parse(qr.refreshAt) - now) / 1000)));
  return (
    <div className="l-qr-live">
      <div className="l-qr-big">
        <AnimatePresence initial={false} mode="popLayout">
          <m.div key={qr.token} className="l-qr-svg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            <QrSvg value={appUrl(qr.checkinPath)} label={`Mã QR điểm danh, đổi mỗi ${qr.stepSeconds} giây`} />
          </m.div>
        </AnimatePresence>
      </div>
      <div className="l-qr-timer">
        <span className="l-qr-countdown">Mã đổi sau {secs} giây</span>
        <div className="l-bar l-qr-bar" role="progressbar" aria-valuemin={0} aria-valuemax={qr.stepSeconds} aria-valuenow={secs} aria-label="Thời gian còn lại của mã">
          <span style={{ transform: `scaleX(${secs / qr.stepSeconds})` }} />
        </div>
      </div>
    </div>
  );
}

/** Chỉ có ở bản demo: mở link điểm danh bằng vai một thành viên trong tab mới, không cần điện thoại thật.
 *  Tab mới gọi API bằng vai đó (header X-Demo-User), tab chiếu QR vẫn là của chủ nhiệm. */
function DemoCheckinPicker({ detail, url }: { detail: EventDetailRes; url: string }) {
  const demo = useDemoMode();
  const [who, setWho] = useState("a017");
  if (!demo) return null;
  const people = [...detail.attendance.map((a) => ({ personId: a.personId, name: a.name, code: a.code, pending: false })),
    ...detail.notCheckedIn.map((p) => ({ personId: p.personId, name: p.name, code: p.code, pending: p.invite === "pending" }))]
    .sort((a, b) => a.code.localeCompare(b.code));
  return (
    <div className="l-qr-demo-pick">
      <label htmlFor="demo-as-person" className="l-flabel">Bản demo: thử điểm danh với vai</label>
      <select id="demo-as-person" className="l-select sm" value={who} onChange={(e) => setWho(e.target.value)}>
        {people.map((p) => <option key={p.personId} value={p.personId}>{p.name}{p.pending ? " (chưa nhận lời mời)" : ""}</option>)}
      </select>
      <a className="l-btn2 l-sm" href={`${url}&as=${encodeURIComponent(who)}`} target="_blank" rel="noreferrer">Mở link điểm danh</a>
    </div>
  );
}

function AttendanceCount({ done, total }: { done: number; total: number }) {
  return (
    <div className="l-att-head">
      <div className="l-att-count">
        <AnimatePresence initial={false} mode="popLayout">
          <m.span key={done} className="l-att-n" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: "easeOut" }}>{done}</m.span>
        </AnimatePresence>
        <span className="l-att-total">/ {total}</span>
      </div>
      <span className="l-att-label">thành viên đã điểm danh</span>
      <div className="l-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Thành viên đã điểm danh">
        <span style={{ width: `${total > 0 ? Math.min(100, (done / total) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

function RecentList({ done, closed }: { done: AttendanceDto[]; closed: boolean }) {
  return (
    <div className="l-att-section">
      <h2 className="l-subhead">{closed ? "Điểm danh sau cùng" : "Vừa điểm danh"}</h2>
      <ol className="l-att-list">
        <AnimatePresence initial={false}>
          {done.slice(0, 6).map((a) => (
            <m.li key={a.personId} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <time className="l-att-time" dateTime={a.at}>{hm(a.at)}</time>
              <span className="l-att-name">{a.name}</span>
              {a.method === "manual" ? <span className="l-tag off">{a.by ? `Điểm danh tay · ${a.by.name.split(" ").pop()}` : "Điểm danh tay"}</span> : <span />}
            </m.li>
          ))}
        </AnimatePresence>
        {done.length === 0 && <li className="l-att-empty">Chưa có ai điểm danh</li>}
      </ol>
    </div>
  );
}

function ManualList({ clubId, detail, onClose }: { clubId: string; detail: EventDetailRes; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const nextFocus = useRef<string | null>(null);
  useEffect(() => { search.current?.focus(); }, []);
  const waiting = detail.notCheckedIn;
  const found = waiting.filter((p) => matchesSearch(p.name, query));
  const check = useClubMutation(clubId, (personId: string) => apiPost<ManualCheckinRes>(`/clubs/${clubId}/events/${detail.event.id}/attendance`, { personId }), {
    // Điểm danh xong thì dòng đó biến mất: focus sang nút của người kế tiếp (hết người thì về ô tìm).
    onSuccess: () => requestAnimationFrame(() => (nextFocus.current ? list.current?.querySelector<HTMLButtonElement>(`[data-person="${nextFocus.current}"]`) : search.current)?.focus()),
  });

  return (
    <div className="l-att-section">
      <div className="l-att-manual-head">
        <h2 className="l-subhead">Điểm danh tay</h2>
        <button type="button" className="l-btn2 l-sm" onClick={onClose}>Xong</button>
      </div>
      <label htmlFor="attendance-search" className="l-sr">Tìm thành viên chưa điểm danh</label>
      <input ref={search} id="attendance-search" className="l-input" type="search" placeholder="Tìm tên" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul ref={list} className="l-att-list l-att-scroll">
        <AnimatePresence initial={false}>
          {found.map((p, i) => (
            <m.li key={p.personId} exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <span className="l-att-time l-att-code">{p.code}</span>
              <span className="l-att-name">{p.name}</span>
              <button type="button" className="l-btn2 l-sm" data-person={p.personId} aria-busy={(check.isPending && check.variables === p.personId) || undefined}
                onClick={() => {
                  if (check.isPending) return;
                  nextFocus.current = (found[i + 1] ?? found[i - 1])?.personId ?? null;
                  check.mutate(p.personId);
                }}>Điểm danh</button>
            </m.li>
          ))}
        </AnimatePresence>
        {found.length === 0 && (
          <li className="l-att-empty">{waiting.length === 0 ? "Mọi thành viên đã điểm danh." : `Không thấy ai tên "${query.trim()}" trong số chưa điểm danh.`}</li>
        )}
      </ul>
    </div>
  );
}
