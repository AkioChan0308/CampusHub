// Việc cần làm (22/10/2026; bản vẽ chưa có, mô tả ở docs/tien-do-mvp.md, phần B, mục 5.3).
// Ban điều hành tạo, giao và sửa việc. Người được giao đổi được trạng thái việc của mình. Mọi đổi trạng thái lưu lịch sử (ai, lúc nào).

import { requireBoard, requireMember, requireRight } from "../access.ts";
import { can, createTask, membershipOf, nowIso, setTaskStatus, tasksOf, uid, updateTask, type AppState, type ClubTask } from "../domain.ts";
import { forbidden, invalid, notFound } from "../errors.ts";
import { parseBody, taskBody, taskStatusBody } from "../schemas.ts";
import { clubRef, taskDto, tasksRes } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys = "listTasks" | "createTask" | "updateTask" | "setTaskStatus" | "getMyTasks";

/** Thời điểm gửi lên đổi về đúng dạng mọi thời điểm trong dữ liệu ("2026-10-10T07:30:00+07:00"). */
const at = (iso: string) => nowIso(Date.parse(iso));

function findTask(s: AppState, clubId: string, taskId: string): ClubTask {
  const t = s.tasks.find((x) => x.id === taskId && x.clubId === clubId);
  if (!t) throw notFound("Không tìm thấy việc này.");
  return t;
}

/** Người phụ trách phải là thành viên đã nhận lời mời; buổi và quy trình gắn kèm phải của chính CLB này. */
function checkFields(s: AppState, clubId: string, body: { assigneeId: string; eventId?: string; processId?: string }) {
  const m = membershipOf(s, clubId, body.assigneeId);
  if (!m || m.invite !== "accepted") throw invalid("Người phụ trách phải là thành viên đã nhận lời mời.");
  if (body.eventId && !s.events.some((e) => e.id === body.eventId && e.clubId === clubId)) throw invalid("Buổi gắn kèm phải là buổi của CLB.");
  if (body.processId && !s.kitProcesses.some((p) => p.id === body.processId && p.clubId === clubId)) throw invalid("Quy trình gắn kèm phải nằm trong kho bàn giao của CLB.");
}

export const taskHandlers: Pick<Handlers, Keys> = {
  listTasks: (ctx) => tasksRes(ctx.state, requireBoard(ctx.state, ctx.params.clubId, ctx.me).club),

  createTask: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "task");
    const body = parseBody(taskBody, ctx.body);
    checkFields(ctx.state, club.id, body);
    const id = uid("viec");
    const s = ctx.update(createTask({
      id, clubId: club.id, title: body.title.replace(/\s+/g, " "), assigneeId: body.assigneeId, due: at(body.due),
      ...(body.eventId ? { eventId: body.eventId } : {}), ...(body.processId ? { processId: body.processId } : {}), createdBy: ctx.me.id, createdAt: ctx.nowIso(),
    }));
    return { task: taskDto(s, s.tasks.find((t) => t.id === id)!) };
  },

  updateTask: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "task");
    const old = findTask(ctx.state, club.id, ctx.params.taskId);
    const body = parseBody(taskBody, ctx.body);
    checkFields(ctx.state, club.id, body);
    const s = ctx.update(updateTask(old.id, {
      title: body.title.replace(/\s+/g, " "), assigneeId: body.assigneeId, due: at(body.due),
      ...(body.eventId ? { eventId: body.eventId } : {}), ...(body.processId ? { processId: body.processId } : {}),
    }, ctx.me.id, ctx.nowIso()));
    return { task: taskDto(s, s.tasks.find((t) => t.id === old.id)!) };
  },

  /** Ban điều hành đổi trạng thái việc nào cũng được; thành viên chỉ đổi việc của mình. */
  setTaskStatus: (ctx) => {
    const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    const old = findTask(ctx.state, club.id, ctx.params.taskId);
    if (old.assigneeId !== ctx.me.id && !can(ms.role, "task")) throw forbidden("Thành viên chỉ đổi trạng thái việc của mình.");
    const body = parseBody(taskStatusBody, ctx.body);
    const s = ctx.update(setTaskStatus(old.id, body.status, ctx.me.id, ctx.nowIso()));
    return { task: taskDto(s, s.tasks.find((t) => t.id === old.id)!) };
  },

  /** Việc của người đang đăng nhập ở mọi CLB họ đã nhận lời mời. */
  getMyTasks: (ctx) => {
    const s = ctx.state;
    const mine = s.clubs.filter((c) => { const m = membershipOf(s, c.id, ctx.me.id); return m?.invite === "accepted"; });
    return {
      tasks: mine.flatMap((c) => tasksOf(s, c.id).filter((t) => t.assigneeId === ctx.me.id).map((t) => ({ ...taskDto(s, t), club: clubRef(c) })))
        .sort((a, b) => a.due.localeCompare(b.due)),
    };
  },
};
