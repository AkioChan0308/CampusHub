import { notFound } from "../errors.ts";
import type { Handlers } from "./types.ts";

export const systemHandlers: Pick<Handlers, "health" | "resetDemo"> = {
  health: (ctx) => ({ ok: true, authMode: ctx.config.authMode, googleLogin: Boolean(ctx.config.googleClientId && ctx.config.googleClientSecret) }),

  /** Chỉ có ở chế độ demo: đưa dữ liệu về dữ liệu mẫu ban đầu. */
  resetDemo: (ctx) => {
    if (ctx.config.authMode !== "demo") throw notFound("Không có API này.");
    ctx.resetStore();
    return { ok: true };
  },
};
