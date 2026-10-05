# Tiến độ MVP CampusHub

*Cập nhật ngày 05/10/2026. Mỗi khi xong một nhóm việc, sửa file này trước khi báo xong.*

Agent hay người mới nhận việc: đọc file này trước, rồi tới:
1. `CLAUDE.md`: luật nghiệp vụ, luật giao diện, những gì không được đưa vào repo.
2. `DESIGN.md`: hệ thiết kế "Lịch bloc".
3. `web/README.md`: bản đồ web, mục "Chỗ code khác bản vẽ".
4. `server/README.md`: bản đồ máy chủ, danh sách thay đổi để báo Khoa.
5. `docs/api.md`: hợp đồng API.

---

## 1. Đang ở đâu

**Đã có:**
- Web có đủ 16 màn của bản vẽ, cộng 5 màn mới để tạo dữ liệu từ đầu. Màn nào cũng theo hệ thiết kế "Lịch bloc" và gọi API thật. Hệ tím cũ đã bỏ hẳn (05/10).
- Máy chủ kiểm tra quyền ở mọi API.
- Dữ liệu lưu trong bộ nhớ, hoặc trong PostgreSQL khi đặt `DATABASE_URL`.

**Chưa có:**
- Dữ liệu vẫn là dữ liệu mẫu (giả).
- Đăng nhập Google đã có code, nhưng nhóm chưa tạo khóa Google.
- Chưa đưa lên mạng.
- **Repo chưa có commit nào.** Chỉ commit khi Hiệu bảo.

**Mục tiêu trước mắt** (Hiệu chốt ngày 05/10/2026): MVP chạy trọn các luồng bằng dữ liệu giả, trên máy này.
- Đã xong: nhóm "tạo dữ liệu từ đầu"; script bấm thử vào repo (`web/e2e/`); bỏ hệ tím cũ, trang chọn vai sang Lịch bloc; `.gitignore` chặn skill và file có thể chứa dữ liệu thật. Hiệu duyệt tất cả ngày 05/10/2026.
- Việc tiếp theo: nhóm 2 "luật còn thiếu" (mục 6). Phiên sau bắt đầu bằng việc viết mô tả các màn của nhóm 2 rồi hỏi Hiệu duyệt bằng trắc nghiệm; chưa code gì cho nhóm này.

Người dùng trong các phiên làm việc là **Hiệu**, design lead tạm thời, có quyền quyết định mọi việc. Chỗ nào tài liệu ghi "chờ Hiệu duyệt" thì hỏi thẳng người dùng.

## 2. Chạy thử trong 5 phút

Cần Node.js 22.12 trở lên.

```bash
cd server && npm install && npm run dev   # http://localhost:4000/api/v1, chế độ demo, dữ liệu trong bộ nhớ
cd web && npm install && npm run dev      # http://localhost:3000
```

- **Thử:** mở http://localhost:3000. Đó là trang chọn vai (chỉ có ở bản demo). Bấm một vai là đăng nhập nhanh bằng tài khoản mẫu.
- **Dùng PostgreSQL:** xem `docs/postgresql.md`, có cách chạy bằng Docker và không Docker.
- **Lệnh kiểm tra:**

| Ở đâu | Lệnh | Kết quả lúc cập nhật file này |
|---|---|---|
| `server/` | `npm test` | 63/63 |
| `server/` | `npm run test:db` (cùng các test, lưu bằng PostgreSQL chạy trong Node) | 63/63 |
| `server/` | `npm run typecheck` | sạch |
| `web/` | `npm test` | 31/31 |
| `web/` | `npm run typecheck`, `npm run build` | sạch |
| `web/` | `npm run e2e` (bấm thử mọi luồng; cần web đang chạy và máy chủ chạy bằng `npm start`) | smoke 40/40, nhóm tiền 11/11, nhóm 2 15/15, nhóm 3–4 42/42, tạo dữ liệu 27/27, sửa lỗi 12/12 |

## 3. Các màn đã làm

Mọi màn dưới đây theo Lịch bloc và gọi API. CLB mẫu có mã `cau-long-san-nha`.

