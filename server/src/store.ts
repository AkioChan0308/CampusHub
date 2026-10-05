// Kho dữ liệu. Các handler chỉ đọc `state` và gọi `update` với một thao tác trong domain/actions.
// Hai cách lưu, cùng một giao diện:
//  - createStore: chỉ trong bộ nhớ, khởi động bằng dữ liệu mẫu, tắt máy chủ là mất. Dùng khi chưa đặt DATABASE_URL và trong test.
//  - createDbStore (src/db/store.ts): PostgreSQL. Dữ liệu vẫn giữ một bản trong bộ nhớ để đọc nhanh, mỗi thay đổi được ghi
//    vào cơ sở dữ liệu trong một transaction trước khi API trả lời (app.ts chờ `persisted()`).

import { createSeed, type AppState, type Update } from "./domain.ts";

export interface Store {
  readonly state: AppState;
  /** Áp một thao tác trong domain/actions, trả về dữ liệu mới. */
  update(fn: Update): AppState;
  /** Bản demo: đưa dữ liệu về dữ liệu mẫu. */
  reset(): void;
  /** Lần ghi gần nhất đã vào cơ sở dữ liệu chưa. Lỗi thì lời hứa bị từ chối và dữ liệu trong bộ nhớ quay về bản đã lưu. */
  persisted(): Promise<void>;
}

export function createStore(seed: () => AppState = createSeed): Store {
  let state = seed();
  return {
    get state() {
      return state;
    },
    update(fn) {
      state = fn(state);
      return state;
    },
    reset() {
      state = seed();
    },
    persisted: () => Promise.resolve(),
  };
}
