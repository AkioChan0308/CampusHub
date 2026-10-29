// Chạy: npm test. Phần lưu dữ liệu vào PostgreSQL (dùng PGlite: PostgreSQL chạy ngay trong Node, không cần cài).
// Các test API khác chạy được trên PostgreSQL bằng npm run test:db.

import assert from "node:assert/strict";
import { test } from "node:test";
import type { Db } from "../src/db/client.ts";
import { createDbAccounts } from "../src/db/accounts.ts";
import { createDbSessions } from "../src/db/sessions.ts";
import { createDbStore } from "../src/db/store.ts";
import { createSeed, type AppState } from "../src/domain.ts";
import { CLUB, COL, csv, NOW, startServer } from "./helpers.ts";
import { createPgliteDb } from "./pglite.ts";

/** So dữ liệu theo nội dung: bỏ trường trống và vai đang chọn của bản demo (không lưu). */
const plain = (s: AppState) => JSON.parse(JSON.stringify({ ...s, persona: null }));

async function withDb(fn: (db: Db) => Promise<void>) {
  const db = await createPgliteDb();
  try {
    await fn(db);
  } finally {
    await db.close();
  }
}

test("cơ sở dữ liệu trống: tạo bảng, nạp dữ liệu mẫu, đọc lại giống hệt dữ liệu mẫu", () => withDb(async (db) => {
  const seed = createSeed();
  const store = await createDbStore(db, { seed: () => seed });
  assert.deepEqual(plain(store.state), plain(seed));
  const counts = (await db.query<{ n: number }>("select (select count(*) from persons)::int + (select count(*) from ledger)::int as n")).rows[0].n;
  assert.equal(counts, seed.persons.length + seed.ledger.length);
  // Khởi động lần hai: không tạo lại bảng, không nạp dữ liệu mẫu chồng lên.
  const again = await createDbStore(db, { seed: () => { throw new Error("không được nạp lại dữ liệu mẫu"); } });
  assert.deepEqual(plain(again.state), plain(seed));
}));

