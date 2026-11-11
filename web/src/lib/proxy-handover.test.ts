// Chạy: npm test. Bàn giao hộ (09/11/2026): nhật ký 3 lần liên hệ kèm ảnh, mentor duyệt, chờ 3 ngày, "Tôi vẫn đảm nhận", ảnh xóa sau 30 ngày.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed, DEMO_CLUB_ID as CLUB } from "./seed.ts";

/** Dữ liệu mẫu có sẵn một kịch bản bàn giao hộ; các test ở đây cần dữ liệu không có đơn nào. */
const cleanSeed = () => ({ ...createSeed(), roleHandovers: [], evidence: [], notifications: [] });
import {
  acceptRoleHandover, addEvidence, decideProxyRoleHandover, executeProxyRoleHandover, keepRoleHandover, lockRoleHandoverBalance, proxyRequestBlock,
  purgeExpiredEvidence, requestProxyRoleHandover, reviewRoleHandoverKit, roleHandoverActor, startProxyRoleHandover,
} from "./actions.ts";
import type { AppState, ContactAttempt, EvidenceFile } from "./types.ts";

const NOW = Date.parse("2026-11-09T10:00:00+07:00");
const AT = "2026-11-09T10:00:00+07:00";
const DAY = 86_400_000;
const get = (s: AppState, id: string) => s.roleHandovers.find((h) => h.id === id)!;
const roleOf = (s: AppState, id: string) => s.memberships.find((m) => m.clubId === CLUB && m.personId === id)!.role;
const photo = (id: string, by: string, at = AT): EvidenceFile => ({ id, clubId: CLUB, uploaderId: by, name: `${id}.png`, mime: "image/png", size: 10, uploadedAt: at, data: "AAAA" });
const contacts = (ids: string[]): ContactAttempt[] => [
  { date: "2026-11-01", channel: "phone", result: "Không nghe máy", evidenceIds: ids.slice(0, 1) },
  { date: "2026-11-03", channel: "zalo", result: "Đã xem, không trả lời", evidenceIds: ids.slice(1) },
  { date: "2026-11-06", channel: "email", result: "Không phản hồi", evidenceIds: [] },
];
const withPhotos = (by: string) => addEvidence(photo("e1", by))(addEvidence(photo("e2", by))(cleanSeed()));
const input = { role: "treasurer" as const, toId: "a006", contacts: contacts(["e1", "e2"]) };

test("gửi yêu cầu: mọi người trong ban điều hành cho mọi vai khác mình, đủ 3 lần liên hệ, có ảnh, ngày không ở tương lai", () => {
  const s = withPhotos("a001");
  assert.equal(proxyRequestBlock(s, CLUB, "a001", NOW, input), undefined);
  assert.match(proxyRequestBlock(s, CLUB, "a006", NOW, input)!, /Chỉ ban điều hành/); // thành viên thường không gửi được
  assert.match(proxyRequestBlock(s, CLUB, "a002", NOW, { ...input, role: "treasurer" })!, /hãy tự bàn giao/); // người giữ vai không gửi cho chính mình
  // Mọi người trong ban điều hành gửi được cho mọi vai khác: phó chủ nhiệm cho thủ quỹ, trưởng ban cho phó chủ nhiệm, thủ quỹ cho trưởng ban.
  for (const [by, role, department] of [["a003", "treasurer", undefined], ["a005", "vice", undefined], ["a002", "head", "Hậu cần"]] as const) {
    const mine = addEvidence(photo("e1", by))(addEvidence(photo("e2", by))(cleanSeed()));
    assert.equal(proxyRequestBlock(mine, CLUB, by, NOW, { role, department, toId: "a006", contacts: contacts(["e1", "e2"]) }), undefined, `${by} -> ${role}`);
  }
  assert.match(proxyRequestBlock(s, CLUB, "a001", NOW, { ...input, contacts: contacts(["e1", "e2"]).slice(0, 2) })!, /tối thiểu 3/);
  assert.match(proxyRequestBlock(s, CLUB, "a001", NOW, { ...input, contacts: contacts([]) })!, /ít nhất một ảnh/);
  assert.match(proxyRequestBlock(s, CLUB, "a001", NOW, { ...input, contacts: contacts(["e1", "e1"]) })!, /một lần/);
  assert.match(proxyRequestBlock(s, CLUB, "a001", NOW, { ...input, contacts: [{ ...contacts(["e1"])[0], date: "2026-11-20" }, ...contacts(["e1"]).slice(1)] })!, /tương lai/);
  assert.match(proxyRequestBlock(s, CLUB, "a001", NOW, { ...input, contacts: [{ ...contacts(["e1"])[0], result: " " }, ...contacts([]).slice(1)] })!, /kết quả/);
  assert.match(proxyRequestBlock(withPhotos("a003"), CLUB, "a001", NOW, input)!, /ảnh không dùng được/); // ảnh của người khác
  // Vai chủ nhiệm: người giữ vai không gửi được cho chính mình; phó chủ nhiệm gửi được (chỉ mentor quyết).
  const p = addEvidence(photo("e1", "a003"))(addEvidence(photo("e2", "a003"))(cleanSeed()));
  assert.equal(proxyRequestBlock(p, CLUB, "a003", NOW, { role: "president", toId: "a017", contacts: contacts(["e1", "e2"]) }), undefined);
  assert.match(proxyRequestBlock(p, CLUB, "a001", NOW, { role: "president", toId: "a017", contacts: contacts(["e1", "e2"]) })!, /đang giữ vai này/);
  assert.match(proxyRequestBlock(p, CLUB, "a006", NOW, { role: "president", toId: "a017", contacts: contacts(["e1", "e2"]) })!, /ban điều hành/); // thành viên thường không gửi
});

