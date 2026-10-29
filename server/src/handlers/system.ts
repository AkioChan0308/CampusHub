import { seedDemoAccounts } from "../demo-accounts.ts";
import { notFound } from "../errors.ts";
import type { Handlers } from "./types.ts";

export const systemHandlers: Pick<Handlers, "health" | "resetDemo"> = {
  health: (ctx) => ({ ok: true, authMode: ctx.config.authMode, googleLogin: Boolean(ctx.config.googleClientId && ctx.config.googleClientSecret) }),

  /** Chỉ có ở chế độ demo: đưa dữ liệu về dữ liệu mẫu ban đầu, xóa tài khoản đã đặt rồi tạo lại tài khoản mẫu của từng vai. */
  resetDemo: async (ctx) => {
    if (ctx.config.authMode !== "demo") throw notFound("Không có API này.");
    ctx.resetStore();
    ctx.auth.accounts.reset(); // tài khoản đặt mật khẩu trên dữ liệu cũ không còn người tương ứng
    await seedDemoAccounts(ctx.auth.accounts, ctx.state, true);
    return { ok: true };
  },
};
