// Bộ công cụ quay video demo có phụ đề (29/10/2026), dùng cho record-form-videos.cjs. Cùng cách làm với record-demo-videos.cjs (video trang đầu):
// quay web thật bằng Page.startScreencast rồi ghép MP4 bằng ffmpeg; khác ở chỗ có thêm lớp phụ đề, vòng sáng chỉ chỗ cần nhìn, nhãn "Bản demo, dữ liệu mẫu",
// và ngày của trình duyệt dời về đầu tháng 10 (dữ liệu mẫu viết quanh 03/10/2026). Mọi thứ vẽ thêm chỉ có trong video, không phải giao diện CampusHub.
// Máy chủ cũng cần chạy với DEMO_NOW cùng thời điểm (server/.env.example) để việc và hạn khớp với đồng hồ của trình duyệt.

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { BASE, launch } = require("./common.cjs");

const FFMPEG = process.env.FFMPEG || "ffmpeg";
/** Thời điểm bắt đầu của đồng hồ trong video (trình duyệt và máy chủ). */
const START = process.env.DEMO_NOW || "2026-10-03T09:00:00+07:00";
const OUT_DIR = process.env.VIDEO_OUT || path.join(__dirname, "screenshots", "videos");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Gọi API bằng phiên của trang (cookie của context đó). */
const api = (page, method, p, body) => page.evaluate(async ([method, p, body]) => {
  const r = await fetch("/api/v1" + p, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${JSON.stringify(data)}`);
  return data;
}, [method, p, body]);

/**
 * Lớp vẽ thêm trong video: con trỏ (laptop: mũi tên, bấm có vòng nhỏ; điện thoại: chấm tròn lúc chạm), nhãn góc màn và thanh phụ đề.
 * Phụ đề lưu ở sessionStorage nên còn nguyên khi trang chuyển sang trang khác.
 */
const overlayScript = (touch) => `(() => {
  const setup = () => {
    if (document.getElementById("__vid-ptr")) return;
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}"
      + "#__vid-cap{position:fixed;z-index:2147483645;left:50%;transform:translateX(-50%);max-width:" + (${touch} ? "88%" : "72%") + ";width:max-content;padding:" + (${touch} ? "9px 14px" : "11px 20px") + ";border-radius:12px;background:rgba(22,23,28,.9);color:#fff;font:600 " + (${touch} ? "15px/1.35" : "19px/1.35") + " system-ui,'Segoe UI',sans-serif;text-align:center;pointer-events:none;bottom:" + (${touch} ? "84px" : "26px") + ";opacity:0;transition:opacity 220ms}"
      + "#__vid-cap.on{opacity:1}"
      + "#__vid-tag{position:fixed;z-index:2147483645;right:10px;top:" + (${touch} ? "8px" : "10px") + ";padding:3px 9px;border-radius:999px;background:rgba(22,23,28,.72);color:#fff;font:600 " + (${touch} ? "10px" : "12px") + " system-ui,sans-serif;pointer-events:none}";
    document.documentElement.appendChild(st);
    const tag = document.createElement("div"); tag.id = "__vid-tag"; tag.textContent = "Bản demo · dữ liệu mẫu"; document.documentElement.appendChild(tag);
    const cap = document.createElement("div"); cap.id = "__vid-cap"; document.documentElement.appendChild(cap);
    const showCap = () => { let t = ""; try { t = sessionStorage.getItem("__vid-cap") || ""; } catch {} cap.textContent = t; cap.classList.toggle("on", !!t); };
    showCap();
    window.__vidCap = (t) => { try { sessionStorage.setItem("__vid-cap", t || ""); } catch {} showCap(); };
    const c = document.createElement("div"); c.id = "__vid-ptr";
    c.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform;" + (${touch}
      ? "width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;background:rgba(29,71,163,.22);border:2px solid rgba(29,71,163,.55);opacity:0;transition:opacity 160ms"
      : "width:24px;height:24px");
    if (!${touch}) c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 2.5l15 9.2-6.9 1.3-3.6 6.3z" fill="#161A22" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    let p = [-60, -60];
    try { p = JSON.parse(sessionStorage.getItem("__vid-ptr") || "[-60,-60]"); } catch {}
    const put = (x, y) => { c.style.transform = "translate(" + x + "px," + y + "px)"; };
    put(p[0], p[1]);
    addEventListener("mousemove", (e) => { put(e.clientX, e.clientY); try { sessionStorage.setItem("__vid-ptr", JSON.stringify([e.clientX, e.clientY])); } catch {} }, true);
    addEventListener("mousedown", (e) => {
      if (${touch}) { c.style.opacity = "1"; return; }
      const r = document.createElement("div");
      r.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2px solid rgba(29,71,163,.6);left:" + e.clientX + "px;top:" + e.clientY + "px;transition:transform 300ms ease-out,opacity 300ms ease-out";
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = "scale(1.6)"; r.style.opacity = "0"; });
      setTimeout(() => r.remove(), 350);
    }, true);
    addEventListener("mouseup", () => { if (${touch}) setTimeout(() => { c.style.opacity = "0"; }, 220); }, true);
  };
  if (document.documentElement) setup(); else addEventListener("DOMContentLoaded", setup);
})();`;

/** Ghi màn hình bằng Chrome (Page.startScreencast): mỗi lần trang đổi hình là một ảnh kèm giờ chụp. */
async function startRecording(page, maxWidth, maxHeight) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth, maxHeight, everyNthFrame: 1 });
  return { stop: async () => { await cdp.send("Page.stopScreencast"); return { frames, end: Date.now() / 1000 }; } };
}

/** Ghép ảnh thành MP4 (H.264, 30 hình/giây) và ảnh đầu video. */
function encode(name, rec, outWidth) {
  const { frames, end } = rec;
  if (frames.length < 2) throw new Error(`${name}: không quay được hình nào`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `campushub-${name}-`));
  const lines = ["ffconcat version 1.0"];
  frames.forEach((f, i) => {
    const file = `f${String(i).padStart(6, "0")}.jpg`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(f.data, "base64"));
    const next = i + 1 < frames.length ? frames[i + 1].t : end;
    lines.push(`file '${file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  lines.push(`file 'f${String(frames.length - 1).padStart(6, "0")}.jpg'`);
  fs.writeFileSync(path.join(dir, "list.txt"), lines.join("\n"));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const mp4 = path.join(OUT_DIR, `${name}.mp4`);
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", `fps=30,scale=${outWidth}:-2:flags=lanczos,format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-movflags", "+faststart", "-an", mp4,
  ]);
  fs.rmSync(dir, { recursive: true, force: true });
  const duration = +(end - frames[0].t).toFixed(1);
  console.log(`${name}: ${duration} giây, ${frames.length} ảnh, ${Math.round(fs.statSync(mp4).size / 1024)} KB -> ${mp4}`);
  return { duration, file: mp4 };
}

