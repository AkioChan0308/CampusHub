# CampusHub web: bản demo giao diện MVP

Đây là bản giao diện (frontend) của MVP, làm theo 16 màn trong `../design/`. Mọi dữ liệu là dữ liệu mẫu tự đặt.

Bản MVP nối máy chủ `../server/`. Từ ngày 04/10/2026 cả 16 màn của bản vẽ, trang đăng nhập và các trang chặn đều lấy dữ liệu từ máy chủ và dùng giao diện "Lịch bloc" (Hiệu duyệt ngày 03/10/2026; luật ở `../DESIGN.md`, khác biệt với bản vẽ ở mục "Chỗ code khác bản vẽ"). Dữ liệu vẫn là dữ liệu mẫu, máy chủ giữ trong bộ nhớ.

## Chạy thử

Cần Node.js 22 trở lên. Next.js chỉ cần 20.9, nhưng lệnh `npm test` dùng `--experimental-strip-types` của Node 22.

Chạy máy chủ trước (cửa sổ dòng lệnh riêng): `cd server`, `npm install`, `npm run dev`. Web chuyển mọi đường dẫn `/api/v1/...` sang máy chủ ở http://localhost:4000 (đổi bằng biến `API_ORIGIN`, xem `next.config.ts`).

```bash
cd web
npm install
npm run dev          # mở http://localhost:3000
npm test             # test luật: đối soát, dự trù, quyền duyệt, điểm danh
npm run typecheck
npm run build        # build bản chạy thật; chạy bằng npm start
```

Trang đầu `/` là trang giới thiệu cho người chưa đăng nhập (có hai video demo); người đã đăng nhập mở `/` thì về thẳng trang của mình. Bản demo không còn trang chọn vai (bỏ ngày 05/10/2026). Trang /login có bảng tài khoản mẫu cho 7 vai (chủ nhiệm `quocbao`, thủ quỹ `thuha`, trưởng ban `giahuy`, thành viên `minhanh`, thành viên mới được mời `hoangnam`, sinh viên chưa vào CLB `baochau`, ban quản lý CLB của trường `thutrang`), mật khẩu chung `CauLong#2026`; bấm một dòng là điền sẵn (chỉ khi máy chủ chạy chế độ demo; danh sách ở `src/lib/demo-accounts.ts`). Dưới bảng là nút "Đặt lại dữ liệu mẫu": xóa mọi thay đổi, cả trên máy chủ lẫn trong trình duyệt, và tạo lại các tài khoản mẫu. Các luồng thử nhanh ở `../README.md`. Trang /login có ô tên tài khoản (hoặc email) và mật khẩu, và nút đăng nhập Google khi máy chủ đã có khóa Google (xem `../server/.env.example`).

## Màn trong bản vẽ ứng với đường dẫn nào

CLB mẫu có mã `cau-long-san-nha`.

| Màn | Đường dẫn |
|---|---|
| BDH-TrangChu | `/clubs/cau-long-san-nha` |
| BDH-ThanhVien | `/clubs/cau-long-san-nha/members` |
| BDH-QR | `/clubs/cau-long-san-nha/events/tuan-5/qr` |
| BDH-DotThu | `/clubs/cau-long-san-nha/collections/quy-fall-2026` |
| BDH-DoiSoat | `/clubs/cau-long-san-nha/reconcile` |
| BDH-DuyetChi | `/clubs/cau-long-san-nha/expenses` |
| BDH-DuTru | `/clubs/cau-long-san-nha/budget` |
| BDH-BanGiao | `/clubs/cau-long-san-nha/handover` |
| TV-LoiMoi | `/invite/moi-a022` |
| TV-DiemDanh | `/checkin?e=<buổi>&t=<mã 30 giây>` (link trong mã QR); điểm danh xong chuyển sang `/me/attendance?checkedIn=1` |
| TV-DongQuy | `/me/pay/quy-fall-2026` |
| TV-CuaToi | `/me` |
| SV-DanhSach | `/explore` |
| SV-DonXinVao | `/explore/cau-long-san-nha` |
| NT-TongQuan | `/school` |
| NT-ChiTietCLB | `/school/clubs/cau-long-san-nha` |

Màn chưa có bản vẽ (mô tả được Hiệu duyệt ngày 04/10/2026):

| Màn | Đường dẫn |
|---|---|
| Tạo CLB mới | `/clubs/new` |
| Thêm thành viên (nhập Excel, gõ tay) | `/clubs/cau-long-san-nha/members/add` |
| Các buổi (tạo, sửa, xóa buổi) | `/clubs/cau-long-san-nha/events` |
| Đợt thu: mở đợt đang dùng, hoặc mời tạo khi chưa có | `/clubs/cau-long-san-nha/collections` |
| Tạo đợt thu | `/clubs/cau-long-san-nha/collections/new` |

Màn chưa có bản vẽ, mô tả được Hiệu duyệt ngày 05/10/2026:

| Màn | Đường dẫn |
|---|---|
| Trang đầu (giới thiệu, hai video demo) | `/` |
| Đăng nhập (tên tài khoản hoặc email và mật khẩu, hoặc Google) | `/login` |
| Đăng ký (chỉ bằng Google) | `/register` |
| Đặt tên tài khoản và mật khẩu | `/account` (`?new=1` ngay sau lần đầu đăng ký, `?reset=1` sau "Quên mật khẩu") |

Mở thẳng đường dẫn mà chưa đăng nhập thì trang chuyển sang `/login?next=<đường dẫn>`, đăng nhập xong quay lại đúng trang đó. Sai vai (ví dụ thành viên mở trang ban điều hành, sinh viên mở trang nhà trường) thì máy chủ trả 403 và trang hiện trang chặn.

## Cấu trúc thư mục

Bản đầy đủ, kèm "muốn sửa gì thì mở file nào": `../docs/cay-thu-muc.md`.

Trang web nằm trong `src/app`, chia theo người dùng bằng thư mục trong ngoặc (route group của Next.js). Thư mục trong ngoặc không có trong đường dẫn web: `src/app/(member)/me/page.tsx` vẫn là trang `/me`.

```
src/app/
  layout.tsx, error.tsx, not-found.tsx   khung chung của mọi trang, trang lỗi, trang không tìm thấy
  lich.css               hệ thiết kế "Lịch bloc": màu, chữ, nút, khung xương, chuyển động (biến màu ở :root, kiểu của màn dưới lớp .lich)
  globals.css            nạp Tailwind v4; quy tắc nền cho thẻ HTML; biến theme của shadcn/ui nối vào biến của lich.css
  (landing)/             trang đầu / cho người chưa đăng nhập; demo-video.tsx: video demo và các bước; video-steps.json: giây bắt đầu từng bước
  (auth)/                đăng nhập /login, đăng ký /register, đặt tên tài khoản và mật khẩu /account; login/auth-screen.tsx: khung chung của đăng nhập và đăng ký
  (club-admin)/          ban điều hành CLB, dùng laptop: /clubs/[clubId]/... (trang chủ, thành viên, buổi, chiếu QR, đợt thu, đối soát, duyệt chi, dự trù, bàn giao);
                         collections/collection-shared.tsx: khung xương, dải chọn đợt thu, hộp sửa đợt thu
  (member)/              thành viên, dùng điện thoại: /me (Của tôi, tab Điểm danh, tab Quỹ), /invite/[code] (lời mời), /checkin (quét mã điểm danh);
                         me/pay/pay-skeleton.tsx: khung xương dùng chung của tab Quỹ
  (student)/             sinh viên chưa vào CLB, dùng điện thoại: /explore (tìm CLB, gửi đơn), /clubs/new (tạo CLB mới, ai đã đăng nhập cũng tạo được);
                         explore/application-status.tsx: nhãn quan hệ của sinh viên với một CLB
  (school-staff)/        ban quản lý CLB của trường, dùng laptop: /school
src/proxy.ts             chạy trước khi vẽ trang: ai đã có cookie phiên mà mở / thì chuyển về trang của mình
src/api/                 gọi máy chủ: client.ts (fetch, ApiError, vai riêng theo tab của bản demo), queries.ts (truy vấn và khóa lưu tạm),
                         excel-rows.ts (các bảng xuất Excel), after-login.ts (trang mở sau khi đăng nhập, theo vai)
src/components/lich/     thành phần của Lịch bloc: tờ lịch (Leaf), khung laptop (BoardFrame, SchoolFrame), khung điện thoại (PhoneFrame),
                         trang chặn và lỗi API (Gate, NoClub), đầu trang và bảng (PageTop), hộp hỏi lại (Confirm), nhãn đóng quỹ (PayTag),
                         chuyển động và khung xương (motion.tsx)
src/components/          icon, mã QR, nút sao chép, appUrl (url.ts), MotionProvider (chuyển động dùng chung),
                         money-input.ts (đọc số tiền gõ tay)
src/components/ui/       component của shadcn/ui: sonner (thông báo ngắn). Thêm bằng npx shadcn add thì ra màu Lịch bloc
src/lib/                 dữ liệu và luật nghiệp vụ, không dính tới giao diện (máy chủ dùng lại qua server/src/domain.ts)
  types.ts               kiểu dữ liệu
  seed.ts                dữ liệu mẫu, số khớp design/README.md mục 8
  selectors.ts           tính số (số dư, đợt thu, dự trù) và quyền theo vai
  actions.ts             thao tác đổi dữ liệu: duyệt đơn, điểm danh, ghi tiền, duyệt chi...
  reconcile.ts           luật đối soát sao kê, đọc ngày và số tiền trong file sao kê
  account.ts             luật tên tài khoản và mật khẩu; demo-accounts.ts: tài khoản mẫu của bản demo
  browser-state.tsx      phần chỉ chạy trên trình duyệt: vai đang chọn, mã thiết bị (điểm danh), đặt lại dữ liệu mẫu
  *.test.ts              test, chạy bằng npm test
public/video/            hai video demo của trang đầu và ảnh đầu video, quay bằng e2e/record-demo-videos.cjs
e2e/                     script bấm thử bằng Playwright (npm run e2e), xem e2e/README.md
```

