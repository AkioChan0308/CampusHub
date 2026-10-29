"use client";

// Ban điều hành · Danh sách buổi, tạo và sửa buổi. Bản vẽ chưa có màn này: mô tả được Hiệu duyệt ngày 04/10/2026.
// Dữ liệu từ GET /clubs/:clubId/events. Tạo: POST .../events; sửa: PUT .../events/:id; xóa: DELETE .../events/:id.
// Mở từ trang chủ bằng ?create=1 thì form tạo buổi mở sẵn.

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { EventBody, EventDto, EventRes, EventsRes, OkRes } from "@contract";
import { apiDelete, apiPost, apiPut } from "@/api/client";
import { errorText, useClubMutation, useEvents } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate } from "@/components/lich/Gate";
import { daysLeft, Leaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { dmy, hm, nowIso } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useEvents(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="checkin" fallback={<EventsSkeleton />}>
        <Events />
      </BoardFrame>
    </LichPage>
  );
}

const TITLE = "Điểm danh";
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Khung xương: tiêu đề hai phần là chữ thật, mỗi buổi là tờ lịch đang tải và các thanh trong dòng chữ. */
function EventsSkeleton() {
  const row = (i: number) => (
    <div key={i} className="l-evrow">
      <LeafSkel sub="Thứ Bảy" />
      <span className="l-field"><span className="l-evrow-title"><SkelLine w={170} /></span><span className="l-note"><SkelLine w={260} /></span></span>
      <span className="l-tag off"><SkelLine w={70} /></span>
      <span className="l-evrow-count"><SkelLine w={46} /></span>
      <span className="l-row-actions"><Skel w={88} h={34} /></span>
    </div>
  );
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={300} />} actions={<Skel w={124} h={40} />} />
      <Loading className="l-sheet">
        {/* Lúc thường mở màn này: một buổi sắp tới, vài buổi đã qua. */}
        <section className="l-sec"><div className="l-sec-head"><h2>Sắp tới</h2></div>{[0].map(row)}</section>
        <section className="l-sec"><div className="l-sec-head"><h2>Đã qua</h2></div>{[1, 2, 3, 4, 5].map(row)}</section>
      </Loading>
    </>
  );
}

