// Chạy: npm test. Kiểm tra dữ liệu mẫu khớp bản vẽ (design/README.md, mục 8) và các luồng đổi số đúng.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB, DEMO_COLLECTION_ID as COL, DEMO_TERM as TERM } from "./seed.ts";
import {
  balance, budgetView, collectionStats, latestStatement, openManualAll, openManualTxns, pendingApplications, pendingExpenses,
} from "./selectors.ts";
import {
  acceptInvite, approveApplication, approveExpense, checkIn, confirmPayment, importStatement, markSpent, rejectExpense, resolveTxn,
} from "./actions.ts";

const AT = "2026-10-02T10:00:00+07:00";

test("số liệu mẫu khớp bản vẽ", () => {
  const s = createSeed();
  assert.equal(s.memberships.filter((m) => m.clubId === CLUB).length, 42);
  assert.equal(s.memberships.filter((m) => m.invite === "pending").length, 6);
  const st = collectionStats(s, COL);
  assert.deepEqual([st.paid, st.transfer, st.cash, st.reported, st.unpaid], [29, 26, 3, 2, 11]);
  assert.equal(balance(s, CLUB), 3_120_000);
  assert.equal(pendingApplications(s, CLUB).length, 3);
  assert.equal(pendingExpenses(s, CLUB).reduce((sum, e) => sum + e.amount, 0), 650_000);
  const sk = latestStatement(s, COL)!;
  const kinds = sk.txns.map((t) => t.result.kind);
  assert.deepEqual([kinds.length, kinds.filter((k) => k === "auto").length, kinds.filter((k) => k === "manual").length, kinds.filter((k) => k === "ignored").length], [32, 26, 4, 2]);
});

test("dự trù chỉ trừ phần chưa chi (không trừ hai lần khoản đã chi)", () => {
  const bv = budgetView(createSeed(), CLUB, TERM);
  assert.equal(bv.planned, 6_050_000);
  assert.equal(bv.spent, 800_000);
  assert.equal(bv.toSpend, 5_250_000);
  assert.equal(bv.expected, 1_300_000);
  assert.equal(bv.support, 1_000_000);
  assert.equal(bv.forecast, 3_120_000 + 1_300_000 + 1_000_000 - 5_250_000);
});

test("gán tay 4 giao dịch: đợt thu và sổ quỹ đổi đúng", () => {
  let s = createSeed();
  const sk = latestStatement(s, COL)!;
  for (const t of openManualTxns(sk)) {
    const ids = t.result.kind === "manual" && t.result.suggestion ? t.result.suggestion : ["a033"]; // giao dịch "CK" không rõ người: gán cho Dương Quốc Huy
    s = resolveTxn(sk.id, t.id, ids, "a002", AT)(s);
  }
  const st = collectionStats(s, COL);
  // Ngọc, Nam (chuyển hộ), Minh Anh (sai cú pháp), Huy (gán tay) đủ tiền; Vy đóng thiếu 50.000.
  assert.equal(st.paid, 33);
  assert.equal(s.payments.find((p) => p.personId === "a030")?.status, "partial");
  assert.equal(balance(s, CLUB), 3_120_000 + 100_000 + 200_000 + 50_000 + 100_000);
  assert.equal(openManualTxns(latestStatement(s, COL)).length, 0);
});

test("tải sao kê mới: đúng mã tự ghi nhận, giao dịch cũ không ghi hai lần", () => {
  let s = createSeed();
  s = importStatement({ id: "sk-moi", collectionId: COL, fileName: "x.csv", at: AT, by: "a002", rows: [
    { date: "2026-10-02T09:00:00+07:00", amount: 100_000, sender: "DUONG QUOC HUY", content: "QFALL26 A033" },
    { date: "2026-10-02T09:30:00+07:00", amount: 100_000, sender: "PHAM QUOC BAO", content: "QFALL26 A001" },
    { date: "2026-09-26T09:00:00+07:00", amount: 100_000, sender: "PHAM QUOC BAO", content: "QFALL26 A001" },
  ] })(s);
  assert.equal(s.payments.find((p) => p.personId === "a033")?.status, "paid");
  assert.equal(balance(s, CLUB), 3_220_000);
  const results = latestStatement(s, COL)!.txns.map((t) => t.result);
  assert.equal(results[0].kind, "auto");
  assert.equal(results[1].kind, "manual"); // Bảo đã đóng rồi lại chuyển nữa: phải xem tay
  assert.deepEqual(results[2], { kind: "ignored", reason: "Đã có ở lần tải trước" }); // dòng đã có trong sao kê trước
  assert.equal(openManualAll(s, COL).length, 5); // 4 việc còn treo của file cũ vẫn còn, cộng 1 việc của file mới
});

