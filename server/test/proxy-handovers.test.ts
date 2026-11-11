// Chạy: npm test. Bàn giao hộ (09/11/2026): nhật ký liên hệ kèm ảnh, mentor duyệt, 3 ngày chờ, "Tôi vẫn đảm nhận", ảnh bằng chứng (quyền xem, xóa sau 30 ngày).

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { CLUB, NOW, startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });
beforeEach(() => { srv.store.reset(); srv.setNow(NOW); });

const C = `/clubs/${CLUB}`;
const MENTOR = "p-thu-trang";
const DAY = 86_400_000;
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const JPG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2w==";
type Item = { id: string; status: string; step: number; kind: string; waitUntil?: string; can: Record<string, boolean>; contacts?: { evidenceCount: number; evidence?: { id: string }[] }[] };
const list = async (as: string) => (await srv.call("GET", `${C}/role-handovers`, { as })).body as { items: Item[]; proxyable: { role: string; department?: string; holder: { personId: string } }[] };
const upload = async (as: string, mime = "image/png", dataBase64 = PNG) => srv.call("POST", `${C}/evidence`, { as, body: { name: "chup-man-hinh.png", mime, dataBase64 } });
const contacts = (ids: string[]) => [
  { date: "2026-09-28", channel: "phone", result: "Không nghe máy", evidenceIds: ids.slice(0, 1) },
  { date: "2026-09-30", channel: "zalo", result: "Đã xem, không trả lời", evidenceIds: ids.slice(1) },
  { date: "2026-10-02", channel: "email", result: "Không phản hồi", evidenceIds: [] },
];
/** Chủ nhiệm gửi yêu cầu bàn giao hộ vai thủ quỹ (a002) cho a006, kèm 2 ảnh. */
async function sendProxy(over: { as?: string; role?: string; toId?: string; department?: string } = {}) {
  const as = over.as ?? "a001";
  const ids = [(await upload(as)).body.id, (await upload(as)).body.id];
  return srv.call("POST", `${C}/role-handovers`, { as, body: { role: over.role ?? "treasurer", toId: over.toId ?? "a006", reason: "Không liên lạc được", department: over.department, proxy: { contacts: contacts(ids) } } });
}
const roleOf = async (id: string, as = "a001") => ((await srv.call("GET", `${C}/members`, { as })).body.members as { personId: string; role: string }[]).find((m) => m.personId === id)!.role;

test("tải ảnh: chỉ JPG hoặc PNG thật, tối đa 5 MB, chỉ ban điều hành, tối đa 10 ảnh chưa dùng", async () => {
  assert.equal((await upload("a001")).status, 201);
  assert.equal((await upload("a001", "image/jpeg", JPG)).status, 201);
  assert.equal((await upload("a006")).status, 403); // thành viên thường
  assert.equal((await upload("a001", "image/png", JPG)).status, 400); // loại file khai sai
  assert.equal((await upload("a001", "image/png", Buffer.from("khong phai anh").toString("base64"))).status, 400);
  assert.equal((await upload("a001", "image/png", "@@@")).status, 400);
  const big = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(5 * 1024 * 1024)]).toString("base64");
  assert.equal((await upload("a001", "image/png", big)).status, 400);
  for (let i = 0; i < 8; i++) assert.equal((await upload("a001")).status, 201);
  assert.equal((await upload("a001")).status, 400); // đã đủ 10 ảnh chưa gắn
});

