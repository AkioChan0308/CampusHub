# Thiết kế giao diện CampusHub MVP

*Bản vẽ ngày 02/10/2026, làm bằng Claude Design. Màu và chữ chưa được Vinh (Design Lead) duyệt.*

Bản vẽ có 16 màn cho 4 nhóm người dùng: ban điều hành CLB (laptop), thành viên (điện thoại), sinh viên chưa vào CLB (điện thoại), ban quản lý CLB của trường kiêm mentor (laptop). Đọc file này trước khi làm bất kỳ màn hình nào.

- Xem nhanh: mở `design/screens/index.html` bằng trình duyệt, bấm qua lại giữa các màn.
- Lấy bố cục và chữ: đọc `design/screens/<tên màn>.html`. Mỗi file là HTML thường, style viết thẳng trong thẻ.
- Màu, chữ, nút, nhãn của code: hệ Lịch bloc (`DESIGN.md`, `web/src/app/lich.css`). Bản vẽ vẫn mang màu tím cũ, xem mục 2.
- Bản gốc để Vinh sửa: https://claude.ai/artifact/KnnMwatGJ9QjEsp5TC1BWc (riêng tư, Hiệu phải chia sẻ thì người khác mới mở được).

Mọi tên người, tên CLB, số tiền và ngày trong bản vẽ là **dữ liệu mẫu tự đặt**, không phải số liệu thật. Chữ trong ngoặc vuông, ví dụ `[nhà cung cấp cloud]`, là chỗ chưa có thông tin.

## Cách dùng bản vẽ khi code

1. Màn đã vẽ: làm đúng bố cục, đúng chữ tiếng Việt và đúng các trạng thái có trong bản vẽ. Chữ trong ngoặc vuông giữ nguyên dạng chỗ trống, không tự điền.
2. Màn hoặc trạng thái chưa vẽ (mục 7): hỏi Hiệu trước khi tự thiết kế. Nếu buộc phải làm tạm, chỉ dùng các lớp và biến trong `web/src/app/lich.css`, không thêm màu hay font mới.
3. Bản vẽ là ảnh tĩnh. Mọi con số (29/42, 3.120.000 ₫…) khi code phải tính từ dữ liệu.
4. Nút và link trong bản vẽ chỉ để xem luồng. Hành vi thật theo mục 5 (luật nghiệp vụ), `CLAUDE.md` và `docs/ke-hoach-mvp.md`.
5. Không sửa tay các file trong `design/screens/`: chúng được tạo lại từ bản gốc (mục 10).

## 1. Thư mục

| Đường dẫn | Nội dung |
|---|---|
| `design/README.md` | File này: đặc tả từng màn, luật nghiệp vụ, những gì chưa vẽ |
| `design/screens/` | 16 màn ở dạng HTML thường và `index.html` để xem cả bộ |
| `design/nguon-claude-design/` | Bản gốc tải từ Claude Design (`canvas.json` và `*.dc.html`) |
| `design/tools/chuyen-doi.py` | Chuyển bản gốc sang `design/screens/` |

## 2. Hình thức

Bản vẽ dùng hệ màu tím cũ: tím CampusHub `#604ABD`, chữ Montserrat và Be Vietnam Pro. Hiệu duyệt hệ "Lịch bloc" thay thế ngày 03/10/2026. Ngày 05/10/2026 code bỏ hẳn hệ cũ và xóa file `design/ui.css`.

Khi code:
- Màu, chữ, nút, nhãn, bo góc: theo `DESIGN.md` và `web/src/app/lich.css`. Không lấy màu hay kiểu từ bản vẽ.
- Từ bản vẽ chỉ lấy: màn cần có những gì, chữ tiếng Việt, các trạng thái và luật nghiệp vụ.

