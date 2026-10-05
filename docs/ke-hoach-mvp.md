# Kế hoạch MVP CampusHub

*Bản đề xuất ngày 02/10/2026. Lúc này Checkpoint 2 chưa xong; khi có kết quả CP2 sẽ chỉnh lại theo mục "Khi CP2 có kết quả".*

**Tình trạng 02/10/2026:** wireframe 16 màn đã vẽ, Hiệu duyệt tạm với vai design lead. Bản demo giao diện của cả 16 màn đã có trong `web/`, dùng dữ liệu mẫu; chưa có máy chủ, cơ sở dữ liệu, đăng nhập. Cách chạy và những chỗ cần duyệt thêm: `web/README.md`.

**Tình trạng 03/10/2026:** có khung server trong `server/` (Node.js + Express, dữ liệu mẫu trong bộ nhớ) và bản nháp hợp đồng API `docs/api.md`: 49 API cho 16 màn, chờ Khoa và nhóm giao diện duyệt. Web chưa gọi API.

**Tình trạng chi tiết, cập nhật theo từng nhóm việc: `docs/tien-do-mvp.md`.**

**Tình trạng 04/10/2026:**
- Đã có:
  - web gọi API ở cả 16 màn, giao diện "Lịch bloc" (Hiệu duyệt);
  - đăng nhập Google (chưa tạo khóa Google);
  - phân quyền ở máy chủ;
  - máy chủ lưu được vào PostgreSQL (`docs/postgresql.md`);
  - tạo CLB, thêm thành viên từ Excel và link mời, tạo buổi, tạo đợt thu (mô tả màn được Hiệu duyệt; bản vẽ chưa có).
- Chưa có:
  - mã VietQR thật;
  - luồng hoàn tiền; bàn giao bước 1, 2, 4–6; sổ quỹ đầy đủ; đổi CLB khi ở nhiều CLB;
  - ảnh chứng từ;
  - gửi email;
  - xử lý yêu cầu xóa dữ liệu.

## Tóm tắt

Làm thật ngay phần cho **ban điều hành CLB**: thành viên, điểm danh, sổ quỹ (kèm thanh toán VietQR và đối soát sao kê), bàn giao.

Phần cho **ban quản lý CLB của trường** chỉ làm bản mỏng. Nhà trường là bên trả tiền chính, nhưng các giả thuyết về phía trường (H9–H11) chưa hỏi được ai.

Thứ tự 3 hạng mục:
1. Luồng theo vai trò: làm trước, vì nó quyết định màn hình và phân quyền.
2. MVP lõi.
3. Thanh toán: nằm trong phần sổ quỹ.

## Vì sao làm phần lõi được ngay

Dữ liệu thật đầu tiên của Checkpoint 2 (mẫu còn nhỏ, chi tiết ở `../CP2/Tien do Checkpoint 2.xlsx`, sheet 6):

- **Đối chiếu quỹ:** anh chủ nhiệm ở Khảo sát 01 tải sao kê rồi dò tay với Sheets, mất 1–2 tiếng. Nhầm thường do chuyển khoản sai cú pháp, nhờ người chuyển hộ, hoặc giao dịch về trễ.
- **Điểm danh:** tick tay mất 10–15 phút; dùng QR hoặc Google Form khoảng 5 phút (Khảo sát 01).
- **Chủ nhiệm C03** (Google Form chung):
  - mất "2h mỗi ngày" cho ghi chép, báo cáo;
  - thêm một thành viên mới mất khoảng 2 ngày;
  - sau bàn giao phải làm lại danh sách thành viên.
- **Người chưa vào CLB:** trong 5 người từng đi tìm danh sách CLB, 3 người không tìm được hoặc thấy danh sách không đủ. Một người khác xin vào CLB qua Facebook mà không được hồi âm.
- **Ngược lại:** 4/6 thành viên không có chuyện gì khó chịu, nên phía thành viên làm gọn, ít màn hình.

## Lộ trình 10 tuần