test("tiền trong sao kê luôn vào sổ quỹ đủ số: người đã đóng tiền mặt thì phần của họ ghi là đóng thừa", () => {
  let s = createSeed();
  s = confirmPayment({ collectionId: COL, personId: "a021", method: "cash", amount: 100_000, at: AT, by: "a002", ledgerId: "l-tm" })(s);
  const { statementId, txn } = openManualAll(s, COL).find((x) => x.txn.content.includes("A021"))!; // 200.000 ₫ chuyển hộ Ngọc và Nam
  s = resolveTxn(statementId, txn.id, ["a021", "a022"], "a002", AT)(s);
  assert.equal(balance(s, CLUB), 3_120_000 + 100_000 + 200_000); // trước khi sửa: mất 100.000 ₫ của Ngọc
  const ngoc = s.payments.find((p) => p.personId === "a021")!;
  assert.deepEqual([ngoc.status, ngoc.method, ngoc.amountPaid], ["paid", "cash", 200_000]);
  assert.ok(s.ledger.some((l) => l.personId === "a021" && l.description.endsWith("đóng thừa")));
});

test("đã ghi nhận tay rồi gặp lại trong sao kê: chỉ nối, không ghi lần hai", () => {
  let s = createSeed();
  s = confirmPayment({ collectionId: COL, personId: "a024", method: "transfer", amount: 100_000, at: AT, by: "a002", ledgerId: "l-tay" })(s);
  s = confirmPayment({ collectionId: COL, personId: "a017", method: "transfer", amount: 100_000, at: AT, by: "a002", ledgerId: "l-tay2" })(s);
  assert.equal(balance(s, CLUB), 3_320_000);
  // Trí: dòng đúng mã, đúng tiền tự nối
  s = importStatement({ id: "sk-tri", collectionId: COL, fileName: "x.csv", at: AT, by: "a002", rows: [
    { date: "2026-10-02T21:40:00+07:00", amount: 100_000, sender: "HOANG DUC TRI", content: "QFALL26 A024" },
  ] })(s);
  assert.deepEqual(latestStatement(s, COL)!.txns[0].result, { kind: "auto", personIds: ["a024"], alreadyRecorded: true });
  assert.equal(balance(s, CLUB), 3_320_000);
  // Minh Anh: dòng sai cú pháp ở file cũ, gán tay cho đúng người
  const ma = openManualAll(s, COL).find((x) => x.txn.sender === "NGUYEN MINH ANH")!;
  s = resolveTxn(ma.statementId, ma.txn.id, ["a017"], "a002", AT)(s);
  assert.equal(balance(s, CLUB), 3_320_000);
  // Trí chuyển thêm lần nữa: là tiền mới, phải xem tay
  s = importStatement({ id: "sk-tri-2", collectionId: COL, fileName: "y.csv", at: "2026-10-03T09:00:00+07:00", by: "a002", rows: [
    { date: "2026-10-03T08:00:00+07:00", amount: 100_000, sender: "HOANG DUC TRI", content: "QFALL26 A024" },
  ] })(s);
  assert.equal(latestStatement(s, COL)!.txns[0].result.kind, "manual");
});

