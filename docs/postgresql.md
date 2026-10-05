# PostgreSQL cho CampusHub

Máy chủ (`server/`) lưu dữ liệu vào PostgreSQL khi có biến `DATABASE_URL` trong `server/.env`. Không có biến này thì máy chủ chạy như trước: dữ liệu mẫu nằm trong bộ nhớ, tắt máy chủ là mất mọi thay đổi.

Lần đầu nối vào một cơ sở dữ liệu trống, máy chủ tự tạo bảng và nạp dữ liệu mẫu. Không phải chạy lệnh SQL nào bằng tay.

Có hai cách chạy PostgreSQL trên máy:

- **Cách 1, dùng Docker:** nên dùng. Cả nhóm chạy cùng một bản PostgreSQL (17), chỉ cần một lệnh.
- **Cách 2, không dùng Docker:** cài PostgreSQL thẳng vào máy (Windows, macOS, Linux).

Chạy test (`npm test`) thì không cần cách nào: test dùng PGlite, một bản PostgreSQL chạy ngay trong Node.

---

## Cách 1: dùng Docker

### Cần có

- Docker Desktop (Windows, macOS) hoặc Docker Engine (Linux). Tải ở https://www.docker.com/products/docker-desktop/.
- Mở Docker Desktop và chờ biểu tượng con cá voi báo "running" rồi mới chạy lệnh. Docker Desktop chưa mở thì lệnh báo lỗi `open //./pipe/dockerDesktopLinuxEngine`.

### Các bước

1. Vào thư mục `server/`. Nếu chưa có `.env`, chép `.env.example` thành `.env`.
2. Trong `server/.env`, đặt mật khẩu và địa chỉ cơ sở dữ liệu. Mật khẩu tự nghĩ, chỉ dùng chữ và số:

   ```
   POSTGRES_PASSWORD=matkhaucuaban
   DATABASE_URL=postgres://campushub:matkhaucuaban@localhost:5432/campushub
   ```

3. Bật PostgreSQL:

   ```
   docker compose up -d
   ```

   Lần đầu Docker tải bản `postgres:17-alpine` (khoảng 100 MB). Xem đã sẵn sàng chưa: `docker compose ps`, cột STATUS ghi `healthy` là được.

4. Chạy máy chủ như thường lệ: `npm run dev`. Lần đầu, dòng log có:

   ```
   Đã tạo hoặc cập nhật bảng: 001_khoi_tao.sql
   Cơ sở dữ liệu còn trống: đã nạp dữ liệu mẫu.
   CampusHub API: http://localhost:4000/api/v1 · đăng nhập: demo · dữ liệu: PostgreSQL localhost:5432
   ```

5. Thử: làm một việc trên web (ví dụ duyệt một đơn xin vào), tắt máy chủ (Ctrl+C), chạy lại `npm run dev`. Việc vừa làm vẫn còn, và bạn không phải đăng nhập lại.

### Lệnh hay dùng (chạy trong `server/`)

| Việc | Lệnh |
|---|---|
| Bật PostgreSQL | `docker compose up -d` |
| Tắt PostgreSQL, giữ dữ liệu | `docker compose stop` |
| Xem log của PostgreSQL | `docker compose logs -f db` |
| Mở dòng lệnh SQL | `docker compose exec db psql -U campushub` |
| Xóa sạch cả dữ liệu (làm lại từ đầu) | `docker compose down -v` |

Dữ liệu nằm trong volume `campushub-pg`. Tắt máy, tắt Docker hay `docker compose down` (không có `-v`) đều không mất dữ liệu.

---

## Cách 2: không dùng Docker

Cài PostgreSQL 16 trở lên (nên dùng 17), rồi tạo một người dùng và một cơ sở dữ liệu tên `campushub`.

### Windows

1. Tải bộ cài ở https://www.postgresql.org/download/windows/ (bản của EDB).
2. Khi cài:
   - giữ cổng 5432;
   - đặt mật khẩu cho người dùng `postgres` và ghi lại;
   - không cần cài Stack Builder.
3. Mở **SQL Shell (psql)** trong menu Start. Bấm Enter cho các câu hỏi mặc định, rồi gõ mật khẩu `postgres` vừa đặt.
4. Chạy hai lệnh dưới đây (đổi `matkhaucuaban`):

   ```sql
   create role campushub login password 'matkhaucuaban';
   create database campushub owner campushub;
   ```

