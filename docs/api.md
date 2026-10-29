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

- **Đăng nhập Google** (luồng mã có PKCE): web mở `GET /auth/google/start` kèm `?next=/trang-can-mo`, Google gọi lại `GET /auth/google/callback`, server cấp phiên rồi đưa trình duyệt về trang `next`. Lỗi thì về `/login?error=<mã>`, mã là một trong `google-disabled`, `cancelled`, `expired`, `google-failed`, `email-unverified` (`LoginErrorCode` trong `contract.ts`); web đổi mã thành câu có sẵn, mã lạ thì hiện một câu chung. Cần `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` trong `server/.env`; Authorized redirect URI trên Google Cloud là `<WEB_ORIGIN>/api/v1/auth/google/callback`.
- **Tên tài khoản và mật khẩu** (thêm ngày 05/10/2026, Hiệu duyệt): đăng ký là lần đầu đăng nhập Google. Lần đầu đó server chuyển về `/account?new=1&next=<trang cần mở>` để web hỏi đặt tên tài khoản và mật khẩu (có nút "Để sau"). Sau đó đăng nhập được bằng `POST /auth/login` (tên tài khoản hoặc email, kèm mật khẩu).
  - Tên tài khoản 3–30 ký tự: chữ không dấu, số, dấu chấm, gạch dưới; lưu chữ thường, không trùng. Mật khẩu ít nhất 10 ký tự, có chữ hoa, chữ số, ký tự đặc biệt, không chứa tên tài khoản hay phần trước @ của email. Luật ở `web/src/lib/account.ts`.
  - Mật khẩu băm bằng scrypt (N = 2^17, r = 8, p = 1), salt ngẫu nhiên riêng; bảng `accounts` chỉ có mã băm. API không bao giờ trả mật khẩu hay mã băm; `GET /me` chỉ có `account: { username?, hasPassword }`.
  - Sai mật khẩu 5 lần liền thì khóa đăng nhập bằng mật khẩu 15 phút (429 `TOO_MANY_ATTEMPTS`); đăng nhập Google vẫn dùng được. Sai tên hay sai mật khẩu đều cùng một câu báo.
  - Quên mật khẩu: đăng nhập Google, trong 15 phút sau đó `PUT /me/account` đặt mật khẩu mới không cần mật khẩu cũ. Ngoài khoảng đó, đổi mật khẩu phải gửi `currentPassword`.
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
| TOO_MANY_ATTEMPTS | 429 | Nhập sai mật khẩu 5 lần liền, tạm khóa đăng nhập bằng mật khẩu 15 phút; `details.until` là giờ hết khóa |
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
| Đăng tin của CLB lên Cộng đồng | Chủ nhiệm, phó chủ nhiệm, trưởng ban (chờ cán bộ trường duyệt mới hiện) |
| Duyệt, từ chối tin của CLB | Cán bộ của trường |
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
| `POST /auth/login` | Ai cũng gọi được | Trang đăng nhập | Gửi `login` (tên tài khoản hoặc email) và `password`; đúng thì cấp phiên, trả về giống `GET /me`. Sai: 401, cùng một câu cho mọi trường hợp. Sai 5 lần: 429 `TOO_MANY_ATTEMPTS`, `details.until` |
| `POST /auth/logout` | Người đã đăng nhập | Mọi màn | Xóa phiên và cookie phiên |

