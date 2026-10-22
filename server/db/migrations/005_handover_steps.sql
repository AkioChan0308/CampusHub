-- 22/10/2026. Bàn giao thành 7 bước (thêm bước "kiểm tra kho bàn giao" vào vị trí 3) và bảng việc cần làm.

-- Bước cũ từ 3 trở đi dời xuống một bước: bước 3 cũ (đổi tài khoản nhận quỹ) thành bước 4.
alter table handovers drop constraint handovers_step_check;
update handovers set step = step + 1 where step >= 3;
alter table handovers add constraint handovers_step_check check (step between 1 and 7);

-- new_board: ban mới chọn ở bước 1. transferred: mã các tài khoản trong kho đã chuyển quyền ở bước 5.
-- history là nội dung biên bản bàn giao: mỗi dòng một bước đã làm (lúc nào, ai, làm gì).
alter table handovers
  add column locked_at timestamptz,
  add column new_board jsonb,
  add column transferred jsonb not null default '[]',
  add column accepted_at timestamptz,
  add column accepted_by text references persons (id),
  add column history jsonb not null default '[]';

-- event_id và process_id chỉ là liên kết gợi ý: không nối khóa ngoại, để xóa buổi hay quy trình không bị chặn.
create table tasks (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  title text not null,
  assignee_id text not null references persons (id),
  due timestamptz not null,
  status text not null check (status in ('todo', 'doing', 'done')),
  event_id text,
  process_id text,
  created_by text not null references persons (id),
  created_at timestamptz not null
);

create table task_history (
  seq bigint generated always as identity,
  task_id text not null references tasks (id),
  pos integer not null check (pos >= 0),
  at timestamptz not null,
  by_person_id text not null references persons (id),
  note text not null,
  primary key (task_id, pos)
);
