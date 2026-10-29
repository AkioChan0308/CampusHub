// Quay năm video demo có phụ đề cho hai Google Form khảo sát (29/10/2026; kịch bản ở CP3/Kich ban video demo.md, ngoài repo):
//   a1: thành viên, điện thoại (Form A);  b1 bàn giao và kho, b2 việc và điểm danh, b3 thu quỹ và đối soát, b4 đăng tin và duyệt: ban điều hành, laptop (Form B).
// Quay bằng chính web đang chạy với dữ liệu mẫu, không dựng cảnh. Phụ đề, vòng sáng và nhãn "Bản demo, dữ liệu mẫu" là lớp vẽ thêm chỉ có trong video (video-lib.cjs).
//
// Cần: web (cổng 3000 hoặc BASE) và máy chủ chế độ demo chạy với DEMO_NOW=2026-10-03T09:00:00+07:00 (dữ liệu trong bộ nhớ, KHÔNG dùng cơ sở dữ liệu thật:
// script đặt lại dữ liệu mẫu trước mỗi video); ffmpeg trong PATH hoặc đặt FFMPEG. Ra: web/e2e/screenshots/videos/<tên>.mp4 (đổi chỗ bằng VIDEO_OUT).
// Chạy trong web/: `node e2e/record-form-videos.cjs` (cả năm) hoặc `node e2e/record-form-videos.cjs b1`.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { BASE, launch, wait, api, startRecording, encode, prepare, helper, recordingPage, switchTo, caption, ring, actor, OUT_DIR } = require("./video-lib.cjs");

const CLUB = "cau-long-san-nha";
const PRESIDENT = "a001";
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true };
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 };

/**
 * Ảnh chụp từng bước (cho Google Form dùng ảnh thay video): lúc quay thật, mỗi lần phụ đề dừng đủ lâu thì chụp màn hình kèm phụ đề.
 * Ảnh ra thư mục anh/ cạnh video, tên <video>-01.jpg, 02... và file manifest.json ghi phụ đề của từng ảnh.
 */
const SHOTS = { on: false, dir: "", name: "", n: 0, list: [] };
async function snap(page) {
  if (!SHOTS.on) return;
  const text = await page.evaluate(() => { try { return sessionStorage.getItem("__vid-cap") || ""; } catch { return ""; } });
  SHOTS.n += 1;
  const file = `${SHOTS.name}-${String(SHOTS.n).padStart(2, "0")}.jpg`;
  await page.screenshot({ path: path.join(SHOTS.dir, file), type: "jpeg", quality: 84, scale: "css" });
  SHOTS.list.push({ file, caption: text });
}

/** Phụ đề rồi dừng ms mili giây để người xem đọc kịp; dừng từ 1,2 giây trở lên thì chụp ảnh ở giữa lúc dừng. */
const say = async (page, text, ms = 2600) => {
  await caption(page, text);
  if (ms < 1200) { await wait(ms); return; }
  await wait(Math.round(ms * 0.65));
  await snap(page);
  await wait(Math.round(ms * 0.35));
};

/**
 * Quay một video: chạy thử một lần không quay (web chạy bằng npm run dev biên dịch từng trang ở lần mở đầu tiên, nên lần đầu có nhiều khung trắng),
 * đặt lại dữ liệu mẫu, rồi quay thật. Kịch bản được viết để chạy lại từ dữ liệu mẫu nên hai lần giống nhau.
 */
async function film(browser, name, opts, touch, personId, outWidth, script) {
  async function take(recording) {
    await prepare(browser);
    const page = await recordingPage(browser, opts, touch, personId);
    const a = actor(page, touch);
    const helpers = [];
    const ctx = { page, a, helper: async (id) => { const h = await helper(browser, id); helpers.push(h); return h; } };
    try {
      await page.goto(BASE + (script.start || "/"));
      await wait(900);
      const rec = recording ? await startRecording(page, opts.viewport.width * (opts.deviceScaleFactor || 1), opts.viewport.height * (opts.deviceScaleFactor || 1)) : undefined;
      if (recording) {
        const dir = path.join(OUT_DIR, "anh");
        fs.mkdirSync(dir, { recursive: true });
        Object.assign(SHOTS, { on: true, dir, name: name.split("-")[0], n: 0, list: [] });
      }
      await script.run(ctx);
      await caption(page, "");
      await wait(500);
      if (recording) {
        SHOTS.on = false;
        const file = path.join(SHOTS.dir, "manifest.json");
        const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
        all[SHOTS.name] = SHOTS.list;
        fs.writeFileSync(file, JSON.stringify(all, null, 2));
        console.log(`${name}: ${SHOTS.list.length} ảnh bước`);
      }
      return rec ? encode(name, await rec.stop(), outWidth) : undefined;
    } finally {
      for (const h of helpers) await h.close().catch(() => {});
      await page.context().close();
    }
  }
  await take(false);
  return take(true);
}