### Thành viên (điện thoại)

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /me` | Người đã đăng nhập | Mọi màn | Thông tin của mình và các CLB đang ở. Lời mời chưa nhận có `inviteCode`. `account`: tên tài khoản đã đặt, đã có mật khẩu chưa |
| `PUT /me/account` | Người đã đăng nhập | Đặt tên tài khoản và mật khẩu | Gửi `name` (tên hiển thị), `username`, `password`, và `currentPassword` khi đã có mật khẩu (trừ khi vừa đăng nhập Google). Lỗi từng ô ở `details.fields`. Tên tài khoản đã có người dùng: 409 |
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
Từ 22/10/2026 bàn giao có **7 bước**: 1 chọn ban mới, 2 chốt số dư, 3 kiểm tra kho bàn giao, 4 đổi tài khoản nhận quỹ, 5 chuyển quyền quản trị, 6 ban mới xác nhận, 7 biên bản. Mỗi thao tác chỉ làm được khi bàn giao đang đúng ở bước của nó (không thì 409), làm xong sang bước kế và ghi một dòng vào biên bản (`history`). Dữ liệu cũ ở bước 3 trở đi được dời xuống một bước (`db/migrations/005_handover_steps.sql`).

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/handover` | Ban điều hành, hoặc người được chọn làm chủ nhiệm mới ở bước 1 | BDH-BanGiao | Bước hiện tại, số dư đã chốt và hiện tại, ban mới, việc còn dở (`open`), tóm tắt kho (`kit`), các tài khoản của kho (`accounts`), tài khoản nhận quỹ cũ và mới (chỉ 4 số cuối), biên bản (`history`), `canAccept` |
| `PUT /clubs/:clubId/handover/board` | Chủ nhiệm | BDH-BanGiao | Bước 1: `presidentId`, `viceId`, `treasurerId`, `headIds`. Chỉ người đã nhận lời mời, mỗi người một vai. Chủ nhiệm hiện tại chọn lại chính mình thì phải gửi `confirmSelf: true` |
| `POST /clubs/:clubId/handover/lock-balance` | Chủ nhiệm | BDH-BanGiao | Bước 2: chốt số dư bằng số dư sổ quỹ lúc bấm. Muốn chốt lại thì quay lại bước 2 |
| `POST /clubs/:clubId/handover/kit-review` | Chủ nhiệm | BDH-BanGiao | Bước 3: đã xem kho bàn giao. Không chặn khi kho còn thiếu; số mục thiếu ghi vào biên bản |
| `PUT /clubs/:clubId/handover/receiver` | Chủ nhiệm | BDH-BanGiao | Bước 4: `personId`, `bank`, `account` (chỉ chữ số), `transferRef`. Lưu xong sang bước 5 |
| `POST /clubs/:clubId/handover/accounts/:itemId/transfer` | Chủ nhiệm | BDH-BanGiao | Bước 5, từng dòng: `holderId` là người nhận quyền quản trị của tài khoản trong kho. Đổi quyền thật làm ở chính dịch vụ; ở đây chỉ ghi lại |
| `POST /clubs/:clubId/handover/transfer-done` | Chủ nhiệm | BDH-BanGiao | Hết bước 5. 409 khi còn tài khoản "bắt buộc chuyển khi bàn giao" chưa chuyển |
| `POST /clubs/:clubId/handover/accept` | Chủ nhiệm mới (người được chọn ở bước 1) | BDH-BanGiao | Bước 6: người khác gọi thì 403. Xong thì sang bước 7 và biên bản không sửa được nữa |
| `PUT /clubs/:clubId/handover/step` | Chủ nhiệm | BDH-BanGiao | Chỉ quay lại bước trước, và chỉ khi ban mới chưa xác nhận |
| `PUT /clubs/:clubId/handover/summary` | Chủ nhiệm | BDH-BanGiao | Lưu bản tóm tắt cho ban mới (`text`, đã được người duyệt sửa) vào biên bản; ghi ai lưu, lúc nào. 409 khi ban mới đã xác nhận |

### Trợ lý bàn giao (bản mẫu)

