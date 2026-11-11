// Chạy: npm test. Ban và trưởng ban (09/11/2026): mỗi ban đúng một trưởng, một người làm trưởng nhiều ban, ban do chủ nhiệm cấu hình.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB } from "./seed.ts";
import {
  acceptHandover, createClub, createDepartment, deleteDepartment, departmentDeleteBlock, departmentNameError, findDepartment, headBlock,
  renameDepartment, saveHandoverBoard, setDepartmentHead, updateMember,
} from "./actions.ts";
import { NO_DEPARTMENT, SAMPLE_DEPARTMENTS, type AppState } from "./types.ts";

const AT = "2026-11-09T10:00:00+07:00";
const dep = (s: AppState, name: string) => findDepartment(s, CLUB, name)!;
const roleOf = (s: AppState, id: string) => s.memberships.find((m) => m.clubId === CLUB && m.personId === id)!.role;

/** Luật luôn đúng: vai head khớp với việc làm trưởng ban. */
function assertConsistent(s: AppState) {
  const heads = new Set(s.departments.filter((d) => d.headId).map((d) => `${d.clubId}/${d.headId}`));
  for (const m of s.memberships) assert.equal(m.role === "head", heads.has(`${m.clubId}/${m.personId}`) && m.role !== "president" && m.role !== "vice" && m.role !== "treasurer", `${m.personId}: vai ${m.role} lệch với danh sách ban`);
  const names = s.departments.filter((d) => d.clubId === CLUB).map((d) => d.name.toLowerCase());
  assert.equal(new Set(names).size, names.length, "tên ban trùng");
}

test("dữ liệu mẫu: các ban lấy từ thành viên, mỗi ban một trưởng ban, vai khớp", () => {
  const s = createSeed();
  assert.deepEqual(s.departments.map((d) => d.name), ["Ban chủ nhiệm", "Chuyên môn", "Hậu cần", "Truyền thông"]);
  assert.deepEqual(s.departments.map((d) => d.headId), [undefined, "a008", "a005", "a007"]);
  assertConsistent(s);
});

test("mọi thành viên của dữ liệu mẫu thuộc một ban có trong danh sách", () => {
  const s = createSeed();
  const names = new Set(s.departments.map((d) => d.name));
  for (const m of s.memberships) assert.ok(names.has(m.department), `${m.personId} thuộc ban "${m.department}" không có trong danh sách`);
});

test("tạo CLB mới: có sẵn các ban mẫu, chủ nhiệm ở Ban chủ nhiệm", () => {
  const s = createClub({ id: "clb-thu", name: "CLB thử", field: "Học thuật, nghiên cứu", schedule: "", location: "", term: "Spring 2027", acceptingApplications: true, personId: "a001" })(createSeed());
  const mine = s.departments.filter((d) => d.clubId === "clb-thu");
  assert.deepEqual(mine.map((d) => d.name), SAMPLE_DEPARTMENTS);
  assert.equal(mine.every((d) => d.headId === undefined), true);
  assert.equal(s.memberships.find((m) => m.clubId === "clb-thu")!.department, "Ban chủ nhiệm");
});

test("tên ban: không rỗng, tối đa 60 ký tự, không trùng (không phân biệt hoa thường), không phải 'Chưa xếp ban'", () => {
  const s = createSeed();
  assert.match(departmentNameError(s, CLUB, "   ")!, /ghi tên ban/);
  assert.match(departmentNameError(s, CLUB, "x".repeat(61))!, /60 ký tự/);
  assert.match(departmentNameError(s, CLUB, "hậu  CẦN")!, /đã có ban tên này/);
  assert.match(departmentNameError(s, CLUB, NO_DEPARTMENT)!, /không phải một ban/);
  assert.equal(departmentNameError(s, CLUB, "Hậu cần", dep(s, "Hậu cần").id), undefined); // đổi tên thành chính nó thì được
  assert.equal(departmentNameError(s, CLUB, "Đối ngoại"), undefined);
  assert.equal(departmentNameError(s, "vong-lap", "Hậu cần"), undefined); // CLB khác dùng tên này được
});

test("đổi tên ban giữ thành viên và trưởng ban; biên bản đã xác nhận giữ tên cũ", () => {
  let s = createSeed();
  s = saveHandoverBoard(CLUB, { president: "a017", heads: [{ department: "Hậu cần", personId: "a005" }, { department: "Chuyên môn", personId: "a008" }] }, "a001", AT)(s); // đợt bàn giao mẫu mới ở bước 1: chọn ban mới trước
  const before = s.memberships.filter((m) => m.department === "Hậu cần").map((m) => m.personId);
  s = renameDepartment(dep(s, "Hậu cần").id, "Hậu cần sự kiện")(s);
  assert.deepEqual(s.memberships.filter((m) => m.department === "Hậu cần sự kiện").map((m) => m.personId), before);
  assert.equal(dep(s, "Hậu cần sự kiện").headId, "a005");
  assert.equal(s.handovers[0].newBoard!.heads.find((h) => h.personId === "a005")!.department, "Hậu cần sự kiện"); // bàn giao đang mở được đổi theo
  assertConsistent(s);
  const done = { ...s, handovers: s.handovers.map((h) => ({ ...h, acceptedAt: AT })) };
  const renamedAgain = renameDepartment(dep(done, "Hậu cần sự kiện").id, "Hậu cần 2")(done);
  assert.equal(renamedAgain.handovers[0].newBoard!.heads.find((h) => h.personId === "a005")!.department, "Hậu cần sự kiện");
});

