// Phiên đăng nhập lưu trong PostgreSQL (bảng sessions), để khởi động lại máy chủ không phải đăng nhập lại.
// Bảng chỉ lưu mã băm SHA-256 của cookie phiên: ai đọc được bảng cũng không có cookie để đăng nhập.
// Như kho dữ liệu, phiên giữ một bản trong bộ nhớ để kiểm tra nhanh ở mỗi yêu cầu; mở hay xóa phiên thì ghi xuống lần lượt.

import { createHash } from "node:crypto";
import { HttpError } from "../errors.ts";
import { createSessions, randomToken, SESSION_SECONDS, type Sessions } from "../sessions.ts";
import type { Db, Sql } from "./client.ts";

const hash = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Gọi sau createDbStore (bảng sessions do migration tạo). */
export async function createDbSessions(db: Db, now: () => number = Date.now): Promise<Sessions> {
  const pendingLogins = createSessions(now); // chỉ dùng phần lượt đăng nhập Google đang dở
  await db.query("delete from sessions where expires_at < $1", [new Date(now()).toISOString()]);
  const rows = (await db.query<{ token_hash: string; person_id: string; expires_at: Date | string }>("select token_hash, person_id, expires_at from sessions")).rows;
  const sessions = new Map(rows.map((r) => [r.token_hash, { personId: r.person_id, expires: new Date(r.expires_at).getTime() }]));

  let tail: Promise<void> = Promise.resolve();
  let last: Promise<void> = Promise.resolve();
  function write(run: (sql: Sql) => Promise<unknown>, undo?: () => void): void {
    const job = tail.then(() => run(db)).then(() => {}, (e: unknown) => {
      undo?.();
      console.error("Không ghi được phiên đăng nhập vào PostgreSQL:", e instanceof Error ? e.message : e);
      throw new HttpError(500, "INTERNAL", "Máy chủ chưa lưu được phiên đăng nhập. Thử lại sau.");
    });
    tail = job.catch(() => {});
    last = job;
  }
  const remove = (h: string) => write((sql) => sql.query("delete from sessions where token_hash = $1", [h]));

  return {
    start(personId) {
      const token = randomToken();
      const h = hash(token);
      const expires = now() + SESSION_SECONDS * 1000;
      sessions.set(h, { personId, expires });
      write((sql) => sql.query("insert into sessions (token_hash, person_id, expires_at) values ($1, $2, $3)", [h, personId, new Date(expires).toISOString()]), () => sessions.delete(h));
      return token;
    },
    personId(token) {
      if (!token) return undefined;
      const h = hash(token);
      const s = sessions.get(h);
      if (!s) return undefined;
      if (s.expires < now()) {
        sessions.delete(h);
        remove(h);
        return undefined;
      }
      return s.personId;
    },
    end(token) {
      if (!token) return;
      const h = hash(token);
      if (sessions.delete(h)) remove(h);
    },
    savePending: pendingLogins.savePending,
    takePending: pendingLogins.takePending,
    persisted: () => last,
  };
}
