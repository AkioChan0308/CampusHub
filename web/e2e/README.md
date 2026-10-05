# Script bấm thử (Playwright)

Các script mở Chrome chạy ngầm, bấm qua từng luồng như người dùng và in kết quả "OK"/"LOI" cho từng kiểm tra.

## Chạy

Cần chạy cùng lúc:
- máy chủ: `npm start` trong `server/`, cổng 4000, chế độ demo;
- web: `npm run dev` trong `web/`, cổng 3000.

Máy chủ nên chạy bằng `npm start`, không dùng `npm run dev`. Bản `dev` tự khởi động lại khi thấy file đổi (trên Windows có lúc chỉ đọc file cũng tính là đổi), và mỗi lần như vậy phiên đăng nhập trong bộ nhớ mất. Script đang chạy dở sẽ báo hết giờ chờ một nút, dù trang không lỗi.

Chạy trong `web/`:

| Lệnh | Làm gì |
|---|---|
| `npm run e2e` | Chạy lần lượt mọi script luồng, in các dòng lỗi và dòng tổng kết của từng script |
| `npm run e2e:smoke` | Chỉ chạy luồng chính |
| `npm run e2e:khung-xuong` | Đo khung xương: vị trí các khối lúc đang tải (API làm chậm 1,5 giây) so với lúc đã tải. Xem cách đọc ở dưới |
| `node e2e/<tên file>` | Chạy một script |

Máy cần có Chrome. Không có Chrome thì đặt `CHROME_PATH` tới file chạy của Chrome hoặc Chromium. Web chạy ở địa chỉ khác thì đặt `BASE`.

Đọc kết quả đo khung xương:
- Mỗi khối in hai số: lúc đang tải và lúc đã tải. `y` là vị trí theo chiều dọc, `h` là chiều cao, `x` và `w` là vị trí và chiều rộng.
- Chỉ cần `y` của hai dòng bằng nhau: trang không bị đẩy khi dữ liệu về.
- Dòng có dấu ≠ mà chỉ khác `w` là bình thường: thanh xương có độ rộng cố định, chữ thật dài ngắn tùy dữ liệu.
- Danh sách cao hơn lúc đã tải (khác `h` của khối danh sách) cũng bình thường: khung xương chỉ vẽ vài dòng.
- Khối chỉ có sau khi tải (in `-` ở dòng khung xương) thì xem ảnh chụp để chắc nó không đẩy khối khác.

Script tự đặt lại dữ liệu mẫu trước khi chạy (`POST /api/v1/demo/reset`), nên dữ liệu đang thử trên máy sẽ mất.

## Các file

| File | Kiểm tra gì |
|---|---|
| `smoke.cjs` | Luồng chính, 40 kiểm tra: đổi vai bằng tài khoản mẫu ở trang đăng nhập, trang chủ, thành viên, chiếu QR và điểm danh qua tab khác, đợt thu, đối soát, duyệt chi, dự trù, bàn giao, nhà trường, sinh viên gửi đơn, lời mời, đóng quỹ |
| `nhom-tien.cjs` | Đợt thu, Đối soát, Duyệt chi, Dự trù |
| `nhom-2.cjs` | Thành viên, Chiếu QR, Bàn giao, điểm danh trên điện thoại |
| `nhom-3-4.cjs` | Của tôi, Lời mời, Danh sách CLB, Trang CLB, hai màn nhà trường |
| `tao-du-lieu.cjs` | Tạo CLB, thêm thành viên từ file .xlsx, tạo/sửa/xóa buổi, tạo/sửa đợt thu, đổi vai, nhận lời mời |
| `sua-loi.cjs` | Các lỗi sửa ngày 05/10/2026: link QR giữ `?e=&t=` khi phải đăng nhập, màn tự tải lại khi máy chủ báo 409, đối soát hỏi lại và nhận ra "đã đóng" theo trạng thái máy chủ, đối soát đợt thu cũ khi CLB có hai đợt, trang Của tôi đổi ngay sau khi báo đã chuyển |
| `dang-nhap.cjs` | Trang đầu (hai video, chuyển về trang của mình khi đã đăng nhập), /demo đã bỏ, bảng tài khoản mẫu (đủ 7 vai, bấm là điền sẵn, đăng nhập được), câu lỗi Google theo mã, đăng nhập bằng tên tài khoản hoặc email và mật khẩu, sai mật khẩu, khóa sau 5 lần sai, đặt và đổi mật khẩu ở /account, nút "Để sau", tên tài khoản ở Của tôi |
| `khung-xuong-*.cjs` | Đo khung xương của từng nhóm màn |
| `quay-video.cjs` | Không phải bài kiểm tra: quay lại hai video demo của trang đầu (xem dưới) |
| `chung.cjs` | Phần dùng chung: địa chỉ web, mở Chrome, thư mục ảnh |
| `chay-tat-ca.cjs` | Chạy lần lượt các script |
| `mau/` | Dữ liệu mẫu tự đặt để test (file danh sách thành viên) |

Ảnh chụp lưu ở `e2e/anh/<tên script>/`. Thư mục này không đưa vào repo.

Thêm màn mới thì thêm kiểm tra vào script của nhóm đó, hoặc tạo script mới rồi thêm tên vào `chay-tat-ca.cjs`.

## Quay lại video demo của trang đầu

Trang đầu có hai video quay từ chính bản demo: thành viên trên điện thoại và ban điều hành trên laptop. Giao diện đổi thì quay lại:

1. Chạy web và máy chủ như trên (chế độ demo).
2. Cài ffmpeg, hoặc đặt biến `FFMPEG` tới file chạy của ffmpeg.
3. Chạy trong `web/`: `node e2e/quay-video.cjs` (cả hai), hoặc `node e2e/quay-video.cjs thanh-vien` / `ban-dieu-hanh` (một video).

Script đặt lại dữ liệu mẫu, đặt mật khẩu cho hai tài khoản mẫu (Lý Hoàng Nam, Phạm Quốc Bảo), rồi bấm qua từng bước, bắt đầu từ trang đăng nhập. Kết quả ghi vào `public/video/` (file `.mp4` và ảnh đầu video `.jpg`) và `src/app/video-buoc.json` (giây bắt đầu của từng bước). Trong lúc quay, web được báo là đang chạy bản thật, nên video không có phần chỉ có ở bản demo. Đổi bước nào thì sửa cả tên bước trong `src/app/page.tsx`.
