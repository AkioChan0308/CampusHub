// Chạy: npm test. Kho bàn giao: tóm tắt, thêm, sửa, xóa biểu mẫu, quy trình, tài khoản.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB } from "./seed.ts";
import { can, kitSummary } from "./selectors.ts";
import { removeKitAccount, removeKitDocument, removeKitProcess, saveKitAccount, saveKitDocument, saveKitProcess } from "./actions.ts";

test("dữ liệu mẫu: 5 biểu mẫu, 3 quy trình, 5 tài khoản, 1 mục thiếu", () => {
  assert.deepEqual(kitSummary(createSeed(), CLUB), { documents: 5, processes: 3, accounts: 5, missing: 1, personal: 3 });
});

test("dữ liệu mẫu không có mật khẩu và mọi người giữ đều là thành viên", () => {
  const s = createSeed();
  const holders = [...s.kitDocuments.map((d) => d.holderId), ...s.kitAccounts.map((a) => a.holderId).filter(Boolean)];
  for (const id of holders) assert.ok(s.memberships.some((m) => m.clubId === CLUB && m.personId === id), `${id} không ở CLB`);
  assert.ok(!JSON.stringify([s.kitDocuments, s.kitProcesses, s.kitAccounts]).toLowerCase().includes("mật khẩu"));
});

test("điền người giữ cho tài khoản bắt buộc thì hết thiếu", () => {
  let s = createSeed();
  const email = s.kitAccounts.find((a) => a.id === "kit-email")!;
  s = saveKitAccount({ ...email, holderId: "a003" })(s);
  assert.equal(kitSummary(s, CLUB).missing, 0);
  assert.equal(s.kitAccounts.length, 5); // sửa, không thêm
});

test("thêm mới tăng số lượng; xóa giảm", () => {
  let s = createSeed();
  s = saveKitDocument({ id: "kit-moi", clubId: CLUB, name: "Mẫu mới", category: "other", link: "https://example.com/moi", holderId: "a001", updatedAt: "2026-10-22T09:00:00+07:00" })(s);
  s = saveKitAccount({ id: "kit-tiktok", clubId: CLUB, service: "TikTok", label: "tài khoản mẫu", ownership: "personal", required: true, updatedAt: "2026-10-22T09:00:00+07:00" })(s);
  assert.deepEqual(kitSummary(s, CLUB), { documents: 6, processes: 3, accounts: 6, missing: 2, personal: 4 });
  s = removeKitAccount("kit-tiktok")(s);
  s = removeKitProcess("kit-xin-phong")(s);
  assert.deepEqual(kitSummary(s, CLUB), { documents: 6, processes: 2, accounts: 5, missing: 1, personal: 3 });
});

test("xóa một biểu mẫu thì gỡ nó khỏi quy trình đang dùng", () => {
  const s = removeKitDocument("kit-mau-xin-phep")(createSeed());
  assert.ok(!s.kitDocuments.some((d) => d.id === "kit-mau-xin-phep"));
  assert.deepEqual(s.kitProcesses.find((p) => p.id === "kit-xin-phep-su-kien")!.documentIds, ["kit-de-xuat-chi"]);
});

test("sửa quy trình giữ nguyên thứ tự bước", () => {
  const s0 = createSeed();
  const p = s0.kitProcesses.find((x) => x.id === "kit-bao-cao-ky")!;
  const s = saveKitProcess({ ...p, steps: [...p.steps].reverse() })(s0);
  assert.equal(s.kitProcesses.find((x) => x.id === "kit-bao-cao-ky")!.steps[0].text, p.steps[2].text);
});

test("quyền sửa kho: chủ nhiệm, phó chủ nhiệm, trưởng ban; thủ quỹ và thành viên chỉ xem", () => {
  assert.deepEqual((["president", "vice", "head", "treasurer", "member"] as const).map((r) => can(r, "kit")), [true, true, true, false, false]);
});
