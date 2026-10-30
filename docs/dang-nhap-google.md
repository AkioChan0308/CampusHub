# Bật đăng nhập Google trên máy của bạn

Code đăng nhập Google **đã có sẵn** trong CampusHub (luồng mã có PKCE, ghép email với người trong dữ liệu mẫu). Repo **không có khóa Google**, nên mỗi người pull về phải tự tạo khóa của mình một lần (khoảng 10 phút, miễn phí) rồi điền vào `server/.env`. Chưa có khóa thì mọi thứ vẫn chạy: trang đăng nhập chỉ ẩn nút Google, còn 7 tài khoản mẫu dùng như bình thường.

Cách này chỉ chạy ở `http://localhost:3000` trên máy bạn. Chưa dùng cho bản đưa lên mạng.

## Trước khi bắt đầu

- Đã chạy được web và máy chủ theo mục "Chạy thử trên máy" của [README](../README.md): Node.js 22.12 trở lên, `npm install` và `npm run dev` ở cả `server/` và `web/`.
- Có một tài khoản Gmail (hoặc Google Workspace) để tạo khóa và để thử đăng nhập.
- Web phải chạy ở **cổng 3000**. Khóa Google ghi sẵn địa chỉ quay lại là `http://localhost:3000/...`; đổi cổng thì khóa không dùng được.

## Bước 1. Tạo khóa trên Google Cloud Console

Giao diện Google hay đổi tên mục và có thể hiện bằng ngôn ngữ khác. Các tên dưới đây là tiếng Anh; nếu thấy khác, tìm mục có ý nghĩa tương tự.

1. Mở https://console.cloud.google.com, đăng nhập bằng Gmail của bạn.
2. Bấm ô chọn project ở thanh trên cùng, rồi **New project**. Đặt tên (ví dụ `campushub-local`), **Create**, rồi chọn project đó.
3. Vào **APIs & Services**, rồi **OAuth consent screen** (giao diện mới tên là **Google Auth Platform**, bấm **Get started**).
   - **App information:** App name `CampusHub`, User support email chọn Gmail của bạn.
   - **Audience** (đối tượng): chọn **External**.
   - **Contact information:** điền email của bạn.
   - Tick đồng ý chính sách dữ liệu người dùng của Google API, rồi **Continue** và **Create**.
4. Vào **Audience** (hoặc mục **Test users** ở giao diện cũ):
   - Kiểm tra Publishing status là **Testing**. **Đừng bấm Publish**: chế độ Testing đủ dùng và không cần Google duyệt.
   - Mục **Test users**, bấm **Add users**, nhập các Gmail sẽ đăng nhập thử (của bạn và của bạn bè cùng thử), rồi **Save**. Tối đa 100 người. **Gmail không nằm trong danh sách này sẽ bị Google chặn.**
5. Vào **Clients**, bấm **Create client** (giao diện cũ: **Credentials**, **Create credentials**, **OAuth client ID**).
   - **Application type:** **Web application**. Name: `CampusHub local`.
   - **Không tick** ô "Use this client for an AI-powered agent" (nếu có). Ô đó dành cho AI agent, không phải đăng nhập thường.
   - **Authorized JavaScript origins:** để trống.
   - **Authorized redirect URIs:** bấm **Add URI** và dán đúng một dòng, không thừa dấu cách hay dấu `/` cuối:

     ```
     http://localhost:3000/api/v1/auth/google/callback
     ```

   - Bấm **Create**.
6. Hộp thoại hiện **Client ID** và **Client secret**. **Chép cả hai ngay**: Google chỉ cho xem secret một lần. Lỡ đóng thì mở client đó, tạo secret mới.

Thay đổi trên Google đôi khi mất vài phút (hiếm khi vài giờ) mới có hiệu lực. Nếu lần thử đầu báo `redirect_uri_mismatch` dù bạn điền đúng, đợi 5 đến 10 phút rồi thử lại.

## Bước 2. Điền vào `server/.env`

