// Tài khoản mẫu của bản demo (Hiệu duyệt ngày 05/10/2026, thay cho trang chọn vai /demo đã bỏ).
// Máy chủ chạy chế độ demo thì tự tạo các tài khoản này (lúc khởi động nếu chưa có, và mỗi lần đặt lại dữ liệu mẫu);
// trang đăng nhập liệt kê chúng dưới ô đăng nhập, bấm một dòng là điền sẵn. Không mang sang bản thật.
// Người trong danh sách lấy từ dữ liệu mẫu (seed.ts). Mật khẩu là mật khẩu mẫu, chỉ dùng trên máy chạy thử.

/** Mật khẩu chung của mọi tài khoản mẫu. Đúng luật mật khẩu (account.ts) và không chứa tên tài khoản hay email. */
export const DEMO_PASSWORD = "CauLong#2026";

export interface DemoAccount {
  personId: string;
  /** Vai như trên trang đăng nhập. */
  role: string;
  username: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { personId: "a001", role: "Chủ nhiệm CLB", username: "quocbao" },
  { personId: "a002", role: "Thủ quỹ", username: "thuha" },
  { personId: "a005", role: "Trưởng ban", username: "giahuy" },
  { personId: "a017", role: "Thành viên", username: "minhanh" },
  { personId: "a022", role: "Thành viên mới được mời", username: "hoangnam" },
  { personId: "p-bao-chau", role: "Sinh viên chưa vào CLB", username: "baochau" },
  { personId: "p-thu-trang", role: "Ban quản lý CLB của trường", username: "thutrang" },
];