| Màn | Đường dẫn | Hiệu duyệt |
|---|---|---|
| BDH-TrangChu | `/clubs/[clubId]` | 03/10/2026 (màn thử đầu tiên) |
| TV-DongQuy | `/me/pay/[collectionId]` | 03/10/2026 (màn thử đầu tiên) |
| Đăng nhập, trang chặn, lỗi | `/login` | 03/10/2026 |
| BDH-DotThu, BDH-DoiSoat, BDH-DuyetChi, BDH-DuTru | `/clubs/[clubId]/collections/[collectionId]`, `/reconcile`, `/expenses`, `/budget` | 03/10/2026 |
| BDH-ThanhVien, BDH-QR, BDH-BanGiao, TV-DiemDanh | `/members`, `/events/[eventId]/qr`, `/handover`, `/checkin` và `/me/attendance` | 04/10/2026 |
| TV-CuaToi, tab Quỹ, TV-LoiMoi, SV-DanhSach, SV-DonXinVao | `/me`, `/me/pay`, `/invite/[code]`, `/explore`, `/explore/[clubId]` | 04/10/2026 |
| NT-TongQuan, NT-ChiTietCLB | `/school`, `/school/clubs/[clubId]` | 04/10/2026 |
| **Chưa có bản vẽ** (Hiệu duyệt mô tả trước khi làm): Tạo CLB, Thêm thành viên, Các buổi, Đợt thu (danh sách, tạo, sửa) | `/clubs/new`, `/clubs/[clubId]/members/add`, `/clubs/[clubId]/events`, `/clubs/[clubId]/collections`, `/clubs/[clubId]/collections/new` | 05/10/2026 |
| Trang chọn vai (chỉ có ở bản demo), trang lỗi, trang không tìm thấy | `/` | 05/10/2026 (bố cục dòng kẻ) |

Hệ tím cũ `design/ui.css` đã bỏ khỏi code ngày 05/10/2026. Bản vẽ trong `design/screens/` chỉ còn dùng để lấy nội dung, chữ và luật.

## 4. Quyết định Hiệu đã duyệt

Danh sách đầy đủ, kèm lý do: `web/README.md`, mục "Chỗ code khác bản vẽ". Dưới đây là phần chính. Một số mục cũ (ngày 03/10, trước khi có Lịch bloc) nói về `design/ui.css`. Chỗ nào ngược với Lịch bloc thì theo Lịch bloc.

**Giao diện**
- **Hệ thiết kế:** đổi hẳn sang "Lịch bloc" (03/10). CLB sống theo lịch: mỗi màn mở bằng tờ lịch hôm nay, mỗi hạn chót là một tờ lịch nhỏ đếm ngày.
  - Đỏ chỉ cho hôm nay, hạn từ 3 ngày trở xuống, và lỗi nhập.
  - Không bóng đổ. Vùng làm việc là một tờ giấy chia bằng nét 1px.
- **Không thêm** ngày âm lịch trên tờ lịch (03/10).
- **Bỏ hệ tím cũ** (05/10): xóa `design/ui.css` và bản sao trong `web/src/app/globals.css`. Biến theme của shadcn nối vào màu Lịch bloc, nên `npx shadcn add` ra đúng màu. Trang chọn vai làm theo bố cục dòng kẻ. Vẫn giữ 16 màn wireframe trong `design/screens/` để tra nội dung.
- **Chuyển động** (03/10, sau khi Hiệu chê "thô ráp, chớp chớp"):
  - lúc tải dùng khung xương đúng bố cục, không dùng chữ "Đang tải…";
  - chuyển trang mờ qua, nội dung hiện dần;
  - nút đang gửi có vòng xoay; link vừa bấm có vòng xoay;
  - thời lượng 150–250 ms.
  Mọi màn mới phải làm như vậy.
