// Trợ lý cho bàn giao (22/10/2026): tóm tắt cho ban mới, hỏi đáp trong Kho bàn giao, lưu bản tóm tắt vào biên bản.
// Bản mẫu (AI_MODE=mock) tính từ dữ liệu của CLB; mô tả và giới hạn ở src/ai.ts. Trợ lý không tự gửi cho ai, không tự đổi dữ liệu.

import { requireBoard, requireMember, requireRight } from "../access.ts";
import { aiUsageOf, countAiUse, saveHandoverSummary, type Club } from "../domain.ts";
import { asksAsBoard, createAssistant } from "../ai.ts";
import { conflict, notFound } from "../errors.ts";
import { aiAskBody, parseBody, saveSummaryBody } from "../schemas.ts";
import { handoverRes } from "../responses.ts";
import type { Ctx, Handlers } from "./types.ts";
import type { EndpointId } from "../contract.ts";

type Keys = "getAiStatus" | "aiSummary" | "askAi" | "saveHandoverSummary";

/** Lượt đã dùng của CLB trong học kỳ; limit chỉ có khi đã đặt AI_FREE_ASKS_PER_TERM. */
function usage(ctx: Ctx<EndpointId>, club: Club) {
  const u = aiUsageOf(ctx.state, club.id, club.term);
  return { asks: u.asks, summaries: u.summaries, ...(ctx.config.aiFreeAsks > 0 ? { limit: ctx.config.aiFreeAsks } : {}) };
}

export const aiHandlers: Pick<Handlers, Keys> = {
  getAiStatus: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    return { mode: ctx.config.aiMode, usage: usage(ctx, club) };
  },

  /** Bản nháp tóm tắt cho ban mới. Không lưu gì; lưu vào biên bản là việc riêng (PUT /handover/summary), sau khi người duyệt sửa. */
  aiSummary: async (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    const draft = await createAssistant(ctx.config).summarize(ctx.state, club, ctx.now());
    ctx.update(countAiUse(club.id, club.term, "summaries"));
    return { mode: draft.mode, text: draft.text, bullets: draft.bullets, usage: usage(ctx, club) };
  },

  /** Hỏi đáp chỉ từ nội dung kho mà người hỏi được thấy: thành viên thường không nhận gì từ phần tài khoản. */
  askAi: async (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    const body = parseBody(aiAskBody, ctx.body);
    const cap = ctx.config.aiFreeAsks;
    if (cap > 0 && aiUsageOf(ctx.state, club.id, club.term).asks >= cap) throw conflict(`CLB đã dùng hết ${cap} lượt hỏi của kỳ ${club.term} (bản miễn phí).`);
    const answer = await createAssistant(ctx.config).ask(ctx.state, club, body.question, asksAsBoard(ctx.state, club.id, ctx.me.id));
    ctx.update(countAiUse(club.id, club.term, "asks"));
    return { mode: answer.mode, found: answer.found, answer: answer.answer, sources: answer.sources, usage: usage(ctx, club) };
  },

  /** Lưu bản tóm tắt (đã sửa) vào biên bản: ghi ai lưu, lúc nào. Không lưu được sau khi ban mới đã xác nhận. */
  saveHandoverSummary: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "handover");
    const h = ctx.state.handovers.find((x) => x.clubId === club.id);
    if (!h) throw notFound("CLB chưa khởi tạo bàn giao.");
    if (h.acceptedAt) throw conflict("Ban mới đã xác nhận nên biên bản không sửa được nữa.");
    const body = parseBody(saveSummaryBody, ctx.body);
    const s = ctx.update(saveHandoverSummary(club.id, body.text, ctx.config.aiMode === "mock", ctx.me.id, ctx.nowIso()));
    return handoverRes(s, club, ctx.me.id)!;
  },
};
