// Luật nghiệp vụ dùng chung với bản demo giao diện.
// Các file gốc đang nằm ở web/src/lib, vì bản demo chạy luật ngay trên trình duyệt. Server dùng lại đúng các file đó
// để không có hai bản luật lệch nhau. Khi web chuyển sang gọi API, chuyển các file này về server/src/domain/
// và chỉ sửa đường dẫn trong file này.

export * from "../../web/src/lib/types.ts";
export * from "../../web/src/lib/selectors.ts";
export * from "../../web/src/lib/actions.ts";
export * from "../../web/src/lib/reconcile.ts";
export * from "../../web/src/lib/account.ts";
export * from "../../web/src/lib/demo-accounts.ts";
export { createSeed, DEMO_CLUB_ID, DEMO_COLLECTION_ID, DEMO_TERM, STATE_VERSION } from "../../web/src/lib/seed.ts";
export { daysAgo, dm, dmy, money, nowIso } from "../../web/src/lib/format.ts";
export { matchesSearch, slugify, toAsciiUpper } from "../../web/src/lib/text.ts";