// ---------- A1: thành viên (điện thoại) ----------
const a1 = {
  start: "/invite/moi-a022",
  async run({ page, a, helper }) {
    const board = await helper(PRESIDENT);
    await page.getByRole("button", { name: "Tham gia CLB" }).waitFor();
    await say(page, "Ban điều hành gửi link vào nhóm Zalo. Bấm vào là mở, không cần cài app.", 3200);
    await say(page, "Bạn tự chọn dữ liệu nào được dùng. Không có ô nào đánh dấu sẵn.", 1600);
    await a.tap(page.locator("#consent-keep"));
    await wait(350);
    await a.tap(page.locator("#consent-age"));
    await wait(500);
    await a.tap(page.getByRole("button", { name: "Tham gia CLB" }));
    await page.waitForURL("**/me");
    await page.getByRole("heading", { name: "Dữ liệu của tôi" }).waitFor();
    // Chủ nhiệm giao một việc cho người mới (ngoài video, sau khi người đó đã nhận lời mời) để màn "Việc của tôi" có gì để xem.
    await api(board.page, "POST", `/clubs/${CLUB}/tasks`, { title: "Mang vợt và nước đến buổi sinh hoạt", assigneeId: "a022", due: "2026-10-10T23:59:00+07:00" });
    await say(page, "Vào CLB xong. Dữ liệu của bạn xem, sửa và xóa được.", 2600);

    await caption(page, "Đến buổi sinh hoạt, quét QR của ban điều hành là xong.");
    await api(board.page, "POST", `/clubs/${CLUB}/events/tuan-5/open`);
    const qr = await api(board.page, "GET", `/clubs/${CLUB}/events/tuan-5/qr`);
    await wait(1400);
    await page.goto(BASE + qr.checkinPath);
    await page.waitForURL("**/me/attendance**", { timeout: 15000 });
    await page.getByText("Đã điểm danh").first().waitFor();
    await say(page, "Điểm danh xong, có ngay trong lịch sử của bạn.", 3000);

    await caption(page, "Đóng quỹ: tiền chuyển thẳng cho thủ quỹ. Ứng dụng chỉ tạo mã.");
    await a.tap(page.locator(".l-tabs a", { hasText: "Quỹ" }));
    await page.waitForURL("**/me/pay/**");
    await page.locator(".l-qr svg").waitFor();
    await wait(1800);
    await snap(page);
    await wait(800);
    await a.tap(page.getByRole("button", { name: "Mình đã chuyển khoản" }));
    await page.getByText(/chờ thủ quỹ xác nhận/i).first().waitFor();
    await wait(1800);

    await say(page, "Việc được giao và hạn chót nằm ở một chỗ.", 400);
    await page.goto(BASE + "/me/tasks");
    await page.getByText("Mang vợt và nước đến buổi sinh hoạt").first().waitFor();
    await wait(2600);

    await caption(page, "Tin và sự kiện của các CLB cũng ở một chỗ: Cộng đồng.");
    await page.goto(BASE + "/feed");
    await page.locator("a.l-post").first().waitFor();
    await wait(3200);
    await say(page, "CampusHub: điểm danh, đóng quỹ, việc và tin của CLB trên điện thoại.", 3000);
  },
};

