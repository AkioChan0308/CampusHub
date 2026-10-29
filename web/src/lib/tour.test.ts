// Chạy: npm test. Hướng dẫn ban điều hành: nhớ riêng từng tài khoản, lỗi lưu trữ thì không tự bật, các bước đủ và đúng thứ tự, vai chủ nhiệm mới chỉ có Bàn giao và Kho.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARD_TOUR, groupPosition, hasSeenTour, markTourSeen, nextGroupStart, pageOf, stepsFor, tourKey, type TourStorage } from "./tour.ts";
import { getTour, goTour, startTour, stopTour, subscribeTour } from "./tour-store.ts";

const memory = (): TourStorage => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

test("lần đầu chưa xem; đánh dấu xong thì đã xem, và chỉ cho đúng tài khoản đó", () => {
  const s = memory();
  assert.equal(hasSeenTour(s, "a001"), false);
  markTourSeen(s, "a001");
  assert.equal(hasSeenTour(s, "a001"), true);
  assert.equal(hasSeenTour(s, "a002"), false, "tài khoản khác trên cùng trình duyệt vẫn được hướng dẫn");
  assert.notEqual(tourKey("a001"), tourKey("a002"));
});

test("không có hoặc không đọc ghi được storage thì không tự bật hướng dẫn, và không báo lỗi", () => {
  assert.equal(hasSeenTour(undefined, "a001"), true);
  const broken: TourStorage = { getItem: () => { throw new Error("chặn"); }, setItem: () => { throw new Error("chặn"); } };
  assert.equal(hasSeenTour(broken, "a001"), true);
  assert.doesNotThrow(() => markTourSeen(broken, "a001"));
  assert.doesNotThrow(() => markTourSeen(undefined, "a001"));
});

test("hướng dẫn đi qua mọi tab của thanh bên theo đúng thứ tự, mỗi bước đủ chữ", () => {
  const groups = [...new Set(BOARD_TOUR.map((s) => s.group))];
  assert.deepEqual(groups, ["Giới thiệu", "Trang chủ", "Thành viên", "Điểm danh", "Việc cần làm", "Bảng tin", "Bàn giao", "Kho bàn giao", "Quỹ", "Kết thúc"]);
  for (const s of BOARD_TOUR) assert.ok(s.title.trim() && s.text.trim() && s.target.trim(), s.title);
  const pages = BOARD_TOUR.map((s) => s.page).filter((p): p is string => p !== undefined);
  assert.deepEqual(pages, ["", "", "/members", "/events", "/tasks", "/posts", "/handover", "/handover-kit", "/collections", "/reconcile", "/expenses", "/budget"], "trang chủ ghi hai lần (giới thiệu và Trang chủ), các trang khác một lần, theo thứ tự thanh bên");
});

test("kho bàn giao: đi qua cả ba phần bằng cách bấm chip trước khi chỉ", () => {
  const kit = BOARD_TOUR.filter((s) => s.group === "Kho bàn giao");
  assert.deepEqual(kit.filter((s) => s.click).map((s) => s.click), ["b:Biểu mẫu", "b:Quy trình", "b:Tài khoản và quyền truy cập"]);
  for (const s of kit.filter((x) => x.click)) assert.match(s.target, /^css:\[role='region'\]\[aria-label='/);
});

test("trang của bước: ghi ở chính nó hoặc lấy từ bước gần nhất phía trước (quay lại bước vẫn về đúng trang)", () => {
  const i = BOARD_TOUR.findIndex((s) => s.target === "h:Danh sách thành viên");
  assert.equal(BOARD_TOUR[i].page, undefined);
  assert.equal(pageOf(BOARD_TOUR, i), "/members");
  assert.equal(pageOf(BOARD_TOUR, 0), "");
  const fund = BOARD_TOUR.findIndex((s) => s.target === "nav-fund");
  assert.equal(pageOf(BOARD_TOUR, fund), "/handover-kit", "bước chỉ nhóm Quỹ ở lại trang kho");
});

test("chủ nhiệm mới (vai thành viên) chỉ có giới thiệu, Bàn giao, Kho bàn giao và phần kết", () => {
  const groups = [...new Set(stepsFor("member").map((s) => s.group))];
  assert.deepEqual(groups, ["Giới thiệu", "Bàn giao", "Kho bàn giao", "Kết thúc"]);
  assert.deepEqual(stepsFor("president"), BOARD_TOUR);
  assert.deepEqual(stepsFor("treasurer"), BOARD_TOUR);
  assert.deepEqual(stepsFor(undefined), []);
});

test("số bước trong tab và nút \"Bỏ qua phần này\"", () => {
  const i = BOARD_TOUR.findIndex((s) => s.group === "Thành viên");
  assert.deepEqual(groupPosition(BOARD_TOUR, i), { group: "Thành viên", n: 1, total: 5 });
  assert.deepEqual(groupPosition(BOARD_TOUR, i + 2), { group: "Thành viên", n: 3, total: 5 });
  assert.equal(BOARD_TOUR[nextGroupStart(BOARD_TOUR, i + 2)].group, "Điểm danh");
  assert.equal(nextGroupStart(BOARD_TOUR, BOARD_TOUR.length - 1), -1);
});

test("trạng thái đang chạy: mở từ bước đầu, đi tới, thoát; chỉ đổi bước khi đang mở", () => {
  let calls = 0;
  const off = subscribeTour(() => calls++);
  goTour(3);
  assert.deepEqual(getTour(), { open: false, index: 0 }, "đang đóng thì không đổi bước");
  startTour();
  goTour(4);
  assert.deepEqual(getTour(), { open: true, index: 4 });
  startTour();
  assert.deepEqual(getTour(), { open: true, index: 0 }, "mở lại thì về bước đầu");
  stopTour();
  assert.deepEqual(getTour(), { open: false, index: 0 });
  assert.equal(calls, 4);
  off();
  startTour();
  assert.equal(calls, 4, "đã hủy đăng ký thì không báo nữa");
  stopTour();
});
