# Tiến độ MVP CampusHub (Phần A)

*Cập nhật ngày 29/10/2026 (thêm mục "Checkpoint 3: tình hình"; số test chạy lại ngày 29/10). Mỗi khi xong một nhóm việc, sửa file này trước khi báo xong.*

File này có hai phần: **Phần A** (ngay dưới đây): tiến độ, cách làm việc, cách kiểm tra. **Phần B** (cuối file): bản mô tả gốc của đợt chỉnh sửa và bổ sung prototype sau Checkpoint 2 (giao ngày 22/10/2026). Số mục (1, 2, 5.2...) của mỗi phần đứng riêng; nơi khác trỏ tới thì ghi rõ "phần B, mục 5.2".

Agent hay người mới nhận việc: đọc file này trước, rồi tới:
1. `docs/cay-thu-muc.md`: cây thư mục, trang nào nằm ở đâu, muốn sửa gì thì mở file nào.
2. `docs/luong-nguoi-dung.md`: luồng của từng nhóm người dùng, từng bước (viết cho cả người không làm kỹ thuật); cuối file là phần kiểm thử bằng tay các luồng.
3. `CLAUDE.md`: luật nghiệp vụ, luật giao diện, những gì không được đưa vào repo.
4. `DESIGN.md`: hệ thiết kế "Lịch bloc".
5. `web/README.md`: bản đồ web, mục "Chỗ code khác bản vẽ".
6. `server/README.md`: bản đồ máy chủ, danh sách thay đổi để báo Khoa.
7. `docs/api.md`: hợp đồng API.

---

## Checkpoint 3: tình hình (29/10/2026)

**Đề bài CP3 (tuần 7):**
1. Mô hình kinh doanh: gọi tên mô hình, nguồn thu **có giá**, cơ cấu chi phí, trình bày bằng Business Model Canvas (5/10 điểm).
2. Prototype dùng AI, kinh doanh được (5/10 điểm). Chỉ vẽ giao diện thì dừng ở điểm trung bình. Cô khuyến khích dùng công cụ AI như Lovable, Stitch, Figma.
3. Thử prototype với **ít nhất 20 người** đúng chân dung khách hàng ở CP2, bằng khảo sát hoặc focus group.

| Việc | Tình hình | Còn thiếu |
|---|---|---|
| Gọi tên mô hình | **Freemium**: lõi bộ bàn giao miễn phí, gói nâng cao trả phí. Hiệu yêu cầu 26/10: BMC chỉ ghi Freemium. Input Hub, gói thành viên, add-on, quảng cáo, nhà trường trả tiền chỉ là giả thuyết, để ngoài BMC. | Cập nhật slide BMC của CP2 cho khớp. |
| BMC | Đã vẽ bản Freemium thành trang web để xem (26/10); Hiệu chưa duyệt bản cuối. | Chưa đưa vào slide. |
| Nguồn thu có giá | **Giá giả định (Hiệu chốt 29/10/2026, chưa kiểm với người dùng): gói nâng cao 99.000 ₫ mỗi CLB mỗi tháng** (Hiệu đổi từ 399.000 ₫ mỗi kỳ sang trả theo tháng cho nhẹ; một học kỳ khoảng 4 tháng thì khoảng 396.000 ₫, vẫn sát đáy mức cố vấn ước). Căn cứ: cố vấn Esports ước 400.000–800.000 ₫ mỗi kỳ (chọn sát đáy); 3/7 ban điều hành đã trả khoản nhỏ cho công cụ khác; mentor gợi ý dưới 100 thành viên thì miễn phí. **Chia gói theo cả quy mô và tính năng:** CLB dưới 100 thành viên dùng miễn phí nhưng ít tính năng hơn, chủ yếu những tính năng ít tốn tài nguyên máy chủ, và tính năng nặng (trợ lý AI, thống kê tham gia) bị giới hạn lượt dùng; CLB từ 100 thành viên, hoặc CLB muốn dùng nhiều tính năng nặng, thì trả phí. Số lượt AI miễn phí và danh sách tính năng từng gói: chưa có. | Đưa mức 99.000 ₫ mỗi tháng cùng hai mức so sánh vào phiếu khảo sát 20 người để kiểm. Chốt danh sách tính năng từng gói. Ghi giá vào BMC và slide. |
| Cơ cấu chi phí | Bảng `CP3/Du toan chi tieu CampusHub.xlsx` có đơn giá kèm nguồn. Phương án hạ tầng A (Render): web 7 + API 7 + cơ sở dữ liệu 6 + 1 GB lưu 0,3 USD mỗi tháng, tên miền .com 429.000 ₫ mỗi năm; HTTPS, đăng nhập Google, VietQR miễn phí. Nhân sự: 6 thành viên làm không lương (Hiệu chốt 05/10). | Còn 6 khoản chưa có giá (sao lưu phương án B, tư vấn luật, in ấn, quà cảm ơn, đi lại, quảng cáo fanpage). **Chưa có dòng chi phí AI.** Phương án A hay B, tên miền .com hay .vn chưa chốt. |
| Prototype chạy được | Có. Web Next.js, máy chủ Express, PostgreSQL tùy chọn; đủ luồng bàn giao 7 bước, Kho bàn giao, việc cần làm, điểm danh QR, sổ quỹ, đối soát. Test 29/10: server 114/114, web 76/76, typecheck sạch cả hai. Bấm thử `npm run e2e` 23/10: 256/256; sau khi thêm trang chung (29/10) `feed-shell` 32/32, các script khác đạt trừ một kiểm tra phụ thuộc ngày ("Nhà trường: 6 CLB, 4 không hoạt động", API trả 3). | Chưa đưa lên mạng; dữ liệu vẫn là dữ liệu mẫu; chưa tạo khóa đăng nhập Google. |
| Tính năng AI | **Đã nối AI thật (29/10/2026):** trợ lý bàn giao gọi Gemini (`AI_MODE=real`, mô hình chọn bằng `AI_MODEL`, mặc định `gemini-3.1-flash-lite`, gói miễn phí của Google AI Studio). Thử một lần với dữ liệu mẫu: tóm tắt và hỏi đáp đều chạy, 2 yêu cầu, không lỗi. Gọi lỗi hoặc hết hạn mức thì lùi về bản mẫu và màn ghi rõ. Không gửi tên, email, link, nhãn tài khoản; hỏi đáp không gửi phần tài khoản. Hạn mức miễn phí của dự án (đọc từ AI Studio): 15 lượt mỗi phút, 500 lượt mỗi ngày với mô hình này, dùng chung mọi CLB. | Chưa có chi phí AI khi lên gói trả phí. Chưa đặt giới hạn lượt mỗi CLB (`AI_FREE_ASKS_PER_TERM`). Gói miễn phí cho Google dùng nội dung để cải thiện sản phẩm của họ, nên chỉ thử bằng dữ liệu mẫu. Chưa thử Gemma 4. |
| Bản trả phí | Chỉ là trang mô tả và khung khóa "Thống kê tham gia", không có giá, không có thanh toán. | Chưa có gì để kiểm người dùng chịu trả tiền. |
| Thử với 20 người | **Chưa bắt đầu.** `CP3/Danh sach 20 nguoi test prototype.xlsx` (tạo 06/10) vẫn trống: 0/20 dòng, chưa mời ai. Nguồn người đã có sẵn (Google Form, các CLB ở FPT). Chưa thấy phiếu khảo sát hay kịch bản focus group cho buổi thử. | Chốt số người từng nhóm (ban điều hành, thành viên, ban quản lý CLB), mời, soạn phiếu, chạy thử, ghi kết quả. |

**Việc cần Hiệu quyết:** có nối AI thật không và AI làm việc gì (đề xuất giữ hai việc đang có: tóm tắt cho ban mới, hỏi đáp trong Kho bàn giao); ~~mức giá giả định cho gói nâng cao~~ (đã chốt 29/10: 99.000 ₫ mỗi tháng, xem bảng trên); thử bằng focus group hay khảo sát; hạn nộp CP3 chính xác (các ghi chú cũ ghi 24–25/10, bảng đề bài ghi tuần 7).

**Nhánh `main` còn ở commit đầu (05/10)**; mọi việc từ 05/10 tới nay nằm ở `develop`.

---

## 1. Đang ở đâu

**Đã có:**
- Web có đủ 16 màn của bản vẽ, cộng 5 màn mới để tạo dữ liệu từ đầu. Màn nào cũng theo hệ thiết kế "Lịch bloc" và gọi API thật. Hệ tím cũ đã bỏ hẳn (05/10).
- Trang đầu cho người chưa đăng nhập, có hai video demo; đăng ký bằng Google rồi đặt tên tài khoản và mật khẩu; đăng nhập bằng mật khẩu (Hiệu duyệt 05/10/2026).
- Máy chủ kiểm tra quyền ở mọi API.
- Dữ liệu lưu trong bộ nhớ, hoặc trong PostgreSQL khi đặt `DATABASE_URL`.

**Chưa có:**
- Dữ liệu vẫn là dữ liệu mẫu (giả).
- Đăng nhập Google đã có code, nhưng nhóm chưa tạo khóa Google.
- Chưa đưa lên mạng.
- Repo trên GitHub: https://github.com/AkioChan0308/CampusHub (nhánh `main` và `develop`, commit đầu ngày 05/10/2026). **Chỉ commit và push khi Hiệu bảo.**

