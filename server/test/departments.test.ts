// Chạy: npm test. Ban và trưởng ban (09/11/2026): chủ nhiệm cấu hình ban; mỗi ban đúng một trưởng; một người làm trưởng nhiều ban.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer, useMidHandover } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); useMidHandover(srv); });

const C = `/clubs/${CLUB}`;
type Dep = { id: string; name: string; head?: { personId: string }; members: number };
const members = async (as = "a001") => (await srv.call("GET", `${C}/members`, { as })).body as { departments: Dep[]; members: { personId: string; role: string; department: string }[] };
const dep = async (name: string) => (await members()).departments.find((d) => d.name === name)!;
const roleOf = async (id: string) => (await members()).members.find((m) => m.personId === id)!.role;

test("danh sách thành viên kèm danh sách ban: trưởng ban và số thành viên", async () => {
  const m = await members();
  assert.deepEqual(m.departments.map((d) => d.name), ["Ban chủ nhiệm", "Chuyên môn", "Hậu cần", "Truyền thông"]);
  assert.equal(m.departments.find((d) => d.name === "Hậu cần")!.head!.personId, "a005");
  assert.equal(m.departments.find((d) => d.name === "Ban chủ nhiệm")!.head, undefined);
  assert.equal(m.departments.reduce((n, d) => n + d.members, 0), m.members.length); // mọi thành viên thuộc một ban có trong danh sách
});

test("thêm ban: chỉ chủ nhiệm; tên không rỗng, không trùng (không phân biệt hoa thường), không phải 'Chưa xếp ban'", async () => {
  const add = (as: string, name: string) => srv.call("POST", `${C}/departments`, { as, body: { name } });
  const r = await add("a001", "  Đối  ngoại ");
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.departments.at(-1).name, "Đối ngoại");
  assert.equal(r.body.departments.at(-1).head, undefined);
  assert.equal((await add("a005", "Ban khác")).status, 403); // trưởng ban không tạo được
  assert.equal((await add("a003", "Ban khác")).status, 403); // phó chủ nhiệm cũng không
  assert.equal((await add("a001", "đối NGOẠI")).status, 409);
  assert.equal((await add("a001", "   ")).status, 400);
  assert.equal((await add("a001", "Chưa xếp ban")).status, 400);
  assert.equal((await add("a001", "x".repeat(61))).status, 400);
});

test("đổi tên ban: thành viên và trưởng ban giữ nguyên, bàn giao đang mở đổi theo", async () => {
  const before = await dep("Hậu cần");
  const r = await srv.call("PUT", `${C}/departments/${before.id}`, { as: "a001", body: { name: "Hậu cần sự kiện" } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const after = await dep("Hậu cần sự kiện");
  assert.equal(after.id, before.id);
  assert.equal(after.members, before.members);
  assert.equal(after.head!.personId, "a005");
  const h = (await srv.call("GET", `${C}/handover`, { as: "a001" })).body;
  assert.ok(h.newBoard.heads.some((x: { department: string }) => x.department === "Hậu cần sự kiện"));
  assert.equal((await srv.call("PUT", `${C}/departments/${before.id}`, { as: "a001", body: { name: "Truyền thông" } })).status, 409); // trùng ban khác
  assert.equal((await srv.call("PUT", `${C}/departments/${before.id}`, { as: "a001", body: {} })).status, 400);
  assert.equal((await srv.call("PUT", `${C}/departments/khong-co`, { as: "a001", body: { name: "A" } })).status, 404);
});

test("đặt trưởng ban: trưởng cũ về thành viên; một người làm trưởng nhiều ban; bỏ trống được", async () => {
  const hc = await dep("Hậu cần"), tt = await dep("Truyền thông");
  const put = (id: string, headId: string | null, as = "a001") => srv.call("PUT", `${C}/departments/${id}`, { as, body: { headId } });
  assert.equal((await put(hc.id, "a006", "a005")).status, 403); // chỉ chủ nhiệm
  assert.equal((await put(hc.id, "a006")).status, 200);
  assert.equal((await dep("Hậu cần")).head!.personId, "a006");
  assert.equal(await roleOf("a006"), "head");
  assert.equal(await roleOf("a005"), "member");
  // a006 làm thêm trưởng Truyền thông: một người hai ban.
  assert.equal((await put(tt.id, "a006")).status, 200);
  assert.equal((await dep("Hậu cần")).head!.personId, "a006");
  assert.equal((await dep("Truyền thông")).head!.personId, "a006");
  assert.equal(await roleOf("a007"), "member"); // trưởng cũ của Truyền thông
  // Bỏ một ban thì vẫn còn là trưởng ban của ban kia.
  assert.equal((await put(hc.id, null)).status, 200);
  assert.equal((await dep("Hậu cần")).head, undefined);
  assert.equal(await roleOf("a006"), "head");
  assert.equal((await put(tt.id, null)).status, 200);
  assert.equal(await roleOf("a006"), "member");
});

test("ai không làm trưởng ban được: chủ nhiệm, phó chủ nhiệm, thủ quỹ, người chưa nhận lời mời, người ngoài CLB", async () => {
  const hc = await dep("Hậu cần");
  for (const id of ["a001", "a003", "a002", "a022", "p-thu-trang", "khong-co"]) {
    const r = await srv.call("PUT", `${C}/departments/${hc.id}`, { as: "a001", body: { headId: id } });
    assert.equal(r.status, 400, `${id}: ${JSON.stringify(r.body)}`);
  }
  assert.equal((await dep("Hậu cần")).head!.personId, "a005"); // không đổi gì
});

test("xóa ban: bị chặn khi còn trưởng ban hoặc thành viên; hết người thì xóa được", async () => {
  const created = await srv.call("POST", `${C}/departments`, { as: "a001", body: { name: "Đối ngoại" } });
  const id = created.body.departments.at(-1).id as string;
  const del = (as = "a001") => srv.call("DELETE", `${C}/departments/${id}`, { as });
  assert.equal((await del("a005")).status, 403);
  await srv.call("PUT", `${C}/members/a004`, { as: "a001", body: { role: "member", department: "Đối ngoại" } });
  const blocked = await del();
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.error.message, /còn 1 thành viên/);
  await srv.call("PUT", `${C}/members/a004`, { as: "a001", body: { role: "member", department: "Chuyên môn" } });
  await srv.call("PUT", `${C}/departments/${id}`, { as: "a001", body: { headId: "a004" } });
  assert.match((await del()).body.error.message, /còn trưởng ban/);
  await srv.call("PUT", `${C}/departments/${id}`, { as: "a001", body: { headId: null } });
  const ok = await del();
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.departments.some((d: Dep) => d.id === id), false);
  assert.equal((await del()).status, 404);
});

