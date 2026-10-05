-- 05/10/2026. Tiền chuyển khoản thủ quỹ đã "Ghi nhận tay" mà chưa thấy trong sao kê (Payment.awaitingStatement).
-- Khi dòng sao kê của khoản đó về, phần này chỉ được nối, không ghi lần hai; chỉ phần chênh được ghi thêm vào sổ quỹ.
-- Không có giá trị (null) nghĩa là không còn tiền nào chờ nối.

alter table payments add column awaiting_statement bigint check (awaiting_statement > 0);