**Mục tiêu trước mắt** (Hiệu chốt ngày 05/10/2026): MVP chạy trọn các luồng bằng dữ liệu giả, trên máy này.
- Đã xong: nhóm "tạo dữ liệu từ đầu"; script bấm thử vào repo (`web/e2e/`); bỏ hệ tím cũ, trang chọn vai sang Lịch bloc; `.gitignore` chặn skill và file có thể chứa dữ liệu thật. Hiệu duyệt tất cả ngày 05/10/2026.
- Đã xong và Hiệu duyệt ngày 05/10/2026: trang đầu (hai video demo, hiệu ứng trượt trái vào, phải ra khi cuộn), đăng nhập bằng mật khẩu, đăng ký bằng Google, đặt tên tài khoản và mật khẩu. Đã đưa lên nhánh `develop` (commit 108aa6f).
- Cũng ngày 05/10/2026 (Hiệu yêu cầu): bỏ trang chọn vai `/demo`. Thay bằng bảng tài khoản mẫu của 7 vai dưới ô đăng nhập (bấm là điền sẵn) và nút đặt lại dữ liệu mẫu; máy chủ chế độ demo tự tạo các tài khoản này. Link "Đổi vai" trong app đã bỏ, đổi vai bằng Đăng xuất.
- **Việc ưu tiên mới sau CP2 (22/10/2026): đọc phần B của file này (cuối file) trước.** Phần đó nói prototype cần chỉnh và bổ sung gì và thứ tự làm; nó đứng trước "nhóm 2" dưới đây.
  - **Nhóm A xong (chờ Hiệu duyệt):** Kho bàn giao (`/clubs/[clubId]/handover-kit`: biểu mẫu, quy trình, tài khoản; không lưu mật khẩu) và dữ liệu mẫu của nó. Thêm theo góp ý của Hiệu: nút Đăng xuất ở tab Của tôi (phía thành viên trước đây không có).
  - **Nhóm B xong (chờ Hiệu duyệt):** Bàn giao đủ 7 bước (thêm bước "Kiểm tra kho bàn giao"; chủ nhiệm mới xác nhận ở bước 6 kể cả khi đang là thành viên thường; bước 7 là biên bản, xuất CSV và in được) và Việc cần làm (`/clubs/[clubId]/tasks` cho ban điều hành, `/me/tasks` cho thành viên).
  - **Nhóm C xong (chờ Hiệu duyệt):** trợ lý bàn giao bản mẫu (hỏi đáp trong kho, tóm tắt lưu vào biên bản; `AI_MODE=mock`), thẻ khóa "Thống kê tham gia" và trang Bản trả phí, trang chủ ban điều hành đổi thứ tự (việc cần làm, bàn giao, sự kiện, quỹ thu gọn ở cuối; tiêu đề đổi từ "Việc cần làm" thành "Trang chủ"), menu gom nhóm Quỹ (đóng mặc định), chữ trang đầu và README theo định vị "bộ bàn giao", khung quảng cáo mẫu ở `/me` và `/explore`.
  - **Hướng đi (Hiệu chốt 22/10/2026): web trước, chưa làm app.** Khung thành viên trên laptop đã đổi thành trang web thường (từ 1024px); đăng nhập không còn đưa ban điều hành vào `/me` vì `next` sót lại. Chi tiết ở `web/README.md`, mục cuối.
  - **Duyệt tin của CLB (29/10/2026, Hiệu chốt: duyệt trước, hiện sau; đã làm thật, chờ Hiệu duyệt giao diện):** ban điều hành có quyền đăng tin, tin chờ cán bộ trường duyệt; Cộng đồng chỉ hiện tin đã duyệt, người đăng thấy tin của mình mờ kèm nhãn chờ duyệt; trang mới `/school/posts`. Có API, bảng `posts` (migration 007) và test (server 114/114, web 76/76; e2e `post-review.cjs` 15/15). Chi tiết ở `web/README.md`, `docs/api.md`. **Báo Khoa:** đổi hợp đồng API, thêm migration.
  - **Bốn việc làm thêm (29/10/2026, Hiệu chọn; đã làm, chờ Hiệu duyệt giao diện):** sửa tin bị từ chối rồi gửi lại; đổi vai tự động sau khi ban mới xác nhận bàn giao; người ở nhiều CLB chọn CLB trong menu avatar; mentor xác nhận biên bản bàn giao ở màn nhà trường. Chi tiết ở `web/README.md` và `server/README.md`. **Báo Khoa:** đổi hợp đồng API (thêm hai API), thêm migration 008, đổi hành vi `acceptHandover`.
  - **Hướng dẫn cho ban điều hành (29/10/2026, Hiệu yêu cầu; đã làm, chờ Hiệu duyệt giao diện):** tự chạy lần đầu đăng nhập, đi qua từng tab và từng mục trong tab (37 bước), xem lại từ menu avatar. Chi tiết ở `web/README.md`. Cùng ngày: Trang chung đổi tên thành **Cộng đồng**, mục theo vai (Của tôi, Nhà trường, Tạo CLB) chuyển vào menu avatar, tắt huy hiệu Next.js che avatar khi chạy dev.
  - **Trang chung (29/10/2026, Hiệu yêu cầu; đã làm khung mẫu, chờ Hiệu duyệt):** điều hướng làm thật (logo về trang chung, thanh tab theo vai, thành viên đăng nhập xong vào trang chung, `/me` giới hạn cho người chưa vào CLB, quyền đăng tin `post`); tin, giới thiệu CLB, nhắn tin và đăng tin chỉ là khung dữ liệu mẫu ghi "đang phát triển". Chi tiết ở `docs/mo-ta-bang-tin-chung.md` mục 8 và `web/README.md`. Bản mô tả gốc của ý tưởng: Trang chung cho mọi vai, nơi các CLB đăng tin, quảng bá, giao lưu và nhắn tin với admin CLB (Hiệu đề xuất 22/10/2026, mở rộng 29/10/2026: logo về trang chung, mục theo vai trên thanh trên, thành viên đăng nhập xong vào thẳng trang chung). Bản mô tả 2 ở `docs/mo-ta-bang-tin-chung.md`, có 9 câu hỏi cần Hiệu quyết và đề xuất làm theo 4 bước. Đã dựng khung rỗng `/feed` và `/clubs/[clubId]/posts` (đường dẫn, khung xương, trạng thái rỗng; chưa có API, chưa có lối vào); chưa kiểm trên trình duyệt.
  - **Nhóm D chưa làm:** hồ sơ hoạt động của thành viên; quay lại hai video demo của trang đầu (video hiện vẫn quay bản cũ, chưa có Kho bàn giao). Ảnh buổi sinh hoạt: Hiệu chọn bỏ lần này.
  - **Chưa qua kiểm:** agent `impeccable-finish-reviewer` đã duyệt nhóm A và B (22/10/2026, 8 điểm, đã sửa 7) và nhóm C (22/10/2026, 8 mục, đã sửa phần lớn: thứ tự hook ở menu, nhãn bản mẫu, trợ năng, khung quảng cáo, Quỹ xuống cuối trang chủ; còn lại: ngày trong dữ liệu mẫu của "Sự kiện sắp tới" vẫn theo 03/10/2026; đã chụp và xem bố cục ở 1100 và 1280px, ổn; trang ban điều hành tràn ngang bằng đúng thanh cuộn ở 1100px do `.l-board` có `min-width: 1100px`, có từ trước); chưa duyệt lại sau khi sửa; `DESIGN.md` chưa cập nhật bởi `impeccable-documenter`; `CLAUDE.md` đã sửa ngày 22/10/2026 sau khi hỏi Hiệu (định vị sản phẩm, danh sách màn, ngoại lệ khung quảng cáo mẫu, Input Hub và gói VIP vào "Không làm trong MVP").
  - **Kiểm tra bấm thử (23/10/2026):** `npm run e2e` chạy 10 script, 256 kiểm tra, **đạt hết** (smoke 40, money-flows 11, members-qr-handover 15, member-student-school 42, club-setup 27, handover-kit-tasks 41, assistant-dashboard 31, feed-shell 8, regressions 12, auth 29). Ba kiểm tra cũ từng lệch vì dùng ngày thật của máy đã sửa để tính số mong đợi theo hôm nay (`inactiveClubsToday`, `collectionSizeAfterApproval` trong `web/e2e/common.cjs`). Chưa chạy lại bộ đo khung xương (`npm run e2e:skeleton`) sau lần đổi khung thành viên và menu.
  - **Chưa làm ở nhóm B, cần Hiệu quyết:** bàn giao xong thì vai trò trong CLB chưa tự đổi (chủ nhiệm mới chưa thành chủ nhiệm, chủ nhiệm cũ chưa thành thành viên); chỗ mentor xác nhận biên bản mới chỉ là một dòng chữ, chưa có thao tác ở phía trường.
- Việc tiếp theo: nhóm C của file trên. Sau đó nhóm 2 "luật còn thiếu" (mục 6), trừ phần bàn giao đã làm ở nhóm B.

Người dùng trong các phiên làm việc là **Hiệu**, design lead tạm thời, có quyền quyết định mọi việc. Chỗ nào tài liệu ghi "chờ Hiệu duyệt" thì hỏi thẳng người dùng.

## 2. Chạy thử trong 5 phút

Cần Node.js 22.12 trở lên.

```bash
cd server && npm install && npm run dev   # http://localhost:4000/api/v1, chế độ demo, dữ liệu trong bộ nhớ
cd web && npm install && npm run dev      # http://localhost:3000
```

- **Thử:** mở http://localhost:3000/login. Dưới ô đăng nhập là bảng tài khoản mẫu cho 7 vai (chỉ có ở bản demo, mật khẩu chung `CauLong#2026`); bấm một vai là điền sẵn, rồi bấm Đăng nhập. http://localhost:3000 là trang đầu cho người chưa đăng nhập (mở bằng cửa sổ ẩn danh nếu trình duyệt đang đăng nhập).
- **Dùng PostgreSQL:** xem `docs/postgresql.md`, có cách chạy bằng Docker và không Docker.
- **Lệnh kiểm tra:**

| Ở đâu | Lệnh | Kết quả lúc cập nhật file này |
|---|---|---|
| `server/` | `npm test` | 97/97 (29/10) |
| `server/` | `npm run test:db` (cùng các test, lưu bằng PostgreSQL chạy trong Node) | 96/96 |
| `server/` | `npm run typecheck` | sạch |
| `web/` | `npm test` | 56/56 (29/10) |
| `web/` | `npm run typecheck`, `npm run build` | sạch |
| `web/` | `npm run e2e` (bấm thử mọi luồng; cần web đang chạy và máy chủ chạy bằng `npm start`) | smoke 40/40, nhóm tiền 11/11, nhóm 2 15/15, nhóm 3–4 42/42, tạo dữ liệu 27/27, sửa lỗi 12/12, đăng nhập 29/29 |

## 3. Các màn đã làm

Mọi màn dưới đây theo Lịch bloc và gọi API. CLB mẫu có mã `cau-long-san-nha`.