test("gửi yêu cầu bàn giao hộ: thiếu liên hệ hoặc ảnh, sai người gửi thì bị chặn; người giữ vai chưa bị báo", async () => {
  const id = (await upload("a001")).body.id;
  const post = (as: string, proxy: object, extra: object = {}) => srv.call("POST", `${C}/role-handovers`, { as, body: { role: "treasurer", toId: "a006", reason: "x", proxy, ...extra } });
  assert.equal((await post("a001", { contacts: contacts([id]).slice(0, 2) })).status, 400); // ít hơn 3 lần
  assert.equal((await post("a001", { contacts: contacts([]) })).status, 400); // không có ảnh
  assert.equal((await post("a006", { contacts: contacts([id]) })).status, 400); // thành viên thường không gửi được
  assert.equal((await post("a001", { contacts: contacts(["anh-khong-co"]) })).status, 400);
  assert.equal((await post("a001", { contacts: [{ date: "2026-12-31", channel: "phone", result: "x", evidenceIds: [id] }, ...contacts([]).slice(1)] })).status, 400); // ngày tương lai
  const ok = await post("a001", { contacts: contacts([id]) });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.equal(ok.body.items[0].kind, "proxy");
  assert.equal(ok.body.items[0].status, "requested");
  const notes = (await srv.call("GET", "/me/notifications", { as: "a002" })).body.items as { kind: string }[];
  assert.equal(notes.some((n) => n.kind.startsWith("role-handover")), false); // chưa báo người giữ vai
  assert.equal(((await srv.call("GET", "/me/notifications", { as: MENTOR })).body.items as { kind: string }[]).some((n) => n.kind === "role-handover-request"), true);
  assert.equal((await post("a001", { contacts: contacts([id]) })).status, 400); // ảnh đã gắn, và vai đã có đơn
});

test("mentor duyệt bằng chứng: người giữ vai nhận thông báo, chờ 3 ngày, không làm tiếp được trước hạn", async () => {
  const id = (await sendProxy()).body.items[0].id as string;
  const dec = (as: string, body: object) => srv.call("POST", `${C}/role-handovers/${id}/decision`, { as, body });
  assert.equal((await dec("a001", { approve: true })).status, 403); // chủ nhiệm (người gửi) không tự duyệt bằng chứng
  assert.equal((await dec("a003", { approve: true })).status, 403); // CLB có mentor: phó chủ nhiệm không duyệt
  assert.equal((await dec(MENTOR, { approve: false })).status, 400); // từ chối phải có lý do
  const ok = await dec(MENTOR, { approve: true });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const h = ok.body.items[0] as Item;
  assert.equal(h.status, "waiting");
  assert.equal(h.waitUntil, "2026-10-06T07:40:00+07:00");
  assert.equal(((await srv.call("GET", "/me/notifications", { as: "a002" })).body.items as { kind: string }[]).some((n) => n.kind === "role-handover-proxy"), true);
  const step = await srv.call("POST", `${C}/role-handovers/${id}/step`, { as: "a001", body: { action: "lockBalance" } });
  assert.equal(step.status, 409); // chưa hết 3 ngày
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/keep`, { as: "a001" })).status, 403); // chỉ người giữ vai
});

test('"Tôi vẫn đảm nhận": hủy yêu cầu, vai giữ nguyên, 7 ngày không gửi lại; mentor quyết lại sau 7 ngày', async () => {
  const id = (await sendProxy()).body.items[0].id as string;
  await srv.call("POST", `${C}/role-handovers/${id}/decision`, { as: MENTOR, body: { approve: true } });
  const keep = await srv.call("POST", `${C}/role-handovers/${id}/keep`, { as: "a002" });
  assert.equal(keep.status, 200, JSON.stringify(keep.body));
  assert.equal(keep.body.items[0].status, "kept");
  assert.equal(await roleOf("a002"), "treasurer");
  assert.equal((await sendProxy()).status, 400); // trong 7 ngày
  srv.setNow(NOW + 8 * DAY);
  const again = await sendProxy();
  assert.equal(again.status, 201, JSON.stringify(again.body));
});

test("im lặng hết 3 ngày: người gửi làm các bước thay, người nhận xác nhận thì đổi vai", async () => {
  const id = (await sendProxy()).body.items[0].id as string;
  await srv.call("POST", `${C}/role-handovers/${id}/decision`, { as: MENTOR, body: { approve: true } });
  srv.setNow(NOW + 3 * DAY + 60_000);
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/keep`, { as: "a002" })).status, 409); // hết hạn rồi
  const step = (as: string, body: object) => srv.call("POST", `${C}/role-handovers/${id}/step`, { as, body });
  assert.equal((await step("a002", { action: "lockBalance" })).status, 403); // người giữ vai không làm thay được
  assert.equal((await step("a001", { action: "lockBalance" })).status, 200);
  await step("a001", { action: "reviewKit" });
  await step("a001", { action: "setReceiver", bank: "[Ngân hàng thử]", account: "0123456789" });
  assert.equal((await step("a001", { action: "transferAccount", accountId: "kit-ngan-hang" })).status, 200);
  assert.equal((await step("a001", { action: "finishTransfer" })).body.items[0].step, 6);
  assert.equal((await step("a006", { action: "accept" })).status, 200);
  assert.equal(await roleOf("a006"), "treasurer");
  assert.equal(await roleOf("a002"), "member");
});

