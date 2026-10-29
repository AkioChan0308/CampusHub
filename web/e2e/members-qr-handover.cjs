// Nhóm 2 sau khi chuyển sang Lịch bloc và nối máy chủ: Thành viên, Chiếu QR + điểm danh, Bàn giao.
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("members-qr-handover");
fs.mkdirSync(OUT, { recursive: true });
const C = `${BASE}/clubs/cau-long-san-nha`;
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
async function tall(page, file, w = 1440, h0 = 900) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: w, height: Math.max(h0, h) });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize({ width: w, height: h0 });
}
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const errs = [];
  const watch = (p) => {
    p.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/status of (401|403|409|400)|favicon|React DevTools|HMR|Reduced Motion/.test(m.text() + JSON.stringify(m.location()))) errs.push(`${p.url()} :: ${m.text().slice(0, 240)}`); });
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  };
  ctx.on("page", watch);
  const p = await ctx.newPage();
  p.on("framenavigated", (f) => { if (f === p.mainFrame()) console.log("-> ", f.url()); });
  p.on("response", (r) => { if (r.url().includes("/api/v1/") && r.status() >= 400) console.log(r.status(), r.url()); });
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  await p.goto(`${BASE}/login`);
  await p.evaluate(async () => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: "a001" }) }); });

  // ---- Thành viên ----
  await p.goto(`${C}/members`);
  await p.getByRole("heading", { name: "Danh sách thành viên" }).waitFor();
  ok(await waitText(p, /Đơn xin vào đang chờ \(3\)/), "Thành viên: 3 đơn đang chờ");
  await tall(p, "1-members.png");
  await p.fill("#member-search", "minh anh");
  ok((await p.locator("table.l-table tbody").innerText()).includes("Nguyễn Minh Anh"), "Thành viên: tìm không dấu ra Nguyễn Minh Anh");
  await p.fill("#member-search", "");
  await p.locator(".l-app", { hasText: "Võ Thị Hồng Nhung" }).getByRole("button", { name: "Duyệt", exact: true }).click();
  ok(await waitText(p, /Đơn xin vào đang chờ \(2\)/), "Thành viên: duyệt đơn còn 2 đơn");
  ok(await waitText(p, /43 thành viên/), "Thành viên: lên 43 thành viên");

  // ---- Chiếu QR ----
  await p.goto(`${C}/events/tuan-5/qr`);
  await p.getByRole("heading", { name: "Chưa mở điểm danh" }).waitFor();
  await p.screenshot({ path: path.join(OUT, "2-qr-not-open.png") });
  await p.getByRole("button", { name: "Bắt đầu điểm danh" }).click();
  await p.waitForSelector(".l-qr-svg svg", { timeout: 10000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "3-qr-open.png") });
  ok(await p.locator(".l-qr-svg svg").count() === 1, "QR: có mã QR do máy chủ ký");
  const [p2] = await Promise.all([ctx.waitForEvent("page"), p.getByRole("link", { name: "Mở link điểm danh" }).click()]);
  await p2.setViewportSize({ width: 390, height: 844 });
  await p2.waitForURL("**/me/attendance**", { timeout: 15000 }).catch(() => {});
  ok(await waitText(p2, /Đã điểm danh/), "Điểm danh: tab thành viên báo Đã điểm danh", p2.url());
  await p2.waitForTimeout(600);
  await p2.screenshot({ path: path.join(OUT, "4-checked-in-390.png") });
  ok(await waitText(p, /Nguyễn Minh Anh/, 8000), "QR: tab chiếu thấy tên người vừa điểm danh");
  ok(await p.evaluate(() => fetch("/api/v1/me").then((r) => r.json()).then((d) => d.person.id)) === "a001", "QR: tab chiếu vẫn là chủ nhiệm");
  await p.selectOption("#demo-as-person", "a009");
  const [p3] = await Promise.all([ctx.waitForEvent("page"), p.getByRole("link", { name: "Mở link điểm danh" }).click()]);
  await p3.setViewportSize({ width: 390, height: 844 });
  ok(await waitText(p3, /Điện thoại này đã điểm danh cho người khác/), "Điểm danh: cùng điện thoại, người thứ hai bị chặn");
  await p3.screenshot({ path: path.join(OUT, "5-same-phone-390.png") });
  await p3.close();
  await p.getByRole("button", { name: "Điểm danh tay" }).click();
  await p.locator(".l-att-list button", { hasText: "Điểm danh" }).first().click();
  ok(await waitText(p, /\b2\s*\/\s*43\b/), "QR: điểm danh tay lên 2 người");
  await p.screenshot({ path: path.join(OUT, "6-qr-manual-check-in.png") });
  await p.getByRole("button", { name: "Xong" }).click();
  await p.getByRole("button", { name: "Đóng điểm danh" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Xác nhận đóng" }).click();
  ok(await waitText(p, /Đã đóng điểm danh/), "QR: đóng điểm danh");
  await p.screenshot({ path: path.join(OUT, "7-qr-closed.png") });

  // ---- Lịch sử điểm danh (tab thành viên) ----
  await p2.goto(`${BASE}/me/attendance`);
  ok(await waitText(p2, /Lịch sử điểm danh/), "Điểm danh: trang lịch sử");
  await p2.waitForTimeout(400);
  await tall(p2, "8-history-390.png", 390, 844);
  await p2.goto(`${BASE}/checkin?e=tuan-5&t=sai`);
  ok(await waitText(p2, /Buổi này đã đóng điểm danh|Mã QR đã hết hạn/), "Điểm danh: mã sai hoặc buổi đã đóng thì báo lỗi");
  await p2.screenshot({ path: path.join(OUT, "9-scan-error-390.png") });

  // ---- Bàn giao ----
  await p.goto(`${C}/handover`);
  await p.getByRole("heading", { name: "Đổi tài khoản nhận quỹ" }).waitFor();
  await tall(p, "10-handover.png");
  await p.getByRole("button", { name: "Lưu và sang bước 5" }).click();
  ok((await p.locator("body").innerText()).includes("Cần ghi ngân hàng."), "Bàn giao: thiếu ngân hàng thì báo lỗi");
  await p.fill("#handover-bank", "[Ngân hàng thử]");
  await p.fill("#handover-account-number", "0123456789");
  await p.getByRole("button", { name: "Lưu và sang bước 5" }).click();
  ok(await waitText(p, /Bước 5 \/ 7/), "Bàn giao: sang bước 5");
  await tall(p, "11-handover-step-5.png");

  await browser.close();
  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
})().catch((e) => { console.error(results.join("\n")); console.error(e); process.exit(1); });