Những điều của bản vẽ vẫn giữ:
- Khung màn: laptop 1440×900 cho ban điều hành và nhà trường, điện thoại 390×844 cho thành viên và sinh viên.
- Trên điện thoại, mọi chỗ bấm cao tối thiểu 44px.
- Biểu tượng: nét vẽ SVG khung 24×24, màu theo chữ. Không dùng emoji, không dùng icon nhiều màu.
- Số tiền dùng `font-variant-numeric: tabular-nums` để các cột thẳng hàng. Mã trong nội dung chuyển khoản dùng JetBrains Mono.
- Không dùng: nền chuyển màu (gradient), emoji, thẻ có viền màu một bên, font Inter, Roboto, Arial.

## 3. Thành phần dùng chung

Thành phần của code nằm ở `web/src/components/lich/` và `web/src/app/lich.css`. Danh sách và luật dùng: `DESIGN.md`. Các quy ước sau của bản vẽ vẫn giữ:
- Mỗi vùng tối đa một nút chính.
- Ô đánh dấu đồng ý không bao giờ đánh dấu sẵn.
- Bộ lọc dạng viên dùng `aria-pressed`; mục menu đang chọn dùng `aria-current="page"`.
- Bảng: cột số canh phải, dòng tổng nằm trong `tfoot`.
- Số việc chờ hiện cạnh mục menu, ví dụ 3 đơn xin vào.
- Menu dưới của thành viên có ba mục: Điểm danh, Quỹ, Của tôi.

Khung QR trong bản vẽ (ô vuông có 3 góc định vị) chỉ là chỗ đặt. Khi code, thay bằng mã QR thật tạo từ dữ liệu.

## 4. Danh sách màn

### Ban điều hành CLB · laptop

Sidebar giống nhau ở mọi màn: logo; nút đổi CLB (tên CLB, vai trò, học kỳ); menu Trang chủ, Thành viên, Điểm danh; nhóm Sổ quỹ (Đợt thu, Đối soát sao kê, Đề xuất và duyệt chi, Dự trù kỳ); nhóm Nhiệm kỳ (Bàn giao); người đang đăng nhập ở đáy.

