-- 09/11/2026. Bàn giao MỘT vai: phó chủ nhiệm, thủ quỹ, trưởng ban gửi đơn lên chủ nhiệm, duyệt xong thì làm các bước 2 đến 6.
-- Tách khỏi bảng handovers (bàn giao cả ban, mỗi CLB một dòng). Nhiều đơn cùng lúc, lịch sử giữ lại cả đơn bị từ chối hoặc hủy.

create table role_handovers (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  role text not null check (role in ('president', 'vice', 'treasurer', 'head')),
  department text,
  from_id text not null references persons (id),
  to_id text not null references persons (id),
  reason text not null,
  status text not null check (status in ('requested', 'waiting', 'kept', 'rejected', 'cancelled', 'active', 'done')),
  step integer not null check (step between 1 and 7),
  requested_at timestamptz not null,
  decided_at timestamptz,
  decided_by text references persons (id),
  reject_reason text,
  locked_balance bigint,
  locked_at timestamptz,
  new_receiver_bank text,
  new_receiver_account text,
  transfer_ref text,
  transferred jsonb not null default '[]',
  accepted_at timestamptz,
  history jsonb not null default '[]',
  -- Bàn giao hộ: người gửi yêu cầu, nhật ký liên hệ, người duyệt, hạn chờ 3 ngày. Trống là tự bàn giao.
  proxy jsonb
);

create index role_handovers_club_idx on role_handovers (club_id, seq);

-- Thông báo có thêm bốn loại của bàn giao một vai.
alter table notifications drop constraint notifications_kind_check;
alter table notifications add constraint notifications_kind_check check (kind in (
  'handover-accept', 'handover-done', 'handover-mentor', 'post-pending', 'post-approved', 'post-rejected',
  'role-handover-request', 'role-handover-decision', 'role-handover-accept', 'role-handover-done', 'role-handover-proxy'));

-- Ảnh bằng chứng của bàn giao hộ (JPG hoặc PNG, tối đa 5 MB, mã hóa base64). Chỉ người tải lên và cán bộ trường xem; máy chủ xóa sau 30 ngày.
create table evidence_files (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  uploader_id text not null references persons (id),
  handover_id text references role_handovers (id),
  name text not null,
  mime text not null check (mime in ('image/jpeg', 'image/png')),
  size integer not null,
  uploaded_at timestamptz not null,
  data text not null
);

create index evidence_files_club_idx on evidence_files (club_id, seq);
