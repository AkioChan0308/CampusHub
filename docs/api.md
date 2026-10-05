# Hợp đồng API CampusHub

Tài liệu này chốt cách web (giao diện) gọi server: có những API nào, ai được gọi, gửi gì và nhận gì. Đây là **bản nháp v0, ngày 03/10/2026**, chờ Khoa (Tech Lead) và nhóm giao diện duyệt. Cùng ngày đã thêm: đăng nhập (Google, đăng nhập nhanh ở chế độ demo, đăng xuất), ghi chú khi duyệt khoản chi, đơn bị từ chối gửi lại được.

- Kiểu dữ liệu chính xác của từng API (tên trường, kiểu, trường nào có thể vắng): `server/src/contract.ts`. Tài liệu này không chép lại từng trường.
- Có một server chạy được đủ 49 API, dùng dữ liệu mẫu trong bộ nhớ (`server/`). Test trong `server/test/` gọi từng API qua HTTP và kiểm tra tài liệu này khớp với `contract.ts`.
- Web hiện **chưa** gọi các API này: bản demo giao diện vẫn chạy luật ngay trong trình duyệt. Nối web với server là bước sau khi chốt.

## Cách duyệt

- **Khoa:** xem các mục Quy ước chung, Lỗi, Quyền và Chưa chốt. Đổi gì thì sửa `contract.ts` trước, chạy `npm test` trong `server/`, rồi sửa tài liệu này.
- **Nhóm giao diện:** tìm màn mình làm trong cột "Màn" ở bảng API, xem API trả có đủ dữ liệu để vẽ màn đó không.
- Khi cả nhóm đồng ý: đổi dòng "bản nháp v0" ở đầu file thành "v1, chốt ngày …". Sau đó, muốn đổi một API thì báo cả nhóm, vì web và server cùng phải sửa.

## Quy ước chung

- **Địa chỉ:** mọi API nằm sau `/api/v1`. Khi phát triển, server chạy ở `http://localhost:4000`. Đường dẫn trong bảng dưới đây đã bỏ phần `/api/v1`.
- **Dữ liệu:** JSON, UTF-8. Trường không có giá trị thì không xuất hiện (không trả `null`).
- **Tiền:** số nguyên, đơn vị đồng. Ví dụ `100000` là 100.000 ₫.
- **Thời điểm:** chuỗi ISO 8601 có múi giờ Việt Nam, ví dụ `2026-10-02T19:02:00+07:00`.
- **Mã (id):** chuỗi do server tạo. Web không tự đặt mã.
- **Số tiền khi ghi nhận:** server tự tính. Ví dụ khi ghi tiền mặt, web chỉ gửi cách đóng; số tiền là phần người đó còn thiếu.
- **Mã HTTP:** 200 khi thành công, 201 khi tạo mới (đơn xin vào, khoản chi, khoản dự trù, file sao kê), lỗi theo bảng ở mục Lỗi.
- **Gọi lại an toàn:** mở điểm danh, đóng điểm danh, điểm danh, báo đã chuyển khoản, gửi yêu cầu xóa dữ liệu đều gọi lại được mà không ghi trùng.

### Đăng nhập

Cập nhật ngày 03/10/2026: đã có đăng nhập thật.

- **Đăng nhập Google** (luồng mã có PKCE): web mở `GET /auth/google/start` kèm `?next=/trang-can-mo`, Google gọi lại `GET /auth/google/callback`, server cấp phiên rồi đưa trình duyệt về trang `next`. Lỗi thì về `/login?loi=<lý do>`. Cần `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` trong `server/.env`; Authorized redirect URI trên Google Cloud là `<WEB_ORIGIN>/api/v1/auth/google/callback`.
- **Phiên:** cookie httpOnly `ch_session`, SameSite=Lax, giữ 30 ngày, lưu trong bộ nhớ của server (tắt server là phải đăng nhập lại). Web gọi API qua cùng địa chỉ với web (Next.js chuyển tiếp `/api/v1` sang server) nên cookie tự đi kèm.
- **Email nào là ai:** email ghép sẵn trong `LOGIN_AS` của `server/.env` (dùng để thử từng vai bằng tài khoản Google thật), rồi email có trong dữ liệu; email lạ thành tài khoản sinh viên mới, chưa ở CLB nào.
- **Chỉ ở chế độ demo** (`AUTH_MODE=demo`): đăng nhập nhanh `POST /auth/dev-login` bằng mã người trong dữ liệu mẫu (cho trang đăng nhập của bản demo và test tự động), và header `X-Demo-User` (cho test, curl và "thử điểm danh với vai" ở màn chiếu QR). Có header thì header được ưu tiên hơn cookie phiên: cookie dùng chung cho mọi tab, header chỉ của một tab. Chế độ `google` tắt cả hai.