1. Chưa có file thì chép `server/.env.example` thành `server/.env` (Windows: `copy .env.example .env`). File `.env` đã bị `.gitignore` chặn, không đưa vào git.
2. Điền các dòng sau:

   ```
   GOOGLE_CLIENT_ID=<Client ID vừa chép>
   GOOGLE_CLIENT_SECRET=<Client secret vừa chép>
   WEB_ORIGIN=http://localhost:3000
   LOGIN_AS=<gmail-của-bạn>=a001
   ```

3. **Mỗi biến chỉ viết một dòng.** Nhiều email thì nối trên **cùng một dòng**, cách nhau bằng dấu phẩy (thay các email ví dụ `example.com` bằng Gmail thật của bạn):

   ```
   LOGIN_AS=ban@example.com=a001,banbe@example.com=a017
   ```

   Viết hai dòng `LOGIN_AS=` riêng thì chỉ dòng cuối có tác dụng, dòng trước bị bỏ qua.
4. **Khởi động lại máy chủ** (dừng `npm run dev` ở `server/` rồi chạy lại). Máy chủ chỉ đọc `.env` lúc khởi động; sửa xong không khởi động lại thì chưa có tác dụng.

### Ghép Gmail với một vai mẫu (`LOGIN_AS`)

`LOGIN_AS` ghép Gmail thật với một người trong dữ liệu mẫu, để đăng nhập Google là vào đúng vai đó. Mã người hay dùng:

| Mã | Vai | Tài khoản mẫu |
|---|---|---|
| `a001` | Chủ nhiệm CLB Cầu lông Sân Nhà (Phạm Quốc Bảo) | `quocbao` |
| `a002` | Thủ quỹ (Lê Thu Hà) | `thuha` |
| `a005` | Trưởng ban (Trần Gia Huy) | `giahuy` |
| `a017` | Thành viên, được chọn làm **chủ nhiệm mới** khi bàn giao (Nguyễn Minh Anh) | `minhanh` |
| `a022` | Thành viên mới được mời | `hoangnam` |
| `p-bao-chau` | Sinh viên chưa vào CLB | `baochau` |
| `p-thu-trang` | Ban quản lý CLB của trường (mentor) | `thutrang` |

Danh sách đầy đủ ở [docs/api.md](api.md). Lưu ý:

- Gmail ghép vào `a001` và tài khoản mẫu `quocbao` là **cùng một người** trong dữ liệu: thao tác ở bên nào cũng hiện ở bên kia. Lần đầu đăng nhập Google, web hỏi đặt tên tài khoản và mật khẩu; đặt thì sẽ thay thông tin đăng nhập của `quocbao` (bấm "Để sau" nếu muốn giữ mật khẩu mẫu).
- Muốn thử **bàn giao hai phía** thì cần hai Gmail: một ghép `a001` (chủ nhiệm cũ), một ghép `a017` (chủ nhiệm mới). Cả hai phải nằm trong Test users. Chỉ có một Gmail thì đăng nhập `minhanh` bằng tên tài khoản và mật khẩu mẫu ở cửa sổ ẩn danh.
- Gmail **không** có trong `LOGIN_AS` thì máy chủ tạo một tài khoản sinh viên mới, chưa ở CLB nào (luồng "đăng ký lần đầu").
- Đăng nhập Google tên hiển thị vẫn là tên trong dữ liệu mẫu (ví dụ "Phạm Quốc Bảo"), không phải tên Gmail.
- Giữ `AUTH_MODE=demo` nếu vẫn muốn bảng tài khoản mẫu ở trang đăng nhập. Đặt `AUTH_MODE=google` thì chỉ còn đăng nhập Google (khi đó cần `QR_SECRET`).

## Bước 3. Thử

1. Mở http://localhost:3000/login. Nút **Đăng nhập bằng Google** phải hiện ra. Không thấy nút thì xem bảng lỗi bên dưới.
2. Bấm nút, chọn Gmail đã thêm vào Test users, bấm cho phép.
3. Đúng thì bạn quay về web và vào trang theo vai đã ghép. Lần đầu có thể hiện màn hỏi đặt tên tài khoản và mật khẩu.