Chữ trên giao diện viết thẳng trong từng trang, không qua file dịch.

## Dữ liệu và vai trong bản demo

- Dữ liệu nằm ở máy chủ: trong PostgreSQL khi `server/.env` có `DATABASE_URL` (`../docs/postgresql.md`), không thì trong bộ nhớ. Lần đầu máy chủ nạp từ `src/lib/seed.ts`. Nút "Đặt lại dữ liệu mẫu" ở trang chọn vai gọi máy chủ nạp lại.
- Đăng nhập bằng tài khoản mẫu ở trang /login (cookie phiên). Tab chiếu QR mà mở thêm tab "thử điểm danh với vai" thì tab mới gọi API bằng vai đó (header `X-Demo-User`, lưu trong `sessionStorage` của tab), nên tab chiếu vẫn là của chủ nhiệm.
- Mỗi trình duyệt có một mã thiết bị (`localStorage`), gửi kèm khi quét mã, để thử luật "mỗi điện thoại chỉ điểm danh cho một người trong một buổi".
- Trình duyệt vẫn giữ một bản dữ liệu mẫu trong `localStorage` (khóa `campushub-demo-state`) (trước dùng cho trang chọn vai, đã bỏ). Việc gọn phần này (chỉ giữ vai và mã thiết bị) để làm sau.

## Phần chỉ có ở bản demo, phải thay khi có máy chủ

- **Đăng nhập:** máy chủ có đăng nhập Google và phiên bằng cookie. Từ 05/10/2026 có thêm đăng nhập bằng tên tài khoản (hoặc email) và mật khẩu. Ở chế độ demo, trang /login liệt kê tài khoản mẫu của 7 vai (máy chủ tự tạo lúc khởi động và mỗi lần đặt lại dữ liệu mẫu). API đăng nhập nhanh `POST /auth/dev-login` vẫn còn cho script bấm thử, giao diện không dùng nữa. Chế độ Google (`AUTH_MODE=google`) thì không có bảng tài khoản mẫu.
- **Mã QR điểm danh:** máy chủ ký mã và kiểm tra hạn (từ ngày 04/10/2026). Ô "thử điểm danh với vai" dưới mã chỉ có ở bản demo.
- **Mã QR đóng quỹ:** cố ý **không** theo chuẩn VietQR. Quét mã không chuyển được tiền, dưới mã ghi "Bản demo: mã này không chuyển tiền được."
- **Quyền theo vai:** máy chủ kiểm tra ở mọi API (`../server/src/access.ts`). Giao diện chỉ ẩn hay khóa nút cho dễ hiểu.
- **Xuất Excel:** ra file CSV, mở được bằng Excel. Mẫu dự trù của trường chưa có.
- **Chưa có:** tải ảnh chứng từ, ảnh biên lai; gửi email (link mời gửi tay qua Zalo); bàn giao bước 4–6; trang chính sách dữ liệu; sổ quỹ chỉ đọc cho thành viên. Nút nào chưa làm thì xám: bấm vào thì hiện thông báo "Bản demo chưa có phần này" (hoặc lý do riêng, ví dụ "Bản demo chưa gửi tin nhắn được."), hoặc bên cạnh có chữ "chưa có".

## File sao kê (CSV)

- 4 cột theo thứ tự: ngày, số tiền, người chuyển, nội dung chuyển khoản. Màn đối soát có nút "Tải file CSV mẫu".
- Ngày dạng `dd/mm/yyyy`, có thể kèm giờ `hh:mm` hoặc `hh:mm:ss`, dùng `/` hoặc `-`. Dòng nào cột đầu không phải ngày (như dòng tiêu đề) thì bỏ qua.
- Số tiền: `100.000`, `100,000`, `100,000.00` đều đọc là 100.000 ₫. Dòng tiền ra (số âm hoặc nằm trong ngoặc) bị bỏ qua, vì đối soát chỉ xét tiền vào.
- Cột ngăn cách bằng dấu phẩy hoặc chấm phẩy; code tự nhận theo dòng đầu.
- Giao dịch đã có ở lần tải trước thì không ghi lần nữa.
- Mỗi ngân hàng xuất sao kê một kiểu, và chưa biết CLB pilot dùng ngân hàng nào (design/README.md mục 9). Khi biết thì viết thêm phần đọc cho đúng ngân hàng đó.

## Chỗ code khác bản vẽ, hoặc bản vẽ chưa có

Bản vẽ đã được duyệt ngày 02/10/2026. Những chỗ dưới đây do code thêm vào, cần design lead xem lại.

**Sửa cả bản vẽ lẫn code**
- Công thức dự trù: bản vẽ cũ trừ tổng dự trù, nên trừ hai lần 800.000 ₫ đã chi. Giờ chỉ trừ phần dự trù chưa chi; dữ liệu mẫu ra +170.000 ₫, không còn −630.000 ₫. Bản vẽ và `design/README.md` đã sửa theo.

**Luật tiền bản vẽ chưa nói tới** (code tự đặt để sổ quỹ luôn khớp ngân hàng)
- Tiền có trong sao kê luôn được ghi đủ vào sổ quỹ. Người đã đóng rồi mà có thêm tiền (ví dụ đã đóng tiền mặt, rồi bạn chuyển hộ) thì phần đó ghi là "đóng thừa". Màn đối soát ghi "(đã đóng, ghi là đóng thừa)" cạnh tên. Luồng hoàn tiền chưa vẽ.
- Khoản thủ quỹ đã bấm "Ghi nhận tay", khi gặp lại trong sao kê thì chỉ nối với dòng sao kê, không ghi lần hai. Màn đối soát ghi "(đã ghi nhận tay)".
- Tiền chuyển hộ chia đều cho số người, phần lẻ tính vào người cuối.

**Trạng thái bản vẽ chưa có** (xem design/README.md mục 7)
- Lỗi khi quét QR, 7 trường hợp: buổi chưa mở điểm danh, đã đóng, mã sai, mã hết hạn, người quét chưa là thành viên, chưa nhận lời mời, điện thoại đã điểm danh cho người khác.
- Danh sách rỗng và trang "Không tìm thấy" ở các màn.
- Hộp hỏi lại (`LichConfirm`, dựng trên AlertDialog của Radix, thay cho hộp confirm của trình duyệt) trước khi: ghi nhận tay, ghi tiền mặt, ghi đã chi, từ chối đơn, đóng điểm danh, rút đồng ý, xóa dữ liệu, đặt lại dữ liệu mẫu. Nút "Hủy" nhận focus trước; nút xác nhận ghi "Ghi vào sổ", "Từ chối đơn", "Xác nhận đóng", "Rút đồng ý", "Rời CLB và xóa", "Đặt lại".
- Form đề xuất chi mới, form thêm hoạt động dự trù, ô lý do khi từ chối khoản chi.
- Trạng thái sau khi bấm: khoản chi "Đã duyệt · chờ chi" có nút "Ghi đã chi vào sổ quỹ"; dự trù "Đã gửi · Gửi lại cho mentor"; bàn giao "Đã lưu tài khoản nhận quỹ mới".
- Bàn giao bước 4–6 dừng ở dòng "Màn của bước này chưa có trong bản vẽ".
- Lời mời đã từ chối, hoặc link mời không còn dùng được. Đơn xin vào đang chờ, bị từ chối, CLB tạm ngưng nhận đơn, người đã ở trong CLB.
- Báo thiếu quyền: nút bị khóa, lý do ghi thành một dòng chữ dưới đầu trang và nối với nút bằng aria-describedby (ví dụ trưởng ban không ghi tiền được); trang chặn khi vào sai vai (thành viên vào trang ban điều hành, sinh viên vào trang nhà trường).
- Màn đối soát: nhãn "file trước" cho giao dịch còn treo từ lần tải trước, nút "Tải file CSV mẫu", báo lỗi khi file không đọc được.