test("vai chủ nhiệm: phó chủ nhiệm gửi, chỉ mentor duyệt và thực hiện", async () => {
  const sent = await sendProxy({ as: "a003", role: "president", toId: "a017" });
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const id = sent.body.items[0].id as string;
  assert.equal((await list("a003")).proxyable.some((p) => p.role === "president"), true);
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/decision`, { as: "a003", body: { approve: true } })).status, 403);
  await srv.call("POST", `${C}/role-handovers/${id}/decision`, { as: MENTOR, body: { approve: true } });
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/execute`, { as: MENTOR })).status, 409); // còn chờ 3 ngày
  srv.setNow(NOW + 3 * DAY + 60_000);
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/execute`, { as: "a003" })).status, 403); // chỉ mentor
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/step`, { as: "a003", body: { action: "reviewKit" } })).status, 403);
  const done = await srv.call("POST", `${C}/role-handovers/${id}/execute`, { as: MENTOR });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(done.body.items[0].step, 6);
  assert.equal((await srv.call("POST", `${C}/role-handovers/${id}/step`, { as: "a017", body: { action: "accept" } })).status, 200);
  assert.equal(await roleOf("a017", "a017"), "president");
  assert.equal(await roleOf("a001", "a017"), "member");
});

test("CLB chưa có mentor: thủ quỹ bị chặn; vai khác do phó chủ nhiệm duyệt", async () => {
  srv.store.update((s) => ({ ...s, clubs: s.clubs.map((c) => ({ ...c, mentor: undefined })) }));
  assert.equal((await sendProxy()).status, 400); // thủ quỹ cần mentor
  const sent = await sendProxy({ role: "head", department: "Hậu cần", toId: "a006" });
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const id = sent.body.items[0].id as string;
  const dec = (as: string, body: object) => srv.call("POST", `${C}/role-handovers/${id}/decision`, { as, body });
  assert.equal((await dec("a001", { approve: true })).status, 403);
  assert.equal((await dec("a005", { approve: true })).status, 403); // người giữ vai
  assert.equal((await dec("a003", { approve: true })).body.items[0].status, "waiting");
});

test("ảnh bằng chứng: chỉ người gửi và mentor xem; người giữ vai chỉ thấy số ảnh; xóa sau 30 ngày, nhật ký chữ còn", async () => {
  const sent = await sendProxy();
  const item = sent.body.items[0] as Item;
  const photoId = item.contacts![0].evidence![0].id;
  assert.equal(item.contacts![0].evidenceCount, 1);
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a001" })).body.dataBase64, PNG);
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: MENTOR })).status, 200);
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a002" })).status, 404); // người giữ vai
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a003" })).status, 404); // ban điều hành khác
  await srv.call("POST", `${C}/role-handovers/${item.id}/decision`, { as: MENTOR, body: { approve: true } });
  const asHolder = (await list("a002")).items[0];
  assert.equal(asHolder.contacts![0].evidenceCount, 1);
  assert.equal(asHolder.contacts![0].evidence, undefined); // không thấy ảnh, chỉ thấy nhật ký chữ
  assert.equal(asHolder.can.keep, true);
  // Mentor chỉ thấy đơn bàn giao hộ.
  assert.equal((await list(MENTOR)).items.every((x) => x.kind === "proxy"), true);
  srv.setNow(NOW + 31 * DAY);
  const after = (await list("a001")).items[0];
  assert.equal(after.contacts![0].evidence!.length, 0); // ảnh đã xóa
  assert.equal(after.contacts![0].evidenceCount, 1); // nhật ký chữ giữ lại
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a001" })).status, 404);
});

