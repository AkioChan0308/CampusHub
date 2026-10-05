// Chỉ ở chế độ demo: tạo tài khoản mẫu cho từng vai (danh sách ở web/src/lib/demo-accounts.ts, trang đăng nhập hiện ra).
// Gọi lúc khởi động (giữ tài khoản đã có) và sau khi đặt lại dữ liệu mẫu (tạo lại hết).

import type { Accounts } from "./accounts.ts";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type AppState } from "./domain.ts";
import { hashPassword } from "./password.ts";

// Mọi tài khoản mẫu cùng một mật khẩu: băm một lần cho cả máy chủ (băm scrypt mất cỡ 0,2 giây mỗi lần).
let hashed: Promise<string> | undefined;

/**
 * overwrite = false: người đã có tài khoản thì giữ nguyên (người thử đã đổi mật khẩu thì khởi động lại vẫn còn),
 * tên tài khoản mẫu đã bị người khác lấy thì bỏ qua người đó. overwrite = true: dùng ngay sau khi xóa hết tài khoản.
 */
export async function seedDemoAccounts(accounts: Accounts, state: AppState, overwrite: boolean): Promise<void> {
  hashed ??= hashPassword(DEMO_PASSWORD);
  const hash = await hashed;
  for (const a of DEMO_ACCOUNTS) {
    if (!state.persons.some((p) => p.id === a.personId)) continue;
    if (!overwrite) {
      if (accounts.get(a.personId)?.passwordHash) continue;
      const owner = accounts.byUsername(a.username);
      if (owner && owner.personId !== a.personId) continue;
    }
    accounts.setCredentials(a.personId, a.username, hash);
  }
}
