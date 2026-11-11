// Chạy: npm test. Bàn giao một vai (09/11/2026): đơn gửi chủ nhiệm, duyệt hoặc từ chối, các bước, xác nhận, hủy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB } from "./seed.ts";

/** Dữ liệu mẫu có sẵn một kịch bản bàn giao hộ; các test ở đây cần dữ liệu không có đơn nào. */
const cleanSeed = () => ({ ...createSeed(), roleHandovers: [], evidence: [], notifications: [] });
import {
  acceptHandover, acceptRoleHandover, acceptRoleHandoverBlock, cancelRoleHandover, decideRoleHandover, findDepartment, finishRoleHandoverTransfer,
  lockRoleHandoverBalance, requestRoleHandover, reviewRoleHandoverKit, roleHandoverNextStep, roleHandoverRequestBlock, saveRoleHandoverAccount,
  transferRoleHandoverAccount,
} from "./actions.ts";
import type { AppState, RoleHandover } from "./types.ts";

const AT = "2026-11-09T10:00:00+07:00";
const roleOf = (s: AppState, id: string) => s.memberships.find((m) => m.clubId === CLUB && m.personId === id)!.role;
const get = (s: AppState, id: string) => s.roleHandovers.find((h) => h.id === id)!;
const input = (over: Partial<RoleHandover> & Pick<RoleHandover, "fromId" | "toId" | "role">) => ({ id: "rh1", clubId: CLUB, reason: "Sắp tốt nghiệp", ...over });