| Màn | Đường dẫn | Hiệu duyệt |
|---|---|---|
| BDH-TrangChu | `/clubs/[clubId]` | 03/10/2026 (màn thử đầu tiên) |
| TV-DongQuy | `/me/pay/[collectionId]` | 03/10/2026 (màn thử đầu tiên) |
| Đăng nhập, trang chặn, lỗi | `/login` | 03/10/2026 |
| BDH-DotThu, BDH-DoiSoat, BDH-DuyetChi, BDH-DuTru | `/clubs/[clubId]/collections/[collectionId]`, `/reconcile`, `/expenses`, `/budget` | 03/10/2026 |
| BDH-ThanhVien, BDH-QR, BDH-BanGiao, TV-DiemDanh | `/members`, `/events/[eventId]/qr`, `/handover`, `/checkin` và `/me/attendance` | 04/10/2026 |
| TV-CuaToi, tab Quỹ, TV-LoiMoi, SV-DanhSach, SV-DonXinVao | `/me`, `/me/pay`, `/invite/[code]`, `/explore`, `/explore/[clubId]` | 04/10/2026 |
| NT-TongQuan, NT-ChiTietCLB | `/school`, `/school/clubs/[clubId]` | 04/10/2026 |
| **Chưa có bản vẽ** (Hiệu duyệt mô tả trước khi làm): Tạo CLB, Thêm thành viên, Các buổi, Đợt thu (danh sách, tạo, sửa) | `/clubs/new`, `/clubs/[clubId]/members/add`, `/clubs/[clubId]/events`, `/clubs/[clubId]/collections`, `/clubs/[clubId]/collections/new` | 05/10/2026 |
| Trang lỗi, trang không tìm thấy (trang chọn vai của bản demo đã bỏ ngày 05/10/2026, thay bằng bảng tài khoản mẫu ở `/login`) | | 05/10/2026 |
| **Chưa có bản vẽ:** Trang đầu (hai video demo), Đăng nhập bằng mật khẩu, Đăng ký, Đặt tên tài khoản và mật khẩu; mục "Đăng nhập" ở Của tôi | `/`, `/login`, `/register`, `/account` | 05/10/2026 |
| **Chưa có bản vẽ, làm theo phần B của file này (cuối file) (22/10/2026), chờ Hiệu duyệt:** Kho bàn giao, Bàn giao 7 bước, Việc cần làm (ban điều hành), Việc của tôi (thành viên), dòng Đăng xuất ở Của tôi, trợ lý bàn giao (trong Kho bàn giao và bước 6, 7), trang chủ ban điều hành mới, menu gom nhóm Quỹ, Bản trả phí, khung quảng cáo mẫu | `/clubs/[clubId]/handover-kit`, `/clubs/[clubId]/handover`, `/clubs/[clubId]`, `/clubs/[clubId]/tasks`, `/clubs/[clubId]/paid-plan`, `/me/tasks`, `/me`, `/explore` | chờ duyệt |

Hệ tím cũ `design/ui.css` đã bỏ khỏi code ngày 05/10/2026. Bản vẽ trong `design/screens/` chỉ còn dùng để lấy nội dung, chữ và luật.

## 4. Quyết định Hiệu đã duyệt

Danh sách đầy đủ, kèm lý do: `web/README.md`, mục "Chỗ code khác bản vẽ". Dưới đây là phần chính. Một số mục cũ (ngày 03/10, trước khi có Lịch bloc) nói về `design/ui.css`. Chỗ nào ngược với Lịch bloc thì theo Lịch bloc.

**Giao diện**
- **Hệ thiết kế:** đổi hẳn sang "Lịch bloc" (03/10). CLB sống theo lịch: mỗi màn mở bằng tờ lịch hôm nay, mỗi hạn chót là một tờ lịch nhỏ đếm ngày.
  - Đỏ chỉ cho hôm nay, hạn từ 3 ngày trở xuống, và lỗi nhập.
  - Không bóng đổ. Vùng làm việc là một tờ giấy chia bằng nét 1px.
- **Không thêm** ngày âm lịch trên tờ lịch (03/10).
- **Bỏ hệ tím cũ** (05/10): xóa `design/ui.css` và bản sao trong `web/src/app/globals.css`. Biến theme của shadcn nối vào màu Lịch bloc, nên `npx shadcn add` ra đúng màu. Trang chọn vai làm theo bố cục dòng kẻ. Vẫn giữ 16 màn wireframe trong `design/screens/` để tra nội dung.
- **Chuyển động** (03/10, sau khi Hiệu chê "thô ráp, chớp chớp"):
  - lúc tải dùng khung xương đúng bố cục, không dùng chữ "Đang tải…";
  - chuyển trang mờ qua, nội dung hiện dần;
  - nút đang gửi có vòng xoay; link vừa bấm có vòng xoay;
  - thời lượng 150–250 ms.
  Mọi màn mới phải làm như vậy.
- **Không đặt nhãn nhỏ phía trên tiêu đề.** Vì vậy đã bỏ "Lời mời tham gia" (TV-LoiMoi), và "Chờ bạn duyệt" thành tiêu đề phần (NT-ChiTietCLB).
- **Màu nhãn:** đơn bị từ chối, CLB tạm ngưng nhận đơn, "Quá 30 ngày" dùng nhãn xám thay cho đỏ. "Đang xử lý yêu cầu xóa" dùng màu cam.

**Luồng tiền**
- **Đợt thu:** người cần xử lý lên đầu: báo đã chuyển, rồi chưa đóng, rồi đã đóng (03/10).
- **Đối soát:** dòng mô tả file ghi giờ tải lên (03/10).
- **Duyệt chi:** ghi chú khi duyệt được lưu vào lịch sử khoản chi.
- **Người nhận tiền:** ghi đúng vai hiện tại trong CLB ("Chủ nhiệm …" khi CLB chưa có thủ quỹ), không cố định là "thủ quỹ" (05/10).
- **Mã QR đóng quỹ** của bản demo là mã giả. Dưới mã luôn có dòng "Bản demo: mã này không chuyển tiền được."

**Thành viên, điểm danh, bàn giao**
- Đơn xin vào bị từ chối thì gửi lại được.
- **Điểm danh:**
  - mở màn chiếu QR không tự mở điểm danh; phải bấm "Bắt đầu điểm danh";
  - sau khi đóng vẫn điểm danh tay được.
- **Bàn giao:** chỉ quay lại được bước trước. Bước 2 chưa làm.

**Màn thành viên và nhà trường** (04/10)
- **Yêu cầu xóa dữ liệu:** gửi xong thì có tờ lịch đếm 20 ngày, hạn CLB phải xử lý.
- **Danh sách CLB:** header có avatar chữ tắt thay cho tên ngắn.

**Tạo dữ liệu từ đầu** (mô tả duyệt 04/10, màn duyệt 05/10)
- **Tạo CLB:** ai đã đăng nhập cũng tạo được (phương án nghiệp vụ N1). Người tạo là chủ nhiệm.
- **Thêm thành viên:** nhận file `.xlsx` và `.csv`. Bản demo không gửi email, nên người được thêm nhận link mời riêng, ban điều hành sao chép gửi qua Zalo.
- **Người tạo CLB chưa qua bước xác nhận đủ 16 tuổi.** Hiệu chọn để vậy khi còn dùng dữ liệu giả (05/10). Phải xem lại trước bản thật.

**Máy chủ và dữ liệu**
- **PostgreSQL** (04/10): giữ luật nghiệp vụ trong `web/src/lib`, lưu theo bảng.
  - Mỗi thao tác ghi trong một transaction.
  - Sổ quỹ và lịch sử khoản chi chỉ được thêm, cơ sở dữ liệu tự chặn sửa và xóa.
  - Chạy bằng Docker Compose; có hướng dẫn cả cách không dùng Docker.
- **Thay đổi API:** mỗi lần đều ghi ở `server/README.md`, mục "Đã đổi ngày 03/10/2026 (báo Khoa)", để Khoa duyệt.

## 5. Phần mới, bản vẽ chưa có

- Trang `/login`, các trang chặn (sai vai, chưa vào CLB, chưa nhận lời mời, lỗi máy chủ), trang "Không tìm thấy".
- Lỗi khi quét QR: 7 trường hợp.
- Hộp hỏi lại trước mọi thao tác khó hoàn lại.
- Lịch sử điểm danh của thành viên.
- Trang đầu, đăng ký, đăng nhập bằng mật khẩu, đặt tên tài khoản và mật khẩu (05/10). Hai video của trang đầu quay bằng `web/e2e/record-demo-videos.cjs`; giao diện đổi thì chạy lại (cách chạy ở `web/e2e/README.md`).
- 5 màn tạo dữ liệu ở mục 3. Kèm theo:
  - trang chủ của CLB mới nhắc 3 việc: thêm thành viên, tạo buổi, tạo đợt thu;
  - cột "Thao tác" ở màn Thành viên: link mời, sửa vai;
  - dải chọn đợt thu, hộp "Sửa đợt thu".
- Máy chủ: 62 test (nay 87). Thêm `test:db` (chạy cả bộ test trên PostgreSQL), thêm migration SQL (nay có 005).

## 6. Còn thiếu, theo thứ tự đề xuất

Gần như mọi màn dưới đây **chưa có bản vẽ**. Làm theo quy trình ở mục 7: mô tả màn trước, Hiệu duyệt bằng trắc nghiệm, rồi mới code.

**Nhóm 2: luật đã chốt nhưng chưa có luồng** (việc tiếp theo)
- Hoàn tiền khi thành viên chuyển nhầm.
- Bàn giao: đã làm đủ 7 bước ở nhóm B (22/10/2026). Còn lại: mentor xác nhận biên bản bằng thao tác ở phía trường; áp dụng vai trò mới khi bàn giao xong.
- Ban điều hành xử lý yêu cầu xóa dữ liệu: ẩn danh lịch sử đóng quỹ, không xóa hẳn.
- Thành viên tự xem và sửa thông tin của mình (nút "Xem và sửa" đang ghi "chưa có").
- Sổ quỹ đầy đủ cho ban điều hành. Sổ quỹ chỉ đọc cho thành viên (đang ghi "chưa có").
- Đổi CLB khi một người ở nhiều CLB. Hiện các màn thành viên (Điểm danh, Quỹ, Của tôi) lấy CLB đầu tiên mà người đó đã nhận lời mời.

Chỗ bắt đầu trong code cho nhóm 2:
- Hoàn tiền: tiền thừa đang ghi là "đóng thừa" (hàm `addMoney`, `confirmPayment` và phần đối soát trong `web/src/lib/actions.ts`; màn `web/src/app/(club-admin)/clubs/[clubId]/reconcile/page.tsx`). Sổ quỹ chỉ được thêm, nên hoàn tiền là một bút toán chi mới.
- Bàn giao: `web/src/app/(club-admin)/clubs/[clubId]/handover/page.tsx`. Bước 3 (đổi tài khoản nhận quỹ) đã làm; các bước khác đang hiện dòng "Màn của bước này chưa có trong bản vẽ".
- Xử lý yêu cầu xóa: thành viên gửi yêu cầu bằng `requestDeletion` (`web/src/lib/actions.ts`, lưu `deletionRequestedAt`); phía ban điều hành chưa có màn xử lý.
- Tự sửa thông tin, sổ quỹ chỉ đọc: hai dòng "chưa có" trong `web/src/app/(member)/me/page.tsx`. Sổ quỹ của ban điều hành hiện chỉ có 3 giao dịch gần nhất ở trang chủ CLB.
- Đổi CLB: `web/src/components/lich/BoardFrame.tsx` (sidebar) và `PhoneFrame.tsx` (header) chưa có nút đổi CLB như bản vẽ.

Mỗi API mới làm theo mục 9, bước 3. Luật gốc: `CLAUDE.md`, mục "Nguyên tắc nghiệp vụ đã chốt"; chi tiết ở `../Phuong an nghiep vu.md` (ngoài repo).