- **Không đặt nhãn nhỏ phía trên tiêu đề.** Vì vậy đã bỏ "Lời mời tham gia" (TV-LoiMoi), và "Chờ bạn duyệt" thành tiêu đề phần (NT-ChiTietCLB).
- **Màu nhãn:** đơn bị từ chối, CLB tạm ngưng nhận đơn, "Quá 30 ngày" dùng nhãn xám thay cho đỏ. "Đang xử lý yêu cầu xóa" dùng màu cam.

**Luồng tiền**
- **Đợt thu:** người cần xử lý lên đầu: báo đã chuyển, rồi chưa đóng, rồi đã đóng (03/10).
- **Đối soát:** dòng mô tả file ghi giờ tải lên (03/10).
- **Duyệt chi:** ghi chú khi duyệt được lưu vào lịch sử khoản chi.
- **Người nhận tiền:** ghi đúng vai hiện tại trong CLB ("Chủ nhiệm …" khi CLB chưa có thủ quỹ), không cố định là "thủ quỹ" (05/10).
- **Mã QR đóng quỹ** của bản demo là mã giả. Dưới mã luôn có dòng "Bản demo: mã này không chuyển tiền được."

**Thành viên, điểm danh, bàn giao**
- Đơn xin vào bị từ chối thì gửi lại được.
- **Điểm danh:**
  - mở màn chiếu QR không tự mở điểm danh; phải bấm "Bắt đầu điểm danh";
  - sau khi đóng vẫn điểm danh tay được.
- **Bàn giao:** chỉ quay lại được bước trước. Bước 2 chưa làm.

**Màn thành viên và nhà trường** (04/10)
- **Yêu cầu xóa dữ liệu:** gửi xong thì có tờ lịch đếm 20 ngày, hạn CLB phải xử lý.
- **Danh sách CLB:** header có avatar chữ tắt thay cho tên ngắn.

**Tạo dữ liệu từ đầu** (mô tả duyệt 04/10, màn duyệt 05/10)
- **Tạo CLB:** ai đã đăng nhập cũng tạo được (phương án nghiệp vụ N1). Người tạo là chủ nhiệm.
- **Thêm thành viên:** nhận file `.xlsx` và `.csv`. Bản demo không gửi email, nên người được thêm nhận link mời riêng, ban điều hành sao chép gửi qua Zalo.
- **Người tạo CLB chưa qua bước xác nhận đủ 16 tuổi.** Hiệu chọn để vậy khi còn dùng dữ liệu giả (05/10). Phải xem lại trước bản thật.

**Máy chủ và dữ liệu**
- **PostgreSQL** (04/10): giữ luật nghiệp vụ trong `web/src/lib`, lưu theo bảng.
  - Mỗi thao tác ghi trong một transaction.
  - Sổ quỹ và lịch sử khoản chi chỉ được thêm, cơ sở dữ liệu tự chặn sửa và xóa.
  - Chạy bằng Docker Compose; có hướng dẫn cả cách không dùng Docker.
- **Thay đổi API:** mỗi lần đều ghi ở `server/README.md`, mục "Đã đổi ngày 03/10/2026 (báo Khoa)", để Khoa duyệt.

## 5. Phần mới, bản vẽ chưa có

- Trang `/login`, các trang chặn (sai vai, chưa vào CLB, chưa nhận lời mời, lỗi máy chủ), trang "Không tìm thấy".
- Lỗi khi quét QR: 7 trường hợp.
- Hộp hỏi lại trước mọi thao tác khó hoàn lại.
- Lịch sử điểm danh của thành viên.
- 5 màn tạo dữ liệu ở mục 3. Kèm theo:
  - trang chủ của CLB mới nhắc 3 việc: thêm thành viên, tạo buổi, tạo đợt thu;
  - cột "Thao tác" ở màn Thành viên: link mời, sửa vai;
  - dải chọn đợt thu, hộp "Sửa đợt thu".
- Máy chủ: 62 test. Thêm `test:db` (chạy cả bộ test trên PostgreSQL), thêm migration SQL.

## 6. Còn thiếu, theo thứ tự đề xuất

Gần như mọi màn dưới đây **chưa có bản vẽ**. Làm theo quy trình ở mục 7: mô tả màn trước, Hiệu duyệt bằng trắc nghiệm, rồi mới code.

