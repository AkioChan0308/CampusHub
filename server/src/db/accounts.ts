// Tài khoản đăng nhập bằng mật khẩu lưu trong PostgreSQL (bảng accounts). Như phiên đăng nhập: giữ một bản trong bộ nhớ
// để đọc nhanh, mỗi lần đổi thì ghi xuống, các lần ghi đi lần lượt. Bảng chỉ có mã băm, không có mật khẩu gốc.

import { accountsOn, type Account, type Accounts } from "../accounts.ts";
import { HttpError } from "../errors.ts";
import type { Db, Sql } from "./client.ts";

type Row = { person_id: string; username: string | null; password_hash: string | null; failed_count: number; locked_until: Date | string | null };

/** Gọi sau createDbStore (bảng accounts do migration tạo). */
export async function createDbAccounts(db: Db): Promise<Accounts> {
  const rows = (await db.query<Row>("select person_id, username, password_hash, failed_count, locked_until from accounts")).rows;
  const map = new Map<string, Account>(rows.map((r) => [r.person_id, {
    personId: r.person_id,
    ...(r.username ? { username: r.username } : {}),
    ...(r.password_hash ? { passwordHash: r.password_hash } : {}),
    failedCount: Number(r.failed_count),
    ...(r.locked_until ? { lockedUntil: new Date(r.locked_until).getTime() } : {}),
  }]));

  let tail: Promise<void> = Promise.resolve();
  let last: Promise<void> = Promise.resolve();
  function write(run: (sql: Sql) => Promise<unknown>): void {
    const job = tail.then(() => run(db)).then(() => {}, (e: unknown) => {
      console.error("Không ghi được tài khoản vào PostgreSQL:", e instanceof Error ? e.message : e);
      throw new HttpError(500, "INTERNAL", "Máy chủ chưa lưu được tài khoản. Thử lại sau.");
    });
    tail = job.catch(() => {});
    last = job;
  }

  const save = (a: Account) => write((sql) => sql.query(
    `insert into accounts (person_id, username, password_hash, failed_count, locked_until, updated_at) values ($1, $2, $3, $4, $5, now())
     on conflict (person_id) do update set username = excluded.username, password_hash = excluded.password_hash,
       failed_count = excluded.failed_count, locked_until = excluded.locked_until, updated_at = now()`,
    [a.personId, a.username ?? null, a.passwordHash ?? null, a.failedCount, a.lockedUntil ? new Date(a.lockedUntil).toISOString() : null],
  ));
  const clear = () => write((sql) => sql.query("delete from accounts"));
  return accountsOn(map, save, clear, () => last);
}
