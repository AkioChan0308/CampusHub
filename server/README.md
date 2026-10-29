# CampusHub server: khung API

Đây là server (backend) của CampusHub, viết bằng Node.js + Express như Checkpoint 1 đã chọn, dùng TypeScript. Bản này dùng để **chốt hợp đồng API giữa web và server**: đủ 49 API cho 16 màn đã vẽ, chạy được và có test. Phần còn thiếu để thành bản thật nằm ở mục "Chưa có".

- Hợp đồng API, bản để đọc và duyệt: `../docs/api.md`.
- Hợp đồng API, bản cho code (kiểu dữ liệu của từng API): `src/contract.ts`. Web import kiểu từ file này khi nối API.
- Cấu trúc thư mục và cách đặt tên ở đây là đề xuất; Khoa (Tech Lead) chốt lại.

## Chạy thử

Cần Node.js 22.12 trở lên. Node chạy thẳng file TypeScript nên không có bước build.

```bash
cd server
npm install
npm run dev          # http://localhost:4000/api/v1, tự chạy lại khi sửa code
npm test             # 96 test: gọi từng API qua HTTP (dữ liệu trong bộ nhớ), kèm test phần lưu PostgreSQL (PGlite)
npm run test:db      # cũng các test đó, nhưng dữ liệu và phiên lưu trong PostgreSQL (PGlite, không cần cài gì)
npm run typecheck
```

**Lưu dữ liệu bằng PostgreSQL:** đặt `DATABASE_URL` trong `.env`. Chạy PostgreSQL bằng Docker (`docker compose up -d` trong thư mục này) hoặc cài thẳng vào máy: xem `../docs/postgresql.md`. Không đặt `DATABASE_URL` thì dữ liệu mẫu chỉ nằm trong bộ nhớ, tắt máy chủ là mất.

Gọi thử, giả làm chủ nhiệm (mã `a001`):

```bash
curl http://localhost:4000/api/v1/clubs/cau-long-san-nha/dashboard -H "X-Demo-User: a001"
```

Cấu hình đọc từ file `.env` (chép từ `.env.example`): cổng, chế độ đăng nhập, khóa ký mã QR, địa chỉ của web, khóa đăng nhập Google, email Google thật ghép với vai mẫu (`LOGIN_AS`), PostgreSQL (`DATABASE_URL`, `POSTGRES_PASSWORD`).

Đăng nhập: Google (cần khóa trong `.env`), hoặc ở chế độ demo thì đăng nhập nhanh `POST /auth/dev-login` bằng mã người mẫu. Server giữ phiên bằng cookie httpOnly; chi tiết ở `../docs/api.md`, mục Đăng nhập.

## Cấu trúc thư mục

Bản đầy đủ cho cả repo: `../docs/cay-thu-muc.md`.

