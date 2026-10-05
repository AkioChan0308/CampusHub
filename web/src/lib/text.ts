/** Bỏ dấu tiếng Việt, viết hoa, gộp khoảng trắng: "Nguyễn Minh Anh" → "NGUYEN MINH ANH". */
export function toAsciiUpper(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Chuỗi dùng làm mã trong đường dẫn: "CLB Cầu lông Sân Nhà" → "clb-cau-long-san-nha" (tối đa 40 ký tự). */
export function slugify(s: string): string {
  return toAsciiUpper(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
}

/** So khớp tìm kiếm không phân biệt dấu và hoa thường. */
export function matchesSearch(haystack: string, query: string): boolean {
  const q = toAsciiUpper(query);
  if (!q) return true;
  return toAsciiUpper(haystack).includes(q);
}

/** Đọc CSV đơn giản: hỗ trợ ô có ngoặc kép, dấu phẩy hoặc chấm phẩy làm dấu phân cách. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows.map((r) => r.map((c) => c.trim()));
}
