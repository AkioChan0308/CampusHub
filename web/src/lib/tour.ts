// Hướng dẫn cho ban điều hành (Hiệu chọn 29/10/2026, mở rộng cùng ngày: đi qua từng tab và từng mục trong tab).
// Tự chạy lần đầu đăng nhập, xem lại từ menu avatar. Đi qua các trang của CLB: mỗi bước có thể kèm trang (tự chuyển sang) và nút cần bấm trước (ví dụ chuyển tab của kho).
// Trạng thái "đã xem" lưu trong trình duyệt, riêng từng tài khoản (đổi máy hay xóa dữ liệu trình duyệt thì hướng dẫn chạy lại).
// File không dùng API của trình duyệt trực tiếp: nhận storage từ ngoài để thử được. Cách tìm phần tử cần chỉ nằm ở components/lich/Tour.tsx.

/** Cách nêu phần tử cần chỉ (target) và nút cần bấm (click):
 *  - "nav-tasks": phần tử có thuộc tính data-tour (thanh bên, logo, avatar);
 *  - "h:Danh sách thành viên": mục (khối) có tiêu đề bắt đầu bằng chữ đó, trong vùng chính;
 *  - "b:Xuất Excel": nút hoặc link có chữ đó, trong vùng chính;
 *  - "css:.l-task-cols": bộ chọn CSS. */
export interface TourStep {
  /** Tên tab, hiện cạnh số bước ("Thành viên · 2/5"), và là đơn vị của nút "Bỏ qua phần này". */
  group: string;
  /** Trang của CLB, sau /clubs/<mã>: "" là trang chủ. Không ghi thì ở nguyên trang hiện tại. */
  page?: string;
  /** Bấm trước khi chỉ, ví dụ chip "Quy trình" của kho bàn giao. */
  click?: string;
  target: string;
  title: string;
  text: string;
  /** "all": cả chủ nhiệm mới (vai thành viên, chỉ vào được Bàn giao và Kho bàn giao). Không ghi thì chỉ ban điều hành. */
  scope?: "all";
}

