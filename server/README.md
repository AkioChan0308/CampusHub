
- **Lời dặn và `snapshot` của bàn giao một vai** (09/11/2026): migration `012_role_handover_notes.sql` (cột `note`, `snapshot` của `role_handovers`; thêm file mới vì 011 đã chạy trên DB Docker của Hiệu), `holding` trong DTO đổi từ số sang danh sách, `reviewKit` nhận `note`. Test trong `test/role-handovers.test.ts`.