| Màn | Màn này để làm gì | Hiện những gì | Hành động |
|---|---|---|---|
| `BDH-TrangChu` · Việc cần làm | Mở ra là thấy việc đang chờ mình | Việc chờ: đơn xin vào (kèm đơn cũ nhất gửi bao lâu), khoản chi chờ duyệt, giao dịch sao kê chưa khớp, dự trù đang thiếu (chỉ hiện khi số dư cuối kỳ dự kiến âm; với dữ liệu mẫu thì không hiện). Hai sự kiện sắp tới. Đợt thu đang mở: đã đóng/tổng, chia theo cách đóng. Số dư quỹ và 3 giao dịch gần nhất | Mở QR điểm danh, mời thành viên, tạo sự kiện, sao chép link đóng quỹ. Mỗi việc chờ dẫn sang màn xử lý việc đó |
| `BDH-ThanhVien` · Thành viên | Duyệt người xin vào, xem danh sách | Đơn xin vào: họ tên, năm học, ngày gửi, lý do. Bảng: họ tên, ban, vai trò, điểm danh kỳ này, quỹ kỳ này, đã nhận lời mời chưa | Duyệt, từ chối đơn. Tìm, lọc theo ban. Nhập Excel, xuất Excel, tạo link mời |
| `BDH-QR` · Chiếu QR điểm danh | Chiếu lên máy chiếu hoặc màn laptop trong buổi sinh hoạt. Màn này không có sidebar | Tên buổi, giờ, điểm danh mở đến mấy giờ. Mã QR đổi mỗi 30 giây, kèm đếm ngược. Số người đã điểm danh/tổng. 6 người vừa điểm danh, có nhãn "Điểm danh tay · người làm" | Điểm danh tay, đóng điểm danh, thoát chế độ chiếu |
| `BDH-DotThu` · Đợt thu | Biết ai đã đóng, ai chưa | Mức thu, hạn, tài khoản nhận (tên thủ quỹ). Ba ô: đã đóng, báo đã chuyển, chưa đóng. Bộ lọc. Bảng: họ tên, mã trong nội dung chuyển khoản, trạng thái, cách đóng, ngày ghi nhận | Sao chép link đóng quỹ, sang đối soát, ghi nhận tay, ghi tiền mặt |
| `BDH-DoiSoat` · Đối soát sao kê | Thay việc dò tay sao kê với Sheets. Người dùng chính là thủ quỹ | File sao kê đã tải (tên, số giao dịch, khoảng ngày, mẫu ngân hàng). Ba ô kết quả: khớp tự động, cần gán tay, không thuộc đợt thu. Bảng cần gán tay: ngày, số tiền, người chuyển, nội dung, lý do chưa khớp, gợi ý thành viên. Người báo đã chuyển nhưng chưa thấy trong sao kê | Tải sao kê khác, chọn thành viên rồi ghi nhận, ghi nhận một lần cho hai người, nhắn hỏi |
| `BDH-DuyetChi` · Đề xuất và duyệt chi | Duyệt chi có người kiểm tra chéo | Tab: chờ duyệt, chờ mentor, đã duyệt, từ chối. Danh sách đề xuất. Chi tiết: loại chi, người đề xuất, thời điểm, thuộc khoản dự trù nào và còn bao nhiêu, chứng từ, lý do, lịch sử | Đề xuất chi, gửi yêu cầu hoàn ứng, duyệt, từ chối kèm ghi chú |
| `BDH-DuTru` · Dự trù kỳ | Biết quỹ đủ hay thiếu, xuất bản dự trù nộp trường | Phép tính 5 ô: số dư hiện tại + thu dự kiến + trường hỗ trợ − dự trù còn phải chi = số dư cuối kỳ dự kiến. Khi kết quả âm: ô cuối nền cam, ghi "Đang thiếu", kèm dòng cảnh báo. Bảng: hoạt động, thời gian, nguồn tiền, dự trù, đã chi (lấy từ sổ quỹ), còn lại, dòng tổng | Thêm hoạt động, xuất Excel theo mẫu của trường, gửi cho mentor |
| `BDH-BanGiao` · Bàn giao nhiệm kỳ | Chuyển CLB cho ban mới mà không mất dữ liệu, không mất quyền | 6 bước kèm trạng thái. Bước 3 đang làm: tài khoản đang nhận quỹ, tài khoản mới (chủ tài khoản, ngân hàng, số tài khoản), số dư cần chuyển, mã giao dịch và ảnh biên lai. Bên phải: bước 4 sẽ làm gì, biên bản gồm những gì | Xuất toàn bộ dữ liệu, quay lại, lưu và sang bước sau |

### Thành viên · điện thoại

Header có nút đổi CLB, vì một người có thể ở nhiều CLB. Menu dưới cùng gồm Điểm danh, Quỹ, Của tôi.

| Màn | Mở từ đâu | Hiện những gì | Hành động |
|---|---|---|---|
| `TV-LoiMoi` · Lời mời và đồng ý dữ liệu | Link mời qua email | CLB nào mời, ai mời, tài khoản đang đăng nhập. Ba ô đồng ý: lưu dữ liệu để quản lý thành viên (bắt buộc), lưu số điện thoại (không bắt buộc), xác nhận đủ 16 tuổi (bắt buộc). Nơi lưu dữ liệu | Đổi tài khoản, đánh dấu từng ô. Nút "Tham gia CLB" bị khóa tới khi đủ 2 ô bắt buộc. Không tham gia. Đọc chính sách dữ liệu |
| `TV-DiemDanh` · Điểm danh xong | Quét QR ở buổi sinh hoạt | Tên buổi, ngày giờ điểm danh. Số buổi đã tham gia trong kỳ, buổi nào vắng | Xem lịch sử điểm danh |
| `TV-DongQuy` · Đóng quỹ | Link đóng quỹ CLB gửi vào nhóm Zalo | Đợt thu, số tiền, hạn. Mã VietQR có sẵn số tiền và nội dung. Người nhận: tên chủ tài khoản viết hoa không dấu như app ngân hàng hiện, kèm "thủ quỹ CLB…, nhiệm kỳ…" và 4 số cuối tài khoản. Nội dung chuyển khoản riêng của thành viên | Sao chép nội dung. "Mình đã chuyển khoản" chuyển trạng thái sang "Báo đã chuyển". Lưu ảnh mã QR |
| `TV-CuaToi` · Của tôi | Menu dưới | Tên, email, ban. Kỳ này: số buổi điểm danh, trạng thái quỹ, link xem sổ quỹ chỉ đọc | Xem và sửa thông tin, tải dữ liệu của tôi, rút đồng ý lưu số điện thoại, rời CLB và xóa dữ liệu |

