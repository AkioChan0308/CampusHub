# Cây thư mục CampusHub

*Cập nhật ngày 22/10/2026.* File này dành cho người mới vào dự án giữa chừng, dev hay người không làm kỹ thuật đều đọc được. Mục tiêu: nhìn tên thư mục là biết nó làm gì, cho ai, và muốn sửa một thứ thì mở file nào.

Đọc theo thứ tự: mục 1 (repo có gì), mục 2 (luật đặt tên), mục 3 (trang web nào nằm ở đâu), rồi tra mục 6 khi cần sửa.

## 1. Repo có gì

```
campushub/
  README.md        giới thiệu sản phẩm, cách chạy thử, các luồng thử nhanh
  CLAUDE.md        luật làm việc cho Claude Code và cả nhóm: nghiệp vụ đã chốt, luật giao diện, những gì không đưa vào repo
  DESIGN.md        hệ thiết kế "Lịch bloc": màu, chữ, khoảng cách, thành phần, chuyển động
  PRODUCT.md       mô tả sản phẩm và người dùng (cho skill thiết kế Impeccable)
  docs/            tài liệu tiếng Việt
    tien-do-mvp.md      đang làm tới đâu, việc tiếp theo, quyết định đã duyệt (đọc đầu tiên); phần B: mô tả gốc đợt chỉnh sửa sau CP2
    luong-nguoi-dung.md luồng của từng nhóm người dùng, viết cho cả người không làm kỹ thuật; cuối file: kiểm thử bằng tay các luồng
    cay-thu-muc.md      file này
    api.md              hợp đồng API giữa web và máy chủ, bản để đọc và duyệt
    postgresql.md       cách chạy cơ sở dữ liệu (có và không có Docker)
    dang-nhap-google.md bật đăng nhập Google trên máy: tạo khóa, điền .env, ghép Gmail với vai
    ke-hoach-mvp.md     kế hoạch 10 tuần ban đầu
  design/          bản vẽ wireframe 16 màn, chỉ để tra nội dung, chữ và luật
    README.md           mỗi màn làm gì, luật nào hiện trên màn, những gì chưa vẽ
    screens/            16 màn dạng HTML (tạo lại bằng tools/, không sửa tay)
    tools/              script chuyển bản vẽ gốc thành screens/
    claude-design-source/ bản gốc tải từ Claude Design
  web/             trang web (Next.js): giao diện, và luật nghiệp vụ dùng chung với máy chủ
  server/          máy chủ API (Express) và phần lưu PostgreSQL
```

Hai thư mục `.claude/` và `.impeccable/` là skill và file do skill tạo. Mỗi người tự cài (`docs/tien-do-mvp.md`, mục 8); không có trong repo.

## 2. Luật đặt tên

Hiệu chốt ngày 05/10/2026. Chuẩn code do Khoa (Tech Lead) chốt cuối cùng, nên phần này **chờ Khoa xem**.

