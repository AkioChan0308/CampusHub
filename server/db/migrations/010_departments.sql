-- 09/11/2026. Ban của CLB: do chủ nhiệm cấu hình; mỗi ban đúng một trưởng ban, một người được làm trưởng nhiều ban.
-- Trước đây "ban" chỉ là một ô chữ trên từng thành viên (memberships.department). Thành viên vẫn thuộc ban qua tên ban đó.

create table departments (
  seq bigint generated always as identity,
  id text primary key,
  club_id text not null references clubs (id),
  name text not null,
  head_id text references persons (id)
);

-- Tên ban không trùng trong cùng một CLB, không phân biệt hoa thường.
create unique index departments_club_name_idx on departments (club_id, lower(name));

-- Chuyển dữ liệu cũ: mỗi ban đang có thành viên thành một ban của CLB. "Chưa xếp ban" không phải một ban.
insert into departments (id, club_id, name)
select 'ban-' || club_id || '-' || (row_number() over (partition by club_id order by min(seq)))::text, club_id, min(department)
from memberships
where lower(department) <> 'chưa xếp ban'
group by club_id, lower(department);

-- Trưởng ban của ban cũ là người có vai "head" trong ban đó (người vào CLB trước nếu có hai người).
update departments d set head_id = (
  select m.person_id from memberships m
  where m.club_id = d.club_id and lower(m.department) = lower(d.name) and m.role = 'head'
  order by m.seq limit 1
);

-- Vai "trưởng ban" phải khớp việc làm trưởng một ban: người có vai head mà không còn làm trưởng ban nào (ban có hai trưởng, hoặc chưa xếp ban) về thành viên.
update memberships m set role = 'member'
where m.role = 'head'
  and not exists (select 1 from departments d where d.club_id = m.club_id and d.head_id = m.person_id);

-- Ban mới ở bước 1 của bàn giao: trưởng ban từ danh sách người sang "trưởng của từng ban" (ban của người đó hiện nay; mỗi ban một người).
update handovers h set new_board = jsonb_set(h.new_board, '{heads}', coalesce((
  select jsonb_agg(jsonb_build_object('department', x.department, 'personId', x.person_id) order by x.department)
  from (
    select distinct on (lower(m.department)) m.department, m.person_id
    from jsonb_array_elements_text(h.new_board -> 'heads') as hid (person_id)
    join memberships m on m.club_id = h.club_id and m.person_id = hid.person_id
    where lower(m.department) <> 'chưa xếp ban'
    order by lower(m.department), m.seq
  ) x
), '[]'::jsonb))
where h.new_board is not null and jsonb_typeof(h.new_board -> 'heads') = 'array';
