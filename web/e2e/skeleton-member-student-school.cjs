// Đo độ lệch khung xương của nhóm 3 và 4: các màn thành viên, sinh viên (điện thoại) và hai màn nhà trường (laptop).
// Mỗi màn: mở một lần cho có dữ liệu, rồi mở lại với API chậm 1,5 giây, đo vị trí các khối lúc khung xương và lúc đã tải.
const { BASE, launch, outDir } = require("./common.cjs");
const PHONE = { width: 390, height: 844 };
const LAPTOP = { width: 1440, height: 1100 };
const pages = [
  ["Của tôi", "a017", PHONE, "/me", { role: "button", name: "Tải dữ liệu của tôi (Excel)" }, [".l-profile", ".l-phone-title", ".l-list", ".l-list + .l-list", ".l-kv", ".l-act", ".l-fine", ".l-tabs"]],
  ["Lời mời", "a022", PHONE, "/invite/moi-a022", { role: "button", name: "Tham gia CLB" }, [".l-ptop", ".l-phone-title", ".l-lead", ".l-login-row", ".l-consent", ".l-consent-row", ".l-fine", ".l-actions"]],
  ["Danh sách CLB", "p-bao-chau", PHONE, "/explore", { role: "link", name: "Xem và gửi đơn" }, [".l-ptop", ".l-ptop-sub", ".l-search-row", ".l-rows", ".l-clubrow", ".l-clubrow-top h2", ".l-clubrow .l-meta", ".l-clubrow-btn"]],
  ["Trang CLB", "p-bao-chau", PHONE, "/explore/cau-long-san-nha", { role: "button", name: "Gửi đơn" }, [".l-ptop", ".l-ptop-sub", ".l-pay-body > .l-meta", ".l-placeholder", ".l-form", ".l-form .l-field:nth-child(2)", ".l-form .l-field:nth-child(3)", ".l-form .l-field:nth-child(4)", ".l-form .l-check"]],
  ["Các CLB (trường)", "p-thu-trang", LAPTOP, "/school", { role: "button", name: "Xuất Excel" }, [".l-club", ".l-top", ".l-top-sub", ".l-strip", ".l-cell-value", ".l-seg", "thead th:nth-child(6)", "tbody tr", "tbody tr:nth-child(6)", ".l-foot", ".l-sheet"]],
  ["Chi tiết CLB (trường)", "p-thu-trang", LAPTOP, "/school/clubs/cau-long-san-nha", { role: "button", name: "Duyệt" }, [".l-top-wrap", ".l-top h1", ".l-top-sub", ".l-nt-split", ".l-sec-head", "thead", "tbody tr", "tfoot", ".l-strip-top", ".l-detail", ".l-detail-head", ".l-dl", "textarea", ".l-row-actions", ".l-stack + .l-stack .l-sec:last-child"]],
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