**Thêm trong đợt dọn giao diện 03/10/2026** (chờ Hiệu duyệt)
- Tên tab theo từng màn, lấy từ thẻ <title> của bản vẽ. Màn đóng quỹ ghi "Đóng quỹ" (bỏ chữ VietQR vì mã của bản demo không phải VietQR thật); /checkin ghi "Quét mã điểm danh"; /me/attendance ghi "Điểm danh".
- Trang "Không tìm thấy trang" và "Trang bị lỗi khi mở", dùng lớp của trang chặn. Từ 05/10/2026 dùng trang chặn của Lịch bloc, mở bằng tờ lịch hôm nay.
- Nút sao chép giữ nguyên chữ; kết quả báo bằng thông báo ngắn (Sonner): trên điện thoại ở giữa phía trên màn, trên laptop (rộng từ 1024px) ở góc dưới bên phải để không che tiêu đề trang (đổi ngày 03/10/2026). Chép xong, biểu tượng của nút thành dấu tích trong 1,5 giây.
- TV-DongQuy: khung mã QR 164px như bản vẽ (bản thử "Lịch bloc" dùng 160px); dòng "Số tiền còn thiếu" chỉ hiện khi đã đóng một phần; sau khi bấm "Mình đã chuyển khoản" hiện nhãn "Chờ thủ quỹ xác nhận" và dòng giờ báo, hiện dần trong 200 ms.
- Header thành viên và sidebar ban điều hành chưa có nút đổi CLB như bản vẽ, vì luồng đổi CLB chưa vẽ.
- "Tạo link mời" chép link trang CLB /explore/<mã CLB>; người nhận gửi đơn rồi chờ duyệt, không vào màn TV-LoiMoi.
- File "Tải dữ liệu của tôi (Excel)" có các mục đã đồng ý và ngày đồng ý; trang Của tôi chưa hiện danh sách này.
- Thông báo ngắn (Sonner) sau khi: duyệt, từ chối đơn; ghi tiền; trường duyệt hay từ chối khoản chi; rút đồng ý; gửi yêu cầu xóa; tải dữ liệu của tôi; tham gia CLB; thêm hoạt động dự trù; đặt lại dữ liệu mẫu. Trong trình duyệt của Zalo, Messenger, nút tải dữ liệu báo "Mở trang bằng Chrome hoặc Safari để tải file."
- Chuyển động 200 ms, chỉ ở chỗ vừa đổi: "Đã điểm danh" ở TV-DiemDanh; thẻ trạng thái sau khi gửi đơn ở SV-DonXinVao; nhãn trạng thái ở Duyệt chi và Đợt thu khi vừa bấm; thẻ khoản chờ duyệt ở trang của trường thu lại sau khi duyệt.
- TV-DiemDanh khi không vừa quét mã (chưa có bản vẽ, đã duyệt ngày 03/10/2026): tiêu đề "Lịch sử điểm danh", thẻ kỳ và danh sách các buổi; "Có mặt 07:49", điểm danh tay thì thêm nhãn "Điểm danh tay". Vắng từ 3 buổi thì câu gộp ngắn: "Vắng 3 buổi: tuần 2, 5, 6."
- Duyệt chi: đang xem khoản nào thì duyệt xong vẫn xem khoản đó, tab đi theo trạng thái mới. Lịch sử không có dòng "Đã báo cho …" như bản vẽ, vì bản demo chưa gửi thông báo.
- Đối soát: dòng mô tả file giữ giờ tải lên, thay cho "mẫu sao kê: [ngân hàng của CLB]" của bản vẽ (bản demo chỉ đọc một mẫu CSV). Giao dịch trùng với lần tải trước đếm riêng, không cộng vào ô "không thuộc đợt thu". File CSV mẫu lấy người chưa đóng trong dữ liệu. Bấm "Ghi nhận" khi chưa chọn người thì báo "Chọn thành viên trước."
- Danh sách CLB và trang CLB: người được mời mà chưa nhận thấy nhãn "Chưa nhận lời mời" và nút "Xem lời mời"; đơn bị từ chối có nhãn "Đơn bị từ chối". Ô "Năm học" có dòng "Chọn năm học" khi chưa biết năm học của người gửi.
- Trang chặn ở màn điện thoại vẽ trong khung điện thoại. Trang chặn của Chiếu QR và Đợt thu có thêm nút "Về trang chủ CLB".
- Bàn giao: nút "Ảnh biên lai" (khóa) cạnh ô mã giao dịch như bản vẽ. Màn laptop hẹp hơn 1400px thì cột phải hẹp lại; hẹp hơn 1200px thì hai thẻ bên phải xuống dưới.

**Thế giới "Lịch bloc"** (thử trên BDH-TrangChu và TV-DongQuy, Hiệu duyệt ngày 03/10/2026; đang chuyển các màn còn lại theo từng nhóm 3–4 màn, mỗi nhóm dừng cho Hiệu duyệt)
- Ý chính: CLB sống theo lịch. Mỗi màn mở bằng tờ lịch hôm nay; mỗi hạn chót là một tờ lịch nhỏ đếm ngày. Hợp đồng hướng thiết kế: `../.impeccable/surfaces/web-src-app-clubs-clubid-page-tsx.md`.
- Màu, chữ, nút riêng trong `src/app/lich.css`. Lúc đầu chỉ áp trong lớp `.lich`, để các màn chưa chuyển giữ `design/ui.css`; ngày 05/10/2026 hệ cũ bỏ hẳn, biến màu chuyển lên `:root`. Chữ Barlow, số Barlow Condensed (thay Be Vietnam Pro và Montserrat ở hai màn này), mã chuyển khoản vẫn JetBrains Mono. Đỏ chỉ dùng cho tờ lịch hôm nay và hạn còn từ 3 ngày trở xuống; xanh mực cho nút. Không bóng đổ, chia khối bằng nét 1px.
- Thành phần mới: `src/components/lich/` gồm tờ lịch (`Leaf`), khung laptop (`BoardFrame`, gọi GET /clubs/:clubId/board), khung điện thoại (`PhoneFrame`), trang chặn và lỗi API (`Gate`).
- BDH-TrangChu: tờ lịch hôm nay thay ngày ở dòng phụ dưới tiêu đề; dòng phụ ghi "3 việc đang chờ bạn · học kỳ Fall 2026". Phần dưới là một tờ giấy chia hai cột bằng nét kẻ, thay cho bốn thẻ.
- "Cần bạn xử lý": số việc đứng riêng một ô chữ lớn bên trái, nên câu bỏ số ở đầu: "Đơn xin vào CLB đang chờ duyệt", "Khoản chi chờ duyệt · 650.000 ₫", "Giao dịch trong sao kê chưa khớp". Dòng dự trù thiếu tiền có biểu tượng cảnh báo thay cho số.
- "Sự kiện sắp tới": ô ngày thành tờ lịch nhỏ; buổi diễn ra hôm nay có tờ lịch đỏ, dòng dưới ghi "hôm nay".
- Đợt thu: bỏ nhãn "Đợt thu đang mở" phía trên tên đợt thu (tên đợt thu là tiêu đề). Hạn đóng là tờ lịch "còn 7 ngày" (đỏ khi còn từ 3 ngày trở xuống hoặc đã quá hạn, ghi "quá hạn N ngày"). Nút "Xem ai chưa đóng" chuyển từ góc trên xuống hàng nút dưới cùng, cạnh nút sao chép link.
- Sidebar: vai chỉ ghi trong ô CLB; dưới tên người là "Đăng xuất" (link "Đổi vai (bản demo)" đã bỏ ngày 05/10/2026 cùng trang chọn vai). Số đếm trên menu nền xám, không đỏ.
- TV-DongQuy: số tiền cỡ lớn, cạnh đó tờ lịch hạn đóng; nội dung chuyển khoản và nút sao chép nằm cùng một hàng; dòng phụ dưới số tiền ghi "Hạn đóng …", đóng một phần thì "Số tiền còn thiếu · bạn đã đóng …". Avatar trên header: chế độ demo mở trang chọn vai, bản thật mở "Của tôi".
- Trang /login (bản vẽ chưa có; làm lại ngày 05/10/2026 theo mô tả Hiệu duyệt): tờ lịch hôm nay, tiêu đề "Đăng nhập"; ô "Tên tài khoản hoặc email", ô "Mật khẩu", ô "Hiện mật khẩu" (không đánh dấu sẵn), nút "Đăng nhập"; dưới chữ "hoặc" là nút "Đăng nhập bằng Google" và dòng "Quên mật khẩu? Đặt lại bằng Google" (khi máy chủ có khóa Google); chân thẻ có "Chưa có tài khoản? Đăng ký bằng Google"; ở chế độ demo, giữa form và chân thẻ là bảng tài khoản mẫu (xem dưới). Sai tên hay sai mật khẩu đều cùng một câu, ô mật khẩu được xóa; sai 5 lần thì câu báo khóa có giờ thử lại. Lỗi từ Google hiện thành một dòng đỏ. Đã đăng nhập thì hiện tên, nút "Tiếp tục" và "Đăng xuất". Sau khi đăng nhập, người dùng về trang đang mở dở, nếu không thì về trang theo vai (ban điều hành: trang chủ CLB; thành viên: Của tôi; cán bộ trường: Các CLB; chưa vào CLB: Tìm CLB).
- Thẻ của /login, /register, /account neo phía trên màn (cách đỉnh khoảng 10% chiều cao màn) thay cho canh giữa theo chiều dọc (05/10/2026, sau vòng rà soát): lúc đang tải chưa biết có nút Google không, canh giữa thì cả thẻ bị đẩy lên khi phần dưới hiện ra. Khung xương của /login và /account khớp từng ô với lúc đã tải.
- Trang /register (bản vẽ chưa có, 05/10/2026): chỉ có nút "Đăng ký bằng Google", kèm câu vì sao dùng Google (email đã được xác minh) và "Nếu CLB đã mời bạn, dùng đúng email trong lời mời." Máy chủ chưa có khóa Google thì ghi "Đăng ký bằng Google chưa mở. Báo ban điều hành CLB."
- Trang /account "Đặt tên tài khoản và mật khẩu" (bản vẽ chưa có, 05/10/2026): tên hiển thị, email (chỉ xem), tên tài khoản (gợi ý sẵn phần trước @ của email nếu hợp lệ), mật khẩu hiện tại (khi đã có mật khẩu, trừ lúc vừa đặt lại bằng Google), mật khẩu, nhập lại, "Hiện mật khẩu". Luật kiểm tra ngay trên form (`src/lib/account.ts`), lỗi hiện dưới từng ô. Ngay sau lần đầu đăng ký có nút "Để sau"; mở từ Của tôi thì là "Hủy". Đã có mật khẩu thì tiêu đề là "Đổi tên tài khoản và mật khẩu".
- Của tôi (TV-CuaToi) có thêm mục "Đăng nhập" (05/10/2026, Hiệu duyệt): dòng "Tên tài khoản" (chưa đặt thì ghi "Chưa đặt · đăng nhập bằng Google") và dòng "Đặt tên tài khoản và mật khẩu" / "Đổi tên tài khoản và mật khẩu" mở /account.
- Trang đầu `/` (bản vẽ chưa có, 05/10/2026): thanh trên dính khi cuộn (Tìm CLB, Đăng nhập, Đăng ký); tờ lịch hôm nay và câu "Cả tuần của CLB, trên một cuốn lịch.", câu giới thiệu, nút "Đăng ký bằng Google" và "Đăng nhập". Bố cục xếp chồng như framer.com (Hiệu chọn): ngay dưới là khối "Thành viên điểm danh, đóng quỹ ngay trên điện thoại." với video điện thoại, cuộn xuống là khối "Ban điều hành lo việc cả nhiệm kỳ trên laptop." với video laptop. Không có nhãn nhỏ phía trên tiêu đề (luật đã chốt); người dùng của khối nằm ngay trong tiêu đề. Mỗi video có 5 bước; bước đang chạy đậm màu kèm thanh tiến độ, bấm một bước thì nhảy tới đoạn đó. Video tự chạy không tiếng khi cuộn tới, cuộn qua thì dừng, có nút dừng; máy bật giảm chuyển động thì đứng yên với nút "Phát video". Khi cuộn xuống, khối tiếp theo (phần đầu trang, hai khối video, dòng "không giữ tiền") trượt 72px từ bên trái vào và rõ dần; khối đã xem trượt sang phải và mờ đi (Hiệu yêu cầu, 05/10/2026, theo framer.com). Hiệu ứng đi theo vị trí cuộn, không theo thời gian, nên không áp luật 150–250 ms. Khối nằm sẵn trong màn hình lúc mở trang thì rõ ngay; khối chỉ mờ đi khi mép dưới đã lên quá 35% màn hình, nên phần đang đọc không mờ. Trang chặn tràn ngang bằng `overflow-x: clip`. Máy giảm chuyển động thì không có hiệu ứng này. Code: `ScrollFade` trong `src/app/(landing)/demo-video.tsx`. Cuối trang: dòng "CampusHub không giữ tiền…" và chân trang (nhóm NeedSleep, EXE101; dòng "Bản demo dùng dữ liệu mẫu." chỉ hiện ở chế độ demo). Link "Bản demo: đăng nhập bằng tài khoản mẫu" (tới /login) / "Tìm CLB của trường bạn" giữ chỗ mà chưa hiện tới khi biết máy chủ chạy chế độ nào, để chữ không đổi trước mắt người xem. Nút dừng video luôn hiện. Lỗi đăng nhập Google: máy chủ gửi mã (`?error=huy`…), trang đăng nhập đổi mã thành câu có sẵn; mã lạ thì hiện "Đăng nhập chưa xong. Bạn thử lại." Video quay từ bản demo bằng `e2e/record-demo-videos.cjs`, bắt đầu từ trang đăng nhập (Hiệu yêu cầu); trong video có con trỏ vẽ thêm và không có phần chỉ có ở bản demo. Khối điểm danh chạy thử trước đó đã bỏ theo góp ý của Hiệu (màn đó chỉ thấy sau khi đăng nhập).
- Chuyển động (thêm ngày 03/10/2026 theo góp ý của Hiệu: nút và chuyển trang còn thô, chuyển trang chớp):
  - Đang tải hiện khung xương đúng bố cục thay cho chữ "Đang tải…". Dữ liệu tới thì nội dung hiện dần trong 200 ms.
  - Chuyển trang mờ qua bằng View Transitions. Tờ lịch hôm nay dời thẳng từ trang đăng nhập sang trang chủ.
  - Nút lún nhẹ khi bấm. Đang gửi thì hiện vòng xoay mà vẫn giữ màu. Link vừa bấm mà trang chưa mở thì vòng xoay thế chỗ biểu tượng, kể cả mục menu.
  - Báo đã chuyển xong thì nút thu lại và nhãn trạng thái trượt vào. Chép nội dung thì biểu tượng thành dấu tích.
  - Đăng xuất thì sang trang đăng nhập rồi mới xóa dữ liệu đã lưu tạm, để không chớp trang "Bạn cần đăng nhập".
  - Máy bật giảm chuyển động thì tắt hết, chuyển trang chỉ còn mờ qua nhanh. Chi tiết ở `../DESIGN.md` mục Chuyển động.
