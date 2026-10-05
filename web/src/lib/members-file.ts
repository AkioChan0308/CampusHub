// Đọc danh sách thành viên từ file Excel hoặc CSV (đã đổi thành bảng chữ) và kiểm lỗi từng dòng trước khi thêm.
// Chỉ xử lý bảng; đọc file là việc của trình duyệt (màn Thêm thành viên). Không dùng API của trình duyệt ở đây.

import { toAsciiUpper } from "./text.ts";

export interface DraftMember {
  name: string;
  email: string;
  department: string;
  /** Để dạng chữ như người dùng gõ; kiểm lỗi riêng. Trống là không ghi năm học. */
  year: string;
}

export type DraftErrors = Partial<Record<keyof DraftMember, string>>;

/** Tiêu đề cột của file mẫu, theo thứ tự. File không có dòng tiêu đề thì đọc theo đúng thứ tự này. */
export const MEMBER_FILE_HEADERS = ["Họ tên", "Email", "Ban", "Năm học"] as const;

const HEADER_WORDS: Record<keyof DraftMember, string[]> = {
  name: ["HO TEN", "HO VA TEN", "TEN", "HO TEN DAY DU", "NAME", "FULL NAME"],
  email: ["EMAIL", "E-MAIL", "GMAIL", "MAIL", "DIA CHI EMAIL"],
  department: ["BAN", "BO PHAN", "DEPARTMENT"],
  year: ["NAM HOC", "NAM", "SINH VIEN NAM", "YEAR"],
};
/** Cột có trong file của CLB nhưng CampusHub không lưu (bản vẽ không dùng tới). */
const IGNORED_WORDS = ["MSSV", "MA SO SINH VIEN", "MA SINH VIEN", "STT", "SO THU TU"];

const cellText = (v: unknown): string => (v === null || v === undefined ? "" : v instanceof Date ? "" : String(v)).replace(/\s+/g, " ").trim();
const norm = (v: unknown) => toAsciiUpper(cellText(v));

/**
 * Bảng (dòng × ô) → danh sách người. Tìm dòng tiêu đề trong 5 dòng đầu (có cột email); không có thì coi file theo thứ tự mẫu.
 * ignored: tên các cột có trong file mà không lưu (ví dụ MSSV), để màn báo cho người dùng biết.
 */
export function tableToMembers(table: unknown[][]): { members: DraftMember[]; ignored: string[] } {
  const rows = table.filter((r) => r.some((c) => cellText(c) !== ""));
  const headerIndex = rows.slice(0, 5).findIndex((r) => r.some((c) => HEADER_WORDS.email.includes(norm(c))));
  let col: Record<keyof DraftMember, number> = { name: 0, email: 1, department: 2, year: 3 };
  const ignored: string[] = [];
  if (headerIndex >= 0) {
    const header = rows[headerIndex].map(norm);
    const find = (words: string[]) => header.findIndex((h) => words.includes(h));
    col = { name: find(HEADER_WORDS.name), email: find(HEADER_WORDS.email), department: find(HEADER_WORDS.department), year: find(HEADER_WORDS.year) };
    rows[headerIndex].forEach((c, i) => { if (IGNORED_WORDS.includes(header[i])) ignored.push(cellText(c)); });
  }
  const body = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows;
  const at = (r: unknown[], i: number) => (i >= 0 ? cellText(r[i]) : "");
  return {
    members: body.map((r) => ({ name: at(r, col.name), email: at(r, col.email).toLowerCase(), department: at(r, col.department), year: at(r, col.year) })),
    ignored,
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lỗi của từng dòng (theo vị trí). existingEmails: email (viết thường) của người đã ở CLB. */
export function memberErrors(list: DraftMember[], existingEmails: Set<string>): DraftErrors[] {
  const seen = new Map<string, number>();
  list.forEach((m, i) => { const e = m.email.trim().toLowerCase(); if (e && !seen.has(e)) seen.set(e, i); });
  return list.map((m, i) => {
    const err: DraftErrors = {};
    const email = m.email.trim().toLowerCase();
    if (!m.name.trim()) err.name = "Thiếu họ tên.";
    else if (m.name.trim().length > 100) err.name = "Họ tên quá dài.";
    if (!email) err.email = "Thiếu email.";
    else if (!EMAIL.test(email)) err.email = "Email không hợp lệ.";
    else if (existingEmails.has(email)) err.email = "Người này đã ở CLB.";
    else if (seen.get(email) !== i) err.email = "Email trùng với một dòng ở trên.";
    if (m.department.trim().length > 60) err.department = "Tên ban quá dài.";
    if (m.year.trim() && !/^[1-5]$/.test(m.year.trim())) err.year = "Năm học từ 1 đến 5.";
    return err;
  });
}

export const hasErrors = (e: DraftErrors) => Object.keys(e).length > 0;

/** Dữ liệu gửi lên POST /clubs/:clubId/members. */
export function toAddMembers(list: DraftMember[]): { name: string; email: string; department?: string; year?: number }[] {
  return list.map((m) => ({
    name: m.name.trim(),
    email: m.email.trim().toLowerCase(),
    ...(m.department.trim() ? { department: m.department.trim() } : {}),
    ...(m.year.trim() ? { year: Number(m.year.trim()) } : {}),
  }));
}