**Nhóm 3: phần nhỏ, làm giả được**
- Trang chính sách dữ liệu (màn lời mời trỏ tới).
- Tải ảnh chứng từ (ảnh giả). Chỉ thủ quỹ và chủ nhiệm xem được.
- Hộp thư giả trong web thay cho email, nếu Hiệu muốn.
- Các nút còn "chưa có": "Xem đề nghị" hỗ trợ từ trường, mục "Dự trù và báo cáo" phía trường.

**Trước bản thật** (không cần cho bản dữ liệu giả)
- Tạo khóa Google; thử đăng nhập bằng tài khoản thật.
- Đưa lên mạng (HTTPS). Thử link trong trình duyệt bên trong Zalo và Messenger.
- Mã VietQR thật (máy chủ phải lưu đủ số tài khoản; hiện chỉ lưu 4 số cuối).
- Cơ sở dữ liệu trống thì không nạp dữ liệu mẫu, để CLB tự tạo từ đầu.
- Xác nhận đủ 16 tuổi cho người tạo CLB.
- Chạy nhiều máy chủ: phải đổi cách lưu (`docs/postgresql.md`, mục "Giới hạn").
- Bảo mật, chưa sửa ở bản demo (ghi ngày 05/10/2026):
  - `AUTH_MODE` mặc định là `demo` (không đặt trong `server/.env` thì ai cũng đăng nhập được bằng tài khoản mẫu, mật khẩu ghi ngay trên trang đăng nhập). Bản thật phải mặc định `google`.
  - `POST /demo/reset` không cần đăng nhập: ai gọi cũng xóa được dữ liệu về dữ liệu mẫu.
  - Thêm thành viên bằng email của một tài khoản đã có thì máy chủ trả về họ tên thật của tài khoản đó, dù file nhập ghi tên khác: ban điều hành dò được tên của email bất kỳ.
  - Chưa kiểm tra `Origin` của yêu cầu ghi để chống CSRF (phiên đăng nhập bằng cookie).

**Việc của nhóm**
- **Khoa:**
  - duyệt hợp đồng API (bản nháp v0) và các thay đổi trong `server/README.md`;
  - chốt chuẩn code, cấu trúc thư mục, quy ước commit.
- **Commit, đưa lên GitHub:** chỉ khi Hiệu bảo. `.gitignore` đã chặn `.claude/`, `.impeccable/`, `.env`, file khóa Google, bảng tính và sao kê (trừ thư mục `mau/`). Trước khi commit lần đầu, chạy `git status` xem lại danh sách file.
- **Dọn code:** gọn `web/src/lib/browser-state.tsx`. Trang chọn vai đã bỏ (05/10/2026); hiện chỉ còn mã thiết bị (điểm danh), vai đang chọn và nút đặt lại dữ liệu mẫu dùng.

## 7. Cách làm việc với Hiệu (bắt buộc)

- **Viết:** trả lời và viết tài liệu bằng tiếng Việt, câu ngắn.
- **Hỏi:** cần Hiệu quyết thì hỏi ngay trong chat bằng **câu trắc nghiệm**, phương án đề xuất để đầu, ghi "(Recommended)". Không bắt Hiệu mở tài liệu để đọc câu hỏi.
- **Màn hoặc trạng thái chưa vẽ:** viết mô tả ngắn trước (màn làm gì, hiện gì, nút nào, luật nào). Hiệu duyệt rồi mới code. Không tự nghĩ ra màn mới.
- **Làm theo nhóm:** mỗi lần 3–4 màn, xong thì dừng cho Hiệu duyệt. Hiệu có thể cho gộp nhiều nhóm.
- **Ghi lại:** chỗ nào khác bản vẽ thì ghi vào `web/README.md`, mục "Chỗ code khác bản vẽ". Thay đổi máy chủ thì ghi vào `server/README.md` để báo Khoa.
- **Không tự commit**, không tự đổi nguyên tắc nghiệp vụ trong `CLAUDE.md`.
- **Không đưa vào repo:** `.env`, khóa, mật khẩu, dữ liệu thật. Dữ liệu test phải tự bịa và ghi rõ là dữ liệu mẫu.

## 8. Skill và công cụ phải cài

Hiệu yêu cầu dùng hai skill này khi làm CampusHub. Cả hai **không** đưa vào commit.

| Skill | Dùng để | Cách cài |
|---|---|---|
| `karpathy-guidelines` | Cách viết code: nêu giả định, viết đơn giản, sửa đúng chỗ, mỗi bước có cách kiểm chứng | Trong Claude Code: `/plugin marketplace add forrestchang/andrej-karpathy-skills`, rồi `/plugin install andrej-karpathy-skills@karpathy-skills`. Hoặc chép `SKILL.md` của bộ đó vào `~/.claude/skills/karpathy-guidelines/`. Máy hiện tại cài theo cách thứ hai. |
| `impeccable` | Thiết kế giao diện: hook kiểm tra sau mỗi lần sửa file giao diện, bộ dò lỗi, agent duyệt thiết kế | Ở gốc repo: `npx impeccable install --providers=claude --scope=project`. Lệnh này cài vào `.claude/skills/impeccable` và `.claude/agents/`. `PRODUCT.md` và `DESIGN.md` có sẵn trong repo, không cần chạy lại `/impeccable init`. Thư mục `.impeccable/` không commit: máy mới chưa có, agent `impeccable-documenter` tạo lại `design.json` từ `DESIGN.md` khi cần. Hook kiểm tra sau mỗi lần sửa: xem bằng `/impeccable hooks status`, bật bằng `/impeccable hooks on`. |

Ghi chú gốc của hai skill nằm ở thư mục cha (không thuộc repo): `AdrejiKapathySkill.md`, `ImppecableReadME.md`.

**Các phần của Impeccable dùng mỗi nhóm màn:**
- **Bộ dò lỗi:** `IMPECCABLE_NO_TELEMETRY=1 .claude/skills/impeccable/scripts/impeccable detect <các file>`.
- **Agent `impeccable-finish-reviewer`:** duyệt bản đã làm, ra danh sách lỗi cần sửa. Sửa xong gửi lại cho chấm, tới khi nó ra "ship".
- **Agent `impeccable-documenter`:** cập nhật `DESIGN.md` (có commit) và `.impeccable/design.json` (chỉ trên máy) theo code đã làm.

## 9. Thế nào là "xong" một nhóm màn

1. Màn theo Lịch bloc. Giữ đủ chữ và luật của bản vẽ. Chỗ khác bản vẽ đã ghi vào `web/README.md`.
2. Màn dùng bộ chuyển động trong `web/src/components/lich/motion.tsx`. Khung xương đo bằng script: vị trí các khối lúc đang tải và lúc đã tải phải bằng nhau theo chiều dọc.
3. API mới làm theo thứ tự: sửa `server/src/contract.ts`, rồi handler, rồi `docs/api.md`, rồi test, rồi ghi vào `server/README.md`.
4. Kiểm tra sạch: test ở `web/` và `server/` (cả `npm run test:db`), typecheck, build.
5. Bấm thử cả luồng bằng Playwright, không có lỗi trong console.
6. Bộ dò của Impeccable không báo gì. Agent duyệt thiết kế ra "ship". Agent ghi tài liệu đã cập nhật `DESIGN.md`.
7. Cập nhật `CLAUDE.md` (nếu đổi luật hay danh sách màn) và **file này**. Rồi báo Hiệu duyệt.

**Script bấm thử (Playwright)** nằm ở `web/e2e/` (chuyển vào repo ngày 05/10/2026). Hướng dẫn: `web/e2e/README.md`.
- `npm run e2e`: mọi luồng.
- `npm run e2e:skeleton`: đo khung xương. Chỉ cần vị trí dọc (`y`) lúc tải và lúc đã tải bằng nhau; khác chiều rộng là bình thường.
- Máy chủ chạy bằng `npm start` khi bấm thử. Bản `npm run dev` có lúc tự khởi động lại trên Windows, làm mất phiên đăng nhập giữa chừng.
- Nhóm màn mới thì thêm kiểm tra vào script của nhóm, hoặc tạo script mới.

## 10. Bản đồ nhanh

| Cần tìm | Ở đâu |
|---|---|
| Luật nghiệp vụ (dùng chung web và máy chủ) | `web/src/lib/` (`actions.ts`, `selectors.ts`, `reconcile.ts`, `members-file.ts`) |
| Dữ liệu mẫu | `web/src/lib/seed.ts` (số phải khớp `design/README.md` mục 8) |
| Màn web | `web/src/app/` (mỗi thư mục là một đường dẫn) |
| Thành phần Lịch bloc dùng chung | `web/src/components/lich/` |
| Màu, chữ, nút của Lịch bloc | `web/src/app/lich.css` |
| Gọi API từ web | `web/src/api/` (`client.ts`, `queries.ts`, `excel-rows.ts`) |
| Hợp đồng API | `server/src/contract.ts`, `docs/api.md` |
| Kiểm tra quyền | `server/src/access.ts` |
| Ai thấy trường dữ liệu nào | `server/src/responses.ts` |
| Lưu PostgreSQL | `server/src/db/`, `server/db/migrations/`, `server/docker-compose.yml` |
| Bản vẽ gốc (không sửa tay) | `design/screens/`, mô tả ở `design/README.md` |
| Kế hoạch 10 tuần ban đầu | `docs/ke-hoach-mvp.md` |
| Script bấm thử | `web/e2e/` |

---

# Phần B. Chỉnh sửa và bổ sung prototype sau CP2

*Giao ngày 22/10/2026. Cập nhật 23/10/2026: **nhóm A, B, C đã làm xong và chờ Hiệu duyệt** (kết quả, phần chưa làm và phần chưa kiểm ở phần A, mục 1); nhóm D chưa làm. Các mục dưới là bản mô tả gốc, giữ lại để tra cứu; chỗ nào code khác bản mô tả thì ghi ở `web/README.md`, mục "Chỗ code khác bản vẽ".*

## 0. Dành cho agent nhận việc (đọc phần này trước)

**Việc của bạn (lúc giao):** làm các nhóm A, B, C ở mục 8 theo mô tả ở mục 5. Nhóm A, B, C đã xong; còn nhóm D. Hiệu làm việc một mình trên các phần (không chia Khang, Khoa như CLAUDE.md ghi).

**Trạng thái duyệt:** Hiệu đã chọn hướng chung ở mục 9 (đánh dấu "đã chọn") và giao agent làm theo file này. Mô tả từng màn ở mục 5 là bản làm theo. Chỗ nào mô tả chưa rõ, hoặc mâu thuẫn với `CLAUDE.md`, thì **hỏi Hiệu bằng câu trắc nghiệm ngay trong chat** (phương án đề xuất để đầu, ghi "(Recommended)") rồi mới làm.

