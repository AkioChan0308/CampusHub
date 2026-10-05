// Đọc và ghi AppState vào các bảng. Ghi theo kiểu "so trước và sau": luật nghiệp vụ trả về AppState mới,
// ở đây so từng bảng theo khóa rồi chỉ thêm, sửa, xóa đúng những dòng đã đổi, trong transaction của người gọi.

import type { AppState } from "../domain.ts";
import type { Sql } from "./client.ts";
import { DATA_TABLES, rowsToState, TABLES, type TableDef, type Val } from "./tables.ts";

/** Nạp toàn bộ dữ liệu, đúng thứ tự đã thêm vào. */
export async function loadState(sql: Sql): Promise<AppState> {
  const rows: Record<string, Record<string, unknown>[]> = {};
  for (const t of TABLES) rows[t.name] = (await sql.query(`select * from ${t.name} order by seq`)).rows;
  return rowsToState(rows);
}

export async function isEmpty(sql: Sql): Promise<boolean> {
  return (await sql.query<{ n: number }>("select count(*)::int as n from persons")).rows[0].n === 0;
}

const MAX_ROWS_PER_INSERT = 500;

async function insertRows(sql: Sql, t: TableDef, rows: Val[][]): Promise<void> {
  for (let i = 0; i < rows.length; i += MAX_ROWS_PER_INSERT) {
    const chunk = rows.slice(i, i + MAX_ROWS_PER_INSERT);
    const params: Val[] = [];
    const values = chunk.map((r) => `(${r.map((v) => { params.push(v); return `$${params.length}`; }).join(", ")})`);
    await sql.query(`insert into ${t.name} (${t.cols.join(", ")}) values ${values.join(", ")}`, params);
  }
}

/** Ghi toàn bộ AppState vào các bảng đang trống (lần chạy đầu, hoặc sau khi đặt lại dữ liệu mẫu). */
export async function insertState(sql: Sql, state: AppState): Promise<void> {
  for (const t of TABLES) await insertRows(sql, t, t.rows(state));
}

/** Bản demo: xóa hết dữ liệu (giữ phiên đăng nhập) rồi ghi lại dữ liệu mẫu. Các bảng chỉ-được-thêm chỉ cho xóa hết khi có cờ này. */
export async function replaceState(sql: Sql, state: AppState): Promise<void> {
  await sql.query("select set_config('campushub.dat_lai_mau', 'on', true)");
  await sql.exec(`truncate ${DATA_TABLES.join(", ")} restart identity`);
  await insertState(sql, state);
}

const keyOf = (t: TableDef, r: Val[]) => JSON.stringify(r.slice(0, t.keyCount));
const where = (t: TableDef, offset: number) => t.cols.slice(0, t.keyCount).map((c, i) => `${c} = $${offset + i + 1}`).join(" and ");

/** Ghi phần khác nhau giữa hai AppState. Thêm theo thứ tự bảng (bảng cha trước), sửa, rồi xóa theo thứ tự ngược lại. */
export async function saveChanges(sql: Sql, before: AppState, after: AppState): Promise<void> {
  const removed: { t: TableDef; rows: Val[][] }[] = [];
  const changed: { t: TableDef; rows: Val[][] }[] = [];
  for (const t of TABLES) {
    if (before[t.source] === after[t.source]) continue;
    const old = new Map(t.rows(before).map((r) => [keyOf(t, r), r]));
    const added: Val[][] = [];
    const updated: Val[][] = [];
    for (const r of t.rows(after)) {
      const k = keyOf(t, r);
      const prev = old.get(k);
      if (!prev) added.push(r);
      else if (JSON.stringify(prev) !== JSON.stringify(r)) updated.push(r);
      old.delete(k);
    }
    if (added.length) await insertRows(sql, t, added);
    if (updated.length) changed.push({ t, rows: updated });
    if (old.size) removed.push({ t, rows: [...old.values()] });
  }
  for (const { t, rows } of changed) {
    const set = t.cols.slice(t.keyCount).map((c, i) => `${c} = $${i + 1}`).join(", ");
    const valueCount = t.cols.length - t.keyCount;
    for (const r of rows) await sql.query(`update ${t.name} set ${set} where ${where(t, valueCount)}`, [...r.slice(t.keyCount), ...r.slice(0, t.keyCount)]);
  }
  for (const { t, rows } of removed.reverse()) {
    for (const r of rows) await sql.query(`delete from ${t.name} where ${where(t, 0)}`, r.slice(0, t.keyCount));
  }
}