### Sinh viên chưa vào CLB · điện thoại

| Màn | Hiện những gì | Hành động |
|---|---|---|
| `SV-DanhSach` · Danh sách CLB | Các CLB của trường đang dùng CampusHub: tên, lĩnh vực, số thành viên, lịch sinh hoạt, hoạt động gần nhất, trạng thái (Đang nhận đơn, Đã gửi đơn, Tạm ngưng nhận đơn) | Tìm theo tên, lọc theo lĩnh vực, xem và gửi đơn, xem đơn của tôi |
| `SV-DonXinVao` · Trang CLB và đơn xin vào | Thông tin CLB, giới thiệu do CLB tự viết. Đơn: họ tên (lấy từ tài khoản Google), năm học, lý do (không bắt buộc), ô đồng ý cho ban điều hành xem thông tin để xét đơn | Gửi đơn |

Lĩnh vực dùng đúng 5 nhóm của Google Form khảo sát: Học thuật, nghiên cứu · Nghệ thuật, thể thao · Tình nguyện, xã hội, kỹ năng sống · Tổ chức sự kiện, truyền thông · Khởi nghiệp, hướng nghiệp, thêm "Khác".

### Ban quản lý CLB của trường, mentor · laptop

Sidebar: tên trường, menu Các CLB, Dự trù và báo cáo, Khoản chờ duyệt, Xuất Excel. Trong bản vẽ, cán bộ quản lý CLB kiêm mentor hành chính.

| Màn | Hiện những gì | Hành động |
|---|---|---|
| `NT-TongQuan` · Các CLB | Ba ô: số CLB có hoạt động trong 30 ngày, số CLB không có hoạt động trong 30 ngày, số CLB đã nộp dự trù. Bảng: CLB, lĩnh vực, thành viên, buổi có điểm danh trong kỳ, hoạt động gần nhất, trạng thái dự trù, đã chi/dự trù | Lọc, xem chi tiết, xuất Excel |
| `NT-ChiTietCLB` · Chi tiết một CLB | Chủ nhiệm, mentor. Dự trù và đã chi theo từng hoạt động, ngày nộp. Sinh hoạt kỳ này. Khoản chờ mentor duyệt: trên 2.000.000 ₫, ban điều hành đã duyệt, thuộc khoản dự trù nào, chứng từ. Đề nghị hỗ trợ từ trường. Nhiệm kỳ và biên bản bàn giao gần nhất | Tải bản dự trù, duyệt hoặc từ chối khoản chi (từ chối phải ghi chú), xem đề nghị, xem biên bản |

## 5. Luật nghiệp vụ thể hiện trên màn

**Điểm danh**
- QR đổi mỗi 30 giây.
- Mỗi điện thoại chỉ điểm danh cho một người trong một buổi.
- Điểm danh tay ghi lại tên người thực hiện.
- Không lấy vị trí của ai.
- Thành viên chưa nhận lời mời vẫn được điểm danh tay.

