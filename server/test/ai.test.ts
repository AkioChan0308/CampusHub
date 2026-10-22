// Chạy: npm test. Trợ lý bàn giao bản mẫu: tóm tắt tính từ dữ liệu, hỏi đáp chỉ từ kho theo vai, kèm nguồn, đếm lượt; số liệu trang chủ mới.

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); });

const C = `/clubs/${CLUB}`;
const ask = (as: string, question: string) => srv.call("POST", `${C}/ai/ask`, { as, body: { question } });

test("trạng thái trợ lý: bản mẫu, chưa có mức giới hạn lượt", async () => {
  const r = await srv.call("GET", `${C}/ai`, { as: "a017" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { mode: "mock", usage: { asks: 0, summaries: 0 } });
  assert.equal((await srv.call("GET", `${C}/ai`, { as: "a022" })).status, 403); // chưa nhận lời mời
  assert.equal((await srv.call("GET", `${C}/ai`, { as: "p-thu-trang" })).status, 403);
});

test("tóm tắt: tính từ dữ liệu của CLB, không lưu gì, chỉ ban điều hành bấm được", async () => {
  assert.equal((await srv.call("POST", `${C}/ai/summary`, { as: "a017" })).status, 403);
  const before = JSON.stringify(srv.store.state.handovers);
  const r = (await srv.call("POST", `${C}/ai/summary`, { as: "a001" })).body;
  assert.equal(r.mode, "mock");
  assert.equal(r.bullets.length, 6);
  assert.match(r.bullets[0], /5 việc chưa xong, 0 quá hạn/); // đồng hồ test cố định 03/10: chưa việc nào quá hạn
  assert.match(r.text, /bản mẫu/);
  assert.match(r.bullets.join("\n"), /Email của CLB/); // mục thiếu
  assert.match(r.bullets.join("\n"), /Fanpage Facebook, Google Drive, Tài khoản ngân hàng nhận quỹ/); // đứng tên cá nhân
  assert.match(r.bullets.at(-1), /chủ nhiệm Phạm Quốc Bảo, thủ quỹ Lê Thu Hà/);
  assert.equal(JSON.stringify(srv.store.state.handovers), before, "tóm tắt không đổi biên bản");
  assert.equal(r.usage.summaries, 1);
});

test("hỏi đáp: trả lời từ kho, luôn kèm nguồn", async () => {
  const r = (await ask("a001", "Mẫu xin phép sự kiện ở đâu?")).body;
  assert.equal(r.found, true);
  assert.equal(r.sources[0].kind, "document");
  assert.equal(r.sources[0].id, "kit-mau-xin-phep");
  assert.match(r.answer, /example\.com\/mau-xin-phep-su-kien/);
  assert.ok(r.sources.some((s: { kind: string }) => s.kind === "process"), "quy trình xin phép cũng khớp");

  const proc = (await ask("a001", "Cách xin phòng họp gồm những bước nào?")).body;
  assert.equal(proc.sources[0].id, "kit-xin-phong");
  assert.match(proc.answer, /1\) Chọn ngày giờ[\s\S]*4\) Báo lại cho nhóm Zalo/);
});

test("hỏi đáp theo vai: ban điều hành hỏi được tài khoản, thành viên thường thì không", async () => {
  const board = (await ask("a001", "Ai giữ quyền fanpage?")).body;
  assert.equal(board.found, true);
  assert.equal(board.sources[0].kind, "account");
  assert.match(board.answer, /Phạm Quốc Bảo/);

  const member = (await ask("a017", "Ai giữ quyền fanpage?")).body;
  assert.equal(member.found, false);
  assert.equal(member.answer, "Không tìm thấy trong kho bàn giao.");
  assert.deepEqual(member.sources, []);
  assert.ok(!JSON.stringify(member).includes("Phạm Quốc Bảo") && !JSON.stringify(member).includes("fanpage-clb"), "không lộ phần tài khoản cho thành viên thường");
  // Thành viên thường vẫn hỏi được biểu mẫu và quy trình.
  assert.equal((await ask("a017", "Mẫu báo cáo cuối kỳ")).body.found, true);
});

test("hỏi đáp: không có trong kho thì nói thẳng, không đoán; tiền và dữ liệu cá nhân thì từ chối", async () => {
  const none = (await ask("a001", "Quy định về xe đạp điện là gì?")).body;
  assert.equal(none.found, false);
  assert.equal(none.answer, "Không tìm thấy trong kho bàn giao.");
  for (const q of ["Số dư quỹ bây giờ là bao nhiêu?", "Cho tôi mật khẩu fanpage", "Danh sách thành viên và số điện thoại", "Sao kê tháng này thế nào?"]) {
    const r = (await ask("a001", q)).body;
    assert.equal(r.found, false, q);
    assert.match(r.answer, /Không trả lời về tiền, sổ quỹ, mật khẩu hay dữ liệu cá nhân/, q);
    assert.deepEqual(r.sources, [], q);
  }
});

