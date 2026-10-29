// Chạy: npm test. Kho bàn giao: ai thấy phần nào, ai sửa được, kiểm tra dữ liệu gửi lên, xóa biểu mẫu gỡ khỏi quy trình.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const K = `/clubs/${CLUB}/handover-kit`;
const DOC = { name: "Mẫu thử", category: "other", link: "https://example.com/mau-thu", holderId: "a003" };

test("ban điều hành thấy đủ ba phần, kèm số mục thiếu", async () => {
  const r = await srv.call("GET", K, { as: "a001" });
  assert.equal(r.status, 200);
  assert.equal(r.body.documents.length, 5);
  assert.equal(r.body.processes.length, 3);
  assert.equal(r.body.accounts.length, 5);
  assert.deepEqual(r.body.summary, { documents: 5, processes: 3, accounts: 5, missing: 1, personal: 3 });
  assert.equal(r.body.holders.length, 42);
  const process = r.body.processes.find((p: { id: string }) => p.id === "kit-xin-phep-su-kien");
  assert.deepEqual(process.documents.map((d: { id: string }) => d.id), ["kit-mau-xin-phep", "kit-de-xuat-chi"]);
  assert.equal(r.body.accounts.find((a: { id: string }) => a.id === "kit-email").holder, undefined);
});

test("thành viên thường chỉ thấy biểu mẫu và quy trình, không thấy tài khoản", async () => {
  const r = await srv.call("GET", K, { as: "a017" });
  assert.equal(r.status, 200);
  assert.equal(r.body.documents.length, 5);
  assert.equal(r.body.processes.length, 3);
  assert.equal(r.body.accounts, undefined);
  assert.equal(r.body.holders, undefined);
  assert.deepEqual(r.body.summary, { documents: 5, processes: 3 });
  assert.ok(!JSON.stringify(r.body).includes("example.com/fanpage"));
});

test("người chưa nhận lời mời, người ngoài CLB và cán bộ trường không đọc được kho", async () => {
  assert.equal((await srv.call("GET", K, { as: "a022" })).status, 403);
  assert.equal((await srv.call("GET", K, { as: "p-bao-chau" })).status, 403);
  assert.equal((await srv.call("GET", K, { as: "p-thu-trang" })).status, 403);
});

test("chủ nhiệm, phó chủ nhiệm, trưởng ban sửa được; thủ quỹ và thành viên không", async () => {
  for (const as of ["a001", "a003", "a005"]) {
    const r = await srv.call("POST", `${K}/documents`, { as, body: DOC });
    assert.equal(r.status, 201, as);
  }
  for (const as of ["a002", "a017"]) {
    const r = await srv.call("POST", `${K}/documents`, { as, body: DOC });
    assert.equal(r.status, 403, as);
  }
  assert.equal((await srv.call("GET", K, { as: "a001" })).body.documents.length, 8);
});

test("thêm, sửa, xóa biểu mẫu", async () => {
  const made = (await srv.call("POST", `${K}/documents`, { as: "a001", body: DOC })).body.document;
  assert.equal(made.holder.name, "Đinh Công Minh");
  const put = await srv.call("PUT", `${K}/documents/${made.id}`, { as: "a001", body: { ...DOC, name: "Mẫu đã sửa", category: "finance" } });
  assert.equal(put.body.document.name, "Mẫu đã sửa");
  assert.equal(put.body.document.category, "finance");
  assert.equal((await srv.call("DELETE", `${K}/documents/${made.id}`, { as: "a001" })).status, 200);
  assert.equal((await srv.call("DELETE", `${K}/documents/${made.id}`, { as: "a001" })).status, 404);
});

test("xóa biểu mẫu thì quy trình đang dùng nó không còn nhắc tới nó", async () => {
  await srv.call("DELETE", `${K}/documents/kit-mau-xin-phep`, { as: "a001" });
  const p = (await srv.call("GET", K, { as: "a001" })).body.processes.find((x: { id: string }) => x.id === "kit-xin-phep-su-kien");
  assert.deepEqual(p.documents.map((d: { id: string }) => d.id), ["kit-de-xuat-chi"]);
});

test("kiểm tra dữ liệu gửi lên: link, người giữ, biểu mẫu đi kèm", async () => {
  const bad = (body: unknown, path = "documents") => srv.call("POST", `${K}/${path}`, { as: "a001", body });
  assert.equal((await bad({ ...DOC, link: "javascript:alert(1)" })).status, 400);
  assert.equal((await bad({ ...DOC, link: "mau-thu" })).status, 400);
  assert.equal((await bad({ ...DOC, name: "  " })).status, 400);
  assert.equal((await bad({ ...DOC, holderId: "p-bao-chau" })).status, 400); // không phải thành viên CLB
  assert.equal((await bad({ name: "Quy trình", steps: [], documentIds: [] }, "processes")).status, 400);
  assert.equal((await bad({ name: "Quy trình", steps: [{ text: "Làm", who: "" }], documentIds: ["khong-co"] }, "processes")).status, 400);
  assert.equal((await bad({ service: "Zalo", label: "x", ownership: "club", required: true, holderId: "p-bao-chau" }, "accounts")).status, 400);
});

test("quy trình: thứ tự bước được giữ, bỏ leadDays thì mất hạn thường gặp", async () => {
  const body = { name: "Xin sân", steps: [{ text: "Bước một", who: "Chủ nhiệm" }, { text: "Bước hai", who: "" }], leadDays: 5, documentIds: ["kit-de-xuat-chi"] };
  const made = (await srv.call("POST", `${K}/processes`, { as: "a001", body })).body.process;
  assert.deepEqual(made.steps.map((s: { text: string }) => s.text), ["Bước một", "Bước hai"]);
  assert.equal(made.leadDays, 5);
  const edited = (await srv.call("PUT", `${K}/processes/${made.id}`, { as: "a001", body: { ...body, steps: [...body.steps].reverse(), leadDays: undefined } })).body.process;
  assert.deepEqual(edited.steps.map((s: { text: string }) => s.text), ["Bước hai", "Bước một"]);
  assert.equal(edited.leadDays, undefined);
});

test("tài khoản: điền người giữ thì hết thiếu; bỏ người giữ thì thiếu lại; không có chỗ nào lưu mật khẩu", async () => {
  const acc = { service: "Email của CLB", label: "clb.caulong.mau@example.com", ownership: "club", required: true };
  assert.equal((await srv.call("PUT", `${K}/accounts/kit-email`, { as: "a001", body: { ...acc, holderId: "a003" } })).body.account.holder.personId, "a003");
  assert.equal((await srv.call("GET", K, { as: "a001" })).body.summary.missing, 0);
  const cleared = (await srv.call("PUT", `${K}/accounts/kit-email`, { as: "a001", body: acc })).body.account;
  assert.equal(cleared.holder, undefined);
  assert.equal((await srv.call("GET", K, { as: "a001" })).body.summary.missing, 1);
  assert.ok(!/pass|mật khẩu/i.test(JSON.stringify(cleared)));
});

test("không sửa được kho của CLB khác qua mã của mục", async () => {
  const r = await srv.call("DELETE", `/clubs/vong-lap/handover-kit/documents/kit-mau-xin-phep`, { as: "a001" });
  assert.equal(r.status, 403); // a001 không ở ban điều hành CLB Vòng Lặp
});