**Đợt thu và đóng quỹ**
- Mỗi thành viên có một mã riêng trong nội dung chuyển khoản.
- Tiền chuyển thẳng vào tài khoản của thủ quỹ hoặc của CLB. CampusHub chỉ ghi sổ, không giữ tiền.
- Màn đóng quỹ ghi rõ tên người nhận và vai trò thủ quỹ.
- Đóng tiền mặt thì thủ quỹ ghi tay.

**Đối soát sao kê**
- Thủ quỹ tự tải file sao kê từ app ngân hàng lên. CampusHub không kết nối với tài khoản ngân hàng.
- Giao dịch đúng mã và đúng số tiền được khớp tự động.
- Giao dịch còn lại thủ quỹ gán tay. Bốn lý do chưa khớp lấy từ câu trả lời của chủ nhiệm ở Khảo sát 01:
  - thiếu mã thành viên;
  - một lần chuyển cho nhiều người (chuyển hộ);
  - thiếu tiền;
  - sai cú pháp.
- Chưa bấm "Ghi nhận" thì sổ quỹ chưa đổi.

**Duyệt chi**
- Không ai được duyệt khoản do chính mình đề xuất.
- Từ chối phải ghi chú.
- Khoản trên 2.000.000 ₫ cần mentor duyệt thêm.
- Chứng từ không bắt buộc. Khoản chưa có chứng từ mang nhãn "Chưa có chứng từ", mọi thành viên đều thấy.
- Mọi thao tác được lưu lịch sử.

**Sổ quỹ:** chỉ thêm, không sửa, không xóa. Muốn điều chỉnh thì thêm bút toán mới. Thành viên xem sổ quỹ ở chế độ chỉ đọc.

**Dự trù:** số dư cuối kỳ dự kiến = số dư hiện tại + tiền dự kiến thu từ đợt thu đang mở + hỗ trợ dự kiến − dự trù còn phải chi.
- Dự trù còn phải chi = cộng phần chưa chi của từng khoản (dự trù − đã chi; khoản nào chi vượt thì tính 0).
- Không trừ tổng dự trù: tiền đã chi đã bị trừ khỏi số dư hiện tại rồi, trừ tổng dự trù là trừ hai lần. Bản vẽ đầu tiên mắc lỗi này (ra −630.000 ₫), đã sửa ngày 02/10/2026.
- Cột "Đã chi" lấy từ sổ quỹ. Chỉ gợi ý dự trù theo các kỳ trước khi CLB đã có ít nhất một kỳ dữ liệu.

**Bàn giao:** sáu bước:
1. chọn ban mới;
2. chốt số dư;
3. đổi tài khoản nhận quỹ (thủ quỹ mới không dùng tiếp được tài khoản của thủ quỹ cũ);
4. chuyển quyền quản trị khỏi email sinh viên của chủ nhiệm cũ (email này bị thu hồi khi tốt nghiệp);
5. ban mới xác nhận;
6. biên bản.

Ban cũ được xem thêm 30 ngày.

**Dữ liệu cá nhân**
- Các ô đồng ý không đánh dấu sẵn, tách theo từng mục đích, có dòng xác nhận đủ 16 tuổi.
- Đơn xin vào cũng có ô đồng ý riêng.
- Khi thành viên xóa dữ liệu, các khoản đã đóng vẫn nằm trong sổ quỹ nhưng không còn tên, để số dư không lệch. Yêu cầu xóa xử lý trong tối đa 20 ngày.

**Phía nhà trường**
- Chỉ thấy các CLB đang dùng CampusHub.
- "Có hoạt động" nghĩa là có ít nhất một buổi được điểm danh trên CampusHub trong 30 ngày.
- Trường thấy dự trù và số đã chi theo từng hoạt động; không thấy danh sách thành viên hay từng khoản đóng quỹ.

## 6. Trạng thái và nhãn

Cột "Nhãn" ghi lớp của bản vẽ cũ (`b-ok` xanh lá, `b-warn` cam, `b-info` tím, `b-mute` xám, `b-bad` đỏ). Trong code, tên trạng thái giữ nguyên; màu nhãn theo `DESIGN.md`.