Các mã dùng để thử:

| Mã | Người | Vai |
|---|---|---|
| a001 | Phạm Quốc Bảo | Chủ nhiệm CLB Cầu lông Sân Nhà |
| a002 | Lê Thu Hà | Thủ quỹ |
| a003 | Đinh Công Minh | Phó chủ nhiệm |
| a005 | Trần Gia Huy | Trưởng ban Hậu cần |
| a017 | Nguyễn Minh Anh | Thành viên |
| a022 | Lý Hoàng Nam | Thành viên chưa nhận lời mời |
| p-bao-chau | Trịnh Bảo Châu | Sinh viên chưa vào CLB |
| p-thu-trang | Đặng Thu Trang | Ban quản lý CLB của trường, mentor |

## Lỗi

Mọi lỗi trả về cùng một dạng. `message` là câu tiếng Việt, web hiện thẳng cho người dùng được.

```json
{ "error": { "code": "FORBIDDEN", "message": "Chỉ thủ quỹ và chủ nhiệm ghi nhận tiền." } }
```

| code | HTTP | Khi nào |
|---|---|---|
| UNAUTHENTICATED | 401 | Chưa đăng nhập |
| FORBIDDEN | 403 | Vai trò không được làm việc này |
| SELF_APPROVAL | 403 | Duyệt hoặc từ chối khoản do chính mình đề xuất |
| NOT_FOUND | 404 | Không có CLB, buổi, khoản chi… như đường dẫn ghi |
| VALIDATION | 400 | Dữ liệu gửi lên thiếu hoặc sai. `details.issues` liệt kê từng ô sai |
| CONFLICT | 409 | Trạng thái hiện tại không cho làm việc này: đơn đã xử lý, người đã đóng tiền, khoản không còn chờ duyệt… |
| CHECKIN_NOT_OPEN | 409 | Buổi chưa mở điểm danh |
| CHECKIN_CLOSED | 409 | Buổi đã đóng điểm danh |
| QR_INVALID | 400 | Mã QR sai hoặc hết hạn |
| NOT_MEMBER | 403 | Chưa là thành viên CLB. `details` có `clubId`, `clubName` để web hiện nút gửi đơn |
| INVITE_PENDING | 403 | Chưa nhận lời mời. `details` có `inviteCode` để web hiện nút xem lời mời |
| DEVICE_USED | 409 | Điện thoại này đã điểm danh cho người khác trong buổi |
| INTERNAL | 500 | Lỗi của server |

## Quyền

"Ban điều hành" là chủ nhiệm, phó chủ nhiệm, thủ quỹ và trưởng ban đã nhận lời mời. Thành viên thường không gọi được API nào của ban điều hành.

| Việc | Ai làm được |
|---|---|
| Duyệt, từ chối đơn xin vào | Chủ nhiệm, phó chủ nhiệm, trưởng ban |
| Ghi tiền, tải sao kê, gán giao dịch, ghi đã chi | Thủ quỹ, chủ nhiệm |
| Duyệt, từ chối khoản chi | Chủ nhiệm, phó chủ nhiệm, trưởng ban; không ai duyệt khoản của chính mình |
| Khoản trên 2.000.000 ₫ sau khi ban điều hành duyệt | Mentor (cán bộ của trường) duyệt thêm |
| Sửa và gửi dự trù | Chủ nhiệm, phó chủ nhiệm, thủ quỹ |
| Bàn giao | Chủ nhiệm |
| Mở, đóng điểm danh; điểm danh tay | Cả ban điều hành |
| Xem trang chủ, thành viên, đợt thu, đối soát, sổ quỹ, khoản chi, dự trù, bàn giao | Cả ban điều hành |