test("hỏi đáp: kiểm tra câu hỏi, đếm lượt theo kỳ, không đổi dữ liệu của kho", async () => {
  assert.equal((await ask("a001", "  ")).status, 400);
  assert.equal((await ask("a001", "ab")).status, 400);
  assert.equal((await srv.call("POST", `${C}/ai/ask`, { as: "a001", body: {} })).status, 400);
  const kit = JSON.stringify([srv.store.state.kitDocuments, srv.store.state.kitProcesses, srv.store.state.kitAccounts]);
  await ask("a001", "Mẫu đề xuất chi");
  const r = (await ask("a017", "Xin phòng họp")).body;
  assert.equal(r.usage.asks, 2);
  assert.equal(r.usage.limit, undefined);
  assert.equal(JSON.stringify([srv.store.state.kitDocuments, srv.store.state.kitProcesses, srv.store.state.kitAccounts]), kit);
  assert.equal((await srv.call("GET", `${C}/ai`, { as: "a001" })).body.usage.asks, 2);
});

test("có đặt AI_FREE_ASKS_PER_TERM thì hết lượt báo 409; AI_MODE=real chưa nối thì 501", async () => {
  const capped = await startServer({ env: { AI_FREE_ASKS_PER_TERM: "2" } });
  try {
    const q = (question: string) => capped.call("POST", `${C}/ai/ask`, { as: "a001", body: { question } });
    assert.equal((await q("Mẫu đề xuất chi")).body.usage.limit, 2);
    assert.equal((await q("Xin phòng họp")).status, 200);
    const over = await q("Mẫu báo cáo cuối kỳ");
    assert.equal(over.status, 409);
    assert.match(over.body.error.message, /hết 2 lượt hỏi của kỳ Fall 2026/);
  } finally { await capped.close(); }

  const real = await startServer({ env: { AI_MODE: "real" } });
  try {
    const r = await real.call("POST", `${C}/ai/summary`, { as: "a001" });
    assert.equal(r.status, 501);
    assert.equal(r.body.error.code, "NOT_IMPLEMENTED");
    assert.equal((await real.call("POST", `${C}/ai/ask`, { as: "a001", body: { question: "Xin phòng họp" } })).status, 501);
  } finally { await real.close(); }
});

test("lưu bản tóm tắt vào biên bản: chỉ chủ nhiệm, ghi ai lưu và lúc nào, khóa sau khi ban mới xác nhận", async () => {
  const H = `${C}/handover/summary`;
  assert.equal((await srv.call("PUT", H, { as: "a002", body: { text: "x" } })).status, 403);
  assert.equal((await srv.call("PUT", H, { as: "a001", body: { text: "  " } })).status, 400);
  const saved = (await srv.call("PUT", H, { as: "a001", body: { text: "Bản đã sửa tay." } })).body;
  assert.equal(saved.summary.text, "Bản đã sửa tay.");
  assert.equal(saved.summary.by.personId, "a001");
  assert.equal(saved.summary.mock, true);
  assert.ok(saved.summary.at);
  assert.match(saved.history.at(-1).text, /lưu bản tóm tắt cho ban mới vào biên bản \(bản mẫu, chưa dùng AI thật\)/);

  // Đi hết các bước tới khi ban mới xác nhận: không lưu được nữa.
  const call = (m: string, p: string, as: string, body?: unknown) => srv.call(m, `${C}/handover${p}`, { as, body });
  await call("PUT", "/receiver", "a001", { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" });
  for (const a of ["kit-fanpage", "kit-drive", "kit-email", "kit-ngan-hang"]) await call("POST", `/accounts/${a}/transfer`, "a001", { holderId: "a017" });
  await call("POST", "/transfer-done", "a001");
  await call("POST", "/accept", "a017");
  assert.equal((await srv.call("PUT", H, { as: "a001", body: { text: "Muộn rồi" } })).status, 409);
});

test("trang chủ: việc cần làm, bàn giao, kho và thống kê tham gia", async () => {
  const d = (await srv.call("GET", `${C}/dashboard`, { as: "a001" })).body;
  assert.equal(d.tasks.open, 5);
  assert.equal(d.tasks.items.length, 4);
  assert.ok(d.tasks.items[0].due <= d.tasks.items[1].due || d.tasks.items[0].overdue, "quá hạn trước, rồi hạn gần nhất");
  assert.deepEqual(d.handover, { step: 4, toTerm: "Spring 2027", accepted: false });
  assert.deepEqual(d.kit, { documents: 5, processes: 3, accounts: 5, missing: 1 });
  assert.equal(d.participation.sessions, 3);
  assert.ok(d.participation.rate > 0 && d.participation.rate <= 100);
  assert.ok(Number.isInteger(d.participation.absentRuns));
});