```
src/
  contract.ts     hợp đồng API: bảng ENDPOINTS và kiểu dữ liệu gửi lên, trả về
  app.ts          dựng Express từ bảng ENDPOINTS; đăng nhập, CORS, trả lỗi
  index.ts        chạy máy chủ
  handlers/       mỗi API một hàm, chia theo người gọi: auth (đăng nhập), me (thành viên), explore (sinh viên tìm CLB),
                  board (ban điều hành: thành viên, buổi, QR, bàn giao 7 bước), kit (kho bàn giao), tasks (việc cần làm), ai (trợ lý bàn giao), setup (tạo CLB, thêm thành viên, buổi, đợt thu),
                  money (đợt thu, đối soát, chi), school (nhà trường), system (health, đặt lại dữ liệu mẫu)
  responses.ts    đổi dữ liệu nội bộ thành đúng dạng trả về; quyết định ai thấy trường nào
  access.ts       kiểm tra quyền: ban điều hành, vai trò, thành viên, cán bộ của trường
  schemas.ts      kiểm tra dữ liệu gửi lên (zod), báo lỗi tiếng Việt
  qr.ts           ký và kiểm tra mã QR điểm danh (HMAC-SHA256, đổi mỗi 30 giây)
  store.ts        kho dữ liệu: giao diện Store và bản chỉ trong bộ nhớ
  domain.ts       lấy luật nghiệp vụ từ ../web/src/lib
  config.ts       đọc biến môi trường
  sessions.ts     phiên đăng nhập và lượt đăng nhập Google đang dở (bản trong bộ nhớ)
  google.ts       đăng nhập Google: link sang Google, đổi mã lấy email
  accounts.ts     tên tài khoản, mã băm mật khẩu, số lần sai và giờ hết khóa (bản trong bộ nhớ); tách khỏi AppState như phiên đăng nhập
  password.ts     băm và kiểm tra mật khẩu (scrypt, salt riêng cho mỗi người)
  demo-accounts.ts  chế độ demo: tạo tài khoản mẫu của 7 vai
  db/             lưu bằng PostgreSQL (khi có DATABASE_URL)
    client.ts     kết nối (thư viện pg), transaction
    migrate.ts    chạy các file trong db/migrations chưa chạy
    tables.ts     đổi qua lại giữa AppState và các bảng
    state.ts      nạp toàn bộ dữ liệu; ghi phần thay đổi sau mỗi thao tác
    store.ts      kho dữ liệu lưu PostgreSQL (giữ một bản trong bộ nhớ để đọc nhanh)
    sessions.ts   phiên đăng nhập lưu PostgreSQL (chỉ lưu mã băm của cookie)
    accounts.ts   tài khoản đăng nhập bằng mật khẩu lưu PostgreSQL (bảng accounts)
db/migrations/    lược đồ SQL: 004_handover_kit.sql (kho bàn giao), 005_handover_steps.sql (bàn giao 7 bước, việc cần làm), 006_ai_assistant.sql (trợ lý bàn giao), 007_posts.sql (tin của CLB trên Cộng đồng), 008_mentor_confirm.sql (mentor xác nhận biên bản bàn giao), 001_khoi_tao.sql (bảng, luật chỉ-được-thêm của sổ quỹ), 002_tien_cho_sao_ke.sql, 003_tai_khoan.sql (bảng accounts).
                  Tên file đã chạy không đổi được (máy chủ ghi tên vào bảng schema_migrations); file mới đặt tên tiếng Anh, ví dụ 004_refunds.sql
docker-compose.yml  PostgreSQL 17 cho máy phát triển
test/             test gọi API qua HTTP với đồng hồ cố định 07:40 ngày 03/10/2026; pglite.ts: PostgreSQL chạy trong Node cho test
```

Mỗi API trong `contract.ts` phải có đúng một handler; thiếu thì `npm run typecheck` báo lỗi. Test `contract.test.ts` kiểm tra `docs/api.md` liệt kê đúng các API trong `contract.ts`.

## Luật nghiệp vụ dùng chung với web

Luật (đối soát sao kê, dự trù, duyệt chi, quyền theo vai, dữ liệu mẫu) đang nằm ở `../web/src/lib`, vì bản demo giao diện chạy luật ngay trong trình duyệt. Server dùng lại đúng các file đó qua `src/domain.ts`, để không có hai bản luật lệch nhau. Test luật vẫn nằm bên web (`npm test` trong `web/`).

Khi web chuyển sang gọi API thì chuyển các file luật sang `server/src/domain/` và chỉ sửa đường dẫn trong `domain.ts`.

## Đổi một API

1. Sửa `src/contract.ts`: bảng `ENDPOINTS` và kiểu `Api`.
2. Sửa handler; `npm run typecheck` chỉ ra chỗ còn thiếu.
3. Sửa `../docs/api.md`.
4. Chạy `npm test`.
5. Báo nhóm giao diện, vì web cũng phải sửa.

## Đã đổi ngày 03/10/2026 (báo Khoa)

Khi nối web với server, Hiệu cho sửa server và ghi lại ở đây để Khoa duyệt:
- **Đăng nhập:**
  - Đăng nhập Google (luồng mã có PKCE), đăng nhập nhanh `POST /auth/dev-login` (chỉ ở chế độ demo) và `POST /auth/logout`.
  - Phiên bằng cookie httpOnly. Code ở `src/sessions.ts`, `src/google.ts`, `src/handlers/auth.ts`.
  - `GET /health` có thêm `googleLogin`.