- Nhóm luồng tiền (BDH-DotThu, BDH-DoiSoat, BDH-DuyetChi, BDH-DuTru, chuyển ngày 03/10/2026):
  - **Chung:**
    - Đầu trang có tờ lịch hôm nay cỡ vừa (`PageTop`), cùng tên chuyển cảnh với tờ lịch của trang chủ, nên khi chuyển trang tờ lịch dời và thu nhỏ lại.
    - Phần dưới là một tờ giấy chia bằng nét kẻ, thay cho nhiều thẻ.
    - Ô số liệu thành một dải chia bằng nét dọc.
    - Hộp hỏi lại theo kiểu Lịch bloc (`LichConfirm`).
    - Thông báo ngắn trên laptop ở góc dưới bên phải.
  - **Đợt thu:**
    - Dải số mở đầu bằng tờ lịch hạn đóng "còn N ngày". Bộ lọc thành các nút tròn; nút đang chọn nền mực đen.
    - Bảng xếp người báo đã chuyển lên đầu, rồi người chưa đóng, rồi người đã đóng; cùng nhóm thì theo mã. Máy chủ trả theo thứ tự này, giống bản demo trước.
    - Bản vẽ trộn hai dòng "Đã đóng" vào 7 dòng đầu. Còn trong bản này, 7 dòng đầu toàn người cần thủ quỹ xử lý, nên hai cột "Cách đóng", "Ngày ghi nhận" để "–". Xem người đã đóng thì bấm bộ lọc "Đã đóng".
  - **Đối soát:**
    - Ba ô kết quả ghi nhãn trước, số sau ("Cần bạn gán tay" rồi "4"), thay cho câu "4 cần bạn gán tay".
    - Tải file có dòng ngày không có thật thì ghi "Bỏ qua N dòng có ngày không có thật…". Máy chủ đếm và bỏ các dòng này.
    - Dòng đã gán chỉ hiện các dòng của file mới nhất (máy chủ trả như vậy). Bản trước còn hiện dòng của file trước vừa gán.
  - **Duyệt chi:**
    - Loại khoản ("Đề xuất chi · chi trước khi tiêu") đặt dưới tiêu đề thay cho nhãn nhỏ phía trên.
    - Khoản bị từ chối dùng nhãn xám "Đã từ chối", vì đỏ chỉ dành cho hôm nay và hạn gấp.
    - Ghi chú khi duyệt gửi lên máy chủ và vào lịch sử.
  - **Dự trù:** phép tính số dư là một dải năm ô có dấu + − = ở giữa; ô kết quả nền xám, thiếu tiền thì số màu cam. Form thêm hoạt động nằm trong tờ giấy, trên bảng.
