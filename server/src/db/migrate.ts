// Chạy các file trong server/db/migrations theo thứ tự tên (001_…, 002_…). File nào đã chạy thì ghi vào bảng
// schema_migrations và không chạy lại. Mỗi file chạy trong một transaction: lỗi giữa chừng thì không đổi gì.

import { readdirSync, readFileSync } from "node:fs";
import type { Db } from "./client.ts";

export const MIGRATIONS_DIR = new URL("../../db/migrations/", import.meta.url);

/** Trả về tên các file vừa chạy. */
export async function migrate(db: Db, dir: URL = MIGRATIONS_DIR): Promise<string[]> {
  await db.exec("create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await db.query<{ version: string }>("select version from schema_migrations")).rows.map((r) => r.version));
  const files = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(new URL(file, dir), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("insert into schema_migrations (version) values ($1)", [file]);
    });
    applied.push(file);
  }
  return applied;
}