Bảng quyền nằm ở `web/src/lib/selectors.ts` (`RIGHTS`); server dùng lại đúng bảng đó.

## Danh sách API

Cột "Màn" là tên màn trong `design/screens/`.

### Hệ thống

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /health` | Ai cũng gọi được | Kiểm tra máy chủ | Trả chế độ đăng nhập đang dùng và đã bật đăng nhập Google chưa (`googleLogin`) |
| `POST /demo/reset` | Chỉ khi chạy ở chế độ demo | Trang chọn vai | Đưa dữ liệu về dữ liệu mẫu ban đầu. Bản thật không có API này |

### Đăng nhập

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /auth/google/start` | Ai cũng gọi được | Trang đăng nhập | Chuyển trình duyệt (302) sang Google. `?next=` là trang mở lại sau khi xong, chỉ nhận đường dẫn trong web |
| `GET /auth/google/callback` | Google gọi lại | Trang đăng nhập | Kiểm tra `state` khớp cookie, đổi mã lấy email, cấp phiên, chuyển về trang `next` |
| `POST /auth/dev-login` | Chỉ khi chạy ở chế độ demo | Trang đăng nhập (bản demo) | Gửi `personId`; cấp phiên như đăng nhập Google, trả về giống `GET /me` |
| `POST /auth/logout` | Người đã đăng nhập | Mọi màn | Xóa phiên và cookie phiên |

### Thành viên (điện thoại)

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /me` | Người đã đăng nhập | Mọi màn | Thông tin của mình và các CLB đang ở. Lời mời chưa nhận có `inviteCode` |
| `GET /me/clubs/:clubId` | Thành viên đã nhận lời mời | TV-CuaToi | Điểm danh kỳ này, khoản quỹ, các mục đã đồng ý, yêu cầu xóa |
| `GET /me/clubs/:clubId/attendance` | Thành viên đã nhận lời mời | TV-DiemDanh | Các buổi đã mở điểm danh và các lần mình điểm danh |
| `POST /me/clubs/:clubId/consents/phone/withdraw` | Thành viên đã nhận lời mời | TV-CuaToi | Rút đồng ý lưu số điện thoại |
| `POST /me/clubs/:clubId/deletion-request` | Thành viên đã nhận lời mời | TV-CuaToi | Rời CLB và xóa dữ liệu. Ban điều hành thấy "đang xử lý yêu cầu xóa" |
| `GET /me/export` | Người đã đăng nhập | TV-CuaToi | Toàn bộ dữ liệu của mình (JSON); web tự chuyển thành file Excel |
| `GET /me/collections/:collectionId` | Thành viên đã nhận lời mời | TV-DongQuy | Số tiền còn phải đóng, nội dung chuyển khoản, người nhận, chuỗi để vẽ mã QR |
| `POST /me/collections/:collectionId/report-transfer` | Thành viên đã nhận lời mời | TV-DongQuy | Nút "Mình đã chuyển khoản" |
| `POST /checkin` | Thành viên quét mã QR | TV-DiemDanh | Gửi `eventId`, `token` trong link của mã QR và `deviceId` (mã ngẫu nhiên web lưu trong trình duyệt) |

### Sinh viên tìm CLB, lời mời

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs` | Người đã đăng nhập | SV-DanhSach | Học kỳ đang xem (`term`). Các CLB và quan hệ của mình với từng CLB: thành viên, được mời, đã gửi đơn, bị từ chối, chưa |
| `GET /clubs/:clubId` | Người đã đăng nhập | SV-DonXinVao | Một CLB, cùng dạng như trên |
| `POST /clubs/:clubId/applications` | Sinh viên chưa ở CLB | SV-DonXinVao | Gửi `year`, `reason`, `consent: true`. Không gửi trùng khi đơn trước còn chờ; đơn bị từ chối thì gửi đơn mới được; CLB tạm ngưng thì không nhận |
| `POST /clubs` | Người đã đăng nhập | Tạo CLB (chưa có bản vẽ) | `name`, `field`, `schedule`, `location`, `term` ("Fall 2026"), `acceptingApplications`, `mentor` không bắt buộc. Người tạo thành chủ nhiệm, mã A001. Tên trùng CLB khác (không phân biệt dấu, hoa thường) thì báo lỗi 409. Trả `club` (có `id` để mở trang chủ CLB) |
| `GET /invites/:code` | Đúng người được mời | TV-LoiMoi | Người khác mở link thì bị chặn |
| `POST /invites/:code/accept` | Đúng người được mời | TV-LoiMoi | Gửi `membership: true`, `age16: true`, `phone` tùy chọn. "Không tham gia" không gọi API |

