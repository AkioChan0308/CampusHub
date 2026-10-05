/** Đọc số tiền gõ tay: "150000", "150.000", "150,000", "1 500 000", có thể kèm "₫" hoặc "đ" ở cuối.
 *  Trả về null khi không phải số tiền: có chữ, có phần lẻ, hoặc nhóm số sai (ví dụ "15.00"). */
export function parseMoneyInput(text: string): number | null {
  const s = text.replace(/\s+/g, "").replace(/(₫|đ|vnđ|vnd)$/i, "");
  if (/^\d+$/.test(s)) return Number(s);
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
  return null;
}