Khớp mốc ở Checkpoint 1: tuần 1–6 làm MVP, tuần 7–10 chạy pilot. Tuần 1 là tuần bắt đầu code; khi chốt hạn nộp Checkpoint 4 (nộp MVP) thì đổi sang ngày cụ thể.

| Tuần | Làm gì | Ai làm chính | Xong khi |
|---|---|---|---|
| 1 | Chốt luồng các vai trò. Duyệt wireframe MVP (đã vẽ và Hiệu duyệt tạm ngày 02/10, xem `design/README.md`; bản demo giao diện ở `web/`); Vinh chỉnh giao diện trên bản vẽ. Thiết kế cơ sở dữ liệu. Dựng khung: đăng nhập Google, tạo CLB, phân quyền. Đưa code lên GitHub | Vinh, Khoa; Hiệu duyệt phạm vi | Cả nhóm duyệt luồng; đăng nhập và tạo CLB chạy được; Khang và Khoa kéo được code về |
| 2–3 | Thành viên: nhập Excel, link mời, đơn xin vào có trạng thái. Sự kiện, điểm danh QR động và điểm danh tay | Khoa (API, QR), Khang (màn quản trị), Hiệu (màn thành viên) | Điểm danh được một buổi họp thật của nhóm |
| 3–5 | Sổ quỹ: đợt thu có VietQR, ghi thu chi, ghi tiền mặt, đề xuất và duyệt chi. Đối soát sao kê | Khoa, Khang; Bình soạn quy tắc đối soát | Đối soát được một file sao kê thật; giao dịch lệch hiện ra để gán tay |
| 5–6 | Bàn giao (chốt số dư, đổi tài khoản nhận quỹ, chuyển quyền), xuất Excel. Bản mỏng cho nhà trường. Dự trù kinh phí theo kỳ | Khoa, Hiệu, Khang; Bình xin mẫu dự trù | Có bản demo chạy được từ đầu đến cuối |
| 7–10 | Pilot ở CLB thật; sửa theo góp ý và theo kết quả CP2 | Khang (vận hành pilot), Nghĩa (tìm CLB), cả nhóm | Có số đo theo chỉ tiêu SMART ở CP1 |

Từ tuần 1, Nghĩa và Khang bắt đầu tìm CLB pilot. Đã có hai người liên lạc được: anh chủ nhiệm ở Khảo sát 01, và chủ nhiệm C03 (có để lại cách liên lạc trong Google Form).

## 1. MVP gồm gì

**Làm**
- Phần lõi theo `../Phuong an nghiep vu.md`: thành viên, điểm danh, sổ quỹ, bàn giao, xuất Excel.
- Thêm phần mới: đơn xin vào CLB, đối soát sao kê, dự trù theo kỳ, bản mỏng cho nhà trường, màn đồng ý dữ liệu cá nhân.

**Chưa làm**
- Nhãn hàng, tài trợ.
- Điểm danh sự kiện cấp trường (FPT đã có hệ thống điểm trải nghiệm).
- App cài đặt.

## 2. Dự trù kinh phí theo kỳ (tính năng cho CLB)

- CLB nhập các hoạt động dự kiến trong kỳ. Mỗi hoạt động có số tiền dự trù và nguồn tiền: quỹ thành viên, trường hỗ trợ hoặc tài trợ.
- Số dư cuối kỳ dự kiến = số dư hiện tại + tiền thu dự kiến từ các đợt thu đang mở + hỗ trợ dự kiến − phần dự trù chưa chi. Không trừ tổng dự trù: tiền đã chi đã nằm trong số dư hiện tại, trừ tổng là trừ hai lần. Nếu ra số âm thì báo cho ban điều hành.
- Sau mỗi hoạt động, so số dự trù với số chi thật trong sổ quỹ.
- Xuất bản dự trù và báo cáo tổng kết theo mẫu CLB đang nộp cho SRO hoặc mentor. Anh chủ nhiệm ở Khảo sát 01 cho biết CLB phải nộp những giấy này mỗi kỳ. Bình xin mẫu thật.
- Lý do làm: tính năng này nối được hai phía. Nhà trường muốn biết CLB chi tiền vào đâu (H10).
- Cái giá: phải có ít nhất một kỳ sổ quỹ thật thì mới dự báo theo dữ liệu cũ được. Trước đó chỉ là phép cộng trừ minh bạch; không hứa có AI dự báo.