### Ban điều hành: khung trang, thành viên, điểm danh

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/board` | Ban điều hành | Sidebar | Vai của mình, số việc chờ cho các nhãn đếm, buổi điểm danh sắp tới |
| `GET /clubs/:clubId/dashboard` | Ban điều hành | BDH-TrangChu | Việc chờ, 2 sự kiện sắp tới, đợt thu đang mở, số dư, 3 giao dịch gần nhất, số dư cuối kỳ dự kiến. `setup`: số thành viên và số buổi, để CLB mới được nhắc thêm thành viên, tạo buổi |
| `GET /clubs/:clubId/members` | Ban điều hành | BDH-ThanhVien | Thành viên theo mã, kèm số buổi đã điểm danh và trạng thái quỹ (có cách đóng: chuyển khoản hay tiền mặt). Người chưa nhận lời mời có `inviteCode` để sao chép link mời |
| `POST /clubs/:clubId/members` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Thêm thành viên (chưa có bản vẽ) | `members`: 1–300 người, mỗi người `name`, `email`, `department` và `year` không bắt buộc. Email không được trùng trong danh sách; người đã ở CLB thì báo lỗi 409 kèm `details.emails`. Người đã có tài khoản (cùng email) thì dùng lại. Mỗi người có mã thành viên mới, chưa nhận lời mời, và khoản phải đóng ở mọi đợt thu. Trả `added` kèm `inviteCode` (bản demo chưa gửi email: ban điều hành gửi link qua Zalo) |
| `PUT /clubs/:clubId/members/:personId` | Chủ nhiệm | BDH-ThanhVien | Đổi `role` và `department`. Không đổi ai thành chủ nhiệm và không đổi vai của chủ nhiệm (làm khi bàn giao) |
| `GET /clubs/:clubId/applications` | Ban điều hành | BDH-ThanhVien | Đơn xin vào; `?status=pending` (mặc định), `approved` hoặc `rejected` |
| `POST /clubs/:clubId/applications/:applicationId/approve` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | BDH-ThanhVien | Người xin vào thành thành viên chưa nhận lời mời, có mã thành viên mới và khoản quỹ phải đóng |
| `POST /clubs/:clubId/applications/:applicationId/reject` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | BDH-ThanhVien | |
| `GET /clubs/:clubId/events` | Ban điều hành | Danh sách buổi (chưa có bản vẽ) | Buổi chưa đóng trước, rồi tới buổi đã đóng; mỗi buổi kèm số người đã điểm danh (`attended`), cùng `memberCount` |
| `POST /clubs/:clubId/events` | Chủ nhiệm, phó chủ nhiệm, trưởng ban, thủ quỹ | Danh sách buổi (chưa có bản vẽ) | `title`, `kind` (`session` hoặc `open`), `start`, `end`, `location`, `checkinUntil` (sau giờ bắt đầu, không quá giờ kết thúc). Buổi đã qua giờ kết thúc thì báo lỗi 400 |
| `PUT /clubs/:clubId/events/:eventId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban, thủ quỹ | Danh sách buổi (chưa có bản vẽ) | Cùng dữ liệu như tạo buổi. Chỉ khi buổi chưa mở điểm danh |
| `DELETE /clubs/:clubId/events/:eventId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban, thủ quỹ | Danh sách buổi (chưa có bản vẽ) | Chỉ khi buổi chưa mở điểm danh và chưa ai điểm danh |
| `GET /clubs/:clubId/events/:eventId` | Ban điều hành | BDH-QR | Ai đã điểm danh, ai chưa (để điểm danh tay) |
| `POST /clubs/:clubId/events/:eventId/open` | Ban điều hành | BDH-QR | Gọi khi mở màn chiếu QR |
| `POST /clubs/:clubId/events/:eventId/close` | Ban điều hành | BDH-QR | Sau khi đóng, mã QR không dùng được nữa |
| `GET /clubs/:clubId/events/:eventId/qr` | Ban điều hành | BDH-QR | Mã hiện tại và `checkinPath`; web ghép với địa chỉ của mình rồi vẽ QR, gọi lại khi tới `refreshAt` |
| `POST /clubs/:clubId/events/:eventId/attendance` | Ban điều hành | BDH-QR | Điểm danh tay một `personId`; ghi lại người làm |

### Sổ quỹ

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/collections` | Ban điều hành | BDH-DotThu | Các đợt thu của CLB, đợt tạo gần nhất trước, kèm số liệu từng đợt. Đợt tạo gần nhất là đợt đang dùng ở trang chủ, màn đóng quỹ và đối soát |
| `POST /clubs/:clubId/collections` | Thủ quỹ, chủ nhiệm | Tạo đợt thu (chưa có bản vẽ) | `name`, `amount`, `dueDate`, `codePrefix` (chữ in hoa và số, 2–10 ký tự, không trùng đợt khác của CLB), `receiverId` (thành viên đã nhận lời mời), `accountName` (máy chủ đổi về chữ in hoa không dấu), `bank`, `account` (chỉ lưu 4 số cuối). Mọi thành viên có khoản "Chưa đóng" |
| `PUT /clubs/:clubId/collections/:collectionId` | Thủ quỹ, chủ nhiệm | BDH-DotThu | Sửa `dueDate`; `amount` chỉ sửa được khi chưa ai đóng hay báo đã chuyển |
| `GET /clubs/:clubId/collections/:collectionId` | Ban điều hành | BDH-DotThu | Đợt thu, số liệu, từng người: báo đã chuyển trước, rồi chưa đóng, rồi đã đóng. Người nhận tiền (`receiver`) kèm `role`: vai hiện tại trong CLB, để màn ghi đúng "thủ quỹ" hay "chủ nhiệm" (cùng trường ở màn đóng quỹ của thành viên) |
| `POST /clubs/:clubId/collections/:collectionId/payments/:personId` | Thủ quỹ, chủ nhiệm | BDH-DotThu | `method: "cash"` (ghi tiền mặt) hoặc `"transfer"` (ghi nhận tay khi đã thấy tiền vào tài khoản) |
| `GET /clubs/:clubId/collections/:collectionId/reconciliation` | Ban điều hành | BDH-DoiSoat | Kết quả file mới nhất, các giao dịch chờ gán ở mọi file, người báo đã chuyển mà chưa thấy trong sao kê, danh sách người để chọn khi gán |
| `POST /clubs/:clubId/collections/:collectionId/statements` | Thủ quỹ, chủ nhiệm | BDH-DoiSoat | Gửi `fileName` và nội dung file CSV (`csv`). Định dạng file: `web/README.md`, mục File sao kê. Dòng có ngày không có thật (ví dụ 31/02) bị bỏ, số dòng bỏ trả về ở `skippedDates`. Giao dịch đã có ở lần tải trước không ghi lại; GET reconciliation đếm riêng ở `latest.duplicates` |
| `POST /clubs/:clubId/collections/:collectionId/statements/:statementId/txns/:txnId/resolve` | Thủ quỹ, chủ nhiệm | BDH-DoiSoat | Gán tay cho một hay nhiều `personIds` (chuyển hộ: tiền chia đều) |
| `GET /clubs/:clubId/ledger` | Ban điều hành | BDH-BanGiao | Mọi bút toán, cũ trước, và số dư. Dùng khi xuất sổ quỹ |
| `GET /clubs/:clubId/expenses` | Ban điều hành | BDH-DuyetChi | Mọi khoản chi, mới trước, kèm lịch sử và khoản dự trù còn bao nhiêu |
| `POST /clubs/:clubId/expenses` | Ban điều hành | BDH-DuyetChi | Đề xuất chi hoặc hoàn ứng: `kind`, `title`, `amount`, `budgetItemId`, `reason`, `hasReceipt` |
| `POST /clubs/:clubId/expenses/:expenseId/approve` | Chủ nhiệm, phó chủ nhiệm, trưởng ban, trừ người đề xuất | BDH-DuyetChi | Khoản trên 2.000.000 ₫ chuyển sang chờ mentor. Gửi `note` (không bắt buộc) thì ghi chú vào lịch sử |
| `POST /clubs/:clubId/expenses/:expenseId/reject` | Chủ nhiệm, phó chủ nhiệm, trưởng ban, trừ người đề xuất | BDH-DuyetChi | Bắt buộc gửi `note` |
| `POST /clubs/:clubId/expenses/:expenseId/spent` | Thủ quỹ, chủ nhiệm | BDH-DuyetChi | Ghi khoản đã chi vào sổ quỹ. Chỉ khoản đã duyệt |
| `GET /clubs/:clubId/budget` | Ban điều hành | BDH-DuTru | Các khoản dự trù, đã chi, phép tính số dư cuối kỳ dự kiến |
| `POST /clubs/:clubId/budget/items` | Chủ nhiệm, phó chủ nhiệm, thủ quỹ | BDH-DuTru | `name`, `planned`; `period`, `source` không bắt buộc |
| `POST /clubs/:clubId/budget/submit` | Chủ nhiệm, phó chủ nhiệm, thủ quỹ | BDH-DuTru | Gửi bản dự trù cho mentor |

