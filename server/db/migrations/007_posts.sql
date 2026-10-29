-- 29/10/2026. Tin của CLB trên Cộng đồng, duyệt trước hiện sau: tin mới luôn chờ cán bộ trường duyệt; chỉ tin đã duyệt hiện cho mọi người.

create table posts (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  kind text not null check (kind in ('event', 'promo', 'news')),
  title text not null,
  body text not null,
  event_at timestamptz,
  place text,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  created_by text not null references persons (id),
  created_at timestamptz not null,
  reviewed_by text references persons (id),
  reviewed_at timestamptz,
  reject_reason text,
  -- Đã xem xét thì có người và lúc xem xét; từ chối thì có lý do; chưa xem xét thì không có gì trong ba cột đó.
  check ((status = 'pending') = (reviewed_by is null and reviewed_at is null)),
  check ((status = 'rejected') = (reject_reason is not null))
);