/** Đặt lại dữ liệu mẫu; máy chủ tạo lại các tài khoản mẫu (ngoài video). */
async function prepare(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await api(page, "POST", "/demo/reset");
  await ctx.close();
}

/** Trình duyệt phụ (không quay) đăng nhập bằng một vai, để làm phần của người khác trong video. */
async function helper(browser, personId) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await api(page, "POST", "/auth/dev-login", { personId });
  return { page, close: () => ctx.close() };
}

/** Trang quay: đồng hồ về đầu tháng 10, báo web đang chạy bản thật (không hiện phần chỉ có ở bản demo), vẽ lớp phủ. Đăng nhập sẵn bằng personId nếu có. */
async function recordingPage(browser, opts, touch, personId) {
  const ctx = await browser.newContext({ ...opts, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  // Chỉ dời Date về đầu tháng 10 (đồng hồ vẫn chạy bình thường). Không dùng ctx.clock.install: nó giả cả bộ hẹn giờ và làm trang điện thoại không vẽ nội dung.
  await ctx.addInitScript((start) => {
    const D = Date, offset = start - D.now();
    class ShiftedDate extends D {
      constructor(...a) { if (a.length === 0) super(D.now() + offset); else super(...a); }
      static now() { return D.now() + offset; }
    }
    window.Date = ShiftedDate;
  }, Date.parse(START));
  await ctx.route("**/api/v1/health", (r) => r.fulfill({ json: { ok: true, authMode: "google", googleLogin: true } }));
  await ctx.addInitScript(overlayScript(touch));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("LỖI TRÊN TRANG:", e.message));
  if (personId) {
    await page.goto(BASE + "/login");
    await api(page, "POST", "/auth/dev-login", { personId });
  }
  return page;
}

/** Đổi người đăng nhập trong cùng một trang quay (video có nhiều vai nối tiếp nhau). */
async function switchTo(page, personId) {
  await api(page, "POST", "/auth/dev-login", { personId });
}

/** Phụ đề: hiện chữ ở thanh dưới màn; chuỗi rỗng là ẩn. Còn nguyên khi trang chuyển. */
const caption = (page, text) => page.evaluate((t) => window.__vidCap?.(t), text);

/** Vòng sáng quanh một phần tử trong ms mili giây, để người xem biết nhìn vào đâu. */
async function ring(page, locator, ms = 1800) {
  await locator.waitFor({ state: "visible", timeout: 15000 });
  const b = await locator.boundingBox();
  if (!b) return;
  await page.evaluate(([b, ms]) => {
    const d = document.createElement("div");
    d.style.cssText = `position:fixed;z-index:2147483644;pointer-events:none;left:${b.x - 6}px;top:${b.y - 6}px;width:${b.width + 12}px;height:${b.height + 12}px;border:3px solid #1D47A3;border-radius:12px;background:rgba(29,71,163,.06);transition:opacity 240ms`;
    document.documentElement.appendChild(d);
    setTimeout(() => { d.style.opacity = "0"; }, ms - 240);
    setTimeout(() => d.remove(), ms);
  }, [b, ms]);
}

/** Cuộn tới chỗ, đưa con trỏ tới giữa phần tử rồi bấm, chậm như người thật. */
function actor(page, touch) {
  async function point(locator) {
    await locator.waitFor({ state: "visible", timeout: 15000 });
    const inView = await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 72 && r.bottom <= innerHeight - 110;
    });
    if (!inView) {
      await locator.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
      await wait(650);
    }
    const b = await locator.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: touch ? 1 : 22 });
    await wait(touch ? 120 : 180);
  }
  async function tap(locator) {
    await point(locator);
    await page.mouse.down();
    await wait(90);
    await page.mouse.up();
  }
  async function type(locator, text) {
    await tap(locator);
    await wait(150);
    await page.keyboard.type(text, { delay: 45 });
  }
  async function scrollBy(dy) {
    await page.evaluate((dy) => scrollBy({ top: dy, behavior: "smooth" }), dy);
    await wait(700);
  }
  return { point, tap, type, scrollBy };
}

module.exports = { BASE, launch, wait, api, startRecording, encode, prepare, helper, recordingPage, switchTo, caption, ring, actor, OUT_DIR };