5. Trong `server/.env`:

   ```
   DATABASE_URL=postgres://campushub:matkhaucuaban@localhost:5432/campushub
   ```

   Không cần dòng `POSTGRES_PASSWORD`; dòng đó chỉ dành cho Docker.

6. `npm run dev` trong `server/`, như bước 4 của cách 1.

PostgreSQL cài kiểu này tự chạy mỗi khi bật máy (dịch vụ `postgresql-x64-17` trong Services). Muốn tắt hay bật thì vào Services.

### macOS

Chọn một trong hai cách:

- **Postgres.app** (dễ nhất): tải ở https://postgresapp.com/, kéo vào Applications, mở rồi bấm Initialize.
- **Homebrew:** `brew install postgresql@17`, rồi `brew services start postgresql@17`.

Sau đó mở Terminal, chạy `psql postgres` và gõ hai lệnh `create role …` và `create database …` như phần Windows. Cuối cùng đặt `DATABASE_URL` trong `server/.env`.

### Linux (Ubuntu, Debian)

```
sudo apt install postgresql
sudo -u postgres psql
```

Trong `psql`, chạy hai lệnh `create role …` và `create database …` như phần Windows. Sau đó đặt `DATABASE_URL` trong `server/.env`.

---

## Máy chủ lưu những gì

Lược đồ nằm ở `server/db/migrations/001_khoi_tao.sql`. Mỗi bảng ứng với một danh sách trong dữ liệu của luật nghiệp vụ (`web/src/lib/types.ts`):

- Người và CLB: `persons`, `clubs`, `memberships`, `applications`, `consents`.
- Điểm danh: `events`, `attendance`.
- Sổ quỹ: `collections`, `payments`, `ledger`, `statements`, `statement_txns`, `expenses`, `expense_history`, `budget_items`, `budgets`.
- Bàn giao: `handovers`.
- Phiên đăng nhập: `sessions`.

**Luật do chính cơ sở dữ liệu giữ** (máy chủ có lỗi cũng không phá được):

- **Sổ quỹ (`ledger`) và lịch sử khoản chi (`expense_history`):** chỉ thêm dòng mới, không sửa, không xóa. Muốn điều chỉnh thì thêm bút toán mới.
- **Nhật ký đồng ý (`consents`):** không xóa. Mỗi dòng chỉ được ghi ngày rút đồng ý, và chỉ một lần.
- **Điểm danh:** mỗi điện thoại chỉ điểm danh cho một người trong một buổi. Điểm danh tay phải ghi người điểm danh.
- **Từ chối khoản chi:** phải có lý do.
- **Tài khoản nhận quỹ của đợt thu:** chỉ lưu 4 số cuối. Riêng số tài khoản mới khi bàn giao (bảng `handovers`) được lưu đủ; API chỉ trả 4 số cuối.
- **Phiên đăng nhập:** chỉ lưu mã băm SHA-256 của cookie. Ai đọc được bảng cũng không đăng nhập được.

## Đặt lại dữ liệu mẫu

- **Chế độ demo** (`AUTH_MODE=demo`): dùng nút "Đặt lại dữ liệu mẫu" ở trang chọn vai. Mọi bảng được xóa rồi nạp lại dữ liệu mẫu; phiên đăng nhập giữ nguyên. Chỉ lúc này cơ sở dữ liệu mới cho xóa hết sổ quỹ.
- **Xóa hẳn rồi làm lại từ đầu:**
  - Docker: `docker compose down -v`, rồi `docker compose up -d`.
  - Không Docker: tắt máy chủ CampusHub, rồi trong `psql` của người dùng `postgres` chạy `drop database campushub;` và `create database campushub owner campushub;`.

## Sao lưu

```
docker compose exec db pg_dump -U campushub campushub > sao-luu.sql
```

Không dùng Docker thì bỏ phần `docker compose exec db`, chỉ chạy `pg_dump -U campushub campushub > sao-luu.sql`.

File sao lưu chứa dữ liệu thành viên. Không đưa file này vào repo.

## Đổi lược đồ

