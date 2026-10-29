// Bấm thử các luồng chính của bản MVP (40 kiểm tra) trên Chrome chạy ngầm, từ chọn vai tới nhà trường.
// Chạy trong web/: npm run e2e:smoke (web cổng 3000, máy chủ cổng 4000 chế độ demo). Ảnh chụp ở e2e/screenshots/smoke/.
const fs = require("fs");
const path = require("path");

const { BASE, launch, outDir, inactiveClubsAfterCheckin, collectionSizeAfterApproval } = require("./common.cjs");
const OUT = outDir("smoke");
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const checks = [];
const check = (name, ok, extra = "") => checks.push(`${ok ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const skipped = [];
const skip = (name, why) => skipped.push(`BỎ QUA ${name} :: ${why}`);

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  const seen = new WeakSet();
  const attach = (p) => {
    if (seen.has(p)) return;
    seen.add(p);
    p.on("pageerror", (e) => errors.push(`pageerror ${p.url()} :: ${e.message}`));
    // 401, 403 từ API là luồng đúng (chưa đăng nhập, sai vai), không tính là lỗi.
    p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource: .*status of (400|401|403|409)/.test(m.text())) errors.push(`console ${p.url()} :: ${m.text()} @ ${m.location().url}`); });
    p.on("dialog", (d) => d.accept());
  };
  ctx.on("page", attach);
  const page = await ctx.newPage();
  attach(page);
  const body = async (p = page) => p.locator("body").innerText();
  const shot = async (name, p = page) => p.screenshot({ path: path.join(OUT, name), fullPage: true });
  const nav = async (label) => { const menu = page.getByRole("navigation", { name: "Menu ban điều hành" }); if ((await menu.locator("a", { hasText: label }).count()) === 0) { const fund = menu.getByRole("button", { name: /^Quỹ/ }); if (await fund.count()) await fund.click(); } const a = menu.locator("a", { hasText: label }).first(); const href = await a.getAttribute("href"); await a.click(); await page.waitForURL("**" + href); await page.waitForLoadState("networkidle"); };
  // Chờ chữ khớp mẫu xuất hiện trên trang: màn nối máy chủ chỉ đổi số sau khi API trả về.
  // body() đọc chữ ngay; waitText chờ tới khi chữ khớp xuất hiện (tối đa 10 giây).
  const waitText = (re, p = page) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: 10000 }).then(() => true).catch(() => false);
  // Bấm nút xác nhận trong hộp hỏi lại rồi chờ hộp đóng hẳn.
  async function confirmDialog(label, p = page) {
    const dialog = p.getByRole("alertdialog");
    await dialog.getByRole("button", { name: label, exact: true }).click();
    await dialog.waitFor({ state: "detached" });
  }
  // Đổi vai: đăng xuất, rồi đăng nhập bằng tài khoản mẫu của vai đó ở trang đăng nhập (bấm dòng của vai là điền sẵn),
  // rồi mở trang hay dùng của vai (thay trang chọn vai /demo đã bỏ ngày 05/10/2026).
  const ROLE_PAGE = {
    "Chủ nhiệm CLB": "/clubs/cau-long-san-nha", "Thủ quỹ": "/clubs/cau-long-san-nha/reconcile", "Trưởng ban": "/clubs/cau-long-san-nha/expenses",
    "Thành viên": "/me", "Thành viên mới được mời": "/invite/moi-a022", "Sinh viên chưa vào CLB": "/explore", "Ban quản lý CLB của trường": "/school",
  };
  async function choose(title, p = page) {
    await p.goto(BASE + "/login");
    await p.evaluate(() => fetch("/api/v1/auth/logout", { method: "POST" }));
    await p.goto(BASE + "/login");
    await p.locator(".l-auth-pick").filter({ has: p.locator("strong", { hasText: new RegExp(`^${title}$`) }) }).click();
    await p.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
    await p.goto(BASE + ROLE_PAGE[title]);
    await p.waitForLoadState("networkidle");
  }

  try {
    // ===== Chủ nhiệm =====
    await page.goto(BASE + "/login");
    await page.locator("button", { hasText: "Đặt lại dữ liệu mẫu" }).click();
    await confirmDialog("Đặt lại");
    await choose("Chủ nhiệm CLB");
    await page.waitForURL("**/clubs/cau-long-san-nha");
    await page.getByRole("heading", { name: "Cần bạn xử lý" }).waitFor();
    let t = await body();
    check("Trang chủ: quỹ thu gọn một dòng ở cuối, 2 khoản chờ duyệt", /Quỹ[\s\S]*3\.120\.000 ₫ · 2 khoản chờ duyệt/.test(t));
    check("Trang chủ: số dư 3.120.000 ₫", t.includes("3.120.000 ₫"));
    check("Trang chủ: 3 đơn xin vào", /3\s+Đơn xin vào CLB đang chờ duyệt/.test(t));
    check("Trang chủ: 2 khoản chi 650.000 ₫", /2\s+Khoản chi chờ duyệt · 650\.000 ₫/.test(t));
    check("Trang chủ: 4 giao dịch chưa khớp", /4\s+Giao dịch trong sao kê chưa khớp/.test(t));
    check("Trang chủ: dự trù không báo thiếu", !t.includes("đang thiếu"));
    await shot("01-club-home.png");

    // ===== Thành viên (đã nối máy chủ) =====
    await nav("Thành viên");
    await page.waitForURL("**/members");
    await page.getByRole("heading", { name: "Danh sách thành viên" }).waitFor();
    await page.locator("table.l-table tbody tr").first().waitFor();
    check("Thành viên: hiện 6 dòng", (await page.locator("table.l-table tbody tr").count()) === 6);
    await page.fill("#member-search", "minh anh");
    t = await page.locator("table.l-table tbody").innerText();
    check("Thành viên: tìm không dấu ra Nguyễn Minh Anh", t.includes("Nguyễn Minh Anh"), t.split("\n")[0]);
    await page.fill("#member-search", "");
    await page.locator(".l-app", { hasText: "Võ Thị Hồng Nhung" }).getByRole("button", { name: "Duyệt", exact: true }).click();
    check("Thành viên: duyệt đơn còn 2 đơn", await waitText(/Đơn xin vào đang chờ \(2\)/));
    await shot("02-members.png");

    // ===== Chiếu QR, điểm danh qua tab khác (đã nối máy chủ: mã QR do máy chủ ký) =====
    await nav("Trang chủ");
    await page.getByRole("link", { name: "Mở QR điểm danh" }).click();
    await page.waitForURL("**/events/tuan-5/qr");
    await page.getByRole("heading", { name: "Chưa mở điểm danh" }).waitFor();
    check("QR: mở màn chiếu chưa tự mở điểm danh", (await page.locator(".l-qr-svg svg").count()) === 0);
    await page.getByRole("button", { name: "Bắt đầu điểm danh" }).click();
    await page.waitForSelector(".l-qr-svg svg");
    check("QR: có mã QR thật", (await page.locator(".l-qr-svg svg").count()) === 1);
    const [p2] = await Promise.all([ctx.waitForEvent("page"), page.locator("a", { hasText: "Mở link điểm danh" }).click()]);
    await p2.setViewportSize({ width: 390, height: 844 });
    await p2.waitForURL("**/me/attendance**", { timeout: 15000 });
    check("Điểm danh: tab thành viên báo Đã điểm danh", await waitText(/Đã điểm danh/, p2));
    await shot("10-member-check-in.png", p2);
    check("QR: tab chiếu thấy tên người vừa điểm danh", await page.waitForFunction(() => document.querySelector(".l-att-list")?.textContent?.includes("Nguyễn Minh Anh"), null, { timeout: 10000 }).then(() => true).catch(() => false));
    await page.selectOption("#demo-as-person", "a009");
    const [p3] = await Promise.all([ctx.waitForEvent("page"), page.locator("a", { hasText: "Mở link điểm danh" }).click()]);
    check("Điểm danh: cùng điện thoại, người thứ hai bị chặn", await waitText(/Điện thoại này đã điểm danh cho người khác/, p3));
    await p3.close();
    await page.getByRole("button", { name: "Điểm danh tay" }).click();
    await page.locator(".l-att-list button", { hasText: "Điểm danh" }).first().click();
    const twoOf = await waitText(/\b2\s*\/\s*43\b/);
    await page.getByRole("button", { name: "Xong" }).click();
    t = await page.locator(".l-att").innerText();
    check("QR: điểm danh tay lên 2 người", twoOf, t.split("\n").slice(0, 3).join(" | "));
    await shot("03-qr.png");
    await p2.close();

    // ===== Đợt thu (đã nối máy chủ) =====
    await page.goto(BASE + "/clubs/cau-long-san-nha/collections/quy-fall-2026");
    await page.getByText(/Đang hiện \d+\/\d+/).waitFor();
    t = await body();
    check(`Đợt thu: ${collectionSizeAfterApproval()} người sau khi duyệt đơn (43 trước hạn 10/10, 42 sau hạn)`, t.includes(`Tất cả (${collectionSizeAfterApproval()})`));
    await page.getByRole("button", { name: /^Chưa đóng \(/ }).click();
    await page.locator("table.l-table tbody tr").first().getByRole("button", { name: "Ghi tiền mặt" }).click();
    await confirmDialog("Ghi vào sổ");
    check("Đợt thu: ghi tiền mặt lên 30 người", await waitText(/Đã đóng\s*30 người/));
    await shot("04-collection.png");

    // ===== Đối soát (đã nối máy chủ) =====
    await nav("Đối soát sao kê");
    await page.waitForURL("**/reconcile");
    await page.getByRole("heading", { name: /Cần gán tay/ }).waitFor();
    check("Đối soát: 4 cần gán tay", await waitText(/Cần bạn gán tay\s*4/));
    check("Đối soát: báo Ngọc đã đóng tiền mặt, phần của Ngọc ghi là đóng thừa", (await body()).includes("Đỗ Bảo Ngọc (đã đóng, ghi là đóng thừa)"));
    await page.getByRole("button", { name: "Ghi nhận cả hai" }).click();
    await confirmDialog("Ghi vào sổ");
    await waitText(/Cần bạn gán tay\s*3/);
    const sel = page.locator("select[id^=assign-]").first();
    await sel.selectOption("a033");
    await page.locator("tr", { has: sel }).getByRole("button", { name: "Ghi nhận", exact: true }).click();
    await confirmDialog("Ghi vào sổ");
    check("Đối soát: còn 2 cần gán tay", await waitText(/Cần bạn gán tay\s*2/));
    const csv = path.join(OUT, "sao-ke-test.csv");
    // Giống file ngân hàng xuất: số tiền có phần lẻ ".00", giờ có giây, có một dòng tiền ra phải bị bỏ qua
    fs.writeFileSync(csv, "\uFEFFNgày,Số tiền,Người chuyển,Nội dung\n02/10/2026 09:15:07,\"100,000.00\",LE NGOC ANH,QFALL26 A037\n02/10/2026 11:40:51,\"100,000.00\",AI DO,chuyen tien\n02/10/2026 12:00:00,\"-200,000.00\",CLB CAU LONG,THUE SAN TUAN 5\n");
    await page.setInputFiles("input[type=file]", csv);
    await waitText(/sao-ke-test\.csv/);
    await waitText(/Cần bạn gán tay\s*3/);
    t = await body();
    check("Đối soát: tải CSV mới, 1 khớp tự động, việc cũ còn treo vẫn hiện", /Khớp tự động\s*1\b/.test(t) && t.includes("sao-ke-test.csv") && /Cần bạn gán tay\s*3/.test(t) && t.includes("file trước"));
    check("Đối soát: đọc đúng số tiền có phần lẻ, bỏ dòng tiền ra", t.includes("2 giao dịch tiền vào") && !t.includes("10.000.000"));
    await shot("05-reconcile.png");

    // ===== Duyệt chi (chủ nhiệm, đã nối máy chủ) =====
    await nav("Đề xuất và duyệt chi");
    await page.locator("button.l-pick", { hasText: "Mua 2 ống cầu" }).click();
    check("Duyệt chi: chủ nhiệm không tự duyệt", await page.getByRole("button", { name: "Duyệt", exact: true }).isDisabled());
    await page.locator("button.l-pick", { hasText: "Thuê sân tuần 6–7" }).click();
    await page.getByRole("button", { name: "Từ chối", exact: true }).click();
    check("Duyệt chi: từ chối phải ghi chú", (await body()).includes("Cần ghi chú lý do khi từ chối."));
    await page.getByRole("button", { name: "Duyệt", exact: true }).click();
    await waitText(/Đã duyệt · chờ chi/);
    await page.getByRole("button", { name: "Đề xuất chi" }).click();
    await page.fill("#expense-content", "Nước uống buổi sinh hoạt");
    await page.fill("#expense-amount", "120000");
    await page.locator("button[type=submit]", { hasText: "Gửi" }).click();
    check("Duyệt chi: tạo đề xuất mới", await waitText(/Nước uống buổi sinh hoạt/) && await page.getByRole("heading", { name: "Nước uống buổi sinh hoạt" }).isVisible());
    await shot("06-expenses.png");

    // ===== Dự trù (đã nối máy chủ) =====
    await nav("Dự trù kỳ");
    await page.getByRole("heading", { name: "Các khoản dự trù" }).waitFor();
    t = await body();
    check("Dự trù: số dư cuối kỳ dương, không trừ hai lần", t.includes("Đủ chi"), (t.match(/Số dư cuối kỳ dự kiến\s*\n?([^\n]+)/) || [])[1]);
    check("Dự trù: số dư bằng đúng tiền đã vào tài khoản (3.620.000 ₫)", t.includes("3.620.000 ₫"), (t.match(/Số dư hiện tại\s*\n?([^\n]+)/) || [])[1]);
    await page.getByRole("button", { name: "Thêm hoạt động" }).click();
    await page.fill("#budget-name", "Mua lưới cầu lông");
    await page.fill("#budget-amount", "1500000");
    await page.locator("form button[type=submit]", { hasText: "Thêm" }).click();
    check("Dự trù: thêm khoản lớn thì báo thiếu", await waitText(/Đang thiếu/));
    await shot("07-budget.png");

    // ===== Bàn giao =====
    await nav("Bàn giao");
    await page.locator("button[type=submit]", { hasText: "Lưu và sang bước 5" }).click();
    // Lỗi giờ báo riêng dưới từng ô còn thiếu (chủ tài khoản mới đã chọn sẵn trong dữ liệu mẫu).
    check("Bàn giao: thiếu ngân hàng thì báo lỗi", (await body()).includes("Cần ghi ngân hàng."));
    await page.fill("#handover-bank", "[Ngân hàng thử]");
    await page.fill("#handover-account-number", "0123456789");
    await page.locator("button[type=submit]", { hasText: "Lưu và sang bước 5" }).click();
    check("Bàn giao: sang bước 5", await waitText(/Bước 5 \/ 7/));
    await shot("08-handover.png");

    // ===== Trưởng ban duyệt khoản của chủ nhiệm =====
    await choose("Trưởng ban");
    await page.waitForURL("**/expenses");
    await page.locator("button.l-pick", { hasText: "Mua 2 ống cầu" }).click();
    await page.getByRole("button", { name: "Duyệt", exact: true }).click();
    await waitText(/Đã duyệt · chờ chi/);
    await page.getByRole("tab", { name: "Đã duyệt" }).click();
    check("Trưởng ban: duyệt khoản của chủ nhiệm", (await page.locator(".l-tabs-list + *, [role=tabpanel]").first().innerText()).includes("Mua 2 ống cầu"));

    // ===== Thủ quỹ ghi đã chi =====
    await choose("Thủ quỹ");
    await page.waitForURL("**/reconcile");
    await nav("Đề xuất và duyệt chi");
    await page.getByRole("tab", { name: "Đã duyệt" }).click();
    await page.locator("button.l-pick", { hasText: "Mua 2 ống cầu" }).click();
    await page.getByRole("button", { name: "Ghi đã chi vào sổ quỹ" }).click();
    await confirmDialog("Ghi vào sổ");
    check("Thủ quỹ: ghi đã chi", await waitText(/Đã ghi vào sổ quỹ/));

    // ===== Nhà trường duyệt khoản trên 2 triệu (đã nối máy chủ) =====
    await choose("Ban quản lý CLB của trường");
    await page.waitForURL("**/school");
    check(`Nhà trường: 6 CLB, ${inactiveClubsAfterCheckin()} không hoạt động`, await waitText(new RegExp(String.raw`Tất cả \(6\)[\s\S]*Không hoạt động 30 ngày \(${inactiveClubsAfterCheckin()}\)`)));
    await shot("09-school.png");
    await page.locator("table a", { hasText: "Xem" }).first().click();
    await page.waitForURL("**/school/clubs/cau-long-san-nha");
    await page.getByRole("button", { name: "Duyệt", exact: true }).waitFor();
    await shot("09b-school-club-detail.png");
    await page.getByRole("button", { name: "Duyệt", exact: true }).click();
    check("Nhà trường: duyệt khoản 2.300.000 ₫", await waitText(/Không có khoản nào chờ bạn duyệt/));

    // ===== Sinh viên gửi đơn (điện thoại) =====
    await page.setViewportSize({ width: 390, height: 844 });
    await choose("Sinh viên chưa vào CLB");
    await page.waitForURL("**/explore");
    await shot("11-student-club-list.png");
    await page.locator("article", { hasText: "CLB Cầu lông Sân Nhà" }).locator("a", { hasText: "Xem và gửi đơn" }).click();
    await page.locator("button[type=submit]", { hasText: "Gửi đơn" }).click();
    check("Sinh viên: chưa đồng ý thì không gửi được", (await body()).includes("Cần đồng ý"));
    await page.check("#consent-share");
    await page.locator("button[type=submit]", { hasText: "Gửi đơn" }).click();
    check("Sinh viên: gửi đơn xong", await waitText(/đang chờ ban điều hành duyệt/));
    await shot("12-student-application.png");

    // ===== Thành viên mới nhận lời mời =====
    await choose("Thành viên mới được mời");
    await page.waitForURL("**/invite/moi-a022");
    await page.getByRole("button", { name: "Tham gia CLB" }).waitFor();
    check("Lời mời: nút tham gia khóa khi chưa đồng ý", (await page.getByRole("button", { name: "Tham gia CLB" }).getAttribute("aria-disabled")) === "true");
    await shot("13-member-invite.png");
    await page.check("#consent-keep");
    await page.check("#consent-age");
    await page.locator("button", { hasText: "Tham gia CLB" }).click();
    await page.waitForURL("**/me");
    check("Lời mời: vào trang Của tôi", await waitText(/Lý Hoàng Nam/));
    // Màn Lời mời đã nối máy chủ (04/10/2026): Nam nhận lời mời ở máy chủ, nên thấy khoản đã khớp ở bước đối soát.
    await page.locator(".l-tabs a", { hasText: "Quỹ" }).click();
    await page.waitForURL("**/me/pay/**");
    check("Đóng quỹ: Nam đã được ghi nhận ở bước đối soát", await waitText(/Đã đóng/));
    await choose("Thành viên");
    await page.waitForURL("**/me");
    await shot("15-member-me.png");
    await page.getByRole("heading", { name: "Dữ liệu của tôi" }).waitFor();
    await page.locator(".l-tabs a", { hasText: "Quỹ" }).click();
    await page.waitForURL("**/me/pay/**");
    await page.waitForSelector(".l-qr svg");
    check("Đóng quỹ: Minh Anh thấy mã QR và trạng thái chờ xác nhận", (await body()).toLowerCase().includes("chờ thủ quỹ xác nhận"));
    await shot("14-member-pay.png");
  } catch (e) {
    errors.push(`SCRIPT: ${e.message.split("\n")[0]}`);
    await shot("error.png").catch(() => {});
  }

  if (skipped.length) checks.push(...skipped);
  console.log(checks.join("\n"));
  console.log(`\n${checks.filter((c) => c.startsWith("OK")).length}/${checks.length - skipped.length} kiểm tra đạt${skipped.length ? `, ${skipped.length} bỏ qua` : ""}`);
  console.log(errors.length ? "LỖI TRÊN TRANG:\n" + errors.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})();
