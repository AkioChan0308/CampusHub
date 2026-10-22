# Mô tả: Bảng tin chung (chờ Hiệu duyệt)

*Ngày 22/10/2026. Đây là bản mô tả để duyệt, **chưa có dòng code nào**. Theo luật của dự án, màn chưa có bản vẽ thì viết mô tả trước, Hiệu duyệt rồi mới làm. Đường dẫn ở dưới đặt theo luật đặt tên (tiếng Anh).*

## 1. Vì sao có màn này

Hiện CampusHub chỉ có góc nhìn **trong một CLB** (ban điều hành quản lý, thành viên dùng việc của mình) và danh bạ **Tìm CLB** (`/explore`, chỉ để xin vào). Chưa có chỗ để các CLB **thấy tin của nhau** và giao lưu.

Ý của Hiệu: một trang chung giống trang chủ, nơi người dùng thấy tin công khai do các CLB đăng, và vẫn có tab riêng cho CLB mình trực thuộc. Cả thành viên lẫn ban điều hành đều dùng được.

**Chưa có bằng chứng** là các CLB cần việc này: khảo sát CP2 nói về bàn giao, không nói về giao lưu giữa CLB. Nên bản mô tả này là **bản nhỏ nhất để thử**, không phải một mạng xã hội.

## 2. Làm gì và không làm gì

**Làm (bản nhỏ nhất):**
- Một **Bảng tin chung**: danh sách tin công khai của các CLB, mới nhất trước.
- Chỉ **hai loại tin**:
  - **Sự kiện mở**: dùng lại loại buổi "mở cho cả người ngoài CLB" đã có (ví dụ Giải nội bộ Fall 2026). Ban điều hành bật "Hiện trên bảng tin chung" cho từng sự kiện.
  - **Thông báo ngắn**: ban điều hành đăng chữ (tuyển người, kết quả giải, lời cảm ơn...).
- Ai đã đăng nhập đều **xem** được. Chỉ **ban điều hành** của CLB đó đăng, sửa, ẩn tin của CLB mình.
- Trên trang CLB công khai (`/explore/[clubId]`, đã có) hiện thêm các tin gần đây của CLB đó.

**Không làm (cố ý):**
- Bình luận, thích, theo dõi CLB, nhắn tin riêng, nhóm chat. Giao lưu vẫn diễn ra ở Zalo; CampusHub **không thay Zalo** (nguyên tắc đã chốt).
- Ảnh và video. Lý do: ảnh có mặt người là dữ liệu cá nhân, phải có đồng ý theo từng mục đích và rút được (Luật 91/2025). Chưa làm phần đồng ý nên chưa làm ảnh.
- Thông báo đẩy, email, nhắc tin mới.
- Quảng cáo trong bảng tin (khung quảng cáo mẫu hiện chỉ ở `/me` và `/explore`).
- Đa trường: bản demo coi mọi CLB cùng một trường (tên trường đang để trống "[Tên trường]").

## 3. Các màn

### 3.1 Bảng tin chung: `/feed`

- **Ai dùng:** mọi người đã đăng nhập (thành viên, sinh viên chưa vào CLB, ban điều hành). Trên laptop là trang web thường, trên điện thoại là khung điện thoại như các màn thành viên.
- **Đầu màn:** tờ lịch hôm nay, tiêu đề "Bảng tin".
- **Hai nút chọn phần:** **Tin chung** (tin của mọi CLB) và **CLB của tôi** (chỉ tin của CLB mình đang ở; sinh viên chưa vào CLB nào thì phần này nói rõ "Bạn chưa ở CLB nào" kèm nút "Tìm CLB").
- **Bộ lọc:** theo lĩnh vực (dùng đúng danh sách lĩnh vực của Tìm CLB); ô tìm theo tên CLB hoặc chữ trong tin.
- **Mỗi tin là một dòng trên tờ giấy:**
  - Sự kiện mở: tờ lịch nhỏ (ngày, thứ), tên sự kiện, giờ, nơi diễn ra, tên CLB, nhãn "Sự kiện mở".
  - Thông báo: tên CLB, nhãn "Thông báo", tiêu đề, vài dòng đầu của nội dung (bấm để mở đủ), thời điểm đăng.
  - Nút "Xem CLB" mở trang CLB công khai.
