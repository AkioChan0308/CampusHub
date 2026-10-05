// Chạy: npm test. Năm lỗi về tiền tìm ra ngày 05/10/2026; mỗi test tái hiện đúng một lỗi (viết trước khi sửa).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB, DEMO_COLLECTION_ID as COL, DEMO_TERM as TERM } from "./seed.ts";
import { balance, budgetView, collectionStats, latestStatement } from "./selectors.ts";
import { addMembers, approveApplication, approveExpense, confirmPayment, createCollection, createExpense, importStatement, resolveTxn } from "./actions.ts";
import type { AppState, Collection } from "./types.ts";

const AT = "2026-10-02T10:00:00+07:00";
/** Đợt thu thứ hai cùng kỳ (dữ liệu mẫu tự đặt). */
const AO: Collection = {
  id: "ao-clb", clubId: CLUB, term: TERM, name: "Áo CLB", amount: 100_000, dueDate: "2026-10-20T23:59:00+07:00",
  codePrefix: "QAO26", receiverId: "a002", accountName: "LE THU HA", bankLabel: "[ngân hàng]", last4: "6789",
};
const row = (amount: number, content: string, sender = "AI DO", date = "2026-10-02T09:00:00+07:00") => ({ date, amount, sender, content });
const payment = (s: AppState, collectionId: string, personId: string) => s.payments.find((p) => p.collectionId === collectionId && p.personId === personId);

test("1. có hai đợt thu: tiền ghi mã đợt Fall không vào đợt Áo; đợt Fall vẫn đối soát được cùng file đó", () => {
  let s = createCollection(AO)(createSeed());
  const file = [row(100_000, "QFALL26 A021", "DO BAO NGOC")];
  s = importStatement({ id: "sk-ao", collectionId: AO.id, fileName: "x.csv", rows: file, at: AT, by: "a002" })(s);
  assert.equal(payment(s, AO.id, "a021")?.status, "unpaid");
  assert.equal(latestStatement(s, AO.id)!.txns[0].result.kind, "ignored");
  assert.equal(balance(s, CLUB), 3_120_000);
  // Cùng file tải vào đợt Fall: dòng thuộc đợt Fall, ghi nhận bình thường, không bị coi là "đã có ở lần tải trước".
  s = importStatement({ id: "sk-fall", collectionId: COL, fileName: "x.csv", rows: file, at: AT, by: "a002" })(s);
  assert.equal(payment(s, COL, "a021")?.status, "paid");
  assert.equal(balance(s, CLUB), 3_220_000);
});

test("2. ghi nhận tay 100.000 ₫ rồi sao kê về 150.000 ₫: sổ quỹ chỉ cộng phần chênh", () => {
  let s = createSeed();
  assert.equal(payment(s, COL, "a030")?.amountPaid, 0);
  s = confirmPayment({ collectionId: COL, personId: "a030", method: "transfer", amount: 100_000, at: AT, by: "a002", ledgerId: "l-tay" })(s);
  assert.equal(balance(s, CLUB), 3_220_000);
  s = importStatement({ id: "sk-vy", collectionId: COL, fileName: "x.csv", rows: [row(150_000, "QFALL26 A030", "BUI KHANH VY", "2026-10-02T20:00:00+07:00")], at: AT, by: "a002" })(s);
  const t = latestStatement(s, COL)!.txns[0];
  assert.equal(t.result.kind, "manual");
  s = resolveTxn("sk-vy", t.id, ["a030"], "a002", AT)(s);
  assert.equal(balance(s, CLUB), 3_120_000 + 150_000); // ngân hàng chỉ nhận 150.000 ₫
  assert.equal(payment(s, COL, "a030")?.amountPaid, 150_000);
});

test("3. dự trù cộng tiền còn phải thu của mọi đợt thu trong kỳ", () => {
  const s = createCollection(AO)(createSeed());
  const bv = budgetView(s, CLUB, TERM);
  const fall = collectionStats(s, COL);
  const ao = collectionStats(s, AO.id);
  assert.equal(bv.expected, fall.expectedAmount + ao.expectedAmount);
  assert.equal(bv.expectedCount, fall.expectedCount + ao.expectedCount);
  assert.equal(bv.collections, 2);
});

test("4. bước mentor cũng không cho tự duyệt khoản của chính mình", () => {
  let s = createSeed();
  s = createExpense({ id: "chi-mentor", clubId: CLUB, kind: "proposal", title: "Khoản do mentor đề xuất", amount: 2_500_000, requesterId: "p-thu-trang", createdAt: AT, reason: "" })(s);
  s = approveExpense("chi-mentor", "a005", AT)(s);
  assert.equal(s.expenses.find((e) => e.id === "chi-mentor")?.status, "mentor");
  s = approveExpense("chi-mentor", "p-thu-trang", AT)(s);
  assert.equal(s.expenses.find((e) => e.id === "chi-mentor")?.status, "mentor");
});

test("5. thành viên mới chỉ có khoản phải đóng ở đợt đang mở của kỳ hiện tại", () => {
  let s = createSeed();
  s = createCollection({ ...AO, id: "quy-summer", term: "Summer 2026", name: "Quỹ học kỳ Summer 2026", codePrefix: "QSUM26", dueDate: "2026-06-30T23:59:00+07:00" })(s);
  s = createCollection({ ...AO, id: "ao-het-han", name: "Áo (đã hết hạn)", codePrefix: "QAOX26", dueDate: "2026-09-30T23:59:00+07:00" })(s);
  const owes = (st: AppState, personId: string) => st.payments.filter((p) => p.personId === personId).map((p) => p.collectionId);
  s = approveApplication("don-1", "a001", AT)(s);
  assert.deepEqual(owes(s, "p-hong-nhung"), [COL]);
  s = addMembers(CLUB, [{ personId: "p-moi", name: "Người Mới", email: "nguoi.moi@example.com", department: "Hậu cần", inviteCode: "moi-test" }], AT)(s);
  assert.deepEqual(owes(s, "p-moi"), [COL]);
});