- Nhóm 2 (BDH-ThanhVien, BDH-QR, BDH-BanGiao, TV-DiemDanh; chuyển ngày 04/10/2026):
  - **TV-DiemDanh làm cùng nhóm này** (theo kế hoạch thuộc nhóm màn thành viên): mã QR điểm danh giờ do máy chủ ký, màn quét mã cũ (kiểm mã trong trình duyệt) không đọc được nữa.
  - **Thành viên:** đơn xin vào là các dòng trên tờ giấy (tên, năm, ngày gửi; lý do; Từ chối/Duyệt). Duyệt hay từ chối xong thì dòng thu lại. Nhãn "Đang xử lý yêu cầu xóa" màu cam thay cho đỏ (đỏ chỉ dành cho hôm nay và hạn gấp). Nút "Xuất Excel" xuất cả danh sách từ máy chủ.
  - **Chiếu QR:**
    - Đầu màn có tờ lịch hôm nay; ngày giờ của buổi ghi ở dòng phụ.
    - Mã QR do máy chủ ký, tự đổi mỗi 30 giây (mã cũ mờ đi, mã mới hiện vào); thanh dưới mã rút ngắn dần tới lúc đổi.
    - Danh sách "Vừa điểm danh" tự tải lại mỗi 3 giây, người mới hiện vào đầu danh sách, số đếm đổi theo.
    - Tiêu đề "Vừa điểm danh", "Điểm danh tay" đứng riêng một dòng thay cho nhãn nhỏ.
    - Dòng "Mã QR điểm danh · đổi mỗi 30 giây" của bản vẽ là chữ đặt trong khung để thay cho hình mã. Mã thật nằm ở chỗ đó; câu này thành tên đọc của mã cho trình đọc màn hình.
    - Màn chiếu vừa đúng một màn hình: khi điểm danh tay, danh sách cuộn bên trong, nút "Đóng điểm danh" luôn thấy.
    - Khung xương lúc tải lần đầu vẽ theo trạng thái "chưa mở điểm danh" (lúc thường mở màn chiếu nhất). Mở lại màn chiếu giữa buổi đang điểm danh thì phần giữa đổi sang mã QR khi tải xong.
  - **Thử điểm danh với vai (bản demo):** tab mới gọi API bằng vai được chọn (header `X-Demo-User`, lưu trong sessionStorage của tab đó), nên tab chiếu QR vẫn là của chủ nhiệm. Chọn vai ở trang đầu hoặc đăng xuất thì xóa vai riêng của tab.
  - **Bàn giao:**
    - Sáu bước là một dải trên đầu tờ giấy; bước đang làm nền xanh nhạt, bước xong có dấu tích.
    - Máy chủ chỉ cho quay lại bước trước, bước 2 (chốt số dư) chưa làm. Vì vậy nút "Quay lại bước 2" hỏi lại trước, và báo rằng bản demo chưa sang lại bước 3 được (muốn thử lại thì đặt lại dữ liệu mẫu).
    - Bước 1–2 không còn nút "Sang bước 3".
    - "Xuất toàn bộ dữ liệu (Excel)" lấy thành viên, sổ quỹ và dự trù từ máy chủ, ghép vào một file.
    - Khung xương lúc tải lần đầu vẽ theo bước 3 (bước duy nhất có bản vẽ, cũng là bước của dữ liệu mẫu). Bàn giao đang ở bước khác thì phần thân đổi sang bước đó khi tải xong. Khung xương chỉ hiện khi chưa có dữ liệu nào trong bộ nhớ tạm; mở lại trang thì hiện ngay dữ liệu đã có.
    - Tên ngân hàng là chữ giữ chỗ "[ngân hàng]" trong dữ liệu mẫu, dùng chung với màn đóng quỹ. Bản vẽ Bàn giao viết hoa "[Ngân hàng]", bản vẽ Đóng quỹ viết thường.
  - **TV-DiemDanh:**
    - Vừa điểm danh xong: tờ lịch của buổi có dấu tích đóng lên góc (hiện trong 220 ms). Tờ lịch chỉ đỏ khi buổi là hôm nay.
    - Lịch sử điểm danh: mỗi buổi là một tờ lịch nhỏ (ngày, thứ), cạnh đó tên buổi và "Có mặt 07:49" hoặc "Vắng", thay cho dòng chữ "Sinh hoạt tuần 5 · 03/10".
    - Màn quét mã lỗi (mã hết hạn, buổi đã đóng, chưa vào CLB, chưa nhận lời mời, điện thoại đã điểm danh cho người khác) mở bằng tờ lịch hôm nay, câu giải thích như bản trước.
    - Header của màn quét mã chỉ có chữ CampusHub, không có tab, vì lúc quét chưa biết CLB nào.
  - **Khác:** trình duyệt hỏi `/favicon.ico` thì trả `icon.svg` (trước đây báo lỗi 404 trong console).
- Nhóm 3 và 4 (TV-CuaToi, TV-LoiMoi, SV-DanhSach, SV-DonXinVao, NT-TongQuan, NT-ChiTietCLB; chuyển ngày 04/10/2026, Hiệu chọn làm một lượt rồi duyệt một thể):
  - **Chung:**
    - Màn sinh viên và lời mời (SV-DanhSach, SV-DonXinVao, TV-LoiMoi) mở bằng tờ lịch hôm nay cỡ vừa cạnh tiêu đề, như màn trong của laptop. Ba màn có thanh tab (Điểm danh, Quỹ, Của tôi) không có tờ lịch hôm nay ở đầu, giữ như TV-DiemDanh đã duyệt.
    - Danh sách CLB và trang CLB: header có avatar chữ tắt ở bên phải (bấm để đổi vai ở bản demo, về Của tôi ở bản thật), thay cho tên ngắn "Hồng Nhung" của bản vẽ.
    - Nhãn "Đơn bị từ chối", "Tạm ngưng nhận đơn", "Chưa nhận lời mời" màu xám thay cho đỏ (đỏ chỉ dành cho hôm nay và hạn gấp).
  - **Của tôi:**
    - Hai phần "Kỳ Fall 2026" và "Dữ liệu của tôi" là hai tờ giấy, mỗi dòng ngăn bằng nét kẻ. Số buổi điểm danh dùng chữ số của tờ lịch.
    - "Rời CLB và xóa dữ liệu" chữ mực thường (không đỏ); hộp hỏi lại vẫn ghi "Việc này không hoàn tác được."
    - Gửi yêu cầu xóa xong: dòng đó thành tờ lịch hạn CLB phải xử lý (ngày gửi cộng 20 ngày, theo câu "tối đa 20 ngày" của bản vẽ), ghi "Đã gửi yêu cầu xóa ngày …" và "CLB xử lý xong trước ngày …". Tờ lịch đỏ khi còn từ 3 ngày trở xuống.
    - Rút đồng ý xong: dòng ghi "Đã rút đồng ý lưu số điện thoại ngày …" (trước đây ghi "Bạn không cho lưu số điện thoại"). Dòng này chỉ là chữ (không còn là nút bị khóa).
    - "Tải dữ liệu của tôi (Excel)" lấy từ máy chủ (GET /me/export): mọi CLB của người này, điểm danh, đóng quỹ, các lần đồng ý (kèm phiên bản, ngày rút), đơn xin vào và ngày tải. Trước đây chỉ có CLB đang xem.
    - Cán bộ của trường mở /me thì thấy trang chặn "Trang này dành cho thành viên CLB." với nút "Về trang nhà trường".
  - **Tab Quỹ (/me/pay):** lúc tìm đợt thu và chuyển sang màn đóng quỹ, màn hiện đúng khung xương của màn đóng quỹ, nên không đổi hình hai lần.
  - **Lời mời:**
    - Nút "Tham gia CLB" khóa (xám) tới khi chọn đủ hai ô bắt buộc như bản vẽ. Bấm khi còn thiếu thì con trỏ nhảy tới ô bắt buộc còn thiếu, thay vì không có gì xảy ra.
    - "Đổi" cạnh email: đăng xuất rồi đăng nhập lại, xong quay về đúng link mời (bản demo cũng vậy từ 05/10/2026).
    - Link mời của tài khoản khác: trang chặn "Bạn không xem được trang này" với câu của máy chủ "Lời mời này gửi cho tài khoản khác. Đăng nhập bằng đúng email được mời.", kèm nút "Đăng nhập tài khoản khác" (đăng nhập xong quay lại link mời).
    - "Đọc chính sách dữ liệu (chưa có)": trang chính sách chưa có.
    - Bỏ nhãn nhỏ "Lời mời tham gia" phía trên tiêu đề, vì tiêu đề "… mời bạn tham gia" đã nói đúng điều đó (luật của hệ: không đặt nhãn nhỏ trên tiêu đề).
    - "Bạn đã không tham gia" cũng mở bằng tờ lịch hôm nay; bấm "Xem lại lời mời" thì quay về lời mời, con trỏ ở nút "Không tham gia".
  - **Danh sách CLB:** các CLB là các dòng trên một tờ giấy (tên, nhãn, lĩnh vực và số thành viên, lịch sinh hoạt, nút) thay cho từng thẻ rời.
  - **Trang CLB và đơn xin vào:** ô "Họ tên" nền xám vì lấy từ tài khoản Google, không sửa ở đây. Gửi đơn xong thì form thu lại và thẻ "Đã gửi đơn" hiện vào chỗ đó.
  - **Các CLB (trường):**
    - Đầu trang có tờ lịch hôm nay cỡ vừa; ba ô số thành một dải chia bằng nét dọc; ô "Không có hoạt động trong 30 ngày" số màu cam khi có CLB nào.
    - Mọi dòng của bảng cao bằng nhau (đủ hai dòng chữ), nên lĩnh vực dài xuống dòng không làm bảng nhảy lúc tải xong.
    - Lúc đang tải, bộ lọc "Tất cả" đã vẽ sẵn như đang chọn, nên tải xong không đổi màu. Màn Đợt thu sửa giống vậy.
    - Nhãn "Quá 30 ngày" màu xám, "Chưa nộp" màu cam.
  - **Chi tiết CLB (trường):**
    - Link "Các CLB" đứng trên tờ lịch hôm nay và tên CLB. Phần dưới là một tờ giấy chia hai cột bằng nét dọc thay cho các thẻ.
    - "Sinh hoạt kỳ này" là dải ba ô; "Buổi gần nhất" có tờ lịch nhỏ của buổi đó.
    - Khoản chờ duyệt: dòng "Chờ bạn duyệt · khoản trên 2.000.000 ₫" của bản vẽ thành tiêu đề phần "Chờ bạn duyệt" với chú thích "Khoản trên 2.000.000 ₫" bên cạnh, như các phần khác của cột (luật của hệ: không đặt nhãn nhỏ trên tiêu đề). Tên khoản một dòng, số tiền xuống dưới (cột phải hẹp). Duyệt hay từ chối xong thì phần đó thu lại và số đếm trên menu giảm theo.
    - Đề nghị hỗ trợ "Chờ duyệt" nhãn xanh nhạt; "Từ chối" nhãn xám. Nút "Xem đề nghị" xám, bên cạnh ghi "chưa có".
    - Thanh bên: mục "Dự trù và báo cáo" ghi "chưa có" ở cuối dòng.
    - Nhiệm kỳ vẫn ghi "Từ Fall 2026" và "chưa có · đang bàn giao sang …" vì dữ liệu chưa có tháng bắt đầu nhiệm kỳ và chưa có lần bàn giao nào xong (bản vẽ: "Từ 09/2026", "08/2026 · Xem biên bản").
  - **Máy chủ:** GET /clubs và GET /school/clubs trả thêm học kỳ (`term`); mỗi dòng của GET /school/clubs có số khoản đang chờ mentor (`waitingMentor`), để mục "Khoản chờ duyệt" mở thẳng CLB có khoản chờ.
  - **Khác:** /explore và /school dựng lúc có người mở trang (không dựng sẵn lúc build), vì đầu màn có tờ lịch hôm nay.