- **Trạng thái rỗng:** "Chưa có tin nào." Người ban điều hành thấy thêm lối "Đăng tin đầu tiên của CLB".
- **Quy tắc đỏ của Lịch bloc:** sự kiện diễn ra hôm nay hoặc trong 3 ngày tới dùng tờ lịch đỏ như mọi nơi khác.

### 3.2 Đăng tin của CLB: `/clubs/[clubId]/posts`

- **Ai dùng:** ban điều hành. Chủ nhiệm, phó chủ nhiệm và trưởng ban đăng và sửa; thủ quỹ xem (cùng nhóm quyền với Kho bàn giao: tên quyền đề xuất `post`, **cần Hiệu chọn**, xem câu hỏi 6).
- **Vị trí menu:** nhóm chính, cạnh "Việc cần làm", tên "Bảng tin của CLB".
- **Nội dung màn:** danh sách tin của CLB (đã đăng, đã ẩn), nút "Đăng tin".
- **Form đăng tin:** loại (Thông báo), tiêu đề, nội dung. Độ dài tối đa: **chưa chốt**. Có dòng nhắc cố định: "Tin này hiện công khai cho mọi người đã đăng nhập. Không ghi tên hay thông tin cá nhân của thành viên, không ghi chuyện tiền quỹ."
- **Sự kiện mở:** không đăng ở đây. Ở màn **Các buổi** (`/clubs/[clubId]/events`), buổi loại "mở cho cả người ngoài CLB" có ô "Hiện trên bảng tin chung" (tắt sẵn).
- **Nút:** Đăng, Sửa, **Ẩn tin** (có hộp hỏi lại; ẩn rồi thì không hiện ở bảng tin, ban điều hành vẫn thấy). Không có "xóa hẳn" ở bản này, để còn lịch sử.
- **Lịch sử:** mọi đăng, sửa, ẩn lưu ai làm, lúc nào (như việc cần làm).

### 3.3 Trang CLB công khai: `/explore/[clubId]` (đã có, thêm một khối)

- Thêm khối "Tin gần đây của CLB" (vài tin mới nhất, nhấn "Xem tất cả" ra bảng tin đã lọc theo CLB đó).

### 3.4 Lối vào

- **Thành viên:** thêm tab thứ tư **Bảng tin** vào ba tab hiện có (Điểm danh, Quỹ, Của tôi). Chỗ này cần Hiệu xem lại vì phá bố cục ba tab đã duyệt (câu hỏi 5).
- **Ban điều hành:** mục menu "Bảng tin chung" nhóm Nhiệm kỳ hoặc đặt riêng.
- **Sinh viên chưa vào CLB:** từ trang Tìm CLB có nút "Xem bảng tin".

## 4. Luật nội dung và dữ liệu cá nhân

- Tin **công khai cho mọi người đã đăng nhập**. Chưa mở cho người chưa đăng nhập (câu hỏi 1).
- Tin chỉ chứa chữ do ban điều hành viết. **Không** tự đưa vào bảng tin dữ liệu của thành viên, số tiền hay sổ quỹ.
- Có dòng nhắc cố định ở form đăng tin (xem 3.2). Máy chủ không kiểm được nội dung viết, nên đây là trách nhiệm của người đăng.
- Ban điều hành chỉ đăng, sửa, ẩn tin **của CLB mình** (kiểm ở máy chủ, `server/src/access.ts`, không tin giao diện).
- Người đã rời CLB hoặc đã xóa dữ liệu: tin do họ đăng giữ nguyên (ghi tên CLB, không ghi tên người đăng), để không phải xóa lịch sử của CLB.
- **Kiểm duyệt và báo cáo bài:** chưa có ở bản này (câu hỏi 3).

## 5. Dữ liệu và API (phác, để Khoa xem sau)

- Một bảng tin: mã, CLB, loại, tiêu đề, nội dung, trạng thái (đang hiện, đã ẩn), ai đăng, lúc đăng, lịch sử. Sự kiện mở dùng lại bảng sự kiện, thêm một cờ "hiện trên bảng tin".
- API: lấy bảng tin (lọc theo lĩnh vực, theo CLB), đăng, sửa, ẩn tin, bật tắt cờ ở sự kiện. Theo thứ tự `contract.ts`, handler, `docs/api.md`, test.
- Migration mới đặt tên tiếng Anh (ví dụ `007_club_posts.sql`).
- Dữ liệu mẫu: vài tin mẫu của ba CLB tự bịa, ghi rõ là dữ liệu mẫu.