## 3. Thanh toán: chia 3 mức

| Mức | Làm gì | Khi nào |
|---|---|---|
| 1 | Tạo mã VietQR có sẵn số tiền và mã riêng của từng thành viên trong nội dung chuyển khoản. Tiền vào thẳng tài khoản của CLB hoặc thủ quỹ. Cho ghi tay tiền mặt | MVP |
| 2 | Thủ quỹ tải file sao kê từ app ngân hàng lên. Hệ thống tự khớp theo mã và số tiền. Giao dịch sai cú pháp, chuyển hộ hoặc về trễ vào danh sách chờ để thủ quỹ gán tay | MVP |
| 3 | Tự nhận biến động số dư qua dịch vụ của bên thứ ba | Sau pilot, chỉ khi đã hỏi luật |

- Không giữ tiền, không thu hộ (Nghị định 52/2024). Mức 3 nằm sát ranh giới này.
- File sao kê mỗi ngân hàng một dạng. Cần hỏi CLB pilot dùng ngân hàng nào để làm trước cho đúng 1–2 ngân hàng đó.
- Nhà trường trả tiền cho nhóm qua hợp đồng hoặc gói thầu, không mua online, nên không cần cổng thanh toán cho việc này.

## 4. Luồng theo vai trò

| Cách gọi trong nhóm | Vai trò trong CampusHub | Dùng gì | Luồng chính |
|---|---|---|---|
| Khách hàng | Thành viên CLB | Điện thoại | Nhận lời mời và đồng ý cho lưu dữ liệu → quét QR điểm danh → đóng quỹ bằng VietQR → xem lịch sử của mình, xem sổ quỹ (chỉ đọc) |
| Khách hàng | Sinh viên chưa vào CLB | Điện thoại | Xem danh sách CLB đang hoạt động → gửi đơn xin vào → theo dõi đơn đã được duyệt chưa |
| Staff | Ban điều hành: chủ nhiệm, phó, thủ quỹ, trưởng ban | Laptop | Tạo CLB, nhập danh sách → duyệt đơn → tạo sự kiện, mở QR → mở đợt thu, đối soát sao kê → đề xuất và duyệt chi → lập dự trù kỳ → bàn giao |
| Quản lý | Ban quản lý CLB của trường (SRO, PDP) và mentor | Laptop | Xem các CLB đang hoạt động, số thành viên, số buổi sinh hoạt → nhận dự trù và báo cáo kỳ → mentor duyệt khoản chi lớn, xác nhận bàn giao |

## Khi CP2 có kết quả

- Nếu H9–H11 được ủng hộ, làm sâu phía nhà trường từ tuần 7. Nếu không, phía trường dừng ở bản mỏng và nhóm phải xem lại ai là người trả tiền.
- Nếu H4 (thành viên không biết tiền quỹ đi đâu) không được ủng hộ, bớt phần sổ quỹ công khai cho thành viên, dồn sức cho đối soát của thủ quỹ.
- Nếu H3 (điểm danh tốn thời gian, dễ gian lận) không được ủng hộ, giữ điểm danh QR ở mức đơn giản.
- Không đem bản demo ra trong các buổi phỏng vấn CP2, vì làm vậy là dẫn dắt người trả lời. Chỉ cho xem ở buổi sau, khi đã hỏi xong.

## Chưa chốt

- Hạn nộp Checkpoint 4 (MVP) và tuần bắt đầu code.
- Stack phía máy chủ: khung server đã làm bằng Node.js + Express như CP1; còn chốt cơ sở dữ liệu (PostgreSQL theo CP1) và cách đăng nhập. Frontend đã làm bằng Next.js, khớp CP1.
- Hợp đồng API (`docs/api.md`): duyệt bản nháp v0 rồi đổi thành v1.
- "Khách hàng, staff, quản lý" có đúng như bảng ở mục 4 không.
- CLB pilot dùng ngân hàng nào (để làm đối soát sao kê).
