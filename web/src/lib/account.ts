// Luật cho tài khoản đăng nhập bằng mật khẩu (Hiệu duyệt ngày 05/10/2026, mức "chặt hơn").
// Dùng chung: web kiểm tra ngay trên form, máy chủ kiểm tra lại trước khi lưu. Hàm thuần, không dùng API của trình duyệt.
// Tên tài khoản khác tên hiển thị (Person.name) và khác email.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 80;
/** Sai mật khẩu chừng này lần liền nhau thì tạm khóa đăng nhập bằng mật khẩu. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

/** Tên tài khoản lưu và so sánh ở dạng chữ thường: "Minh.Anh" và "minh.anh" là một. */
export const normalizeUsername = (raw: string) => raw.trim().toLowerCase();

/** Lỗi của tên tài khoản, hoặc undefined khi hợp lệ. Chỉ chữ không dấu, số, dấu chấm, gạch dưới, nên không thể có dạng email. */
export function usernameError(raw: string): string | undefined {
  const u = normalizeUsername(raw);
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) return `Tên tài khoản dài ${USERNAME_MIN}–${USERNAME_MAX} ký tự.`;
  if (!/^[a-z0-9._]+$/.test(u)) return "Tên tài khoản chỉ gồm chữ không dấu, số, dấu chấm và gạch dưới.";
  return undefined;
}

/**
 * Lỗi đầu tiên của mật khẩu, hoặc undefined khi hợp lệ: ít nhất 10 ký tự, có chữ hoa, chữ số và ký tự đặc biệt,
 * không chứa tên tài khoản hay phần trước @ của email.
 */
export function passwordError(password: string, who: { username?: string; email?: string } = {}): string | undefined {
  if (password.length < PASSWORD_MIN) return `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.`;
  if (password.length > PASSWORD_MAX) return `Mật khẩu dài tối đa ${PASSWORD_MAX} ký tự.`;
  if (!/\p{Lu}/u.test(password)) return "Mật khẩu cần có ít nhất một chữ hoa.";
  if (!/\p{N}/u.test(password)) return "Mật khẩu cần có ít nhất một chữ số.";
  if (!/[^\p{L}\p{N}\s]/u.test(password)) return "Mật khẩu cần có ít nhất một ký tự đặc biệt, ví dụ ! @ # ?";
  const lower = password.toLowerCase();
  const parts = [who.username ? normalizeUsername(who.username) : "", (who.email ?? "").split("@")[0].toLowerCase()];
  if (parts.some((p) => p.length >= USERNAME_MIN && lower.includes(p))) return "Mật khẩu không được chứa tên tài khoản hay email.";
  return undefined;
}

/** Lỗi của tên hiển thị, hoặc undefined khi hợp lệ. */
export function displayNameError(raw: string): string | undefined {
  const name = raw.trim();
  if (!name) return "Cần nhập tên hiển thị.";
  if (name.length > NAME_MAX) return `Tên hiển thị dài tối đa ${NAME_MAX} ký tự.`;
  return undefined;
}
