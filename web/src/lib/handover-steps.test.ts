// Chạy: npm test. Bàn giao 7 bước và việc cần làm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB } from "./seed.ts";
import { aiUsageOf, balance, can, isTaskOverdue, openTasks, participationStats, tasksOf } from "./selectors.ts";
import {
  acceptHandover, confirmPayment, countAiUse, createTask, finishHandoverTransfer, lockHandoverBalance, reviewHandoverKit, saveHandoverAccount, saveHandoverBoard, saveHandoverSummary,
  setHandoverStep, setTaskStatus, transferHandoverAccount, updateTask,
} from "./actions.ts";

const AT = "2026-10-22T10:00:00+07:00";
const handover = (s: ReturnType<typeof createSeed>) => s.handovers.find((h) => h.clubId === CLUB)!;

test("dữ liệu mẫu: bàn giao đang ở bước 4, đã có ban mới và số dư chốt", () => {
  const h = handover(createSeed());
  assert.equal(h.step, 4);
  assert.equal(h.newBoard?.president, "a017");
  assert.equal(h.lockedBalance, balance(createSeed(), CLUB));
  assert.equal(h.history.length, 3);
  assert.deepEqual(h.transferred, []);
});

test("đi hết 7 bước, mỗi bước ghi vào biên bản", () => {
  let s = createSeed();
  s = saveHandoverBoard(CLUB, { president: "a003", heads: [] }, "a001", AT)(s); // bước 1 → 2
  assert.equal(handover(s).step, 2);
  assert.equal(handover(s).newBoard?.president, "a003");
  s = lockHandoverBalance(CLUB, "a001", AT)(s); // 2 → 3
  assert.equal(handover(s).step, 3);
  s = reviewHandoverKit(CLUB, "a001", AT)(s); // 3 → 4
  assert.match(handover(s).history.at(-1)!.text, /5 biểu mẫu, 3 quy trình, 5 tài khoản, 1 mục thiếu/);
  s = saveHandoverAccount(CLUB, { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" }, "MB123", "a001", AT)(s); // 4 → 5
  assert.equal(handover(s).step, 5);
  assert.equal(handover(s).transferRef, "MB123");
  s = transferHandoverAccount(CLUB, "kit-email", "a003", "a001", AT)(s);
  s = finishHandoverTransfer(CLUB, "a001", AT)(s); // 5 → 6
  assert.equal(handover(s).step, 6);
  s = acceptHandover(CLUB, "a003", AT)(s); // 6 → 7
  const h = handover(s);
  assert.equal(h.step, 7);
  assert.equal(h.acceptedBy, "a003");
  assert.equal(h.acceptedAt, AT);
  assert.match(h.history.at(-1)!.text, /xác nhận đã nhận bàn giao/);
});

test("chốt số dư lấy số dư sổ quỹ lúc bấm, không sửa sổ quỹ", () => {
  let s = createSeed();
  s = setHandoverStep(CLUB, 2, "a001", AT)(s);
  const before = s.ledger.length;
  // Sổ quỹ thêm một khoản rồi mới chốt: số chốt là số mới.
  s = confirmPayment({ collectionId: "quy-fall-2026", personId: "a021", method: "cash", amount: 100_000, at: AT, by: "a002", ledgerId: "l-thu-them" })(s);
  s = lockHandoverBalance(CLUB, "a001", AT)(s);
  assert.equal(handover(s).lockedBalance, 3_220_000);
  assert.equal(handover(s).lockedAt, AT);
  assert.equal(s.ledger.length, before + 1);
});

test("chuyển quyền quản trị: người giữ đổi sang người nhận mới và mục được ghi là đã chuyển", () => {
  let s = createSeed();
  s = transferHandoverAccount(CLUB, "kit-fanpage", "a017", "a001", AT)(s);
  assert.equal(s.kitAccounts.find((a) => a.id === "kit-fanpage")!.holderId, "a017");
  assert.deepEqual(handover(s).transferred, ["kit-fanpage"]);
  s = transferHandoverAccount(CLUB, "kit-fanpage", "a017", "a001", AT)(s); // bấm lần hai không ghi trùng mã
  assert.deepEqual(handover(s).transferred, ["kit-fanpage"]);
});

test("quay lại bước trước ghi vào biên bản", () => {
  const s = setHandoverStep(CLUB, 3, "a001", AT)(createSeed());
  assert.equal(handover(s).step, 3);
  assert.equal(handover(s).history.at(-1)!.text, "quay lại bước 3");
});

test("việc cần làm: tạo, giao lại, đổi trạng thái đều lưu lịch sử", () => {
  let s = createSeed();
  s = createTask({ id: "viec-thu", clubId: CLUB, title: "Việc thử", assigneeId: "a005", due: "2026-10-30T23:59:00+07:00", createdBy: "a001", createdAt: AT })(s);
  const t = () => s.tasks.find((x) => x.id === "viec-thu")!;
  assert.equal(t().status, "todo");
  assert.equal(t().history.length, 1);
  s = updateTask("viec-thu", { title: "Việc thử", assigneeId: "a007", due: "2026-10-30T23:59:00+07:00" }, "a001", AT)(s);
  assert.equal(t().assigneeId, "a007");
  assert.match(t().history.at(-1)!.text, /giao lại cho Nguyễn Hải Đăng/);
  s = setTaskStatus("viec-thu", "done", "a007", AT)(s);
  assert.equal(t().status, "done");
  assert.equal(t().history.length, 3);
  const n = t().history.length;
  s = setTaskStatus("viec-thu", "done", "a007", AT)(s); // trạng thái không đổi thì không ghi thêm
  assert.equal(t().history.length, n);
});

test("việc quá hạn: chưa xong mà hạn đã qua; việc xong thì không", () => {
  const s = createSeed();
  const now = Date.parse("2026-10-22T08:00:00+07:00");
  const over = tasksOf(s, CLUB).filter((t) => isTaskOverdue(t, now)).map((t) => t.id);
  assert.deepEqual(over, ["viec-bao-cao", "viec-mua-nuoc", "viec-bai-tuyen"]);
  assert.equal(openTasks(s, CLUB).length, 5);
  assert.equal(s.tasks.length, 6);
});

test("quyền tạo việc: ban điều hành; thành viên thường không", () => {
  assert.deepEqual((["president", "vice", "treasurer", "head", "member"] as const).map((r) => can(r, "task")), [true, true, true, true, false]);
});

test("lưu bản tóm tắt vào biên bản: ghi ai lưu, lúc nào, bản mẫu hay không; không đổi bước", () => {
  const s0 = createSeed();
  const s = saveHandoverSummary(CLUB, "Bản tóm tắt đã sửa", true, "a001", AT)(s0);
  const h = handover(s);
  assert.deepEqual(h.summary, { text: "Bản tóm tắt đã sửa", by: "a001", at: AT, mock: true });
  assert.equal(h.step, handover(s0).step);
  assert.match(h.history.at(-1)!.text, /lưu bản tóm tắt cho ban mới vào biên bản \(bản mẫu, chưa dùng AI thật\)/);
});

test("đếm lượt dùng trợ lý theo CLB và học kỳ", () => {
  let s = createSeed();
  assert.deepEqual(aiUsageOf(s, CLUB, "Fall 2026"), { clubId: CLUB, term: "Fall 2026", asks: 0, summaries: 0 });
  s = countAiUse(CLUB, "Fall 2026", "asks")(s);
  s = countAiUse(CLUB, "Fall 2026", "asks")(s);
  s = countAiUse(CLUB, "Fall 2026", "summaries")(s);
  s = countAiUse(CLUB, "Spring 2027", "asks")(s);
  assert.equal(aiUsageOf(s, CLUB, "Fall 2026").asks, 2);
  assert.equal(aiUsageOf(s, CLUB, "Fall 2026").summaries, 1);
  assert.equal(aiUsageOf(s, CLUB, "Spring 2027").asks, 1);
  assert.equal(s.aiUsage.length, 2);
});

test("thống kê tham gia: đếm từ điểm danh các buổi đã đóng gần nhất", () => {
  const s = createSeed();
  const p = participationStats(s, CLUB);
  assert.equal(p.sessions, 3);
  assert.ok(p.rate !== undefined && p.rate > 50 && p.rate <= 100);
  assert.ok(Number.isInteger(p.absentRuns) && p.absentRuns >= 0);
  // CLB chưa có buổi nào đã đóng: không có tỉ lệ.
  assert.deepEqual(participationStats({ ...s, events: [] }, CLUB), { sessions: 0, rate: undefined, absentRuns: 0 });
});
