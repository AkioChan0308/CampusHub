-- 29/10/2026. Mentor (cán bộ trường) xác nhận biên bản bàn giao sau khi ban mới đã xác nhận nhận bàn giao.
-- Cả hai cột cùng có hoặc cùng trống.
alter table handovers
  add column mentor_confirmed_by text references persons (id),
  add column mentor_confirmed_at timestamptz,
  add constraint handovers_mentor_confirm_pair check ((mentor_confirmed_by is null) = (mentor_confirmed_at is null));