- **Duyệt chi và đơn xin vào:** duyệt khoản chi nhận `note` (không bắt buộc) và ghi vào lịch sử. Đơn xin vào bị từ chối thì gửi lại được.
- **Đối soát sao kê:**
  - `POST .../statements` trả thêm `skippedDates`: số dòng bị bỏ vì ngày không có thật, ví dụ 31/02.
  - `GET .../reconciliation` trả thêm `latest.duplicates`: số giao dịch đã có ở lần tải trước, nằm trong `ignored`.
- **Luật dùng chung trong `web/src/lib`:**
  - `parseStatementDate` trả null cho ngày giờ không có thật; `readStatement` đếm các dòng đó.
  - `DUPLICATE_TXN` là lý do của giao dịch trùng.
  - `latestStatement` lấy file thêm vào sau khi hai file cùng giờ tải. Trước đây lấy nhầm file cũ; test với đồng hồ cố định làm lộ ra.
- **Khởi động:** `src/index.ts` in dòng nhắc khi chưa có khóa Google.
- **Danh sách thành viên:** `GET /clubs/:clubId/members` trả thêm `payment.method` (chuyển khoản hay tiền mặt), để màn Thành viên ghi "Đã đóng · tiền mặt" như bản vẽ.
- **Header `X-Demo-User` (chỉ chế độ demo):** giờ được ưu tiên hơn cookie phiên. Lý do: "thử điểm danh với vai" ở màn chiếu QR mở một tab mới để điểm danh bằng vai thành viên. Cookie dùng chung cho mọi tab, nên nếu tab mới đăng nhập bằng cookie thì tab chiếu QR của chủ nhiệm cũng đổi người. Chế độ google vẫn bỏ qua header này.
- **Tạo dữ liệu từ đầu (04/10/2026, mô tả màn được Hiệu duyệt):**
  - 9 API mới:
    - `POST /clubs`: ai đã đăng nhập cũng tạo được, người tạo là chủ nhiệm. Mã CLB lấy từ tên, không dấu; mã `new` để dành cho trang web `/clubs/new`.
    - `POST /clubs/:clubId/members`, `PUT /clubs/:clubId/members/:personId`.
    - `POST`, `PUT`, `DELETE /clubs/:clubId/events/...`.
    - `GET`, `POST /clubs/:clubId/collections`, `PUT /clubs/:clubId/collections/:collectionId`.
    - Chi tiết từng API ở `../docs/api.md`. Hàm xử lý nằm ở `src/handlers/setup.ts`.
  - Bảng API nhận thêm phương thức `DELETE` (`app.ts`, CORS).
  - Quyền mới `assignRole` (chỉ chủ nhiệm) trong `web/src/lib/selectors.ts`.
  - Luật mới trong `web/src/lib/actions.ts`:
    - `createClub`, `addMembers`, `updateMember`;
    - `createEvent`, `updateEvent`, `deleteEvent`;
    - `createCollection`, `updateCollection`;
    - `nextMemberCode` (dùng chung với duyệt đơn).
    - Thêm `slugify` trong `text.ts`; đọc file thành viên ở `members-file.ts`, có test.
  - Đổi hành vi:
    - `clubCollection` lấy đợt thu tạo gần nhất (trước đây lấy đợt đầu tiên).
    - `GET /dashboard` trả thêm `setup` (số thành viên, số buổi).
    - `GET /events` trả thêm số người đã điểm danh mỗi buổi và `memberCount`.
    - `GET /members` trả `inviteCode` của người chưa nhận lời mời.
    - Người nhận tiền của đợt thu (`collection.receiver`, `transfer.receiver`) có thêm `role`: vai hiện tại trong CLB, để màn ghi đúng "Thủ quỹ…" hay "Chủ nhiệm…".
    - Tạo hay sửa buổi đã qua giờ kết thúc thì báo lỗi 400.
  - Mã lời mời của người được thêm là ngẫu nhiên (`moi-` + 8 ký tự). Mã của người được duyệt đơn vẫn là `moi-<mã người>` như trước.
  - Test: `test/setup.test.ts` (5 test).