function Events() {
  const { club } = useLichBoard();
  const query = useEvents(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <EventsSkeleton />;
  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <EventsBody data={query.data} fade={sawHere || sawFrame} />;
}

/** Form đang mở: tạo buổi mới, hoặc sửa một buổi. */
type Editing = { mode: "new" } | { mode: "edit"; event: EventDto };

/** Buổi đã qua: đã đóng điểm danh, hoặc đã qua giờ kết thúc (kể cả buổi chưa từng mở điểm danh). */
const isPast = (e: EventDto) => e.status === "closed" || (e.status === "upcoming" && Date.parse(e.end) < Date.now());

function EventsBody({ data, fade }: { data: EventsRes; fade: boolean }) {
  const { club, me } = useLichBoard();
  const params = useSearchParams();
  const canEdit = can(me.role, "checkin");
  const [editing, setEditing] = useState<Editing | null>(() => (canEdit && params.get("create") === "1" ? { mode: "new" } : null));
  const listTitle = useRef<HTMLHeadingElement>(null);
  // Nút đã mở form: đóng form (Hủy) thì con trỏ về lại nút đó; lưu xong thì về tiêu đề danh sách.
  const opener = useRef<HTMLElement | null>(null);
  const openForm = (next: Editing) => { opener.current = document.activeElement as HTMLElement | null; setEditing(next); };
  const closeForm = (saved: boolean) => {
    setEditing(null);
    requestAnimationFrame(() => (saved || !opener.current?.isConnected ? listTitle.current : opener.current)?.focus());
  };
  const base = `/clubs/${club.id}`;
  const upcoming = data.events.filter((e) => !isPast(e));
  const past = data.events.filter(isPast);

  const remove = useClubMutation(club.id, (e: EventDto) => apiDelete<OkRes>(`${base}/events/${e.id}`), {
    onSuccess: (_r, e) => { toast.success(`Đã xóa buổi ${e.title}.`); listTitle.current?.focus(); },
  });

  const row = (e: EventDto & { attended: number }) => {
    const today = daysLeft(e.start) === 0;
    // Buổi đã qua giờ kết thúc mà chưa từng mở điểm danh: xếp vào "Đã qua"; vẫn mở QR muộn được (quên mở lúc sinh hoạt), sửa hay xóa được.
    const missed = e.status === "upcoming" && isPast(e);
    const status = e.status === "open" ? <span className="l-tag wait">Đang mở điểm danh</span>
      : e.status === "closed" ? <span className="l-tag off">Đã đóng</span>
      : missed ? <span className="l-tag off">Chưa mở điểm danh</span>
      : <span className="l-tag off">Sắp tới</span>;
    return (
      <m.div key={e.id} className="l-evrow" exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        <Leaf date={e.start} tone={today ? "today" : undefined} sub={today ? "hôm nay" : undefined} label={`${e.title}, ${dmy(e.start)}`} />
        <span className="l-field">
          <span className="l-evrow-title">{e.title}</span>
          <span className="l-note">
            {hm(e.start)}–{hm(e.end)} · {lowerFirst(e.location)}
            {e.kind === "session" ? ` · điểm danh đến ${hm(e.checkinUntil)}` : " · mở cho cả người ngoài CLB"}
          </span>
        </span>
        {status}
        <span className="l-evrow-count" aria-label={e.status === "upcoming" ? "Chưa điểm danh" : `${e.attended} trên ${data.memberCount} người đã điểm danh`}>
          {e.status === "upcoming" ? "–" : <>{e.attended}<span className="l-evrow-of">/{data.memberCount}</span></>}
        </span>
        <span className="l-row-actions">
          {e.status === "upcoming" && canEdit && (
            <>
              <button type="button" className="l-btn2 l-sm" aria-label={`Sửa buổi ${e.title}`} onClick={() => openForm({ mode: "edit", event: e })}>Sửa</button>
              {e.attended === 0 && (
                <LichConfirm className="l-btn2 l-sm" busy={remove.isPending && remove.variables?.id === e.id} title={`Xóa buổi ${e.title}?`}
                  description="Buổi chưa mở điểm danh nên xóa được. Việc này không hoàn tác được." confirm="Xóa buổi" focusAfter={() => listTitle.current?.focus()}
                  onConfirm={() => remove.mutate(e)}>Xóa</LichConfirm>
              )}
            </>
          )}
          {e.kind === "session" && canEdit && (
            <Link className={`${e.status === "open" ? "l-btn" : "l-btn2"} l-sm`} href={`${base}/events/${e.id}/qr`}>
              <LinkIcon name="qr" size={16} />{e.status === "closed" ? "Xem" : "Mở QR"}
            </Link>
          )}
        </span>
      </m.div>
    );
  };

  return (
    <>
      <PageTop
        title={TITLE}
        sub={`${upcoming.length} buổi sắp tới · ${past.length} buổi đã qua · học kỳ ${club.term}`}
        actions={canEdit
          ? <button type="button" className="l-btn" aria-expanded={editing?.mode === "new"} onClick={() => openForm({ mode: "new" })}><Icon name="plus" size={18} />Tạo buổi</button>
          : <span className="l-note">{RIGHT_LABEL.checkin}</span>}
      />

      <Reveal from={fade} className="l-sheet">
        <AnimatePresence initial={false}>
          {editing && (
            <m.div key={editing.mode === "edit" ? editing.event.id : "new"} className="l-sec l-collapse" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <EventForm editing={editing} onDone={closeForm} />
            </m.div>
          )}
        </AnimatePresence>

        <section className="l-sec" aria-labelledby="upcoming-events">
          <div className="l-sec-head"><h2 id="upcoming-events" ref={listTitle} tabIndex={-1}>Sắp tới</h2></div>
          {upcoming.length === 0 && (
            <p className="l-empty">{data.events.length === 0 ? "CLB chưa có buổi nào. Tạo buổi sinh hoạt để mở QR điểm danh." : "Chưa có buổi nào sắp tới."}</p>
          )}
          <AnimatePresence initial={false}>{upcoming.map(row)}</AnimatePresence>
        </section>

        {past.length > 0 && (
          <section className="l-sec" aria-labelledby="past-events">
            <div className="l-sec-head"><h2 id="past-events">Đã qua</h2></div>
            {past.map(row)}
          </section>
        )}
      </Reveal>
    </>
  );
}

/** Ngày mặc định của buổi mới: hôm nay theo giờ Việt Nam. */
const todayDate = () => nowIso().slice(0, 10);
const dateOf = (iso: string) => nowIso(Date.parse(iso)).slice(0, 10);
const timeOf = (iso: string) => nowIso(Date.parse(iso)).slice(11, 16);
const isoOf = (date: string, time: string) => `${date}T${time}:00+07:00`;
const minutes = (t: string) => { const [h, mm] = t.split(":").map(Number); return h * 60 + mm; };

type Fields = { title: string; kind: "session" | "open"; date: string; start: string; end: string; until: string; location: string };

function EventForm({ editing, onDone }: { editing: Editing; onDone: (saved: boolean) => void }) {
  const { club } = useLichBoard();
  const base = `/clubs/${club.id}`;
  const e = editing.mode === "edit" ? editing.event : undefined;
  const [f, setF] = useState<Fields>(() => e
    ? { title: e.title, kind: e.kind, date: dateOf(e.start), start: timeOf(e.start), end: timeOf(e.end), until: timeOf(e.checkinUntil), location: e.location }
    : { title: "", kind: "session", date: todayDate(), start: "07:30", end: "09:30", until: "09:30", location: "" });
  // Giờ đóng điểm danh đi theo giờ kết thúc cho tới khi người dùng tự sửa.
  const [untilTouched, setUntilTouched] = useState(!!e && timeOf(e.checkinUntil) !== timeOf(e.end));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((x) => ({ ...x, [k]: v, ...(k === "end" && !untilTouched ? { until: v as string } : {}) }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  useEffect(() => { document.getElementById("event-title")?.focus(); }, []);

  const save = useClubMutation(club.id, (body: EventBody) => (e ? apiPut<EventRes>(`${base}/events/${e.id}`, body) : apiPost<EventRes>(`${base}/events`, body)), {
    onSuccess: (r) => { toast.success(e ? `Đã lưu buổi ${r.event.title}.` : `Đã tạo buổi ${r.event.title}.`); onDone(true); },
    onError: (err) => toast.error(errorText(err)),
  });

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (save.isPending) return;
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!f.title.trim()) next.title = "Cần ghi tên buổi.";
    if (!f.location.trim()) next.location = "Cần ghi nơi diễn ra.";
    if (!f.date) next.date = "Cần chọn ngày.";
    if (f.start && f.end && minutes(f.end) <= minutes(f.start)) next.end = "Giờ kết thúc phải sau giờ bắt đầu.";
    else if (f.until && (minutes(f.until) <= minutes(f.start) || minutes(f.until) > minutes(f.end))) next.until = "Từ sau giờ bắt đầu tới giờ kết thúc.";
    else if (f.date && f.end && Date.parse(isoOf(f.date, f.end)) <= Date.now()) next.date = "Buổi này đã qua. Chọn ngày giờ sau bây giờ.";
    setErrors(next);
    const first = (Object.keys(next) as (keyof Fields)[])[0];
    if (first) { document.getElementById(`event-${first}`)?.focus(); return; }
    save.mutate({ title: f.title.trim(), kind: f.kind, start: isoOf(f.date, f.start), end: isoOf(f.date, f.end), location: f.location.trim(), checkinUntil: isoOf(f.date, f.until) });
  }

  const field = (k: keyof Fields, label: string, input: ReactNode, wide = false) => (
    <div className={`l-field${wide ? " l-span-2" : ""}`}>
      <label className="l-flabel" htmlFor={`event-${k}`}>{label}</label>
      {input}
      {errors[k] && <span id={`event-${k}-error`} className="l-error">{errors[k]}</span>}
    </div>
  );
  const inv = (k: keyof Fields) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `event-${k}-error` : undefined });

  return (
    <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-labelledby="event-form">
      <h2 id="event-form" className="l-subhead">{e ? `Sửa buổi ${e.title}` : "Tạo buổi"}</h2>
      <div className="l-form-grid">
        {field("title", "Tên buổi", <input id="event-title" className="l-input" value={f.title} placeholder="Ví dụ: Sinh hoạt tuần 6" onChange={(x) => set("title", x.target.value)} {...inv("title")} />, true)}
        {field("kind", "Loại", (
          <select id="event-kind" className="l-select" value={f.kind} onChange={(x) => set("kind", x.target.value as Fields["kind"])}>
            <option value="session">Sinh hoạt có điểm danh</option>
            <option value="open">Sự kiện mở (cả người ngoài CLB)</option>
          </select>
        ))}
        {field("date", "Ngày", <input id="event-date" className="l-input" type="date" value={f.date} onChange={(x) => set("date", x.target.value)} {...inv("date")} />)}
        {field("start", "Bắt đầu", <input id="event-start" className="l-input" type="time" value={f.start} onChange={(x) => set("start", x.target.value)} {...inv("start")} />)}
        {field("end", "Kết thúc", <input id="event-end" className="l-input" type="time" value={f.end} onChange={(x) => set("end", x.target.value)} {...inv("end")} />)}
        {field("until", "Điểm danh mở tới", <input id="event-until" className="l-input" type="time" value={f.until} onChange={(x) => { setUntilTouched(true); set("until", x.target.value); }} {...inv("until")} />)}
        {field("location", "Nơi diễn ra", <input id="event-location" className="l-input" value={f.location} placeholder="Ví dụ: Sân cầu lông khu thể thao" onChange={(x) => set("location", x.target.value)} {...inv("location")} />, true)}
      </div>
      <div className="l-form-actions">
        <button type="button" className="l-btn2" onClick={() => onDone(false)}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>{e ? "Lưu buổi" : "Tạo buổi"}</button>
      </div>
    </form>
  );
}
