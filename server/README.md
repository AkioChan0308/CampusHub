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
npm test             # 62 test: gọi từng API qua HTTP (dữ liệu trong bộ nhớ), kèm test phần lưu PostgreSQL (PGlite)
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

```
src/
  contract.ts     hợp đồng API: bảng ENDPOINTS và kiểu dữ liệu gửi lên, trả về
  app.ts          dựng Express từ bảng ENDPOINTS; đăng nhập, CORS, trả lỗi
  index.ts        chạy máy chủ
  handlers/       mỗi API một hàm, chia theo nhóm (me, explore, board, money, school, system)
  views.ts        đổi dữ liệu nội bộ thành đúng dạng trả về; quyết định ai thấy trường nào
  access.ts       kiểm tra quyền: ban điều hành, vai trò, thành viên, cán bộ của trường
  schemas.ts      kiểm tra dữ liệu gửi lên (zod), báo lỗi tiếng Việt
  qr.ts           ký và kiểm tra mã QR điểm danh (HMAC-SHA256, đổi mỗi 30 giây)
  store.ts        kho dữ liệu: giao diện Store và bản chỉ trong bộ nhớ
  domain.ts       lấy luật nghiệp vụ từ ../web/src/lib
  config.ts       đọc biến môi trường
  sessions.ts     phiên đăng nhập và lượt đăng nhập Google đang dở (bản trong bộ nhớ)
  google.ts       đăng nhập Google: link sang Google, đổi mã lấy email
  db/             lưu bằng PostgreSQL (khi có DATABASE_URL)
    client.ts     kết nối (thư viện pg), transaction
    migrate.ts    chạy các file trong db/migrations chưa chạy
    tables.ts     đổi qua lại giữa AppState và các bảng
    state.ts      nạp toàn bộ dữ liệu; ghi phần thay đổi sau mỗi thao tác
    store.ts      kho dữ liệu lưu PostgreSQL (giữ một bản trong bộ nhớ để đọc nhanh)
    sessions.ts   phiên đăng nhập lưu PostgreSQL (chỉ lưu mã băm của cookie)
db/migrations/    lược đồ SQL: 001_khoi_tao.sql (bảng, luật chỉ-được-thêm của sổ quỹ)
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
- **Sửa lỗi tiền (05/10/2026):** luật nằm trong `web/src/lib`, test tái hiện ở `web/src/lib/loi-tien.test.ts`.
  - **Nhiều đợt thu:** xếp loại sao kê xét mã đợt (`codePrefix`). Dòng ghi mã của đợt khác thì "Thuộc đợt thu khác: …", không vào đợt đang đối soát. CLB có nhiều đợt mà dòng không ghi mã đợt thì phải gán tay ("Không ghi mã đợt thu"). Dòng trùng chỉ xét trong cùng đợt; dòng đã ghi vào sổ ở đợt khác thì "Đã ghi ở đợt thu khác: …". API không đổi: màn đối soát gửi đúng `collectionId`.
  - **Ghi nhận tay rồi sao kê về khác số tiền:** `Payment` có thêm `awaitingStatement` (tiền chuyển khoản đã ghi nhận tay, chưa thấy trong sao kê). Gán tay dòng sao kê cho người đó thì phần này chỉ nối, chỉ phần chênh được ghi vào sổ quỹ. Lý do của dòng: "Đã ghi nhận tay …, sao kê …". Lược đồ: `db/migrations/002_tien_cho_sao_ke.sql` thêm cột `payments.awaiting_statement`.
  - **Dự trù:** "còn phải thu" cộng mọi đợt thu của kỳ. `GET /clubs/:clubId/budget` trả thêm `forecast.collections` (số đợt thu của kỳ); `forecast.fee` là mức thu khi kỳ chỉ có một đợt, nhiều đợt thì 0.
  - **Mentor không tự duyệt:** `POST /school/expenses/:expenseId/approve` và `/reject` trả 403 `SELF_APPROVAL` khi mentor là người đề xuất khoản đó.
  - **Thành viên mới:** duyệt đơn và thêm thành viên chỉ tạo khoản phải đóng ở đợt thu của kỳ hiện tại mà chưa quá hạn (`openCollections`), không tạo ở đợt cũ. `addMembers` nhận thêm thời điểm.
  - Test: server 63 (thêm 1 test mentor), `db.test.ts` có thêm bước ghi nhận tay để kiểm tra cột mới còn sau khi khởi động lại.

## Chưa có

- **Bắt đầu với cơ sở dữ liệu trống thật.** Cơ sở dữ liệu trống vẫn được nạp dữ liệu mẫu. Bản thật cần tùy chọn không nạp dữ liệu mẫu, để CLB tự tạo từ đầu.
- **Mã VietQR thật.** API đóng quỹ trả chuỗi giả kèm `qrIsDemo: true`, quét không chuyển được tiền.
- **Tải ảnh chứng từ, gửi email, xử lý yêu cầu xóa dữ liệu.**

Danh sách đầy đủ những gì còn phải quyết: `../docs/api.md`, mục "Chưa chốt".
