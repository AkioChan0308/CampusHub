// Chạy máy chủ: npm run dev (tự chạy lại khi sửa code) hoặc npm start.
// Có DATABASE_URL thì dữ liệu, phiên đăng nhập và tài khoản lưu trong PostgreSQL (docs/postgresql.md); không có thì chỉ trong bộ nhớ.

import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { API_PREFIX } from "./contract.ts";
import { createPgDb, type Db } from "./db/client.ts";
import { createAccounts } from "./accounts.ts";
import { createDbAccounts } from "./db/accounts.ts";
import { createDbSessions } from "./db/sessions.ts";
import { createDbStore } from "./db/store.ts";
import { seedDemoAccounts } from "./demo-accounts.ts";
import { createSessions } from "./sessions.ts";
import { createStore } from "./store.ts";

const config = loadConfig();
// DEMO_NOW (chế độ demo, để quay video): đồng hồ của máy chủ đi từ thời điểm đó, nên việc và hạn trong dữ liệu mẫu hiện đúng như ngày dữ liệu được viết.
const clockOffset = config.demoNow === undefined ? 0 : config.demoNow - Date.now();
const now = () => Date.now() + clockOffset;

let db: Db | undefined;
let where = "mẫu, trong bộ nhớ (chưa đặt DATABASE_URL)";
let store = createStore();
let sessions = createSessions(now);
let accounts = createAccounts();
if (config.databaseUrl) {
  db = createPgDb(config.databaseUrl);
  try {
    store = await createDbStore(db, { log: (m) => console.log(m) });
    sessions = await createDbSessions(db);
    accounts = await createDbAccounts(db);
  } catch (e) {
    console.error(`Không nối được PostgreSQL (${e instanceof Error ? e.message : e}).`);
    console.error("Kiểm tra PostgreSQL đã chạy và DATABASE_URL trong server/.env. Hướng dẫn: docs/postgresql.md.");
    await db.close().catch(() => {});
    process.exit(1);
  }
  where = `PostgreSQL ${new URL(config.databaseUrl).host}`;
}

// Chế độ demo: có sẵn tài khoản mẫu cho từng vai (trang đăng nhập liệt kê). Tài khoản đã có thì giữ nguyên.
if (config.authMode === "demo") await seedDemoAccounts(accounts, store.state, false);

const app = createApp({ config, store, sessions, accounts, now });
const server = app.listen(config.port, (err?: Error) => {
  if (err) {
    console.error(`Không mở được cổng ${config.port}: ${err.message}`);
    process.exit(1);
  }
  console.log(`CampusHub API: http://localhost:${config.port}${API_PREFIX} · đăng nhập: ${config.authMode} · dữ liệu: ${where}`);
  // Trang đăng nhập chỉ báo "Đăng nhập Google chưa mở"; lý do kỹ thuật ghi ở đây cho người chạy máy chủ.
  if (!config.googleClientId || !config.googleClientSecret) console.log("Chưa bật đăng nhập Google: thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào server/.env.");
});

// Tắt máy chủ (Ctrl+C, hoặc npm run dev chạy lại khi sửa code): chờ các lần ghi đang dở rồi đóng kết nối PostgreSQL.
async function shutdown() {
  server.close();
  await Promise.allSettled([store.persisted(), sessions.persisted()]);
  await db?.close().catch(() => {});
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