// ---------- B1: bàn giao 7 bước và Kho bàn giao ----------
const b1 = {
  start: `/clubs/${CLUB}`,
  async run({ page, a, helper }) {
    await page.getByRole("heading", { name: "Cần bạn xử lý" }).waitFor();
    await say(page, "Đổi ban điều hành: dễ mất file, mất quyền, lệch quỹ.", 2800);
    await say(page, "CampusHub giúp ban cũ giao lại đầy đủ cho ban mới, theo từng bước.", 2400);
    await ring(page, page.getByRole("heading", { name: "Bàn giao" }).first(), 2200);
    await a.tap(page.getByRole("link", { name: "Mở kho bàn giao" }));
    await page.waitForURL("**/handover-kit");

    await say(page, "Kho bàn giao gom biểu mẫu, quy trình và tài khoản của CLB. Không lưu mật khẩu.", 3000);
    await a.tap(page.getByRole("button", { name: "Quy trình", exact: true }));
    await say(page, "Quy trình: từng bước làm một việc, ai làm, và biểu mẫu đi kèm.", 2800);
    await a.tap(page.getByRole("button", { name: "Tài khoản và quyền truy cập" }));
    await say(page, "Tài khoản: dịch vụ nào, ai giữ quyền quản trị.", 2600);

    await caption(page, "Ban mới có thắc mắc thì hỏi thẳng trợ lý, câu trả lời lấy từ chính kho của CLB.");
    await a.type(page.locator("#ai-question"), "Mẫu xin phép sự kiện ở đâu?");
    await a.tap(page.getByRole("button", { name: "Hỏi", exact: true }));
    await page.getByText("Nguồn:").first().waitFor({ timeout: 15000 });
    await wait(1500);
    await snap(page);
    await wait(2300);

    await say(page, "Bàn giao đi qua 7 bước. Ở mỗi bước đều biết còn thiếu gì.", 500);
    await a.tap(page.getByRole("link", { name: "Bàn giao", exact: true }).first());
    await page.waitForURL("**/handover");
    await page.getByRole("heading", { name: "Đổi tài khoản nhận quỹ" }).waitFor();
    await ring(page, page.locator("ol.l-steps"), 3000);
    await wait(2600);
    await caption(page, "Bước 4: đổi tài khoản nhận quỹ sang ban mới.");
    await page.locator("#handover-receiver").selectOption("a006");
    await a.type(page.locator("#handover-bank"), "[Ngân hàng thử]");
    await a.type(page.locator("#handover-account-number"), "0123456789");
    await wait(300);
    await snap(page);
    await wait(200);
    await a.tap(page.getByRole("button", { name: "Lưu và sang bước 5" }));
    await page.getByRole("heading", { name: "Chuyển quyền quản trị" }).waitFor();
    await say(page, "Bước 5: chuyển quyền quản trị khỏi email trường của ban cũ.", 2400);
    for (const service of ["Fanpage Facebook", "Google Drive", "Email của CLB", "Tài khoản ngân hàng nhận quỹ"]) {
      await a.tap(page.getByRole("button", { name: `Ghi đã chuyển ${service}` }));
      await wait(900);
    }
    await a.tap(page.getByRole("button", { name: "Tiếp tục" }));
    await page.getByRole("heading", { name: /Ban mới xác nhận/ }).waitFor();
    await say(page, "Bước 6: ban mới xác nhận đã nhận bàn giao.", 2200);

    // Chủ nhiệm mới xác nhận trên máy của mình (ngoài video).
    const incoming = await helper("a017");
    await api(incoming.page, "POST", `/clubs/${CLUB}/handover/accept`);
    await page.reload();
    await page.getByRole("heading", { name: "Biên bản bàn giao" }).waitFor();
    await say(page, "Bước 7: có biên bản bàn giao, xuất Excel bất cứ lúc nào.", 2600);
    await ring(page, page.getByRole("button", { name: /Xuất biên bản/ }), 2400);
    await wait(1600);
  },
};