Thêm ngày 22/10/2026 (mô tả ở `docs/tien-do-mvp.md`, phần B, mục 5.5). **Không phải chatbot chung**: chỉ hai việc gắn với bàn giao, tóm tắt và hỏi đáp trong Kho bàn giao. Cấu hình `AI_MODE=mock|real` trong `server/.env` (mặc định `mock`). Bản mẫu **tính từ dữ liệu của CLB**, không gọi dịch vụ AI nào; `real` chưa nối nên trả 501 `NOT_IMPLEMENTED`. Mọi kết quả có `mode` để màn ghi rõ "Bản mẫu, chưa dùng AI thật". Trợ lý không tự gửi cho ai và không tự đổi dữ liệu.

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/ai` | Thành viên đã nhận lời mời | Trợ lý bàn giao | `mode` và `usage` (số lượt đã hỏi và đã tóm tắt trong kỳ; `limit` chỉ có khi đã đặt `AI_FREE_ASKS_PER_TERM`) |
| `POST /clubs/:clubId/ai/summary` | Ban điều hành | Trợ lý bàn giao | Bản nháp tóm tắt cho ban mới: việc còn dở, hạn sắp tới, kho còn thiếu, tài khoản chưa chuyển, ai hỏi lại. Không lưu gì; lưu vào biên bản bằng `PUT /clubs/:clubId/handover/summary` |
| `POST /clubs/:clubId/ai/ask` | Thành viên đã nhận lời mời | Trợ lý bàn giao | `question`. Chỉ trả lời từ nội dung kho mà người hỏi được thấy và luôn kèm `sources` (mục để mở). Không có trong kho thì `found: false`, "Không tìm thấy trong kho bàn giao." Thành viên thường không nhận gì từ phần tài khoản. Câu hỏi về tiền, sổ quỹ, mật khẩu, dữ liệu cá nhân thì từ chối. Mỗi lần hỏi tính một lượt; có `AI_FREE_ASKS_PER_TERM` thì hết lượt trả 409 |

### Cộng đồng: tin của CLB (duyệt trước, hiện sau)

Chỉ tin đã được cán bộ trường duyệt mới hiện cho mọi người. Tin mới luôn ở trạng thái `pending`; người đăng thấy tin của mình (web hiện mờ), ban điều hành CLB đó thấy ở Bảng tin của CLB, cán bộ trường thấy ở hàng chờ. Người đăng không được nêu tên ở Cộng đồng chung (`author` chỉ có ở màn của ban điều hành và của cán bộ trường).

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /feed` | Người đã đăng nhập | Cộng đồng | Mọi tin đã duyệt, cộng tin `pending` hoặc `rejected` của chính người xem; mới nhất trước. Tin bị từ chối kèm `rejectReason` |
| `GET /posts/:postId` | Người đã đăng nhập | Cộng đồng | Tin chưa duyệt chỉ người đăng, ban điều hành CLB đó và cán bộ trường xem được; người khác nhận 404 (không lộ là có tin) |
| `GET /clubs/:clubId/posts` | Ban điều hành | Bảng tin của CLB | Mọi trạng thái, mới nhất trước, kèm `author`, `reviewedBy`, `reviewedAt` |
| `POST /clubs/:clubId/posts` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Bảng tin của CLB | `kind` (`event`, `promo`, `news`), `title` (1–120), `body` (1–2000); `eventAt` bắt buộc khi `event`, `place` (tối đa 120) chỉ khi `event`. Tin luôn vào `pending`. Quyền khác thì 403 |
| `PUT /clubs/:clubId/posts/:postId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Bảng tin của CLB | Sửa tin bị từ chối rồi gửi lại: cùng dữ liệu như đăng tin. Tin quay về `pending`, xóa lý do và người duyệt cũ, tính lại giờ gửi. Tin không bị từ chối thì 409 |
| `GET /school/posts` | Cán bộ của trường | Duyệt tin | `pending` (chờ lâu nhất trước) và `reviewed` (10 tin xem xét gần nhất) |
| `POST /school/posts/:postId/review` | Cán bộ của trường | Duyệt tin | `decision`: `approve` hoặc `reject`; từ chối thì bắt buộc `reason` (tối đa 300). Tin không còn `pending` thì 409 |

### Việc cần làm

Thêm ngày 22/10/2026 (bản vẽ chưa có; mô tả ở `docs/tien-do-mvp.md`, phần B, mục 5.3). Ban điều hành tạo, giao, sửa việc. Người được giao đổi được trạng thái việc của mình. Mọi đổi trạng thái lưu lịch sử (ai, lúc nào). Không có thông báo hay nhắc việc tự động.

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/tasks` | Ban điều hành | Việc cần làm | Hạn gần nhất trước; kèm danh sách người phụ trách, buổi và quy trình để chọn khi tạo việc |
| `POST /clubs/:clubId/tasks` | Ban điều hành | Việc cần làm | `title`, `assigneeId` (thành viên đã nhận lời mời), `due`, `eventId`, `processId` (không bắt buộc, của chính CLB) |
| `PUT /clubs/:clubId/tasks/:taskId` | Ban điều hành | Việc cần làm | Cùng dữ liệu như tạo. Đổi `assigneeId` là giao lại; lịch sử ghi "giao lại cho …" |
| `POST /clubs/:clubId/tasks/:taskId/status` | Ban điều hành, hoặc người được giao việc đó | Việc cần làm | `status`: `todo`, `doing`, `done`. Thành viên thường đổi việc của người khác thì 403 |
| `GET /me/tasks` | Người đã đăng nhập | Việc của tôi | Việc được giao cho mình ở mọi CLB đã nhận lời mời, hạn gần nhất trước |

