// Kho dữ liệu lưu bằng PostgreSQL.
//
// Cách làm: giữ một bản AppState trong bộ nhớ để handler đọc ngay (luật nghiệp vụ trong web/src/lib vẫn chạy trên AppState).
// Mỗi lần update: áp luật ngay trên bản trong bộ nhớ (cùng lúc với lúc handler kiểm tra điều kiện, nên không có hai yêu cầu
// chen nhau), rồi xếp hàng ghi phần thay đổi vào cơ sở dữ liệu, mỗi lần ghi một transaction, lần lượt từng lần.
// API chỉ trả lời sau khi phần ghi của nó xong (app.ts chờ persisted()).
//
// Ghi lỗi (ví dụ PostgreSQL tắt): dữ liệu trong bộ nhớ quay về bản đã lưu gần nhất, các lần ghi đang chờ phía sau cũng bị hủy
// (chúng dựa trên thay đổi vừa lỗi), API trả lỗi 500 và người dùng làm lại.
//
// Giới hạn: chỉ chạy MỘT máy chủ cho một cơ sở dữ liệu (đủ cho pilot). Chạy nhiều máy chủ thì mỗi máy có bản trong bộ nhớ riêng
// và sẽ lệch nhau; lúc đó phải đổi sang đọc thẳng từ cơ sở dữ liệu (docs/postgresql.md, mục "Giới hạn").

import { createSeed, type AppState } from "../domain.ts";
import { HttpError } from "../errors.ts";
import type { Store } from "../store.ts";
import type { Db, Sql } from "./client.ts";
import { migrate } from "./migrate.ts";
import { insertState, isEmpty, loadState, replaceState, saveChanges } from "./state.ts";

export interface DbStoreOptions {
  /** Dữ liệu mẫu nạp vào khi cơ sở dữ liệu còn trống, và khi đặt lại dữ liệu mẫu. */
  seed?: () => AppState;
  log?: (message: string) => void;
}

export async function createDbStore(db: Db, { seed = createSeed, log = () => {} }: DbStoreOptions = {}): Promise<Store> {
  const applied = await migrate(db);
  if (applied.length) log(`Đã tạo hoặc cập nhật bảng: ${applied.join(", ")}`);
  if (await isEmpty(db)) {
    await db.transaction((tx) => insertState(tx, seed()));
    log("Cơ sở dữ liệu còn trống: đã nạp dữ liệu mẫu.");
  }
  // Đọc lại từ cơ sở dữ liệu (kể cả lần vừa nạp) để bản trong bộ nhớ đúng y như bản đã lưu.
  let state = await loadState(db);
  let committed = state;
  let generation = 0;
  let tail: Promise<void> = Promise.resolve();
  let last: Promise<void> = Promise.resolve();

  function enqueue(after: AppState, write: (tx: Sql) => Promise<void>): void {
    const gen = generation;
    const job = tail.then(async () => {
      if (gen !== generation) throw new HttpError(500, "INTERNAL", "Thay đổi trước đó chưa lưu được nên thay đổi này cũng chưa được lưu. Thử lại.");
      try {
        await db.transaction(write);
        committed = after;
      } catch (e) {
        generation++;
        state = committed;
        console.error("Không ghi được vào PostgreSQL:", e instanceof Error ? e.message : e);
        throw new HttpError(500, "INTERNAL", "Máy chủ chưa lưu được thay đổi. Thử lại sau.");
      }
    });
    tail = job.catch(() => {});
    last = job;
  }

  return {
    get state() {
      return state;
    },
    update(fn) {
      const before = state;
      const after = fn(before);
      if (after === before) return state;
      state = after;
      enqueue(after, (tx) => saveChanges(tx, before, after));
      return after;
    },
    reset() {
      const fresh = seed();
      state = fresh;
      enqueue(fresh, (tx) => replaceState(tx, fresh));
    },
    persisted: () => last,
  };
}