// ---------- B2: việc cần làm và điểm danh QR ----------
const b2 = {
  start: `/clubs/${CLUB}/tasks`,
  async run({ page, a, helper }) {
    await page.getByRole("heading", { name: "Chưa làm" }).waitFor();
    await say(page, "Việc cần làm: giao việc cho từng người, đặt hạn chót.", 2600);
    await a.tap(page.getByRole("button", { name: "Thêm việc" }));
    await a.type(page.locator("#task-title"), "Đặt sân buổi sinh hoạt tuần sau");
    await page.locator("#task-assigneeId").selectOption({ index: 3 });
    await wait(400);
    await page.locator("#task-date").fill("2026-10-12");
    await wait(500);
    await a.tap(page.locator("form button[type=submit]"));
    await page.getByText("Đặt sân buổi sinh hoạt tuần sau").first().waitFor();
    await wait(1200);
    await say(page, "Việc gấp hiện bằng tờ lịch đỏ. Người được giao tự đổi trạng thái.", 2800);
    await a.tap(page.getByRole("button", { name: /^Bắt đầu: Đặt sân buổi sinh hoạt tuần sau/ }));
    await wait(1600);

    await caption(page, "Điểm danh: mở QR của buổi sinh hoạt.");
    await a.tap(page.getByRole("link", { name: "Điểm danh" }).first());
    await page.waitForURL(`**/clubs/${CLUB}/events`);
    await wait(1400);
    await page.goto(BASE + `/clubs/${CLUB}`);
    await a.tap(page.getByRole("link", { name: "Mở QR điểm danh" }));
    await page.getByRole("heading", { name: "Chưa mở điểm danh" }).waitFor();
    await a.tap(page.getByRole("button", { name: "Bắt đầu điểm danh" }));
    await page.locator(".l-qr-svg svg").waitFor();
    await say(page, "QR đổi mã liên tục, nên khó điểm danh hộ.", 2400);
    const boardHelper = await helper("a001");
    for (const [personId, device] of [["a017", "video-b2-1"], ["a004", "video-b2-2"]]) {
      await wait(700);
      const qr = await api(boardHelper.page, "GET", `/clubs/${CLUB}/events/tuan-5/qr`);
      const member = await helper(personId);
      await api(member.page, "POST", "/checkin", { eventId: "tuan-5", token: qr.token, deviceId: device });
    }
    await page.waitForFunction(() => document.querySelector(".l-att-list")?.textContent?.includes("Phan Thanh Tâm"), null, { timeout: 10000 });
    await say(page, "Thành viên quét QR, tên hiện lên ngay. Có điểm danh tay khi cần, ghi lại ai điểm danh.", 3600);
  },
};

// ---------- B3: thu quỹ và đối soát ----------
const b3 = {
  start: `/clubs/${CLUB}/collections`,
  async run({ page, a }) {
    await page.waitForURL(`**/collections/**`, { timeout: 15000 });
    await page.getByRole("heading", { name: /Đợt thu|Quỹ/ }).first().waitFor();
    await say(page, "Mỗi đợt thu cho từng thành viên một mã chuyển khoản riêng.", 2800);
    await say(page, "Thủ quỹ thấy ai đã đóng, ai chưa. Tiền đi thẳng vào tài khoản của thủ quỹ.", 3000);

    const nav = (label) => page.getByRole("navigation", { name: "Menu ban điều hành" }).locator("a", { hasText: label }).first();
    await caption(page, "Đối soát: thủ quỹ tự tải file sao kê ngân hàng lên. CampusHub không tự đọc ngân hàng.");
    await a.tap(nav("Đối soát sao kê"));
    await page.waitForURL("**/reconcile");
    await page.getByRole("heading", { name: /Cần gán tay/ }).waitFor();
    await wait(1200);
    const csv = path.join(os.tmpdir(), "sao-ke-mau-video-b3.csv");
    fs.writeFileSync(csv, "﻿Ngày,Số tiền,Người chuyển,Nội dung\n02/10/2026 09:15:07,\"100,000.00\",LE NGOC ANH,QFALL26 A037\n02/10/2026 11:40:51,\"100,000.00\",AI DO,chuyen tien\n");
    const upload = page.locator("label, button", { hasText: /Tải (file )?sao kê/ }).first();
    if (await upload.count()) await a.point(upload);
    await page.setInputFiles("input[type=file]", csv);
    await page.getByText("sao-ke-mau-video-b3.csv").first().waitFor();
    await wait(1400);
    await say(page, "Giao dịch khớp thì tự ghi. Dòng nào lệch thì để ở \"Cần gán tay\", thủ quỹ chọn người rồi ghi vào sổ.", 3800);

    await caption(page, "Chi tiêu: không ai tự duyệt khoản do chính mình đề xuất.");
    await a.tap(nav("Đề xuất và duyệt chi"));
    await page.waitForURL("**/expenses");
    await wait(1200);
    await a.tap(page.locator("button.l-pick", { hasText: "Thuê sân tuần 6–7" }));
    await wait(900);
    await a.tap(page.getByRole("button", { name: "Duyệt", exact: true }));
    await page.getByText("Đã duyệt · chờ chi").first().waitFor();
    await say(page, "Sổ quỹ chỉ được thêm, không sửa hay xóa. Mọi thao tác đều có lịch sử.", 3200);
  },
};

