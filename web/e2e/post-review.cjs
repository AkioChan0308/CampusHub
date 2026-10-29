// Tin của CLB trên Cộng đồng, duyệt trước hiện sau (29/10/2026, Hiệu chốt): ban điều hành đăng tin, tin chờ hiện mờ cho người đăng và không hiện cho người khác,
// cán bộ trường duyệt hoặc từ chối (kèm lý do), tin được duyệt hiện cho mọi người, tin bị từ chối người đăng thấy lý do.
// Chạy trong web/: node e2e/post-review.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ). Mô tả: docs/mo-ta-bang-tin-chung.md.
const { BASE, launch } = require("./common.cjs");
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

(async () => {
  const browser = await launch();
  const errs = [];
  async function as(personId, size) {
    const ctx = await browser.newContext({ viewport: size, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push("pageerror " + e.message));
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, personId);
    return p;
  }
  const dim = (p, title) => p.locator("a.l-post", { hasText: title }).evaluate((el) => el.classList.contains("dim")).catch(() => null);
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // Trưởng ban (a005) đăng một sự kiện
  let p = await as("a005", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  await p.getByRole("button", { name: "Đăng tin" }).click();
  await p.getByLabel("Loại tin").selectOption("event");
  await p.getByLabel("Tiêu đề").fill("Buổi giao lưu cuối tháng");
  await p.getByLabel("Nội dung").fill("Mời các bạn đến giao lưu cuối tháng cùng CLB.");
  await p.getByRole("button", { name: "Gửi tin" }).click();
  ok(await waitText(p, /Ngày diễn ra[\s\S]*Cần ghi ngày|Sự kiện cần ghi ngày diễn ra/), "Đăng sự kiện thiếu ngày: form báo thiếu ngày diễn ra");
  await p.getByLabel("Ngày diễn ra").fill("2026-11-28");
  await p.getByLabel("Nơi diễn ra (không bắt buộc)").fill("Sân cầu lông");
  await p.getByRole("button", { name: "Gửi tin" }).click();
  ok(await waitText(p, /Buổi giao lưu cuối tháng[\s\S]*Chờ trường duyệt/), "Đăng tin: tin hiện ở Bảng tin của CLB với nhãn Chờ trường duyệt");
  ok((await dim(p, "Buổi giao lưu cuối tháng")) === true, "Bảng tin của CLB: tin chờ duyệt hiện mờ");
  await p.goto(`${BASE}/feed`);
  await waitText(p, /Buổi giao lưu cuối tháng/);
  ok((await dim(p, "Buổi giao lưu cuối tháng")) === true && (await p.locator("a.l-post", { hasText: "Buổi giao lưu cuối tháng" }).innerText()).includes("Chờ trường duyệt"), "Cộng đồng: người đăng thấy tin như đã đăng lên nhưng mờ, kèm nhãn chờ duyệt");
  await p.context().close();

  // Thành viên thường và sinh viên ngoài CLB không thấy tin chờ duyệt
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/feed`);
  await waitText(p, /Giải cầu lông nội bộ/);
  ok(!(await p.locator("body").innerText()).includes("Buổi giao lưu cuối tháng") && !(await p.locator("body").innerText()).includes("Đổi giờ sinh hoạt tuần sau"), "Cộng đồng: thành viên thường không thấy tin chờ duyệt");
  await p.context().close();

  // Cán bộ trường: hàng chờ, duyệt một tin, từ chối một tin
  p = await as("p-thu-trang", LAPTOP);
  await p.goto(`${BASE}/school/posts`);
  ok(await waitText(p, /Duyệt tin của CLB[\s\S]*Chờ duyệt \(2\)[\s\S]*Đổi giờ sinh hoạt tuần sau[\s\S]*Buổi giao lưu cuối tháng/), "Duyệt tin: hàng chờ có hai tin, tin chờ lâu nhất trước");
  ok((await p.getByRole("navigation", { name: "Menu nhà trường" }).innerText()).includes("Duyệt tin"), "Menu nhà trường: có mục Duyệt tin");
  await p.getByRole("button", { name: "Duyệt: Buổi giao lưu cuối tháng" }).click();
  ok(await waitText(p, /Chờ duyệt \(1\)/), "Duyệt: tin rời hàng chờ");
  await p.getByRole("button", { name: "Từ chối: Đổi giờ sinh hoạt tuần sau" }).click();
  await p.getByRole("button", { name: "Gửi từ chối" }).click();
  ok(await waitText(p, /Từ chối thì cần ghi lý do/), "Từ chối: bắt buộc ghi lý do");
  await p.getByLabel("Lý do từ chối (CLB sẽ thấy)").fill("Thiếu thông tin địa điểm.");
  await p.getByRole("button", { name: "Gửi từ chối" }).click();
  ok(await waitText(p, /Chờ duyệt \(0\)[\s\S]*Không có tin nào chờ duyệt[\s\S]*Vừa xem xét[\s\S]*Bị từ chối[\s\S]*Lý do: Thiếu thông tin địa điểm[\s\S]*Đã duyệt/), "Từ chối: tin vào mục Vừa xem xét (mới nhất trước) kèm lý do, tin vừa duyệt nằm dưới");
  await p.context().close();

  // Sau khi duyệt: mọi người thấy tin đã duyệt, không thấy tin bị từ chối; người đăng thấy lý do
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/feed`);
  ok(await waitText(p, /Buổi giao lưu cuối tháng/) && (await dim(p, "Buổi giao lưu cuối tháng")) === false, "Cộng đồng: tin được duyệt hiện cho thành viên, không mờ");
  ok(!(await p.locator("body").innerText()).includes("Đổi giờ sinh hoạt tuần sau"), "Cộng đồng: tin bị từ chối không hiện cho người khác");
  await p.context().close();
  p = await as("a001", PHONE);
  await p.goto(`${BASE}/feed`);
  await waitText(p, /Đổi giờ sinh hoạt tuần sau/);
  const mine = await p.locator("a.l-post", { hasText: "Đổi giờ sinh hoạt tuần sau" }).innerText();
  ok(mine.includes("Bị từ chối") && mine.includes("Thiếu thông tin địa điểm."), "Cộng đồng: người đăng thấy tin bị từ chối kèm lý do", mine.replace(/\n/g, " | "));
  ok((await dim(p, "Đổi giờ sinh hoạt tuần sau")) === true, "Cộng đồng: tin bị từ chối hiện mờ cho người đăng");
  await p.context().close();

  // Sửa tin bị từ chối rồi gửi lại: tin về chờ duyệt, trường thấy lại trong hàng chờ
  p = await as("a001", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  await waitText(p, /Đổi giờ sinh hoạt tuần sau[\s\S]*Bị từ chối/);
  await p.getByRole("button", { name: "Sửa và gửi lại: Đổi giờ sinh hoạt tuần sau" }).click();
  ok(await waitText(p, /Sửa và gửi lại[\s\S]*Trường đã từ chối tin này: Thiếu thông tin địa điểm/), "Sửa và gửi lại: form điền sẵn nội dung cũ, nhắc lý do bị từ chối");
  ok((await p.getByLabel("Tiêu đề").inputValue()) === "Đổi giờ sinh hoạt tuần sau", "Sửa và gửi lại: tiêu đề cũ được điền sẵn");
  await p.getByLabel("Nội dung").fill("Buổi sinh hoạt Thứ Bảy tuần sau dời sang 08:30 tại sân A vì sân chính bảo trì.");
  await p.getByRole("button", { name: "Gửi lại", exact: true }).click();
  ok(await waitText(p, /Đổi giờ sinh hoạt tuần sau[\s\S]*Chờ trường duyệt/) && !(await p.locator("body").innerText()).includes("Lý do: Thiếu thông tin địa điểm"), "Gửi lại: tin về chờ trường duyệt, không còn lý do từ chối");
  await p.context().close();
  p = await as("p-thu-trang", LAPTOP);
  await p.goto(`${BASE}/school/posts`);
  ok(await waitText(p, /Chờ duyệt \(1\)[\s\S]*Đổi giờ sinh hoạt tuần sau[\s\S]*sân A/), "Duyệt tin: tin gửi lại vào lại hàng chờ với nội dung đã sửa");
  await p.context().close();

  // Thủ quỹ và thành viên thường không duyệt được
  p = await as("a001", LAPTOP);
  await p.goto(`${BASE}/school/posts`);
  ok(await waitText(p, /Bạn không xem được trang này[\s\S]*dành cho ban quản lý CLB của trường/), "Duyệt tin: ban điều hành CLB không vào được trang duyệt của trường");
  await p.context().close();

  console.log(results.join("\n"));
  if (errs.length) console.log("LOI trình duyệt:\n" + errs.join("\n"));
  await browser.close();
  const bad = results.filter((r) => r.startsWith("LOI")).length + (errs.length ? 1 : 0);
  console.log(`\n${results.length - results.filter((r) => r.startsWith("LOI")).length}/${results.length} kiểm tra đạt, ${errs.length} lỗi trình duyệt`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
