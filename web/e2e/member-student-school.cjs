// Nhóm 3 và 4 sau khi chuyển sang Lịch bloc và nối máy chủ: Của tôi, Lời mời, Danh sách CLB, Trang CLB, hai màn nhà trường.
// Chạy trong web/: node e2e/member-student-school.cjs (web cổng 3000, server cổng 4000 chế độ demo). Ảnh chụp ở e2e/screenshots/.
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir, inactiveClubsToday, collectionSizeAfterApproval } = require("./common.cjs");
const OUT = outDir("member-student-school");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const PHONE = { width: 390, height: 844 };
const LAPTOP = { width: 1440, height: 900 };
async function tall(page, file, size) {
  await page.waitForTimeout(400);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: size.width, height: Math.max(size.height, h) });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, file) });
  await page.setViewportSize(size);
}
async function readDownload(page, click) {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 10000 }), click()]);
  const file = path.join(OUT, dl.suggestedFilename());
  await dl.saveAs(file);
  return { name: dl.suggestedFilename(), text: fs.readFileSync(file, "utf8") };
}

(async () => {
  const browser = await launch();
  const errs = [];
  async function as(personId, size) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", acceptDownloads: true });
    const p = await ctx.newPage();
    p.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/status of (401|403|404|409|400)|favicon|React DevTools|HMR|Reduced Motion/.test(m.text() + JSON.stringify(m.location()))) errs.push(`${p.url()} :: ${m.text().slice(0, 240)}`); });
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // ---- Của tôi (thành viên a017) ----
  let p = await as("a017", PHONE);
  await p.goto(`${BASE}/me`);
  // Khung xương cũng có tiêu đề "Dữ liệu của tôi"; nút tải dữ liệu chỉ có khi đã tải xong.
  await p.getByRole("button", { name: "Tải dữ liệu của tôi (Excel)" }).waitFor();
  const t0 = await p.locator("body").innerText();
  ok(t0.includes("Nguyễn Minh Anh") && t0.includes("ban Truyền thông") && /4\/5\s*buổi|\d\/\d\s*buổi/.test(t0), "Của tôi: tên, ban, số buổi điểm danh");
  ok(t0.includes("Chờ thủ quỹ xác nhận"), "Của tôi: quỹ học kỳ chờ thủ quỹ xác nhận");
  await tall(p, "1-me.png", PHONE);
  const dl = await readDownload(p, () => p.getByRole("button", { name: "Tải dữ liệu của tôi (Excel)" }).click());
  ok(dl.name === "du-lieu-cua-toi-A017.csv" && dl.text.includes("Nguyễn Minh Anh") && dl.text.includes("Điểm danh") && dl.text.includes("Đồng ý"), "Của tôi: tải dữ liệu của tôi", dl.name);
  await p.getByRole("button", { name: "Rút đồng ý lưu số điện thoại" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Rút đồng ý", exact: true }).click();
  ok(await waitText(p, /Đã rút đồng ý lưu số điện thoại ngày/), "Của tôi: rút đồng ý lưu số điện thoại");
  ok(await p.evaluate(() => document.activeElement?.textContent === "Dữ liệu của tôi"), "Của tôi: rút xong, focus về tiêu đề Dữ liệu của tôi");
  await p.getByRole("button", { name: "Rời CLB và xóa dữ liệu" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Rời CLB và xóa", exact: true }).click();
  ok(await waitText(p, /Đã gửi yêu cầu xóa ngày[\s\S]*CLB xử lý xong trước ngày/), "Của tôi: gửi yêu cầu xóa, hiện hạn xử lý");
  ok((await p.locator("[aria-label^='Hạn xử lý yêu cầu xóa']").getAttribute("aria-label"))?.includes("còn 20 ngày"), "Của tôi: tờ lịch hạn xử lý còn 20 ngày");
  await tall(p, "2-me-deletion-requested.png", PHONE);
  // Tab Quỹ từ trang Của tôi mở thẳng đợt thu
  await p.locator(".l-tabs a", { hasText: "Quỹ" }).click();
  await p.waitForURL("**/me/pay/**");
  ok(true, "Của tôi: tab Quỹ mở màn đóng quỹ");
  // /me/pay không có mã đợt thu: tự chuyển sang đợt đang mở
  await p.goto(`${BASE}/me/pay`);
  await p.waitForURL("**/me/pay/**");
  ok(true, "Quỹ: /me/pay chuyển sang đợt thu đang mở");
  await p.context().close();

  // ---- Lời mời (a022) ----
  p = await as("a022", PHONE);
  await p.goto(`${BASE}/invite/moi-a022`);
  const join = p.getByRole("button", { name: "Tham gia CLB" });
  await join.waitFor();
  const boxes = await p.evaluate(() => ["consent-keep", "consent-phone", "consent-age"].map((id) => document.getElementById(id).checked));
  ok(boxes.every((b) => !b), "Lời mời: ba ô đồng ý không đánh dấu sẵn");
  const t1 = await p.locator("body").innerText();
  ok(t1.includes("Phạm Quốc Bảo (chủ nhiệm) đã thêm bạn") && t1.includes("hoangnam.ly@example.com"), "Lời mời: người mời và email đang đăng nhập");
  await tall(p, "3-invite.png", PHONE);
  // Nút khóa bằng aria-disabled (vẫn bấm được để được đưa tới ô còn thiếu); Playwright coi là chưa bấm được nên phải ép.
  await join.click({ force: true });
  ok(await p.evaluate(() => document.activeElement?.id === "consent-keep"), "Lời mời: bấm khi thiếu ô bắt buộc thì đưa tới ô còn thiếu");
  ok(p.url().includes("/invite/"), "Lời mời: chưa đủ ô thì không tham gia");
  await p.check("#consent-keep");
  await join.click({ force: true });
  ok(await p.evaluate(() => document.activeElement?.id === "consent-age"), "Lời mời: còn thiếu ô 16 tuổi thì đưa tới ô đó");
  await p.getByRole("button", { name: "Không tham gia" }).click();
  ok(await waitText(p, /Bạn đã không tham gia/), "Lời mời: không tham gia");
  ok(await p.evaluate(() => document.activeElement?.textContent === "Bạn đã không tham gia"), "Lời mời: không tham gia xong, focus ở tiêu đề");
  await tall(p, "3b-invite-declined.png", PHONE);
  await p.getByRole("button", { name: "Xem lại lời mời" }).click();
  ok(await waitText(p, /mời bạn tham gia/), "Lời mời: xem lại lời mời");
  ok(await p.evaluate(() => document.activeElement?.textContent === "Không tham gia"), "Lời mời: xem lại xong, focus về nút Không tham gia");
  await p.context().close();
  // Lời mời của người khác, link sai
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/invite/moi-a022`);
  ok(await waitText(p, /Lời mời này gửi cho tài khoản khác/), "Lời mời: tài khoản khác bị chặn");
  await tall(p, "4-invite-wrong-account.png", PHONE);
  await p.goto(`${BASE}/invite/khong-co-ma-nay`);
  ok(await waitText(p, /Link mời không còn dùng được/), "Lời mời: link sai");
  await p.context().close();

  // ---- Danh sách CLB, trang CLB (p-bao-chau) ----
  p = await as("p-bao-chau", PHONE);
  await p.goto(`${BASE}/explore`);
  await p.getByRole("link", { name: "Xem và gửi đơn" }).first().waitFor();
  const t2 = await p.locator("body").innerText();
  ok(t2.includes("học kỳ Fall 2026") && t2.includes("Đơn của bạn gửi 30/09, đang chờ ban điều hành duyệt."), "Danh sách CLB: học kỳ, đơn đã gửi");
  await tall(p, "5-club-list.png", PHONE);
  await p.fill("#club-search", "vong lap");
  ok((await p.locator(".l-clubrow").count()) === 1, "Danh sách CLB: tìm không dấu");
  await p.fill("#club-search", "");
  await p.selectOption("#field-filter", "Học thuật, nghiên cứu");
  ok((await p.locator(".l-clubrow").count()) === 2, "Danh sách CLB: lọc theo lĩnh vực", String(await p.locator(".l-clubrow").count()));
  await p.selectOption("#field-filter", "all");
  await p.locator(".l-clubrow", { hasText: "CLB Lập trình Vòng Lặp" }).getByRole("link", { name: "Xem đơn của tôi" }).click();
  await p.waitForURL("**/explore/vong-lap");
  ok(await waitText(p, /Đã gửi đơn[\s\S]*đang chờ ban điều hành duyệt/) && (await p.locator("form").count()) === 0, "Trang CLB: đã gửi đơn thì không có form");
  await p.goto(`${BASE}/explore/gieo-mam`);
  ok(await waitText(p, /Tạm ngưng nhận đơn[\s\S]*Xem CLB khác ở Danh sách CLB/), "Trang CLB: tạm ngưng nhận đơn");
  await p.goto(`${BASE}/explore/cau-long-san-nha`);
  await p.getByRole("button", { name: "Gửi đơn" }).waitFor();
  await tall(p, "6-club-page.png", PHONE);
  ok(!(await p.isChecked("#consent-share")), "Trang CLB: ô đồng ý không đánh dấu sẵn");
  await p.getByRole("button", { name: "Gửi đơn" }).click();
  ok(await waitText(p, /Cần đồng ý cho ban điều hành xem thông tin/), "Trang CLB: thiếu đồng ý thì báo lỗi");
  await p.check("#consent-share");
  await p.fill("#application-reason", "Mình muốn đánh cầu đều mỗi tuần.");
  await p.getByRole("button", { name: "Gửi đơn" }).click();
  ok(await waitText(p, /Đã gửi đơn[\s\S]*đang chờ ban điều hành duyệt/), "Trang CLB: gửi đơn xong hiện trạng thái");
  ok(await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Đơn của bạn"), "Trang CLB: focus tới thẻ trạng thái");
  await tall(p, "7-club-page-applied.png", PHONE);
  await p.goto(`${BASE}/school`);
  ok(await waitText(p, /Trang này dành cho ban quản lý CLB của trường/), "Nhà trường: sinh viên bị chặn");
  await p.context().close();

  // ---- Nhà trường (p-thu-trang) ----
  p = await as("p-thu-trang", LAPTOP);
  await p.goto(`${BASE}/school`);
  await p.getByRole("button", { name: "Xuất Excel" }).first().waitFor();
  const t3 = await p.locator("body").innerText();
  ok(new RegExp(String.raw`${6 - inactiveClubsToday()}\s*CLB`).test(t3) && new RegExp(String.raw`${inactiveClubsToday()}\s*CLB`).test(t3) && /4\/6\s*CLB/.test(t3), `Các CLB: ba ô số ${6 - inactiveClubsToday()}, ${inactiveClubsToday()}, 4/6`);
  ok(t3.includes("800.000 / 6.050.000") && t3.includes("Quá 30 ngày"), "Các CLB: đã chi / dự trù, quá 30 ngày");
  await tall(p, "8-school-clubs.png", LAPTOP);
  await p.getByRole("button", { name: /Chưa nộp dự trù/ }).click();
  ok((await p.locator("tbody tr").count()) === 2, "Các CLB: lọc chưa nộp dự trù");
  await p.getByRole("button", { name: /Tất cả/ }).click();
  const csv = await readDownload(p, () => p.locator(".l-top").getByRole("button", { name: "Xuất Excel" }).click());
  ok(csv.name === "cac-clb.csv" && csv.text.trim().split(/\r?\n/).length === 7, "Các CLB: xuất Excel 6 CLB", csv.name);
  await p.getByRole("link", { name: /Khoản chờ duyệt/ }).click();
  await p.waitForURL("**/school/clubs/cau-long-san-nha");
  await p.getByRole("button", { name: "Duyệt", exact: true }).waitFor();
  ok(true, "Khoản chờ duyệt: mở CLB có khoản chờ");
  await tall(p, "9-club-detail.png", LAPTOP);
  const bud = await readDownload(p, () => p.getByRole("button", { name: "Tải bản dự trù" }).click());
  ok(bud.text.includes("Thuê sân sinh hoạt hằng tuần") && bud.text.includes("Tổng,6050000,800000"), "Chi tiết CLB: tải bản dự trù", bud.text.split(/\r?\n/).pop());
  await p.getByRole("button", { name: "Từ chối", exact: true }).click();
  ok(await waitText(p, /Cần ghi chú lý do khi từ chối/), "Chi tiết CLB: từ chối phải ghi chú");
  await p.fill("textarea", "Cần thêm báo giá của sân thứ hai để so.");
  await p.getByRole("button", { name: "Từ chối", exact: true }).click();
  ok(await waitText(p, /Không có khoản nào chờ bạn duyệt/), "Chi tiết CLB: từ chối xong, khoản rời danh sách chờ");
  ok(await p.evaluate(() => ![...document.querySelectorAll(".l-side .l-nav")].find((e) => e.textContent.includes("Khoản chờ duyệt"))?.querySelector(".l-cnt")), "Chi tiết CLB: số đếm của mục Khoản chờ duyệt về 0 (mục Duyệt tin có số đếm riêng)");
  await tall(p, "10-club-detail-done.png", LAPTOP);
  await p.goto(`${BASE}/school/clubs/vong-lap`);
  ok(await waitText(p, /Bản demo chỉ có dữ liệu chi tiết của/), "Chi tiết CLB: CLB chỉ có số tổng");
  await tall(p, "11-detail-totals.png", LAPTOP);
  await p.goto(`${BASE}/school/clubs/khong-co`);
  ok(await waitText(p, /Về danh sách CLB/), "Chi tiết CLB: CLB không có thì có lối về");
  await p.goto(`${BASE}/me`);
  ok(await waitText(p, /Trang này dành cho thành viên CLB/), "Của tôi: cán bộ trường thấy trang chặn có lối về trang nhà trường");
  await p.context().close();

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