| Đối tượng | Trạng thái | Nhãn |
|---|---|---|
| Thành viên của CLB | Đã nhận lời mời · Chưa nhận lời mời | chữ thường · `b-mute` |
| Đơn xin vào | Đang chờ · Đã duyệt · Từ chối | `b-info` · `b-ok` · `b-bad` |
| CLB nhận đơn | Đang nhận đơn · Tạm ngưng nhận đơn | `b-ok` · `b-mute` |
| Khoản đóng của thành viên | Chưa đóng · Báo đã chuyển (thành viên tự bấm) · Đã đóng (chuyển khoản hoặc tiền mặt) · Đóng thiếu (còn nợ) | `b-warn` · `b-info` · `b-ok` · `b-warn` |
| Giao dịch trong sao kê | Khớp tự động · Cần gán tay (4 lý do ở mục 5) · Không thuộc đợt thu | không nhãn · `b-warn` · không nhãn |
| Đề xuất chi, hoàn ứng | Chờ duyệt · Chờ mentor · Đã duyệt · Từ chối | `b-info` · `b-info` · `b-ok` · `b-bad` |
| Chứng từ | Có · Chưa có chứng từ | không nhãn · `b-warn` |
| Lượt điểm danh | Quét QR · Điểm danh tay | không nhãn · `b-mute` |
| Bước bàn giao | Xong · Đang làm · Chưa làm | chấm xanh có dấu tick · chấm tím · chấm viền xám |
| Dự trù của CLB (phía trường) | Đã nộp · Chưa nộp | `b-ok` · `b-warn` |
| Hoạt động của CLB (phía trường) | Trong 30 ngày · Quá 30 ngày | không nhãn · `b-mute` |

**Dữ liệu cần lưu để vẽ được các màn trên:**
- Tài khoản (đăng nhập Google; một người ở nhiều CLB), CLB, học kỳ, thành viên của CLB (ban, vai trò, trạng thái lời mời).
- Đồng ý dữ liệu: mục đích, phiên bản văn bản, thời điểm.
- Đơn xin vào.
- Sự kiện, lượt điểm danh (cách điểm danh, người điểm danh tay, thiết bị).
- Đợt thu (mức thu, hạn, tài khoản nhận), khoản đóng của từng thành viên (mã chuyển khoản, cách đóng, trạng thái).
- File sao kê và từng giao dịch (kết quả khớp, lý do).
- Bút toán sổ quỹ; đề xuất chi và hoàn ứng (người duyệt, chứng từ, ghi chú từ chối).
- Dự trù kỳ và từng khoản dự trù (nguồn tiền); đề nghị hỗ trợ từ trường.
- Bàn giao (bước, số dư chốt, tài khoản cũ và mới).
- Nhật ký thao tác; trường và cán bộ quản lý, mentor.

Đây là danh sách lấy ra từ màn vẽ, chưa phải thiết kế cơ sở dữ liệu. Thiết kế cơ sở dữ liệu do Khoa chốt.

## 7. Chưa vẽ: hỏi trước khi làm

- Trạng thái đang tải, danh sách rỗng, lỗi mạng ở mọi màn
- Lỗi khi quét QR: mã hết hạn, người quét không phải thành viên, điện thoại đã điểm danh cho người khác trong buổi này
- Đăng nhập Google, tạo CLB lần đầu
- Danh sách sự kiện, tạo và sửa sự kiện
- Nhập danh sách từ Excel (xem trước, sửa lỗi trước khi lưu)
- Ghi tiền mặt; hoàn tiền khi thành viên chuyển nhầm
- Sổ quỹ đầy đủ, chi tiết một bút toán
- Các bước 1, 2, 4, 5, 6 của bàn giao; mentor xác nhận bàn giao
- Đổi CLB khi một người ở nhiều CLB
- Trang chính sách dữ liệu; nội dung email thông báo (lời mời, kết quả đơn xin vào)
- Bản điện thoại của các màn ban điều hành (bản vẽ chỉ có laptop)