test("làm việc qua API rồi khởi động lại máy chủ: dữ liệu còn nguyên, phiên đăng nhập còn dùng được", () => withDb(async (db) => {
  const srv = await startServer({ db });
  const C = `/clubs/${CLUB}`;
  const K = `${C}/collections/${COL}`;
  const E = `${C}/events/tuan-5`;
  const ok = async (method: string, path: string, opts: Parameters<typeof srv.call>[2]) => {
    const r = await srv.call(method, path, opts);
    assert.ok(r.status < 300, `${method} ${path}: ${r.status} ${JSON.stringify(r.body)}`);
    return r;
  };
  try {
    await ok("POST", `${C}/applications/don-1/approve`, { as: "a001" });
    await ok("POST", `${C}/applications/don-2/reject`, { as: "a001" });
    await ok("POST", `/clubs/vong-lap/applications`, { as: "p-hong-nhung", body: { year: 2, reason: "Thử", consent: true } });
    await ok("POST", "/invites/moi-a022/accept", { as: "a022", body: { membership: true, age16: true, phone: true } });
    await ok("POST", `${K}/payments/a021`, { as: "a002", body: { method: "cash" } });
    // Ghi nhận tay một khoản chuyển khoản: số tiền chờ thấy trong sao kê phải còn sau khi khởi động lại.
    await ok("POST", `${K}/payments/a033`, { as: "a002", body: { method: "transfer" } });
    await ok("POST", `/me/collections/${COL}/report-transfer`, { as: "a024" });
    await ok("POST", `${K}/statements`, { as: "a002", body: { fileName: "thu.csv", csv: csv([["02/10/2026 09:15:07", "100,000.00", "LE NGOC ANH", "QFALL26 A037"], ["02/10/2026 11:40:51", "100,000", "AI DO", "chuyen tien"]]) } });
    const row = (await ok("GET", `${K}/reconciliation`, { as: "a002" })).body.rows.find((x: { content: string }) => x.content === "chuyen tien");
    await ok("POST", `${K}/statements/${row.statementId}/txns/${row.txnId}/resolve`, { as: "a002", body: { personIds: ["a030"] } });
    await ok("POST", `${E}/open`, { as: "a001" });
    await ok("POST", "/checkin", { as: "a017", body: { eventId: "tuan-5", token: srv.qr("tuan-5"), deviceId: "dien-thoai-thu" } });
    await ok("POST", `${E}/attendance`, { as: "a005", body: { personId: "a009" } });
    await ok("POST", `${E}/close`, { as: "a001" });
    const created = (await ok("POST", `${C}/expenses`, { as: "a005", body: { kind: "proposal", title: "Mua nước", amount: 120_000, reason: "Giải nội bộ" } })).body.expense;
    await ok("POST", `${C}/expenses/${created.id}/approve`, { as: "a001", body: { note: "Nhớ lấy hóa đơn" } });
    await ok("POST", `${C}/expenses/${created.id}/spent`, { as: "a002" });
    await ok("POST", `${C}/expenses/chi-1/reject`, { as: "a001", body: { note: "Chờ báo giá của sân" } });
    await ok("POST", "/school/expenses/chi-3/approve", { as: "p-thu-trang", body: {} });
    await ok("POST", `${C}/budget/items`, { as: "a002", body: { name: "Mua lưới", planned: 1_500_000 } });
    await ok("POST", `${C}/budget/submit`, { as: "a002" });
    await ok("POST", `${C}/handover-kit/documents`, { as: "a001", body: { name: "Mẫu thử", category: "other", link: "https://example.com/thu", holderId: "a003" } });
    await ok("POST", `${C}/handover-kit/processes`, { as: "a001", body: { name: "Quy trình thử", steps: [{ text: "Một", who: "" }, { text: "Hai", who: "Thủ quỹ" }], leadDays: 3, documentIds: ["kit-de-xuat-chi"] } });
    await ok("PUT", `${C}/handover-kit/accounts/kit-email`, { as: "a001", body: { service: "Email của CLB", label: "clb.caulong.mau@example.com", ownership: "club", required: true, holderId: "a003" } });
    await ok("DELETE", `${C}/handover-kit/documents/kit-ke-hoach-ky`, { as: "a001" });
    await ok("POST", `${C}/ai/ask`, { as: "a001", body: { question: "Xin phòng họp" } });
    await ok("POST", `${C}/ai/summary`, { as: "a001" });
    await ok("PUT", `${C}/handover/summary`, { as: "a001", body: { text: "Tóm tắt thử đã sửa tay" } });
    await ok("PUT", `${C}/handover/receiver`, { as: "a001", body: { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" } });
    await ok("POST", `${C}/handover/accounts/kit-fanpage/transfer`, { as: "a001", body: { holderId: "a017" } });
    const task = (await ok("POST", `${C}/tasks`, { as: "a001", body: { title: "Việc lưu thử", assigneeId: "a005", due: "2026-10-30T23:59:00+07:00", processId: "kit-xin-phong" } })).body.task;
    await ok("POST", `${C}/tasks/${task.id}/status`, { as: "a005", body: { status: "doing" } });
    await ok("PUT", `${C}/handover/step`, { as: "a001", body: { step: 3 } });
    await ok("POST", `${C}/handover/kit-review`, { as: "a001" });
    await ok("POST", `/me/clubs/${CLUB}/consents/phone/withdraw`, { as: "a017" });
    await ok("POST", `/me/clubs/${CLUB}/deletion-request`, { as: "a017" });
    await ok("PUT", "/me/account", { as: "a018", body: { name: "Võ Hoàng Long", username: "hoang.long", password: "Cau-Long-2026" } });
    const login = await ok("POST", "/auth/dev-login", { body: { personId: "a002" } });
    const cookie = login.cookies.find((c) => c.startsWith("ch_session="))!;

    // "Khởi động lại": kho và phiên mới đọc từ cùng cơ sở dữ liệu.
    const again = await createDbStore(db);
    assert.deepEqual(plain(again.state), plain(srv.store.state));
    // Tài khoản đặt mật khẩu còn sau khi khởi động lại; bảng chỉ có mã băm.
    const accounts = await createDbAccounts(db);
    assert.equal(accounts.get("a018")?.username, "hoang.long");
    assert.match(accounts.get("a018")!.passwordHash!, /^scrypt\$/);
    const sessions = await createDbSessions(db, () => NOW);
    assert.equal(sessions.personId(cookie.slice("ch_session=".length)), "a002");
    // Bảng phiên chỉ có mã băm, không có cookie.
    const stored = (await db.query<{ token_hash: string }>("select token_hash from sessions")).rows.map((r) => r.token_hash);
    assert.ok(!stored.includes(cookie.slice("ch_session=".length)));
  } finally {
    await srv.close();
  }
}));

test("sổ quỹ, lịch sử khoản chi, nhật ký đồng ý: cơ sở dữ liệu tự chặn sửa và xóa", () => withDb(async (db) => {
  await createDbStore(db);
  const rejects = (sql: string) => assert.rejects(db.query(sql), /chỉ được thêm|không được xóa|chỉ được ghi thêm|Không được xóa hết/i, sql);
  await rejects("update ledger set amount = 1");
  await rejects("delete from ledger");
  await rejects("truncate ledger");
  await rejects("update expense_history set note = 'sửa'");
  await rejects("delete from expense_history");
  await rejects("update consents set version = 'khac'");
  await rejects("delete from consents");
  // Ghi ngày rút đồng ý: được một lần.
  await db.query("update consents set withdrawn_at = now() where purpose = 'phone' and person_id = 'a017'");
  await rejects("update consents set withdrawn_at = now() where purpose = 'phone' and person_id = 'a017'");
}));

test("luật trong cơ sở dữ liệu: một điện thoại một người mỗi buổi, từ chối phải có lý do", () => withDb(async (db) => {
  await createDbStore(db);
  await db.query("insert into attendance (event_id, person_id, at, method, device_id) values ('tuan-5', 'a017', now(), 'qr', 'mot-may')");
  await assert.rejects(db.query("insert into attendance (event_id, person_id, at, method, device_id) values ('tuan-5', 'a009', now(), 'qr', 'mot-may')"), /attendance_one_person_per_device/);
  await assert.rejects(db.query("update expenses set status = 'rejected', reject_note = null where id = 'chi-1'"), /check/i);
}));

test("ghi vào cơ sở dữ liệu lỗi: API báo lỗi 500, dữ liệu quay về bản đã lưu, lần sau vẫn làm được", () => withDb(async (db) => {
  let fail = false;
  const flaky: Db = { ...db, transaction: (fn) => (fail ? Promise.reject(new Error("PostgreSQL tắt")) : db.transaction(fn)) };
  const srv = await startServer({ db: flaky });
  const K = `/clubs/${CLUB}/collections/${COL}`;
  const paid = async () => (await srv.call("GET", K, { as: "a002" })).body.stats.paid;
  const origError = console.error;
  console.error = () => {};
  try {
    const before = await paid();
    fail = true;
    const r = await srv.call("POST", `${K}/payments/a021`, { as: "a002", body: { method: "cash" } });
    assert.equal(r.status, 500);
    assert.equal(r.body.error.message, "Máy chủ chưa lưu được thay đổi. Thử lại sau.");
    fail = false;
    assert.equal(await paid(), before);
    assert.equal((await srv.call("POST", `${K}/payments/a021`, { as: "a002", body: { method: "cash" } })).status, 200);
    assert.equal(await paid(), before + 1);
    assert.deepEqual(plain((await createDbStore(db)).state), plain(srv.store.state));
  } finally {
    console.error = origError;
    await srv.close();
  }
}));
