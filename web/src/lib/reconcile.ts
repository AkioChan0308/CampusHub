// Đối soát sao kê: xếp từng giao dịch tiền vào thành "khớp tự động", "cần gán tay" hoặc "không thuộc đợt thu".
// Luật lấy từ design/README.md, mục 5. Bốn lý do chưa khớp lấy từ câu trả lời của chủ nhiệm ở Khảo sát 01.
// Hàm thuần (không đọc state), để sau chuyển sang backend giữ nguyên được.

import { parseCsv, toAsciiUpper } from "./text.ts";
import type { TxnResult } from "./types.ts";

export interface MemberRef {
  personId: string;
  code: string; // ví dụ A017
  name: string;
}

export interface ReconcileContext {
  fee: number; // số tiền mỗi người phải đóng
  codePrefix: string; // mã của đợt thu đang đối soát, phần đầu nội dung chuyển khoản, ví dụ QFALL26
  otherCollections?: { codePrefix: string; name: string }[]; // các đợt thu khác của CLB
  members: MemberRef[];
  settledPersonIds: Set<string>; // người đã đóng đủ, gặp lại mã của họ thì phải xem tay
  awaitingStatement?: Map<string, number>; // tiền chuyển khoản thủ quỹ đã "Ghi nhận tay" cho từng người, chưa thấy trong sao kê nào
}

export interface RawTxn {
  amount: number;
  sender: string;
  content: string;
}

const DATE_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

/**
 * Ngày trong file sao kê: "27/09/2026", "27-09-2026 10:12", "27/09/2026 10:12:33" → ISO giờ Việt Nam.
 * Không đọc được, hoặc ngày giờ không có thật (31/02, tháng 13, 25:00) thì null.
 */
export function parseStatementDate(s: string): string | null {
  const m = s.trim().match(DATE_RE);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  if (Number(m[4] ?? 0) > 23 || Number(m[5] ?? 0) > 59 || Number(m[6] ?? 0) > 59) return null;
  const p = (x: string | undefined, d = "00") => (x ?? d).padStart(2, "0");
  return `${m[3]}-${p(m[2])}-${p(m[1])}T${p(m[4], "12")}:${p(m[5])}:${p(m[6])}+07:00`;
}

/**
 * Số tiền trong file sao kê → số đồng. Tiền Việt không có số lẻ, nên phần lẻ 1–2 chữ số ở cuối bị bỏ:
 * "100.000", "100,000", "100,000.00", "100.000,00 VND" đều là 100000.
 * Tiền ra (có dấu trừ hoặc nằm trong ngoặc) trả về null: đối soát chỉ xét tiền vào.
 */
