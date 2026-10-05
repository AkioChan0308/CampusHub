// Đo độ lệch khung xương của Duyệt chi và Dự trù.
const { BASE, launch, outDir } = require("./chung.cjs");
const C = `${BASE}/clubs/cau-long-san-nha`;
const probes = {
  "Duyệt chi": [".l-dl", ".l-detail .l-form", ".l-detail .l-row-actions", ".l-subhead", ".l-history", ".l-history + .l-note", ".l-sheet"],
  "Dự trù": [".l-formula", ".l-sec-head", "thead th", "tbody tr", ".l-sheet"],
};
async function marks(p, sels) {
  return p.evaluate((sels) => sels.map((s) => { const e = document.querySelector(s); if (!e) return `${s}: -`; const r = e.getBoundingClientRect(); return `${s}: y${Math.round(r.top)} h${Math.round(r.height)}`; }).join(" | "), sels);
}
(async () => {
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  const browser = await launch();
  const p = await (await browser.newContext({ viewport: { width: 1440, height: 1200 }, reducedMotion: "reduce" })).newPage();
  await p.goto(`${BASE}/login`);
  await p.evaluate(async () => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: "a001" }) }); });
  for (const [name, url, ready] of [["Duyệt chi", `${C}/expenses`, "Gửi yêu cầu hoàn ứng"], ["Dự trù", `${C}/budget`, "Thêm hoạt động"]]) {
    await p.goto(url); await p.getByRole("button", { name: ready }).waitFor();
    await p.route("**/api/v1/clubs/**", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    await p.goto(url);
    await p.waitForSelector("[aria-busy=true]");
    await p.waitForTimeout(300);
    const a = await marks(p, probes[name]);
    await p.getByRole("button", { name: ready }).waitFor({ timeout: 15000 });
    await p.waitForTimeout(500);
    const b = await marks(p, probes[name]);
    await p.unroute("**/api/v1/clubs/**");
    console.log(`${name}\n  khung xương: ${a}\n  đã tải:      ${b}`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