test("thêm thành viên: ban phải có trong danh sách; ban chưa có thì chỉ tạo khi chủ nhiệm đồng ý", async () => {
  const body = (department: string, extra = {}) => ({ members: [{ name: "Người mới", email: "nguoi.moi@example.com", department }], ...extra });
  const unknown = await srv.call("POST", `${C}/members`, { as: "a001", body: body("Đối ngoại") });
  assert.equal(unknown.status, 409);
  assert.deepEqual(unknown.body.error.details.departments, ["Đối ngoại"]);
  assert.equal((await members()).departments.some((d) => d.name === "Đối ngoại"), false, "không tự tạo ban");
  // Trưởng ban được thêm thành viên nhưng không cấu hình ban.
  assert.equal((await srv.call("POST", `${C}/members`, { as: "a005", body: body("Đối ngoại", { createMissingDepartments: true }) })).status, 403);
  const created = await srv.call("POST", `${C}/members`, { as: "a001", body: body("Đối ngoại", { createMissingDepartments: true }) });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const m = await members();
  assert.equal(m.departments.find((d) => d.name === "Đối ngoại")!.members, 1);
  // Tên ban khớp không phân biệt hoa thường: dùng ban có sẵn, không tạo ban trùng.
  const again = await srv.call("POST", `${C}/members`, { as: "a001", body: { members: [{ name: "Người nữa", email: "nguoi.nua@example.com", department: "hậu cần" }] } });
  assert.equal(again.status, 201);
  const after = await members();
  assert.equal(after.departments.filter((d) => d.name.toLowerCase() === "hậu cần").length, 1);
  assert.equal(after.members.find((x) => x.personId === again.body.added[0].personId)!.department, "Hậu cần");
  // Bỏ trống ban: chưa xếp ban.
  const none = await srv.call("POST", `${C}/members`, { as: "a001", body: { members: [{ name: "Chưa ban", email: "chua.ban@example.com" }] } });
  assert.equal((await members()).members.find((x) => x.personId === none.body.added[0].personId)!.department, "Chưa xếp ban");
});

test("tạo CLB mới: có sẵn các ban mẫu, chưa ai làm trưởng", async () => {
  const r = await srv.call("POST", "/clubs", { as: "a017", body: { name: "CLB thử ban", field: "Học thuật, nghiên cứu", schedule: "Tối Thứ Hai", location: "Phòng A", term: "Spring 2027", acceptingApplications: true } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const m = (await srv.call("GET", `/clubs/${r.body.club.id}/members`, { as: "a017" })).body;
  assert.deepEqual(m.departments.map((d: Dep) => d.name), ["Ban chủ nhiệm", "Hậu cần", "Truyền thông", "Sự kiện"]);
  assert.equal(m.departments.every((d: Dep) => d.head === undefined), true);
  assert.equal(m.departments[0].members, 1); // chủ nhiệm
});
