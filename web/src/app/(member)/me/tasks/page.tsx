"use client";

// Thành viên · Việc của tôi (chưa có bản vẽ; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.3), thế giới "Lịch bloc".
// Dữ liệu từ GET /me/tasks (việc được giao cho mình ở mọi CLB đã nhận lời mời). Thành viên chỉ đổi trạng thái việc của mình:
// POST /clubs/:clubId/tasks/:taskId/status.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MyTasksRes, TaskRes, TaskStatus } from "@contract";
import { ApiError, apiPost } from "@/api/client";
import { errorText, keys, useMe, useMyTasks } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { daysLeft, Leaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { dmy } from "@/lib/format";
import { TASK_STATUS_LABEL } from "@/lib/types";

type Task = MyTasksRes["tasks"][number];

export default function Page() {
  return <LichPage><Tasks /></LichPage>;
}

function TasksSkeleton({ personName }: { personName?: string }) {
  return (
    <PhoneFrame back={{ href: "/me", label: "Của tôi" }} personName={personName}>
      <Loading className="l-pay-body">
        <h1 className="l-phone-title">Việc của tôi</h1>
        <section className="l-pay-card l-att-rows">{[0, 1, 2].map((i) => <div key={i} className="l-att-row"><LeafSkel sub="còn 7 ngày" /><span className="l-field"><span className="l-att-row-title"><SkelLine w={170} /></span><span className="l-att-present"><SkelLine w={110} /></span><span className="l-row-actions"><Skel w={80} h={34} /><Skel w={60} h={34} /></span></span></div>)}</section>
      </Loading>
    </PhoneFrame>
  );
}

function Tasks() {
  const me = useMe();
  const query = useMyTasks();
  const saw = useSawPending(query.isPending);
  if (query.isPending) return <TasksSkeleton personName={me.data?.person.name} />;
  if (query.isError) {
    return <PhoneFrame back={{ href: "/me", label: "Của tôi" }}><ErrorGate inline error={query.error} onRetry={() => query.refetch()} /></PhoneFrame>;
  }
  return (
    <PhoneFrame back={{ href: "/me", label: "Của tôi" }} personName={me.data?.person.name} fade={saw}>
      <Reveal from={saw} className="l-pay-body"><List tasks={query.data.tasks} /></Reveal>
    </PhoneFrame>
  );
}

function List({ tasks }: { tasks: Task[] }) {
  const client = useQueryClient();
  const set = useMutation({
    mutationFn: (v: { task: Task; status: TaskStatus }) => apiPost<TaskRes>(`/clubs/${v.task.club.id}/tasks/${v.task.id}/status`, { status: v.status }),
    onSuccess: async (r) => { await client.invalidateQueries({ queryKey: keys.myTasks }); toast.success(`${r.task.title}: ${TASK_STATUS_LABEL[r.task.status].toLowerCase()}.`); },
    onError: (e) => { if (e instanceof ApiError && e.status === 409) void client.invalidateQueries({ queryKey: keys.myTasks }); toast.error(errorText(e)); },
  });
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  const row = (t: Task) => {
    const n = daysLeft(t.due);
    const late = t.status !== "done" && n < 0;
    const sub = t.status === "done" ? "xong" : n < 0 ? `quá ${-n} ngày` : n === 0 ? "hôm nay" : `còn ${n} ngày`;
    const busy = set.isPending && set.variables?.task.id === t.id;
    const move = (status: TaskStatus, label: string, primary = false) => (
      <button type="button" className={`${primary ? "l-btn" : "l-btn2"} l-sm`} aria-busy={busy || undefined} aria-label={`${label}: ${t.title}`} onClick={() => { if (!busy) set.mutate({ task: t, status }); }}>{label}</button>
    );
    return (
      <div key={t.id} className="l-att-row l-mytask">
        <Leaf date={t.due} sub={sub} tone={late || (t.status !== "done" && n <= 3) ? "urgent" : undefined} label={`${t.title}, hạn ${dmy(t.due)}, ${sub}`} />
        <span className="l-field">
          <span className="l-att-row-title">{t.title}</span>
          <span className="l-note">{t.club.name} · {TASK_STATUS_LABEL[t.status].toLowerCase()}</span>
          <span className="l-row-actions">
            {t.status === "todo" && move("doing", "Bắt đầu")}
            {t.status !== "done" && move("done", "Xong", true)}
            {t.status === "done" && move("doing", "Mở lại")}
          </span>
        </span>
      </div>
    );
  };

  return (
    <>
      <h1 className="l-phone-title">Việc của tôi</h1>
      {tasks.length === 0 && <section className="l-pay-card"><p className="l-note">Chưa có việc nào được giao cho bạn.</p></section>}
      {open.length > 0 && <section className="l-pay-card l-att-rows" aria-label="Việc chưa xong">{open.map(row)}</section>}
      {done.length > 0 && (
        <section className="l-pay-card l-att-rows" aria-labelledby="done-tasks">
          <h2 id="done-tasks" className="l-subhead">Đã xong</h2>
          {done.map(row)}
        </section>
      )}
    </>
  );
}
