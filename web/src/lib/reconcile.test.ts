// Chạy: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, extractCodes, parseStatementAmount, parseStatementDate, readStatement, readStatementCsv, type ReconcileContext } from "./reconcile.ts";

const ctx: ReconcileContext = {
  fee: 100000,
  codePrefix: "QFALL26",
  members: [
    { personId: "a017", code: "A017", name: "Nguyễn Minh Anh" },
    { personId: "a021", code: "A021", name: "Đỗ Bảo Ngọc" },
    { personId: "a022", code: "A022", name: "Lý Hoàng Nam" },
    { personId: "a030", code: "A030", name: "Bùi Khánh Vy" },
    { personId: "a005", code: "A005", name: "Trần Gia Huy" },
  ],
  settledPersonIds: new Set(["a005"]),
};

test("đọc được mã viết liền hoặc cách", () => {
  assert.deepEqual(extractCodes("QFALL26 A021 A022"), ["A021", "A022"]);
  assert.deepEqual(extractCodes("qfall26a017 dong quy"), ["A017"]);
  assert.deepEqual(extractCodes("CK"), []);
});

test("đúng mã, đúng tiền: khớp tự động", () => {
  assert.deepEqual(classify({ amount: 100000, sender: "BUI KHANH VY", content: "QFALL26 A030" }, ctx), { kind: "auto", personIds: ["a030"] });
});

test("bốn lý do cần gán tay trong Khảo sát 01", () => {
  assert.equal(classify({ amount: 100000, sender: "NGUYEN THI MAI", content: "CK" }, ctx).kind, "manual");
  const multi = classify({ amount: 200000, sender: "TRAN VAN KHOA", content: "QFALL26 A021 A022" }, ctx);
  assert.equal(multi.kind === "manual" && multi.reason, "Một lần chuyển cho 2 người");
  const thieu = classify({ amount: 50000, sender: "BUI KHANH VY", content: "QFALL26 A030" }, ctx);
  assert.equal(thieu.kind === "manual" && thieu.reason, "Thiếu 50.000 ₫");
  const sai = classify({ amount: 100000, sender: "NGUYEN MINH ANH", content: "quy cau long minh anh" }, ctx);
  assert.deepEqual(sai, { kind: "manual", reason: "Sai cú pháp, không có mã", suggestion: ["a017"] });
});

test("có nhiều đợt thu: ghi mã đợt khác thì không thuộc đợt này; không ghi mã đợt thì phải xem tay", () => {
  const multi: ReconcileContext = { ...ctx, otherCollections: [{ codePrefix: "QAO26", name: "Áo CLB" }] };
  assert.deepEqual(classify({ amount: 100000, sender: "BUI KHANH VY", content: "QAO26 A030" }, multi), { kind: "ignored", reason: "Thuộc đợt thu khác: Áo CLB" });
  assert.deepEqual(classify({ amount: 100000, sender: "BUI KHANH VY", content: "QFALL26 A030" }, multi), { kind: "auto", personIds: ["a030"] });
  const noPrefix = classify({ amount: 100000, sender: "BUI KHANH VY", content: "dong quy A030" }, multi);
  assert.equal(noPrefix.kind, "manual");
  // Chỉ có một đợt thu: không ghi mã đợt vẫn khớp như trước.
  assert.equal(classify({ amount: 100000, sender: "BUI KHANH VY", content: "dong quy A030" }, ctx).kind, "auto");
});

test("không có mã và số tiền lẻ: không thuộc đợt thu", () => {
  assert.equal(classify({ amount: 150000, sender: "TRAN GIA HUY", content: "TRA LAI TIEN THUA MUA CAU" }, ctx).kind, "ignored");
});

test("người đã đóng rồi lại chuyển nữa: phải xem tay", () => {
  assert.equal(classify({ amount: 100000, sender: "TRAN GIA HUY", content: "QFALL26 A005" }, ctx).kind, "manual");
});

test("đọc số tiền trong file sao kê: có phần lẻ thì bỏ, không nhân lên 100 lần", () => {
  for (const s of ["100000", "100.000", "100,000", "100,000.00", "100.000,00", "100.000 VND", "+100,000", " 100.000 đ "]) {
    assert.equal(parseStatementAmount(s), 100_000, s);
  }
  assert.equal(parseStatementAmount("1.250.000"), 1_250_000);
});

test("tiền ra và ô trống không đọc thành tiền vào", () => {
  for (const s of ["-200.000", "−200,000.00", "(200,000)", "200.000-", "", "abc", "0"]) {
    assert.equal(parseStatementAmount(s), null, s);
  }
});

test("đọc ngày trong file sao kê theo giờ Việt Nam", () => {
  assert.equal(parseStatementDate("27/09/2026 10:12"), "2026-09-27T10:12:00+07:00");
  assert.equal(parseStatementDate("27/09/2026 10:12:33"), "2026-09-27T10:12:33+07:00");
  assert.equal(parseStatementDate("27-09-2026 9:05"), "2026-09-27T09:05:00+07:00");
  assert.equal(parseStatementDate("2/10/2026"), "2026-10-02T12:00:00+07:00");
  assert.equal(parseStatementDate("Ngày"), null); // dòng tiêu đề bị bỏ qua
  // Ngày giờ không có thật thì không đọc
  assert.equal(parseStatementDate("31/02/2026"), null);
  assert.equal(parseStatementDate("29/02/2026"), null);
  assert.equal(parseStatementDate("29/02/2028"), "2028-02-29T12:00:00+07:00");
  assert.equal(parseStatementDate("12/13/2026"), null);
  assert.equal(parseStatementDate("27/09/2026 25:00"), null);
});

test("đọc file sao kê: đếm dòng tiền vào có ngày không có thật để báo đã bỏ", () => {
  const csv = "Ngày,Số tiền,Người chuyển,Nội dung\n31/02/2026,100000,AN,QFALL26 A021\n27/09/2026,100000,BINH,QFALL26 A030\n31/02/2026,-50000,CLB,CHI\n";
  const { rows, badDates } = readStatement(csv);
  assert.equal(rows.length, 1);
  assert.equal(badDates, 1); // dòng tiền ra có ngày sai không tính
});

test("đọc cả file sao kê: bỏ dòng tiêu đề và dòng tiền ra, đọc được dấu chấm phẩy", () => {
  const csv = "﻿Ngày;Số tiền;Người chuyển;Nội dung\n02/10/2026 09:15:07;100.000;le ngoc anh;QFALL26 A037\n02/10/2026 12:00;-200.000;CLB;THUE SAN\n";
  assert.deepEqual(readStatementCsv(csv), [
    { date: "2026-10-02T09:15:07+07:00", amount: 100_000, sender: "LE NGOC ANH", content: "QFALL26 A037" },
  ]);
});
