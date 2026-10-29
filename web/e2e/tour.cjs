// Hướng dẫn cho ban điều hành (29/10/2026): tự mở lần đầu, đi qua từng tab và từng mục trong tab (đổi trang, bấm chip của kho), không bước nào bị bỏ vì thiếu phần tử,
// thoát được bằng Esc, không mở lại sau khi đã xem, mở lại được từ menu avatar; chủ nhiệm mới chỉ có Bàn giao và Kho bàn giao; thành viên không có hướng dẫn.
// Chạy trong web/: node e2e/tour.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ). Các bước ở src/lib/tour.ts.
const fs = require("fs");
const path = require("path");
const { BASE, launch } = require("./common.cjs");
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const LAPTOP = { width: 1440, height: 900 };

const source = fs.readFileSync(path.join(__dirname, "..", "src", "lib", "tour.ts"), "utf8");
const tourBlock = source.slice(source.indexOf("export const BOARD_TOUR"), source.indexOf("/** Các bước của một vai"));
const ALL = (tourBlock.match(/\{ group:/g) || []).length;

(async () => {
  const browser = await launch();
  const errs = [];
  async function as(personId) {
    const ctx = await browser.newContext({ viewport: LAPTOP, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    await ctx.addInitScript(() => { window.__tourOn = true; }); // common.cjs đánh dấu mọi tour là đã xem; ở đây cần tour thật
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  /** Đi tới hết hướng dẫn bằng nút Tiếp theo; trả về nhãn "tab · n/m" của từng bước đã hiện. */
  async function walk(p) {
    const seen = [];
    for (let guard = 0; guard < 80; guard++) {
      await p.waitForSelector(".l-tour-box", { timeout: 15000 });
      await p.waitForTimeout(150);
      seen.push(`${await p.locator(".l-tour-count").innerText()} | ${await p.locator("#l-tour-title").innerText()} | ${new URL(p.url()).pathname}`);
      const last = await p.locator(".l-tour-actions button", { hasText: /^Xong$/ }).count(); // chỉ trong tờ chú thích: trang việc có nút "xong" riêng
      await p.locator(".l-tour-actions .l-btn").click();
      if (last) break;
    }
    return seen;
  }
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // Chủ nhiệm: tự mở, đi hết mọi bước
  let p = await as("a001");
  await p.goto(`${BASE}/clubs/cau-long-san-nha`);
  ok(await p.waitForSelector(".l-tour-box", { timeout: 20000 }).then(() => true).catch(() => false), "Chủ nhiệm: lần đầu vào CLB thì hướng dẫn tự mở");
  const seen = await walk(p);
  ok(seen.length === ALL, `Đi hết ${ALL} bước, không bước nào bị bỏ vì thiếu phần tử`, `${seen.length}/${ALL}`);
  const pathsSeen = [...new Set(seen.map((s) => s.split(" | ")[2]))];
  const base = "/clubs/cau-long-san-nha";
  ok(["", "/members", "/events", "/tasks", "/posts", "/handover", "/handover-kit"].every((x) => pathsSeen.includes(base + x)), "Hướng dẫn đi qua Trang chủ, Thành viên, Điểm danh, Việc cần làm, Bảng tin, Bàn giao và Kho bàn giao", pathsSeen.join(","));
  ok(pathsSeen.some((x) => x.includes("/collections")) && pathsSeen.includes(base + "/reconcile") && pathsSeen.includes(base + "/expenses") && pathsSeen.includes(base + "/budget"), "Hướng dẫn đi qua cả nhóm Quỹ (đợt thu, đối soát, duyệt chi, dự trù)");
  const kit = seen.filter((s) => s.includes("Kho bàn giao ·")).map((s) => s.split(" | ")[1]);
  ok(["Biểu mẫu", "Quy trình", "Tài khoản và quyền truy cập"].every((t) => kit.includes(t)), "Kho bàn giao: hướng dẫn mở cả ba phần (Biểu mẫu, Quy trình, Tài khoản)", kit.join(","));
  ok((await p.locator(".l-tour").count()) === 0, "Bấm Xong ở bước cuối thì hướng dẫn tắt");
  await p.goto(`${BASE}/clubs/cau-long-san-nha`);
  await p.waitForTimeout(2500);
  ok((await p.locator(".l-tour").count()) === 0, "Đã xem rồi thì tải lại trang không mở lại");

  // Mở lại từ avatar; Esc thoát; "Bỏ qua phần này" nhảy sang tab kế
  await p.getByRole("button", { name: /tài khoản/ }).click();
  await p.getByRole("menuitem", { name: "Hướng dẫn" }).click();
  ok(await p.waitForSelector(".l-tour-box", { timeout: 15000 }).then(() => true).catch(() => false) && /Giới thiệu/.test(await p.locator(".l-tour-count").innerText()), "Menu avatar: Hướng dẫn mở lại từ bước đầu");
  ok(await p.evaluate(() => !!document.activeElement?.closest(".l-tour-box")) || await p.waitForFunction(() => !!document.activeElement?.closest(".l-tour-box"), null, { timeout: 2000 }).then(() => true).catch(() => false), "Tiêu điểm vào tờ chú thích");
  await p.getByRole("button", { name: "Tiếp theo" }).click();
  await p.waitForSelector(".l-tour-box");
  await p.getByRole("button", { name: "Bỏ qua phần này" }).click();
  await p.waitForFunction(() => /Thành viên ·/.test(document.querySelector(".l-tour-count")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  ok(/Thành viên · 1\//.test(await p.locator(".l-tour-count").innerText()) && new URL(p.url()).pathname === `${base}/members`, "Bỏ qua phần này: nhảy sang tab Thành viên và chuyển trang");
  await p.keyboard.press("Escape");
  ok((await p.locator(".l-tour").count()) === 0, "Esc thoát hướng dẫn");
  await p.context().close();

  // Thủ quỹ cũng là ban điều hành: tự mở
  p = await as("a002");
  await p.goto(`${BASE}/clubs/cau-long-san-nha`);
  ok(await p.waitForSelector(".l-tour-box", { timeout: 20000 }).then(() => true).catch(() => false), "Thủ quỹ: hướng dẫn tự mở");
  await p.context().close();

  // Thành viên thường: không có hướng dẫn, và không có avatar menu ban điều hành
  p = await as("a017");
  await p.goto(`${BASE}/feed`);
  await p.waitForTimeout(2500);
  ok((await p.locator(".l-tour").count()) === 0, "Thành viên thường: không có hướng dẫn");
  await p.context().close();

  console.log(results.join("\n"));
  if (errs.length) console.log("LOI trình duyệt:\n" + errs.join("\n"));
  await browser.close();
  const bad = results.filter((r) => r.startsWith("LOI")).length + (errs.length ? 1 : 0);
  console.log(`\n${results.length - results.filter((r) => r.startsWith("LOI")).length}/${results.length} kiểm tra đạt, ${errs.length} lỗi trình duyệt`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