// ---------- B4: đăng tin, nhà trường duyệt, tin hiện cho mọi người ----------
const b4 = {
  start: `/clubs/${CLUB}/posts`,
  async run({ page, a }) {
    await page.getByRole("heading", { name: "Tin đã đăng" }).waitFor();
    await say(page, "Ban điều hành đăng tin của CLB lên Cộng đồng.", 2400);
    await a.tap(page.getByRole("button", { name: "Đăng tin" }));
    await page.getByLabel("Loại tin").selectOption("event");
    await a.type(page.getByLabel("Tiêu đề"), "Buổi giao lưu cuối tháng");
    await a.type(page.getByLabel("Nội dung"), "Mời các bạn đến giao lưu cầu lông cùng CLB.");
    await page.getByLabel("Ngày diễn ra").fill("2026-10-24");
    await page.getByLabel("Nơi diễn ra (không bắt buộc)").fill("Sân cầu lông");
    await wait(500);
    await a.tap(page.getByRole("button", { name: "Gửi tin" }));
    await page.getByText("Chờ trường duyệt").first().waitFor();
    await say(page, "Tin mới chờ nhà trường duyệt, chưa hiện cho mọi người.", 3000);

    await caption(page, "Người đăng thấy tin của mình, mờ đi, kèm nhãn chờ duyệt.");
    await page.goto(BASE + "/feed");
    await page.locator("a.l-post", { hasText: "Buổi giao lưu cuối tháng" }).waitFor();
    await ring(page, page.locator("a.l-post", { hasText: "Buổi giao lưu cuối tháng" }), 2600);
    await wait(1200);
    await snap(page);
    await wait(1800);

    await switchTo(page, "p-thu-trang");
    await caption(page, "Nhà trường mở mục Duyệt tin và duyệt.");
    await page.goto(BASE + "/school/posts");
    await page.getByRole("button", { name: "Duyệt: Buổi giao lưu cuối tháng" }).waitFor();
    await wait(1800);
    await snap(page);
    await a.tap(page.getByRole("button", { name: "Duyệt: Buổi giao lưu cuối tháng" }));
    await page.getByText(/Đã duyệt: Buổi giao lưu cuối tháng/).first().waitFor();
    await wait(1800);

    await switchTo(page, "a017");
    await caption(page, "Duyệt xong, mọi người đều thấy tin trên Cộng đồng.");
    await page.goto(BASE + "/feed");
    await page.locator("a.l-post", { hasText: "Buổi giao lưu cuối tháng" }).waitFor();
    await ring(page, page.locator("a.l-post", { hasText: "Buổi giao lưu cuối tháng" }), 2600);
    await wait(1300);
    await snap(page);
    await wait(1900);
  },
};

const VIDEOS = {
  a1: (b) => film(b, "a1-thanh-vien", PHONE, true, "a022", 720, a1),
  b1: (b) => film(b, "b1-ban-giao-va-kho", LAPTOP, false, PRESIDENT, 1280, b1),
  b2: (b) => film(b, "b2-viec-va-diem-danh", LAPTOP, false, PRESIDENT, 1280, b2),
  b3: (b) => film(b, "b3-thu-quy-doi-soat", LAPTOP, false, PRESIDENT, 1280, b3),
  b4: (b) => film(b, "b4-dang-tin-va-duyet", LAPTOP, false, "a005", 1280, b4),
};

(async () => {
  const only = process.argv[2];
  if (only && !VIDEOS[only]) { console.error(`Không có video "${only}". Chọn một trong: ${Object.keys(VIDEOS).join(", ")}`); process.exit(1); }
  const browser = await launch();
  try {
    for (const key of only ? [only] : Object.keys(VIDEOS)) await VIDEOS[key](browser);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
