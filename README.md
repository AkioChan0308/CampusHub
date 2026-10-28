# CampusHub

CampusHub là **bộ bàn giao cho ban điều hành CLB sinh viên**, dùng cạnh Google Sheets: biểu mẫu, cách làm từng việc và tài khoản của CLB nằm một chỗ (Kho bàn giao), việc cần làm có người phụ trách, nhiệm kỳ sau không phải gọi hỏi nhiệm kỳ trước. Điểm danh bằng mã QR, thành viên và ghi sổ quỹ là các tính năng đi kèm. Trang web cũng giúp **ban quản lý CLB của trường** nắm tình hình các CLB.

Dự án của nhóm NeedSleep, môn EXE101, Đại học FPT TP.HCM.

> **Trạng thái:** bản MVP chạy trên máy, dùng **dữ liệu mẫu tự đặt** (tên người, số tiền đều là giả). Chưa đưa lên mạng. Tiến độ chi tiết: [docs/tien-do-mvp.md](docs/tien-do-mvp.md).

## Ai dùng CampusHub

| Nhóm người dùng | Cách gọi trong nhóm | Gồm ai | Dùng trên | Việc chính |
|---|---|---|---|---|
| **Ban điều hành CLB** | Staff | Chủ nhiệm, phó chủ nhiệm, thủ quỹ, trưởng ban | Laptop | Bàn giao nhiệm kỳ và Kho bàn giao, giao việc, thêm thành viên, mở điểm danh; thu quỹ, đối soát sao kê, duyệt chi, lập dự trù |
| **Thành viên CLB** | Khách hàng | Người đã nhận lời mời vào CLB | Điện thoại | Điểm danh bằng mã QR, đóng quỹ, xem và tải dữ liệu của mình |
| **Sinh viên chưa vào CLB** | Khách hàng | Sinh viên muốn tìm CLB | Điện thoại | Xem các CLB, gửi đơn xin vào |
| **Ban quản lý CLB của trường** | Quản lý | Cán bộ trường (SRO, PDP), kiêm mentor | Laptop | Xem tình hình các CLB (chỉ số tổng hợp), duyệt khoản chi lớn |

Cách gọi "khách hàng, staff, quản lý" lấy từ [docs/ke-hoach-mvp.md](docs/ke-hoach-mvp.md), mục 4; nhóm còn chờ chốt cách gọi này.

Thành viên và sinh viên không cần cài app: mở link CLB gửi trong nhóm Zalo hoặc Messenger là dùng được.

## Các luồng chính

Mỗi luồng kể từng bước ai làm gì, kèm luật cần nhớ, ở [docs/luong-nguoi-dung.md](docs/luong-nguoi-dung.md).

1. **Lập CLB và đưa thành viên vào:** chủ nhiệm tạo CLB, thêm thành viên từ file Excel, gửi link mời qua Zalo. Thành viên mở link, đồng ý lưu dữ liệu là vào CLB.
2. **Xin vào CLB:** sinh viên tìm CLB, gửi đơn. Ban điều hành duyệt đơn, sinh viên nhận lời mời.
3. **Điểm danh:** ban điều hành chiếu mã QR (đổi mã mỗi 30 giây) trong buổi sinh hoạt. Thành viên quét bằng điện thoại. Ai quên điện thoại thì được điểm danh tay.
4. **Thu quỹ:** thủ quỹ mở đợt thu, gửi link đóng quỹ. Thành viên chuyển khoản theo nội dung riêng của mình, rồi bấm "Mình đã chuyển khoản". Đóng tiền mặt thì thủ quỹ ghi tay.
5. **Đối soát sao kê:** thủ quỹ tải file sao kê từ app ngân hàng lên. Giao dịch đúng mã, đúng tiền tự khớp; giao dịch lệch (sai cú pháp, chuyển hộ, thiếu tiền) hiện ra để gán tay.
6. **Đề xuất và duyệt chi:** một người đề xuất, người khác trong ban điều hành duyệt. Khoản trên 2.000.000 ₫ cần mentor của trường duyệt thêm.
7. **Dự trù kỳ:** ban điều hành lập dự trù theo hoạt động, biết quỹ đủ hay thiếu, gửi cho trường.
8. **Bàn giao nhiệm kỳ:** 7 bước: chọn ban mới, chốt số dư, kiểm tra Kho bàn giao, đổi tài khoản nhận quỹ, chuyển quyền quản trị, ban mới xác nhận, biên bản. Kho bàn giao giữ biểu mẫu, quy trình, tài khoản (không lưu mật khẩu). Có trợ lý bản mẫu tóm tắt cho ban mới và trả lời câu hỏi trong kho; việc cần làm giao cho từng người.
9. **Dữ liệu cá nhân:** thành viên tự tải dữ liệu của mình, rút đồng ý, gửi yêu cầu xóa dữ liệu.
10. **Phía nhà trường:** xem các CLB có hoạt động không, dự trù và số đã chi, duyệt khoản chi lớn.
11. **Trang chung (khung mẫu, đang phát triển):** mọi vai đã đăng nhập đều vào được; bấm logo CampusHub ở góc trái trên của bất kỳ màn nào để về đây. Các CLB đăng sự kiện, quảng bá, tin tức; bấm vào tin hoặc vào CLB để xem chi tiết; có bong bóng chat ở góc phải dưới để nhắn với ban điều hành CLB. Tin và khung chat hiện là **dữ liệu mẫu**, chưa có máy chủ đứng sau. Mỗi vai có một nút riêng trên thanh công cụ (Quản lý CLB, Của tôi, Nhà trường) dẫn tới trang việc của vai đó. Thành viên đăng nhập xong vào thẳng trang chung. Mô tả: [docs/mo-ta-bang-tin-chung.md](docs/mo-ta-bang-tin-chung.md).

