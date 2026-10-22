// Nhóm C (22/10/2026): trợ lý bàn giao bản mẫu (hỏi đáp, tóm tắt, lưu vào biên bản), trang chủ ban điều hành mới, menu gom nhóm Quỹ,
// khung khóa thống kê và trang bản trả phí, khung quảng cáo mẫu, chữ trang đầu.
// Chạy trong web/: node e2e/assistant-dashboard.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ).
const fs = require("fs");
const path = require("path");
const { BASE, launch, outDir } = require("./common.cjs");
const OUT = outDir("assistant-dashboard");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const C = `${BASE}/clubs/cau-long-san-nha`;
const API = `${BASE}/api/v1/clubs/cau-long-san-nha`;

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
  const confirm = (p, name) => p.locator("[role=alertdialog]").getByRole("button", { name }).click();
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // ---- Trang chủ ban điều hành ----
  let p = await as("a001", LAPTOP);
  await p.goto(C);
  ok(await waitText(p, /Trang chủ[\s\S]*Việc cần làm[\s\S]*5 việc chưa xong · \d+ quá hạn[\s\S]*Bàn giao[\s\S]*Sự kiện sắp tới/), "Trang chủ: thứ tự việc cần làm, bàn giao, sự kiện sắp tới");
  ok(await waitText(p, /bước 4 \/ 7, đổi tài khoản nhận quỹ[\s\S]*Cần bạn xử lý[\s\S]*Thống kê tham gia[\s\S]*Có trong bản trả phí[\s\S]*Quỹ[\s\S]*3\.120\.000 ₫ · 2 khoản chờ duyệt/), "Trang chủ: bàn giao ở bước 4, khung khóa thống kê, quỹ thu gọn một dòng ở cuối");
  ok(await waitText(p, /Kho bàn giao: 5 biểu mẫu, 3 quy trình, 5 tài khoản · 1 mục thiếu/), "Trang chủ: kho bàn giao còn 1 mục thiếu");
  ok(await p.getByRole("progressbar", { name: "Tiến độ bàn giao" }).getAttribute("aria-valuenow") === "3", "Trang chủ: thanh tiến độ bàn giao (3 bước đã xong)");
  ok(await p.locator(".l-locked").getAttribute("aria-hidden") === "true", "Trang chủ: số thống kê bị làm mờ và ẩn với trình đọc màn hình");
  await p.screenshot({ path: path.join(OUT, "1-home.png"), fullPage: true });
  // Menu: Quỹ đóng mặc định, có tổng số việc chờ; bấm thì mở.
  const fundBtn = p.getByRole("button", { name: /^Quỹ/ });
  ok(await fundBtn.getAttribute("aria-expanded") === "false" && /6/.test(await fundBtn.innerText()), "Menu: nhóm Quỹ đóng mặc định, hiện tổng 6 việc đang chờ");
  ok((await p.getByRole("navigation", { name: "Menu ban điều hành" }).getByRole("link", { name: "Đợt thu" }).count()) === 0, "Menu: khi đóng thì không có link Đợt thu");
  await fundBtn.click();
  ok(await p.getByRole("navigation", { name: "Menu ban điều hành" }).getByRole("link", { name: "Đối soát sao kê" }).isVisible(), "Menu: bấm Quỹ thì hiện Đợt thu, Đối soát, Duyệt chi, Dự trù");
  await p.goto(`${C}/reconcile`);
  ok(await p.getByRole("button", { name: /^Quỹ/ }).getAttribute("aria-expanded") === "true", "Menu: đang ở trang của quỹ thì nhóm Quỹ tự mở");
  await p.goto(C);
  await p.getByRole("link", { name: "Tìm hiểu bản trả phí" }).click();
  ok(await waitText(p, /Bản trả phí[\s\S]*Chưa có giá[\s\S]*Không khóa phần cốt lõi[\s\S]*không phải AI/), "Bản trả phí: trang mô tả nói rõ chưa có giá, không khóa phần cốt lõi");
  await p.context().close();

  // ---- Trợ lý: hỏi đáp trong Kho bàn giao ----
  p = await as("a001", LAPTOP);
  await p.goto(`${C}/handover-kit`);
  await p.fill("#ai-question", "Mẫu xin phép sự kiện ở đâu?");
  await p.getByRole("button", { name: "Hỏi", exact: true }).click();
  ok(await waitText(p, /example\.com\/mau-xin-phep-su-kien[\s\S]*Nguồn:[\s\S]*Biểu mẫu: Mẫu xin phép tổ chức sự kiện/), "Hỏi đáp: trả lời từ kho, kèm nguồn");
  ok(await waitText(p, /Bản mẫu: câu trả lời lấy từ dữ liệu mẫu, chưa dùng AI thật[\s\S]*Đã hỏi 1 lượt trong kỳ này[\s\S]*mức giới hạn: chưa có/), "Hỏi đáp: ghi rõ bản mẫu, số lượt, mức giới hạn chưa có");
  await p.getByRole("button", { name: "Quy trình: Xin phép tổ chức sự kiện" }).click();
  ok(await p.locator("#kit-item-kit-xin-phep-su-kien").evaluate((e) => e.classList.contains("l-hl")) && await p.getByRole("button", { name: "Quy trình", exact: true }).getAttribute("aria-pressed") === "true", "Hỏi đáp: bấm nguồn thì mở đúng mục và tô nền");
  await p.fill("#ai-question", "Quy định về xe đạp điện là gì?");
  await p.getByRole("button", { name: "Hỏi", exact: true }).click();
  ok(await waitText(p, /Không tìm thấy trong kho bàn giao\./), "Hỏi đáp: không có trong kho thì nói thẳng");
  await p.fill("#ai-question", "Số dư quỹ bây giờ là bao nhiêu?");
  await p.getByRole("button", { name: "Hỏi", exact: true }).click();
  ok(await waitText(p, /Không trả lời về tiền, sổ quỹ, mật khẩu hay dữ liệu cá nhân/), "Hỏi đáp: câu hỏi về tiền bị từ chối");
  await p.fill("#ai-question", "ab");
  await p.getByRole("button", { name: "Hỏi", exact: true }).click();
  ok(await waitText(p, /Gõ câu hỏi dài hơn/), "Hỏi đáp: câu hỏi quá ngắn báo lỗi ngay");
  await p.screenshot({ path: path.join(OUT, "2-ask.png") });
  // Theo vai: thành viên thường hỏi về tài khoản thì không nhận gì.
  const a017 = await as("a017", LAPTOP);
  const asked = await a017.request.post(`${API}/ai/ask`, { data: { question: "Ai giữ quyền fanpage?" } });
  const body = await asked.json();
  ok(asked.status() === 200 && body.found === false && !JSON.stringify(body).includes("Phạm Quốc Bảo"), "Hỏi đáp theo vai: thành viên thường không nhận gì từ phần tài khoản");
  await a017.context().close();

  // ---- Trợ lý: tóm tắt, sửa, lưu vào biên bản; đi tới bước 6 và 7 ----
  await p.getByRole("button", { name: "Tóm tắt", exact: true }).click();
  ok(await waitText(p, /Bản mẫu, chưa dùng AI thật/) && !(await p.locator("body").innerText()).includes("AI viết, cần kiểm tra"), "Tóm tắt: bản mẫu chỉ có nhãn Bản mẫu, chưa dùng AI thật (không vừa nói AI viết vừa nói chưa dùng AI)");
  const draft = await p.locator("#ai-summary-text").inputValue();
  ok(/5 việc chưa xong/.test(draft) && /Email của CLB/.test(draft) && /chủ nhiệm Phạm Quốc Bảo/.test(draft), "Tóm tắt: nội dung tính từ dữ liệu của CLB");
  await p.getByRole("button", { name: "Đóng, không lưu" }).click();
  ok(!(await p.locator("body").innerText()).includes("Bản tóm tắt (sửa được)"), "Tóm tắt: đóng thì bỏ bản nháp");
  const call = (m, rel, data) => p.request.fetch(`${API}${rel}`, { method: m, data });
  await call("PUT", "/handover/receiver", { personId: "a006", bank: "[Ngân hàng thử]", account: "0123456789" });
  for (const a of ["kit-fanpage", "kit-drive", "kit-email", "kit-ngan-hang"]) await call("POST", `/handover/accounts/${a}/transfer`, { holderId: "a017" });
  await call("POST", "/handover/transfer-done");
  await p.goto(`${C}/handover`);
  ok(await waitText(p, /Bước 6 \/ 7/), "Bàn giao: tới bước 6");
  await p.getByRole("button", { name: "Tóm tắt", exact: true }).click();
  await p.waitForSelector("#ai-summary-text");
  await p.fill("#ai-summary-text", "Bản đã sửa tay: ưu tiên chuyển Fanpage và Drive trước.");
  await p.getByRole("button", { name: "Lưu vào biên bản" }).click();
  ok(await waitText(p, /Bản tóm tắt cho ban mới[\s\S]*Bản đã sửa tay: ưu tiên chuyển Fanpage[\s\S]*Lưu bởi Phạm Quốc Bảo[\s\S]*Bản mẫu, chưa dùng AI thật/), "Tóm tắt: lưu vào biên bản, ghi ai lưu và bản mẫu");
  await p.screenshot({ path: path.join(OUT, "3-step-6-summary.png"), fullPage: true });
  await p.context().close();
  const a017b = await as("a017", LAPTOP);
  await a017b.goto(`${C}/handover`);
  ok(await waitText(a017b, /Tôi đã nhận bàn giao/) && (await a017b.getByRole("button", { name: "Tóm tắt", exact: true }).count()) === 0, "Tóm tắt: chủ nhiệm mới thấy bản đã lưu, không có nút Tóm tắt");
  await a017b.getByRole("button", { name: "Tôi đã nhận bàn giao" }).click();
  await confirm(a017b, "Tôi đã nhận bàn giao");
  ok(await waitText(a017b, /Biên bản bàn giao[\s\S]*Bản tóm tắt cho ban mới[\s\S]*Bản đã sửa tay[\s\S]*lưu bản tóm tắt cho ban mới vào biên bản \(bản mẫu, chưa dùng AI thật\)/), "Biên bản: có bản tóm tắt và dòng lưu bản tóm tắt");
  const locked = await a017b.request.put(`${API}/handover/summary`, { data: { text: "Muộn rồi" } });
  ok(locked.status() === 403, "Biên bản: người không phải ban điều hành không lưu được bản tóm tắt");
  await a017b.context().close();

  // ---- Khung quảng cáo mẫu ----
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/me`);
  ok(await waitText(p, /Được tài trợ[\s\S]*Chỗ đặt quảng cáo \(ví dụ\)/), "Quảng cáo mẫu: có ở trang chủ thành viên, có nhãn Được tài trợ");
  const box = await p.locator(".l-sponsor").boundingBox();
  ok(!!box && box.height < 844 * 0.3, "Quảng cáo mẫu: cao dưới 30% màn hình", `${Math.round(box?.height ?? 0)}px`);
  await p.screenshot({ path: path.join(OUT, "4-sponsored-me.png") });
  await p.getByRole("button", { name: "Ẩn quảng cáo này" }).click();
  ok((await p.locator(".l-sponsor").count()) === 0, "Quảng cáo mẫu: Ẩn quảng cáo này thì khung biến mất");
  await p.goto(`${BASE}/me/pay/quy-fall-2026`);
  await waitText(p, /Đóng quỹ|Quỹ học kỳ/);
  ok((await p.locator(".l-sponsor").count()) === 0, "Quảng cáo mẫu: không có ở màn tiền (đóng quỹ)");
  await p.context().close();
  p = await as("p-bao-chau", PHONE);
  await p.goto(`${BASE}/explore`);
  ok(await waitText(p, /Được tài trợ/) && (await p.locator(".l-rows > article").count()) >= 2 && await p.locator(".l-rows > *:nth-child(3)").evaluate((e) => e.classList.contains("l-sponsor")), "Quảng cáo mẫu: nằm xen giữa danh sách CLB (sau hai CLB)");
  await p.screenshot({ path: path.join(OUT, "5-sponsored-explore.png") });
  await p.context().close();

  // ---- Trang đầu ----
  const ctx = await browser.newContext({ viewport: LAPTOP, reducedMotion: "reduce", locale: "vi-VN" });
  const land = await ctx.newPage();
  await land.goto(BASE);
  ok(await waitText(land, /Bộ bàn giao cho ban điều hành CLB, dùng cạnh Google Sheets[\s\S]*Điểm danh bằng mã QR và ghi sổ quỹ đi kèm/), "Trang đầu: câu mở đầu theo định vị bộ bàn giao");
  await ctx.close();

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
