// Trang chung (29/10/2026, Hiệu yêu cầu): thanh công cụ theo vai, trang đầu tiên sau đăng nhập đã có test riêng (src/lib), ở đây bấm thử các màn:
// tin mẫu, lọc, chi tiết tin, bong bóng chat ở góc phải dưới (khung chat mẫu "đang phát triển"), mục theo vai nổi bật, Của tôi giới hạn cho người chưa vào CLB, quyền đăng tin. Tin là DỮ LIỆU MẪU (src/lib/feed-sample.ts).
// Chạy trong web/: node e2e/feed-shell.cjs (web cổng 3000, server cổng 4000 chế độ demo, dữ liệu trong bộ nhớ). Mô tả: docs/mo-ta-bang-tin-chung.md.
const { BASE, launch } = require("./common.cjs");
const results = [];
const ok = (cond, name, extra = "") => results.push(`${cond ? "OK " : "LOI"} ${name}${extra ? " :: " + extra : ""}`);
const waitText = (p, re, t = 10000) => p.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout: t }).then(() => true).catch(() => false);
const toPath = (p, path) => p.waitForURL(`**${path}`, { timeout: 10000 }).then(() => true).catch(() => false);
const PHONE = { width: 390, height: 844 };
const LAPTOP = { width: 1440, height: 900 };

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
  const tabs = async (p) => (await p.locator(".l-tabs.hub .l-tab").allInnerTexts()).join("|");
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });

  // Sinh viên chưa vào CLB nào
  let p = await as("p-bao-chau", PHONE);
  await p.goto(`${BASE}/feed`);
  ok(await waitText(p, /Cộng đồng[\s\S]*Tin chung[\s\S]*CLB của tôi[\s\S]*Giải cầu lông nội bộ/), "Cộng đồng: có tiêu đề, hai nút chọn phần và danh sách tin");
  ok((await tabs(p)) === "Cộng đồng|Khám phá", "Thanh công cụ: chỉ hai mục chung, cân đối", await tabs(p));
  await p.getByRole("button", { name: /tài khoản/ }).click();
  ok(await p.getByRole("menuitem", { name: "Của tôi" }).isVisible() && await p.getByRole("menuitem", { name: "Tạo CLB" }).isVisible(), "Menu avatar: sinh viên chưa vào CLB có Của tôi và Tạo CLB");
  await p.keyboard.press("Escape");
  await p.getByRole("button", { name: "CLB của tôi" }).click();
  ok(await waitText(p, /Bạn chưa ở CLB nào/) && await p.getByRole("link", { name: "Khám phá CLB" }).isVisible(), "Trang chung: sinh viên chưa vào CLB thấy lời mời Khám phá CLB ở phần CLB của tôi");
  await p.goto(`${BASE}/me`);
  ok(await waitText(p, /Cần tham gia một CLB[\s\S]*Điểm danh[\s\S]*Cần tham gia CLB/), "Của tôi: người chưa ở CLB nào thấy thông tin, tính năng thành viên bị khóa kèm lý do");
  ok((await tabs(p)).includes("Cộng đồng"), "Của tôi: người chưa ở CLB nào vẫn có thanh công cụ Cộng đồng", await tabs(p));
  await p.getByRole("button", { name: /tài khoản/ }).click();
  await p.getByRole("menuitem", { name: "Đăng xuất" }).click();
  ok(await p.waitForURL("**/login", { timeout: 10000 }).then(() => true).catch(() => false), "Đăng xuất: sinh viên chưa vào CLB đăng xuất được từ trang Của tôi");
  await p.context().close();

  // Thành viên: lọc, chi tiết tin, khung chat mẫu
  p = await as("a017", PHONE);
  await p.goto(`${BASE}/feed`);
  ok(await waitText(p, /Giải cầu lông nội bộ/), "Trang chung: thành viên thấy tin");
  ok((await tabs(p)) === "Cộng đồng|Khám phá", "Thanh công cụ: thành viên chỉ có hai mục chung", await tabs(p));
  await p.getByRole("button", { name: "CLB của tôi" }).click();
  ok(await waitText(p, /Giải cầu lông nội bộ/) && !(await p.locator("body").innerText()).includes("Tuyển thành viên kỳ Spring 2027"), "Trang chung: phần CLB của tôi chỉ có tin của CLB mình");
  await p.getByRole("button", { name: "Tin chung" }).click();
  await p.getByRole("button", { name: "Sự kiện", exact: true }).click();
  ok(await waitText(p, /Giải cầu lông nội bộ/) && !(await p.locator("body").innerText()).includes("Tuyển thành viên kỳ Spring 2027"), "Trang chung: lọc Sự kiện bỏ tin loại khác");
  await p.getByRole("link", { name: /Giải cầu lông nội bộ/ }).click();
  ok(await toPath(p, "/feed/giai-noi-bo") && await waitText(p, /Thời gian[\s\S]*Nơi diễn ra[\s\S]*Nhắn cho CLB/), "Chi tiết tin: có thời gian, nơi diễn ra và nút Nhắn cho CLB");
  await p.getByRole("button", { name: "Nhắn cho CLB" }).click();
  ok(await waitText(p, /Nhắn cho CLB Cầu lông Sân Nhà[\s\S]*Tính năng nhắn tin đang phát triển/), "Khung chat mẫu: Nhắn cho CLB mở khung, đề tên CLB, ghi tính năng đang phát triển");
  ok(await p.getByRole("button", { name: "Gửi" }).isDisabled() && await p.getByLabel("Tin nhắn cho ban điều hành").isDisabled(), "Khung chat mẫu: ô viết và nút gửi khóa");
  ok((await p.locator("#chat-unavailable").innerText()).includes("đang phát triển"), "Khung chat mẫu: có dòng lý do nhìn thấy được");
  await p.keyboard.press("Escape");
  ok((await p.locator("#chat-panel").count()) === 0, "Khung chat mẫu: Esc đóng khung");
  const fab = p.getByRole("button", { name: "Tin nhắn" });
  const box = await fab.boundingBox();
  const vp = p.viewportSize();
  ok(box && box.x + box.width > vp.width - 40 && box.y + box.height > vp.height - 150, "Bong bóng chat: nằm ở góc phải dưới", JSON.stringify(box));
  await fab.click();
  ok(await waitText(p, /Tin nhắn[\s\S]*Đang phát triển/) && (await p.locator("#chat-panel").count()) === 1, "Bong bóng chat: bấm thì mở khung chat");
  await fab.click();
  ok((await p.locator("#chat-panel").count()) === 0, "Bong bóng chat: bấm lần nữa thì đóng");
  await p.goto(`${BASE}/explore/vong-lap`);
  ok(await waitText(p, /Giới thiệu mẫu[\s\S]*Nhắn cho CLB[\s\S]*Liên hệ CLB[\s\S]*Tin gần đây của CLB[\s\S]*Tuyển thành viên kỳ Spring 2027/), "Trang CLB: có giới thiệu mẫu, nút nhắn tin, liên hệ và tin gần đây");
  await p.goto(`${BASE}/me`);
  await p.getByRole("link", { name: "CampusHub, Cộng đồng" }).first().click();
  ok(await toPath(p, "/feed"), "Logo CampusHub ở trang Của tôi dẫn về trang chung");
  await p.getByRole("button", { name: /tài khoản/ }).click();
  ok(await p.getByRole("menuitem", { name: "Của tôi" }).isVisible() && await p.getByRole("menuitem", { name: "Đăng xuất" }).isVisible(), "Menu tài khoản: thành viên thấy Của tôi và Đăng xuất");
  await p.getByRole("menuitem", { name: "Đăng xuất" }).click();
  ok(await p.waitForURL("**/login", { timeout: 10000 }).then(() => true).catch(() => false), "Đăng xuất: thành viên đăng xuất được từ trang chung");
  await p.context().close();

  // Chưa đăng nhập: bị đưa về đăng nhập
  const anon = await browser.newContext({ viewport: PHONE });
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/feed`);
  ok(await waitText(ap, /Bạn cần đăng nhập|Đăng nhập/), "Trang chung: chưa đăng nhập thì được mời đăng nhập");
  await anon.close();

  // Ban điều hành: mục menu, nút Đăng tin, logo
  p = await as("a001", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  ok(await waitText(p, /Bảng tin của CLB[\s\S]*Tin đã đăng[\s\S]*Đổi giờ sinh hoạt tuần sau[\s\S]*Chờ trường duyệt[\s\S]*Giải cầu lông nội bộ/), "Bảng tin của CLB: ban điều hành thấy tin đã duyệt và tin chờ trường duyệt");
  const menu = await p.getByRole("navigation", { name: "Menu ban điều hành" }).innerText();
  ok(menu.includes("Cộng đồng") && menu.includes("Bảng tin của CLB"), "Menu ban điều hành: có Cộng đồng và Bảng tin của CLB");
  await p.getByRole("button", { name: "Đăng tin" }).click();
  ok(await waitText(p, /Loại tin[\s\S]*Tiêu đề[\s\S]*Nội dung[\s\S]*cho tới khi cán bộ trường duyệt/), "Bảng tin của CLB: nút Đăng tin mở form, ghi rõ tin chờ trường duyệt");
  ok(await p.getByRole("button", { name: "Đăng xuất" }).isVisible(), "Đăng xuất: ban điều hành có nút ở thanh bên");
  await p.getByRole("link", { name: "CampusHub, Cộng đồng" }).click();
  ok(await toPath(p, "/feed"), "Logo CampusHub ở trang ban điều hành dẫn về trang chung");
  await waitText(p, /Cộng đồng/);
  ok((await tabs(p)) === "Cộng đồng|Khám phá", "Thanh công cụ: ban điều hành chỉ có hai mục chung", await tabs(p));
  await p.getByRole("button", { name: /tài khoản/ }).click();
  const mine = p.getByRole("menuitem", { name: "Của tôi" });
  ok(await mine.isVisible() && (await mine.getAttribute("href")) === "/clubs/cau-long-san-nha", "Menu avatar: ban điều hành có Của tôi, dẫn tới trang quản lý CLB");
  await p.context().close();

  // Thủ quỹ không có quyền đăng tin: nút khóa kèm lý do
  p = await as("a002", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  await waitText(p, /Bảng tin của CLB/);
  ok((await p.getByRole("button", { name: "Đăng tin" }).getAttribute("aria-disabled")) === "true" && (await p.locator("#post-locked").innerText()).includes("trưởng ban"), "Bảng tin của CLB: thủ quỹ thấy nút Đăng tin khóa kèm lý do");
  await p.context().close();

  // Thành viên thường không vào được trang của ban điều hành
  p = await as("a018", LAPTOP);
  await p.goto(`${BASE}/clubs/cau-long-san-nha/posts`);
  await p.waitForTimeout(2500);
  ok(!(await p.locator("body").innerText()).includes("Tin đã đăng"), "Bảng tin của CLB: thành viên thường bị chặn");
  await p.context().close();

  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("OK")).length}/${results.length} kiểm tra đạt`);
  console.log(errs.length ? "LỖI TRÊN TRANG:\n" + errs.join("\n") : "Không có lỗi nào trên trang.");
  await browser.close();
})().catch((e) => { console.log(results.join("\n")); console.error(e); process.exit(1); });
