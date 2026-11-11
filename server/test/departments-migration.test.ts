// Chạy: npm test. Nâng cấp cơ sở dữ liệu CŨ (đến migration 009) lên 010: mỗi ban đang có thành viên thành một ban của CLB, mỗi ban đúng một trưởng,
// vai trưởng ban khớp với việc làm trưởng ban, và ban mới ở bước 1 của bàn giao đổi sang "trưởng của từng ban".
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

/** Thư mục chỉ có các migration 001 đến 009 (cơ sở dữ liệu như trước ngày 09/11/2026). */
function migrationsUpTo009(): URL {
  const dir = mkdtempSync(join(tmpdir(), "campushub-before-departments-"));
  for (const f of readdirSync(MIGRATIONS_DIR).filter((x) => /^00\d_/.test(x))) copyFileSync(new URL(f, MIGRATIONS_DIR), join(dir, f));
  return pathToFileURL(dir + "/");
}

test("nâng cấp lên 010: ban lấy từ thành viên, mỗi ban một trưởng, vai khớp, ban mới của bàn giao đổi dạng", async () => {
  const db = await createPgliteDb();
  try {
    assert.equal((await migrate(db, migrationsUpTo009())).at(-1), "009_notifications.sql");

    await db.exec(`
      insert into persons (id, name, email, kind) values
        ('p1', 'Một', 'p1@example.com', 'student'), ('p2', 'Hai', 'p2@example.com', 'student'), ('p3', 'Ba', 'p3@example.com', 'student'),
        ('p4', 'Bốn', 'p4@example.com', 'student'), ('p5', 'Năm', 'p5@example.com', 'student'), ('p6', 'Sáu', 'p6@example.com', 'student'),
        ('p7', 'Bảy', 'p7@example.com', 'student');
      insert into clubs (id, name, field, schedule, location, accepting_applications, term) values
        ('c1', 'CLB một', 'Khác', 'Tối', 'Phòng', true, 'Fall 2026'), ('c2', 'CLB hai', 'Khác', 'Tối', 'Phòng', true, 'Fall 2026');
      insert into memberships (club_id, person_id, code, department, role, invite) values
        ('c1', 'p1', 'A001', 'Ban chủ nhiệm', 'president', 'accepted'),
        ('c1', 'p2', 'A002', 'Hậu cần', 'head', 'accepted'),
        ('c1', 'p3', 'A003', 'Hậu cần', 'head', 'accepted'),
        ('c1', 'p4', 'A004', 'Hậu cần', 'member', 'accepted'),
        ('c1', 'p5', 'A005', 'Chưa xếp ban', 'head', 'accepted'),
        ('c1', 'p6', 'A006', 'Truyền thông', 'member', 'accepted'),
        ('c2', 'p7', 'A001', 'Ban chủ nhiệm', 'president', 'accepted');
      insert into handovers (club_id, from_term, to_term, step, locked_balance, new_board) values
        ('c1', 'Fall 2026', 'Spring 2027', 2, 0, '{"president": "p4", "heads": ["p2", "p3", "p6"]}');
    `);

    assert.deepEqual(await migrate(db), ["010_departments.sql", "011_role_handovers.sql", "012_role_handover_notes.sql"]);
    const s = await loadState(db);

    // Ban: mỗi ban đang có thành viên, theo thứ tự thành viên đầu tiên của ban; "Chưa xếp ban" không phải một ban.
    assert.deepEqual(s.departments.map((d) => [d.id, d.clubId, d.name, d.headId]), [
      ["ban-c1-1", "c1", "Ban chủ nhiệm", undefined],
      ["ban-c1-2", "c1", "Hậu cần", "p2"], // hai người vai trưởng ban: người vào trước làm trưởng
      ["ban-c1-3", "c1", "Truyền thông", undefined],
      ["ban-c2-1", "c2", "Ban chủ nhiệm", undefined],
    ]);

    // Vai trưởng ban khớp việc làm trưởng ban: người thứ hai của Hậu cần và người chưa xếp ban về thành viên.
    const role = (id: string) => s.memberships.find((m) => m.personId === id)!.role;
    assert.deepEqual(["p1", "p2", "p3", "p4", "p5", "p6", "p7"].map(role), ["president", "head", "member", "member", "member", "member", "president"]);

    // Ban mới ở bước 1: trưởng của từng ban (mỗi ban một người), người không còn ban nào thì bỏ.
    assert.deepEqual(s.handovers[0].newBoard, {
      president: "p4",
      heads: [{ department: "Hậu cần", personId: "p2" }, { department: "Truyền thông", personId: "p6" }],
    });

    // Tên ban không trùng trong một CLB (không phân biệt hoa thường); CLB khác dùng được.
    await assert.rejects(db.exec("insert into departments (id, club_id, name) values ('x', 'c1', 'HẬU CẦN')"), /unique|duplicate/i);
    await db.exec("insert into departments (id, club_id, name) values ('y', 'c2', 'Hậu cần')");
  } finally {
    await db.close();
  }
});
