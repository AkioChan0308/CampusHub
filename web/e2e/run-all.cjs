// Chạy lần lượt các script bấm thử và in dòng tổng kết của từng script.
// Chạy trong web/: npm run e2e (luồng) hoặc npm run e2e:skeleton (đo khung xương). Web cổng 3000 và máy chủ cổng 4000 phải đang chạy.

const { spawnSync } = require("child_process");
const path = require("path");

const FLOWS = ["smoke.cjs", "money-flows.cjs", "members-qr-handover.cjs", "member-student-school.cjs", "club-setup.cjs", "regressions.cjs", "auth.cjs"];
const SHIFTS = ["skeleton-money.cjs", "skeleton-money-2.cjs", "skeleton-members-qr-handover.cjs", "skeleton-member-student-school.cjs", "skeleton-club-setup.cjs"];
const shifts = process.argv.includes("--skeleton");
const list = shifts ? SHIFTS : FLOWS;

let failed = 0;
for (const file of list) {
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { encoding: "utf8", env: process.env, timeout: 600_000 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const lines = out.trim().split("\n");
  // Script luồng: chỉ in các dòng LOI và dòng "N/M kiểm tra đạt". Script khung xương: in hết, vì mỗi khối có hai dòng (lúc tải, đã tải) cần đọc cạnh nhau.
  const keep = shifts ? lines : lines.filter((l) => /^LOI|kiểm tra đạt|lỗi nào trên trang|LỖI TRÊN TRANG|Error/.test(l));
  console.log(`\n### ${file}${r.status === 0 ? "" : ` (thoát với mã ${r.status})`}`);
  console.log(keep.join("\n"));
  if (r.status !== 0 || keep.some((l) => /^LOI|LỖI TRÊN TRANG|Error/.test(l))) failed++;
}
console.log(failed ? `\n${failed} script có lỗi.` : "\nMọi script đều đạt.");
process.exit(failed ? 1 : 0);