- **PostgreSQL (04/10/2026, Hiệu chọn cách "giữ luật, lưu theo bảng"):**
  - Có `DATABASE_URL` thì dữ liệu và phiên đăng nhập lưu trong PostgreSQL; không có thì như cũ (trong bộ nhớ). Hợp đồng API và handler không đổi.
  - Cách làm:
    - Luật trong `web/src/lib` vẫn chạy trên AppState.
    - `src/db/store.ts` giữ một bản AppState trong bộ nhớ. Sau mỗi thao tác, nó so bản trước và bản sau, rồi ghi đúng các dòng đã đổi trong một transaction. Các lần ghi đi lần lượt.
    - `app.ts` chờ phần ghi của chính yêu cầu xong rồi mới trả lời.
    - Ghi lỗi thì trả 500 và bản trong bộ nhớ quay về bản đã lưu.
  - Giới hạn: chỉ một máy chủ cho một cơ sở dữ liệu. Muốn chạy nhiều máy chủ thì phải đổi sang đọc thẳng từ cơ sở dữ liệu ở mỗi API; Khoa quyết định khi cần.
  - Lược đồ: `db/migrations/001_khoi_tao.sql`.
    - Khóa là mã có sẵn trong dữ liệu; nhật ký đồng ý dùng số thứ tự làm khóa.
    - Trigger chặn sửa, xóa sổ quỹ (`ledger`) và lịch sử khoản chi.
    - Nhật ký đồng ý chỉ được ghi ngày rút một lần.
    - Ràng buộc "một điện thoại một người mỗi buổi" và "từ chối phải có lý do".
  - `Store` và `Sessions` có thêm `persisted()`. `index.ts` khởi động bất đồng bộ và đóng kết nối khi tắt.
  - Thêm thư viện: `pg` 8.23.1; cho test: `@types/pg`, `@electric-sql/pglite` 0.5.8.
  - Test:
    - `test/db.test.ts` (5 test, chạy trong `npm test`);
    - `npm run test:db` chạy cả 57 test trên PGlite.
  - Đã thử với thư viện `pg` qua TCP: máy chủ bị tắt hẳn rồi bật lại, dữ liệu và phiên còn nguyên. Chưa thử với PostgreSQL chạy bằng Docker, vì máy làm chưa bật Docker Desktop.
- **Học kỳ và khoản chờ mentor (04/10/2026):** `GET /clubs` và `GET /school/clubs` trả thêm `term` (học kỳ đang xem; bản demo lấy học kỳ của CLB đầu tiên, vì mọi CLB cùng một học kỳ). Mỗi dòng của `GET /school/clubs` (và `club` của `GET /school/clubs/:clubId`) có thêm `waitingMentor`: số khoản của CLB đó đang chờ mentor duyệt. Màn danh sách CLB và màn nhà trường cần học kỳ cho dòng phụ; mục "Khoản chờ duyệt" trên thanh bên của trường mở thẳng CLB có khoản chờ. Khi có dữ liệu thật thì `term` nên là học kỳ hiện tại của trường.
- **Sửa lỗi tiền (05/10/2026):** luật nằm trong `web/src/lib`, test tái hiện ở `web/src/lib/money-regressions.test.ts`.
  - **Nhiều đợt thu:** xếp loại sao kê xét mã đợt (`codePrefix`). Dòng ghi mã của đợt khác thì "Thuộc đợt thu khác: …", không vào đợt đang đối soát. CLB có nhiều đợt mà dòng không ghi mã đợt thì phải gán tay ("Không ghi mã đợt thu"). Dòng trùng chỉ xét trong cùng đợt; dòng đã ghi vào sổ ở đợt khác thì "Đã ghi ở đợt thu khác: …". API không đổi: màn đối soát gửi đúng `collectionId`.
  - **Ghi nhận tay rồi sao kê về khác số tiền:** `Payment` có thêm `awaitingStatement` (tiền chuyển khoản đã ghi nhận tay, chưa thấy trong sao kê). Gán tay dòng sao kê cho người đó thì phần này chỉ nối, chỉ phần chênh được ghi vào sổ quỹ. Lý do của dòng: "Đã ghi nhận tay …, sao kê …". Lược đồ: `db/migrations/002_tien_cho_sao_ke.sql` thêm cột `payments.awaiting_statement`.
  - **Dự trù:** "còn phải thu" cộng mọi đợt thu của kỳ. `GET /clubs/:clubId/budget` trả thêm `forecast.collections` (số đợt thu của kỳ); `forecast.fee` là mức thu khi kỳ chỉ có một đợt, nhiều đợt thì 0.
  - **Mentor không tự duyệt:** `POST /school/expenses/:expenseId/approve` và `/reject` trả 403 `SELF_APPROVAL` khi mentor là người đề xuất khoản đó.
  - **Thành viên mới:** duyệt đơn và thêm thành viên chỉ tạo khoản phải đóng ở đợt thu của kỳ hiện tại mà chưa quá hạn (`openCollections`), không tạo ở đợt cũ. `addMembers` nhận thêm thời điểm.
  - Test: server 63 (thêm 1 test mentor), `db.test.ts` có thêm bước ghi nhận tay để kiểm tra cột mới còn sau khi khởi động lại.
