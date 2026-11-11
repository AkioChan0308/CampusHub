-- 09/11/2026. Bàn giao một vai: lời dặn của người giao cho người nhận (viết ở bước 3) và danh sách những gì người giao đang giữ lúc đó
-- (biểu mẫu, tài khoản, việc chưa xong), giữ lại cho người nhận và biên bản dù quyền tài khoản đã chuyển ở bước 5.

alter table role_handovers add column note text;
alter table role_handovers add column snapshot jsonb;
