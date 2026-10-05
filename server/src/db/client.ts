// Kết nối PostgreSQL. Phần còn lại của máy chủ chỉ dùng kiểu Db ở đây, nên test thay được bằng PGlite
// (PostgreSQL chạy ngay trong Node, xem test/pglite.ts) mà không cần cài hay chạy PostgreSQL.

import pg from "pg";

/** Chạy câu lệnh SQL. query: một câu, có tham số $1, $2…; exec: nhiều câu một lúc, không tham số (file migration). */
export interface Sql {
  query<R = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
  exec(text: string): Promise<void>;
}

export interface Db extends Sql {
  /** Chạy fn trong một transaction: lỗi ở bất kỳ câu nào thì hủy cả transaction. */
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// bigint (int8) mặc định trả về chuỗi; tiền và số thứ tự trong CampusHub nhỏ hơn 2^53 nên đọc thành số.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

export function createPgDb(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString, max: 5 });
  // Lỗi của kết nối đang rảnh (ví dụ PostgreSQL tắt): ghi lại, không để máy chủ sập. Lần gọi sau sẽ báo lỗi riêng.
  pool.on("error", (err) => console.error("PostgreSQL:", err.message));
  const wrap = (c: pg.Pool | pg.PoolClient): Sql => ({
    query: async <R,>(text: string, params?: unknown[]) => ({ rows: (await c.query(text, params)).rows as R[] }),
    exec: async (text) => { await c.query(text); },
  });
  return {
    ...wrap(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const result = await fn(wrap(client));
        await client.query("commit");
        return result;
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