- **Đăng nhập bằng tên tài khoản và mật khẩu (05/10/2026, Hiệu duyệt mô tả):**
  - Đăng ký chỉ bằng Google (email đã được Google xác minh). Lần đầu đăng nhập Google, `GET /auth/google/callback` chuyển về `/account?new=1&next=<trang cần mở>` để web hỏi đặt tên tài khoản và mật khẩu (web có nút "Để sau").
  - 2 API mới:
    - `POST /auth/login`: `login` (tên tài khoản hoặc email) và `password`. Đúng thì cấp phiên như đăng nhập Google, trả về giống `GET /me`. Sai tên hay sai mật khẩu đều 401 cùng một câu. Người chưa có tài khoản cũng chạy một lần băm giả, để thời gian trả lời không lộ tên tài khoản nào có thật.
    - `PUT /me/account`: `name` (tên hiển thị), `username`, `password`, và `currentPassword` khi đã có mật khẩu. Lỗi từng ô ở `details.fields`; tên tài khoản đã có người dùng thì 409.
  - `GET /me` (và các API trả `MeRes`) có thêm `account: { username?, hasPassword }`. Không API nào trả mật khẩu hay mã băm.
  - Luật (dùng chung với web, `web/src/lib/account.ts`): tên tài khoản 3–30 ký tự `a-z 0-9 . _`, lưu chữ thường, không trùng; mật khẩu ít nhất 10 ký tự, có chữ hoa, chữ số, ký tự đặc biệt, không chứa tên tài khoản hay phần trước @ của email. Thêm `setPersonName` trong `web/src/lib/actions.ts`.
  - Băm bằng scrypt (N = 2^17, r = 8, p = 1), salt ngẫu nhiên 16 byte, lưu dạng `scrypt$N$r$p$salt$hash`, so bằng `timingSafeEqual`.
  - Sai mật khẩu 5 lần liền thì khóa đăng nhập bằng mật khẩu 15 phút: 429 `TOO_MANY_ATTEMPTS`, `details.until`. Đăng nhập Google vẫn dùng được. Nhập sai mật khẩu hiện tại ở `PUT /me/account` cũng tính là một lần sai.
  - Quên mật khẩu: đăng nhập Google; trong 15 phút sau đó `PUT /me/account` không cần `currentPassword`. Giờ đăng nhập Google gần nhất chỉ giữ trong bộ nhớ.
  - Lưu: `src/accounts.ts` (trong bộ nhớ), `src/db/accounts.ts` (PostgreSQL, ghi lần lượt; `app.ts` chờ phần ghi của chính yêu cầu như kho dữ liệu). Bảng `accounts` ở `db/migrations/003_tai_khoan.sql`, không nối khóa ngoại sang `persons`. `POST /demo/reset` xóa cả tài khoản.
  - **Tài khoản mẫu (05/10/2026, Hiệu yêu cầu, thay trang chọn vai):** ở chế độ demo, máy chủ tạo tài khoản cho 7 người mẫu (danh sách và mật khẩu chung ở `web/src/lib/demo-accounts.ts`, xuất qua `domain.ts`): lúc khởi động thì chỉ tạo người chưa có tài khoản (`src/index.ts`), `POST /demo/reset` thì xóa hết rồi tạo lại (`src/handlers/system.ts`). Code ở `src/demo-accounts.ts`; mật khẩu mẫu chỉ băm một lần. `POST /auth/dev-login` vẫn còn cho script bấm thử.
  - Test: `test/account.test.ts` (8 test; người thử là a018 vì a017 có tài khoản mẫu; thêm kiểm tra đặt lại dữ liệu thì tạo lại đủ 7 tài khoản mẫu); `auth.test.ts` sửa theo đường chuyển mới sau lần đầu đăng nhập Google; `db.test.ts` kiểm tra tài khoản còn sau khi khởi động lại. Cả bộ: 71/71, `npm run test:db` 71/71.
  - **Lỗi đăng nhập Google gửi mã, không gửi câu:** `GET /auth/google/start` và `/callback` chuyển về `/login?error=<mã>` (`LoginErrorCode` trong `contract.ts`: `google-disabled`, `cancelled`, `expired`, `google-failed`, `email-unverified`). Trước đây gửi nguyên câu tiếng Việt và web hiện thẳng câu đó, nên ai cũng gửi được link kèm câu báo giả trong khung đỏ của trang đăng nhập. Web đổi mã thành câu có sẵn; mã lạ thì hiện một câu chung.