test("CLB chưa có mentor: thủ quỹ và chủ nhiệm không bàn giao hộ được; vai khác do phó chủ nhiệm duyệt", () => {
  const s0 = withPhotos("a001");
  const s = { ...s0, clubs: s0.clubs.map((c) => ({ ...c, mentor: undefined })) };
  assert.match(proxyRequestBlock(s, CLUB, "a001", NOW, input)!, /mentor/);
  assert.equal(proxyRequestBlock(s, CLUB, "a001", NOW, { role: "head", department: "Hậu cần", toId: "a006", contacts: contacts(["e1", "e2"]) }), undefined);
  const noVice = { ...s, memberships: s.memberships.map((m) => (m.personId === "a003" ? { ...m, role: "member" as const } : m)) };
  assert.match(proxyRequestBlock(noVice, CLUB, "a001", NOW, { role: "head", department: "Hậu cần", toId: "a006", contacts: contacts(["e1", "e2"]) })!, /chưa có mentor/);
});

test("gửi yêu cầu: ảnh gắn vào yêu cầu, người giữ vai CHƯA được báo, cán bộ trường nhận thông báo", () => {
  let s = requestProxyRoleHandover({ id: "bh1", clubId: CLUB, role: "treasurer", fromId: "a002", toId: "a006", reason: "Mất liên lạc", requesterId: "a001", contacts: contacts(["e1", "e2"]) }, AT)(withPhotos("a001"));
  const h = get(s, "bh1");
  assert.equal(h.status, "requested");
  assert.equal(h.proxy!.requesterId, "a001");
  assert.equal(roleHandoverActor(h), "a001");
  assert.equal(s.evidence.every((e) => e.handoverId === "bh1"), true);
  assert.equal(s.notifications.some((n) => n.personId === "a002"), false);
  assert.equal(s.notifications.some((n) => n.personId === "p-thu-trang" && n.kind === "role-handover-request"), true);
  s = decideProxyRoleHandover("bh1", false, "Ảnh chưa rõ", "p-thu-trang", AT)(s);
  assert.equal(get(s, "bh1").status, "rejected");
  assert.equal(s.notifications.some((n) => n.personId === "a001" && n.kind === "role-handover-decision"), true);
  assert.equal(s.notifications.some((n) => n.personId === "a002"), false); // bị từ chối thì người giữ vai không bị báo nhầm
});