## CampusHub không làm gì

- **Không giữ tiền, không thu hộ.** Tiền đi thẳng vào tài khoản của CLB hoặc thủ quỹ; CampusHub chỉ ghi sổ. Thu hộ phải có giấy phép của Ngân hàng Nhà nước (Nghị định 52/2024).
- **Không tự đọc tài khoản ngân hàng.** Thủ quỹ tự tải file sao kê lên.
- **Không lấy vị trí (GPS)** khi điểm danh.
- **Không thay Zalo:** chỉ gửi link vào nhóm có sẵn.

## Chạy thử trên máy

Cần [Node.js](https://nodejs.org) 22.12 trở lên. Mở hai cửa sổ dòng lệnh:

```bash
# Cửa sổ 1: máy chủ API, http://localhost:4000/api/v1
cd server
npm install
npm run dev

# Cửa sổ 2: trang web, http://localhost:3000
cd web
npm install
npm run dev
```

Mở http://localhost:3000. Trang đầu là trang giới thiệu, có hai video demo ngắn (thành viên trên điện thoại, ban điều hành trên laptop) và nút Đăng nhập, Đăng ký. Bấm **Đăng nhập**: dưới ô đăng nhập có bảng **tài khoản mẫu** cho 7 vai (chỉ có ở bản demo). Bấm một vai, ví dụ "Chủ nhiệm CLB" hay "Thành viên", là điền sẵn tên tài khoản và mật khẩu (mật khẩu chung `CauLong#2026`), rồi bấm Đăng nhập. Đổi vai thì Đăng xuất rồi đăng nhập tài khoản khác: ban điều hành và nhà trường bấm "Đăng xuất" ở thanh bên; thành viên và sinh viên bấm avatar ở góc phải trên rồi chọn "Đăng xuất". Nút "Đặt lại dữ liệu mẫu" nằm dưới bảng.

Người mới vào code: đọc `docs/cay-thu-muc.md` để biết thư mục nào làm gì và trang nào nằm ở đâu.

Thử nhanh các luồng chính:
1. Đăng nhập **Chủ nhiệm**, bấm "Mở QR điểm danh" rồi "Bắt đầu điểm danh". Dưới mã QR, chọn một thành viên rồi bấm "Mở link điểm danh": một tab mới điểm danh bằng vai đó, và tab chiếu QR thấy tên người vừa điểm danh. Thử thêm người thứ hai trên cùng trình duyệt để thấy luật "mỗi điện thoại chỉ điểm danh cho một người".
2. Đăng nhập **Sinh viên chưa vào CLB**, gửi đơn vào CLB Cầu lông. Đổi sang **Chủ nhiệm**, duyệt đơn ở mục Thành viên.
3. Đăng nhập **Thủ quỹ**, gán tay các giao dịch chưa khớp ở Đối soát sao kê: Đợt thu và Trang chủ đổi số theo.
4. Đăng nhập **Trưởng ban**, duyệt khoản "Mua 2 ống cầu" do chủ nhiệm đề xuất. Chủ nhiệm không tự duyệt được khoản của mình.
5. Đăng nhập **Ban quản lý CLB của trường**, duyệt khoản chi đang chờ mentor. Sau đó thủ quỹ ghi đã chi, và Dự trù kỳ đổi theo.
6. Đăng nhập **Thành viên**: bạn vào thẳng Trang chung. Bấm một tin để xem chi tiết, bấm "Nhắn cho CLB" hoặc bong bóng chat ở góc phải dưới để thấy khung chat mẫu (ghi tính năng đang phát triển). Nút xanh đặc "Của tôi" trên thanh công cụ dẫn tới trang việc của thành viên.
7. Đăng nhập **Sinh viên chưa vào CLB**, bấm "Của tôi": vẫn thấy thông tin, các tính năng của thành viên bị khóa kèm câu "Cần tham gia một CLB".

### Lưu dữ liệu vào PostgreSQL (Docker)

Chạy như trên thì dữ liệu mẫu nằm trong bộ nhớ, tắt máy chủ là mất mọi thay đổi. Muốn dữ liệu còn lại giữa các lần chạy, dùng PostgreSQL bằng Docker. Mỗi người chạy một cơ sở dữ liệu riêng trên máy mình, không dùng chung.

Cần [Docker Desktop](https://www.docker.com/products/docker-desktop/), mở lên và chờ báo "running" rồi mới chạy lệnh.

1. Trong `server/`, chép `.env.example` thành `.env` (Windows: `copy .env.example .env`).
2. Trong `server/.env`, đặt hai dòng sau. Mật khẩu tự nghĩ, chỉ dùng chữ và số, và không gửi mật khẩu qua nhóm chat:

   ```
   POSTGRES_PASSWORD=matkhaucuaban
   DATABASE_URL=postgres://campushub:matkhaucuaban@localhost:5432/campushub
   ```

3. Bật PostgreSQL, rồi chạy máy chủ và web như ở trên:

   ```bash
   cd server
   docker compose up -d
   npm run dev
   ```

Lần đầu nối vào cơ sở dữ liệu trống, máy chủ **tự tạo bảng và nạp dữ liệu mẫu** cùng tài khoản mẫu; không có script seed nào phải chạy. Dòng log có "Đã nạp dữ liệu mẫu" là đúng.

| Việc | Lệnh (chạy trong `server/`) |
|---|---|
| Tắt PostgreSQL, giữ dữ liệu | `docker compose stop` |
| Làm lại từ đầu (xóa sạch dữ liệu) | `docker compose down -v`, rồi `docker compose up -d` |

Cổng 5432 đã có chương trình khác dùng, hoặc gặp lỗi khác: xem bảng "Lỗi thường gặp" trong [docs/postgresql.md](docs/postgresql.md). Muốn cài PostgreSQL không qua Docker cũng xem file đó.

## Thư mục và tài liệu

| Ở đâu | Có gì |
|---|---|
| [docs/luong-nguoi-dung.md](docs/luong-nguoi-dung.md) | Luồng của từng nhóm người dùng, từng bước, viết cho cả người không làm kỹ thuật |
| [docs/tien-do-mvp.md](docs/tien-do-mvp.md) | Đang làm tới đâu, việc tiếp theo, các quyết định đã duyệt. Người mới vào nhóm đọc file này trước |
| [web/](web/) | Trang web (Next.js). Hướng dẫn: [web/README.md](web/README.md) |
| [server/](server/) | Máy chủ API (Node.js, Express). Hướng dẫn: [server/README.md](server/README.md) |
| [docs/api.md](docs/api.md) | Danh sách API giữa trang web và máy chủ |
| [DESIGN.md](DESIGN.md) | Hệ giao diện "Lịch bloc": màu, chữ, cách bố trí |
| [design/](design/) | Bản vẽ wireframe ban đầu (16 màn), dùng để tra nội dung và luật của từng màn |
| [CLAUDE.md](CLAUDE.md) | Luật làm việc của nhóm và các nguyên tắc nghiệp vụ đã chốt |

## Không đưa vào repo

File `.env`, khóa API, mật khẩu, và mọi dữ liệu thật (danh sách thành viên, sao kê ngân hàng, câu trả lời khảo sát). Dữ liệu dùng để thử phải là dữ liệu tự đặt và ghi rõ là dữ liệu mẫu.