## Đã đổi ngày 22/10/2026 (báo Khoa)

Theo `../docs/tien-do-mvp.md` (phần B) (Hiệu giao). Hợp đồng API mới chờ Khoa xem sau, như Hiệu đã chọn.
- **Kho bàn giao** (nhóm A): 10 API `/clubs/:clubId/handover-kit...` (đọc; thêm, sửa, xóa biểu mẫu, quy trình, tài khoản). Code ở `src/handlers/kit.ts`.
  - Quyền sửa mới `kit` (chủ nhiệm, phó chủ nhiệm, trưởng ban) trong `web/src/lib/selectors.ts`.
  - **Kho không lưu mật khẩu.** Link biểu mẫu chỉ nhận `http(s)://`.
  - `GET` mở cho thành viên đã nhận lời mời; `src/responses.ts` (`kitRes`) quyết định thành viên thường chỉ nhận biểu mẫu và quy trình, không nhận tài khoản, người giữ, số mục thiếu.
  - Lược đồ: `db/migrations/004_handover_kit.sql` (bảng `kit_documents`, `kit_processes`, `kit_accounts`; các bước và biểu mẫu đi kèm của quy trình lưu dạng jsonb).
- **Bàn giao 7 bước** (nhóm B): thêm bước "Kiểm tra kho bàn giao" vào vị trí 3, bước cũ 3 trở đi dời xuống một bước.
  - 6 API mới: `PUT /handover/board`, `POST /handover/lock-balance`, `/handover/kit-review`, `/handover/accounts/:itemId/transfer`, `/handover/transfer-done`, `/handover/accept`. `PUT /handover/receiver` nay là bước 4 và `PUT /handover/step` nhận 1 đến 7.
  - Mỗi thao tác chỉ làm được khi bàn giao đang đúng ở bước của nó (409), rồi sang bước kế và ghi một dòng vào biên bản (`history`). Quay lại bước trước bị chặn khi ban mới đã xác nhận.
  - `GET /clubs/:clubId/board` và `GET /handover` mở thêm cho người được chọn làm chủ nhiệm mới ở bước 1 (đã nhận lời mời), kể cả khi họ đang là thành viên thường (Hiệu chọn 22/10/2026): `requireBoardOrIncoming` trong `src/access.ts`. Các API ban điều hành khác vẫn chặn họ; `POST /handover/accept` chỉ người đó gọi được.
  - Luật ở `web/src/lib/actions.ts` (`saveHandoverBoard`, `lockHandoverBalance`, `reviewHandoverKit`, `saveHandoverAccount`, `transferHandoverAccount`, `finishHandoverTransfer`, `acceptHandover`, `setHandoverStep`). `saveHandoverAccount` và `setHandoverStep` đổi chữ ký (thêm người làm và thời điểm).
  - `GET /handover` trả thêm ban mới, việc còn dở, tóm tắt kho, tài khoản của kho, biên bản, `canAccept`.
  - Dữ liệu cũ trong PostgreSQL: migration `005_handover_steps.sql` dời bước từ 3 trở đi xuống một bước, nên bàn giao đang ở bước 3 cũ thành bước 4 mới. Dữ liệu cũ chưa có ban mới (`newBoard`) nên bước 6 chưa xác nhận được cho tới khi quay lại bước 1 chọn ban mới.
  - Chưa làm: áp dụng vai trò mới khi bàn giao xong.