### Bàn giao

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/handover` | Ban điều hành | BDH-BanGiao | Bước hiện tại, số dư đã chốt và hiện tại, tài khoản nhận quỹ cũ và mới (chỉ 4 số cuối) |
| `PUT /clubs/:clubId/handover/receiver` | Chủ nhiệm | BDH-BanGiao | Bước 3: `personId`, `bank`, `account` (chỉ chữ số), `transferRef`. Lưu xong sang bước 4 |
| `PUT /clubs/:clubId/handover/step` | Chủ nhiệm | BDH-BanGiao | Chỉ quay lại bước trước |

### Nhà trường

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /school/clubs` | Cán bộ của trường | NT-TongQuan | Học kỳ đang xem (`term`). Mỗi CLB một dòng: thành viên, buổi có điểm danh, hoạt động gần nhất, có hoạt động trong 30 ngày không, dự trù, số khoản đang chờ mentor (`waitingMentor`) |
| `GET /school/clubs/:clubId` | Cán bộ của trường | NT-ChiTietCLB | Dự trù và đã chi theo hoạt động, sinh hoạt kỳ này, khoản chờ mentor, đề nghị hỗ trợ, bàn giao. Không có danh sách thành viên |
| `POST /school/expenses/:expenseId/approve` | Cán bộ của trường (mentor) | NT-ChiTietCLB | Chỉ khoản đang chờ mentor. Gửi `note` (không bắt buộc) thì ghi chú vào lịch sử |
| `POST /school/expenses/:expenseId/reject` | Cán bộ của trường (mentor) | NT-ChiTietCLB | Bắt buộc gửi `note` |

