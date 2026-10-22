"use client";

// Ban điều hành · Việc cần làm (chưa có bản vẽ; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.3), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/tasks. Tạo: POST .../tasks; sửa và giao lại: PUT .../tasks/:id; đổi trạng thái: POST .../tasks/:id/status.
// Không có thông báo hay nhắc việc tự động: việc quá hạn hiện bằng tờ lịch đỏ.

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { TaskBody, TaskDto, TaskRes, TasksRes, TaskStatus } from "@contract";
import { apiPost, apiPut } from "@/api/client";
import { errorText, useClubMutation, useTasks } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { daysLeft, Leaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { dmy, nowIso } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { TASK_STATUS_LABEL } from "@/lib/types";

const TITLE = "Việc cần làm";
const COLUMNS: TaskStatus[] = ["todo", "doing", "done"];
type Filter = "all" | "mine" | "overdue";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useTasks(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="tasks" fallback={<TasksSkeleton />}>
        <Tasks />
      </BoardFrame>
    </LichPage>
  );
}

/** Khung xương: ba cột với tên cột thật, mỗi cột vài dòng việc đang tải. */
function TasksSkeleton() {
  const row = (i: number) => (
    <div key={i} className="l-task-row" style={{ minHeight: 125 }}>
      <LeafSkel sub="còn 7 ngày" />
      <span className="l-field"><span className="l-task-title"><SkelLine w={170} /></span><span className="l-note"><SkelLine w={110} /></span></span>
      <span className="l-row-actions"><Skel w={70} h={34} /><Skel w={70} h={34} /></span>
    </div>
  );
  return (
    <>
      <PageTop title={TITLE} sub={<SkelLine w={220} />} actions={<Skel w={110} h={40} />} />
      <Loading className="l-sheet">
        <div className="l-sec l-task-filter"><div className="l-seg">{["Tất cả", "Việc của tôi", "Quá hạn"].map((t) => <span key={t} className="l-chip">{t}</span>)}</div><Skel w={200} h={40} /></div>
        <div className="l-sec l-task-cols">
          {COLUMNS.map((c, ci) => <section key={c} className="l-task-col"><div className="l-sec-head"><h2>{TASK_STATUS_LABEL[c]}</h2></div>{[0, 1, 2].slice(0, [3, 2, 1][ci]).map(row)}</section>)}
        </div>
      </Loading>
    </>
  );
}