- **Việc cần làm** (nhóm B): 5 API `/clubs/:clubId/tasks...` và `GET /me/tasks`. Code ở `src/handlers/tasks.ts`.
  - Quyền mới `task` (ban điều hành, kể cả thủ quỹ) tạo, giao, sửa việc; người được giao đổi trạng thái việc của mình (`POST .../status` mở cho thành viên đã nhận lời mời, kiểm tra người giao ở handler). Mọi thay đổi lưu lịch sử.
  - Lược đồ: `db/migrations/005_handover_steps.sql` (bảng `tasks`, `task_history`; `event_id` và `process_id` không có khóa ngoại để xóa buổi hay quy trình không bị chặn).
- `STATE_VERSION` của dữ liệu mẫu lên 4 (có `kitDocuments`, `kitProcesses`, `kitAccounts`, `tasks`).
- Test: `test/handover-kit.test.ts` (10), `test/handover-steps.test.ts` (6); `db.test.ts` thêm các thao tác mới để kiểm tra lưu và khởi động lại. `board.test.ts` sửa theo bước mới và theo việc a017 là chủ nhiệm mới trong dữ liệu mẫu. Cả bộ 87/87, `npm run test:db` 87/87.

## Đã đổi ngày 22/10/2026, nhóm C (báo Khoa)

- **Trợ lý bàn giao (bản mẫu)**: 4 API: `GET /clubs/:clubId/ai`, `POST .../ai/summary`, `POST .../ai/ask`, `PUT /clubs/:clubId/handover/summary`. Code ở `src/ai.ts` (tầng trợ lý) và `src/handlers/ai.ts`.
  - Cấu hình mới `AI_MODE=mock|real` (mặc định `mock`) và `AI_FREE_ASKS_PER_TERM` (trống hoặc 0 là không giới hạn) trong `.env.example`. `real` đã nối Gemini (29/10/2026, `src/ai-real.ts`): đặt `GEMINI_API_KEY` và `AI_MODEL` (mặc định `gemini-3.1-flash-lite`). Thiếu khóa thì máy chủ không khởi động. Gọi lỗi hoặc hết hạn mức thì lùi về bản mẫu và kết quả ghi `mode: "mock"`. Không gửi tên, email, link, nhãn tài khoản; hỏi đáp không gửi phần tài khoản; câu hỏi về tiền bị chặn trước khi gửi. Ràng buộc chạy ở máy chủ trước khi gọi Gemini (không tốn lượt): từ chối câu ra lệnh cho mô hình (bỏ qua hướng dẫn, đóng vai, lộ prompt) và câu lạc đề (không trùng từ nào trong kho); mỗi người tối đa 5 lần gọi mỗi phút; cả hệ thống tối đa `AI_DAILY_CAP` lần mỗi 24 giờ (mặc định 400), vượt thì dùng bản mẫu; đầu ra bỏ link do mô hình tự viết và bị cắt độ dài. Câu bị từ chối ở máy chủ không tính vào số lượt hỏi của CLB. Cổng lạc đề cho qua một số từ tiếng Anh về bàn giao (form, event, process...). Cổng lạc đề là so từ khóa nên có thể từ chối nhầm câu hỏi dùng từ đồng nghĩa; bộ đếm nằm trong bộ nhớ nên tắt máy chủ là đếm lại. Kiểm thử dùng Gemini giả, không tốn hạn mức.
  - Giao diện `Assistant` (tóm tắt, hỏi đáp) dùng chung cho bản mẫu và bản thật. Bản mẫu **tính từ dữ liệu của CLB**: đếm việc quá hạn, mục thiếu, tài khoản chưa chuyển; hỏi đáp tìm từ khóa trong nội dung kho, trả về mục khớp nhất kèm nguồn.
  - Quyền theo vai: ban điều hành hỏi được cả phần tài khoản; thành viên thường chỉ hỏi được biểu mẫu và quy trình (tài khoản không có trong tập tìm kiếm, nên không lộ cả việc tài khoản có tồn tại). Câu hỏi về tiền, sổ quỹ, mật khẩu, dữ liệu cá nhân bị từ chối.
  - Tóm tắt chỉ là bản nháp, không lưu gì; lưu vào biên bản là `PUT .../handover/summary` (chủ nhiệm, và chưa bị khóa), ghi ai lưu, lúc nào, bản mẫu hay không.
  - Đếm lượt dùng theo CLB và học kỳ; mức giới hạn lượt của bản miễn phí chưa có nên mặc định chỉ đếm.
  - Lược đồ: `db/migrations/006_ai_assistant.sql` (cột `handovers.summary`, bảng `ai_usage`).