**Nhóm 2: luật đã chốt nhưng chưa có luồng** (việc tiếp theo)
- Hoàn tiền khi thành viên chuyển nhầm.
- Bàn giao:
  - bước 1 (khởi tạo), bước 2 (chốt số dư);
  - bước 4–6: chuyển quyền quản trị khỏi email trường của chủ nhiệm cũ, ban mới xác nhận, mentor xác nhận.
- Ban điều hành xử lý yêu cầu xóa dữ liệu: ẩn danh lịch sử đóng quỹ, không xóa hẳn.
- Thành viên tự xem và sửa thông tin của mình (nút "Xem và sửa" đang ghi "chưa có").
- Sổ quỹ đầy đủ cho ban điều hành. Sổ quỹ chỉ đọc cho thành viên (đang ghi "chưa có").
- Đổi CLB khi một người ở nhiều CLB. Hiện các màn thành viên (Điểm danh, Quỹ, Của tôi) lấy CLB đầu tiên mà người đó đã nhận lời mời.

Chỗ bắt đầu trong code cho nhóm 2:
- Hoàn tiền: tiền thừa đang ghi là "đóng thừa" (hàm `addMoney`, `confirmPayment` và phần đối soát trong `web/src/lib/actions.ts`; màn `web/src/app/clubs/[clubId]/reconcile/page.tsx`). Sổ quỹ chỉ được thêm, nên hoàn tiền là một bút toán chi mới.
- Bàn giao: `web/src/app/clubs/[clubId]/handover/page.tsx`. Bước 3 (đổi tài khoản nhận quỹ) đã làm; các bước khác đang hiện dòng "Màn của bước này chưa có trong bản vẽ".
- Xử lý yêu cầu xóa: thành viên gửi yêu cầu bằng `requestDeletion` (`web/src/lib/actions.ts`, lưu `deletionRequestedAt`); phía ban điều hành chưa có màn xử lý.
- Tự sửa thông tin, sổ quỹ chỉ đọc: hai dòng "chưa có" trong `web/src/app/me/page.tsx`. Sổ quỹ của ban điều hành hiện chỉ có 3 giao dịch gần nhất ở trang chủ CLB.
- Đổi CLB: `web/src/components/lich/BoardFrame.tsx` (sidebar) và `PhoneFrame.tsx` (header) chưa có nút đổi CLB như bản vẽ.

Mỗi API mới làm theo mục 9, bước 3. Luật gốc: `CLAUDE.md`, mục "Nguyên tắc nghiệp vụ đã chốt"; chi tiết ở `../Phuong an nghiep vu.md` (ngoài repo).

**Nhóm 3: phần nhỏ, làm giả được**
- Trang chính sách dữ liệu (màn lời mời trỏ tới).
- Tải ảnh chứng từ (ảnh giả). Chỉ thủ quỹ và chủ nhiệm xem được.
- Hộp thư giả trong web thay cho email, nếu Hiệu muốn.
- Các nút còn "chưa có": "Xem đề nghị" hỗ trợ từ trường, mục "Dự trù và báo cáo" phía trường.

**Trước bản thật** (không cần cho bản dữ liệu giả)
- Tạo khóa Google; thử đăng nhập bằng tài khoản thật.
- Đưa lên mạng (HTTPS). Thử link trong trình duyệt bên trong Zalo và Messenger.
- Mã VietQR thật (máy chủ phải lưu đủ số tài khoản; hiện chỉ lưu 4 số cuối).
- Cơ sở dữ liệu trống thì không nạp dữ liệu mẫu, để CLB tự tạo từ đầu.
- Xác nhận đủ 16 tuổi cho người tạo CLB.
- Chạy nhiều máy chủ: phải đổi cách lưu (`docs/postgresql.md`, mục "Giới hạn").
- Bảo mật, chưa sửa ở bản demo (ghi ngày 05/10/2026):
  - `AUTH_MODE` mặc định là `demo` (không đặt trong `server/.env` thì ai cũng đăng nhập nhanh được bằng tài khoản mẫu). Bản thật phải mặc định `google`.
  - `POST /demo/reset` không cần đăng nhập: ai gọi cũng xóa được dữ liệu về dữ liệu mẫu.
  - Thêm thành viên bằng email của một tài khoản đã có thì máy chủ trả về họ tên thật của tài khoản đó, dù file nhập ghi tên khác: ban điều hành dò được tên của email bất kỳ.
  - Chưa kiểm tra `Origin` của yêu cầu ghi để chống CSRF (phiên đăng nhập bằng cookie).