test("chia tiền chuyển hộ không làm rơi đồng lẻ", () => {
  let s = createSeed();
  s = importStatement({ id: "sk-le", collectionId: COL, fileName: "x.csv", at: AT, by: "a002", rows: [
    { date: "2026-10-02T09:00:00+07:00", amount: 200_001, sender: "AI DO", content: "QFALL26 A035 A036" },
  ] })(s);
  const t = latestStatement(s, COL)!.txns[0];
  s = resolveTxn("sk-le", t.id, ["a035", "a036"], "a002", AT)(s);
  assert.equal(balance(s, CLUB), 3_120_000 + 200_001);
});

test("duyệt chi: không tự duyệt, trên 2.000.000 ₫ chờ mentor, ghi đã chi đổi dự trù", () => {
  let s = createSeed();
  s = approveExpense("chi-2", "a001", AT)(s); // chủ nhiệm tự duyệt khoản của mình: không đổi
  assert.equal(s.expenses.find((e) => e.id === "chi-2")?.status, "pending");
  s = approveExpense("chi-2", "a005", AT)(s);
  assert.equal(s.expenses.find((e) => e.id === "chi-2")?.status, "approved");
  s = approveExpense("chi-3", "p-thu-trang", AT)(s); // mentor duyệt khoản 2.300.000
  assert.equal(s.expenses.find((e) => e.id === "chi-3")?.status, "approved");
  s = markSpent("chi-3", "a002", AT, "l-test")(s);
  const bv = budgetView(s, CLUB, TERM);
  assert.equal(bv.items.find((b) => b.id === "giai-noi-bo")?.spent, 2_300_000);
  assert.equal(balance(s, CLUB), 3_120_000 - 2_300_000);
  assert.equal(bv.forecast, 3_120_000 + 1_300_000 + 1_000_000 - 5_250_000); // chi đúng dự trù: dự báo không đổi
  s = rejectExpense("chi-1", "a001", AT, "Chờ báo giá")(s);
  assert.equal(s.expenses.find((e) => e.id === "chi-1")?.status, "rejected");
});

test("duyệt chi: ghi chú của người duyệt nằm trong lịch sử, bỏ trống thì như cũ", () => {
  let s = createSeed();
  s = approveExpense("chi-2", "a005", AT, "  Nhớ lấy hóa đơn  ")(s);
  assert.equal(s.expenses.find((e) => e.id === "chi-2")?.history.at(-1)?.text, "duyệt: “Nhớ lấy hóa đơn”");
  s = approveExpense("chi-3", "p-thu-trang", AT, " ")(s);
  assert.equal(s.expenses.find((e) => e.id === "chi-3")?.history.at(-1)?.text, "mentor duyệt");
});

test("duyệt đơn xin vào: thành viên mới chờ nhận lời mời, có khoản quỹ phải đóng", () => {
  let s = createSeed();
  s = approveApplication("don-1", "a001", AT)(s);
  const m = s.memberships.find((x) => x.personId === "p-hong-nhung")!;
  assert.equal(m.invite, "pending");
  assert.equal(m.code, "A043");
  assert.equal(collectionStats(s, COL).total, 43);
  s = acceptInvite(m.inviteCode!, false, AT)(s);
  assert.equal(s.memberships.find((x) => x.personId === "p-hong-nhung")?.invite, "accepted");
  assert.equal(s.persona, "p-hong-nhung");
  assert.ok(s.consents.some((c) => c.personId === "p-hong-nhung" && c.purpose === "membership"));
  assert.ok(!s.consents.some((c) => c.personId === "p-hong-nhung" && c.purpose === "phone"));
});

test("điểm danh và ghi tiền mặt không ghi trùng", () => {
  let s = createSeed();
  const n = s.attendance.length;
  s = checkIn({ eventId: "tuan-5", personId: "a017", at: AT, method: "qr", deviceId: "d1" })(s);
  s = checkIn({ eventId: "tuan-5", personId: "a017", at: AT, method: "qr", deviceId: "d1" })(s);
  assert.equal(s.attendance.length, n + 1);
  s = confirmPayment({ collectionId: COL, personId: "a002", method: "cash", amount: 100_000, at: AT, by: "a002", ledgerId: "x" })(s);
  assert.equal(balance(s, CLUB), 3_120_000); // Hà đã đóng rồi: không ghi thêm
});