### Kho bàn giao

Thêm ngày 22/10/2026 (bản vẽ chưa có; mô tả ở `docs/tien-do-mvp.md`, phần B, mục 5.2). Ba phần: biểu mẫu, quy trình, tài khoản và quyền truy cập. **Kho không lưu mật khẩu**: chỉ tên dịch vụ, đường link và người giữ quyền quản trị. Sửa: chủ nhiệm, phó chủ nhiệm, trưởng ban. Thành viên thường chỉ đọc được biểu mẫu và quy trình; phần tài khoản, số mục thiếu và danh sách người giữ chỉ ban điều hành nhận (`server/src/responses.ts`, hàm `kitRes`).

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /clubs/:clubId/handover-kit` | Thành viên đã nhận lời mời (thành viên thường không thấy tài khoản) | Kho bàn giao | `documents`, `processes`; ban điều hành nhận thêm `accounts`, `holders` và `summary` đủ (`accounts`, `missing`, `personal`). `missing`: tài khoản "bắt buộc chuyển khi bàn giao" mà chưa ghi người giữ |
| `POST /clubs/:clubId/handover-kit/documents` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | `name`, `category` (`permit`, `finance`, `media`, `other`), `link` (http hoặc https), `holderId` (thành viên của CLB) |
| `PUT /clubs/:clubId/handover-kit/documents/:itemId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | Cùng dữ liệu như thêm |
| `DELETE /clubs/:clubId/handover-kit/documents/:itemId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | Xóa biểu mẫu và gỡ nó khỏi các quy trình đang dùng |
| `POST /clubs/:clubId/handover-kit/processes` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | `name`, `steps` (1–20 bước, mỗi bước `text` và `who`), `leadDays` (0–365, không bắt buộc), `documentIds` (biểu mẫu của chính CLB) |
| `PUT /clubs/:clubId/handover-kit/processes/:itemId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | Cùng dữ liệu như thêm. Không gửi `leadDays` là bỏ hạn thường gặp |
| `DELETE /clubs/:clubId/handover-kit/processes/:itemId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | |
| `POST /clubs/:clubId/handover-kit/accounts` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | `service`, `label` (tên tài khoản hoặc link), `holderId` (không bắt buộc; bỏ trống là chưa ai nhận), `ownership` (`club` hoặc `personal`), `required` |
| `PUT /clubs/:clubId/handover-kit/accounts/:itemId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | Cùng dữ liệu như thêm. Không gửi `holderId` là bỏ người giữ |
| `DELETE /clubs/:clubId/handover-kit/accounts/:itemId` | Chủ nhiệm, phó chủ nhiệm, trưởng ban | Kho bàn giao | |

### Nhà trường

| API | Ai gọi | Màn | Ghi chú |
|---|---|---|---|
| `GET /school/clubs` | Cán bộ của trường | NT-TongQuan | Học kỳ đang xem (`term`). Mỗi CLB một dòng: thành viên, buổi có điểm danh, hoạt động gần nhất, có hoạt động trong 30 ngày không, dự trù, số khoản đang chờ mentor (`waitingMentor`) |
| `GET /school/clubs/:clubId` | Cán bộ của trường | NT-ChiTietCLB | Dự trù và đã chi theo hoạt động, sinh hoạt kỳ này, khoản chờ mentor, đề nghị hỗ trợ, bàn giao. Không có danh sách thành viên |
| `POST /school/clubs/:clubId/handover/confirm` | Cán bộ của trường (mentor) | NT-ChiTietCLB | Xác nhận biên bản bàn giao của CLB. Chỉ sau khi ban mới đã xác nhận nhận bàn giao (chưa thì 409), và chỉ một lần (xác nhận rồi thì 409). Ghi người xác nhận, lúc nào, vào lịch sử bàn giao |
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