**Đọc theo thứ tự:**
1. `CLAUDE.md` và `CLAUDE.local.md`: luật nghiệp vụ, luật giao diện, cách làm việc với Hiệu.
2. Phần A của file này: đang làm tới đâu, thế nào là "xong" một nhóm màn (phần A, mục 9).
3. `design/README.md`, `DESIGN.md`, `web/README.md`, `server/README.md`, `docs/api.md`, `docs/cay-thu-muc.md`.
4. File này.

**Skill bắt buộc** (theo `CLAUDE.local.md`): `karpathy-guidelines` cho mọi việc viết hoặc sửa code; `impeccable` cho mọi việc giao diện (chạy `impeccable context` đầu phiên, `impeccable detect <file>` sau khi sửa file giao diện; xong một nhóm màn thì cho `impeccable-finish-reviewer` duyệt).

**Luật cứng:**
- **Không commit, không push** trừ khi Hiệu bảo. Không tự đổi nguyên tắc nghiệp vụ trong `CLAUDE.md`. File này đề xuất sửa `CLAUDE.md` ở hai chỗ (định vị sản phẩm, ngoại lệ khung quảng cáo mẫu): **hỏi Hiệu trước khi sửa**.
- **Không ghi vào cơ sở dữ liệu của máy Hiệu.** `server/.env` đang có `DATABASE_URL` trỏ Postgres trên localhost. Không chạy `npm run dev` hay `npm start` ở `server/` với `.env` như vậy, và không chạy migration lên DB đó, trừ khi Hiệu bảo.
  - Kiểm tra bằng `npm test` và `npm run test:db` trong `server/` (dữ liệu trong bộ nhớ và PGlite chạy trong Node), `npm test` và `npm run typecheck` trong `web/`.
  - Cần chạy cả web và server để bấm thử Playwright: chạy server với `DATABASE_URL` đặt rỗng trong môi trường của lệnh, và xem log khởi động xác nhận đang dùng dữ liệu trong bộ nhớ. Không chắc thì hỏi Hiệu.
  - Migration mới đặt tên tiếng Anh (ví dụ `server/db/migrations/004_handover_kit.sql`).
- **Không đưa vào repo:** `.env`, khóa API, mật khẩu, dữ liệu thật, bảng tính. Dữ liệu mẫu tự bịa, ghi rõ là dữ liệu mẫu.
- **Luật đặt tên:** mọi thứ thuộc code đặt tên tiếng Anh (thư mục, file, hàm, biến, đường dẫn, tên migration). Chữ trên giao diện, tài liệu, chú thích viết tiếng Việt. Đường dẫn ở mục 5 đã viết theo luật này.
- **Không ghi tên công cụ AI vào commit, code, chú thích, tài liệu.** Không tự đặt số liệu: số nào chưa có nguồn thì để "chưa có".
- Hệ giao diện duy nhất là "Lịch bloc": mọi màn dùng bộ chuyển động `web/src/components/lich/motion.tsx` (khung xương lúc tải), nút đang gửi dùng `aria-busy`, không màu hay kiểu nút ngoài `lich.css`, không bóng đổ, không gradient, không emoji.

**Cách làm từng nhóm:**
1. Làm theo thứ tự nhóm ở mục 8, mỗi nhóm 3 đến 4 màn.
2. Thêm API theo thứ tự: `server/src/contract.ts` rồi handler rồi `docs/api.md` rồi test rồi ghi vào `server/README.md`. Test báo lỗi nếu `docs/api.md` và `contract.ts` lệch nhau.
3. Luật nghiệp vụ nằm ở `web/src/lib/` (types, actions, selectors, seed) và được server dùng lại qua `server/src/domain.ts`. Không chép luật sang server. Dữ liệu lưu qua `server/src/db/tables.ts` (AppState nối với các bảng); thêm danh sách mới vào `AppState` thì thêm bảng tương ứng.
4. Kiểm tra theo phần A, mục 9: test ở cả `web/` và `server/` (cả `npm run test:db`), typecheck, build, bấm thử Playwright trong `web/e2e/`, Impeccable không báo gì.
5. Xong mỗi nhóm: cập nhật phần A của file này và `web/README.md` (mục "Chỗ code khác bản vẽ"), ghi thay đổi máy chủ vào `server/README.md`, rồi **dừng báo Hiệu duyệt**.
6. Hạn demo theo lịch giảng viên nêu là 24 đến 25/10, **chưa xác nhận lại**. Mục 8 có ngưỡng cắt; nếu thiếu thời gian thì cắt theo đó và ghi rõ phần nào chưa qua kiểm.

**Lưu ý lúc bắt đầu (22/10/2026), đã xử lý:** lỗi typecheck do thư mục `web/.next` tự sinh đã hết sau khi xóa thư mục đó. Số test hiện tại ở phần A, mục 2.

---

## 1. Vì sao phải chỉnh

Prototype hiện tại (nhánh `develop`, dữ liệu mẫu, xong ngày 05/10) làm theo ý tưởng CP1: quản lý thành viên, điểm danh QR, sổ quỹ, đối soát, duyệt chi, dự trù. Sau CP2 và hai buổi góp ý, hướng đã đổi:

- **CP2 (người thật nói):** nỗi đau chính là **bàn giao**. Tài khoản chuyển được, cách làm thì không. Ban mới vẫn gọi hỏi chủ nhiệm cũ về biểu mẫu xin phép. Cố vấn CLB Esports ưu tiên số một: chuẩn hóa quy trình và có một chỗ lưu biểu mẫu.
- **Mentor (họp 18/10):** prototype tuần này làm lõi: quản lý thành viên, bàn giao, task và sự kiện, điểm danh. Hai giao diện: quản trị và thành viên. Tránh tính năng râu ria.
- **Giảng viên (sau chấm CP2):** gói nâng cao có AI; hồ sơ năng lực cho thành viên; kết nối cơ hội ngoài. Giảng viên muốn thấy AI ở CP3.

**Điều cần nhớ khi đọc phần dưới:** bộ bàn giao là lõi. Hồ sơ năng lực và kết nối đối tác là giả thuyết giai đoạn sau (xem tài liệu mô hình kinh doanh của nhóm, nằm ngoài repo), chỉ làm mức nhỏ nhất nếu còn thời gian.

## 2. Hiện trạng ngắn

**Đã có (đã kiểm: server 71/71 test, web 35/35 test):** đăng nhập và đăng ký, tạo CLB, thêm thành viên bằng file, lời mời, đơn xin vào, các buổi, điểm danh QR đổi mã và điểm danh tay, đợt thu, đối soát sao kê, duyệt chi, dự trù, màn nhà trường, màn sinh viên tìm CLB, giao diện "Lịch bloc".

### Các tính năng còn thiếu, nói rõ từng cái

Ví dụ trong bảng dùng CLB mẫu của prototype: **CLB Cầu lông Sân Nhà**.

| # | Tính năng còn thiếu | Nghĩa là gì (ví dụ) | Hiện trạng | Ai yêu cầu |
|---|---|---|---|---|
| 1 | **Bàn giao đủ các bước** | Khi đổi ban điều hành, chủ nhiệm cũ đi hết một danh sách bước để giao lại cho ban mới. | Mới có **1 trong 6 bước**: "Đổi tài khoản nhận quỹ". **Chưa có 5 bước:** Chọn ban mới, Chốt số dư, Chuyển quyền quản trị, Ban mới xác nhận, Biên bản bàn giao. Các bước đó hiện dòng "màn của bước này chưa có". | CP2: bàn giao là nỗi đau chính. Mentor. |
| 2 | **Kho bàn giao** (biểu mẫu, quy trình, tài khoản) | Một chỗ lưu những thứ ban cũ hay mang đi. Ví dụ: file "Mẫu xin phép tổ chức sự kiện"; cách "xin phòng họp" gồm 4 bước; danh sách fanpage, nhóm Zalo, Drive do ai giữ quyền quản trị. | **Chưa có gì.** "Bàn giao" hiện chỉ giao **tiền** (số dư, tài khoản nhận quỹ), không giao biểu mẫu hay cách làm. | CP2: cố vấn CLB Esports nói ban mới vẫn gọi hỏi lại biểu mẫu xin phép; ưu tiên số một là quy trình chuẩn và một chỗ lưu biểu mẫu. |
| 3 | **Việc cần làm (task)** | Danh sách công việc của ban điều hành, mỗi việc có người phụ trách, hạn và trạng thái. Ví dụ: "Đặt sân buổi giao lưu thứ Bảy", giao cho Trưởng ban Hậu cần, hạn thứ Năm, đang làm. | **Chưa có.** Hiện chỉ có "buổi sinh hoạt" và "đợt thu", không có danh sách việc. | Mentor ("theo dõi task"). Cũng giúp bàn giao: việc còn dở tự hiện cho ban mới. |
| 4 | **Ảnh gắn với buổi sinh hoạt** | Hai cách hiểu, bản ghi họp mentor chưa nói rõ: **(a)** album vài tấm ảnh của buổi giao lưu để thành viên xem; **(b)** điểm danh bằng cách chụp ảnh để chứng minh có mặt. | **Chưa có cả hai.** Hiện điểm danh bằng mã QR đổi mã và điểm danh tay. | Mentor ("điểm danh/ảnh event"). **Cần hỏi lại mentor ý nào.** |
| 5 | **AI** | Một tính năng dùng AI. Đề xuất: bấm một nút để AI tóm tắt cho ban mới "5 việc quan trọng 2 tuần đầu, những thứ còn thiếu". | **Chưa có.** | Giảng viên (gói nâng cao dùng AI). Cô cũng nói CP3 phải có AI. |
| 6 | **Hồ sơ hoạt động của thành viên** | Một trang cho thành viên xem các CLB đã tham gia, vai trò, các buổi đã điểm danh, kèm nhãn "ban điều hành đã xác nhận", để dùng làm CV hoặc xin học bổng. | **Chưa có.** Đã có sẵn **lịch sử điểm danh** của từng người, là dữ liệu để dựng trang này. | Giảng viên (Portfolio). Vẫn là giả thuyết. |
| 7 | **Khung quảng cáo mẫu** | Một chỗ trống có nhãn "Được tài trợ" trong vài màn, để sau này đặt banner. Bản demo chỉ hiện nội dung mẫu ("Chỗ đặt quảng cáo, ví dụ"), chưa có nhãn hàng thật. | **Chưa có.** | Mentor (chưa cần hỏi nhãn hàng hay agency, làm trước cái khung). |

### Đã có, không cần làm lại

Đăng nhập và đăng ký; tạo CLB; thêm thành viên bằng file Excel; lời mời và đơn xin vào CLB; các buổi sinh hoạt; điểm danh QR và điểm danh tay; đợt thu, đối soát sao kê, duyệt chi, dự trù (phần tiền); màn cho nhà trường xem; màn sinh viên tìm CLB; giao diện "Lịch bloc".

## 3. Danh sách việc, theo thứ tự ưu tiên

