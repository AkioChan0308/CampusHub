// Phần dùng chung của các script bấm thử: địa chỉ web, mở Chrome, thư mục ảnh chụp.

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

/** Địa chỉ web đang chạy (npm run dev). Máy chủ API phải chạy cùng lúc ở cổng 4000, chế độ demo. */
const BASE = process.env.BASE || "http://localhost:3000";

/** Mở Chrome đã cài trên máy (Playwright tự tìm). Máy không có Chrome thì đặt CHROME_PATH tới file chạy của Chrome hoặc Chromium. */
async function launch() {
  const browser = await (process.env.CHROME_PATH
    ? chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
    : chromium.launch({ channel: "chrome", headless: true }));
  // Hướng dẫn nhanh của ban điều hành tự mở lần đầu và chặn bấm vào màn phía sau. Mọi cửa sổ thử coi như đã xem, trừ script tour.cjs (đặt window.__tourOn).
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...args) => {
    const ctx = await newContext(...args);
    await ctx.addInitScript(() => {
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { return !window.__tourOn && String(k).startsWith("campushub.tour.board.") ? "1" : get.call(this, k); };
    });
    return ctx;
  };
  return browser;
}

/** Thư mục ảnh chụp của một script: web/e2e/screenshots/<tên>. Thư mục screenshots/ không đưa vào repo. */
function outDir(name) {
  const dir = path.join(__dirname, "screenshots", name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Dữ liệu mẫu cố định theo ngày 03/10/2026, còn các kiểm tra chạy theo ngày thật của máy. Hai hàm dưới tính số mong đợi theo hôm nay
 * (ngày theo giờ Việt Nam), để kiểm tra không lệch dần theo thời gian.
 */
const dayNumber = (ms) => Math.floor((ms + 7 * 3600_000) / 86_400_000);

/** Ngày hoạt động gần nhất của sáu CLB trong dữ liệu mẫu (web/src/lib/seed.ts; CLB Cầu lông lấy từ buổi điểm danh gần nhất). */
const SEED_LAST_ACTIVITY = ["2026-09-26", "2026-10-02", "2026-10-01", "2026-09-21", "2026-09-27", "2026-08-22"];

/** Số CLB mẫu không có hoạt động trong 30 ngày tính tới hôm nay (cùng luật với server: quá 30 ngày thì không hoạt động). */
function inactiveClubsToday() {
  const today = dayNumber(Date.now());
  return SEED_LAST_ACTIVITY.filter((d) => today - dayNumber(Date.parse(`${d}T12:00:00+07:00`)) > 30).length;
}

/**
 * Số người trong đợt thu mẫu sau khi duyệt một đơn xin vào: người mới chỉ có khoản phải đóng khi đợt thu chưa quá hạn (luật openCollections).
 * Đợt thu mẫu hết hạn 23:59 ngày 10/10/2026: trước hạn là 43, sau hạn là 42.
 */
const collectionSizeAfterApproval = () => (Date.now() <= Date.parse("2026-10-10T23:59:00+07:00") ? 43 : 42);

module.exports = { BASE, launch, outDir, inactiveClubsToday, collectionSizeAfterApproval };