**Việc của nhóm**
- **Khoa:**
  - duyệt hợp đồng API (bản nháp v0) và các thay đổi trong `server/README.md`;
  - chốt chuẩn code, cấu trúc thư mục, quy ước commit.
- **Commit, đưa lên GitHub:** chỉ khi Hiệu bảo. `.gitignore` đã chặn `.claude/`, `.impeccable/`, `.env`, file khóa Google, bảng tính và sao kê (trừ thư mục `mau/`). Trước khi commit lần đầu, chạy `git status` xem lại danh sách file.
- **Dọn code:** gọn `web/src/lib/store.tsx`. Hiện chỉ trang chọn vai và mã thiết bị (điểm danh) còn dùng.

## 7. Cách làm việc với Hiệu (bắt buộc)

- **Viết:** trả lời và viết tài liệu bằng tiếng Việt, câu ngắn.
- **Hỏi:** cần Hiệu quyết thì hỏi ngay trong chat bằng **câu trắc nghiệm**, phương án đề xuất để đầu, ghi "(Recommended)". Không bắt Hiệu mở tài liệu để đọc câu hỏi.
- **Màn hoặc trạng thái chưa vẽ:** viết mô tả ngắn trước (màn làm gì, hiện gì, nút nào, luật nào). Hiệu duyệt rồi mới code. Không tự nghĩ ra màn mới.
- **Làm theo nhóm:** mỗi lần 3–4 màn, xong thì dừng cho Hiệu duyệt. Hiệu có thể cho gộp nhiều nhóm.
- **Ghi lại:** chỗ nào khác bản vẽ thì ghi vào `web/README.md`, mục "Chỗ code khác bản vẽ". Thay đổi máy chủ thì ghi vào `server/README.md` để báo Khoa.
- **Không tự commit**, không tự đổi nguyên tắc nghiệp vụ trong `CLAUDE.md`.
- **Không đưa vào repo:** `.env`, khóa, mật khẩu, dữ liệu thật. Dữ liệu test phải tự bịa và ghi rõ là dữ liệu mẫu.

## 8. Skill và công cụ phải cài

Hiệu yêu cầu dùng hai skill này khi làm CampusHub. Cả hai **không** đưa vào commit.

| Skill | Dùng để | Cách cài |
|---|---|---|
| `karpathy-guidelines` | Cách viết code: nêu giả định, viết đơn giản, sửa đúng chỗ, mỗi bước có cách kiểm chứng | Trong Claude Code: `/plugin marketplace add forrestchang/andrej-karpathy-skills`, rồi `/plugin install andrej-karpathy-skills@karpathy-skills`. Hoặc chép `SKILL.md` của bộ đó vào `~/.claude/skills/karpathy-guidelines/`. Máy hiện tại cài theo cách thứ hai. |
| `impeccable` | Thiết kế giao diện: hook kiểm tra sau mỗi lần sửa file giao diện, bộ dò lỗi, agent duyệt thiết kế | Ở gốc repo: `npx impeccable install --providers=claude --scope=project`. Lệnh này cài vào `.claude/skills/impeccable` và `.claude/agents/`. `PRODUCT.md` và `DESIGN.md` có sẵn trong repo, không cần chạy lại `/impeccable init`. Thư mục `.impeccable/` không commit: máy mới chưa có, agent `impeccable-documenter` tạo lại `design.json` từ `DESIGN.md` khi cần. Hook kiểm tra sau mỗi lần sửa: xem bằng `/impeccable hooks status`, bật bằng `/impeccable hooks on`. |

