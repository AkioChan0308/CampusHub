-- Lược đồ đầu tiên của CampusHub (04/10/2026). Mỗi bảng ứng với một danh sách trong AppState (web/src/lib/types.ts).
-- Khóa là mã có sẵn trong dữ liệu (mã người, mã CLB, mã khoản chi…), không thêm mã số tự tăng.
-- Cột seq chỉ để nạp lại đúng thứ tự đã thêm vào (luật trong web/src/lib luôn thêm vào cuối danh sách).
-- Tiền: số nguyên, đơn vị đồng. Thời điểm: timestamptz; máy chủ đọc ra theo giờ Việt Nam (+07:00).
-- Sửa lược đồ: thêm file 002_….sql, không sửa file đã chạy.

create table persons (
  seq bigint generated always as identity,
  id text primary key,
  name text not null,
  email text not null,
  school_year smallint check (school_year between 1 and 5),
  kind text not null check (kind in ('student', 'staff')),
  staff_title text
);
-- Đăng nhập Google tìm người theo email: mỗi email chỉ một người.
create unique index persons_email_key on persons (lower(email));

create table clubs (
  seq bigint generated always as identity,
  id text primary key,
  name text not null,
  field text not null,
  schedule text not null,
  location text not null,
  accepting_applications boolean not null,
  mentor text,
  term text not null,
  -- Chỉ bản demo: số tổng hợp của các CLB không có dữ liệu chi tiết.
  static_stats jsonb
);

create table memberships (
  seq bigint generated always as identity,
  club_id text not null references clubs (id),
  person_id text not null references persons (id),
  code text not null,
  department text not null,
  role text not null check (role in ('president', 'vice', 'treasurer', 'head', 'member')),
  invite text not null check (invite in ('accepted', 'pending')),
  invite_code text,
  deletion_requested_at timestamptz,
  primary key (club_id, person_id),
  -- Mã thành viên nằm trong nội dung chuyển khoản: không trùng trong một CLB.
  unique (club_id, code)
);

create table applications (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  person_id text not null references persons (id),
  name text not null,
  email text not null,
  school_year smallint not null check (school_year between 1 and 5),
  reason text not null,
  submitted_at timestamptz not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  decided_by text references persons (id)
);

