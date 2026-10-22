// Bảng tin chung, KHUNG RỖNG (22/10/2026): đường dẫn, tab, trạng thái rỗng, quyền. Chưa có dữ liệu thật; mô tả ở docs/mo-ta-bang-tin-chung.md.
// Chạy trong web/: node e2e/feed-shell.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ).
const { BASE, launch } = require("./common.cjs");
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const PHONE = { width: 390, height: 844 };
const LAPTOP = { width: 1440, height: 900 };

(async () => {
  const browser = await launch();
  const errs = [];
  async function as(personId, size) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    p.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/status of (401|403|404|409|400)|favicon|React DevTools|HMR|Reduced Motion|Transition was aborted/.test(m.text() + JSON.stringify(m.location()))) errs.push(`${p.url()} :: ${m.text().slice(0, 240)}`); });
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // Sinh viên chưa vào CLB nào
  let p = await as("p-bao-chau", PHONE);
  await p.goto(`${BASE}/feed`);
  ok(await waitText(p, /Bảng tin[\s\S]*Tin chung[\s\S]*CLB của tôi[\s\S]*Chưa có tin nào\./), "Bảng tin: có tiêu đề, hai nút chọn phần và trạng thái rỗng");
  ok(await p.getByRole("button", { name: "Tin chung" }).getAttribute("aria-pressed") === "true", "Bảng tin: mặc định ở phần Tin chung");
  await p.getByRole("button", { name: "CLB của tôi" }).click();
  ok(await waitText(p, /Bạn chưa ở CLB nào/) && await p.getByRole("link", { name: "Tìm CLB" }).isVisible(), "Bảng tin: sinh viên chưa vào CLB thấy lời mời Tìm CLB ở phần CLB của tôi");
  await p.context().close();

  // Thành viên (điện thoại và laptop)
  p = await as("a017", LAPTOP);
  await p.goto(`${BASE}/feed`);
  await p.getByRole("button", { name: "CLB của tôi" }).click();
  ok(await waitText(p, /Chưa có tin nào\./) && !(await p.locator("body").innerText()).includes("Bạn chưa ở CLB nào"), "Bảng tin: thành viên ở phần CLB của tôi thấy trạng thái rỗng, không bị nói chưa ở CLB nào");
  await p.context().close();

  // Chưa đăng nhập: bị đưa về đăng nhập
  const anon = await browser.newContext({ viewport: PHONE });
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/feed`);
  ok(await waitText(ap, /Bạn cần đăng nhập|Đăng nhập/), "Bảng tin: chưa đăng nhập thì được mời đăng nhập");
  await anon.close();

  // Ban điều hành
  p = await as("a001", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  ok(await waitText(p, /Bảng tin của CLB[\s\S]*Tin đã đăng[\s\S]*Chưa có tin nào\./), "Bảng tin của CLB: ban điều hành thấy khung rỗng");
  ok(!(await p.getByRole("navigation", { name: "Menu ban điều hành" }).innerText()).includes("Bảng tin"), "Bảng tin của CLB: chưa có mục menu (chờ Hiệu chọn chỗ đặt)");
  await p.context().close();

  // Thành viên thường không vào được trang của ban điều hành
  p = await as("a018", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  await p.waitForTimeout(2500);
  ok(!(await p.locator("body").innerText()).includes("Tin đã đăng"), "Bảng tin của CLB: thành viên thường bị chặn");
  await p.context().close();

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