## Luật server phải giữ

Phần này áp dụng cho cả server thật sau này, không chỉ bản khung.

**Điểm danh**
- Mã QR do server ký (HMAC-SHA256 với khóa `QR_SECRET`), đổi mỗi 30 giây, nhận thêm mã của bước 30 giây ngay trước đó.
- Khi quét, server kiểm tra theo thứ tự: buổi có thật, đang mở, mã còn hạn, người quét là thành viên, đã nhận lời mời, điện thoại chưa điểm danh cho người khác trong buổi này.
- `deviceId` do web tạo nên chỉ chặn được cách dùng thông thường. Người cố tình xóa dữ liệu trình duyệt vẫn điểm danh hộ được.
- Điểm danh tay ghi lại người làm, và làm được cả sau khi đóng điểm danh để sửa cho người có mặt mà chưa quét.

**Tiền**
- Tiền có trong sao kê là tiền đã vào tài khoản, nên luôn được ghi đủ vào sổ quỹ. Người đã đóng rồi thì phần tiền thêm ghi là "đóng thừa".
- Khoản thủ quỹ đã "Ghi nhận tay", khi gặp lại trong sao kê thì chỉ nối với dòng sao kê, không ghi lần hai.
- Chuyển hộ nhiều người thì tiền chia đều, phần lẻ tính vào người cuối.
- Dòng sao kê đã có ở lần tải trước không ghi lại.
- Sổ quỹ chỉ thêm bút toán, không sửa, không xóa.