export const BOARD_TOUR: TourStep[] = [
  { group: "Giới thiệu", page: "", target: "css:.l-side", scope: "all", title: "Thanh bên", text: "Mọi phần của CLB nằm ở đây. Hướng dẫn sẽ đi lần lượt qua từng mục và cho bạn xem bên trong có gì. Bỏ qua lúc nào cũng được." },

  { group: "Trang chủ", page: "", target: "h:Việc cần làm", title: "Việc cần làm", text: "Việc đang chờ của cả ban. Bấm \"Tất cả việc\" để vào trang việc." },
  { group: "Trang chủ", target: "h:Bàn giao", title: "Bàn giao", text: "Tiến độ bàn giao sang ban mới và số mục trong kho. Bấm \"Mở kho bàn giao\" để vào kho." },
  { group: "Trang chủ", target: "h:Sự kiện sắp tới", title: "Sự kiện sắp tới", text: "Các buổi sinh hoạt sắp tới của CLB." },
  { group: "Trang chủ", target: "h:Cần bạn xử lý", title: "Cần bạn xử lý", text: "Những việc cần bạn quyết: đơn xin vào CLB, khoản chi chờ duyệt, giao dịch chưa khớp với sao kê." },
  { group: "Trang chủ", target: "h:Thống kê tham gia", title: "Thống kê tham gia", text: "Thống kê chuyên cần tính từ dữ liệu điểm danh (phép đếm, không phải AI). Phần này có trong bản trả phí." },

  { group: "Thành viên", page: "/members", target: "h:Đơn xin vào đang chờ", title: "Đơn xin vào CLB", text: "Duyệt hoặc từ chối đơn của sinh viên xin vào. Chỉ người có quyền duyệt mới bấm được." },
  { group: "Thành viên", target: "h:Danh sách thành viên", title: "Danh sách thành viên", text: "Tìm theo tên, lọc theo ban, và sửa vai trò hoặc ban của từng người." },
  { group: "Thành viên", target: "b:Nhập từ Excel", title: "Nhập từ Excel", text: "Nhập danh sách thành viên từ file Excel." },
  { group: "Thành viên", target: "b:Xuất Excel", title: "Xuất Excel", text: "Tải danh sách thành viên về Excel bất cứ lúc nào." },
  { group: "Thành viên", target: "b:Tạo link mời", title: "Tạo link mời", text: "Sao chép link trang CLB để gửi vào nhóm Zalo. Sinh viên bấm link rồi gửi đơn xin vào." },

  { group: "Điểm danh", page: "/events", target: "b:Tạo buổi", title: "Tạo buổi", text: "Tạo một buổi sinh hoạt. Mỗi buổi có mã QR điểm danh đổi liên tục, và có điểm danh tay khi cần (ghi lại ai điểm danh)." },
  { group: "Điểm danh", target: "h:Sắp tới", title: "Buổi sắp tới", text: "Các buổi sắp tới của CLB. Sửa hoặc xóa buổi ở mỗi dòng." },
  { group: "Điểm danh", target: "h:Đã qua", title: "Buổi đã qua", text: "Các buổi đã diễn ra, kèm số người đã điểm danh." },

  { group: "Việc cần làm", page: "/tasks", target: "b:Thêm việc", title: "Thêm việc", text: "Tạo việc mới và giao cho một người trong ban." },
  { group: "Việc cần làm", target: "css:.l-task-filter", title: "Lọc việc", text: "Xem tất cả, việc của tôi hoặc việc quá hạn; hoặc lọc theo từng người." },
  { group: "Việc cần làm", target: "css:.l-task-cols", title: "Việc theo trạng thái", text: "Việc chia theo trạng thái. Bấm nút ở mỗi việc để chuyển trạng thái, hoặc Sửa để giao lại cho người khác." },

  { group: "Bảng tin", page: "/posts", target: "b:Đăng tin", title: "Đăng tin", text: "Đăng tin của CLB lên Cộng đồng. Tính năng đang phát triển. Chỉ chủ nhiệm, phó chủ nhiệm và trưởng ban có quyền đăng." },
  { group: "Bảng tin", target: "h:Tin đã đăng", title: "Tin đã đăng", text: "Tin của CLB sẽ hiện ở đây. Hiện là dữ liệu mẫu." },

  { group: "Bàn giao", page: "/handover", target: "css:.l-steps", scope: "all", title: "Bảy bước bàn giao", text: "Chọn ban mới, chốt số dư, kiểm tra kho bàn giao, đổi tài khoản nhận quỹ, chuyển quyền quản trị, ban mới xác nhận, rồi lập biên bản." },
  { group: "Bàn giao", target: "css:.l-detail", scope: "all", title: "Nội dung từng bước", text: "Phần việc của bước hiện tại. Làm xong bước này mới sang bước sau; cần thì quay lại bước trước." },

  { group: "Kho bàn giao", page: "/handover-kit", target: "css:section[aria-label='Trợ lý bàn giao']", scope: "all", title: "Trợ lý bàn giao", text: "Hỏi đáp trong kho và tóm tắt cho ban mới. Trợ lý không trả lời về tiền hay dữ liệu cá nhân, không tự gửi và không tự đổi dữ liệu." },
  { group: "Kho bàn giao", target: "css:[aria-label='Chọn phần của kho']", scope: "all", title: "Ba phần của kho", text: "Kho có ba phần: Biểu mẫu, Quy trình, Tài khoản và quyền truy cập. Bấm để chuyển." },
  { group: "Kho bàn giao", click: "b:Biểu mẫu", target: "css:[role='region'][aria-label='Biểu mẫu']", scope: "all", title: "Biểu mẫu", text: "Biểu mẫu của CLB: tên, người giữ, ngày cập nhật và link. Chỉ lưu đường link, không lưu file." },
  { group: "Kho bàn giao", click: "b:Quy trình", target: "css:[role='region'][aria-label='Quy trình']", scope: "all", title: "Quy trình", text: "Các bước làm một việc (ví dụ xin phòng họp): ai làm ở mỗi bước và biểu mẫu đi kèm." },
  { group: "Kho bàn giao", click: "b:Tài khoản và quyền truy cập", target: "css:[role='region'][aria-label='Tài khoản và quyền truy cập']", scope: "all", title: "Tài khoản và quyền truy cập", text: "Dịch vụ của CLB (fanpage, Drive, email...): ai giữ quyền quản trị, đứng tên CLB hay cá nhân. Không lưu mật khẩu." },

  { group: "Quỹ", target: "nav-fund", title: "Nhóm Quỹ", text: "Thu quỹ, đối soát sao kê, duyệt chi và dự trù nằm trong nhóm này. CampusHub chỉ ghi sổ, không giữ tiền: tiền đi thẳng vào tài khoản của thủ quỹ." },
  { group: "Quỹ", page: "/collections", target: "css:.l-main .l-sheet > :first-child", title: "Đợt thu", text: "Mỗi đợt thu cho từng thành viên một mã chuyển khoản riêng và hạn đóng; thủ quỹ thấy ai đã đóng, ai chưa." },
  { group: "Quỹ", page: "/reconcile", target: "css:.l-main .l-sheet > :first-child", title: "Đối soát sao kê", text: "Thủ quỹ tải file sao kê ngân hàng lên, hệ thống khớp với các khoản đã đóng. CampusHub không tự đọc giao dịch ngân hàng." },
  { group: "Quỹ", target: "h:Cần gán tay", title: "Cần gán tay", text: "Dòng sao kê chưa khớp tự động. Thủ quỹ chọn khoản tương ứng rồi ghi vào sổ." },
  { group: "Quỹ", page: "/expenses", target: "b:Đề xuất chi", title: "Đề xuất chi", text: "Đề xuất một khoản chi. Người đề xuất không tự duyệt khoản của mình; từ chối thì người duyệt phải ghi lý do." },
  { group: "Quỹ", target: "b:Gửi yêu cầu hoàn ứng", title: "Hoàn ứng", text: "Gửi yêu cầu hoàn lại khoản tiền cá nhân đã ứng trước." },
  { group: "Quỹ", target: "css:[role='tablist']", title: "Khoản chi theo trạng thái", text: "Chờ duyệt, Chờ mentor, Đã duyệt, Từ chối. Bấm từng tab để xem." },
  { group: "Quỹ", page: "/budget", target: "h:Các khoản dự trù", title: "Dự trù kỳ", text: "Các khoản dự trù chi của kỳ theo từng hoạt động." },
  { group: "Quỹ", target: "b:Xuất Excel theo", title: "Xuất theo mẫu của trường", text: "Xuất dự trù ra Excel theo mẫu dự trù của trường." },

  { group: "Kết thúc", target: "brand", scope: "all", title: "Cộng đồng", text: "Bấm logo CampusHub để về Cộng đồng: tin và giới thiệu của các CLB." },
  { group: "Kết thúc", target: "avatar", scope: "all", title: "Tài khoản", text: "Bấm avatar để xem lại hướng dẫn này hoặc đăng xuất." },
];