- Tạo dữ liệu từ đầu (04/10/2026; bản vẽ chưa có các màn này, mô tả được Hiệu duyệt trước khi làm):
  - **Tạo CLB** (`/clubs/new`):
    - Ai đã đăng nhập cũng tạo được, theo phương án nghiệp vụ N1 (không cần xác minh). Người tạo là chủ nhiệm, mã A001, ở "Ban chủ nhiệm".
    - Lối vào: nút "Tạo CLB mới" cuối Danh sách CLB, và ở trang chặn "Bạn chưa ở CLB nào".
    - Form: tên, lĩnh vực, lịch và nơi sinh hoạt, học kỳ (kỳ hiện tại và hai kỳ sau; mỗi năm 3 kỳ), mentor không bắt buộc, "Đang nhận đơn xin vào" (bật sẵn).
    - Tên trùng CLB khác (không phân biệt dấu, hoa thường) thì báo lỗi.
    - Người tạo không qua màn đồng ý dữ liệu như thành viên được mời. Cần hỏi lại nếu muốn người tạo cũng xác nhận đủ 16 tuổi.
  - **Trang chủ CLB mới:** "Cần bạn xử lý" nhắc ba việc, mỗi việc có biểu tượng thay cho số: Thêm thành viên, Tạo buổi sinh hoạt đầu tiên, Tạo đợt thu quỹ. Việc nào xong thì dòng đó mất. "Tạo sự kiện" và "Xem" ở phần Sự kiện sắp tới mở màn Các buổi (trước đây khóa).
  - **Thêm thành viên** (`/members/add`, mở từ nút "Nhập từ Excel" của màn Thành viên):
    - Nhận file .xlsx và .csv. Tìm dòng tiêu đề trong 5 dòng đầu, tìm cột theo tên (Họ tên/Họ và tên, Email, Ban, Năm học/Năm); không có dòng tiêu đề thì đọc theo thứ tự của file mẫu.
    - Cột MSSV, STT bỏ qua, không lưu; màn báo tên các cột đã bỏ.
    - File .xls đời cũ thì báo "mở bằng Excel rồi lưu thành .xlsx". Có nút "Tải file mẫu" (dữ liệu mẫu tự đặt).
    - Ở bảng xem trước, mọi ô sửa được. Lỗi hiện ngay dưới ô: thiếu họ tên, email sai, email trùng dòng trên, người đã ở CLB, năm học ngoài 1–5. Có nút "Thêm dòng" để gõ tay, và nút "Bỏ" cho từng dòng.
    - Nút "Thêm N người" xám khi còn lỗi; bấm thì con trỏ tới ô lỗi đầu tiên.
    - Thêm xong: bảng mã, họ tên, email, link mời riêng của từng người, kèm "Sao chép tất cả link mời" (tên, mã và link, để dán vào Zalo). Lý do: bản demo chưa gửi email.
    - Cột "Năm học" thay cho "khóa" trong mô tả đã duyệt, vì dữ liệu chỉ lưu năm học 1–5 (như đơn xin vào).
  - **Màn Thành viên:**
    - Thêm cột "Thao tác". Người chưa nhận lời mời có nút biểu tượng "Sao chép link mời".
    - Chủ nhiệm có nút "Sửa" mở hộp đổi vai trò và ban. Danh sách ban gợi ý từ các ban đang có. Không đổi được ai thành chủ nhiệm, cũng không đổi vai của chủ nhiệm; hộp ghi "Đổi chủ nhiệm làm ở màn Bàn giao".
    - "Nhập từ Excel" chỉ hiện cho người có quyền duyệt đơn.
  - **Các buổi** (`/events`; mục "Điểm danh" trên thanh bên giờ mở trang này, trước đây mở thẳng màn chiếu QR):
    - Hai phần "Sắp tới" và "Đã qua". Mỗi buổi mở đầu bằng tờ lịch của ngày đó, đỏ khi là hôm nay.
    - Buổi đã qua giờ kết thúc mà chưa mở điểm danh nằm ở "Đã qua", nhãn "Chưa mở điểm danh"; vẫn mở QR muộn được. Form không cho tạo buổi đã qua (máy chủ cũng chặn).
    - Mỗi dòng có tên, giờ, nơi, giờ đóng điểm danh; nhãn Sắp tới / Đang mở điểm danh / Đã đóng; số người đã điểm danh trên tổng thành viên.
    - Nút "Mở QR" (buổi đã đóng thì "Xem"). "Sửa", "Xóa" chỉ khi chưa mở điểm danh; "Xóa" chỉ khi chưa ai điểm danh và có hỏi lại.
    - Form tạo, sửa buổi mở ngay trên tờ giấy:
      - các ô: tên, loại (sinh hoạt có điểm danh / sự kiện mở), ngày, giờ bắt đầu, giờ kết thúc, điểm danh mở tới, nơi;
      - giờ đóng điểm danh tự đi theo giờ kết thúc cho tới khi người dùng tự sửa;
      - mở từ trang chủ (`?create=1`) thì form mở sẵn.
  - **Đợt thu:**
    - Đầu tờ giấy có dải chọn đợt thu: mỗi đợt một thẻ, đợt tạo gần nhất trước. Cuối dải là "Tạo đợt thu" cho thủ quỹ và chủ nhiệm.
    - Đợt tạo gần nhất là đợt đang dùng ở trang chủ, màn đóng quỹ của thành viên và màn đối soát.
    - Nút "Sửa đợt thu" mở hộp sửa hạn đóng và mức thu. Đã có người đóng hay báo đã chuyển thì ô mức thu khóa, kèm lý do.
    - Mục "Đợt thu" trên thanh bên không còn khóa khi CLB chưa có đợt thu: trang đó mời tạo.
  - **Tạo đợt thu** (`/collections/new`):
    - Bên trái là form. Bên phải là phần "Xem trước" màn đóng quỹ của thành viên: tên, số tiền, tờ lịch hạn đóng, người nhận, nội dung chuyển khoản của chính người đang tạo.
    - Tên đợt thu điền sẵn "Quỹ học kỳ <học kỳ>". Mã đầu nội dung gợi ý theo tên (QFALL26; tên khác thì lấy chữ đầu mỗi từ cộng năm, ví dụ QGNB26).
    - Người nhận mặc định là thủ quỹ. Tên chủ tài khoản đi theo người nhận, viết hoa không dấu. Hạn đóng mặc định là 14 ngày sau, hết 23:59 ngày đó.
    - Số tài khoản: máy chủ chỉ lưu 4 số cuối. Phần xem trước không vẽ mã QR; màn đóng quỹ thật vẫn có mã QR giả kèm dòng "Bản demo: mã này không chuyển tiền được."
    - Người nhận tiền ghi đúng vai hiện tại trong CLB ("Chủ nhiệm …" khi CLB chưa có thủ quỹ), ở phần xem trước, màn Đợt thu và màn đóng quỹ của thành viên (trước đây luôn ghi "thủ quỹ").
- Trang chặn trong thế giới mới mở bằng tờ lịch hôm nay, có một nút chính: sai vai thì "Chọn vai khác (bản demo)" hoặc "Về trang của tôi", kèm "Đăng nhập tài khoản khác"; chưa vào CLB thì "Tìm CLB và gửi đơn"; chưa nhận lời mời thì "Xem lời mời"; máy chủ lỗi thì "Thử lại".

