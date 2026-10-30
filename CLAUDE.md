# CampusHub: hướng dẫn cho Claude Code và cả nhóm

CampusHub là **bộ bàn giao cho ban điều hành CLB sinh viên**, dùng cạnh Google Sheets: Kho bàn giao (biểu mẫu, quy trình, tài khoản của CLB), bàn giao nhiệm kỳ 7 bước và việc cần làm; kèm quản lý thành viên, điểm danh QR và sổ quỹ. Sản phẩm cũng giúp **ban quản lý CLB của trường** nắm tình hình các CLB. (Định vị đổi ngày 22/10/2026 theo kết quả Checkpoint 2, Hiệu duyệt; chi tiết ở `docs/tien-do-mvp.md` (phần B).)

Thư mục này chỉ chứa code. Tài liệu nghiên cứu và khảo sát nằm ở thư mục cha `hieu khoi nghiep` và **không đưa vào repo**.

## Bắt đầu ở đây

- **Đọc `docs/tien-do-mvp.md` trước tiên.** File đó nói:
  - đang làm tới đâu, việc tiếp theo;
  - các màn đã làm và ngày Hiệu duyệt;
  - những quyết định đã duyệt khác bản vẽ;
  - cách làm việc với Hiệu, thế nào là "xong" một nhóm màn.
  Xong mỗi nhóm việc thì cập nhật file đó.
- Muốn hiểu sản phẩm theo từng nhóm người dùng (ban điều hành, thành viên, sinh viên, nhà trường): `docs/luong-nguoi-dung.md`. Giới thiệu chung cho người xem repo: `README.md`.
- **Cây thư mục:** `docs/cay-thu-muc.md`: thư mục nào làm gì, cho ai, trang web nào nằm ở đâu, muốn sửa gì thì mở file nào. Thêm hay đổi thư mục thì sửa file đó.
- **Hai skill bắt buộc:** `karpathy-guidelines` (cách viết code) và `impeccable` (thiết kế giao diện). Cách cài ở `docs/tien-do-mvp.md`, mục 8. Không đưa `.claude/` vào commit.
- Repo: https://github.com/AkioChan0308/CampusHub (nhánh `main` và `develop`). **Chỉ commit và push khi Hiệu bảo.**
- **Hỏi Hiệu bằng câu trắc nghiệm ngay trong chat.** Màn chưa có bản vẽ thì viết mô tả trước, Hiệu duyệt rồi mới code.

## Cách làm việc

- Trả lời và viết tài liệu bằng tiếng Việt, câu ngắn, dễ đọc. Giao diện người dùng viết tiếng Việt.
- Không tự đặt số liệu. Số nào không có nguồn thì để trống và ghi "chưa có".
- Tiến độ hiện tại và việc tiếp theo: `docs/tien-do-mvp.md`. Kế hoạch 10 tuần ban đầu: `docs/ke-hoach-mvp.md`.
- Chuẩn code (đặt tên, cấu trúc thư mục, quy ước commit) do Khoa (Tech Lead) chốt. Chuẩn nào đã chốt thì ghi thêm vào file này.
- **Luật đặt tên** (Hiệu chốt ngày 05/10/2026, chờ Khoa xem; chi tiết ở `docs/cay-thu-muc.md`, mục 2):
  - Mọi thứ thuộc code đặt tên tiếng Anh, rõ nghĩa: thư mục, file, hàm, biến, component, URL, tên script bấm thử. Chỉ phần mô tả cho người đọc (tài liệu, README, chú thích, chữ trên giao diện) viết tiếng Việt.
  - Tên nói nội dung, không đặt theo đợt làm việc ("nhóm 2").
  - Trang web gom theo người dùng bằng route group: `(landing)`, `(auth)`, `(club-admin)`, `(member)`, `(student)`, `(school-staff)`; URL không đổi.
  - Migration đã chạy giữ tên cũ (máy chủ nhớ theo tên file); migration mới đặt tên tiếng Anh.

## Giao diện

