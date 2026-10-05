// Chạy: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { memberErrors, tableToMembers, toAddMembers } from "./members-file.ts";
import { parseCsv, slugify } from "./text.ts";

test("đọc file có dòng tiêu đề tiếng Việt, cột xếp khác thứ tự, bỏ qua cột MSSV và dòng trống", () => {
  const table = [
    ["DANH SÁCH THÀNH VIÊN CLB (dữ liệu mẫu)"],
    ["STT", "MSSV", "Họ và tên", "Ban", "E-mail", "Năm"],
    [1, "SE180001", "  Nguyễn  Văn Mẫu ", "Truyền thông", "Mau.Nguyen@Example.com", 2],
    ["", "", "", "", "", ""],
    [2, "SE180002", "Trần Thị Thử", "", "thu.tran@example.com", ""],
  ];
  const { members, ignored } = tableToMembers(table);
  assert.deepEqual(ignored, ["STT", "MSSV"]);
  assert.deepEqual(members, [
    { name: "Nguyễn Văn Mẫu", email: "mau.nguyen@example.com", department: "Truyền thông", year: "2" },
    { name: "Trần Thị Thử", email: "thu.tran@example.com", department: "", year: "" },
  ]);
});

test("file không có dòng tiêu đề: đọc theo thứ tự của file mẫu (Họ tên, Email, Ban, Năm học)", () => {
  const { members } = tableToMembers(parseCsv("Lê Văn Ví Dụ,vi.du@example.com,Hậu cần,1\n"));
  assert.deepEqual(members, [{ name: "Lê Văn Ví Dụ", email: "vi.du@example.com", department: "Hậu cần", year: "1" }]);
});

test("kiểm lỗi từng dòng: thiếu tên, email sai, email trùng trong file, người đã ở CLB, năm học sai", () => {
  const list = [
    { name: "", email: "a@example.com", department: "", year: "" },
    { name: "B", email: "khong-phai-email", department: "", year: "7" },
    { name: "C", email: "A@example.com", department: "", year: "" },
    { name: "D", email: "da.co@example.com", department: "", year: "3" },
    { name: "E", email: "e@example.com", department: "Ban mới", year: "5" },
  ];
  const errs = memberErrors(list, new Set(["da.co@example.com"]));
  assert.deepEqual(errs, [
    { name: "Thiếu họ tên." },
    { email: "Email không hợp lệ.", year: "Năm học từ 1 đến 5." },
    { email: "Email trùng với một dòng ở trên." },
    { email: "Người này đã ở CLB." },
    {},
  ]);
  assert.deepEqual(toAddMembers([list[4]]), [{ name: "E", email: "e@example.com", department: "Ban mới", year: 5 }]);
});

test("mã CLB trong đường dẫn: bỏ dấu, viết thường, nối bằng gạch ngang", () => {
  assert.equal(slugify("CLB Cầu lông Sân Nhà"), "clb-cau-long-san-nha");
  assert.equal(slugify("  Đội Tình nguyện — Gieo Mầm!! "), "doi-tinh-nguyen-gieo-mam");
  assert.equal(slugify("!!!"), "");
});