**Đã chốt ngày 03/10/2026** (trả lời các câu hỏi của đợt dọn giao diện)
- Nhóm "tạo dữ liệu từ đầu" được duyệt (05/10/2026). Người tạo CLB chưa phải xác nhận đủ 16 tuổi: để vậy khi còn dùng dữ liệu giả, xem lại trước bản thật.
- Nhóm 3 và 4 được duyệt (04/10/2026). Giữ tờ lịch đếm 20 ngày sau khi gửi yêu cầu xóa dữ liệu. Bỏ nhãn nhỏ "Lời mời tham gia" trên tiêu đề màn lời mời.
- Nhóm luồng tiền được duyệt (03/10/2026). Đợt thu giữ thứ tự "người cần xử lý lên đầu" (báo đã chuyển, chưa đóng, rồi đã đóng). Đối soát giữ dòng mô tả file ghi giờ tải lên, không ghi "mẫu sao kê: [ngân hàng của CLB]".
- Bỏ `line-height: 1.5` ở body cho giống bản vẽ; chỉ đặt line-height ở chỗ bản vẽ có đặt. Khoảng cách giữa các khối và lề trên theo từng màn của bản vẽ (prop `gap`, `top` của BoardShell, SchoolShell, PhoneShell). Nút trong thẻ ở Trang chủ cao 36px (`.md`).
- (Đã bỏ cùng hệ cũ ngày 05/10/2026.) `design/ui.css` thêm `.md` (nút cao 36px) và `.btn.danger` (chữ đỏ trên nền đỏ nhạt, dùng hai màu đã có) cho nút xác nhận việc không hoàn tác được, ví dụ "Rời CLB và xóa". Nhãn "Đang xử lý yêu cầu xóa" dùng màu đỏ (b-bad).
- Tab Quỹ khi CLB chưa mở đợt thu: màn /me/pay ghi "CLB chưa mở đợt thu nào."; có đợt thu thì chuyển thẳng sang màn đóng quỹ.
- Mở màn chiếu QR chưa mở điểm danh: màn hiện "Chưa mở điểm danh" và nút "Bắt đầu điểm danh" (trước đây mở màn là tự mở, kể cả trước ngày sinh hoạt).
- Sau khi đóng điểm danh vẫn điểm danh tay được (vẫn ghi tên người điểm danh tay). Màn quét mã khi buổi đã đóng ghi "Nếu bạn có mặt mà chưa điểm danh, nhờ ban điều hành điểm danh tay."
- Ghi chú khi duyệt khoản chi được lưu vào lịch sử, ví dụ "duyệt: “Nhớ lấy hóa đơn”" (`approveExpense` trong `src/lib/actions.ts` có thêm tham số ghi chú, không bắt buộc).
- Đơn xin vào bị từ chối thì gửi lại được: trang CLB hiện thẻ "Đơn bị từ chối" rồi tới form đơn.
- Chữ trên nút đổi theo bản vẽ (cùng lúc với sửa script chạy thử): trang chặn khi chưa chọn vai ghi "Chọn vai"; Trang chủ luôn ghi "Mở QR", buổi đang mở thì dòng phụ ghi "đang mở điểm danh đến …"; bàn giao ở bước 1–2 ghi "Sang bước 3"; Dự trù ghi "Xuất Excel theo [mẫu dự trù của trường]" (vẫn ra file CSV); sidebar nhà trường có thêm mục "Xuất Excel" (bảng các CLB, như nút ở màn Các CLB).

**Bỏ hệ tím cũ (05/10/2026)** (Hiệu duyệt ngày 05/10/2026, cả ba chỗ nhỏ đổi theo)
- Xóa `design/ui.css` và bản sao của nó trong `src/app/globals.css` (từ 619 dòng còn khoảng 100), xóa `ConfirmButton`, `ui/alert-dialog`, `ui/tabs`, bỏ hai font Be Vietnam Pro và Montserrat. Biến theme của shadcn/ui nối vào biến của Lịch bloc: thêm component bằng `npx shadcn add` ra đúng màu xanh mực, giấy trắng, nét kẻ 1px, không bóng đổ.
- Bảng tài khoản mẫu (chỉ ở bản demo, 05/10/2026, Hiệu yêu cầu, thay trang chọn vai `/demo` đã bỏ): dưới form của /login, một khung nét 1px "Tài khoản mẫu (bản demo)", câu hướng dẫn, 7 dòng bấm được (vai in đậm; tên tài khoản · mật khẩu bằng chữ mã), bấm là điền sẵn hai ô và đưa focus sang nút Đăng nhập; dưới cùng nút "Đặt lại dữ liệu mẫu" (hỏi lại trước khi làm). /register ở bản demo có link "Bản demo: đăng nhập bằng tài khoản mẫu"; link ở trang đầu cũng dẫn tới /login. Các link "Đổi vai (bản demo)" ở thanh bên laptop, trang nhà trường, trang chặn, lời mời đã bỏ; avatar trên điện thoại luôn mở Của tôi. Các luồng thử nhanh chuyển sang `../README.md`.
- Trang lỗi, trang không tìm thấy, và màn chờ lúc trình duyệt đọc dữ liệu (chỉ còn nền Lịch bloc, không hiện chữ "Đang tải…").
- Ba chỗ nhỏ trên màn đã duyệt đổi theo, vì trước đây chúng vô tình nhận kiểu từ lớp cũ cùng tên:
  - Của tôi: chữ viết tắt trong ảnh đại diện lớn ("MA") nằm giữa vòng tròn; trước lệch phải khoảng 4px do lớp `.lg` cũ thêm lề hai bên.
  - Dự trù: dòng "Đủ chi" / "Đang thiếu" dưới số dư cuối kỳ canh trái như dòng phụ của các ô khác; trước bị lớp `.result` cũ canh giữa.
  - Đợt thu: dải số dùng cỡ chữ và giãn dòng chung của Lịch bloc; trước nhận 14px và giãn dòng 1,5 từ lớp `.lead` cũ, nên cao hơn khoảng 1px.
- Component thêm bằng `npx shadcn add` vẫn phải soát lại theo `DESIGN.md` (cỡ chữ, khoảng cách, trạng thái), vì biến theme chỉ lo màu, bo góc, font; bóng đổ của Tailwind đã tắt sẵn.

**Sửa lỗi tiền và lỗi web (05/10/2026)** (chờ Hiệu xem)
- Đối soát:
  - Nút "Ghi nhận", "Ghi nhận cả hai" và "Ghi nhận" sau khi chọn tay đều hỏi lại trước khi ghi vào sổ, như màn Đợt thu. Hộp hỏi ghi số tiền, người chuyển, người được gán; người đã đóng thì báo phần tiền đó ghi là đóng thừa; người đã được ghi nhận tay thì báo chỉ phần chênh được ghi thêm.
  - Mọi người được gợi ý đều đã đóng (theo trạng thái máy chủ lúc mở màn) thì dòng chuyển sang chọn tay. Còn người chưa đóng thì vẫn ghi nhận theo gợi ý, phần của người đã đóng ghi là đóng thừa (như luồng đã duyệt).
  - Đợt thu: nút "Đối soát sao kê" ở màn Đợt thu mở đúng đợt đó (`/reconcile?collection=<mã đợt>`); menu bên trái mở đợt tạo gần nhất. Chưa có dải chọn đợt ngay trên màn đối soát.
  - Lý do mới trong cột "Vì sao chưa khớp": "Không ghi mã đợt thu" (CLB có nhiều đợt), "Đã ghi nhận tay 100.000 ₫, sao kê 150.000 ₫". Dòng ghi mã của đợt khác tính vào ô "Không thuộc đợt thu".
- Dự trù: kỳ có nhiều đợt thu thì dòng dưới "Thu dự kiến" ghi "N khoản chưa xác nhận, từ M đợt thu".
- Link QR khi chưa đăng nhập: đăng nhập xong quay về đúng link, giữ cả `?e=&t=`.
- Ghi tiền mà người khác vừa ghi trước (máy chủ báo 409): màn tự tải lại để hiện trạng thái mới. Báo đã chuyển khoản xong thì trang Của tôi đổi ngay.

**Chỉ có ở bản demo:** bảng tài khoản mẫu ở trang đăng nhập, ô "thử điểm danh với vai" dưới mã QR, nút đặt lại dữ liệu mẫu. (Trang chọn vai và link "Đổi vai (bản demo)" đã bỏ ngày 05/10/2026.)

## Khi nối máy chủ

- Server và hợp đồng API đã có bản nháp: `../server/` và `../docs/api.md`.
- Đã nối (03–04/10/2026): trang chọn vai (đăng nhập nhanh, đặt lại dữ liệu; đã bỏ ngày 05/10/2026), /login, BDH-TrangChu, TV-DongQuy, nhóm luồng tiền (BDH-DotThu, BDH-DoiSoat, BDH-DuyetChi, BDH-DuTru), nhóm 2 (BDH-ThanhVien, BDH-QR, BDH-BanGiao, TV-DiemDanh gồm /checkin và /me/attendance), rồi nhóm 3 và 4 (TV-CuaToi, tab Quỹ /me/pay, TV-LoiMoi, SV-DanhSach, SV-DonXinVao, NT-TongQuan, NT-ChiTietCLB). Hết màn nào còn đọc dữ liệu trong trình duyệt. Gọi API qua `src/api/client.ts` (lỗi trả về dạng `ApiError`, câu `message` hiện thẳng cho người dùng); truy vấn dùng chung và khóa lưu tạm ở `src/api/queries.ts` (TanStack Query). Chưa đăng nhập thì màn chuyển sang `/login?next=<trang đang mở>`.
- Hai nguồn dữ liệu đã khớp (04/10/2026): việc làm ở màn nào cũng hiện ở các màn khác, vì mọi màn đọc cùng một máy chủ.
- Kiểu dữ liệu của từng API nằm ở `../server/src/contract.ts`. Khi nối, web import kiểu bằng `import type`; file này không import gì nên không kéo code của server vào web.
- Mỗi thao tác trong `src/lib/actions.ts` ứng với một API, ví dụ `approveExpense` ứng với duyệt khoản chi. Máy chủ gọi các thao tác này; trang web gọi API rồi nạp lại dữ liệu (`useClubMutation` trong `src/api/queries.ts`).
- Server dùng lại các file luật trong `src/lib` (types, selectors, actions, reconcile, seed, format, text). Các file này không được dùng API của trình duyệt.
- Những việc server đã tự làm, web không cần làm lại: quyền theo vai, ký và kiểm tra mã QR điểm danh, tính số tiền khi ghi nhận, đối soát.
- Server đã theo các luật chốt ngày 03/10/2026: điểm danh tay sau khi đóng (server vốn cho làm), gửi lại đơn bị từ chối, ghi chú khi duyệt khoản chi. Server có thêm đăng nhập Google, đăng nhập nhanh ở chế độ demo và phiên bằng cookie: xem `../docs/api.md` mục Đăng nhập.

## Đã kiểm tra

