// Chạy: npm test. Kiểm tra hợp đồng API: tài liệu khớp code, mọi API đều đòi đăng nhập, lỗi trả về đúng một dạng.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { ENDPOINTS } from "../src/contract.ts";
import { startServer, type TestServer } from "./helpers.ts";

let srv: TestServer;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });

const doc = readFileSync(new URL("../../docs/api.md", import.meta.url), "utf8");

test("mọi API trong contract.ts đều có trong docs/api.md, và ngược lại", () => {
  const inContract = Object.values(ENDPOINTS).map((e) => `${e.method} ${e.path}`);
  for (const line of inContract) assert.ok(doc.includes("`" + line + "`"), `docs/api.md thiếu \`${line}\``);
  const inDoc = [...doc.matchAll(/`(GET|POST|PUT|PATCH|DELETE) (\/[^`\s]*)`/g)].map((m) => `${m[1]} ${m[2]}`);
  for (const line of inDoc) assert.ok(inContract.includes(line), `docs/api.md có \`${line}\` nhưng contract.ts không có`);
});

test("mọi API cần đăng nhập đều trả 401 khi thiếu đăng nhập", async () => {
  for (const [id, e] of Object.entries(ENDPOINTS)) {
    if (e.auth !== "user") continue;
    const path = e.path.replace(/:[a-zA-Z]+/g, "x");
    const r = await srv.call(e.method, path);
    assert.equal(r.status, 401, `${id} (${e.method} ${path}) trả ${r.status}`);
    assert.equal(r.body.error.code, "UNAUTHENTICATED");
  }
});

test("người dùng không có trong dữ liệu mẫu bị từ chối", async () => {
  const r = await srv.call("GET", "/me", { as: "khong-co-ai" });
  assert.equal(r.status, 401);
});

test("API lạ, JSON hỏng: lỗi trả về cùng một dạng { error: { code, message } }", async () => {
  const unknownPath = await srv.call("GET", "/khong-co-api-nay", { as: "a001" });
  assert.equal(unknownPath.status, 404);
  assert.equal(unknownPath.body.error.code, "NOT_FOUND");
  const badJson = await srv.call("POST", "/checkin", { as: "a017", raw: "{khong-phai-json" });
  assert.equal(badJson.status, 400);
  assert.equal(badJson.body.error.code, "VALIDATION");
  assert.equal(typeof badJson.body.error.message, "string");
});

test("dữ liệu gửi lên sai: báo lỗi bằng tiếng Việt", async () => {
  const r = await srv.call("POST", "/checkin", { as: "a017", body: { eventId: "tuan-5" } });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, "VALIDATION");
  assert.ok(Array.isArray(r.body.error.details.issues));
  assert.match(r.body.error.message, /[ạảãáàâấầẩẫậăắằẳẵặđêếềểễệôốồổỗộơớờởỡợưứừửữự]/i, r.body.error.message);
});

test("web ở WEB_ORIGIN gọi được API từ trình duyệt (CORS)", async () => {
  const res = await fetch(`${srv.base}/me`, { method: "OPTIONS", headers: { Origin: "http://localhost:3000", "Access-Control-Request-Headers": "x-demo-user" } });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:3000");
  const otherSite = await fetch(`${srv.base}/me`, { method: "OPTIONS", headers: { Origin: "http://trang-la.example" } });
  assert.equal(otherSite.headers.get("access-control-allow-origin"), null);
});

test("health và đặt lại dữ liệu mẫu không cần đăng nhập", async () => {
  assert.deepEqual((await srv.call("GET", "/health")).body, { ok: true, authMode: "demo", googleLogin: false });
  assert.deepEqual((await srv.call("POST", "/demo/reset")).body, { ok: true });
});
