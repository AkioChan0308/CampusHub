-- 30/10/2026. Mục Thông báo (chuông) của mỗi người: bàn giao cần xác nhận, bàn giao xong, tin được duyệt hay bị từ chối...
-- Giữ lại cả khi vai của người nhận đã đổi (chủ nhiệm cũ vẫn thấy "Bàn giao xong"). Chưa có read_at là chưa đọc.

create table notifications (
  seq bigint generated always as identity,
  id text primary key,
  person_id text not null references persons (id),
  kind text not null check (kind in ('handover-accept', 'handover-done', 'handover-mentor', 'post-pending', 'post-approved', 'post-rejected')),
  title text not null,
  body text not null,
  at timestamptz not null,
  href text,
  read_at timestamptz
);

create index notifications_person_idx on notifications (person_id, seq);