export function parseStatementAmount(s: string): number | null {
  const t = s.replace(/[^\d.,()\-−]/g, "");
  if (/^[-−(]/.test(t) || /[-−]$/.test(t)) return null;
  const digits = t.replace(/[.,]\d{1,2}$/, "").replace(/\D/g, "");
  const n = digits ? Number(digits) : 0;
  return n > 0 ? n : null;
}

export interface StatementRow {
  date: string;
  amount: number;
  sender: string;
  content: string;
}

/**
 * Đọc file sao kê CSV: 4 cột theo thứ tự ngày, số tiền, người chuyển, nội dung chuyển khoản.
 * Dòng tiêu đề, dòng tiền ra và dòng không đọc được bị bỏ qua.
 */
/**
 * Đọc file sao kê. Bỏ dòng tiêu đề, dòng tiền ra và dòng không đọc được.
 * badDates: số dòng tiền vào có ngày viết đúng dạng nhưng không có thật (ví dụ 31/02/2026), để báo cho thủ quỹ biết đã bỏ.
 */
export function readStatement(text: string): { rows: StatementRow[]; badDates: number } {
  const rows: StatementRow[] = [];
  let badDates = 0;
  for (const r of parseCsv(text)) {
    const rawDate = (r[0] ?? "").trim();
    const date = parseStatementDate(rawDate);
    const amount = parseStatementAmount(r[1] ?? "");
    if (!amount) continue;
    if (!date) {
      if (DATE_RE.test(rawDate)) badDates++;
      continue;
    }
    rows.push({ date, amount, sender: (r[2] ?? "").toUpperCase(), content: r[3] ?? "" });
  }
  return { rows, badDates };
}

export function readStatementCsv(text: string): StatementRow[] {
  return readStatement(text).rows;
}

const CODE_RE = /(?<![A-Z])A(\d{3})(?!\d)/g;

export function extractCodes(content: string): string[] {
  const text = toAsciiUpper(content);
  const codes = new Set<string>();
  for (const m of text.matchAll(CODE_RE)) codes.add(`A${m[1]}`);
  return [...codes];
}

const vnd = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;

const compact = (s: string) => toAsciiUpper(s).replace(/[^A-Z0-9]/g, "");

export function classify(txn: RawTxn, ctx: ReconcileContext): TxnResult {
  // Nội dung ghi mã của một đợt thu khác (lấy mã dài nhất khớp được): tiền thuộc đợt đó, đối soát ở đợt đó.
  const text = compact(txn.content);
  const prefix = [{ codePrefix: ctx.codePrefix, name: "" }, ...(ctx.otherCollections ?? [])]
    .filter((c) => c.codePrefix && text.includes(compact(c.codePrefix)))
    .sort((a, b) => b.codePrefix.length - a.codePrefix.length)[0];
  if (prefix && prefix.codePrefix !== ctx.codePrefix) return { kind: "ignored", reason: `Thuộc đợt thu khác: ${prefix.name}` };
  const hasOwnPrefix = !!prefix;

  const byCode = new Map(ctx.members.map((m) => [m.code, m]));
  const codes = extractCodes(txn.content);

  if (codes.length > 0) {
    const found = codes.map((c) => byCode.get(c));
    const missing = codes.filter((_, i) => !found[i]);
    if (missing.length > 0) {
      return { kind: "manual", reason: `Mã ${missing.join(", ")} không có trong danh sách` };
    }
    const people = found as MemberRef[];
    const ids = people.map((m) => m.personId);
    // CLB có nhiều đợt thu mà nội dung không ghi mã đợt: chưa biết tiền của đợt nào, không tự ghi.
    if (!hasOwnPrefix && (ctx.otherCollections?.length ?? 0) > 0) {
      return { kind: "manual", reason: "Không ghi mã đợt thu", suggestion: ids };
    }
    // Khoản chuyển khoản thủ quỹ đã ghi nhận tay nay hiện trong sao kê: đúng số tiền thì chỉ nối, không ghi lần hai;
    // khác số tiền thì thủ quỹ xem tay, lúc gán chỉ phần chênh được ghi thêm.
    const waiting = people.length === 1 ? ctx.awaitingStatement?.get(ids[0]) ?? 0 : 0;
    if (waiting > 0) {
      if (txn.amount === waiting) return { kind: "auto", personIds: ids, alreadyRecorded: true };
      return { kind: "manual", reason: `Đã ghi nhận tay ${vnd(waiting)}, sao kê ${vnd(txn.amount)}`, suggestion: ids };
    }
    const already = people.filter((m) => ctx.settledPersonIds.has(m.personId));
    if (already.length > 0) {
      return { kind: "manual", reason: `${already.map((m) => m.name).join(", ")} đã đóng rồi`, suggestion: ids };
    }
    if (people.length === 1) {
      if (txn.amount === ctx.fee) return { kind: "auto", personIds: ids };
      if (txn.amount < ctx.fee) return { kind: "manual", reason: `Thiếu ${vnd(ctx.fee - txn.amount)}`, suggestion: ids };
      return { kind: "manual", reason: `Thừa ${vnd(txn.amount - ctx.fee)}`, suggestion: ids };
    }
    if (txn.amount === ctx.fee * people.length) {
      return { kind: "manual", reason: `Một lần chuyển cho ${people.length} người`, suggestion: ids };
    }
    return { kind: "manual", reason: `Một lần chuyển cho ${people.length} người, số tiền không khớp`, suggestion: ids };
  }

  // Không có mã: số tiền không phải bội số của mức thu thì coi là tiền khác (ví dụ tiền hoàn ứng, tiền lãi).
  if (txn.amount % ctx.fee !== 0) {
    return { kind: "ignored", reason: "Không thuộc đợt thu" };
  }
  const sender = toAsciiUpper(txn.sender);
  const sameName = ctx.members.filter((m) => toAsciiUpper(m.name) === sender);
  if (sameName.length === 1) {
    return { kind: "manual", reason: "Sai cú pháp, không có mã", suggestion: [sameName[0].personId] };
  }
  return { kind: "manual", reason: "Thiếu mã thành viên" };
}
