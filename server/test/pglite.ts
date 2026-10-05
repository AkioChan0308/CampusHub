// PostgreSQL chạy ngay trong Node (PGlite), để test phần lưu dữ liệu mà không cần cài hay chạy PostgreSQL.
// Mỗi lần gọi là một cơ sở dữ liệu mới, trống, nằm trong bộ nhớ.

import { PGlite } from "@electric-sql/pglite";
import type { Db, Sql } from "../src/db/client.ts";

type Runner = { query: PGlite["query"]; exec: PGlite["exec"] };

const wrap = (p: Runner): Sql => ({
  query: async <R,>(text: string, params?: unknown[]) => ({ rows: (await p.query<R>(text, params)).rows }),
  exec: async (text) => { await p.exec(text); },
});

export async function createPgliteDb(): Promise<Db> {
  const pg = await PGlite.create();
  return {
    ...wrap(pg),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))),
    close: () => pg.close(),
  };
}