Kiểm tra nhanh không cần đăng nhập: `http://localhost:4000/api/v1/health` phải trả `"googleLogin":true`.

## Lỗi thường gặp

| Hiện ra | Nguyên nhân hay gặp | Cách xử lý |
|---|---|---|
| Nút Google không hiện, `/health` trả `googleLogin:false` | `GOOGLE_CLIENT_ID` hoặc `GOOGLE_CLIENT_SECRET` trống, hoặc chưa khởi động lại máy chủ | Điền đủ hai biến, khởi động lại `server/` |
| Google báo `redirect_uri_mismatch` | Dòng redirect trên Google Cloud khác dòng ở bước 1, hoặc web không chạy ở cổng 3000 | Sửa cho khớp từng ký tự; vừa sửa trên Google thì đợi vài phút |
| Google báo `access_denied` hoặc "app chưa được xác minh" | Gmail chưa nằm trong Test users | Thêm vào Audience, Test users, rồi thử lại |
| Về `/login?error=google-failed` | Sai Client secret | Dán lại secret; mất secret thì tạo secret mới |
| Về `/login?error=expired` | Để trang chọn tài khoản quá 10 phút rồi mới bấm cho phép | Bấm đăng nhập Google lại từ đầu |
| Về `/login?error=email-unverified` | Gmail chưa được Google xác minh | Dùng Gmail khác |
| Đăng nhập xong nhưng thành "sinh viên mới" thay vì vai mong muốn | Gmail chưa có trong `LOGIN_AS`, hoặc có hai dòng `LOGIN_AS` riêng, hoặc chưa khởi động lại sau khi sửa | Gộp thành một dòng, khởi động lại máy chủ |

## Làm việc nhóm và giữ bí mật

- **Client secret chỉ để trong `server/.env`.** Không dán vào nhóm chat, không commit, không chụp màn hình để lộ. Nếu lỡ lộ, vào Clients, mở client, thêm secret mới và xóa secret cũ.
- File `client_secret*.json` Google cho tải về đã bị `.gitignore` chặn. Tốt nhất vẫn để ngoài thư mục dự án.
- **Mỗi người tự tạo khóa riêng** là cách an toàn nhất: làm đủ bước 1 và 2 trên máy mình.
- Muốn dùng chung một khóa trong nhóm: người tạo khóa thêm Gmail của bạn mình vào Test users, rồi gửi `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` **qua tin nhắn riêng**. Redirect `localhost:3000` giống nhau trên mọi máy nên một khóa dùng được trên nhiều máy. Xong đợt thử nên tạo lại secret mới. Ai giữ khóa thì đăng nhập được vào mọi Gmail đã nằm trong Test users, nên chỉ chia sẻ cho người trong nhóm.
- Email thật chỉ ghi trong `.env`, không ghi vào file nào được commit (kể cả tài liệu và test).

## Dữ liệu và cơ sở dữ liệu

- Để trống `DATABASE_URL` thì dữ liệu nằm trong bộ nhớ: tắt máy chủ là mất, kể cả người được tạo khi đăng nhập Google lần đầu. Cách này an toàn nhất để thử.
- Đặt `DATABASE_URL` (PostgreSQL bằng Docker, xem [docs/postgresql.md](postgresql.md)) thì người đăng nhập Google lần đầu được lưu vào cơ sở dữ liệu đó. Chỉ trỏ vào cơ sở dữ liệu của chính bạn trên máy mình, không trỏ vào cơ sở dữ liệu dùng chung.

## Còn thiếu

- Chưa dùng được cho bản đưa lên mạng: cần địa chỉ HTTPS thật, thêm địa chỉ đó vào Authorized redirect URIs, đặt `WEB_ORIGIN` theo địa chỉ đó, và chuyển màn hình đồng ý sang trạng thái được Google duyệt nếu muốn người ngoài danh sách thử đăng nhập.
- Bản demo tĩnh trên GitHub Pages không có đăng nhập Google (chỉ tài khoản mẫu).
- Chưa gửi email (ví dụ mã OTP khi bàn giao); xem `docs/tien-do-mvp.md`.
