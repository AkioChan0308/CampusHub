-- 22/10/2026. Kho bàn giao: biểu mẫu, quy trình, tài khoản và quyền truy cập của CLB.
-- Không bảng nào có cột mật khẩu: chỉ lưu tên dịch vụ, đường link và người giữ quyền quản trị.

create table kit_documents (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  name text not null,
  category text not null check (category in ('permit', 'finance', 'media', 'other')),
  link text not null,
  holder_id text not null references persons (id),
  updated_at timestamptz not null
);

-- Các bước và danh sách biểu mẫu đi kèm là danh sách có thứ tự, lưu dạng jsonb trong dòng của quy trình.
create table kit_processes (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  name text not null,
  steps jsonb not null,
  lead_days integer check (lead_days is null or lead_days between 0 and 365),
  document_ids jsonb not null default '[]',
  updated_at timestamptz not null
);

-- holder_id trống: chưa ai nhận quyền quản trị.
create table kit_accounts (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  service text not null,
  label text not null,
  holder_id text references persons (id),
  ownership text not null check (ownership in ('club', 'personal')),
  required boolean not null,
  updated_at timestamptz not null
);
