// Các lỗi phía web tìm ra ngày 05/10/2026 (mỗi phần tái hiện một lỗi, viết trước khi sửa):
// 1. đợt thu cũ đối soát được khi CLB có hai đợt; 6. link QR mất ?e=&t= khi phải đăng nhập; 7. lỗi 409 thì tải lại dữ liệu,
// báo đã chuyển xong thì trang Của tôi đổi ngay; 8. "Ghi nhận" ở đối soát hỏi lại, nhận ra "đã đóng" theo trạng thái máy chủ.
// Chạy trong web/: node e2e/sua-loi.cjs (web cổng 3000, máy chủ cổng 4000 chế độ demo, nên chạy bằng npm start).
const path = require("path");
const { BASE, launch, outDir } = require("./chung.cjs");
const OUT = outDir("sua-loi");
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 4000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const C = "/clubs/cau-long-san-nha";

(async () => {
  const browser = await launch();
  const errs = [];
  async function as(personId, size) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    p.on("console", (m) => { if ((m.type() === "error" || m.type() === "warning") && !/status of (401|403|404|409|400)|favicon|React DevTools|HMR|Reduced Motion/.test(m.text() + JSON.stringify(m.location()))) errs.push(`${p.url()} :: ${m.text().slice(0, 240)}`); });
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    await p.goto(`${BASE}/login`);
    if (personId) await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  const api = (p, method, url, body) => p.evaluate(async ([m, u, b]) => {
    const r = await fetch(`/api/v1${u}`, { method: m, headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    return r.status;
  }, [method, url, body]);
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // ---- 6. Link QR khi chưa đăng nhập: sang trang đăng nhập mà giữ đủ ?e=&t= ----
  let p = await as(null, PHONE);
  await p.goto(`${BASE}/checkin?e=tuan-5&t=ma-thu`);
  await p.waitForURL("**/login?**", { timeout: 10000 }).catch(() => {});
  const next = new URL(p.url()).searchParams.get("next");
  ok(next === "/checkin?e=tuan-5&t=ma-thu", "6. Link QR: chuyển sang đăng nhập vẫn giữ ?e=&t=", `next=${next}`);
  await p.context().close();

  // ---- 7a. Lỗi 409 (người khác vừa ghi tiền) thì màn tự tải lại ----
  p = await as("a002", LAPTOP);
  await p.goto(`${BASE}${C}/collections/quy-fall-2026`);
  const huy = p.getByRole("row").filter({ hasText: "Dương Quốc Huy" });
  await huy.getByRole("button", { name: "Ghi tiền mặt" }).waitFor();
  ok(await api(p, "POST", `${C}/collections/quy-fall-2026/payments/a033`, { method: "cash" }) === 200, "7a. Chuẩn bị: tab khác ghi tiền mặt cho Huy");
  await huy.getByRole("button", { name: "Ghi tiền mặt" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Ghi vào sổ" }).click();
  // Màn tự tải lại: số người đã đóng lên 30 (Huy đã đóng nên xuống cuối danh sách, ra khỏi các dòng hiện sẵn).
  ok(await waitText(p, /Đã đóng \(30\)/), "7a. Lỗi 409: màn tự tải lại, đã đóng lên 30 người");
  await p.screenshot({ path: path.join(OUT, "1-dot-thu-sau-409.png") });

  // ---- 8. Đối soát: nhận ra "đã đóng" theo trạng thái; "Ghi nhận" hỏi lại ----
  // Vy (A030, chuyển thiếu 50.000 ₫) vừa đóng tiền mặt sau khi tải sao kê: lý do vẫn ghi "Thiếu 50.000 ₫",
  // nhưng máy chủ báo Vy đã đóng, nên dòng này phải chọn tay, không có nút ghi nhận ngay.
  await api(p, "POST", `${C}/collections/quy-fall-2026/payments/a030`, { method: "cash" });
  await p.goto(`${BASE}${C}/reconcile`);
  const vy = p.getByRole("row").filter({ hasText: "BUI KHANH VY" });
  await vy.waitFor();
  ok(await vy.getByRole("combobox").isVisible().catch(() => false), "8. Người được gợi ý đã đóng (theo trạng thái máy chủ, không theo chữ của lý do): dòng của Vy chọn tay");
  // Chuyển hộ Ngọc và Nam: bấm "Ghi nhận cả hai" thì hỏi lại trước khi ghi vào sổ.
  const khoa = p.getByRole("row").filter({ hasText: "TRAN VAN KHOA" });
  await khoa.getByRole("button", { name: "Ghi nhận cả hai" }).click();
  const dialog = p.getByRole("alertdialog");
  ok(await dialog.isVisible().catch(() => false), "8. Bấm \"Ghi nhận cả hai\": hỏi lại trước khi ghi vào sổ");
  await p.screenshot({ path: path.join(OUT, "2-doi-soat-hoi-lai.png") });
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole("button", { name: "Ghi vào sổ" }).click();
    ok(await khoa.getByText(/Đã ghi nhận: Đỗ Bảo Ngọc, Lý Hoàng Nam/).waitFor({ timeout: 5000 }).then(() => true).catch(() => false), "8. Xác nhận xong: dòng chuyển hộ đã ghi nhận");
  }

  // ---- 1. CLB có hai đợt thu: đợt cũ vẫn mở được màn đối soát ----
  const created = await api(p, "POST", `${C}/collections`, {
    name: "Áo CLB", amount: 150_000, dueDate: "2026-10-25T23:59:00+07:00", codePrefix: "QAO26", receiverId: "a002", accountName: "Lê Thu Hà", bank: "[ngân hàng]", account: "0123456789",
  });
  ok(created === 201, "1. Chuẩn bị: tạo đợt thu thứ hai (Áo CLB)", String(created));
  await p.goto(`${BASE}${C}/collections/quy-fall-2026`);
  await p.getByRole("link", { name: "Đối soát sao kê" }).first().waitFor();
  await p.locator("main").getByRole("link", { name: "Đối soát sao kê" }).click();
  ok(await waitText(p, /Đợt thu: Quỹ học kỳ Fall 2026/, 8000), "1. Từ đợt Fall bấm \"Đối soát sao kê\": màn đối soát là đợt Fall, không phải đợt mới nhất");
  // Menu bên trái vẫn mở đợt tạo gần nhất.
  await p.goto(`${BASE}${C}/reconcile`);
  ok(await waitText(p, /Đợt thu: Áo CLB/, 8000), "1. Mở từ menu: đối soát đợt tạo gần nhất (Áo CLB)");

  await p.context().close();

  // ---- 7b. Báo đã chuyển xong, trang Của tôi đổi ngay (không chờ hết thời gian lưu tạm) ----
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/me`);
  ok(await waitText(p, /Chưa đóng/, 8000), "7b. Chuẩn bị: Của tôi ghi \"Chưa đóng\"");
  await p.getByRole("link", { name: "Quỹ" }).click();
  await p.getByRole("button", { name: "Mình đã chuyển khoản" }).click();
  ok(await waitText(p, /Chờ thủ quỹ xác nhận/, 5000), "7b. Màn đóng quỹ: đã báo chuyển");
  await p.getByRole("link", { name: "Của tôi" }).click();
  await p.waitForURL("**/me");
  ok(await waitText(p, /Chờ thủ quỹ xác nhận/, 3000), "7b. Về Của tôi: ghi \"Chờ thủ quỹ xác nhận\" ngay");
  await p.screenshot({ path: path.join(OUT, "3-cua-toi-sau-bao-chuyen.png") });
  await p.context().close();

  await browser.close();
  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
})().catch((e) => { console.error(results.join("\n")); console.error(e); process.exit(1); });