test("xóa ban: bị chặn khi còn trưởng ban hoặc còn thành viên; hết người thì xóa được", () => {
  let s = createSeed();
  s = createDepartment(CLUB, "ban-moi", "Đối ngoại")(s);
  assert.equal(departmentDeleteBlock(s, "ban-moi"), undefined);
  s = updateMember(CLUB, "a004", { role: "member", department: "Đối ngoại" })(s);
  assert.match(departmentDeleteBlock(s, "ban-moi")!, /còn 1 thành viên/);
  s = updateMember(CLUB, "a004", { role: "member", department: "Chuyên môn" })(s);
  s = setDepartmentHead("ban-moi", "a004")(s);
  assert.match(departmentDeleteBlock(s, "ban-moi")!, /còn trưởng ban/);
  s = setDepartmentHead("ban-moi", undefined)(s);
  s = deleteDepartment("ban-moi")(s);
  assert.equal(findDepartment(s, CLUB, "Đối ngoại"), undefined);
  assert.match(departmentDeleteBlock(s, "ban-moi")!, /Không tìm thấy/);
  assertConsistent(s);
});

test("đặt trưởng ban: người mới có vai trưởng ban, trưởng cũ về thành viên", () => {
  let s = createSeed();
  assert.equal(roleOf(s, "a005"), "head");
  s = setDepartmentHead(dep(s, "Hậu cần").id, "a006")(s);
  assert.equal(dep(s, "Hậu cần").headId, "a006");
  assert.equal(roleOf(s, "a006"), "head");
  assert.equal(roleOf(s, "a005"), "member");
  assertConsistent(s);
});

test("một người làm trưởng nhiều ban; bỏ một ban thì vẫn là trưởng ban của ban còn lại", () => {
  let s = createSeed();
  s = setDepartmentHead(dep(s, "Truyền thông").id, "a005")(s); // a005 đang là trưởng Hậu cần
  assert.equal(dep(s, "Hậu cần").headId, "a005");
  assert.equal(dep(s, "Truyền thông").headId, "a005");
  assert.equal(roleOf(s, "a005"), "head");
  assert.equal(roleOf(s, "a007"), "member"); // trưởng cũ của Truyền thông
  s = setDepartmentHead(dep(s, "Hậu cần").id, undefined)(s);
  assert.equal(roleOf(s, "a005"), "head"); // còn làm trưởng Truyền thông
  s = setDepartmentHead(dep(s, "Truyền thông").id, undefined)(s);
  assert.equal(roleOf(s, "a005"), "member");
  assertConsistent(s);
});

test("ai không làm trưởng ban được: chủ nhiệm, phó, thủ quỹ, người chưa nhận lời mời, người ngoài CLB", () => {
  const s = createSeed();
  assert.match(headBlock(s, CLUB, "a001")!, /Chủ nhiệm không kiêm/);
  assert.match(headBlock(s, CLUB, "a003")!, /Phó chủ nhiệm không kiêm/);
  assert.match(headBlock(s, CLUB, "a002")!, /Thủ quỹ không kiêm/);
  assert.match(headBlock(s, CLUB, "a022")!, /đã nhận lời mời/);
  assert.match(headBlock(s, CLUB, "p-thu-trang")!, /không có trong danh sách/);
  assert.equal(headBlock(s, CLUB, "a004"), undefined);
});

test("sửa vai và ban: chọn vai trưởng ban thì thành trưởng của ban đã chọn; đổi sang vai khác thì thôi làm trưởng", () => {
  let s = createSeed();
  s = updateMember(CLUB, "a004", { role: "head", department: "Hậu cần" })(s);
  assert.equal(dep(s, "Hậu cần").headId, "a004");
  assert.equal(roleOf(s, "a004"), "head");
  assert.equal(roleOf(s, "a005"), "member"); // trưởng cũ của Hậu cần
  s = updateMember(CLUB, "a004", { role: "vice", department: "Hậu cần" })(s);
  assert.equal(dep(s, "Hậu cần").headId, undefined);
  assert.equal(roleOf(s, "a004"), "vice");
  assertConsistent({ ...s, memberships: s.memberships.map((m) => (m.personId === "a004" ? { ...m, role: "member" } : m)) });
});

test("bàn giao: ban mới chọn trưởng từng ban; ban không được chọn để trống, trưởng cũ về thành viên", () => {
  let s = createSeed();
  s = saveHandoverBoard(CLUB, { president: "a017", heads: [{ department: "Hậu cần", personId: "a005" }, { department: "Truyền thông", personId: "a005" }] }, "a001", AT)(s);
  s = { ...s, handovers: s.handovers.map((h) => ({ ...h, step: 6, transferred: h.transferred })) };
  s = acceptHandover(CLUB, "a017", AT)(s);
  assert.equal(dep(s, "Hậu cần").headId, "a005");
  assert.equal(dep(s, "Truyền thông").headId, "a005"); // một người làm trưởng hai ban
  assert.equal(dep(s, "Chuyên môn").headId, undefined); // không được chọn: a008 mất vị trí
  assert.equal(roleOf(s, "a008"), "member");
  assert.equal(roleOf(s, "a007"), "member");
  assert.equal(roleOf(s, "a005"), "head");
  assert.equal(roleOf(s, "a017"), "president");
  assertConsistent(s);
});