**Hệ thiết kế đã chốt: "Lịch bloc"** (Hiệu duyệt ngày 03/10/2026). CLB sống theo lịch: mỗi màn mở bằng tờ lịch hôm nay, mỗi hạn chót là một tờ lịch nhỏ đếm ngày.
- Đây là hệ giao diện duy nhất. Hệ tím cũ (`design/ui.css`) đã bỏ khỏi code ngày 05/10/2026.
- Luật của hệ: `DESIGN.md`. Màu, chữ, nút nằm trong `web/src/app/lich.css` (biến màu ở `:root`, kiểu của màn dưới lớp `.lich`). Thành phần dùng chung nằm ở `web/src/components/lich/`: tờ lịch, khung laptop, khung điện thoại, trang chặn, chuyển động.
- Màn đã chuyển sang Lịch bloc: cả 16 màn của bản vẽ, /login và các trang chặn (xong ngày 04/10/2026). Hai nhóm cuối (TV-CuaToi, TV-LoiMoi, SV-DanhSach, SV-DonXinVao, NT-TongQuan, NT-ChiTietCLB) làm một lượt, Hiệu duyệt ngày 04/10/2026. Trang chọn vai của bản demo, trang lỗi và trang không tìm thấy chuyển ngày 05/10/2026.
- Màn chưa có bản vẽ đã làm theo mô tả Hiệu duyệt (05/10/2026): Tạo CLB, Thêm thành viên, Các buổi, Đợt thu (danh sách, tạo, sửa). Danh sách ở `docs/tien-do-mvp.md`, mục 3.
- Màn chưa có bản vẽ, làm theo `docs/tien-do-mvp.md` (phần B) (22/10/2026, chờ Hiệu duyệt): Kho bàn giao (biểu mẫu, quy trình, tài khoản; **không lưu mật khẩu**), Bàn giao 7 bước, Việc cần làm (ban điều hành) và Việc của tôi (thành viên), trợ lý bàn giao bản mẫu (tóm tắt, hỏi đáp trong kho), Bản trả phí (trang mô tả), trang chủ ban điều hành đổi thứ tự, menu gom nhóm Quỹ, khung quảng cáo mẫu. Danh sách ở `docs/tien-do-mvp.md`, mục 3; chỗ khác bản vẽ ở `web/README.md`.
- Trước khi làm bất kỳ màn hình nào, đọc `design/README.md`. File này nói 16 màn đã vẽ, mỗi màn làm gì, luật nghiệp vụ nào hiện trên màn, và những gì chưa vẽ.
- Nội dung và chữ tiếng Việt của từng màn: `design/screens/<tên màn>.html`. Mở bằng trình duyệt; `index.html` liệt kê cả bộ. Bản vẽ vẫn mang màu tím cũ: chỉ lấy nội dung, chữ và luật, không lấy màu hay kiểu. Khi chuyển sang Lịch bloc thì giữ đủ nội dung, chữ và luật của bản vẽ; bố cục đổi theo Lịch bloc. Chỗ nào khác bản vẽ thì ghi vào mục "Chỗ code khác bản vẽ" của `web/README.md`.
- Màn hoặc trạng thái chưa vẽ thì hỏi Hiệu trước, không tự nghĩ ra màn mới.
- Đỏ chỉ dùng cho tờ lịch hôm nay và hạn còn từ 3 ngày trở xuống. Xanh mực dùng cho thao tác. Không có bóng đổ; chia khối bằng nét 1px; vùng làm việc là một tờ giấy chứ không phải nhiều thẻ rời.
- Không thêm màu, font hay kiểu nút ngoài `lich.css`. Không dùng emoji, gradient, font Inter, Roboto, Arial.
- **Chuyển động và lúc tải** (Hiệu yêu cầu: không để chuyển trang chớp, nút thô):
  - Mọi màn Lịch bloc dùng bộ trong `web/src/components/lich/motion.tsx`:
    - `LichPage`: chuyển trang mượt.
    - `Loading` + `Skel`: khung xương đúng bố cục, thay cho chữ "Đang tải…".
    - `Reveal` + `useSawPending`: hiện dần, không nháy khi dữ liệu có sẵn.
    - `LinkIcon`: link vừa bấm hiện vòng xoay.
  - Nút đang gửi dùng `aria-busy`, không dùng `disabled`.
  - Thời lượng 150–250 ms; tắt khi máy bật giảm chuyển động.
  - Ngoại lệ Hiệu duyệt ngày 29/10/2026, có giới hạn và tên riêng trong `DESIGN.md`: cuốn lịch 3D ở trang đầu (`web/src/components/lich/fx/`, GSAP và Three.js, chỉ tải khi máy đủ điều kiện) và lớp hiệu ứng cuối `lich.css` ở màn làm việc (tối đa 296 ms, không áp cho số tiền). Ngoài hai thứ này vẫn theo luật 150–250 ms.