- **Mọi thứ thuộc code đặt tên tiếng Anh, rõ nghĩa:** thư mục, file, hàm, biến, component, đường dẫn web (URL) và tham số trên URL, id của ô nhập và tiêu đề (ví dụ `login-name`, `consent-keep`, `handover-bank`; câu báo lỗi dưới ô có đuôi `-error`, dòng gợi ý có đuôi `-hint`), tên script bấm thử và tên ảnh chụp. Ví dụ `excel-rows.ts` chứ không phải `exports.ts`; `money-flows.cjs` chứ không phải `nhom-tien.cjs`.
- **Phần mô tả cho người đọc viết tiếng Việt:** tài liệu trong `docs/`, README, chú thích trong code, chữ trên giao diện.
- **Không đặt tên theo đợt làm việc** ("nhóm 2", "group34", "fix-05-10"). Tên phải nói nội dung, vì đợt làm việc sẽ bị quên.
- **Trang web gom theo người dùng** bằng thư mục trong ngoặc (route group của Next.js): `(landing)`, `(auth)`, `(club-admin)`, `(member)`, `(student)`, `(school-staff)`. Thư mục trong ngoặc không xuất hiện trong URL.
- **Tên dễ nhầm thì tránh:** không trùng tên giữa web và máy chủ khi nghĩa khác nhau (trước đây có `store.tsx` ở web và `store.ts` ở máy chủ; nay web là `browser-state.tsx`), không dùng từ trùng từ khóa JavaScript (`exports`).
- **Ngoại lệ:**
  - Ba file migration đã chạy (`001_khoi_tao.sql`, `002_tien_cho_sao_ke.sql`, `003_tai_khoan.sql`) giữ tên cũ: máy chủ ghi tên file vào bảng `schema_migrations`, đổi tên thì nó chạy lại. File mới đặt tên tiếng Anh, ví dụ `004_handover_kit.sql`, `005_handover_steps.sql`.
  - `lich.css` và `components/lich/` lấy theo tên riêng của hệ thiết kế "Lịch bloc".
  - Tên màn trong bản vẽ (`BDH-…`, `TV-…`, `SV-…`, `NT-…`) giữ nguyên: đó là mã màn của bộ bản vẽ, tài liệu dùng khắp nơi.
  - Tham số trong URL đã đổi sang tiếng Anh ngày 05/10/2026: `?new=1`, `?reset=1` (/account), `?error=` (/login, mã lỗi `cancelled`, `expired`…), `?done=1`, `?checkedIn=1`, `?collection=`, `?create=1`, `?as=`.

## 3. Trang web nằm ở đâu (`web/src/app`)

Mỗi thư mục có `page.tsx` (nội dung trang) và `layout.tsx` (tên trên tab trình duyệt). Màn trong bản vẽ: `design/screens/<tên màn>.html`.