| # | Việc | Loại | Mức |
|---|---|---|---|
| 1 | Hoàn thiện 6 bước bàn giao (mục 5.1) | Bổ sung màn | Bắt buộc |
| 2 | Kho bàn giao: biểu mẫu, quy trình, tài khoản và quyền truy cập (mục 5.2) | Màn mới | Bắt buộc, là lõi CP2 |
| 3 | Việc cần làm cho ban điều hành và cho thành viên (mục 5.3) | Màn mới | Bắt buộc (mentor) |
| 4 | Trang chủ ban điều hành đưa bàn giao và việc lên đầu, thu gọn nhóm Sổ quỹ (mục 5.4) | Sửa màn | Bắt buộc |
| 5 | Trợ lý AI cho bàn giao, bản mẫu: tóm tắt, hỏi đáp trong kho, khung khóa thống kê (mục 5.5) | Màn mới | Nên có (giảng viên muốn thấy AI) |
| 6 | Dữ liệu mẫu mới cho các màn trên (mục 5.6) | Bổ sung dữ liệu | Bắt buộc |
| 7 | Ảnh buổi sinh hoạt (mục 5.7) | Bổ sung nhỏ | Nếu còn thời gian |
| 8 | Hồ sơ hoạt động của thành viên (mục 5.8) | Màn mới nhỏ | Nếu còn thời gian |
| 9 | Chữ trên trang đầu theo định vị mới (mục 5.9) | Sửa chữ | Nên có |
| 10 | Sửa kỹ thuật và bảo mật (mục 6) | Sửa | Trước khi cho CLB thật dùng thử |
| 11 | Khung quảng cáo mẫu (mục 5.10) | Bổ sung nhỏ | Nếu còn thời gian, làm sau nhóm A và B |

**Không làm trong lần này:** trang hay tính năng cho nhãn hàng và nhà tài trợ (đặt quảng cáo, trả tiền, xem báo cáo), kết nối NGO và Thành Đoàn (Input Hub), gói VIP, thanh toán, giữ tiền. Lý do: chưa có bằng chứng, và CLAUDE.md đã ghi "Không làm trong MVP". Những thứ này nằm trong mô hình kinh doanh như giả thuyết, chưa vào prototype.

**Ngoại lệ duy nhất:** **khung quảng cáo mẫu** (mục 5.10): chỉ là chỗ trống có nhãn với nội dung mẫu, không phải tính năng cho nhãn hàng.

## 4. Quy ước khi làm (theo CLAUDE.md)

- Giao diện chữ tiếng Việt; mọi thứ thuộc code đặt tên tiếng Anh (thư mục, file, hàm, đường dẫn). Dưới đây ghi đường dẫn đề xuất bằng tiếng Anh.
- Dùng hệ "Lịch bloc": hạn chót là tờ lịch nhỏ đếm ngày, đỏ chỉ cho hôm nay và hạn còn từ 3 ngày trở xuống, không bóng đổ, không emoji, không gradient.
- Màn nào cũng có khung xương lúc tải (`Loading`, `Skel`), nút đang gửi dùng `aria-busy`.
- Kiểm tra quyền ở server (`server/src/access.ts`). Thêm API: sửa `contract.ts`, rồi handler, rồi `docs/api.md`, rồi test.
- Dữ liệu mẫu tự bịa, ghi rõ là dữ liệu mẫu. Không đưa mật khẩu, khóa, dữ liệu thật vào repo.

## 5. Mô tả từng màn

### 5.1 Bàn giao nhiệm kỳ: làm đủ 6 bước

**Đường dẫn:** `/clubs/[clubId]/handover` (đã có). **Ai dùng:** chủ nhiệm. Các bước đã có tên trong code: Chọn ban mới, Chốt số dư, Đổi tài khoản nhận quỹ, Chuyển quyền quản trị, Ban mới xác nhận, Biên bản bàn giao. Hiện mới làm bước 3.

**Thêm một bước về kiến thức** vì đây là điều người thật nói thiếu nhất. Dải bước thành 7 bước, đặt "Kiểm tra kho bàn giao" sau "Chốt số dư".

| Bước | Màn hiện gì | Nút | Luật |
|---|---|---|---|
| 1. Chọn ban mới | Danh sách thành viên đang ở CLB, chọn chủ nhiệm mới, phó, thủ quỹ, trưởng ban. Hiện nhiệm kỳ cũ và mới. | "Tiếp tục" | Chỉ chọn người đã nhận lời mời. Chủ nhiệm cũ không tự chọn mình lại mà không có dòng xác nhận. |
| 2. Chốt số dư | Số dư hiện tại lấy từ sổ quỹ, các khoản còn dở (đợt thu chưa đóng, khoản chi chờ duyệt). | "Chốt số dư", "Quay lại" | Sau khi chốt, số dư khóa. Muốn đổi phải quay lại bước 2. Không sửa sổ quỹ, chỉ thêm bút toán. |
| 3. Kiểm tra kho bàn giao (mới) | Kết quả kiểm: bao nhiêu biểu mẫu, quy trình, tài khoản đã có; mục nào còn thiếu hoặc quá cũ. Dẫn sang màn Kho bàn giao (5.2). | "Mở kho bàn giao", "Tiếp tục" | Không chặn bàn giao nếu thiếu, chỉ cảnh báo bằng chữ. Hiện số mục thiếu. |
| 4. Đổi tài khoản nhận quỹ | Đã có. | Đã có | Đã có. |
| 5. Chuyển quyền quản trị | Danh sách tài khoản và quyền của CLB (lấy từ Kho bàn giao, mục Tài khoản). Mỗi dòng: tài khoản, người giữ hiện tại, người nhận mới, trạng thái "đã chuyển". Nhắc: email trường của chủ nhiệm cũ sẽ bị thu hồi khi tốt nghiệp. | "Đã chuyển" từng dòng | Chỉ qua bước tiếp khi tài khoản đánh dấu "bắt buộc" đã chuyển. |
| 6. Ban mới xác nhận | Chủ nhiệm mới thấy bản tóm tắt: số dư, kho bàn giao, tài khoản đã chuyển. | "Xác nhận đã nhận bàn giao" (do chủ nhiệm mới bấm, trong Vùng nguy hiểm, hộp hỏi hai bước: gõ BAN GIAO) | Chỉ người nhận mới bấm được. Ghi giờ và người bấm. |
| 7. Biên bản bàn giao | Biên bản chỉ đọc gồm toàn bộ các bước, xuất file (Excel, và bản in). Có chỗ cho mentor của trường xác nhận nếu CLB có mentor. Nút "Tóm tắt" của trợ lý AI (mục 5.5). | "Xuất biên bản", "Xuất toàn bộ dữ liệu (Excel)" (đã có) | Biên bản không sửa được sau khi xác nhận. |

**Trạng thái đặc biệt:** chưa có ban mới được chọn thì bước 2 trở đi hiện khóa và nói rõ vì sao. Chủ nhiệm cũ rời trước khi bàn giao xong: ghi vào biên bản "chưa hoàn tất".

**API cần thêm hoặc sửa:** các API bước 1, 2, 4 (xác nhận), 5, 6 trong `contract.ts` và `docs/api.md`. Đã có `PUT /handover/receiver` và `PUT /handover/step`.

### 5.2 Kho bàn giao (màn mới, lõi của CP2)

**Đường dẫn:** `/clubs/[clubId]/handover-kit`. **Ai dùng:** ban điều hành xem và sửa; thành viên xem phần được chia sẻ. **Vị trí trong menu:** nhóm "Nhiệm kỳ", cạnh "Bàn giao".

**Mục đích:** một chỗ lưu những thứ ban cũ thường mang đi: biểu mẫu xin phép, quy định, cách làm từng việc, tài khoản của CLB. Trả lời đúng điều cố vấn CLB Esports nói.

**Bố cục:** vùng làm việc là một tờ giấy chia ba phần bằng nét 1px, có tab ở đầu.

**Phần A. Biểu mẫu và tài liệu**
- Mỗi dòng: tên (ví dụ "Mẫu xin phép tổ chức sự kiện"), nhóm (xin phép trường, tài chính, truyền thông, khác), nơi lưu (đường link Google Drive hoặc file tải lên), người giữ, ngày cập nhật.
- Nút: "Thêm biểu mẫu", sửa, xóa, mở link. Ô tìm kiếm.
- Trong bản demo: không lưu file thật; chỉ lưu tên và đường link. File tải lên là file mẫu giả.

**Phần B. Quy trình (cách làm từng việc)**
- Mỗi quy trình: tên (ví dụ "Xin phòng họp", "Báo cáo cuối kỳ cho phòng quản lý CLB"), các bước dạng danh sách đánh số, ai làm, hạn thường gặp (hiện bằng tờ lịch nhỏ), biểu mẫu đi kèm (chọn từ Phần A).
- Nút: "Thêm quy trình", "Thêm bước", sắp xếp lại bước.
- Cố ý đơn giản: văn bản và danh sách, không có sơ đồ.

**Phần C. Tài khoản và quyền truy cập**
- Mỗi dòng: dịch vụ (fanpage, nhóm Zalo, Discord, Google Drive, email CLB, tài khoản ngân hàng nhận quỹ), tên tài khoản hoặc đường link, **ai đang giữ quyền quản trị**, có đứng tên CLB hay đứng tên cá nhân, đánh dấu "bắt buộc chuyển khi bàn giao".
- Dòng đứng tên cá nhân hiện nhãn xám "đứng tên cá nhân: nên chuyển sang tài khoản CLB".
- **Không lưu mật khẩu** ở bất cứ đâu. Chỉ lưu tên dịch vụ, đường link và người giữ. Ghi một dòng cố định trên màn: "CampusHub không lưu mật khẩu. Đổi quyền quản trị ở chính dịch vụ đó."

**Thanh tóm tắt đầu màn:** "Kho bàn giao: X biểu mẫu, Y quy trình, Z tài khoản. N mục thiếu." Mục thiếu là mục có chữ "bắt buộc" mà chưa điền người giữ.

**Quyền:** chủ nhiệm, phó và trưởng ban thêm, sửa, xóa. Thành viên thường chỉ xem Phần A và B. Phần C chỉ ban điều hành thấy.

**Dữ liệu cá nhân:** tên người giữ là dữ liệu có sẵn trong hệ thống, không thêm trường mới. Link và biểu mẫu không chứa dữ liệu cá nhân của thành viên; có dòng nhắc "Không tải lên file có danh sách thành viên thật".

**Trạng thái rỗng:** CLB mới chưa có gì thì hiện ba ô gợi ý "Bắt đầu với 3 việc", gợi ý các loại biểu mẫu và tài khoản hay gặp để ban điều hành điền nhanh. (Nội dung gợi ý lấy từ ví dụ trong phỏng vấn: biểu mẫu xin phép, fanpage, Discord, Drive.)