## 6. Cách kiểm tra khi làm xong

- Test máy chủ: chỉ ban điều hành đăng được; thành viên thường 403; không đăng, sửa, ẩn được tin của CLB khác; tin ẩn không hiện ở bảng tin; lọc đúng.
- Bấm thử bằng Playwright, theo mẫu `web/e2e/`.
- Mục mới trong phần kiểm thử bằng tay của `docs/luong-nguoi-dung.md` (cuối file).

## 7. Câu hỏi cần Hiệu quyết

1. **Ai xem:** chỉ người đã đăng nhập (đề xuất, đơn giản và an toàn hơn), hay cả người chưa đăng nhập (giống trang chủ công khai, nhưng tin ra ngoài tầm kiểm soát)?
2. **Phạm vi trường:** bản demo coi mọi CLB cùng một trường. Khi có nhiều trường thì bảng tin chia theo trường hay chung toàn hệ thống? (Để trả lời sau, không chặn bản demo.)
3. **Kiểm duyệt:** để ban quản lý CLB của trường ẩn được tin vi phạm và có nút "Báo cáo tin" cho người xem, hay chưa làm ở bản này? Đề xuất: chưa làm, chỉ ghi vào danh sách việc sau.
4. **Duyệt trước khi hiện:** tin hiện ngay khi đăng (đề xuất), hay chờ ban quản lý CLB của trường duyệt?
5. **Lối vào của thành viên:** thêm tab thứ tư vào thanh tab, hay đặt Bảng tin ở trang Của tôi, hay trên thanh trên?
6. **Ai đăng:** chủ nhiệm, phó chủ nhiệm, trưởng ban (cùng nhóm với Kho bàn giao), hay cả thủ quỹ?
7. **Có làm không và khi nào:** bản demo 24 đến 25/10 đang tập trung vào bộ bàn giao. Đây là việc **sau demo** hay làm ngay?
8. **Bằng chứng:** hỏi 5 CLB ở đợt khảo sát tới một câu: "Lần gần nhất bạn muốn biết CLB khác đang làm gì, bạn tìm ở đâu?". Chưa hỏi nên chưa có số liệu.

## 8. Đã dựng khung rỗng, phần còn lại chưa quyết

**Đã có (22/10/2026, theo ý Hiệu: dựng đường dẫn và khung xương trước, đắp nội dung sau):**
- `/feed` (`web/src/app/(student)/feed/`): khung điện thoại và khung web như các màn thành viên; tờ lịch hôm nay, tiêu đề "Bảng tin", hai nút chọn phần (Tin chung, CLB của tôi), khung xương lúc tải, trạng thái rỗng ("Chưa có tin nào"); phần CLB của tôi nói "Bạn chưa ở CLB nào" kèm nút Tìm CLB khi người xem chưa vào CLB.
- `/clubs/[clubId]/posts` (`web/src/app/(club-admin)/clubs/[clubId]/posts/`): trong khung ban điều hành, tiêu đề "Bảng tin của CLB", khung xương, trạng thái rỗng.
- Cả hai trang có chú thích trong mã ghi chỗ sẽ đắp nội dung (danh sách tin, bộ lọc, ô tìm, nút Đăng tin, form).
- Script bấm thử `web/e2e/feed-shell.cjs` (chưa chạy được, xem dưới).

**Chưa có, cố ý:** API, dữ liệu, bảng, danh sách tin thật, lọc, tìm, đăng tin, **lối vào** (không có mục menu, không có tab thứ tư: chờ câu hỏi 5, 6), kiểm duyệt. Mở bằng cách gõ thẳng đường dẫn.

**Chưa kiểm tra:** đã typecheck sạch; chưa mở trên trình duyệt và chưa chạy `feed-shell.cjs`, vì lúc kiểm có máy chủ khác đang giữ cổng 3000 và 4000 mà chưa rõ có dùng cơ sở dữ liệu thật không. Chạy lại khi tắt hai server đó hoặc khi biết chắc chúng dùng dữ liệu trong bộ nhớ.

Các câu hỏi ở mục 7 vẫn chờ Hiệu quyết trước khi đắp nội dung.
