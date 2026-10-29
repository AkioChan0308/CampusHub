// Kho bàn giao, bàn giao 7 bước, việc cần làm và nút Đăng xuất của thành viên (22/10/2026).
// Chạy trong web/: node e2e/handover-kit-tasks.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ).
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("handover-kit-tasks");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const C = `${BASE}/clubs/cau-long-san-nha`;

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
  const confirm = (p, name) => p.locator("[role=alertdialog]").getByRole("button", { name }).click();
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // ---- Kho bàn giao (chủ nhiệm) ----
  let p = await as("a001", LAPTOP);
  await p.goto(`${C}/handover-kit`);
  ok(await waitText(p, /5 biểu mẫu · 3 quy trình · 5 tài khoản · 1 mục thiếu/), "Kho bàn giao: tóm tắt 5 biểu mẫu, 3 quy trình, 5 tài khoản, 1 mục thiếu");
  await p.screenshot({ path: path.join(OUT, "1-kit-documents.png") });
  await p.getByRole("button", { name: "Quy trình", exact: true }).click();
  ok(await waitText(p, /Xin phòng họp[\s\S]*Chọn ngày giờ và số người dự kiến[\s\S]*Biểu mẫu đi kèm/), "Kho bàn giao: quy trình có bước đánh số và biểu mẫu đi kèm");
  await p.getByRole("button", { name: "Tài khoản và quyền truy cập" }).click();
  ok(await waitText(p, /CampusHub không lưu mật khẩu[\s\S]*Chưa có người giữ[\s\S]*Đứng tên cá nhân/), "Kho bàn giao: tài khoản có dòng không lưu mật khẩu, nhãn chưa có người giữ và đứng tên cá nhân");
  await p.getByRole("button", { name: "Sửa Email của CLB" }).click();
  await p.selectOption("#kit-acc-holder", "a003");
  await p.getByRole("button", { name: "Lưu tài khoản" }).click();
  ok(await waitText(p, /không thiếu mục nào/), "Kho bàn giao: điền người giữ cho Email thì hết mục thiếu");
  await p.getByRole("button", { name: "Biểu mẫu", exact: true }).click();
  await p.getByRole("button", { name: "Thêm biểu mẫu" }).first().click();
  await p.fill("#kit-doc-link", "javascript:alert(1)");
  await p.locator("form[aria-labelledby=kit-doc-title] button[type=submit]").click();
  ok(await waitText(p, /Cần ghi tên biểu mẫu\.[\s\S]*Cần chọn người giữ\.[\s\S]*Đường link phải bắt đầu bằng http/), "Kho bàn giao: form báo lỗi từng ô, chặn link javascript:");
  await p.fill("#kit-doc-name", "Mẫu mượn dụng cụ (dữ liệu thử)");
  await p.selectOption("#kit-doc-holder", "a002");
  await p.fill("#kit-doc-link", "https://example.com/muon-dung-cu");
  await p.locator("form[aria-labelledby=kit-doc-title] button[type=submit]").click();
  ok(await waitText(p, /6 biểu mẫu/), "Kho bàn giao: thêm biểu mẫu thì đếm thành 6");
  await p.fill("input[type=search]", "dung cu");
  ok(await waitText(p, /Mẫu mượn dụng cụ/) && !(await p.locator("body").innerText()).includes("Mẫu đề xuất chi"), "Kho bàn giao: tìm không dấu ra đúng biểu mẫu");
  await p.locator(".l-kit-row").getByRole("button", { name: /^Xóa biểu mẫu/ }).click();
  await confirm(p, "Xóa biểu mẫu");
  ok(await waitText(p, /5 biểu mẫu/), "Kho bàn giao: xóa có hộp hỏi lại, đếm về 5");
  await p.context().close();

  // ---- Kho bàn giao: thủ quỹ chỉ xem ----
  p = await as("a002", LAPTOP);
  await p.goto(`${C}/handover-kit`);
  ok(await waitText(p, /Chỉ chủ nhiệm, phó chủ nhiệm và trưởng ban sửa kho bàn giao\./) && (await p.getByRole("button", { name: "Thêm biểu mẫu" }).count()) === 0, "Kho bàn giao: thủ quỹ xem được, không có nút thêm sửa xóa");
  await p.context().close();

  // ---- Bàn giao: bước 4 → 6 (chủ nhiệm) ----
  p = await as("a001", LAPTOP);
  await p.goto(`${C}/handover`);
  ok(await waitText(p, /Bước 4 \/ 7[\s\S]*Ban mới Spring 2027[\s\S]*Chủ nhiệm: Nguyễn Minh Anh/), "Bàn giao: 7 bước, đang ở bước 4, có ban mới");
  await p.screenshot({ path: path.join(OUT, "2-handover-step-4.png") });
  await p.fill("#handover-bank", "[Ngân hàng thử]");
  await p.fill("#handover-account-number", "0123456789");
  await p.getByRole("button", { name: "Lưu và sang bước 5" }).click();
  ok(await waitText(p, /Bước 5 \/ 7[\s\S]*Còn 4 tài khoản bắt buộc chưa chuyển/), "Bàn giao: sang bước 5, còn 4 tài khoản bắt buộc chưa chuyển");
  ok(await p.getByRole("button", { name: "Tiếp tục" }).isDisabled(), "Bàn giao: chưa chuyển hết thì nút Tiếp tục bị khóa");
  for (const [i, name] of ["Fanpage Facebook", "Google Drive", "Email của CLB", "Tài khoản ngân hàng nhận quỹ"].entries()) {
    await p.getByRole("button", { name: `Ghi đã chuyển ${name}` }).click();
    const left = 3 - i;
    ok(left === 0 ? await p.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Tiếp tục" && !b.disabled), null, { timeout: 8000 }).then(() => true).catch(() => false) : await waitText(p, new RegExp(`Còn ${left} tài khoản bắt buộc chưa chuyển`)), `Bàn giao: chuyển ${name}`);
  }
  await p.screenshot({ path: path.join(OUT, "3-handover-step-5.png") });
  await p.getByRole("button", { name: "Tiếp tục" }).click();
  ok(await waitText(p, /Bước 6 \/ 7[\s\S]*Chờ Nguyễn Minh Anh xác nhận/) && (await p.getByRole("button", { name: "Tôi đã nhận bàn giao" }).count()) === 0, "Bàn giao: bước 6, chủ nhiệm cũ không có nút xác nhận");
  await p.context().close();

  // ---- Bàn giao: chủ nhiệm mới (thành viên thường) xác nhận ----
  p = await as("a017", LAPTOP);
  ok((await p.request.get(`${BASE}/api/v1/clubs/cau-long-san-nha/members`)).status() === 403, "Bàn giao: chủ nhiệm mới vẫn bị chặn ở trang ban điều hành khác");
  await p.goto(`${C}/handover`);
  ok(await waitText(p, /Tôi đã nhận bàn giao/), "Bàn giao: chủ nhiệm mới mở được trang Bàn giao");
  const menu = await p.locator("nav[aria-label='Menu ban điều hành']").innerText();
  ok(/Bàn giao/.test(menu) && /Kho bàn giao/.test(menu) && !/Thành viên|Đợt thu/.test(menu), "Bàn giao: menu của chủ nhiệm mới chỉ có Bàn giao và Kho bàn giao");
  ok((await p.getByRole("button", { name: "Xuất toàn bộ dữ liệu (Excel)" }).count()) === 0, "Bàn giao: chủ nhiệm mới không có nút xuất toàn bộ dữ liệu");
  await p.getByRole("button", { name: "Tôi đã nhận bàn giao" }).click();
  await confirm(p, "Tôi đã nhận bàn giao");
  ok(await waitText(p, /Biên bản bàn giao[\s\S]*Nguyễn Minh Anh xác nhận đã nhận bàn giao/), "Bàn giao: xác nhận xong sang bước 7, biên bản có dòng xác nhận");
  ok((await p.locator(".l-ho-log li").count()) >= 10 && (await p.getByRole("button", { name: /Quay lại bước/ }).count()) === 0, "Bàn giao: biên bản ghi đủ các bước và không còn nút quay lại");
  await p.screenshot({ path: path.join(OUT, "4-handover-record.png"), fullPage: true });
  await p.context().close();

  // ---- Bàn giao: quay lại bước trước và chọn lại chính mình (dữ liệu đặt lại) ----
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  p = await as("a001", LAPTOP);
  await p.goto(`${C}/handover`);
  for (const n of [3, 2, 1]) {
    await p.getByRole("button", { name: `Quay lại bước ${n}` }).waitFor({ timeout: 10000 });
    await p.getByRole("button", { name: `Quay lại bước ${n}` }).click();
    await confirm(p, `Quay lại bước ${n}`);
    ok(await waitText(p, new RegExp(`Bước ${n} / 7`)), `Bàn giao: quay lại bước ${n}`);
  }
  ok(await waitText(p, /Lưu và sang bước 2/), "Bàn giao: bước 1 có form chọn ban mới");
  await p.selectOption("#handover-president", "a001");
  await p.getByRole("button", { name: "Lưu và sang bước 2" }).click();
  ok(await waitText(p, /Bạn đang chọn lại chính mình làm chủ nhiệm/), "Bàn giao: chọn lại chính mình mà không xác nhận thì báo lỗi");
  await p.selectOption("#handover-president", "a017");
  await p.getByRole("button", { name: "Lưu và sang bước 2" }).click();
  ok(await waitText(p, /Bước 2 \/ 7[\s\S]*Thành viên chưa đóng quỹ: 11 người[\s\S]*2 khoản · 650\.000/), "Bàn giao: bước 2 hiện việc còn dở khớp dữ liệu mẫu");
  await p.getByRole("button", { name: "Chốt số dư" }).first().click();
  ok(await waitText(p, /Bước 3 \/ 7[\s\S]*1 mục còn thiếu[\s\S]*Còn 5 việc chưa xong/), "Bàn giao: chốt số dư, bước 3 hiện kho còn thiếu và việc còn dở");
  await p.getByRole("button", { name: "Tiếp tục" }).click();
  ok(await waitText(p, /Bước 4 \/ 7/), "Bàn giao: kiểm tra kho xong sang bước 4");
  await p.context().close();

  // ---- Việc cần làm (ban điều hành) ----
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  p = await as("a001", LAPTOP);
  await p.goto(`${C}/tasks`);
  ok(await waitText(p, /5 việc chưa xong · \d+ quá hạn/) && await waitText(p, /Chưa làm[\s\S]*Đang làm[\s\S]*Xong/), "Việc cần làm: ba cột trạng thái và số việc quá hạn");
  await p.screenshot({ path: path.join(OUT, "5-tasks.png") });
  await p.getByRole("button", { name: "Thêm việc" }).first().click();
  await p.locator("form[aria-labelledby=task-form] button[type=submit]").click();
  ok(await waitText(p, /Cần ghi tên việc\.[\s\S]*Cần chọn người phụ trách\.[\s\S]*Cần chọn hạn\./), "Việc cần làm: form báo lỗi từng ô");
  await p.fill("#task-title", "Gửi thư mời giải nội bộ (dữ liệu thử)");
  await p.selectOption("#task-assigneeId", "a007");
  await p.fill("#task-date", "2026-10-30");
  await p.selectOption("#task-eventId", "giai-noi-bo");
  await p.locator("form[aria-labelledby=task-form] button[type=submit]").click();
  ok(await waitText(p, /Gửi thư mời giải nội bộ \(dữ liệu thử\)[\s\S]*Nguyễn Hải Đăng/), "Việc cần làm: tạo việc giao cho Nguyễn Hải Đăng");
  await p.getByRole("button", { name: "Bắt đầu: Gửi thư mời giải nội bộ (dữ liệu thử)" }).click();
  ok(await waitText(p, /Gửi thư mời giải nội bộ \(dữ liệu thử\): đang làm\./), "Việc cần làm: bấm Bắt đầu thì việc sang Đang làm");
  await p.getByRole("button", { name: /^Quá hạn/ }).click();
  ok((await p.locator(".l-task-row").count()) >= 2 && !(await p.locator(".l-task-cols").innerText()).includes("Gửi thư mời giải nội bộ"), "Việc cần làm: lọc Quá hạn chỉ còn việc quá hạn");
  await p.context().close();

  // ---- Việc của tôi và Đăng xuất (thành viên, điện thoại) ----
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/me`);
  await p.getByRole("link", { name: "Việc được giao cho tôi" }).click();
  ok(await waitText(p, /Mua nước uống cho giải nội bộ[\s\S]*chưa làm/), "Việc của tôi: thấy việc được giao cho mình");
  ok(!(await p.locator("body").innerText()).includes("Đặt sân buổi giao lưu thứ Bảy"), "Việc của tôi: không thấy việc của người khác");
  await p.screenshot({ path: path.join(OUT, "6-my-tasks-phone.png") });
  await p.getByRole("button", { name: "Xong: Mua nước uống cho giải nội bộ" }).click();
  ok(await waitText(p, /Đã xong[\s\S]*Mua nước uống cho giải nội bộ/), "Việc của tôi: bấm Xong thì việc xuống mục Đã xong");
  ok((await p.request.post(`${BASE}/api/v1/clubs/cau-long-san-nha/tasks`, { data: { title: "x", assigneeId: "a017", due: "2026-10-30T23:59:00+07:00" } })).status() === 403, "Việc của tôi: thành viên thường không tạo được việc (máy chủ chặn)");
  await p.goto(`${BASE}/me`);
  await p.getByRole("button", { name: "Đăng xuất" }).click();
  await p.waitForURL("**/login", { timeout: 10000 });
  ok(await waitText(p, /Tài khoản mẫu/), "Của tôi: có nút Đăng xuất, bấm thì về trang đăng nhập");
  await p.context().close();

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
