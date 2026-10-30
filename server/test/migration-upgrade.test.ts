// Chạy: npm test. Nâng cấp cơ sở dữ liệu CŨ lên các migration 004 đến 006: dữ liệu bàn giao đã có không mất, bước cũ từ 3 trở đi dời xuống một bước.
// Dùng PGlite (PostgreSQL chạy trong Node), không đụng tới cơ sở dữ liệu thật.

import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { MIGRATIONS_DIR, migrate } from "../src/db/migrate.ts";
import { loadState } from "../src/db/state.ts";
import { createPgliteDb } from "./pglite.ts";

/** Thư mục chỉ có ba migration đầu (cơ sở dữ liệu như trước ngày 22/10/2026). */
function oldMigrations(): URL {
  const dir = mkdtempSync(join(tmpdir(), "campushub-old-migrations-"));
  for (const f of readdirSync(MIGRATIONS_DIR).filter((x) => /^00[123]_/.test(x))) copyFileSync(new URL(f, MIGRATIONS_DIR), join(dir, f));
  return pathToFileURL(dir + "/");
}

test("nâng cấp từ cơ sở dữ liệu cũ: bàn giao ở bước 1, 2 giữ nguyên, bước 3 trở đi dời xuống một bước, mất không dữ liệu nào", async () => {
  const db = await createPgliteDb();
  try {
    assert.deepEqual(await migrate(db, oldMigrations()), ["001_khoi_tao.sql", "002_tien_cho_sao_ke.sql", "003_tai_khoan.sql"]);

    // Dữ liệu theo lược đồ CŨ: ba CLB, mỗi CLB một bàn giao ở một bước khác nhau.
    await db.exec(`
      insert into persons (id, name, email, kind) values ('p1', 'Người thử', 'thu@example.com', 'student');
      insert into clubs (id, name, field, schedule, location, accepting_applications, term) values
        ('c1', 'CLB một', 'Khác', 'Tối', 'Phòng', true, 'Fall 2026'),
        ('c2', 'CLB hai', 'Khác', 'Tối', 'Phòng', true, 'Fall 2026'),
        ('c3', 'CLB ba', 'Khác', 'Tối', 'Phòng', true, 'Fall 2026');
      insert into handovers (club_id, from_term, to_term, step, locked_balance, new_receiver_person_id, new_receiver_bank, new_receiver_account, transfer_ref) values
        ('c1', 'Fall 2026', 'Spring 2027', 1, 0, null, null, null, null),
        ('c2', 'Fall 2026', 'Spring 2027', 2, 500000, null, null, null, null),
        ('c3', 'Fall 2026', 'Spring 2027', 3, 3120000, 'p1', '[Ngân hàng]', '0123456789', 'MB1');
    `);

    // Chạy các migration còn lại (004 tới 009).
    assert.deepEqual(await migrate(db), ["004_handover_kit.sql", "005_handover_steps.sql", "006_ai_assistant.sql", "007_posts.sql", "008_mentor_confirm.sql", "009_notifications.sql"]);

    const steps = (await db.query<{ club_id: string; step: number }>("select club_id, step from handovers order by club_id")).rows;
    assert.deepEqual(steps.map((r) => Number(r.step)), [1, 2, 4], "bước 3 cũ (đổi tài khoản nhận quỹ) thành bước 4 mới");

    const h = (await load(db)).handovers.find((x) => x.clubId === "c3")!;
    assert.equal(h.step, 4);
    assert.equal(h.lockedBalance, 3_120_000);
    assert.deepEqual(h.newReceiver, { personId: "p1", bank: "[Ngân hàng]", account: "0123456789" });
    assert.equal(h.transferRef, "MB1");
    assert.deepEqual(h.history, []);
    assert.deepEqual(h.transferred, []);
    assert.equal(h.newBoard, undefined, "dữ liệu cũ chưa có ban mới: phải quay lại bước 1 chọn");
    assert.equal(h.summary, undefined);

    // Bảng mới có và trống; ràng buộc bước nới tới 7 nhưng không hơn.
    for (const t of ["kit_documents", "kit_processes", "kit_accounts", "tasks", "task_history", "ai_usage"]) {
      assert.equal(Number((await db.query<{ n: number }>(`select count(*)::int as n from ${t}`)).rows[0].n), 0, t);
    }
    await db.exec("update handovers set step = 7 where club_id = 'c1'");
    await assert.rejects(db.exec("update handovers set step = 8 where club_id = 'c1'"), /check/i);

    // Chạy lại không làm gì (đã áp rồi).
    assert.deepEqual(await migrate(db), []);
  } finally {
    await db.close();
  }
});

const load = (db: Awaited<ReturnType<typeof createPgliteDb>>) => loadState(db);
