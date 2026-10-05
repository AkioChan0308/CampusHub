// Trang đầu, đăng nhập bằng mật khẩu, đăng ký, đặt tên tài khoản và mật khẩu (làm ngày 05/10/2026).
// Chạy trong web/: node e2e/dang-nhap.cjs (web cổng 3000, máy chủ cổng 4000 chế độ demo, nên chạy bằng npm start).
// Tài khoản và mật khẩu trong script là của người trong dữ liệu mẫu.
const path = require("path");
const { BASE, launch, outDir } = require("./chung.cjs");
const OUT = outDir("dang-nhap");
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

(async () => {
  const browser = await launch();
  const errs = [];
  async function page(size) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    p.on("console", (m) => { if (m.type() === "error" && !/status of (401|404|409|429|400)|favicon|React DevTools|HMR/.test(m.text())) errs.push(`${p.url()} :: ${m.text().slice(0, 240)}`); });
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    return p;
  }
  const api = (p, method, url, body) => p.evaluate(async ([m, u, b]) => {
    const r = await fetch(`/api/v1${u}`, { method: m, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    return r.status;
  }, [method, url, body]);
  // Người có tài khoản mẫu (bản demo) đã có mật khẩu: gửi kèm mật khẩu mẫu làm mật khẩu hiện tại (người chưa có thì máy chủ bỏ qua).
  const setAccount = async (p, personId, name, username, password) => {
    await api(p, "POST", "/auth/dev-login", { personId });
    const s = await api(p, "PUT", "/me/account", { name, username, password, currentPassword: "CauLong#2026" });
    await api(p, "POST", "/auth/logout");
    return s;
  };
  const fillLogin = async (p, login, password) => {
    await p.getByLabel("Tên tài khoản hoặc email").fill(login);
    await p.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await p.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  };
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  try {
    // ---- Trang đầu cho người chưa đăng nhập ----
    let p = await page(LAPTOP);
    await p.goto(`${BASE}/`);
    await p.getByRole("heading", { level: 1, name: "Cả tuần của CLB, trên một cuốn lịch." }).waitFor();
    ok((await p.locator("video").count()) === 2, "Trang đầu: có hai video demo");
    ok(!!(await p.getByRole("button", { name: "Phát video" }).first().isVisible()), "Trang đầu: giảm chuyển động thì video đứng yên, có nút Phát video");
    await p.getByRole("link", { name: "Đăng ký", exact: true }).click();
    await p.waitForURL("**/register");
    ok(true, "Trang đầu: nút Đăng ký mở /register");
    await p.screenshot({ path: path.join(OUT, "01-dang-ky.png"), fullPage: true });

    // ---- Bản demo: không còn trang chọn vai; tài khoản mẫu dưới ô đăng nhập, bấm là điền sẵn ----
    const gone = await p.goto(`${BASE}/demo`);
    ok(gone.status() === 404, "Trang chọn vai /demo đã bỏ", `status=${gone.status()}`);
    await p.goto(`${BASE}/login`);
    const picks = p.locator(".l-auth-pick");
    await picks.first().waitFor();
    ok((await picks.count()) === 7, "Tài khoản mẫu: đủ 7 vai", `${await picks.count()}`);
    await picks.filter({ has: p.locator("strong", { hasText: /^Thủ quỹ$/ }) }).click();
    ok((await p.getByLabel("Tên tài khoản hoặc email").inputValue()) === "thuha" && (await p.getByLabel("Mật khẩu", { exact: true }).inputValue()) === "CauLong#2026", "Tài khoản mẫu: bấm vai là điền sẵn tên và mật khẩu");
    ok(await p.getByRole("button", { name: "Đăng nhập", exact: true }).evaluate((b) => b === document.activeElement), "Tài khoản mẫu: focus sang nút Đăng nhập");
    await p.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    ok(await p.waitForURL("**/clubs/cau-long-san-nha", { timeout: 15000 }).then(() => true).catch(() => false), "Tài khoản mẫu: thủ quỹ vào trang chủ CLB", p.url());
    await p.screenshot({ path: path.join(OUT, "00-tai-khoan-mau.png"), fullPage: true });
    await api(p, "POST", "/auth/logout");

    // ---- Lỗi Google: máy chủ gửi mã, web hiện câu có sẵn; chữ tự viết trong link không hiện ra ----
    await p.goto(`${BASE}/login?loi=huy`);
    await p.locator(".l-alert").first().waitFor();
    ok((await p.locator(".l-alert").first().innerText()) === "Bạn đã hủy đăng nhập Google.", "Lỗi Google: mã ra đúng câu");
    await p.goto(`${BASE}/login?loi=${encodeURIComponent("Tài khoản bị khóa, gọi số 0900 000 000")}`);
    await p.locator(".l-alert").first().waitFor();
    const fake = await p.locator(".l-alert").first().innerText();
    ok(fake === "Đăng nhập chưa xong. Bạn thử lại." && !(await p.locator("body").innerText()).includes("0900"), "Lỗi Google: chữ lạ trong link không hiện ra", fake);

    // ---- Đặt mật khẩu cho tài khoản mẫu (qua API), đăng nhập sai rồi đúng ----
    ok((await setAccount(p, "a022", "Lý Hoàng Nam", "hoangnam", "SanNha@2026!")) === 200, "Đặt tên tài khoản và mật khẩu qua API");
    await p.goto(`${BASE}/login?next=%2Finvite%2Fmoi-a022`);
    await fillLogin(p, "hoangnam", "SaiRoi@1234");
    const alert = p.locator(".l-alert");
    await alert.waitFor();
    ok((await alert.innerText()).includes("không đúng"), "Sai mật khẩu: báo chung một câu", await alert.innerText());
    ok((await p.getByLabel("Mật khẩu", { exact: true }).inputValue()) === "", "Sai mật khẩu: xóa ô mật khẩu");
    await fillLogin(p, "HoangNam", "SanNha@2026!");
    ok(await p.waitForURL("**/invite/moi-a022", { timeout: 15000 }).then(() => true).catch(() => false), "Đúng mật khẩu (tên viết hoa): về đúng trang next", p.url());

    // ---- Đã đăng nhập mà mở trang đầu: chuyển về trang của mình ----
    await p.goto(`${BASE}/`);
    ok(await p.waitForURL("**/invite/moi-a022", { timeout: 15000 }).then(() => true).catch(() => false), "Đã đăng nhập mở /: chuyển về trang của mình", p.url());

    // ---- Đổi mật khẩu khi đã có: phải nhập mật khẩu hiện tại ----
    await p.goto(`${BASE}/account?next=%2Fme`);
    await p.getByLabel("Mật khẩu hiện tại").waitFor();
    ok(true, "Đã có mật khẩu: hỏi mật khẩu hiện tại");
    await p.getByLabel("Mật khẩu mới").fill("ngan");
    await p.getByRole("button", { name: "Lưu" }).click();
    ok((await p.locator(".l-error").count()) >= 3, "Form: báo lỗi dưới từng ô (mật khẩu hiện tại, mật khẩu mới, nhập lại)");
    ok(await p.locator("#tk-password-goi-y").isVisible() && (await p.getByLabel("Mật khẩu mới").getAttribute("aria-describedby")) === "tk-password-loi tk-password-goi-y", "Mật khẩu sai luật: vẫn thấy dòng luật dưới câu báo lỗi");
    await p.getByLabel("Mật khẩu hiện tại").fill("KhongDung@99");
    await p.getByLabel("Mật khẩu mới").fill("MoiHon#2026x");
    await p.getByLabel("Nhập lại mật khẩu").fill("MoiHon#2026x");
    await p.getByRole("button", { name: "Lưu" }).click();
    ok(await p.getByText("Mật khẩu hiện tại không đúng.").waitFor({ timeout: 8000 }).then(() => true).catch(() => false), "Sai mật khẩu hiện tại: máy chủ báo dưới ô");
    await p.screenshot({ path: path.join(OUT, "02-doi-mat-khau.png"), fullPage: true });
    await p.context().close();

    // ---- Lần đầu đăng ký (giả lập bằng đăng nhập nhanh): gợi ý tên tài khoản, Lưu, rồi đăng nhập bằng email ----
    // Võ Hoàng Long (a018): không có trong danh sách tài khoản mẫu nên chưa có mật khẩu, như người vừa đăng ký.
    p = await page(PHONE);
    await p.goto(`${BASE}/login`);
    await api(p, "POST", "/auth/dev-login", { personId: "a018" });
    await p.goto(`${BASE}/account?moi=1&next=%2Flogin%3Fxong%3D1`);
    const user = p.getByLabel("Tên tài khoản", { exact: true });
    await user.waitFor();
    ok((await user.inputValue()) === "hoanglong.vo", "Đăng ký mới: gợi ý tên tài khoản từ email", await user.inputValue());
    ok(await p.getByRole("link", { name: "Để sau" }).isVisible(), "Đăng ký mới: có nút Để sau");
    await p.getByLabel("Mật khẩu", { exact: true }).fill("Hoanglong.vo#1");
    await p.getByLabel("Nhập lại mật khẩu").fill("Hoanglong.vo#1");
    await p.getByRole("button", { name: "Lưu" }).click();
    ok((await p.locator("#tk-password-loi").innerText().catch(() => "")).includes("không được chứa"), "Mật khẩu chứa tên tài khoản: bị chặn");
    await p.getByLabel("Mật khẩu", { exact: true }).fill("CauLong#2026");
    await p.getByLabel("Nhập lại mật khẩu").fill("CauLong#2026");
    await p.getByRole("button", { name: "Lưu" }).click();
    ok(await p.waitForURL("**/me", { timeout: 15000 }).then(() => true).catch(() => false), "Lưu xong: về trang của mình", p.url());
    const loginBox = p.locator("section[aria-labelledby=dang-nhap]");
    ok(await loginBox.getByText("hoanglong.vo", { exact: true }).waitFor({ timeout: 10000 }).then(() => true).catch(() => false), "Của tôi: hiện tên tài khoản");
    await p.screenshot({ path: path.join(OUT, "03-cua-toi.png"), fullPage: true });
    await api(p, "POST", "/auth/logout");
    await p.goto(`${BASE}/login`);
    await fillLogin(p, "hoanglong.vo@example.com", "CauLong#2026");
    ok(await p.waitForURL("**/me", { timeout: 15000 }).then(() => true).catch(() => false), "Đăng nhập bằng email và mật khẩu", p.url());
    await api(p, "POST", "/auth/logout");

    // ---- Để sau: không lưu gì, đi tiếp ----
    await api(p, "POST", "/auth/dev-login", { personId: "a004" });
    await p.goto(`${BASE}/account?moi=1&next=%2Fme`);
    await p.getByRole("link", { name: "Để sau" }).click();
    ok(await p.waitForURL("**/me", { timeout: 15000 }).then(() => true).catch(() => false), "Để sau: đi tiếp tới trang next", p.url());
    await api(p, "POST", "/auth/logout");

    // ---- Sai 5 lần thì khóa 15 phút ----
    ok((await setAccount(p, "a009", "Người mẫu a009", "thu.khoa", "KhoaThu#2026")) === 200, "Đặt mật khẩu cho tài khoản thử khóa");
    await p.goto(`${BASE}/login`);
    for (let i = 0; i < 5; i++) {
      await fillLogin(p, "thu.khoa", `Sai#Lan${i}xx`);
      await p.getByRole("button", { name: "Đăng nhập", exact: true }).and(p.locator(":not([aria-busy])")).waitFor();
    }
    const locked = await p.locator(".l-alert").innerText();
    ok(locked.includes("5 lần"), "Sai 5 lần: báo khóa kèm giờ thử lại", locked);
    await fillLogin(p, "thu.khoa", "KhoaThu#2026");
    await p.waitForTimeout(1500);
    ok(p.url().includes("/login") && (await p.locator(".l-alert").innerText()).includes("5 lần"), "Đang khóa: mật khẩu đúng cũng chưa vào được");
    await p.context().close();
  } catch (e) {
    results.push(`LOI SCRIPT: ${e.message.split("\n")[0]}`);
  }

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})();