- Thêm file mới trong `server/db/migrations/`, ví dụ `002_them_cot_x.sql`.
- Không sửa file đã chạy ở máy ai đó.
- Máy chủ chạy các file chưa chạy theo thứ tự tên, mỗi file trong một transaction. File nào đã chạy thì ghi vào bảng `schema_migrations`.
- Đổi cột thì sửa cả `server/src/db/tables.ts` (đổi qua lại giữa dữ liệu và các bảng), rồi chạy `npm test` và `npm run test:db`.

## Test

- `npm test`:
  - các test API chạy với dữ liệu trong bộ nhớ;
  - riêng `test/db.test.ts` chạy trên PGlite. Test này kiểm tra:
    - nạp dữ liệu mẫu rồi đọc lại đúng như cũ;
    - làm việc qua API, khởi động lại máy chủ, dữ liệu và phiên còn nguyên;
    - cơ sở dữ liệu chặn sửa, xóa sổ quỹ;
    - ghi lỗi thì API trả lỗi 500 và dữ liệu không lệch.
- `npm run test:db`: chạy toàn bộ test API với dữ liệu lưu trong PGlite. Chạy lệnh này khi sửa `server/src/db/` hay lược đồ.

Không lệnh nào ở trên cần Docker hay PostgreSQL thật.

## Giới hạn hiện tại

- **Chỉ chạy một máy chủ cho một cơ sở dữ liệu.**
  - Máy chủ giữ một bản dữ liệu trong bộ nhớ để đọc nhanh. Mỗi thay đổi được ghi vào PostgreSQL trước khi API trả lời.
  - Hai máy chủ dùng chung một cơ sở dữ liệu sẽ không thấy thay đổi của nhau.
  - Đủ cho pilot. Muốn chạy nhiều máy chủ thì phải đổi sang đọc thẳng từ cơ sở dữ liệu ở mỗi API. Khoa quyết định khi cần.
- **Ghi vào PostgreSQL lỗi** (ví dụ PostgreSQL tắt giữa chừng): API báo "Máy chủ chưa lưu được thay đổi. Thử lại sau.", và dữ liệu trong bộ nhớ quay về bản đã lưu. Bật lại PostgreSQL là làm tiếp được, không cần khởi động lại máy chủ.
- **Lúc khởi động, máy chủ nạp toàn bộ dữ liệu.** Với vài CLB thì nhanh. Khi dữ liệu lớn thì nên đổi sang đọc theo từng API.

## Lỗi thường gặp

| Thông báo | Cách sửa |
|---|---|
| `Không nối được PostgreSQL (connect ECONNREFUSED …)` | PostgreSQL chưa chạy. Docker: mở Docker Desktop rồi `docker compose up -d`. Không Docker: bật dịch vụ PostgreSQL. |
| `password authentication failed for user "campushub"` | Mật khẩu trong `DATABASE_URL` khác mật khẩu lúc tạo. Với Docker, mật khẩu chỉ được đặt ở lần chạy đầu: đổi `POSTGRES_PASSWORD` sau đó thì phải `docker compose down -v` rồi chạy lại. |
| `database "campushub" does not exist` | Chưa chạy `create database campushub owner campushub;` (cách 2). |
| `Bind for 127.0.0.1:5432 failed: port is already allocated` | Máy đã có PostgreSQL khác dùng cổng 5432. Đặt `POSTGRES_PORT=5433` trong `server/.env` và đổi `:5432` thành `:5433` trong `DATABASE_URL`. |
| `Đặt POSTGRES_PASSWORD trong server/.env` | `server/.env` chưa có dòng `POSTGRES_PASSWORD`. |
| `no configuration file provided: not found` | Chạy `docker compose` ngoài thư mục `server/`. |
| Mật khẩu có ký tự đặc biệt (`@`, `:`, `/`, `#`) | Đổi mật khẩu chỉ gồm chữ và số. Hoặc mã hóa ký tự đó trong `DATABASE_URL`, ví dụ `@` thành `%40`. |

## Bảo mật

- `server/.env` có mật khẩu, không đưa vào repo (đã có trong `.gitignore`).
- PostgreSQL của Docker chỉ mở cho chính máy này (`127.0.0.1`).
- Bản thật:
  - dùng mật khẩu dài, ngẫu nhiên;
  - không mở cổng PostgreSQL ra Internet;
  - đặt `AUTH_MODE=google` để tắt đăng nhập nhanh và nút đặt lại dữ liệu mẫu.
