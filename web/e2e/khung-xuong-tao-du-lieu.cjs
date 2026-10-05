// Đo độ lệch khung xương của các màn tạo dữ liệu (04/10/2026) và hai màn vừa sửa (Thành viên, Đợt thu).
// Mỗi màn: mở một lần cho có dữ liệu, rồi mở lại với API chậm 1,5 giây, đo vị trí các khối lúc khung xương và lúc đã tải.
const { BASE, launch, outDir } = require("./chung.cjs");
const PHONE = { width: 390, height: 844 };
const LAPTOP = { width: 1440, height: 1100 };
const C = "/clubs/cau-long-san-nha";
const pages = [
  ["Các buổi", "a001", LAPTOP, `${C}/events`, { role: "button", name: "Tạo buổi" }, [".l-top", ".l-top-sub", ".l-sheet", ".l-sec-head", ".l-evrow", ".l-evrow .l-tag", ".l-evrow .l-row-actions", ".l-sec + .l-sec", ".l-sec + .l-sec .l-evrow"]],
  ["Tạo đợt thu", "a002", LAPTOP, `${C}/collections/new`, { role: "button", name: "Tạo đợt thu" }, [".l-top", ".l-form-split", ".l-form-grid", ".l-form-grid > .l-field:nth-child(3)", ".l-form-grid > .l-field:nth-child(8)", ".l-form-actions", ".l-preview"]],
  ["Thêm thành viên", "a001", LAPTOP, `${C}/members/add`, { role: "button", name: "Chọn file Excel hoặc CSV" }, [".l-top", ".l-file-pick", ".l-sec + .l-sec .l-sec-head", "thead", "tbody tr", ".l-sheet"]],
  ["Thành viên", "a001", LAPTOP, `${C}/members`, { role: "button", name: "Xem tiếp" }, [".l-sec-head h2", ".l-app", "thead th:nth-child(7)", "tbody tr", "tbody tr:nth-child(6)", ".l-foot", ".l-sheet"]],
  ["Đợt thu", "a002", LAPTOP, `${C}/collections/quy-fall-2026`, { role: "link", name: "Đối soát sao kê" }, [".l-top", ".l-coltabs", ".l-strip", ".l-seg", "thead", "tbody tr", "tbody tr:nth-child(7)", ".l-sheet"]],
];
async function marks(p, sels) {
  return p.evaluate((sels) => sels.map((s) => { const e = document.querySelector(s); if (!e) return `${s}: -`; const r = e.getBoundingClientRect(); return `${s}: x${Math.round(r.left)} y${Math.round(r.top)} w${Math.round(r.width)} h${Math.round(r.height)}`; }), sels);
}
(async () => {
  await fetch(`${BASE}/api/v1/demo/reset`, { method: "POST" });
  const browser = await launch();
  for (const [name, who, viewport, path, ready, sels] of pages) {
    const ctx = await browser.newContext({ viewport, reducedMotion: "reduce", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/login`);
    await p.evaluate(async (id) => { await fetch("/api/v1/auth/dev-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: id }) }); }, who);
    const readyEl = () => p.getByRole(ready.role, { name: ready.name, exact: true }).first();
    await p.goto(BASE + path); await readyEl().waitFor({ timeout: 60000 });
    await p.route("**/api/v1/**", async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); });
    await p.goto(BASE + path);
    await p.waitForSelector("[aria-busy=true]");
    await p.waitForTimeout(300);
    const a = await marks(p, sels);
    await readyEl().waitFor({ timeout: 15000 });
    await p.waitForTimeout(600);
    const b = await marks(p, sels);
    console.log(`== ${name}`);
    a.forEach((x, i) => console.log(x === b[i] ? `  =  ${x}` : `  ≠  khung xương ${x}\n     đã tải      ${b[i]}`));
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