## 8. Dữ liệu mẫu trong bản vẽ

Các số giữa các màn khớp nhau, nên dùng lại được làm dữ liệu mẫu khi test để đối chiếu với bản vẽ. Không dùng làm số liệu thật.

- CLB Cầu lông Sân Nhà, 42 thành viên, học kỳ Fall 2026. Chủ nhiệm Phạm Quốc Bảo, thủ quỹ Lê Thu Hà.
- Đợt thu "Quỹ học kỳ Fall 2026": 100.000 ₫ mỗi người, hạn 10/10/2026.
  - 29 người đã đóng (26 chuyển khoản, 3 tiền mặt), 2 người báo đã chuyển, 11 người chưa đóng.
  - Mã chuyển khoản dạng `QFALL26 A017`.
- Số dư quỹ 3.120.000 ₫, tính như sau: số dư đầu kỳ 1.020.000 ₫ (tự đặt, không hiện trên màn nào) + 2.900.000 ₫ đã thu − 800.000 ₫ thuê sân 4 tuần.
- Dự trù gồm 4 khoản, tổng 6.050.000 ₫, đã chi 800.000 ₫ (thuê sân), còn phải chi 5.250.000 ₫. Số dư cuối kỳ dự kiến: 3.120.000 + 1.300.000 + 1.000.000 − 5.250.000 = +170.000 ₫.
- File sao kê có 32 giao dịch: 26 khớp tự động, 4 cần gán tay, 2 không thuộc đợt thu.
- Hai khoản chi chờ duyệt, tổng 650.000 ₫ (400.000 ₫ và 250.000 ₫). Một khoản 2.300.000 ₫ đang chờ mentor.
- Phía trường có 6 CLB: 5 CLB có hoạt động trong 30 ngày, 4 CLB đã nộp dự trù.

## 9. Chưa chốt (ảnh hưởng tới code)

- **Nhà trường xem tới đâu.** Bản vẽ cho trường xem số tổng hợp theo từng hoạt động. Cho trường xem sâu hơn thì trường hài lòng hơn, nhưng CLB có thể ngại dùng.
- **Ai duyệt khoản trên 2.000.000 ₫:** mentor chuyên môn (giảng viên) hay mentor hành chính của trường. Mức 2.000.000 ₫ là mặc định lấy từ "Phương án nghiệp vụ", chưa chốt.
- **Cú pháp nội dung chuyển khoản** `QFALL26 A017` mới là đề xuất. Nội dung phải ngắn và không dấu; VietQR.io giới hạn 50 ký tự.
- **Mẫu file sao kê** phụ thuộc ngân hàng mà CLB pilot dùng: chưa biết.
- **Thông tin còn trống:** nơi lưu dữ liệu `[nhà cung cấp cloud]`, `[quốc gia]`; mẫu dự trù của trường `[mẫu dự trù của trường]`.
- **Đường dẫn (URL) từng màn và tên component:** Khoa chốt khi dựng khung.
- **Màu và chữ:** Vinh chưa duyệt.

## 10. Khi bản vẽ thay đổi

1. Vinh hoặc Hiệu sửa bản gốc trên claude.ai (link ở đầu file).
2. Lấy bản mới về repo. Agent Claude Code của người tạo bản vẽ đọc được link bằng Artifact tool, action `read`: đọc `project/canvas.json` và từng `project/*.dc.html`, rồi chép vào `design/nguon-claude-design/`.
3. Chạy `python design/tools/chuyen-doi.py` để tạo lại `design/screens/`.
4. Cập nhật file này nếu có màn mới hay luật mới. Ghi ngày sửa ở dòng đầu file.

Tool chuyển đổi chỉ xử lý được màn tĩnh. Nếu bản vẽ có thêm phần động (`{{ }}`, `<sc-for>`, `<dc-import>`), tool sẽ dừng và báo tên file.
