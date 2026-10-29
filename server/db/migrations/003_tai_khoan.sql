-- 05/10/2026. Đăng nhập bằng tên tài khoản (hoặc email) và mật khẩu, bên cạnh đăng nhập Google (Hiệu duyệt).
-- Mỗi người tối đa một tài khoản. Có dòng mà chưa có mật khẩu: người đó đã đăng nhập Google, chưa đặt mật khẩu.
-- password_hash là mã băm scrypt có salt riêng (server/src/password.ts); không có cột nào chứa mật khẩu gốc.
-- Không ràng buộc khóa ngoại tới persons: người mới tạo khi đăng nhập Google và tài khoản của họ được ghi ở hai hàng đợi khác nhau.

create table accounts (
  person_id text primary key,
  username text unique check (username ~ '^[a-z0-9._]{3,30}$'),
  password_hash text check (password_hash like 'scrypt$%'),
  failed_count integer not null default 0 check (failed_count >= 0),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (password_hash is null or username is not null)
);
