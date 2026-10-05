// Đo độ lệch khung xương của nhóm 2: Thành viên, Bàn giao, Chiếu QR.
const { BASE, launch, outDir } = require("./common.cjs");
const C = `${BASE}/clubs/cau-long-san-nha`;
const pages = [
  ["Thành viên", `${C}/members`, "Xem tiếp", [".l-sec-head h2", ".l-app", ".l-filters", "thead th", "tbody tr", ".l-foot", ".l-sheet"]],
  ["Bàn giao", `${C}/handover`, "Lưu và sang bước 4", [".l-steps", ".l-ho-split", ".l-ho-accounts", ".l-ho-transfer", ".l-row-actions", ".l-ho-side", ".l-sheet"]],
  ["Chiếu QR", `${C}/events/tuan-5/qr`, "Bắt đầu điểm danh", [".l-proj-head", ".l-proj-body", ".l-qr-panel", ".l-qr-message", ".l-qr-title", ".l-qr-lead", ".l-att-head", ".l-att-n"]],
];
async function marks(p, sels) {
  return p.evaluate((sels) => sels.map((s) => { const e = document.querySelector(s); if (!e) return `${s}: -`; const r = e.getBoundingClientRect(); return `${s}: x${Math.round(r.left)} y${Math.round(r.top)} w${Math.round(r.width)} h${Math.round(r.height)}`; }), sels);
}
(async () => {
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  const browser = await launch();
  const p = await (await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" })).newPage();
  await p.goto(`${BASE}/login`);
  await p.evaluate(async () => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: "a001" }) }); });
  for (const [name, url, ready, sels] of pages) {
    await p.goto(url); await p.getByRole("button", { name: ready }).waitFor({ timeout: 60000 });
    await p.route("**/api/v1/clubs/**", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    await p.goto(url);
    await p.waitForSelector("[aria-busy=true]");
    await p.waitForTimeout(300);
    const a = await marks(p, sels);
    await p.getByRole("button", { name: ready }).waitFor({ timeout: 15000 });
    await p.waitForTimeout(500);
    const b = await marks(p, sels);
    await p.unroute("**/api/v1/clubs/**");
    console.log(`== ${name}`);
    a.forEach((x, i) => console.log(x === b[i] ? `  =  ${x}` : `  ≠  khung xương ${x}\n     đã tải      ${b[i]}`));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