| URL | Thư mục | Ai dùng | Màn |
|---|---|---|---|
| `/` | `(landing)/` | khách chưa đăng nhập | Trang đầu, hai video demo |
| `/login` | `(auth)/login/` | mọi người | Đăng nhập (mật khẩu hoặc Google; bản demo có bảng tài khoản mẫu) |
| `/register` | `(auth)/register/` | người mới | Đăng ký bằng Google |
| `/account` | `(auth)/account/` | người đã đăng nhập | Đặt tên tài khoản và mật khẩu |
| `/clubs/[clubId]` | `(club-admin)/clubs/[clubId]/` | ban điều hành, laptop | BDH-TrangChu |
| `/clubs/[clubId]/members` | `…/members/` | ban điều hành | BDH-ThanhVien |
| `/clubs/[clubId]/members/add` | `…/members/add/` | ban điều hành | Thêm thành viên (chưa có bản vẽ) |
| `/clubs/[clubId]/events` | `…/events/` | ban điều hành | Các buổi (chưa có bản vẽ) |
| `/clubs/[clubId]/events/[eventId]/qr` | `…/events/[eventId]/qr/` | ban điều hành | BDH-QR, màn chiếu mã điểm danh |
| `/clubs/[clubId]/collections` | `…/collections/` | ban điều hành | Danh sách đợt thu (chưa có bản vẽ) |
| `/clubs/[clubId]/collections/new` | `…/collections/new/` | ban điều hành | Tạo đợt thu (chưa có bản vẽ) |
| `/clubs/[clubId]/collections/[collectionId]` | `…/collections/[collectionId]/` | ban điều hành | BDH-DotThu |
| `/clubs/[clubId]/reconcile` | `…/reconcile/` | thủ quỹ, chủ nhiệm | BDH-DoiSoat |
| `/clubs/[clubId]/expenses` | `…/expenses/` | ban điều hành | BDH-DuyetChi |
| `/clubs/[clubId]/budget` | `…/budget/` | ban điều hành | BDH-DuTru |
| `/clubs/[clubId]/handover` | `…/handover/` | chủ nhiệm; chủ nhiệm mới ở bước 6 | BDH-BanGiao, 7 bước |
| `/clubs/[clubId]/handover-kit` | `…/handover-kit/` | ban điều hành xem và sửa | Kho bàn giao: biểu mẫu, quy trình, tài khoản (chưa có bản vẽ) |
| `/clubs/[clubId]/tasks` | `…/tasks/` | ban điều hành | Việc cần làm (chưa có bản vẽ) |
| `/clubs/[clubId]/posts` | `…/posts/` | ban điều hành | Bảng tin của CLB: đăng tin, xem tin ở mọi trạng thái (chờ trường duyệt hiện mờ) (`docs/mo-ta-bang-tin-chung.md`) |
| `/clubs/[clubId]/paid-plan` | `…/paid-plan/` | ban điều hành | Bản trả phí: trang mô tả một ý tưởng, chưa có giá (chưa có bản vẽ) |
| `/me` | `(member)/me/` | thành viên, điện thoại | TV-CuaToi ("Của tôi") |
| `/me/attendance` | `(member)/me/attendance/` | thành viên | Tab Điểm danh, lịch sử điểm danh |
| `/me/tasks` | `(member)/me/tasks/` | thành viên | Việc của tôi (chưa có bản vẽ) |
| `/feed` | `(student)/feed/` | mọi người đã đăng nhập | Trang chung: tin của các CLB, dữ liệu mẫu; logo CampusHub ở mọi màn dẫn về đây |
| `/feed/[postId]` | `(student)/feed/[postId]/` | mọi người đã đăng nhập | Chi tiết một tin (dữ liệu mẫu) |
| `/me/pay`, `/me/pay/[collectionId]` | `(member)/me/pay/` | thành viên | TV-DongQuy (tab Quỹ) |
| `/invite/[code]` | `(member)/invite/[code]/` | người được mời | TV-LoiMoi |
| `/checkin` | `(member)/checkin/` | thành viên quét mã | TV-DiemDanh (link trong mã QR) |
| `/explore` | `(student)/explore/` | sinh viên chưa vào CLB | SV-DanhSach ("Tìm CLB") |
| `/explore/[clubId]` | `(student)/explore/[clubId]/` | sinh viên | SV-DonXinVao |
| `/clubs/new` | `(student)/clubs/new/` | ai đã đăng nhập | Tạo CLB mới (chưa có bản vẽ) |
| `/school` | `(school-staff)/school/` | ban quản lý CLB của trường, laptop | NT-TongQuan |
| `/school/clubs/[clubId]` | `(school-staff)/school/clubs/[clubId]/` | nhà trường | NT-ChiTietCLB |
| `/school/posts` | `(school-staff)/school/posts/` | nhà trường | Duyệt tin của CLB trước khi hiện trên Cộng đồng (chưa có bản vẽ) |

`…/` là viết tắt của `(club-admin)/clubs/[clubId]/`. `[clubId]`, `[code]`… là phần thay đổi trong URL, ví dụ `cau-long-san-nha`.

Hai tên URL hay gây thắc mắc: `/me` là trang "Của tôi" của thành viên; `/explore` là trang "Tìm CLB" của sinh viên. Hai tên này giữ nguyên vì là URL đã dùng trong link mời và link QR gửi qua Zalo.

File chung ở gốc `web/src/app/`:
- `layout.tsx`: khung của mọi trang (font, thông báo ngắn, nạp dữ liệu).
- `error.tsx`, `not-found.tsx`: trang lỗi và trang không tìm thấy.
- `lich.css`: toàn bộ kiểu của hệ "Lịch bloc". `globals.css`: nền cho thẻ HTML và theme của shadcn/ui.

## 4. Phần còn lại của `web/`

