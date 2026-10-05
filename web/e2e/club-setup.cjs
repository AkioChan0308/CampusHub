// Nhóm "tạo dữ liệu từ đầu" (04/10/2026): tạo CLB, thêm thành viên từ file .xlsx, tạo/sửa/xóa buổi, tạo/sửa đợt thu,
// đổi vai, người được thêm nhận lời mời. Chạy trong web/: node e2e/club-setup.cjs (web cổng 3000, server cổng 4000 chế độ demo).
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("club-setup");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
async function tall(page, file, size) {
  await page.waitForTimeout(400);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, h) });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize(size);
}

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
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // ---- Tạo CLB (sinh viên chưa vào CLB nào) ----
  let p = await as("p-bao-chau", PHONE);
  await p.goto(`${BASE}/explore`);
  await p.getByRole("link", { name: "Tạo CLB mới" }).click();
  await p.waitForURL("**/clubs/new");
  await p.getByRole("button", { name: "Tạo CLB" }).waitFor();
  await tall(p, "1-create-club-phone.png", PHONE);
  await p.getByRole("button", { name: "Tạo CLB" }).click();
  ok(await waitText(p, /Cần ghi tên CLB/) && await p.evaluate(() => document.activeElement?.id === "club-name"), "Tạo CLB: thiếu tên thì báo lỗi, con trỏ về ô tên");
  await p.fill("#club-name", "CLB Bóng bàn Nhanh Tay");
  await p.selectOption("#club-field", "Nghệ thuật, thể thao");
  await p.fill("#club-schedule", "Tối Thứ Năm, 18:00–20:00");
  await p.fill("#club-location", "Nhà thi đấu");
  await p.getByRole("button", { name: "Tạo CLB" }).click();
  await p.waitForURL("**/clubs/clb-bong-ban-nhanh-tay", { timeout: 15000 });
  await p.context().close();

  p = await as("p-bao-chau", LAPTOP);
  const C = `${BASE}/clubs/clb-bong-ban-nhanh-tay`;
  await p.goto(C);
  ok(await waitText(p, /Thêm thành viên[\s\S]*Tạo buổi sinh hoạt đầu tiên[\s\S]*Tạo đợt thu quỹ/), "Trang chủ CLB mới: nhắc 3 việc mở đầu");
  await tall(p, "2-new-club-home.png", LAPTOP);

  // ---- Thêm thành viên từ file .xlsx ----
  await p.getByRole("link", { name: /Thêm thành viên/ }).click();
  await p.waitForURL("**/members/add");
  await p.getByRole("button", { name: "Chọn file Excel hoặc CSV" }).waitFor();
  await p.setInputFiles("input[type=file]", path.join(__dirname, "samples", "members-sample.xlsx"));
  ok(await waitText(p, /Đã đọc 3 người từ members-sample\.xlsx\. Bỏ qua cột STT, MSSV/), "Thêm thành viên: đọc file .xlsx, bỏ qua cột MSSV");
  ok(await waitText(p, /Email không hợp lệ[\s\S]*Năm học từ 1 đến 5[\s\S]*Còn 1 dòng có lỗi/), "Thêm thành viên: dòng lỗi báo ngay tại dòng");
  await tall(p, "3-add-members-error.png", LAPTOP);
  await p.getByRole("button", { name: "Thêm 3 người" }).click({ force: true });
  ok(await p.evaluate(() => document.activeElement?.id === "member-2-email"), "Thêm thành viên: còn lỗi thì con trỏ tới ô lỗi đầu tiên");
  await p.fill("#member-2-email", "loi.dang@example.com");
  await p.fill("#member-2-year", "3");
  await p.getByRole("button", { name: "Thêm 3 người" }).click();
  ok(await waitText(p, /Đã thêm 3 người/), "Thêm thành viên: thêm 3 người");
  ok((await p.locator("table tbody tr").count()) === 3, "Thêm thành viên: bảng link mời 3 người");
  await tall(p, "4-add-members-done.png", LAPTOP);

  // ---- Danh sách thành viên: link mời, sửa vai ----
  await p.getByRole("link", { name: "Về danh sách thành viên" }).click();
  await p.waitForURL("**/members");
  await p.getByRole("heading", { name: "Danh sách thành viên" }).waitFor();
  ok(await waitText(p, /4 thành viên · 3 người chưa nhận lời mời/), "Thành viên: 4 người, 3 chưa nhận lời mời");
  ok((await p.getByRole("button", { name: /Sao chép link mời của/ }).count()) === 3, "Thành viên: 3 nút sao chép link mời");
  await p.getByRole("button", { name: "Sửa vai trò và ban của Phan Thị Thử" }).click();
  const dlg = p.getByRole("dialog");
  await dlg.waitFor();
  await dlg.locator("select").selectOption("treasurer");
  await tall(p, "5-edit-role.png", LAPTOP);
  await dlg.getByRole("button", { name: "Lưu" }).click();
  ok(await waitText(p, /Đã lưu: Phan Thị Thử · Thủ quỹ/), "Thành viên: chủ nhiệm đổi vai thành thủ quỹ");

  // ---- Buổi: tạo, sửa, xóa ----
  await p.goto(C);
  await p.getByRole("link", { name: /Tạo buổi sinh hoạt đầu tiên/ }).click();
  await p.waitForURL("**/events?create=1");
  await p.getByRole("button", { name: "Tạo buổi" }).last().waitFor();
  ok(await p.locator("#event-title").isVisible(), "Buổi: mở từ trang chủ thì form tạo buổi mở sẵn");
  ok(await p.evaluate(() => document.activeElement?.id === "event-title"), "Buổi: form mở thì con trỏ ở ô Tên buổi");
  const tomorrow = new Date(Date.now() + 7 * 3600_000 + 86_400_000).toISOString().slice(0, 10);
  await p.fill("#event-title", "Sinh hoạt tuần 1");
  await p.fill("#event-date", tomorrow);
  await p.fill("#event-location", "Nhà thi đấu");
  await p.fill("#event-end", "07:00");
  await p.locator("form").getByRole("button", { name: "Tạo buổi" }).click();
  ok(await waitText(p, /Giờ kết thúc phải sau giờ bắt đầu/), "Buổi: giờ kết thúc trước giờ bắt đầu thì báo lỗi");
  await p.fill("#event-end", "20:00");
  await p.fill("#event-start", "18:00");
  await p.fill("#event-until", "18:30");
  await p.locator("form").getByRole("button", { name: "Tạo buổi" }).click();
  ok(await waitText(p, /Đã tạo buổi Sinh hoạt tuần 1/), "Buổi: tạo buổi");
  ok(await p.evaluate(() => document.activeElement?.id === "upcoming-events"), "Buổi: lưu xong, con trỏ về tiêu đề danh sách");
  await p.getByRole("button", { name: "Tạo buổi" }).first().click();
  await p.fill("#event-title", "Buổi thử để xóa");
  await p.fill("#event-date", tomorrow);
  await p.fill("#event-location", "Phòng A");
  await p.locator("form").getByRole("button", { name: "Tạo buổi" }).click();
  await waitText(p, /Đã tạo buổi Buổi thử để xóa/);
  await tall(p, "6-events.png", LAPTOP);
  await p.locator(".l-evrow", { hasText: "Buổi thử để xóa" }).getByRole("button", { name: "Xóa", exact: true }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Xóa buổi" }).click();
  ok(await waitText(p, /Đã xóa buổi Buổi thử để xóa/), "Buổi: xóa buổi chưa mở điểm danh");
  await p.locator(".l-evrow", { hasText: "Sinh hoạt tuần 1" }).getByRole("button", { name: "Sửa" }).click();
  await p.fill("#event-title", "Sinh hoạt tuần 1 (đổi phòng)");
  await p.getByRole("button", { name: "Lưu buổi" }).click();
  ok(await waitText(p, /Đã lưu buổi Sinh hoạt tuần 1 \(đổi phòng\)/), "Buổi: sửa buổi");

  // ---- Đợt thu: tạo, sửa ----
  await p.goto(`${C}/collections`);
  ok(await waitText(p, /CLB chưa có đợt thu nào/), "Đợt thu: CLB chưa có đợt thu thì mời tạo");
  await p.getByRole("link", { name: "Tạo đợt thu" }).click();
  await p.waitForURL("**/collections/new");
  await p.locator("#collection-amount").waitFor();
  ok((await p.inputValue("#collection-prefix")) === "QFALL26", "Tạo đợt thu: gợi ý mã đầu nội dung QFALL26", await p.inputValue("#collection-prefix"));
  await p.fill("#collection-amount", "50.000");
  await p.fill("#collection-bank", "[ngân hàng]");
  await p.fill("#collection-account", "0123456789");
  ok(await waitText(p, /Nội dung chuyển khoản của bạn[\s\S]*QFALL26 A001/), "Tạo đợt thu: xem trước nội dung chuyển khoản");
  await tall(p, "7-create-collection.png", LAPTOP);
  await p.getByRole("button", { name: "Tạo đợt thu" }).click();
  await p.waitForURL(/\/collections\/dot-thu-/, { timeout: 15000 });
  ok(await waitText(p, /Quỹ học kỳ Fall 2026[\s\S]*Tất cả \(4\)/), "Đợt thu: tạo xong, 4 người chưa đóng");
  await p.getByRole("button", { name: "Sửa đợt thu" }).click();
  await p.getByRole("dialog").waitFor();
  await p.fill("#edit-amount", "60.000");
  await p.getByRole("dialog").getByRole("button", { name: "Lưu" }).click();
  ok(await waitText(p, /60\.000 ₫\/người/), "Đợt thu: sửa mức thu khi chưa ai đóng");
  await tall(p, "8-new-collection.png", LAPTOP);
  await p.context().close();

  // ---- Người được thêm nhận lời mời ----
  const members = await (await fetch(`${BASE}/api/v1/clubs/clb-bong-ban-nhanh-tay/members`, { headers: { "X-Demo-User": "p-bao-chau" } })).json();
  const mau = members.members.find((m) => m.email === "mau.ngo@example.com");
  p = await as(mau.personId, PHONE);
  await p.goto(`${BASE}/invite/${mau.inviteCode}`);
  await p.getByRole("button", { name: "Tham gia CLB" }).waitFor();
  ok(await waitText(p, /CLB Bóng bàn Nhanh Tay mời bạn tham gia/), "Lời mời: người được thêm mở được link mời riêng");
  await p.check("#consent-keep");
  await p.check("#consent-age");
  await p.getByRole("button", { name: "Tham gia CLB" }).click();
  await p.waitForURL("**/me");
  ok(await waitText(p, /Ngô Văn Mẫu[\s\S]*Quỹ học kỳ Fall 2026/), "Lời mời: vào trang Của tôi, thấy đợt thu mới");
  await p.context().close();

  // ---- CLB mẫu: thủ quỹ thấy dải chọn đợt thu ----
  p = await as("a002", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/collections`);
  await p.waitForURL("**/collections/quy-fall-2026");
  ok(await p.getByRole("navigation", { name: "Các đợt thu" }).getByRole("link", { name: "Tạo đợt thu" }).waitFor({ timeout: 10000 }).then(() => true).catch(() => false), "Đợt thu (CLB mẫu): dải chọn đợt có Tạo đợt thu");
  await tall(p, "9-collection-sample-club.png", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/events`);
  ok(await waitText(p, /Sắp tới[\s\S]*Đã qua/), "Các buổi (CLB mẫu): có buổi sắp tới và đã qua");
  ok(await p.evaluate(() => [...document.querySelectorAll("#past-events ~ * .l-evrow-title, section:last-of-type .l-evrow-title")].length > 0), "Các buổi (CLB mẫu): phần Đã qua có buổi");
  await tall(p, "10-events-sample-club.png", LAPTOP);
  await p.context().close();

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