Ghi chú gốc của hai skill nằm ở thư mục cha (không thuộc repo): `AdrejiKapathySkill.md`, `ImppecableReadME.md`.

**Các phần của Impeccable dùng mỗi nhóm màn:**
- **Bộ dò lỗi:** `IMPECCABLE_NO_TELEMETRY=1 .claude/skills/impeccable/scripts/impeccable detect <các file>`.
- **Agent `impeccable-finish-reviewer`:** duyệt bản đã làm, ra danh sách lỗi cần sửa. Sửa xong gửi lại cho chấm, tới khi nó ra "ship".
- **Agent `impeccable-documenter`:** cập nhật `DESIGN.md` (có commit) và `.impeccable/design.json` (chỉ trên máy) theo code đã làm.

## 9. Thế nào là "xong" một nhóm màn

1. Màn theo Lịch bloc. Giữ đủ chữ và luật của bản vẽ. Chỗ khác bản vẽ đã ghi vào `web/README.md`.
2. Màn dùng bộ chuyển động trong `web/src/components/lich/motion.tsx`. Khung xương đo bằng script: vị trí các khối lúc đang tải và lúc đã tải phải bằng nhau theo chiều dọc.
3. API mới làm theo thứ tự: sửa `server/src/contract.ts`, rồi handler, rồi `docs/api.md`, rồi test, rồi ghi vào `server/README.md`.
4. Kiểm tra sạch: test ở `web/` và `server/` (cả `npm run test:db`), typecheck, build.
5. Bấm thử cả luồng bằng Playwright, không có lỗi trong console.
6. Bộ dò của Impeccable không báo gì. Agent duyệt thiết kế ra "ship". Agent ghi tài liệu đã cập nhật `DESIGN.md`.
7. Cập nhật `CLAUDE.md` (nếu đổi luật hay danh sách màn) và **file này**. Rồi báo Hiệu duyệt.

**Script bấm thử (Playwright)** nằm ở `web/e2e/` (chuyển vào repo ngày 05/10/2026). Hướng dẫn: `web/e2e/README.md`.
- `npm run e2e`: mọi luồng.
- `npm run e2e:khung-xuong`: đo khung xương. Chỉ cần vị trí dọc (`y`) lúc tải và lúc đã tải bằng nhau; khác chiều rộng là bình thường.
- Máy chủ chạy bằng `npm start` khi bấm thử. Bản `npm run dev` có lúc tự khởi động lại trên Windows, làm mất phiên đăng nhập giữa chừng.
- Nhóm màn mới thì thêm kiểm tra vào script của nhóm, hoặc tạo script mới.

## 10. Bản đồ nhanh

| Cần tìm | Ở đâu |
|---|---|
| Luật nghiệp vụ (dùng chung web và máy chủ) | `web/src/lib/` (`actions.ts`, `selectors.ts`, `reconcile.ts`, `members-file.ts`) |
| Dữ liệu mẫu | `web/src/lib/seed.ts` (số phải khớp `design/README.md` mục 8) |
| Màn web | `web/src/app/` (mỗi thư mục là một đường dẫn) |
| Thành phần Lịch bloc dùng chung | `web/src/components/lich/` |
| Màu, chữ, nút của Lịch bloc | `web/src/app/lich.css` |
| Gọi API từ web | `web/src/api/` (`client.ts`, `queries.ts`, `exports.ts`) |
| Hợp đồng API | `server/src/contract.ts`, `docs/api.md` |
| Kiểm tra quyền | `server/src/access.ts` |
| Ai thấy trường dữ liệu nào | `server/src/views.ts` |
| Lưu PostgreSQL | `server/src/db/`, `server/db/migrations/`, `server/docker-compose.yml` |
| Bản vẽ gốc (không sửa tay) | `design/screens/`, mô tả ở `design/README.md` |
| Kế hoạch 10 tuần ban đầu | `docs/ke-hoach-mvp.md` |
| Script bấm thử | `web/e2e/` |