test("mọi người trong ban điều hành gửi được cho mọi vai khác, trừ vai của chính mình", async () => {
  const roles = async (as: string) => (await list(as)).proxyable.map((p) => `${p.role}${p.department ? ":" + p.department : ""}`);
  const all = ["president", "vice", "treasurer", "head:Chuyên môn", "head:Hậu cần", "head:Truyền thông"];
  assert.deepEqual(await roles("a001"), all.filter((x) => x !== "president"));
  assert.deepEqual(await roles("a003"), all.filter((x) => x !== "vice"));
  assert.deepEqual(await roles("a002"), all.filter((x) => x !== "treasurer"));
  assert.deepEqual(await roles("a005"), all.filter((x) => x !== "head:Hậu cần"));
  assert.deepEqual(await roles("a006"), []); // thành viên thường không có
  const sent = await sendProxy({ as: "a002", role: "vice", toId: "a006" }); // thủ quỹ gửi cho phó chủ nhiệm
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  assert.equal(sent.body.items[0].kind, "proxy");
  const sent2 = await sendProxy({ as: "a005", role: "treasurer", toId: "a017" }); // trưởng ban gửi cho thủ quỹ
  assert.equal(sent2.status, 201, JSON.stringify(sent2.body));
  assert.equal((await srv.call("POST", `${C}/role-handovers/${sent2.body.items[0].id}/decision`, { as: MENTOR, body: { approve: true } })).status, 200);
  assert.equal((await srv.call("POST", `${C}/role-handovers/${sent.body.items[0].id}/decision`, { as: "a003", body: { approve: true } })).status, 403); // CLB có mentor: phó chủ nhiệm không duyệt
});

test("CLB chưa có mentor: phó chủ nhiệm duyệt thay phải xem được ảnh bằng chứng; người khác trong ban thì không", async () => {
  srv.store.update((st) => ({ ...st, clubs: st.clubs.map((c) => ({ ...c, mentor: undefined })) }));
  const sent = await sendProxy({ role: "head", department: "Hậu cần", toId: "a006" }); // chủ nhiệm gửi cho trưởng ban Hậu cần (a005)
  assert.equal(sent.status, 201, JSON.stringify(sent.body));
  const item = (await list("a003")).items[0];
  assert.equal(item.can.decide, true);
  const photoId = item.contacts![0].evidence![0].id;
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a003" })).status, 200); // phó chủ nhiệm duyệt thay: xem được
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a002" })).status, 404); // thủ quỹ: không
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a005" })).status, 404); // người giữ vai: không
  // Duyệt xong và hết thời gian chờ thì phó chủ nhiệm không còn xem được ảnh.
  await srv.call("POST", `${C}/role-handovers/${item.id}/decision`, { as: "a003", body: { approve: true } });
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a003" })).status, 200); // còn trong 3 ngày chờ
  srv.setNow(NOW + 3 * DAY + 60_000);
  assert.equal((await srv.call("GET", `${C}/evidence/${photoId}`, { as: "a003" })).status, 404);
});

test("gỡ ảnh chưa gắn vào yêu cầu; ảnh đã gắn thì không gỡ được; người khác không gỡ được", async () => {
  const id = (await upload("a001")).body.id as string;
  assert.equal((await srv.call("DELETE", `${C}/evidence/${id}`, { as: "a003" })).status, 404); // ảnh của người khác
  assert.equal((await srv.call("DELETE", `${C}/evidence/${id}`, { as: "a001" })).status, 200);
  assert.equal((await srv.call("GET", `${C}/evidence/${id}`, { as: "a001" })).status, 404);
  assert.equal((await srv.call("DELETE", `${C}/evidence/${id}`, { as: "a001" })).status, 404);
  const sent = await sendProxy();
  const attached = (sent.body.items[0] as Item).contacts![0].evidence![0].id;
  assert.equal((await srv.call("DELETE", `${C}/evidence/${attached}`, { as: "a001" })).status, 409);
});

test("menu Bàn giao: đếm số đơn đang chờ chính người đó làm", async () => {
  const count = async (as: string) => (await srv.call("GET", `${C}/board`, { as })).body.counts.roleHandovers as number;
  assert.equal(await count("a001"), 0);
  const id = (await srv.call("POST", `${C}/role-handovers`, { as: "a002", body: { role: "treasurer", toId: "a006", reason: "Sắp tốt nghiệp" } })).body.items[0].id as string;
  assert.equal(await count("a001"), 1); // chủ nhiệm cần duyệt
  assert.equal(await count("a002"), 0); // người gửi chưa có gì để làm
  await srv.call("POST", `${C}/role-handovers/${id}/decision`, { as: "a001", body: { approve: true } });
  assert.equal(await count("a001"), 0);
  assert.equal(await count("a002"), 1); // người giao có bước 2 để làm
});
