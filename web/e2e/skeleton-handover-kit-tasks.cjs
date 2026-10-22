// Đo độ lệch khung xương: Kho bàn giao và Việc cần làm (22/10/2026). Cách đọc kết quả: README.md, mục "Đọc kết quả đo khung xương".
const { BASE, launch, outDir } = require("./common.cjs");
const C = `${BASE}/clubs/cau-long-san-nha`;
const pages = [
  ["Trang chủ", C, "Tất cả việc", [".l-top-text h1", ".l-split", ".l-stack:nth-of-type(1) > .l-panel:nth-of-type(1)", ".l-stack:nth-of-type(1) > .l-panel:nth-of-type(2)", ".l-stack:nth-of-type(1) > .l-panel:nth-of-type(3)", ".l-stack:nth-of-type(2) > .l-panel:nth-of-type(1)", ".l-stack:nth-of-type(2) > .l-panel:nth-of-type(2)", ".l-stack:nth-of-type(2) > .l-panel:nth-of-type(3)"]],
  ["Kho bàn giao", `${C}/handover-kit`, "Thêm biểu mẫu", [".l-top-text h1", ".l-ai-box", ".l-ai-box .l-form:first-child", ".l-ai-box .l-form:last-child", ".l-sec-head", ".l-kit-bar", ".l-kit-row", ".l-sheet"]],
  ["Việc cần làm", `${C}/tasks`, "Thêm việc", [".l-top-text h1", ".l-task-filter", ".l-task-cols", ".l-task-col .l-sec-head", ".l-task-row", ".l-sheet"]],
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
    await p.goto(url); await p.getByText(ready).first().waitFor({ timeout: 60000 });
    await p.route("**/api/v1/clubs/**", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue().catch(() => {}); });
    await p.goto(url);
    await p.waitForSelector("[aria-busy=true]");
    await p.waitForTimeout(300);
    const a = await marks(p, sels);
    await p.getByText(ready).first().waitFor({ timeout: 15000 });
    await p.waitForTimeout(500);
    const b = await marks(p, sels);
    await p.unroute("**/api/v1/clubs/**");
    console.log(`== ${name}`);
    a.forEach((x, i) => console.log(x === b[i] ? `  =  ${x}` : `  ≠  khung xương ${x}\n     đã tải      ${b[i]}`));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
