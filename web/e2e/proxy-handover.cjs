// Bàn giao hộ (09/11/2026): chủ nhiệm gửi yêu cầu kèm nhật ký liên hệ và ảnh, mentor duyệt bằng chứng, người giữ vai bấm "Tôi vẫn đảm nhận".
// Chạy trong web/: node e2e/proxy-handover.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ).
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("proxy-handover");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const ROLES = `${BASE}/clubs/cau-long-san-nha/handover/roles`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

(async () => {
  const browser = await launch();
  const errs = [];
  async function as(personId, size) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    p.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/status of (401|403|404|409|400)|favicon|React DevTools|HMR|Reduced Motion/.test(m.text() + JSON.stringify(m.location()))) errs.push(`${p.url()} :: ${m.text().slice(0, 240)}`); });
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name), fullPage: true });
  await fetch(`${BASE}/api/v1/demo/reset?clean=1`, { method: "POST" });

  // ---- Chủ nhiệm gửi yêu cầu bàn giao hộ vai thủ quỹ ----
  const c = await as("a001", LAPTOP);
  await c.goto(ROLES);
  ok(await waitText(c, /Người giữ vai không liên lạc được\?/) && (await c.locator("#proxy-pick").count()) === 0, "Chủ nhiệm: form bàn giao hộ đóng sẵn, chỉ có nút mở");
  await c.getByRole("button", { name: "Bàn giao hộ khi không liên lạc được" }).click();
  ok(await waitText(c, /Bàn giao hộ khi không liên lạc được[\s\S]*tối thiểu 3 lần liên hệ/), "Chủ nhiệm: có khối Bàn giao hộ, nhắc tối thiểu 3 lần liên hệ");
  await c.getByRole("button", { name: "Đóng", exact: true }).click();
  ok((await c.locator("#proxy-pick").count()) === 0, "Chủ nhiệm: bấm Đóng thì form thu lại");
  await c.getByRole("button", { name: "Bàn giao hộ khi không liên lạc được" }).click();
  await c.selectOption("#proxy-pick", { label: "Thủ quỹ (Lê Thu Hà)" });
  await c.selectOption("#proxy-to", { label: "Võ Ngọc Lan" });
  await c.fill("#proxy-reason", "Thủ quỹ không liên lạc được từ đầu tháng");
  const dates = ["2026-11-01", "2026-11-03", "2026-11-06"];
  for (let i = 0; i < 3; i++) { await c.fill(`#proxy-date-${i}`, dates[i]); await c.fill(`#proxy-result-${i}`, ["Không nghe máy", "Đã xem, không trả lời", "Không phản hồi"][i]); }
  await c.getByRole("button", { name: "Gửi yêu cầu bàn giao hộ" }).click();
  ok(await waitText(c, /Cần đính kèm ít nhất một ảnh chụp màn hình/), "Chủ nhiệm: gửi khi chưa có ảnh thì báo lỗi");
  await c.setInputFiles("#proxy-photo-0", { name: "tin-nhan-zalo.png", mimeType: "image/png", buffer: PNG });
  ok(await c.getByRole("button", { name: /Gỡ ảnh tin-nhan-zalo\.png/ }).waitFor({ timeout: 8000 }).then(() => true).catch(() => false), "Chủ nhiệm: tải ảnh lên, hiện nút gỡ ảnh đã đính kèm");
  await c.setInputFiles("#proxy-photo-1", { name: "ghi-chu.txt", mimeType: "text/plain", buffer: Buffer.from("khong phai anh") });
  ok(await waitText(c, /Chỉ nhận ảnh JPG hoặc PNG/), "Chủ nhiệm: file không phải ảnh thì bị chặn ngay");
  await shot(c, "1-proxy-form.png");
  await c.getByRole("button", { name: "Gửi yêu cầu bàn giao hộ" }).click();
  ok(await waitText(c, /Bàn giao hộ vai thủ quỹ: Lê Thu Hà → Võ Ngọc Lan[\s\S]*Chờ duyệt bằng chứng/), "Chủ nhiệm: yêu cầu chờ duyệt bằng chứng");
  ok(await waitText(c, /1 ảnh|Xem ảnh tin-nhan-zalo\.png/), "Chủ nhiệm: tự xem được ảnh bằng chứng của mình");

  // ---- Người giữ vai chưa bị báo ----
  const t = await as("a002", LAPTOP);
  await t.goto(ROLES);
  await t.waitForLoadState("networkidle");
  ok(!(await t.evaluate(() => /Bàn giao hộ vai/.test(document.body.innerText))) || (await waitText(t, /Chờ duyệt bằng chứng/)), "Thủ quỹ: thấy yêu cầu nhưng chưa có thông báo nào trước khi mentor duyệt");
  const early = await t.evaluate(async () => (await (await fetch("/api/v1/me/notifications")).json()).items.some((n) => n.kind === "role-handover-proxy"));
  ok(!early, "Thủ quỹ: chưa nhận thông báo bàn giao hộ khi bằng chứng chưa được duyệt");

  // ---- Mentor xem ảnh và duyệt ----
  const m = await as("p-thu-trang", LAPTOP);
  await m.goto(`${BASE}/school/clubs/cau-long-san-nha`);
  ok(await waitText(m, /Bàn giao hộ \(1\)[\s\S]*Lê Thu Hà → Võ Ngọc Lan[\s\S]*Chờ bạn duyệt bằng chứng/), "Mentor: thấy yêu cầu bàn giao hộ chờ duyệt ở trang chi tiết CLB");
  await m.getByRole("button", { name: /Xem ảnh tin-nhan-zalo\.png/ }).click();
  ok(await m.locator("img.l-evidence").waitFor({ timeout: 8000 }).then(() => true).catch(() => false), "Mentor: xem được ảnh bằng chứng");
  await shot(m, "2-mentor-review.png");
  await m.getByRole("button", { name: "Duyệt bằng chứng" }).click();
  await m.locator("[role=alertdialog]").getByRole("button", { name: "Duyệt bằng chứng" }).click();
  ok(await waitText(m, /Người giữ vai có đến/), "Mentor: duyệt xong, đơn sang thời gian chờ 3 ngày");

  // ---- Người giữ vai: thấy nhật ký chữ, không thấy ảnh, bấm "Tôi vẫn đảm nhận" ----
  await t.goto(ROLES);
  ok(await waitText(t, /Nếu bạn vẫn đảm nhận, bấm "Tôi vẫn đảm nhận" trước/), "Thủ quỹ: được báo, có 3 ngày để bấm Tôi vẫn đảm nhận");
  ok(await waitText(t, /Nhật ký liên hệ với Lê Thu Hà \(3 lần\)[\s\S]*Không nghe máy[\s\S]*1 ảnh \(chỉ người gửi và người duyệt xem\)/), "Thủ quỹ: thấy nhật ký chữ, ảnh chỉ hiện số lượng");
  ok((await t.getByRole("button", { name: /Xem ảnh/ }).count()) === 0, "Thủ quỹ: không có nút xem ảnh");
  await shot(t, "3-holder-waiting.png");
  await t.getByRole("button", { name: "Tôi vẫn đảm nhận" }).click();
  await t.locator("[role=alertdialog]").getByRole("button", { name: "Tôi vẫn đảm nhận" }).click();
  ok(await waitText(t, /Người giữ vai vẫn đảm nhận[\s\S]*bấm "Tôi vẫn đảm nhận"/), "Thủ quỹ: bấm xong, yêu cầu chuyển sang trạng thái người giữ vai vẫn đảm nhận");
  const role = await t.evaluate(async () => (await (await fetch("/api/v1/me")).json()).memberships.find((x) => x.clubId === "cau-long-san-nha").role);
  ok(role === "treasurer", "Thủ quỹ: vẫn là thủ quỹ");
  const photoStatus = await t.evaluate(async () => { const r = await fetch("/api/v1/clubs/cau-long-san-nha/role-handovers"); const j = await r.json(); return j.items[0].contacts[0].evidence === undefined; });
  ok(photoStatus, "API: người giữ vai không nhận danh sách ảnh");

  console.log(results.join("\n"));
  console.log(`\n${results.filter((x) => x.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