- Tên người và số tiền trong bản vẽ là dữ liệu mẫu.
- Không sửa tay `design/screens/`: các file này được tạo lại bằng `design/tools/convert-screens.py`.

## Stack

- **Frontend** (thư mục `web/`, bản demo làm ngày 02/10/2026): Next.js 16 (App Router), React 19, TypeScript 5.9. Từ 03/10/2026 (Hiệu đồng ý) có thêm Tailwind CSS v4, shadcn/ui (bản Radix, component trong `src/components/ui`) và Motion (gói `motion`, import từ `motion/react`). Mọi màn dùng `src/app/lich.css`, chữ Barlow và Barlow Condensed, mã chuyển khoản JetBrains Mono. `src/app/globals.css` chỉ còn quy tắc nền cho thẻ HTML và biến theme của shadcn, nối vào biến của lich.css: component thêm bằng `npx shadcn add` ra màu Lịch bloc, lớp tiện ích của Tailwind chỉ có màu, bo góc và font của Lịch bloc. Gọi API bằng `src/api` (TanStack Query lưu tạm kết quả); Next chuyển `/api/v1/...` sang máy chủ (`next.config.ts`). Chuyển động chỉ dùng để cho thấy cái gì vừa đổi, 150–250 ms, tắt khi máy bật giảm chuyển động. Thư viện `qrcode` vẽ mã QR. Người làm: Hiệu (phía thành viên), Khang (màn quản trị).
- **Backend** (thư mục `server/`, khung API làm ngày 03/10/2026): Node.js 22 + Express 5 như Checkpoint 1, TypeScript chạy thẳng bằng Node (không có bước build), zod kiểm tra dữ liệu gửi lên. Dữ liệu mẫu trong bộ nhớ. Người làm: Khoa; Khoa chốt lại cấu trúc.
- **Cơ sở dữ liệu:** PostgreSQL (từ 04/10/2026), bật bằng `DATABASE_URL` trong `server/.env`; không có thì dữ liệu mẫu nằm trong bộ nhớ. Cách chạy (có và không có Docker): `docs/postgresql.md`. Mỗi thao tác ghi trong một transaction; sổ quỹ chỉ được thêm, cơ sở dữ liệu tự chặn sửa và xóa. Đổi lược đồ: thêm file mới trong `server/db/migrations/`, sửa `server/src/db/tables.ts`, chạy `npm test` và `npm run test:db`.
- **Trợ lý bàn giao** (22/10/2026): chỉ hai việc gắn với bàn giao (tóm tắt cho ban mới, hỏi đáp trong Kho bàn giao), không phải chatbot chung. Cấu hình `AI_MODE=mock|real` trong `server/.env`, mặc định `mock`: bản mẫu **tính từ dữ liệu của CLB**, chưa dùng AI thật và màn phải ghi rõ như vậy; `real` chưa nối. Mỗi người chỉ hỏi được phần mình được thấy (thành viên thường không nhận gì từ phần tài khoản); không trả lời về tiền hay dữ liệu cá nhân; không tự gửi, không tự đổi dữ liệu. Khi nối AI thật: không gửi tên hay email thành viên ra ngoài, chỉ gửi vai trò; khóa API để ở `server/.env`. Chi phí và nhà cung cấp: chưa có.
- **Đăng nhập** bằng Google (luồng mã có PKCE), phiên bằng cookie httpOnly. Khóa Google để trong `server/.env`, không đưa vào repo. Chế độ demo (`AUTH_MODE=demo`) có tài khoản mẫu cho 7 vai (chủ nhiệm `quocbao`, thủ quỹ `thuha`, trưởng ban `giahuy`, thành viên `minhanh`, thành viên mới được mời `hoangnam`, sinh viên chưa vào CLB `baochau`, ban quản lý CLB của trường `thutrang`), mật khẩu chung `CauLong#2026`: máy chủ tự tạo, trang `/login` liệt kê dưới ô đăng nhập, bấm một dòng là điền sẵn (`web/src/lib/demo-accounts.ts`). Trang chọn vai `/demo` đã bỏ ngày 05/10/2026 (Hiệu chọn). Phần này không mang sang bản thật.
- **Tên tài khoản và mật khẩu** (Hiệu duyệt ngày 05/10/2026): đăng ký chỉ bằng Google; lần đầu xong thì hỏi đặt tên tài khoản và mật khẩu (có "Để sau"), sau đó đăng nhập được bằng tên tài khoản hoặc email kèm mật khẩu. Tên tài khoản khác tên hiển thị và khác email. Mật khẩu băm bằng scrypt kèm salt riêng, không bao giờ trả ra ngoài. Sai 5 lần thì khóa 15 phút. Quên mật khẩu thì đăng nhập Google rồi đặt mật khẩu mới. Luật ở `web/src/lib/account.ts`.
- **Trang đầu `/`** là trang giới thiệu cho người chưa đăng nhập, có hai video quay từ bản demo (`web/e2e/record-demo-videos.cjs`); người đã đăng nhập mở `/` thì về thẳng trang của mình (`web/src/proxy.ts`).