test("duyệt bằng chứng: báo người giữ vai, chờ 3 ngày; hết hạn thì người gửi làm các bước, người nhận xác nhận", () => {
  let s = requestProxyRoleHandover({ id: "bh1", clubId: CLUB, role: "treasurer", fromId: "a002", toId: "a006", reason: "Mất liên lạc", requesterId: "a001", contacts: contacts(["e1", "e2"]) }, AT)(withPhotos("a001"));
  s = decideProxyRoleHandover("bh1", true, undefined, "p-thu-trang", AT)(s);
  const h = get(s, "bh1");
  assert.equal(h.status, "waiting");
  assert.equal(h.proxy!.waitUntil, "2026-11-12T10:00:00+07:00");
  assert.equal(s.notifications.some((n) => n.personId === "a002" && n.kind === "role-handover-proxy"), true);
  s = startProxyRoleHandover("bh1", "2026-11-12T10:00:01+07:00")(s);
  assert.equal(get(s, "bh1").status, "active");
  assert.equal(get(s, "bh1").step, 2);
  s = lockRoleHandoverBalance("bh1", "a001", AT)(s);
  assert.equal(get(s, "bh1").step, 3);
  s = acceptRoleHandover("bh1", "a006", AT)(s);
  assert.equal(roleOf(s, "a006"), "treasurer");
  assert.equal(roleOf(s, "a002"), "member");
});

test('"Tôi vẫn đảm nhận": hủy yêu cầu, vai giữ nguyên, 7 ngày không gửi lại cùng vai', () => {
  let s = requestProxyRoleHandover({ id: "bh1", clubId: CLUB, role: "treasurer", fromId: "a002", toId: "a006", reason: "Mất liên lạc", requesterId: "a001", contacts: contacts(["e1", "e2"]) }, AT)(withPhotos("a001"));
  s = decideProxyRoleHandover("bh1", true, undefined, "p-thu-trang", AT)(s);
  s = keepRoleHandover("bh1", "a002", "2026-11-10T08:00:00+07:00")(s);
  assert.equal(get(s, "bh1").status, "kept");
  assert.equal(roleOf(s, "a002"), "treasurer");
  s = addEvidence(photo("e3", "a001", "2026-11-12T08:00:00+07:00"))(addEvidence(photo("e4", "a001", "2026-11-12T08:00:00+07:00"))(s));
  const again = { ...input, contacts: contacts(["e3", "e4"]) };
  assert.match(proxyRequestBlock(s, CLUB, "a001", Date.parse("2026-11-12T10:00:00+07:00"), again)!, /Tôi vẫn đảm nhận/);
  assert.equal(proxyRequestBlock(s, CLUB, "a001", Date.parse("2026-11-18T10:00:00+07:00"), again), undefined);
});

test("vai chủ nhiệm: mentor thực hiện thay, chuyển quyền quản trị mọi tài khoản của người giữ vai rồi chờ người nhận xác nhận", () => {
  let s = requestProxyRoleHandover({ id: "bh1", clubId: CLUB, role: "president", fromId: "a001", toId: "a017", reason: "Mất liên lạc", requesterId: "a003", contacts: contacts(["e1", "e2"]) }, AT)(withPhotos("a003"));
  s = decideProxyRoleHandover("bh1", true, undefined, "p-thu-trang", AT)(s);
  s = startProxyRoleHandover("bh1", "2026-11-12T10:00:01+07:00")(s);
  s = executeProxyRoleHandover("bh1", "p-thu-trang", "2026-11-12T10:05:00+07:00")(s);
  assert.equal(get(s, "bh1").step, 6);
  assert.equal(s.kitAccounts.filter((a) => a.id === "kit-fanpage" || a.id === "kit-drive").every((a) => a.holderId === "a017"), true);
  assert.equal(s.notifications.some((n) => n.personId === "a017" && n.kind === "role-handover-accept"), true);
  s = acceptRoleHandover("bh1", "a017", AT)(s);
  assert.equal(roleOf(s, "a017"), "president");
  assert.equal(roleOf(s, "a001"), "member");
});

test("ảnh bằng chứng bị xóa sau 30 ngày; nhật ký chữ của yêu cầu giữ lại", () => {
  let s = requestProxyRoleHandover({ id: "bh1", clubId: CLUB, role: "treasurer", fromId: "a002", toId: "a006", reason: "Mất liên lạc", requesterId: "a001", contacts: contacts(["e1", "e2"]) }, AT)(withPhotos("a001"));
  assert.equal(purgeExpiredEvidence(s, NOW + 29 * DAY), s);
  s = purgeExpiredEvidence(s, NOW + 31 * DAY);
  assert.equal(s.evidence.length, 0);
  assert.equal(get(s, "bh1").proxy!.contacts.length, 3);
  assert.equal(get(s, "bh1").proxy!.contacts[0].result, "Không nghe máy");
  void reviewRoleHandoverKit;
});