```
web/
  src/
    proxy.ts          chạy trước khi vẽ trang: người đã đăng nhập mở / thì chuyển về trang của mình
    api/              gọi máy chủ
      client.ts           gửi yêu cầu, lỗi trả về dạng ApiError
      queries.ts          các truy vấn dùng chung, khóa lưu tạm (TanStack Query)
      after-login.ts      trang mở sau khi đăng nhập, theo vai; kiểm tra link "next" an toàn
      excel-rows.ts       dữ liệu các bảng xuất Excel
    components/
      lich/               thành phần của hệ "Lịch bloc": tờ lịch (Leaf), khung laptop (BoardFrame, SchoolFrame),
                          khung điện thoại (PhoneFrame), trang chặn và lỗi (Gate, NoClub), đầu trang (PageTop),
                          hộp hỏi lại (Confirm), nhãn đóng quỹ (PayTag), chuyển động và khung xương (motion.tsx)
      ui/                 component của shadcn/ui
      Icon.tsx, Qr.tsx, CopyButton.tsx, url.ts, money-input.ts, Providers.tsx, MotionProvider.tsx
    lib/              dữ liệu và luật nghiệp vụ, không dính tới giao diện; máy chủ dùng lại các file này
      types.ts            kiểu dữ liệu
      seed.ts             dữ liệu mẫu (số phải khớp design/README.md mục 8)
      selectors.ts        tính số (số dư, đợt thu, dự trù) và quyền theo vai
      actions.ts          thao tác đổi dữ liệu: duyệt đơn, điểm danh, ghi tiền, duyệt chi…
      reconcile.ts        luật đối soát sao kê
      account.ts          luật tên tài khoản và mật khẩu
      demo-accounts.ts    tài khoản mẫu của bản demo
      browser-state.tsx   phần chỉ chạy trên trình duyệt: vai đang chọn, mã thiết bị điểm danh
      format.ts, text.ts, csv.ts, members-file.ts, utils.ts
      *.test.ts           test, chạy bằng npm test
  public/video/       hai video demo của trang đầu
  e2e/                script bấm thử bằng Playwright (npm run e2e); bảng mô tả ở e2e/README.md
    run-all.cjs           chạy lần lượt mọi script
    common.cjs            phần dùng chung: địa chỉ web, mở Chrome, thư mục ảnh
    smoke.cjs             luồng chính, đi qua mọi vai
    auth.cjs              trang đầu, đăng nhập, tài khoản mẫu, đặt mật khẩu
    money-flows.cjs       đợt thu, đối soát, duyệt chi, dự trù
    members-qr-handover.cjs   thành viên, chiếu QR, bàn giao
    member-student-school.cjs Của tôi, lời mời, tìm CLB, nhà trường
    club-setup.cjs        tạo CLB và dữ liệu từ đầu
    regressions.cjs       các lỗi đã sửa, chạy lại để chắc không tái phát
    skeleton-*.cjs        đo khung xương lúc tải
    record-demo-videos.cjs    quay lại hai video của trang đầu
    samples/              dữ liệu mẫu tự đặt cho test (file danh sách thành viên)
    screenshots/          ảnh chụp khi chạy script (không đưa vào repo)
```

## 5. `server/`

```
server/
  src/
    index.ts          chạy máy chủ
    app.ts            dựng Express từ bảng API
    contract.ts       hợp đồng API: danh sách API và kiểu dữ liệu (bản để đọc: docs/api.md)
    handlers/         mỗi API một hàm, chia theo người gọi:
      auth.ts             đăng nhập, đăng xuất
      me.ts               người đã đăng nhập: tài khoản, Của tôi, đóng quỹ, điểm danh, dữ liệu của tôi
      explore.ts          sinh viên: tìm CLB, gửi đơn, lời mời
      board.ts            ban điều hành: thành viên, buổi, mã QR, bàn giao 7 bước
      kit.ts              kho bàn giao: biểu mẫu, quy trình, tài khoản
      tasks.ts            việc cần làm
      ai.ts               trợ lý bàn giao: tóm tắt, hỏi đáp trong kho, lưu bản tóm tắt vào biên bản
      setup.ts            tạo dữ liệu từ đầu: tạo CLB, thêm thành viên, buổi, đợt thu
      money.ts            đợt thu, đối soát, khoản chi, dự trù
      school.ts           nhà trường
      system.ts           kiểm tra máy chủ, đặt lại dữ liệu mẫu
    responses.ts      đổi dữ liệu nội bộ thành dữ liệu trả về; quyết định ai thấy trường nào
    access.ts         kiểm tra quyền
    schemas.ts        kiểm tra dữ liệu gửi lên
    domain.ts         lấy luật nghiệp vụ từ web/src/lib
    store.ts, sessions.ts, accounts.ts   dữ liệu, phiên đăng nhập, tài khoản (bản trong bộ nhớ)
    db/               bản lưu PostgreSQL của các phần trên
    ai.ts             tầng trợ lý (AI_MODE=mock|real): bản mẫu tính từ dữ liệu của CLB; bản thật chưa nối
    qr.ts, google.ts, password.ts, demo-accounts.ts, config.ts, errors.ts
  db/migrations/      lược đồ cơ sở dữ liệu, chạy theo thứ tự số
  test/               test máy chủ (npm test; npm run test:db chạy trên PostgreSQL)
```

