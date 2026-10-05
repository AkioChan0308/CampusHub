// Nhóm 1 (luồng tiền) sau khi chuyển sang Lịch bloc và nối máy chủ: Đợt thu, Đối soát, Duyệt chi, Dự trù.
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("money-flows");
fs.mkdirSync(OUT, { recursive: true });
const C = `${BASE}/clubs/cau-long-san-nha`;
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
async function tall(page, file) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1440, height: Math.max(900, h) });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize({ width: 1440, height: 900 });
}
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/status of (401|403)|favicon|React DevTools|HMR|Reduced Motion/.test(m.text() + JSON.stringify(m.location()))) errs.push(m.text().slice(0, 240)); });
  p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  const login = (id) => p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, id);
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  await p.goto(`${BASE}/login`);
  await login("a002");

  // ---- Đợt thu ----
  await p.goto(`${C}/collections/quy-fall-2026`);
  await p.getByRole("heading", { name: "Quỹ học kỳ Fall 2026" }).waitFor();
  await p.getByText("Đang hiện 7/42").waitFor();
  await tall(p, "1-collection.png");
  ok(/29 người/.test(await p.locator(".l-strip").innerText()), "Đợt thu: 29 người đã đóng");
  await p.getByRole("button", { name: /Chưa đóng \(11\)/ }).click();
  await p.locator("tbody tr").first().getByRole("button", { name: "Ghi tiền mặt" }).click();
  await p.getByRole("alertdialog").waitFor();
  await p.screenshot({ path: path.join(OUT, "2-confirm-dialog.png") });
  await p.getByRole("alertdialog").getByRole("button", { name: "Ghi vào sổ" }).click();
  await p.getByRole("button", { name: /Chưa đóng \(10\)/ }).waitFor({ timeout: 10000 }).then(() => ok(true, "Đợt thu: ghi tiền mặt, còn 10 người chưa đóng")).catch(() => ok(false, "Đợt thu: ghi tiền mặt"));
  ok(/30 người/.test(await p.locator(".l-strip").innerText()), "Đợt thu: lên 30 người đã đóng");

  // ---- Đối soát ----
  await p.getByRole("navigation", { name: "Menu ban điều hành" }).getByRole("link", { name: /Đối soát sao kê/ }).click();
  await p.getByRole("heading", { name: /Cần gán tay/ }).waitFor();
  await tall(p, "3-reconcile.png");
  ok((await p.locator(".l-strip").innerText()).includes("4"), "Đối soát: 4 cần gán tay");
  await p.getByRole("button", { name: "Ghi nhận cả hai" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Ghi vào sổ" }).click(); // hỏi lại trước khi ghi vào sổ (05/10/2026)
  await p.getByText(/Đã ghi nhận:/).first().waitFor({ timeout: 10000 }).then(() => ok(true, "Đối soát: ghi nhận cả hai")).catch(() => ok(false, "Đối soát: ghi nhận cả hai"));
  // Tải CSV có một dòng ngày 31/02
  const csv = path.join(OUT, "sao-ke-thu.csv");
  fs.writeFileSync(csv, "Ngày,Số tiền,Người chuyển,Nội dung\n31/02/2026,100000,AI DO,QFALL26 A030\n02/10/2026 21:00,100000,BUI KHANH VY,QFALL26 A030\n");
  await p.locator('input[type="file"]').setInputFiles(csv);
  await p.getByText(/Bỏ qua 1 dòng có ngày không có thật/).waitFor({ timeout: 10000 }).then(() => ok(true, "Đối soát: báo bỏ 1 dòng ngày sai")).catch(() => ok(false, "Đối soát: báo bỏ dòng ngày sai"));
  await tall(p, "4-reconcile-after-upload.png");

  // ---- Duyệt chi (chủ nhiệm: không tự duyệt) ----
  await login("a001");
  await p.goto(`${C}/expenses`);
  await p.getByRole("tab", { name: /Chờ duyệt/ }).waitFor();
  await p.getByRole("button", { name: /Mua 2 ống cầu/ }).click();
  ok(await p.getByRole("button", { name: "Duyệt", exact: true }).isDisabled(), "Duyệt chi: chủ nhiệm không tự duyệt khoản của mình");
  await tall(p, "5-expenses.png");
  await p.getByRole("button", { name: "Đề xuất chi" }).click();
  await p.getByLabel("Nội dung chi").fill("Mua băng quấn vợt");
  await p.getByLabel("Số tiền (₫)").fill("120000");
  await tall(p, "6-expense-form.png");
  await p.getByRole("button", { name: "Gửi", exact: true }).click();
  await p.getByRole("heading", { name: "Mua băng quấn vợt" }).waitFor({ timeout: 10000 }).then(() => ok(true, "Duyệt chi: tạo đề xuất mới")).catch(() => ok(false, "Duyệt chi: tạo đề xuất mới"));
  // Trưởng ban duyệt khoản của chủ nhiệm
  await login("a005");
  await p.goto(`${C}/expenses`);
  await p.getByRole("button", { name: /Mua 2 ống cầu/ }).click();
  await p.getByLabel("Ghi chú (bắt buộc khi từ chối)").fill("Nhớ lấy hóa đơn");
  await p.getByRole("button", { name: "Duyệt", exact: true }).click();
  await p.getByText("Đã duyệt · chờ chi").waitFor({ timeout: 10000 }).then(() => ok(true, "Duyệt chi: trưởng ban duyệt")).catch(() => ok(false, "Duyệt chi: trưởng ban duyệt"));
  ok((await p.locator(".l-history").innerText()).includes("Nhớ lấy hóa đơn"), "Duyệt chi: ghi chú vào lịch sử");

  // ---- Dự trù ----
  await login("a001");
  await p.goto(`${C}/budget`);
  await p.getByRole("heading", { name: "Các khoản dự trù" }).waitFor();
  await tall(p, "7-budget.png");
  await p.getByRole("button", { name: "Thêm hoạt động" }).click();
  await p.getByLabel("Hoạt động", { exact: true }).fill("Giải giao lưu");
  await p.getByLabel("Dự trù (₫)").fill("5000000");
  await tall(p, "8-budget-add.png");
  await p.getByRole("button", { name: "Thêm", exact: true }).click();
  await p.getByText("Đang thiếu", { exact: true }).waitFor({ timeout: 10000 }).then(() => ok(true, "Dự trù: thêm khoản lớn thì báo thiếu")).catch(() => ok(false, "Dự trù: thêm khoản lớn thì báo thiếu"));
  await tall(p, "9-budget-short.png");

  // ---- Đang tải (API chậm) ----
  await p.route("**/api/v1/clubs/**", async (r) => { await new Promise((x) => setTimeout(x, 900)); await r.continue(); });
  await p.goto(`${C}/reconcile`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "10-reconcile-loading.png") });
  await p.goto(`${C}/collections/quy-fall-2026`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "11-collection-loading.png") });
  await p.unroute("**/api/v1/clubs/**");

  await browser.close();
  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
})().catch((e) => { console.error(results.join("\n")); console.error(e); process.exit(1); });