**API cần thêm:** nhóm `handover-kit` cho tài liệu, quy trình, tài khoản (đọc, thêm, sửa, xóa), kiểm quyền ở `access.ts`, `responses.ts` quyết định phần nào thành viên thấy.

### 5.3 Việc cần làm (màn mới)

**Đường dẫn ban điều hành:** `/clubs/[clubId]/tasks`. **Đường dẫn thành viên:** `/me/tasks`. **Vị trí menu:** nhóm chính, cạnh "Điểm danh".

**Ban điều hành:**
- Bảng việc theo ba cột trạng thái: Chưa làm, Đang làm, Xong. Mỗi việc là một dòng: tên việc, người phụ trách, hạn (tờ lịch nhỏ đếm ngày), gắn với buổi sinh hoạt hoặc quy trình nếu có.
- Việc quá hạn: tờ lịch đỏ. Việc xong: nhãn xám.
- Nút: "Thêm việc", đổi trạng thái, giao lại cho người khác.
- Bộ lọc: việc của tôi, việc quá hạn, việc theo người.
- Việc **còn dở khi bàn giao** tự hiện ở bước 3 của bàn giao (mục 5.1).

**Thành viên:** danh sách việc của mình, bấm đổi trạng thái của việc mình được giao.

**Luật:**
- Chỉ ban điều hành tạo và giao việc. Thành viên chỉ đổi trạng thái việc của mình.
- Giao việc cho người đã nhận lời mời.
- Mọi đổi trạng thái lưu lịch sử (ai, lúc nào).

**Không làm:** thông báo đẩy, nhắc việc tự động, chat. Nhắc việc làm bằng tờ lịch đỏ trên trang chủ.

**API cần thêm:** nhóm `tasks`.

### 5.4 Trang chủ ban điều hành: đổi thứ tự

**Đường dẫn:** `/clubs/[clubId]` (đã có).

Hiện trang chủ mở bằng tờ lịch hôm nay và ưu tiên tiền (3 giao dịch gần nhất, đợt thu). Đổi thành:
1. Tờ lịch hôm nay và các hạn gần.
2. **Việc cần làm** (từ 5.3): việc quá hạn và việc sắp tới.
3. **Bàn giao** (mới trên trang chủ): thanh tiến độ "Kho bàn giao: X mục thiếu" và nút vào Kho bàn giao; nếu đang bàn giao thì hiện bước hiện tại.
4. Buổi sinh hoạt sắp tới và điểm danh.
5. Quỹ thu gọn thành một dòng ở cuối: "Quỹ: số dư, N khoản chờ duyệt".

**Menu bên trái:** gom nhóm "Sổ quỹ" (Đợt thu, Đối soát, Duyệt chi, Dự trù) thành nhóm "Quỹ" ở dưới, đóng mặc định. Nhóm "Nhiệm kỳ" lên trên: Bàn giao, Kho bàn giao. **Không xóa tính năng tiền.** Chỉ đổi thứ tự và độ nổi bật. Phần tiền là vùng rủi ro pháp lý (Nghị định 52/2024), nên không đưa lên demo chính.

### 5.5 Trợ lý AI cho bàn giao (bản mẫu)

**Quyết định (Hiệu đồng ý ngày 22/10/2026):** làm AI dưới dạng **hỗ trợ quản trị cộng một chatbot hẹp**, cả hai gắn với bàn giao. **Không làm chatbot chung** trả lời mọi thứ theo vai. Ở prototype AI là **bản mẫu**, chưa tích hợp thật.

**Lý do chọn hẹp:** chatbot chung dễ trả lời bậy, khó kiểm soát việc thành viên hỏi ra thông tin tiền hay tài khoản, và khi làm mẫu thì nhìn rất giả. Hai việc dưới đây dễ kiểm chứng, khớp đúng nỗi đau CP2 (ban mới gọi hỏi chủ nhiệm cũ) và khớp lời giảng viên (gói nâng cao dùng AI).

**Việc 1. Tóm tắt bàn giao** (miễn phí; ban điều hành dùng)
- **Vị trí:** bước biên bản của bàn giao, và nút "Tóm tắt" ở đầu màn Kho bàn giao.
- **Làm gì:** bấm một nút thì ra bản tóm tắt cho ban mới: việc còn dở, hạn sắp tới, biểu mẫu và quy trình còn thiếu, tài khoản chưa chuyển, ai hỏi lại nếu có thắc mắc.
- **Hiện gì:** bản tóm tắt trong một khung có nhãn cố định **"AI viết, cần kiểm tra"** (ở bản mẫu: **"Bản mẫu, chưa dùng AI thật"**). Ban điều hành **sửa được** trước khi lưu vào biên bản. AI không tự gửi cho ai, không tự đổi dữ liệu. Lưu kèm: ai bấm, lúc nào.

**Việc 2. Hỏi đáp trong Kho bàn giao** (miễn phí, giới hạn lượt theo kỳ; ban mới và thành viên dùng)
- **Vị trí:** ô "Hỏi về bàn giao" ở đầu màn Kho bàn giao.
- **Làm gì:** người dùng gõ câu hỏi, ví dụ "Mẫu xin phép sự kiện ở đâu?", "Ai giữ quyền fanpage?". Trợ lý chỉ trả lời **từ nội dung của Kho bàn giao**, và **luôn kèm mục nguồn** (bấm để mở mục đó). Không có trong kho thì nói thẳng "không tìm thấy trong kho bàn giao", không đoán.
- **Theo vai:** mỗi người chỉ hỏi được về phần mình thấy. Thành viên thường chỉ hỏi được phần biểu mẫu và quy trình; phần **tài khoản và quyền truy cập** chỉ ban điều hành. Dùng chung luật ai-thấy-gì ở `server/src/responses.ts`, không viết luật thứ hai.
- **Không làm:** trả lời về tiền, sổ quỹ hay dữ liệu cá nhân của thành viên; tự thực hiện thao tác (thêm, xóa, chuyển quyền).

**Việc 3. Thống kê tham gia** (bản trả phí; chỉ hiện dạng khung khóa)
- **Vị trí:** một thẻ ở màn Thành viên hoặc trang chủ, có nhãn **"Có trong bản trả phí"**.
- **Hiện gì:** vài số tính từ dữ liệu điểm danh của CLB mẫu (tỉ lệ có mặt các buổi gần đây, thành viên vắng nhiều buổi liên tiếp), làm mờ, kèm nút "Tìm hiểu bản trả phí" chỉ mở một trang mô tả. **Chưa có thanh toán.**
- **Gọi tên đúng:** đây là **phân tích tự động từ dữ liệu điểm danh**, không ghi là "AI" nếu thực chất chỉ là phép đếm.

**Bản miễn phí và trả phí (giả thuyết, chưa có giá, chưa có bằng chứng ai trả):**
| Miễn phí | Trả phí (theo giảng viên: "AI chuyên sâu, phân tích nâng cao") |
|---|---|
| Tóm tắt bàn giao cơ bản mỗi kỳ | Tóm tắt sâu, nhiều phiên bản, so sánh với kỳ trước |
| Hỏi đáp trong Kho bàn giao, giới hạn lượt theo kỳ | Không giới hạn lượt |
| | Thống kê tham gia, báo cáo cho trường |
Nguyên tắc: **không khóa phần cốt lõi sau tường trả phí**. Bàn giao xảy ra khoảng mỗi kỳ một lần nên giới hạn tính **theo kỳ**, không theo ngày. Ở khảo sát 5 CLB, hỏi lần gần nhất họ trả tiền cho phân tích hay báo cáo nào.

**Cách làm bản mẫu cho trung thực:**
- Thêm cấu hình `AI_MODE=mock|real` trong `server/.env`, như `AUTH_MODE` đã có. Mặc định `mock`.
- Viết tầng AI theo một giao diện chung (tóm tắt, hỏi đáp). Bản mẫu và bản thật cùng giao diện, để sau này chỉ thay phần bên trong.
- **Bản mẫu tính từ dữ liệu của CLB mẫu**, không dán sẵn câu trả lời: đếm việc quá hạn, mục thiếu, tài khoản chưa chuyển; hỏi đáp thì tìm từ khóa trong nội dung kho và trả về mục khớp nhất. Nhìn đáng tin hơn và không giả.
- **Ghi rõ trên màn:** "Bản mẫu: câu trả lời lấy từ dữ liệu mẫu, chưa dùng AI thật". Giảng viên đã cảnh báo chuyện AI tạo dữ liệu giả, nên nhóm cần minh bạch ở demo và ở bài nộp.

**Khi chuyển sang AI thật (sau prototype):**
- Không gửi tên và email thành viên ra ngoài, chỉ gửi vai trò (ví dụ "thủ quỹ").
- Dữ liệu gửi ra ngoài phải ghi rõ trong trang chính sách dữ liệu và màn đồng ý.
- Khóa API để ở `server/.env`, không đưa vào repo.
- Chi phí gọi AI: **chưa có số**. Cần xem giá của nhà cung cấp trước khi chọn.

**API cần thêm:** `POST /clubs/:clubId/ai/summary` và `POST /clubs/:clubId/ai/ask`, kiểm quyền ở `access.ts`, thêm vào `contract.ts` và `docs/api.md`.

### 5.6 Dữ liệu mẫu mới

Thêm vào `web/src/lib/seed.ts` (CLB mẫu `cau-long-san-nha`), tự bịa và ghi rõ là dữ liệu mẫu:
- 4 đến 5 biểu mẫu (xin phép sự kiện, báo cáo cuối kỳ, đề xuất chi, đơn đăng ký thành viên, kế hoạch học kỳ).
- 3 quy trình, mỗi quy trình 3 đến 5 bước.
- 5 tài khoản và dịch vụ, trong đó 1 đến 2 cái đứng tên cá nhân của chủ nhiệm cũ để màn bàn giao có chuyện để cảnh báo.
- 6 việc ở các trạng thái khác nhau, có việc quá hạn.
- Trạng thái bàn giao đang ở một bước giữa, để thấy được màn.
Số phải khớp `design/README.md` mục 8. Đổi số thì sửa cả hai chỗ.

### 5.7 Ảnh gắn với buổi sinh hoạt (nếu còn thời gian)

**Cần làm rõ trước:** mentor nói "điểm danh/ảnh event" nhưng bản ghi không nói rõ. Có hai cách hiểu: (a) album ảnh của buổi, (b) điểm danh bằng ảnh chụp. Phần dưới mô tả cách (a). Nếu mentor muốn cách (b), phần này đổi thành "thêm cách điểm danh bằng ảnh bên cạnh QR và điểm danh tay". Nên hỏi mentor ở buổi tới trước khi làm.

