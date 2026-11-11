// Đi qua từng vai và từng trạng thái của bàn giao (09/11/2026), chụp màn hình để người xem đọc từng ảnh và tìm chỗ bất hợp lý.
// Không kiểm tra đạt/không đạt, chỉ chụp ảnh vào e2e/screenshots/walkthrough-handover/. Chạy trong web/: node e2e/walkthrough-handover.cjs
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir, resetDemo } = require("./common.cjs");
const OUT = outDir("walkthrough-handover");
fs.mkdirSync(OUT, { recursive: true });
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const CLUB = `${BASE}/clubs/cau-long-san-nha`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const waitText = (p, re, t = 8000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
let n = 0;

(async () => {
  const browser = await launch();
  async function as(personId, size = LAPTOP) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  const shot = async (p, name) => { n++; const f = `${String(n).padStart(2, "0")}-${name}.png`; await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, f), fullPage: true }); console.log(f); };
  const call = (p, method, url, body) => p.evaluate(async ([m, u, b]) => { const r = await fetch("/api/v1" + u, { method: m, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); return r.status; }, [method, url, body]);
  await fetch(`${BASE}/api/v1/demo/reset?clean=1`, { method: "POST" });

  // 1. Mỗi vai mở menu Bàn giao
  for (const [id, name] of [["a001", "chunhiem"], ["a003", "phochunhiem"], ["a002", "thuquy"], ["a005", "truongban"], ["a017", "minhanh-chunhiemmoi-buoc4"], ["a006", "ngoclan-thanhvien"]]) {
    const p = await as(id);
    await p.goto(`${CLUB}/handover`);
    await waitText(p, /Bàn giao|Không|dành cho/);
    await shot(p, `${name}-trang-handover`);
    await p.goto(`${CLUB}/handover/roles`);
    await waitText(p, /Bàn giao từng vai|dành cho|Chưa/);
    await shot(p, `${name}-trang-roles`);
    await p.context().close();
  }

  // 2. Thủ quỹ gửi đơn, chủ nhiệm duyệt, các bước, người nhận (Ngọc Lan)
  const t = await as("a002");
  await t.goto(`${CLUB}/handover/roles`);
  await waitText(t, /Bàn giao vai của bạn/);
  await t.selectOption("#role-to", { label: "Võ Ngọc Lan" });
  await t.fill("#role-reason", "Sắp tốt nghiệp");
  await t.getByRole("button", { name: "Gửi đơn bàn giao" }).click();
  await waitText(t, /Chờ duyệt/);
  await shot(t, "thuquy-da-gui-don");
  const c = await as("a001");
  await c.goto(`${CLUB}/handover/roles`);
  await waitText(c, /Duyệt đơn/);
  await shot(c, "chunhiem-thay-don");
  await c.getByRole("button", { name: "Duyệt đơn" }).click();
  await c.locator("[role=alertdialog]").getByRole("button", { name: "Duyệt đơn" }).click();
  await waitText(c, /bước 2/);
  await t.goto(`${CLUB}/handover/roles`);
  await waitText(t, /Bước 2/);
  await shot(t, "thuquy-buoc2");
  await t.getByRole("button", { name: "Chốt số dư" }).click();
  await waitText(t, /Bước 3/);
  await t.fill("textarea[id^=note-]", "Báo cáo quỹ nộp trước ngày 15, mật khẩu Drive hỏi chủ nhiệm.");
  await shot(t, "thuquy-buoc3-loi-dan");
  await t.getByRole("button", { name: "Đã xem xong" }).click();
  await waitText(t, /Bước 4/);
  await shot(t, "thuquy-buoc4");
  await t.fill("input[id^=bank-]", "[Ngân hàng thử]");
  await t.fill("input[id^=account-]", "0123456789");
  await t.getByRole("button", { name: "Lưu và sang bước 5" }).click();
  await waitText(t, /Bước 5/);
  await shot(t, "thuquy-buoc5");
  await t.getByRole("button", { name: /Chuyển Tài khoản ngân hàng/ }).click();
  await t.getByRole("button", { name: "Xong bước 5" }).click();
  await waitText(t, /Chờ Võ Ngọc Lan/);
  await shot(t, "thuquy-cho-nguoi-nhan");
  const r = await as("a006", PHONE);
  await r.goto(`${CLUB}/handover/roles`);
  await waitText(r, /Vùng nguy hiểm/);
  await shot(r, "ngoclan-dien-thoai-buoc6");
  const rl = await as("a006");
  await rl.goto(`${CLUB}/handover/roles`);
  await waitText(rl, /Vùng nguy hiểm/);
  await shot(rl, "ngoclan-laptop-buoc6");
  const c2 = await as("a001");
  await c2.goto(`${CLUB}/handover/roles`);
  await waitText(c2, /Bước 6|bước 6/);
  await shot(c2, "chunhiem-thay-don-dang-chay-khong-thay-loi-dan");
  await rl.getByRole("button", { name: "Xác nhận đã nhận bàn giao" }).click();
  await rl.locator("[role=alertdialog]").getByLabel(/Gõ BAN GIAO/).fill("ban giao");
  await rl.locator("[role=alertdialog]").getByRole("button", { name: "Nhận vai" }).click();
  await waitText(rl, /Đã xong/);
  await shot(rl, "ngoclan-sau-khi-nhan-vai");
  await rl.goto(`${CLUB}`);
  await waitText(rl, /Trang chủ/);
  await shot(rl, "ngoclan-trang-chu-sau-khi-nhan-vai");
  await t.goto(`${CLUB}/handover/roles`);
  await shot(t, "thuquy-cu-sau-khi-giao");

  // 3. Chủ nhiệm đăng nhập: bàn giao cả ban và trang Thành viên (khối Các ban)
  await c.goto(`${CLUB}/handover`);
  await waitText(c, /Bàn giao nhiệm kỳ/);
  await shot(c, "chunhiem-handover-ca-ban");
  await c.goto(`${CLUB}/members`);
  await waitText(c, /Các ban/);
  await shot(c, "chunhiem-thanh-vien-cac-ban");

  // 4. Bàn giao hộ: chủ nhiệm gửi, mentor duyệt, người giữ vai thấy (thủ quỹ mới là Ngọc Lan)
  await c.goto(`${CLUB}/handover/roles`);
  await waitText(c, /Bàn giao hộ khi không liên lạc/);
  await shot(c, "chunhiem-roles-form-dong");
  await c.getByRole("button", { name: "Bàn giao hộ khi không liên lạc được" }).click();
  await c.selectOption("#proxy-pick", { label: "Thủ quỹ (Võ Ngọc Lan)" });
  await c.selectOption("#proxy-to", { label: "Nguyễn Minh Anh" });
  await c.fill("#proxy-reason", "Không liên lạc được từ đầu tháng");
  for (let i = 0; i < 3; i++) { await c.fill(`#proxy-date-${i}`, ["2026-11-01", "2026-11-03", "2026-11-06"][i]); await c.fill(`#proxy-result-${i}`, ["Không nghe máy", "Đã xem, không trả lời", "Không phản hồi"][i]); }
  await c.setInputFiles("#proxy-photo-0", { name: "tin-nhan.png", mimeType: "image/png", buffer: PNG });
  await c.getByRole("button", { name: /Gỡ ảnh tin-nhan\.png/ }).waitFor({ timeout: 8000 });
  await shot(c, "chunhiem-form-ban-giao-ho");
  await c.getByRole("button", { name: "Gửi yêu cầu bàn giao hộ" }).click();
  await waitText(c, /Chờ duyệt bằng chứng/);
  await shot(c, "chunhiem-da-gui-ban-giao-ho");
  const m = await as("p-thu-trang");
  await m.goto(`${BASE}/school/clubs/cau-long-san-nha`);
  await waitText(m, /Bàn giao hộ \(1\)/);
  await shot(m, "mentor-thay-ban-giao-ho");
  await m.getByRole("button", { name: "Duyệt bằng chứng" }).click();
  await m.locator("[role=alertdialog]").getByRole("button", { name: "Duyệt bằng chứng" }).click();
  await waitText(m, /Người giữ vai có đến/);
  const holder = await as("a006");
  await holder.goto(`${CLUB}/handover/roles`);
  await waitText(holder, /Tôi vẫn đảm nhận/);
  await shot(holder, "nguoi-giu-vai-thay-ban-giao-ho");
  // 5. Chuông thông báo của chủ nhiệm
  await c.goto(CLUB);
  await waitText(c, /Trang chủ/);
  await c.getByRole("button", { name: /Thông báo/ }).first().click().catch(() => {});
  await shot(c, "chunhiem-chuong-thong-bao");

  // 6. Chủ nhiệm mới ở bước 6 (bàn giao cả ban): laptop và điện thoại 390px
  await resetDemo(); // đợt bàn giao ở bước 4
  const api = async (method, p, body) => { const r = await fetch(`${BASE}/api/v1/clubs/cau-long-san-nha/handover${p}`, { method, headers: { "Content-Type": "application/json", "X-Demo-User": "a001" }, body: body ? JSON.stringify(body) : undefined }); if (!r.ok) throw new Error(`${method} ${p}: ${r.status}`); };
  await api("PUT", "/receiver", { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" });
  for (const a of ["kit-fanpage", "kit-drive", "kit-email", "kit-ngan-hang"]) await api("POST", `/accounts/${a}/transfer`, { holderId: "a017" });
  await api("POST", "/transfer-done");
  const nl = await as("a017");
  await nl.goto(`${CLUB}/handover`);
  await waitText(nl, /Vùng nguy hiểm/);
  await shot(nl, "chunhiem-moi-buoc6-laptop");
  const np = await as("a017", PHONE);
  await np.goto(`${CLUB}/handover`);
  await waitText(np, /Vùng nguy hiểm/);
  await shot(np, "chunhiem-moi-buoc6-dien-thoai-390");
  console.log("bề ngang trang trên điện thoại:", await np.evaluate(() => document.documentElement.scrollWidth), "(viewport 390)");

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
