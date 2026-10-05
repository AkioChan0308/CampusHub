// Phần dùng chung của các script bấm thử: địa chỉ web, mở Chrome, thư mục ảnh chụp.

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

/** Địa chỉ web đang chạy (npm run dev). Máy chủ API phải chạy cùng lúc ở cổng 4000, chế độ demo. */
const BASE = process.env.BASE || "http://localhost:3000";

/** Mở Chrome đã cài trên máy (Playwright tự tìm). Máy không có Chrome thì đặt CHROME_PATH tới file chạy của Chrome hoặc Chromium. */
function launch() {
  return process.env.CHROME_PATH
    ? chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
    : chromium.launch({ channel: "chrome", headless: true });
}

/** Thư mục ảnh chụp của một script: web/e2e/screenshots/<tên>. Thư mục screenshots/ không đưa vào repo. */
function outDir(name) {
  const dir = path.join(__dirname, "screenshots", name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { BASE, launch, outDir };