**Đường dẫn:** thêm vào màn từng buổi, `/clubs/[clubId]/events`.
- Ban điều hành thêm vài ảnh cho một buổi; thành viên của CLB xem được.
- Trong bản demo ảnh là ảnh mẫu, không tải ảnh thật.
- **Cần xác nhận:** ảnh có mặt người là dữ liệu cá nhân. Chỉ làm khi có dòng đồng ý theo từng mục đích (như màn đồng ý hiện có) và thành viên rút được. Nếu chưa kịp làm phần đồng ý thì **không làm màn này**.

### 5.8 Hồ sơ hoạt động của thành viên (nếu còn thời gian)

**Đường dẫn:** `/me/profile`. Đây là phiên bản nhỏ nhất của "hồ sơ năng lực" giảng viên gợi ý, và **vẫn là giả thuyết**, chưa có bằng chứng sinh viên chịu trả tiền.
- Hiện: các CLB đã tham gia, vai trò theo kỳ, các buổi đã điểm danh (lấy từ lịch sử điểm danh đã có).
- Mỗi mục có nhãn "đã được ban điều hành xác nhận" hoặc "chưa xác nhận". Chủ nhiệm bấm xác nhận được.
- Nút "Xuất hồ sơ" ra file để dùng cho CV hoặc học bổng.
- Dùng đúng dữ liệu đã có, **không thêm** dữ liệu mới của thành viên.

### 5.9 Trang đầu và chữ giới thiệu

Trang `/` và README còn mô tả "thành viên, điểm danh, sổ quỹ và bàn giao". Đổi câu mở đầu theo định vị CP2: **bộ bàn giao cho ban điều hành CLB**, dùng cạnh Google Sheets. Điểm danh và quỹ là tính năng đi kèm. Hai video demo cần quay lại sau khi có Kho bàn giao (`web/e2e/record-demo-videos.cjs`).

### 5.10 Khung quảng cáo mẫu (nếu còn thời gian)

**Là gì:** mentor khuyên làm trước một **cái khung đặt banner**, chưa cần hỏi nhãn hàng hay agency. Ở đây gọi là **khung mẫu**: chỉ là chỗ trống có nhãn, nội dung mẫu. Chưa có nhãn hàng thật, chưa có trang cho nhãn hàng, chưa có giá.

**Hiện gì:**
- Một khung cố định kích thước, viền 1px theo Lịch bloc, nhãn **"Được tài trợ"** ở góc, bên trong chữ mẫu **"Chỗ đặt quảng cáo (ví dụ)"** và một dòng mô tả ngắn.
- Nút nhỏ **"Ẩn quảng cáo này"**: ẩn khung trong phiên đang dùng.
- Khung giữ chỗ sẵn nên màn không giật khi nội dung tải.

**Đặt ở đâu (mỗi màn tối đa một khung):**
| Đặt | Không đặt |
|---|---|
| Trang chủ thành viên `/me`, dưới tờ lịch hôm nay | Màn tiền: đóng quỹ, đối soát, duyệt chi, sổ quỹ |
| Danh sách CLB `/explore`, một thẻ xen giữa danh sách | Màn đồng ý và xóa dữ liệu |
| Màn kết quả sau khi điểm danh xong (không chặn) | Lúc quét QR điểm danh, các màn lỗi |
| | Các bước bàn giao (lõi, cần tập trung) |

**Luật thiết kế (từ nghiên cứu các kiểu quảng cáo bị ghét nhất trên điện thoại: pop-up, che nội dung, chiếm quá 30% màn hình, nhấp nháy, tự phát tiếng, đếm ngược, phủ toàn màn hình, dính lớn cố định):**
- Không pop-up, không che nội dung, không tự phát video hay tiếng, không nhấp nháy, không đếm ngược.
- Nằm trong dòng nội dung, nhỏ hơn nhiều so với 30% màn hình.
- Không dùng màu hay kiểu nút ngoài `lich.css`; không bóng đổ, không gradient.
Nguồn: Coalition for Better Ads, 2017, qua tóm tắt của IAB và trang hỗ trợ của Google. Cần mở bản gốc kiểm lại nếu dẫn trong bài nộp.

**Luật dữ liệu:**
- Quảng cáo chỉ ở **bản miễn phí**; bản trả phí không có.
- **Không nhắm theo cá nhân, không bán dữ liệu.** Nội dung khung giống nhau cho mọi người.
- Nếu sau này đếm: chỉ đếm **tổng lượt xem và lượt bấm của khung, không gắn tên người** (để có số cho nhãn hàng theo lời mentor: cần số người dùng thật trước khi chào).

**Không làm:** trang cho nhãn hàng, đặt quảng cáo thật, tính tiền, nhắm đối tượng.

**Cần kiểm bằng người thật:** nhóm chưa có bằng chứng người dùng chịu được quảng cáo trong công cụ này. Ở đợt khảo sát 5 CLB, hỏi một câu về việc: lần gần nhất gặp quảng cáo khó chịu trong ứng dụng sinh viên là lúc nào, vì sao.

**Cập nhật CLAUDE.md khi làm:** dòng "Không làm trong MVP: tính năng cho nhãn hàng, nhà tài trợ" giữ nguyên, thêm "ngoại lệ: khung quảng cáo mẫu, chỉ là chỗ trống có nhãn".

## 6. Sửa kỹ thuật và bảo mật

**Làm ngay (nhỏ):**
- `web` typecheck báo 18 lỗi, **đều nằm trong file tự sinh** `.next/dev/types/routes.d.ts`. Xóa thư mục `web/.next` hoặc chạy `npm run build` để sinh lại. Thư mục này đã nằm trong `.gitignore`.
- Repo đang có thay đổi chưa commit: `.gitignore`, `docs/ke-hoach-mvp.md`, `package-lock.json` (chưa theo dõi). Xem lại rồi mới commit, **chỉ khi Hiệu bảo**.

**Trước khi cho CLB thật dùng thử (đã ghi ở phần A, mục 6):**
- `AUTH_MODE` mặc định là `demo`: ai cũng đăng nhập được bằng tài khoản mẫu, mật khẩu hiện ngay trên trang đăng nhập. Bản thật phải mặc định `google`.
- `POST /demo/reset` không cần đăng nhập: ai gọi cũng xóa được dữ liệu về dữ liệu mẫu. Bản thật bỏ API này.
- Thêm thành viên bằng email của tài khoản đã có thì server trả họ tên thật của tài khoản đó: lộ tên của email bất kỳ.
- Chưa kiểm tra `Origin` của yêu cầu ghi (nguy cơ CSRF, vì phiên dùng cookie).
- Tạo khóa Google để đăng nhập thật; đưa lên mạng (HTTPS); thử link trong trình duyệt bên trong Zalo và Messenger.
- Người tạo CLB chưa qua bước xác nhận đủ 16 tuổi.

**Mỗi màn mới phải có:** test ở `server/` (cả `npm run test:db`) và `web/`, typecheck, build, kịch bản bấm thử Playwright trong `web/e2e/`, và bộ dò của Impeccable không báo gì.

## 7. Tài liệu phải cập nhật khi code xong

- `CLAUDE.md`: câu mô tả sản phẩm; mục "Không làm trong MVP" (giữ nguyên các dòng cũ, thêm Input Hub, gói VIP, quảng cáo); thêm Kho bàn giao, Việc cần làm vào danh sách màn.
- Phần A của file này: mục 1, 3, 6.
- `docs/api.md` và `server/src/contract.ts`: API mới (bàn giao các bước còn thiếu, `handover-kit`, `tasks`, AI tóm tắt).
- `web/README.md`: mục "Chỗ code khác bản vẽ" cho các màn chưa có bản vẽ.
- `docs/luong-nguoi-dung.md`, `README.md`.

## 8. Thứ tự làm đề xuất

Theo quy trình: mỗi lần 3 đến 4 màn, xong thì dừng cho Hiệu duyệt.
1. **Nhóm A:** Kho bàn giao (5.2), dữ liệu mẫu (5.6), sửa nhỏ `.next` (mục 6).
2. **Nhóm B:** Hoàn thiện 6 bước bàn giao có thêm bước kho (5.1), Việc cần làm (5.3).
3. **Nhóm C:** Trợ lý AI bản mẫu (5.5), trang chủ và menu đổi thứ tự (5.4), chữ trang đầu (5.9), khung quảng cáo mẫu (5.10).
4. **Nhóm D, nếu còn thời gian:** hồ sơ hoạt động (5.8), ảnh buổi (5.7), quay lại video demo.

**Quyết định (Hiệu, 22/10/2026):** làm cả nhóm A, B, C. Hạn demo theo lịch giảng viên nêu là 24 đến 25/10 (nhóm chưa xác nhận lại với giảng viên), nên cần **ngưỡng cắt** đặt trước:
- **Phải xong:** Kho bàn giao, dữ liệu mẫu, các bước bàn giao (bản đơn giản), trợ lý AI bản mẫu (việc 1 và 2 ở mục 5.5).
- **Cắt trước nếu thiếu thời gian, theo thứ tự:** khung quảng cáo mẫu, chữ trang đầu, đổi thứ tự trang chủ, khung khóa "thống kê tham gia", Việc cần làm (task).
- Mỗi nhóm màn vẫn phải qua test, kiểm Playwright và duyệt Impeccable theo CLAUDE.md. Nếu thời gian gấp, ghi rõ trong phần A của file này phần nào chưa qua kiểm.

## 9. Cần Hiệu quyết

1. **Phạm vi lần này:** *đã chọn, làm cả A, B, C, có ngưỡng cắt ở mục 8.*
2. **AI làm việc gì:** *đã chọn, hai việc gắn với bàn giao (tóm tắt, hỏi đáp trong Kho bàn giao) cộng khung khóa thống kê; không làm chatbot chung; chế độ bản mẫu (mục 5.5).* Đã chọn theo đề xuất: bản miễn phí giới hạn lượt hỏi đáp theo kỳ, và đưa khung khóa "bản trả phí" vào demo.
3. **Nhà cung cấp AI và khóa API:** *chưa cần ở prototype (bản mẫu).* Cần chốt trước khi chuyển sang AI thật: dịch vụ nào, ai giữ khóa, chấp nhận gửi dữ liệu đã bỏ tên ra ngoài không, giá bao nhiêu.
4. **Ảnh buổi sinh hoạt:** *đã chọn: bỏ lần này* (cần phần đồng ý; cần hỏi lại mentor ý là album hay điểm danh bằng ảnh).
5. **Phần tiền:** *đã chọn: giữ nguyên, chỉ đổi thứ tự và độ nổi bật.*
6. **Khung quảng cáo mẫu:** *đã chọn: đặt ở trang chủ thành viên và danh sách CLB.*
7. **Ai làm phần nào:** *đã chọn: Hiệu làm hết* (thay cho phân công trong CLAUDE.md: Hiệu phía thành viên, Khang màn quản trị, Khoa server). Hợp đồng API mới chờ Khoa xem sau, vì `docs/api.md` đang ghi bản nháp chờ Khoa duyệt.
