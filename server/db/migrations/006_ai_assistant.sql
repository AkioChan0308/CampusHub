-- 22/10/2026. Trợ lý cho bàn giao (bản mẫu): bản tóm tắt lưu vào biên bản và số lượt dùng theo CLB và học kỳ.

-- summary: bản tóm tắt cho ban mới, đã được ban điều hành duyệt và sửa (text, by, at, mock). Trống là chưa lưu.
alter table handovers add column summary jsonb;

-- Bản miễn phí giới hạn lượt hỏi theo kỳ; mức giới hạn chưa có nên chỉ đếm, không chặn (xem AI_FREE_ASKS_PER_TERM trong server/.env.example).
create table ai_usage (
  seq bigint generated always as identity,
  club_id text not null references clubs (id),
  term text not null,
  asks integer not null default 0 check (asks >= 0),
  summaries integer not null default 0 check (summaries >= 0),
  primary key (club_id, term)
);