test("ai gửi được đơn: đúng người đang giữ vai, người nhận là thành viên đủ điều kiện", () => {
  const s = cleanSeed();
  assert.equal(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a006" }), undefined);
  assert.match(roleHandoverRequestBlock(s, CLUB, "a006", { role: "treasurer", toId: "a004" })!, /không giữ vai thủ quỹ/i);
  assert.match(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a002" })!, /người khác/);
  assert.match(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a003" })!, /chức danh/); // phó chủ nhiệm đang giữ chức danh khác
  assert.match(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a005" })!, /chức danh/); // trưởng ban đang giữ chức danh khác
  assert.match(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a022" })!, /đã nhận lời mời/); // chưa nhận lời mời
  assert.match(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "khong-co" })!, /danh sách/);
});

test("trưởng ban: đúng ban của mình, người nhận được là trưởng ban khác (một người làm trưởng nhiều ban)", () => {
  const s = cleanSeed();
  assert.match(roleHandoverRequestBlock(s, CLUB, "a005", { role: "head", toId: "a006" })!, /Chọn ban/);
  assert.match(roleHandoverRequestBlock(s, CLUB, "a005", { role: "head", department: "Truyền thông", toId: "a006" })!, /không phải trưởng ban/);
  assert.equal(roleHandoverRequestBlock(s, CLUB, "a005", { role: "head", department: "Hậu cần", toId: "a006" }), undefined);
  assert.equal(roleHandoverRequestBlock(s, CLUB, "a005", { role: "head", department: "Hậu cần", toId: "a007" }), undefined); // a007 đã là trưởng ban khác
});

test("gửi đơn: chờ chủ nhiệm duyệt, chủ nhiệm nhận thông báo; chưa đổi vai nào", () => {
  let s = requestRoleHandover(input({ role: "treasurer", fromId: "a002", toId: "a006" }), AT)(cleanSeed());
  const h = get(s, "rh1");
  assert.equal(h.status, "requested");
  assert.equal(h.step, 1);
  assert.equal(s.notifications.filter((n) => n.kind === "role-handover-request").map((n) => n.personId).join(), "a001");
  assert.equal(roleOf(s, "a002"), "treasurer");
  assert.match(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a004" })!, /chưa xong/); // mỗi vai một đơn
  s = cancelRoleHandover("rh1", "a002", AT)(s);
  assert.equal(get(s, "rh1").status, "cancelled");
  assert.equal(roleHandoverRequestBlock(s, CLUB, "a002", { role: "treasurer", toId: "a004" }), undefined); // hủy rồi gửi lại được
});

test("duyệt: thủ quỹ sang bước 2; phó chủ nhiệm bỏ qua bước 2 và 4 (không áp dụng)", () => {
  assert.equal(roleHandoverNextStep({ role: "treasurer" }, 1), 2);
  assert.equal(roleHandoverNextStep({ role: "vice" }, 1), 3);
  assert.equal(roleHandoverNextStep({ role: "vice" }, 3), 5);
  let t = requestRoleHandover(input({ role: "treasurer", fromId: "a002", toId: "a006" }), AT)(cleanSeed());
  t = decideRoleHandover("rh1", true, undefined, "a001", AT)(t);
  assert.equal(get(t, "rh1").step, 2);
  assert.equal(get(t, "rh1").status, "active");
  assert.equal(t.notifications.some((n) => n.personId === "a002" && n.kind === "role-handover-decision"), true);
  let v = requestRoleHandover(input({ id: "rh2", role: "vice", fromId: "a003", toId: "a004" }), AT)(cleanSeed());
  v = decideRoleHandover("rh2", true, undefined, "a001", AT)(v);
  assert.equal(get(v, "rh2").step, 3);
});

test("từ chối: ghi lý do, người gửi nhận thông báo và gửi lại được", () => {
  let s = requestRoleHandover(input({ role: "vice", fromId: "a003", toId: "a004" }), AT)(cleanSeed());
  s = decideRoleHandover("rh1", false, "Chưa tìm được người hợp hơn", "a001", AT)(s);
  const h = get(s, "rh1");
  assert.equal(h.status, "rejected");
  assert.equal(h.rejectReason, "Chưa tìm được người hợp hơn");
  assert.match(s.notifications.find((n) => n.kind === "role-handover-decision")!.body, /Chưa tìm được người hợp hơn/);
  assert.equal(roleHandoverRequestBlock(s, CLUB, "a003", { role: "vice", toId: "a006" }), undefined);
});

test("chủ nhiệm bàn giao vai của mình không cần đơn: vào bước kế ngay, người nhận nhận thông báo", () => {
  const s = requestRoleHandover(input({ role: "president", fromId: "a001", toId: "a017" }), AT)(cleanSeed());
  assert.equal(get(s, "rh1").status, "active");
  assert.equal(get(s, "rh1").step, 3);
  assert.equal(s.notifications.some((n) => n.personId === "a017"), true);
});

test("thủ quỹ đi hết các bước: chốt số dư, kho, tài khoản nhận quỹ, quyền quản trị, người nhận xác nhận", () => {
  let s = requestRoleHandover(input({ role: "treasurer", fromId: "a002", toId: "a006" }), AT)(cleanSeed());
  s = decideRoleHandover("rh1", true, undefined, "a001", AT)(s);
  s = lockRoleHandoverBalance("rh1", "a002", AT)(s);
  assert.equal(get(s, "rh1").step, 3);
  assert.equal(get(s, "rh1").lockedBalance, 3_120_000);
  s = reviewRoleHandoverKit("rh1", "a002", AT)(s);
  assert.equal(get(s, "rh1").step, 4);
  s = saveRoleHandoverAccount("rh1", { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" }, "REF1", "a002", AT)(s);
  assert.equal(get(s, "rh1").step, 5);
  s = transferRoleHandoverAccount("rh1", "kit-ngan-hang", "a002", AT)(s);
  assert.equal(s.kitAccounts.find((a) => a.id === "kit-ngan-hang")!.holderId, "a006");
  s = finishRoleHandoverTransfer("rh1", "a002", AT)(s);
  assert.equal(get(s, "rh1").step, 6);
  assert.equal(s.notifications.some((n) => n.personId === "a006" && n.kind === "role-handover-accept"), true);
  assert.equal(acceptRoleHandoverBlock(s, get(s, "rh1")), undefined);
  s = acceptRoleHandover("rh1", "a006", AT)(s);
  assert.equal(get(s, "rh1").status, "done");
  assert.equal(get(s, "rh1").step, 7);
  assert.equal(roleOf(s, "a006"), "treasurer");
  assert.equal(roleOf(s, "a002"), "member");
  assert.equal(s.notifications.some((n) => n.personId === "a006" && n.kind === "role-handover-accept" && n.readAt), true);
  assert.equal(s.notifications.some((n) => n.personId === "a002" && n.kind === "role-handover-done"), true);
});

test("bàn giao trưởng ban: chỉ ban đó đổi trưởng; người cũ vẫn là trưởng ban khác thì giữ vai", () => {
  let s = requestRoleHandover(input({ role: "head", department: "Hậu cần", fromId: "a005", toId: "a007" }), AT)(cleanSeed());
  s = decideRoleHandover("rh1", true, undefined, "a001", AT)(s);
  s = reviewRoleHandoverKit("rh1", "a005", AT)(s);
  s = finishRoleHandoverTransfer("rh1", "a005", AT)(s);
  s = acceptRoleHandover("rh1", "a007", AT)(s);
  assert.equal(findDepartment(s, CLUB, "Hậu cần")!.headId, "a007");
  assert.equal(findDepartment(s, CLUB, "Truyền thông")!.headId, "a007"); // một người hai ban
  assert.equal(roleOf(s, "a007"), "head");
  assert.equal(roleOf(s, "a005"), "member"); // không còn làm trưởng ban nào
});

test("xác nhận bị chặn khi người giao đã đổi vai trong lúc chờ", () => {
  let s = requestRoleHandover(input({ role: "vice", fromId: "a003", toId: "a004" }), AT)(cleanSeed());
  s = { ...s, memberships: s.memberships.map((m) => (m.personId === "a003" ? { ...m, role: "member" as const } : m)) };
  assert.match(acceptRoleHandoverBlock(s, get(s, "rh1"))!, /không còn giữ vai/);
});

test("bàn giao cả ban xong thì đơn bàn giao một vai đang chạy tự hủy", () => {
  let s = requestRoleHandover(input({ role: "vice", fromId: "a003", toId: "a004" }), AT)(cleanSeed());
  s = { ...s, handovers: s.handovers.map((h) => ({ ...h, step: 6, newBoard: { president: "a017", heads: [] } })) };
  s = acceptHandover(CLUB, "a017", AT)(s);
  assert.equal(get(s, "rh1").status, "cancelled");
});