**Duyệt chi**
- Không ai duyệt hay từ chối khoản do chính mình đề xuất.
- Khoản trên 2.000.000 ₫ sau khi ban điều hành duyệt phải chờ mentor.
- Từ chối phải có lý do. Duyệt thì ghi chú không bắt buộc; có ghi chú thì lưu vào lịch sử.
- Chỉ khoản đã duyệt mới ghi đã chi.

**Đơn xin vào**
- Đơn bị từ chối thì sinh viên gửi đơn mới được (chốt ngày 03/10/2026). Đơn đang chờ thì không gửi thêm.

**Dữ liệu cá nhân**
- Lời mời chỉ mở được bằng đúng tài khoản được mời. Hai ô đồng ý bắt buộc phải được chọn; server lưu phiên bản văn bản đồng ý và thời điểm.
- Phía trường chỉ nhận số tổng hợp, không nhận danh sách thành viên hay từng khoản đóng quỹ.
- Số tài khoản ngân hàng chỉ trả về 4 số cuối.

## Thử nhanh

```bash
cd server
npm install
npm run dev
```

Rồi gọi thử ở một cửa sổ khác:

```bash
curl http://localhost:4000/api/v1/clubs/cau-long-san-nha/dashboard -H "X-Demo-User: a001"
curl -X POST http://localhost:4000/api/v1/clubs/cau-long-san-nha/expenses -H "X-Demo-User: a005" -H "Content-Type: application/json" -d "{\"kind\":\"proposal\",\"title\":\"Mua nước\",\"amount\":120000}"
```

## Chưa chốt

- **Đăng nhập:** đã chốt cookie phiên và đăng nhập Google. Còn chốt: chỉ nhận email trường hay cả email cá nhân. Email trường bị thu hồi khi tốt nghiệp, nên liên quan tới bước chuyển quyền khi bàn giao. Phiên đang lưu trong bộ nhớ; chuyển vào cơ sở dữ liệu cùng lúc với dữ liệu.
- **Cơ sở dữ liệu:** PostgreSQL theo Checkpoint 1. Thiết kế bảng do Khoa chốt. Tầng cần thay là `server/src/store.ts` và các handler; hợp đồng API giữ nguyên.
- **Mã VietQR thật:** cần mã ngân hàng và số tài khoản đầy đủ của thủ quỹ, lưu ở server. Hiện API trả chuỗi giả và `qrIsDemo: true`.
- **Mẫu file sao kê:** phụ thuộc ngân hàng của CLB pilot, chưa biết. Có thể phải nhận cả file .xlsx.
- **Thành viên xem sổ quỹ (chỉ đọc):** hiện tên người đóng hay gộp theo ngày. Màn chưa vẽ nên chưa có API.
- **Ai duyệt khoản trên 2.000.000 ₫:** mentor chuyên môn hay mentor hành chính (`design/README.md` mục 9). Server đang cho mọi cán bộ của trường duyệt.
- **Ảnh chứng từ, ảnh biên lai:** lưu ở đâu; chỉ thủ quỹ và chủ nhiệm được xem.
- **Gửi email** khi có lời mời và khi có kết quả đơn: chưa có.
- **Xử lý yêu cầu xóa dữ liệu** trong 20 ngày và ẩn danh lịch sử đóng quỹ: chưa có API cho người xử lý.
- **Chưa có API vì màn chưa vẽ:** tạo và sửa sự kiện, nhập danh sách từ Excel, tạo CLB, sửa thông tin cá nhân, bàn giao bước 1, 2, 4, 5, 6.
- **Phân trang:** chưa cần với cỡ một CLB (42 thành viên trong dữ liệu mẫu). Thêm khi có CLB lớn.
- **Đổi API sau khi chốt:** sửa thẳng khi còn trong MVP, hay mở `/api/v2` cho thay đổi không tương thích.