- **Trang chủ ban điều hành**: `GET /clubs/:clubId/dashboard` trả thêm `tasks`, `handover`, `kit`, `participation` (thống kê tham gia là phép đếm từ điểm danh, không phải AI). `dashboardRes` nhận thêm thời điểm hiện tại.
- Luật mới ở `web/src/lib`: `saveHandoverSummary`, `countAiUse`, `aiUsageOf`, `participationStats`. `STATE_VERSION` lên 5.
- Test: `test/ai.test.ts` (9); `db.test.ts` thêm hỏi đáp, tóm tắt, lưu bản tóm tắt. Cả bộ 96/96, `npm run test:db` 96/96.

## Chưa có

- **Bắt đầu với cơ sở dữ liệu trống thật.** Cơ sở dữ liệu trống vẫn được nạp dữ liệu mẫu. Bản thật cần tùy chọn không nạp dữ liệu mẫu, để CLB tự tạo từ đầu.
- **Mã VietQR thật.** API đóng quỹ trả chuỗi giả kèm `qrIsDemo: true`, quét không chuyển được tiền.
- **Tải ảnh chứng từ, gửi email, xử lý yêu cầu xóa dữ liệu.**

Danh sách đầy đủ những gì còn phải quyết: `../docs/api.md`, mục "Chưa chốt".
- **Tin của CLB trên Cộng đồng, duyệt trước hiện sau** (29/10/2026, Hiệu chốt): bảng `posts` (`db/migrations/007_posts.sql`), 6 API mới (`GET /feed`, `GET /posts/:postId`, `GET` và `POST /clubs/:clubId/posts`, `GET /school/posts`, `POST /school/posts/:postId/review`; bảng ở `docs/api.md`), file `src/handlers/posts.ts`, quyền `post` đã có. Tin mới luôn chờ; chỉ cán bộ trường (`person.kind = "staff"`) duyệt hoặc từ chối (từ chối bắt buộc lý do); chỉ tin đã duyệt hiện cho mọi người; người đăng thấy tin của mình, ban điều hành CLB đó thấy ở Bảng tin của CLB; người khác mở thẳng tin chưa duyệt nhận 404. Cộng đồng chung không nêu tên người đăng. **Báo Khoa:** đổi hợp đồng API (thêm, không sửa API cũ), thêm migration, `STATE_VERSION` lên 6. Chưa có: sửa tin bị từ chối rồi gửi lại, ẩn tin đã duyệt, ảnh đính kèm. Dữ liệu mẫu: 6 tin đã duyệt và 1 tin chờ của CLB mẫu (`web/src/lib/seed.ts`); người đăng của các tin mẫu đều ghi là chủ nhiệm CLB mẫu vì các CLB khác chưa có thành viên trong dữ liệu mẫu.
- **Thêm ngày 29/10/2026 (báo Khoa):** `PUT /clubs/:clubId/posts/:postId` (sửa tin bị từ chối rồi gửi lại), `POST /school/clubs/:clubId/handover/confirm` (mentor xác nhận biên bản), migration `008_mentor_confirm.sql` (hai cột `handovers.mentor_confirmed_by`, `mentor_confirmed_at`, ràng buộc cùng có hoặc cùng trống). **Đổi hành vi:** `acceptHandover` giờ đổi vai theo ban mới (xem `web/src/lib/actions.ts`), nên sau khi ban mới xác nhận thì ban cũ về thành viên và không gọi được API của ban điều hành nữa (test bàn giao đã sửa theo). Tùy chọn `DEMO_NOW` (chỉ chế độ demo, để quay video): đồng hồ máy chủ đi từ thời điểm đó.