## Hợp đồng API giữa web và server

- Bản để đọc và duyệt: `docs/api.md` (bản nháp v0, chờ Khoa và nhóm giao diện duyệt). Bản cho code: `server/src/contract.ts`.
- Thêm hay đổi API: sửa `contract.ts` trước, rồi handler, rồi `docs/api.md`, rồi chạy `npm test` trong `server/`. Test báo lỗi nếu `docs/api.md` và `contract.ts` lệch nhau.
- Sau khi chốt (v1), đổi API nào thì báo cả nhóm, vì web và server cùng phải sửa.
- Mọi màn của web đã gọi API (xong ngày 04/10/2026); không màn nào còn chạy luật trong trình duyệt.

## Server trong `server/`

- Lệnh (chạy trong `server/`): `npm run dev` (http://localhost:4000/api/v1), `npm test`, `npm run typecheck`. Cấu hình: chép `.env.example` thành `.env`.
- Đọc `server/README.md` trước khi sửa: cấu trúc thư mục, cách đổi một API, những gì chưa có.
- Server dùng lại luật trong `web/src/lib` qua `server/src/domain.ts`. Không chép luật sang server thành bản thứ hai; sửa luật thì sửa ở `web/src/lib` và chạy test của cả hai bên.
- Kiểm tra quyền phải làm ở server (`server/src/access.ts`), không tin giao diện.
- Phía trường chỉ được nhận số tổng hợp; số tài khoản ngân hàng chỉ trả 4 số cuối. `server/src/responses.ts` là chỗ quyết định ai thấy trường nào.

## Bản demo trong `web/`

- Lệnh (chạy trong `web/`): `npm run dev` (http://localhost:3000), `npm test`, `npm run typecheck`, `npm run build`. Cần Node.js 22 trở lên.
- Bấm thử cả luồng bằng Playwright: `npm run e2e` trong `web/`, khi web và máy chủ đang chạy. Script ở `web/e2e/`, hướng dẫn ở `web/e2e/README.md`.
- Đọc `web/README.md` trước khi sửa: cấu trúc thư mục, màn nào ở đường dẫn nào, phần chỉ có ở bản demo, định dạng file sao kê, những chỗ code thêm ngoài bản vẽ.
- Dữ liệu là dữ liệu mẫu trong `web/src/lib/seed.ts`; máy chủ nạp vào bộ nhớ, hoặc vào PostgreSQL khi cơ sở dữ liệu còn trống. Số trong dữ liệu mẫu phải khớp `design/README.md` mục 8; đổi số thì sửa cả hai chỗ.
- Luật nghiệp vụ nằm trong `web/src/lib/` (selectors, actions, reconcile). Server dùng các file types, selectors, actions, reconcile, seed, format, text; các file này không được dùng API của trình duyệt (`document`, `window`, `localStorage`). Phần chỉ chạy trên trình duyệt để ở `browser-state.tsx`, `csv.ts`. Sửa luật thì chạy `npm test` ở cả `web/` và `server/`, và thêm test cho luật mới.
- Thêm trạng thái hay màn mà bản vẽ chưa có thì ghi vào mục "Chỗ code khác bản vẽ" của `web/README.md` để Hiệu duyệt.
- Mã QR đóng quỹ trong bản demo cố ý không phải mã VietQR thật và phải giữ dòng "Bản demo: mã này không chuyển tiền được". Không đưa số tài khoản thật vào dữ liệu mẫu.
- Phần chỉ có ở bản demo (bảng tài khoản mẫu ở trang đăng nhập, API đăng nhập nhanh `POST /auth/dev-login` cho script bấm thử, header `X-Demo-User`, ô "thử điểm danh với vai", nút đặt lại dữ liệu mẫu) không được mang sang bản thật.

## Nguyên tắc nghiệp vụ đã chốt (không tự đổi)

Nguồn: `../Phuong an nghiep vu.md` (N0–N9) và `../Ghi chu san pham cho Checkpoint 3.docx`.

**Tiền**
- CampusHub **không giữ tiền, không thu hộ**. Nghị định 52/2024 coi thu hộ, chi hộ là dịch vụ trung gian thanh toán, phải có giấy phép của Ngân hàng Nhà nước. Sản phẩm chỉ ghi sổ và tạo mã VietQR; tiền đi thẳng vào tài khoản của CLB hoặc thủ quỹ.
- **Không tự đọc giao dịch ngân hàng** (qua API hay dịch vụ báo số dư) trước khi nhóm hỏi luật. Đối soát trong MVP làm bằng file sao kê do thủ quỹ tự tải lên.
- Mã VietQR hiện tên chủ tài khoản. Màn đóng quỹ phải ghi rõ "Người nhận: [tên], thủ quỹ CLB…, nhiệm kỳ…".
- Sổ quỹ chỉ được thêm bút toán: không sửa, không xóa; muốn điều chỉnh thì thêm bút toán mới. Mọi thao tác đều lưu lịch sử.
- Không ai được tự duyệt khoản do chính mình đề xuất. Khi từ chối, người duyệt phải ghi lý do.
- Cho ghi tay khoản đóng bằng tiền mặt. Có luồng hoàn tiền khi thành viên chuyển nhầm.

**Bàn giao**
- Khi bàn giao phải chốt số dư, đổi tài khoản nhận quỹ, và chuyển quyền quản trị khỏi email trường của chủ nhiệm cũ (email trường bị thu hồi khi tốt nghiệp).
- Xuất được Excel bất cứ lúc nào.

**Điểm danh**
- Dùng QR đổi mã mỗi 30–60 giây, kèm điểm danh tay có ghi lại ai đã điểm danh tay.
- Không thu thập vị trí (GPS).
- Mỗi thiết bị chỉ điểm danh cho một người trong một sự kiện.

**Dữ liệu cá nhân** (Luật 91/2025, Nghị định 356/2025)
- Màn đồng ý không đánh dấu sẵn, tách theo từng mục đích, có dòng xác nhận đã đủ 16 tuổi. Lưu nhật ký đồng ý: ai, lúc nào, đồng ý với phiên bản nào.
- Thành viên tự xem, sửa, tải dữ liệu của mình, rút đồng ý, rời CLB và xóa dữ liệu. Lịch sử đóng quỹ của người đã xóa được ẩn danh, không xóa hẳn, để sổ quỹ không lệch.
- Ảnh chứng từ chỉ thủ quỹ và chủ nhiệm xem được.

**Thiết bị và cách dùng**
- Thành viên dùng web trên trình duyệt điện thoại, không cần cài app; ban điều hành dùng laptop.
- Link phải mở tốt trong trình duyệt nằm bên trong Zalo và Messenger. CampusHub không thay Zalo, chỉ gửi link vào nhóm có sẵn.
- Một tài khoản vào được nhiều CLB. Kế hoạch, thu quỹ và báo cáo tính theo học kỳ (3 kỳ mỗi năm).

## Không làm trong MVP

- Tính năng cho nhãn hàng, nhà tài trợ (trang cho nhãn hàng, đặt quảng cáo thật, tính tiền, xem báo cáo, nhắm đối tượng). **Ngoại lệ duy nhất (22/10/2026; sửa 30/10/2026 theo Hiệu): khung quảng cáo mẫu**, chỉ là chỗ trống có nhãn "Được tài trợ" với nội dung mẫu ở `/me` và Cộng đồng `/feed` (laptop từ 1200px: cột bên phải, dính theo khi cuộn; màn hẹp: một dòng xen sau tin thứ 4, rồi cứ 6 tin một lần; mỗi màn chỉ hiện một kiểu; không còn ở `/explore`); không pop-up, không che nội dung, không có ở màn tiền, màn đồng ý, lúc quét QR, bàn giao; chỉ ở bản miễn phí; nội dung giống nhau cho mọi người.
- Điểm danh sự kiện cấp trường (FPT đã có hệ thống điểm trải nghiệm).
- App cài đặt.
- Ví điện tử, giữ tiền, cổng thanh toán.
- Kết nối NGO và Thành Đoàn (Input Hub), gói VIP có thanh toán. Lý do: chưa có bằng chứng; chỉ là giả thuyết trong mô hình kinh doanh, chưa vào prototype (trang Bản trả phí chỉ là trang mô tả, chưa có giá).

## Không được đưa vào repo

`.gitignore` đã chặn sẵn phần lớn các mục dưới đây; dữ liệu thật dạng khác thì vẫn phải tự để ý. Thêm loại file mới cần giữ ngoài repo thì thêm vào `.gitignore`.

- File `.env`, khóa API, mật khẩu cơ sở dữ liệu, file khóa tải từ Google Cloud (`client_secret*.json`).
- Skill và file do skill tạo: `.claude/`, `.impeccable/`. Mỗi người tự cài theo `docs/tien-do-mvp.md`, mục 8.
- Bảng tính và file sao kê (`.csv`, `.xlsx`, `.xls`), trừ file mẫu trong thư mục `mau/`.
- Dữ liệu thật: danh sách thành viên thật, sao kê ngân hàng thật, câu trả lời khảo sát (`../CP2/Du lieu that`). Dữ liệu dùng để test phải là dữ liệu tự bịa, ghi rõ là dữ liệu mẫu.

## Tài liệu liên quan (ngoài repo)

- `../Phuong an nghiep vu.md`: nghiệp vụ giai đoạn 0, các màn hình tối thiểu.
- `../Ghi chu san pham cho Checkpoint 3.docx`: luật ngân hàng, dữ liệu cá nhân, QR động, thiết bị.
- Bản gốc wireframe MVP trên Claude Design: https://claude.ai/artifact/KnnMwatGJ9QjEsp5TC1BWc. Link riêng tư: người tạo phải chia sẻ thì người khác mới mở được. Bản sao trong repo nằm ở `design/`. Wireframe Checkpoint 1 cũ đã bỏ.
- `../CP2/Tien do Checkpoint 2.xlsx`: số liệu thị trường và kết quả khảo sát (không phải tài liệu code).