create table events (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  title text not null,
  kind text not null check (kind in ('session', 'open')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text not null,
  checkin_until timestamptz not null,
  status text not null check (status in ('upcoming', 'open', 'closed')),
  closed_at timestamptz
);

create table attendance (
  seq bigint generated always as identity,
  event_id text not null references events (id),
  person_id text not null references persons (id),
  at timestamptz not null,
  method text not null check (method in ('qr', 'manual')),
  -- Người điểm danh tay (luật: ghi lại ai đã điểm danh tay).
  by_person_id text references persons (id),
  device_id text,
  primary key (event_id, person_id),
  check (method = 'qr' or by_person_id is not null)
);
-- Mỗi điện thoại chỉ điểm danh cho một người trong một buổi.
create unique index attendance_one_person_per_device on attendance (event_id, device_id) where device_id is not null;

create table collections (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  term text not null,
  name text not null,
  amount bigint not null check (amount > 0),
  due_date timestamptz not null,
  code_prefix text not null,
  receiver_id text not null references persons (id),
  account_name text not null,
  bank_label text not null,
  -- Chỉ lưu 4 số cuối của tài khoản nhận quỹ.
  last4 text not null check (last4 ~ '^[0-9]{4}$')
);

create table payments (
  seq bigint generated always as identity,
  collection_id text not null references collections (id),
  person_id text not null references persons (id),
  status text not null check (status in ('unpaid', 'reported', 'paid', 'partial')),
  method text check (method in ('transfer', 'cash')),
  amount_paid bigint not null check (amount_paid >= 0),
  reported_at timestamptz,
  paid_at timestamptz,
  primary key (collection_id, person_id)
);

create table budget_items (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  term text not null,
  name text not null,
  period text not null,
  source text not null,
  planned bigint not null check (planned >= 0)
);

create table expenses (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  kind text not null check (kind in ('proposal', 'reimbursement')),
  title text not null,
  amount bigint not null check (amount > 0),
  requester_id text not null references persons (id),
  created_at timestamptz not null,
  budget_item_id text references budget_items (id),
  receipt text,
  reason text not null,
  status text not null check (status in ('pending', 'mentor', 'approved', 'rejected', 'spent')),
  reject_note text,
  -- Luật: từ chối phải ghi lý do.
  check (status <> 'rejected' or coalesce(reject_note, '') <> '')
);

-- Lịch sử của từng khoản chi: chỉ thêm, không sửa, không xóa.
create table expense_history (
  seq bigint generated always as identity,
  expense_id text not null references expenses (id),
  pos integer not null check (pos >= 0),
  at timestamptz not null,
  by_person_id text not null references persons (id),
  note text not null,
  primary key (expense_id, pos)
);

-- Sổ quỹ: chỉ thêm bút toán, không sửa, không xóa (trigger ở cuối file). Muốn điều chỉnh thì thêm bút toán mới.
create table ledger (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  entry_date timestamptz not null,
  direction text not null check (direction in ('in', 'out')),
  amount bigint not null check (amount > 0),
  description text not null,
  collection_id text references collections (id),
  person_id text references persons (id),
  expense_id text references expenses (id),
  budget_item_id text references budget_items (id),
  created_by text not null references persons (id),
  created_at timestamptz not null
);

create table statements (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  collection_id text not null references collections (id),
  file_name text not null,
  from_at timestamptz not null,
  to_at timestamptz not null,
  uploaded_at timestamptz not null
);

create table statement_txns (
  seq bigint generated always as identity,
  statement_id text not null references statements (id),
  id text not null,
  txn_date timestamptz not null,
  amount bigint not null,
  sender text not null,
  content text not null,
  -- Kết quả đối soát (khớp tự động, cần gán tay, bỏ qua) theo kiểu TxnResult trong web/src/lib/types.ts.
  result jsonb not null,
  primary key (statement_id, id)
);

create table budgets (
  seq bigint generated always as identity,
  club_id text not null references clubs (id),
  term text not null,
  submitted_at timestamptz,
  support_amount bigint not null check (support_amount >= 0),
  support_purpose text not null,
  support_status text not null check (support_status in ('pending', 'approved', 'rejected')),
  primary key (club_id, term)
);

create table handovers (
  seq bigint generated always as identity,
  club_id text not null references clubs (id),
  from_term text not null,
  to_term text not null,
  step smallint not null check (step between 1 and 6),
  locked_balance bigint not null,
  new_receiver_person_id text references persons (id),
  new_receiver_bank text,
  new_receiver_account text,
  transfer_ref text,
  primary key (club_id, from_term)
);

-- Nhật ký đồng ý (Luật 91/2025): ai, lúc nào, mục đích nào, phiên bản nào. Không xóa; chỉ được ghi ngày rút đồng ý một lần.
-- Khóa là số thứ tự trong nhật ký (pos): một người có thể đồng ý cùng một mục đích hai lần trong cùng một giây (gửi lại đơn).
create table consents (
  seq bigint generated always as identity,
  pos integer primary key check (pos >= 0),
  person_id text not null references persons (id),
  club_id text not null references clubs (id),
  purpose text not null check (purpose in ('membership', 'phone', 'age16', 'application')),
  version text not null,
  at timestamptz not null,
  withdrawn_at timestamptz
);
create index consents_person on consents (person_id, club_id);

-- Phiên đăng nhập. Chỉ lưu mã băm (SHA-256) của cookie: lộ bảng này cũng không dùng được để đăng nhập.
create table sessions (
  token_hash text primary key,
  person_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------- Bảng chỉ được thêm ----------

create function campushub_chi_duoc_them() returns trigger language plpgsql as $$
begin
  raise exception 'Bảng % chỉ được thêm dòng mới, không sửa, không xóa.', tg_table_name using errcode = 'P0001';
end
$$;

-- TRUNCATE chỉ được phép khi đặt lại dữ liệu mẫu của bản demo (máy chủ đặt campushub.dat_lai_mau = 'on' trong transaction đó).
create function campushub_chan_xoa_het() returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('campushub.dat_lai_mau', true), '') <> 'on' then
    raise exception 'Không được xóa hết bảng %.', tg_table_name using errcode = 'P0001';
  end if;
  return null;
end
$$;

create trigger ledger_chi_duoc_them before update or delete on ledger
  for each row execute function campushub_chi_duoc_them();
create trigger ledger_chan_xoa_het before truncate on ledger
  for each statement execute function campushub_chan_xoa_het();

create trigger expense_history_chi_duoc_them before update or delete on expense_history
  for each row execute function campushub_chi_duoc_them();
create trigger expense_history_chan_xoa_het before truncate on expense_history
  for each statement execute function campushub_chan_xoa_het();

create function campushub_dong_y_chi_ghi_ngay_rut() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Nhật ký đồng ý không được xóa.' using errcode = 'P0001';
  end if;
  if old.withdrawn_at is not null
     or new.pos <> old.pos or new.person_id <> old.person_id or new.club_id <> old.club_id or new.purpose <> old.purpose
     or new.version <> old.version or new.at <> old.at then
    raise exception 'Nhật ký đồng ý chỉ được ghi thêm ngày rút đồng ý, một lần.' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger consents_chi_ghi_ngay_rut before update or delete on consents
  for each row execute function campushub_dong_y_chi_ghi_ngay_rut();
create trigger consents_chan_xoa_het before truncate on consents
  for each statement execute function campushub_chan_xoa_het();
