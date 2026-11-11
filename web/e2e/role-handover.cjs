// Bàn giao từng vai (09/11/2026): thủ quỹ gửi đơn, chủ nhiệm duyệt (và từ chối kèm lý do), thủ quỹ làm các bước, người nhận xác nhận.
// Chạy trong web/: node e2e/role-handover.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ).
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("role-handover");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const ROLES = `${BASE}/clubs/cau-long-san-nha/handover/roles`;

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

  // ---- Thủ quỹ gửi đơn ----
  let t = await as("a002", LAPTOP);
  await t.goto(`${BASE}/clubs/cau-long-san-nha`);
  await t.locator("aside, nav").getByRole("link", { name: "Bàn giao", exact: true }).first().click();
  await t.waitForURL("**/handover/roles");
  ok(await t.evaluate(async () => (await fetch("/api/v1/clubs/cau-long-san-nha/handover")).status) === 403, "Thủ quỹ: menu Bàn giao vào thẳng Bàn giao từng vai; trang bàn giao cả ban bị chặn (403)");
  ok(await waitText(t, /Bàn giao vai của bạn[\s\S]*Bước 1 là gửi đơn lên chủ nhiệm/), "Thủ quỹ: trang Bàn giao từng vai, bước 1 là gửi đơn lên chủ nhiệm");
  ok((await t.locator("#role-pick").inputValue()) === "0", "Thủ quỹ: chỉ giữ một vai thì vai được chọn sẵn");
  await t.getByRole("button", { name: "Gửi đơn bàn giao" }).click();
  ok(await waitText(t, /Cần chọn người nhận/), "Thủ quỹ: thiếu người nhận thì báo lỗi");
  await t.selectOption("#role-to", { label: "Võ Ngọc Lan" });
  await t.fill("#role-reason", "Sắp tốt nghiệp");
  await t.getByRole("button", { name: "Gửi đơn bàn giao" }).click();
  ok(await waitText(t, /Vai thủ quỹ: Lê Thu Hà → Võ Ngọc Lan[\s\S]*Chờ chủ nhiệm duyệt/), "Thủ quỹ: đơn hiện ở trạng thái chờ chủ nhiệm duyệt");
  await shot(t, "1-request-sent.png");

  // ---- Chủ nhiệm: thông báo, từ chối (bắt buộc lý do), thủ quỹ gửi lại, duyệt ----
  const c = await as("a001", LAPTOP);
  await c.goto(ROLES);
  ok(await waitText(c, /Vai thủ quỹ: Lê Thu Hà → Võ Ngọc Lan[\s\S]*Duyệt đơn[\s\S]*Từ chối/), "Chủ nhiệm: thấy đơn chờ duyệt kèm nút Duyệt và Từ chối");
  await shot(c, "2-president-review.png");
  await c.getByRole("button", { name: /^Từ chối đơn bàn giao/ }).click();
  await c.getByRole("dialog").getByRole("button", { name: "Từ chối đơn" }).click();
  ok(await waitText(c, /Cần ghi lý do từ chối/), "Chủ nhiệm: từ chối không ghi lý do thì báo lỗi");
  await c.getByRole("dialog").getByLabel("Lý do").fill("Chưa có người thay thế phù hợp");
  await c.getByRole("dialog").getByRole("button", { name: "Từ chối đơn" }).click();
  ok(await waitText(c, /Bị từ chối[\s\S]*Chưa có người thay thế phù hợp/), "Chủ nhiệm: từ chối kèm lý do, đơn chuyển sang lịch sử");

  await t.goto(ROLES);
  ok(await waitText(t, /Bị từ chối[\s\S]*Chưa có người thay thế phù hợp/), "Thủ quỹ: thấy đơn bị từ chối kèm lý do");
  await t.selectOption("#role-pick", { label: "Thủ quỹ" });
  await t.selectOption("#role-to", { label: "Võ Ngọc Lan" });
  await t.fill("#role-reason", "Gửi lại sau khi chốt người thay");
  await t.getByRole("button", { name: "Gửi đơn bàn giao" }).click();
  ok(await waitText(t, /Đơn đang chạy \(1\)/), "Thủ quỹ: gửi lại đơn mới sau khi bị từ chối");

  await c.goto(ROLES);
  await c.getByRole("button", { name: "Duyệt đơn" }).click();
  await c.locator("[role=alertdialog]").getByRole("button", { name: "Duyệt đơn" }).click();
  ok(await waitText(c, /Đang bàn giao · bước 2 \/ 7/), "Chủ nhiệm: duyệt xong, đơn sang bước 2");

  // ---- Thủ quỹ làm bước 2 đến 5 ----
  await t.goto(ROLES);
  ok(await waitText(t, /Bước 2: Chốt số dư/), "Thủ quỹ: được duyệt thì sang bước 2 (chốt số dư)");
  await t.getByRole("button", { name: "Chốt số dư" }).click();
  ok(await waitText(t, /Bước 3: Kiểm tra phần đang giữ/), "Thủ quỹ: chốt số dư xong sang bước 3");
  ok(await waitText(t, /Tài khoản: Tài khoản ngân hàng nhận quỹ/), "Thủ quỹ: bước 3 liệt kê tên tài khoản đang giữ");
  await t.fill("textarea[id^=note-]", "Báo cáo quỹ nộp trước ngày 15.");
  await t.getByRole("button", { name: "Đã xem xong" }).click();
  ok(await waitText(t, /Bước 4: Đổi tài khoản nhận quỹ/), "Thủ quỹ: bước 4 đổi tài khoản nhận quỹ");
  await t.getByRole("button", { name: "Lưu và sang bước 5" }).click();
  ok(await waitText(t, /Cần ghi ngân hàng/), "Thủ quỹ: thiếu ngân hàng thì báo lỗi");
  await t.fill("input[id^=bank-]", "[Ngân hàng thử]");
  await t.fill("input[id^=account-]", "0123456789");
  await t.getByRole("button", { name: "Lưu và sang bước 5" }).click();
  ok(await waitText(t, /Bước 5: Chuyển quyền quản trị/), "Thủ quỹ: sang bước 5");
  await t.getByRole("button", { name: "Xong bước 5" }).click();
  ok(await waitText(t, /Còn 1 tài khoản bắt buộc chưa chuyển|Tài khoản ngân hàng nhận quỹ/), "Thủ quỹ: còn tài khoản bắt buộc thì chưa xong được bước 5");
  await t.getByRole("button", { name: /Chuyển Tài khoản ngân hàng nhận quỹ cho Võ Ngọc Lan/ }).click();
  await t.getByRole("button", { name: "Xong bước 5" }).click();
  ok(await waitText(t, /Chờ Võ Ngọc Lan xác nhận/), "Thủ quỹ: xong bước 5, chờ người nhận xác nhận");
  await shot(t, "3-giver-step6.png");

  // ---- Người nhận (thành viên thường) xác nhận ở bước 6, trên điện thoại ----
  const r = await as("a006", PHONE);
  await r.goto(ROLES);
  ok(await waitText(r, /Vùng nguy hiểm: nhận vai thủ quỹ/), "Người nhận (thành viên thường): mở được trang và thấy vùng xác nhận");
  ok(await waitText(r, /Lê Thu Hà để lại cho Võ Ngọc Lan[\s\S]*Lời dặn: Báo cáo quỹ nộp trước ngày 15\.[\s\S]*Tài khoản: Tài khoản ngân hàng nhận quỹ/), "Người nhận: thấy lời dặn và danh sách người giao để lại trước khi xác nhận");
  await shot(r, "4-receiver-phone.png");
  await r.getByRole("button", { name: "Xác nhận đã nhận bàn giao" }).click();
  const d = r.locator("[role=alertdialog]");
  const go = d.getByRole("button", { name: "Nhận vai" });
  ok(await go.isDisabled(), "Người nhận: chưa gõ BAN GIAO thì nút nhận vai khóa");
  await d.getByLabel(/Gõ BAN GIAO/).fill("ban giao");
  await go.click();
  ok(await waitText(r, /Đã xong · bước 7/), "Người nhận: xác nhận xong, đơn thành Đã xong");
  const me = await r.evaluate(async () => (await (await fetch("/api/v1/me")).json()).memberships.find((m) => m.clubId === "cau-long-san-nha").role);
  ok(me === "treasurer", "Người nhận: đã thành thủ quỹ");
  ok((await t.evaluate(async () => (await (await fetch("/api/v1/me")).json()).memberships.find((m) => m.clubId === "cau-long-san-nha").role)) === "member", "Người giao: đã về thành viên");
  ok((await r.request.post(`${BASE}/api/v1/clubs/cau-long-san-nha/role-handovers/khong-co/cancel`)).status() === 404, "API: hủy đơn không có thì 404");

  console.log(results.join("\n"));
  console.log(`\n${results.filter((x) => x.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