- Sửa 8 lỗi tiền và web (05/10/2026), mỗi lỗi có test tái hiện viết trước khi sửa và đã thấy hỏng:
  - Luật tiền: `src/lib/money-regressions.test.ts` (5 test) và một test xếp loại sao kê khi có nhiều đợt thu; server thêm test mentor tự duyệt (403) và bước ghi nhận tay trong test khởi động lại với PostgreSQL.
  - Web: `e2e/regressions.cjs` (12 kiểm tra). Lỗi 409 và lỗi 8 còn được thử ngược: bỏ phần sửa thì kiểm tra hỏng.
  - Kết quả: web 31/31, server 63/63, `npm run test:db` 63/63, typecheck và build không lỗi; `npm run e2e` đạt cả 6 script (smoke 40/40, nhóm tiền 11/11, nhóm 2 15/15, nhóm 3–4 42/42, tạo dữ liệu 27/27, sửa lỗi 12/12). Hai script cũ thêm bước bấm qua hộp hỏi ở màn đối soát.

- Bỏ hệ tím cũ (05/10/2026):
  - `npm test` 25/25, typecheck và build không lỗi. Bộ dò của Impeccable không báo gì.
  - `npm run e2e`: smoke 40/40 (sửa cách chọn vai theo lớp mới), nhóm tiền 11/11, nhóm 2 15/15, nhóm 3–4 42/42, tạo dữ liệu 27/27; không có lỗi trên trang. `npm run e2e:skeleton`: không khối nào lệch theo chiều dọc.
  - So điểm ảnh 25 màn (laptop và điện thoại, cùng dữ liệu mẫu) giữa bản build trước khi sửa và bản sau: 19 màn giống hệt, kể cả đăng nhập và hộp sửa thành viên. Khác ở trang chọn vai, trang không tìm thấy (cố ý) và ba chỗ nhỏ ghi ở mục "Bỏ hệ tím cũ".
  - Agent duyệt thiết kế: trang chọn vai, trang 404 và globals.css đạt luật Lịch bloc. Sửa một điểm: nút "Tải lại trang" ở trang lỗi gọi `retry` của Next 16 (tải lại dữ liệu rồi vẽ lại) thay cho `reset` (chỉ vẽ lại, lỗi do dữ liệu sẽ hiện lại y như cũ).

- Đưa script bấm thử vào repo (05/10/2026):
  - Các script trước đây nằm ngoài repo giờ ở `e2e/`, chạy bằng `npm run e2e` (cách chạy: `e2e/README.md`). Tên cũ trong các dòng bên dưới ứng với: `smoke.js` → `smoke.cjs`, `group1.js` → `money-flows.cjs`, `group2.js` → `members-qr-handover.cjs`, `group34.js` → `member-student-school.cjs`, `tao-du-lieu.js` → `club-setup.cjs`, các script đo khung xương → `skeleton-*.cjs`.
  - Kết quả: smoke 40/40, nhóm tiền 11/11, nhóm 2 15/15, nhóm 3–4 42/42, tạo dữ liệu 27/27; không có lỗi trên trang.
  - Đo khung xương ở cả 5 script: không khối nào lệch theo chiều dọc. Ở Duyệt chi, bộ chọn cũ đo nhầm ghi chú "Vẫn ghi sổ được…" thay vì ghi chú cuối trang; đã sửa bộ chọn.

- Tạo dữ liệu từ đầu (04/10/2026):
  - Test: web 25/25 (thêm test đọc file thành viên), server 62/62 (thêm 5 test tạo CLB, thêm thành viên, đổi vai, buổi, đợt thu), `npm run test:db` 62/62. Typecheck và build không lỗi.
  - Thử bằng Playwright (`tao-du-lieu.js`, 24 kiểm tra): sinh viên tạo CLB trên điện thoại, thêm 3 người từ file .xlsx có dòng lỗi, đổi vai, tạo/sửa/xóa buổi, tạo và sửa đợt thu, người được thêm nhận lời mời.
  - `smoke.js` 40/40 và `group34.js` 42/42 vẫn đạt.
  - Đo khung xương ở 5 màn mới và vừa sửa: các khối lệch 0px theo chiều dọc.

- Nhóm 3 và 4 (04/10/2026):
  - `npm test` 21/21, server 52/52, typecheck và build không lỗi.
  - Thử bằng Playwright (`group34.js`, 42 kiểm tra): ô đồng ý không đánh dấu sẵn, thiếu ô bắt buộc thì con trỏ tới ô còn thiếu, lời mời của tài khoản khác bị chặn, tải dữ liệu của tôi, rút đồng ý, gửi yêu cầu xóa (tờ lịch còn 20 ngày), gửi đơn, sinh viên bị chặn ở trang trường, xuất Excel và tải bản dự trù, mentor từ chối phải ghi chú.
  - `smoke.js` 40/40, không còn kiểm tra nào bị bỏ qua (bật lại "Nam đã được ghi nhận ở bước đối soát").
  - Đo khung xương so với trang đã tải ở cả 6 màn: các khối lệch 0px theo chiều dọc.
  - Agent duyệt thiết kế yêu cầu sửa 8 điểm (bỏ nhãn nhỏ trên tiêu đề, cột bảng trường, khung xương đổi màu, focus sau "Không tham gia", dòng trạng thái thay nút khóa, lý do "chưa có", tài liệu); đã sửa và được chấm đạt, DESIGN.md đã cập nhật.
- Nhóm luồng tiền (03/10/2026):
  - `npm test` 21/21, server 51/51, typecheck và build không lỗi.
  - Thử bằng Playwright (`group1.js`, 11 kiểm tra): ghi tiền mặt, gán tay, tải sao kê có ngày sai, chủ nhiệm không tự duyệt, trưởng ban duyệt có ghi chú, thêm dự trù thì báo thiếu.
  - Đo khung xương so với trang đã tải ở cả 4 màn: tiêu đề cột, các dòng và các khối lệch 0px.
  - `smoke.js` 38/38, bỏ qua 2 kiểm tra vì hai nguồn dữ liệu chưa khớp.
  - Agent duyệt thiết kế yêu cầu sửa 8 điểm; sau bốn vòng sửa được chấm "ship".
- Sau khi nối máy chủ và làm hai màn thử "Lịch bloc": `npm test` 20/20, `npm run typecheck`, `npm run build` không lỗi; `npm test` ở `server/` 51/51. Thử bằng Playwright (web và server chạy cùng lúc): chưa đăng nhập thì chuyển sang /login?next=…, cookie phiên là httpOnly, thành viên thường bị máy chủ chặn ở trang ban điều hành, bấm "Mình đã chuyển khoản" thì máy chủ lưu trạng thái "Báo đã chuyển", nút Google chuyển sang trang đăng nhập của Google; console không có lỗi (trừ 401, 403 cố ý). `smoke.js` 39/39, bỏ qua 1 kiểm tra vì hai nguồn dữ liệu chưa khớp (xem "Khi nối máy chủ"). Bộ dò của Impeccable không còn lỗi; agent duyệt thiết kế (finish review) yêu cầu sửa 7 điểm, đã sửa và được chấm đạt cả 7.

- `npm test`: 20/20 test đạt (thêm test ghi chú khi duyệt khoản chi). `npm run typecheck` và `npm run build`: không lỗi. `npm test` ở `server/`: 40/40.
- Chụp 46 trạng thái ở 1440×900 và 390×844 rồi so điểm ảnh với bản trước khi sửa: sau bước 2 chỉ khác ở các chỗ sửa chữ; sau khi cài Tailwind v4 và shadcn/ui, 46/46 ảnh giống hệt; sau bước 4 chỉ màn TV-DongQuy khác (cố ý); sau bước 5, 34/46 ảnh khác ở các chỗ sửa theo danh sách rà soát (chữ, dòng lý do khóa nút, khoảng cách và cỡ theo bản vẽ), đã xem lại các màn đổi nhiều.
- Thử bằng Playwright: hộp hỏi (mở, Esc, xác nhận, focus về nút), đổi tab bằng phím mũi tên, focus sau khi duyệt, từ chối, điểm danh tay, gửi đơn; thông báo hiện đúng chữ; console không có lỗi hay cảnh báo.
- Script chạy thử (`smoke.js`, nằm ngoài repo) đã sửa và chạy lại ngày 03/10/2026: 40/40 kiểm tra đạt (thêm một kiểm tra: mở màn chiếu chưa tự mở điểm danh), không có lỗi trên trang. Những chỗ đã phải sửa trong script: nút sao chép không còn đổi chữ thành "Đã sao chép" (chữ này nằm trong thông báo); các nút chưa làm ("Tạo sự kiện", "Xem", "Nhập từ Excel", "Nhắn hỏi", "Xem đề nghị", mục menu bị khóa) dùng aria-disabled nên Playwright coi là bị khóa, muốn bấm thì dùng force; các nút trước đây mở hộp confirm của trình duyệt giờ mở hộp hỏi lại, script phải bấm thêm nút xác nhận (chữ ở mục "Trạng thái bản vẽ chưa có"); nút "Ghi nhận" ở Đối soát không còn khóa khi chưa chọn người; màn chiếu QR phải bấm "Bắt đầu điểm danh" trước khi có mã.
- Sau khi chốt các câu hỏi ngày 03/10/2026: 41/47 ảnh khác so với sau bước 5, phần lớn vì bỏ line-height ở body; đã xem lại Trang chủ, đóng quỹ và màn chiếu QR. Thử thêm bằng Playwright: phải bấm "Bắt đầu điểm danh" mới có mã, đóng rồi vẫn điểm danh tay được, ghi chú khi duyệt vào lịch sử: đều đúng.
