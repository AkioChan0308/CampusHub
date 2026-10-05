// Xuất CSV: Excel mở được, có BOM để hiện đúng tiếng Việt. File .xlsx thật làm khi có backend.
// Phần đọc CSV nằm ở text.ts vì máy chủ dùng chung; file này tải file nên chỉ chạy trên trình duyệt.

type Cell = string | number | undefined | null;

function esc(v: Cell): string {
  let s = v === undefined || v === null ? "" : String(v);
  // Chữ người dùng gõ mở đầu bằng = + - @ thì Excel coi là công thức: thêm dấu nháy để Excel hiện nguyên chữ.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Cell[][]): string {
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, rows: Cell[][]): void {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
