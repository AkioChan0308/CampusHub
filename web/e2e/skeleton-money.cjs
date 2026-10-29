// Đo độ lệch giữa khung xương và trang đã tải: vị trí tiêu đề cột, các dòng bảng, chiều cao dải số.
const { BASE, launch, outDir } = require("./common.cjs");
const C = `${BASE}/clubs/cau-long-san-nha`;
async function marks(p) {
  return p.evaluate(() => {
    const top = (sel, i = 0) => { const e = document.querySelectorAll(sel)[i]; return e ? Math.round(e.getBoundingClientRect().top) : null; };
    const h = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height) : null; };
    const xs = [...document.querySelectorAll("thead th")].map((th) => Math.round(th.getBoundingClientRect().left)).join(",");
    return { strip: h(".l-strip"), file: h(".l-file"), thead: top("thead th"), row1: top("tbody tr", 0), row4: top("tbody tr", 3), row7: top("tbody tr", 6), xs };
  });
}
(async () => {
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  const browser = await launch();
  const p = await (await browser.newContext({ viewport: { width: 1440, height: 1200 }, reducedMotion: "reduce" })).newPage();
  await p.goto(`${BASE}/login`);
  await p.evaluate(async () => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: "a002" }) }); });
  for (const [name, url, ready] of [["Đối soát", `${C}/reconcile`, "Ghi nhận cả hai"], ["Đợt thu", `${C}/collections/quy-fall-2026`, "Xem tiếp"]]) {
    await p.goto(url); await p.getByRole("button", { name: ready }).waitFor(); // biên dịch xong
    await p.route("**/api/v1/clubs/**", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    await p.goto(url);
    await p.waitForSelector("[aria-busy=true] thead th");
    await p.waitForTimeout(300);
    const a = await marks(p);
    await p.getByRole("button", { name: ready }).waitFor({ timeout: 15000 });
    await p.waitForTimeout(500);
    const b = await marks(p);
    await p.unroute("**/api/v1/clubs/**");
    console.log(name, "khung xương", JSON.stringify(a));
    console.log(name, "đã tải    ", JSON.stringify(b));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