function Tasks() {
  const { club } = useLichBoard();
  const query = useTasks(club.id);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <TasksSkeleton />;
  if (query.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <TasksBody data={query.data} fade={sawHere || sawFrame} />;
}

const overdue = (t: TaskDto) => t.status !== "done" && Date.parse(t.due) < Date.now();

type Editing = { id?: string } | null;

function TasksBody({ data, fade }: { data: TasksRes; fade: boolean }) {
  const { club, me } = useLichBoard();
  const canEdit = can(me.role, "task");
  const [filter, setFilter] = useState<Filter>("all");
  const [person, setPerson] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openForm = (next: Editing) => { opener.current = document.activeElement as HTMLElement | null; setEditing(next); };
  const closeForm = (saved: boolean) => {
    setEditing(null);
    requestAnimationFrame(() => (saved || !opener.current?.isConnected ? heading.current : opener.current)?.focus());
  };
  const base = `/clubs/${club.id}/tasks`;
  const late = data.tasks.filter(overdue).length;

  const setStatus = useClubMutation(club.id, (v: { task: TaskDto; status: TaskStatus }) => apiPost<TaskRes>(`${base}/${v.task.id}/status`, { status: v.status }), {
    onSuccess: (r) => toast.success(`${r.task.title}: ${TASK_STATUS_LABEL[r.task.status].toLowerCase()}.`),
  });

  const shown = data.tasks.filter((t) => (filter === "mine" ? t.assignee.personId === me.personId : filter === "overdue" ? overdue(t) : true) && (!person || t.assignee.personId === person));
  const FILTERS: [Filter, string][] = [["all", "Tất cả"], ["mine", "Việc của tôi"], ["overdue", `Quá hạn${late ? ` (${late})` : ""}`]];

  const row = (t: TaskDto) => {
    const late = overdue(t);
    const n = daysLeft(t.due);
    const sub = t.status === "done" ? "xong" : n < 0 ? `quá ${-n} ngày` : n === 0 ? "hôm nay" : `còn ${n} ngày`;
    const busy = setStatus.isPending && setStatus.variables?.task.id === t.id;
    const move = (status: TaskStatus, label: string, primary = false) => (
      <button type="button" className={`${primary ? "l-btn" : "l-btn2"} l-sm`} aria-busy={busy || undefined} aria-label={`${label}: ${t.title}`} onClick={() => { if (!busy) setStatus.mutate({ task: t, status }); }}>{label}</button>
    );
    return (
      <div key={t.id} className="l-task-row">
        <Leaf date={t.due} sub={sub} tone={late || (t.status !== "done" && n <= 3) ? "urgent" : undefined} label={`${t.title}, hạn ${dmy(t.due)}, ${sub}`} />
        <span className="l-field">
          <span className="l-task-title">{t.title}</span>
          <span className="l-note">{t.assignee.name}</span>
          {(t.event || t.process) && <span className="l-kit-tags">{t.event && <span className="l-tag off">Buổi: {t.event.title}</span>}{t.process && <span className="l-tag off">Quy trình: {t.process.name}</span>}</span>}
        </span>
        <span className="l-row-actions">
          {t.status === "todo" && move("doing", "Bắt đầu", true)}
          {t.status === "doing" && move("done", "Xong", true)}
          {t.status === "done" && move("doing", "Mở lại")}
          {canEdit && <button type="button" className="l-btn2 l-sm" aria-label={`Sửa hoặc giao lại: ${t.title}`} onClick={() => openForm({ id: t.id })}>Sửa</button>}
        </span>
      </div>
    );
  };

  let formBlock: ReactNode = null;
  if (editing) formBlock = <TaskForm key={editing.id ?? "new"} task={data.tasks.find((t) => t.id === editing.id)} data={data} onDone={closeForm} />;

  return (
    <>
      <PageTop title={TITLE} sub={`${data.tasks.filter((t) => t.status !== "done").length} việc chưa xong · ${late} quá hạn · học kỳ ${club.term}`}
        actions={canEdit ? <button type="button" className="l-btn" aria-expanded={!!editing && !editing.id} onClick={() => openForm({})}><Icon name="plus" size={18} />Thêm việc</button> : <span className="l-note">{RIGHT_LABEL.task}</span>} />
      <Reveal from={fade} className="l-sheet">
        <AnimatePresence initial={false}>
          {formBlock && (
            <m.div key={editing?.id ?? "new"} className="l-sec l-collapse" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>{formBlock}</m.div>
          )}
        </AnimatePresence>
        <div className="l-sec l-task-filter">
          <h2 ref={heading} tabIndex={-1} className="l-sr">Danh sách việc</h2>
          <div className="l-seg" role="group" aria-label="Lọc việc">{FILTERS.map(([key, label]) => <button key={key} type="button" className="l-chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
          <select className="l-select l-task-person" aria-label="Lọc theo người" value={person} onChange={(e) => setPerson(e.target.value)}>
            <option value="">Mọi người</option>
            {data.assignees.map((p) => <option key={p.personId} value={p.personId}>{p.name}</option>)}
          </select>
        </div>
        {data.tasks.length === 0 ? <p className="l-sec l-empty">CLB chưa có việc nào. Thêm việc đầu tiên và giao cho một người trong ban.</p> : (
          <div className="l-sec l-task-cols">
            {COLUMNS.map((c) => {
              const list = shown.filter((t) => t.status === c);
              return (
                <section key={c} className="l-task-col" aria-label={TASK_STATUS_LABEL[c]}>
                  <div className="l-sec-head"><h2>{TASK_STATUS_LABEL[c]}</h2><span className="l-note">{list.length}</span></div>
                  {list.length === 0 && <p className="l-empty">Không có việc nào.</p>}
                  {list.map(row)}
                </section>
              );
            })}
          </div>
        )}
      </Reveal>
    </>
  );
}

type Fields = { title: string; assigneeId: string; date: string; eventId: string; processId: string };
const dateOf = (iso: string) => nowIso(Date.parse(iso)).slice(0, 10);

function TaskForm({ task, data, onDone }: { task?: TaskDto; data: TasksRes; onDone: (saved: boolean) => void }) {
  const { club } = useLichBoard();
  const base = `/clubs/${club.id}/tasks`;
  const [f, setF] = useState<Fields>({ title: task?.title ?? "", assigneeId: task?.assignee.personId ?? "", date: task ? dateOf(task.due) : "", eventId: task?.event?.id ?? "", processId: task?.process?.id ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((x) => ({ ...x, [k]: undefined })); };
  useEffect(() => { document.getElementById("task-title")?.focus(); }, []);
  const save = useClubMutation(club.id, (body: TaskBody) => (task ? apiPut<TaskRes>(`${base}/${task.id}`, body) : apiPost<TaskRes>(base, body)), {
    onSuccess: (r) => { toast.success(task ? `Đã lưu việc ${r.task.title}.` : `Đã thêm việc ${r.task.title}.`); onDone(true); },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!f.title.trim()) next.title = "Cần ghi tên việc.";
    if (!f.assigneeId) next.assigneeId = "Cần chọn người phụ trách.";
    if (!f.date) next.date = "Cần chọn hạn.";
    setErrors(next);
    const first = (Object.keys(next) as (keyof Fields)[])[0];
    if (first) { document.getElementById(`task-${first}`)?.focus(); return; }
    save.mutate({ title: f.title.trim(), assigneeId: f.assigneeId, due: `${f.date}T23:59:00+07:00`, ...(f.eventId ? { eventId: f.eventId } : {}), ...(f.processId ? { processId: f.processId } : {}) });
  }
  const field = (k: keyof Fields, label: string, input: ReactNode, wide = false) => (
    <div className={`l-field${wide ? " l-span-2" : ""}`}>
      <label className="l-flabel" htmlFor={`task-${k}`}>{label}</label>
      {input}
      {errors[k] && <span id={`task-${k}-error`} className="l-error">{errors[k]}</span>}
    </div>
  );
  const inv = (k: keyof Fields) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `task-${k}-error` : undefined });
  return (
    <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-labelledby="task-form">
      <h2 id="task-form" className="l-subhead">{task ? `Sửa việc ${task.title}` : "Thêm việc"}</h2>
      <div className="l-form-grid">
        {field("title", "Tên việc", <input id="task-title" className="l-input" value={f.title} placeholder="Ví dụ: Đặt sân buổi giao lưu thứ Bảy" onChange={(e) => set("title", e.target.value)} {...inv("title")} />, true)}
        {field("assigneeId", task ? "Người phụ trách (đổi người là giao lại)" : "Người phụ trách", (
          <select id="task-assigneeId" className="l-select" value={f.assigneeId} onChange={(e) => set("assigneeId", e.target.value)} {...inv("assigneeId")}>
            <option value="">Chọn người</option>{data.assignees.map((p) => <option key={p.personId} value={p.personId}>{p.name}</option>)}
          </select>
        ))}
        {field("date", "Hạn", <input id="task-date" className="l-input" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} {...inv("date")} />)}
        {field("eventId", "Gắn với buổi (không bắt buộc)", (
          <select id="task-eventId" className="l-select" value={f.eventId} onChange={(e) => set("eventId", e.target.value)}><option value="">Không gắn</option>{data.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}</select>
        ))}
        {field("processId", "Gắn với quy trình (không bắt buộc)", (
          <select id="task-processId" className="l-select" value={f.processId} onChange={(e) => set("processId", e.target.value)}><option value="">Không gắn</option>{data.processes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        ))}
      </div>
      <div className="l-form-actions">
        <button type="button" className="l-btn2" onClick={() => onDone(false)}>Hủy</button>
        <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>{task ? "Lưu việc" : "Thêm việc"}</button>
      </div>
    </form>
  );
}