/** Các bước của một vai: chủ nhiệm mới (vai thành viên) chỉ có phần Bàn giao và Kho bàn giao. */
export const stepsFor = (role: string | undefined): TourStep[] => (role === undefined ? [] : role === "member" ? BOARD_TOUR.filter((s) => s.scope === "all") : BOARD_TOUR);

/** Trang của bước: ghi ở chính nó, hoặc ở bước gần nhất phía trước có ghi trang (để quay lại bước cũng về đúng trang). */
export function pageOf(steps: TourStep[], i: number): string {
  for (let k = i; k >= 0; k--) {
    const p = steps[k].page;
    if (p !== undefined) return p;
  }
  return "";
}

/** Vị trí của bước trong tab của nó: { group, n: thứ tự trong tab, total: số bước của tab }. */
export function groupPosition(steps: TourStep[], i: number): { group: string; n: number; total: number } {
  const group = steps[i].group;
  const inGroup = steps.map((s, k) => ({ s, k })).filter((x) => x.s.group === group).map((x) => x.k);
  return { group, n: inGroup.indexOf(i) + 1, total: inGroup.length };
}

/** Bước đầu của tab kế tiếp; -1 nếu đang ở tab cuối. */
export const nextGroupStart = (steps: TourStep[], i: number) => steps.findIndex((s, k) => k > i && s.group !== steps[i].group);

export interface TourStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const tourKey = (personId: string) => `campushub.tour.board.${personId}`;

/** Chưa có storage (hoặc không đọc được, ví dụ cửa sổ riêng tư) thì coi như đã xem: không tự bật mỗi lần tải trang. */
export function hasSeenTour(storage: TourStorage | undefined, personId: string): boolean {
  if (!storage) return true;
  try {
    return storage.getItem(tourKey(personId)) !== null;
  } catch {
    return true;
  }
}

export function markTourSeen(storage: TourStorage | undefined, personId: string): void {
  try {
    storage?.setItem(tourKey(personId), "1");
  } catch { /* không lưu được thì lần sau chạy lại, không sao */ }
}