Chi tiết từng file: `server/README.md`.

## 6. Muốn sửa gì thì mở đâu

| Muốn | Mở |
|---|---|
| Đổi chữ hay bố cục một màn | `page.tsx` của màn đó (bảng ở mục 3) |
| Đổi màu, chữ, nút dùng chung | `web/src/app/lich.css`; luật ở `DESIGN.md` |
| Đổi luật nghiệp vụ (tiền, quyền, đối soát, dự trù) | `web/src/lib/` (`actions.ts`, `selectors.ts`, `reconcile.ts`); chạy `npm test` ở cả `web/` và `server/` |
| Thêm hay đổi một API | `server/src/contract.ts` → `server/src/handlers/` → `docs/api.md` → `npm test` trong `server/` |
| Ai được xem trường dữ liệu nào | `server/src/responses.ts`; quyền ở `server/src/access.ts` |
| Đổi cơ sở dữ liệu | thêm file mới trong `server/db/migrations/`, sửa `server/src/db/tables.ts` |
| Dữ liệu mẫu | `web/src/lib/seed.ts` (khớp `design/README.md` mục 8) |
| Tài khoản mẫu của bản demo | `web/src/lib/demo-accounts.ts` |
| Trang mở sau khi đăng nhập | `web/src/api/after-login.ts` |
| Bảng xuất Excel | `web/src/api/excel-rows.ts` |
| Video ở trang đầu | quay lại bằng `web/e2e/record-demo-videos.cjs` (cách chạy ở `web/e2e/README.md`) |
| Thêm bài bấm thử | `web/e2e/`, rồi thêm tên vào `run-all.cjs` |

## 7. Từ tiếng Anh trong code nghĩa là gì

| Trong code | Nghĩa |
|---|---|
| club-admin, board | ban điều hành CLB (chủ nhiệm, phó, thủ quỹ, trưởng ban) |
| member | thành viên CLB |
| student | sinh viên chưa vào CLB |
| school-staff, school | ban quản lý CLB của trường |
| landing | trang đầu, trang giới thiệu |
| auth | đăng nhập, đăng ký, tài khoản |
| collection | đợt thu quỹ |
| reconcile | đối soát sao kê ngân hàng |
| expense | khoản chi |
| budget | dự trù kỳ |
| handover | bàn giao nhiệm kỳ |
| kit, handover-kit | kho bàn giao (biểu mẫu, quy trình, tài khoản của CLB) |
| ai, assistant | trợ lý bàn giao (bản mẫu) |
| sponsored | khung quảng cáo mẫu |
| paid-plan | bản trả phí (trang mô tả) |
| task | việc cần làm |
| event | buổi sinh hoạt |
| checkin, attendance | điểm danh |
| invite | lời mời vào CLB |
| application | đơn xin vào CLB |
| ledger | sổ quỹ |
| consent | đồng ý cho lưu dữ liệu |
| seed | dữ liệu mẫu |
| skeleton | khung xương lúc đang tải |
| Leaf | tờ lịch |
| Gate | trang chặn (sai vai, chưa vào CLB, lỗi) |
| lich | tên hệ thiết kế "Lịch bloc" |
