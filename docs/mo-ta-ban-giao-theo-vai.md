# Mô tả: Bàn giao theo từng vai và bàn giao hộ

*Bản 1: 09/11/2026, theo ý Hiệu bàn ngày 01/11/2026 và chốt bốn điểm ngày 09/11/2026. Đây là bản mô tả để duyệt, **chưa có dòng code nào**. Theo luật của dự án, màn hoặc trạng thái chưa có bản vẽ thì viết mô tả trước, Hiệu duyệt rồi mới làm. Chỉ làm ở repo chính, nhánh `develop`. Bản demo đang cho cô xem **không sửa**. Tên đường dẫn, file, bảng đặt tiếng Anh theo luật đặt tên.*

## 1. Vì sao đổi

**Hiện nay (đọc từ mã):**
- Mỗi CLB có **một** bản ghi bàn giao (từ học kỳ này sang học kỳ sau), xong là khóa.
- **Chỉ chủ nhiệm** làm các bước 1 đến 5; người được chọn làm chủ nhiệm mới xác nhận ở bước 6.
- Luôn bàn giao **cả ban một lần**. Chưa có bàn giao riêng một vai.
- Bàn giao xong thì chủ nhiệm mới không bàn giao tiếp được.
- Dữ liệu mẫu và demo bắt đầu ở bước 4.

**Ý của Hiệu (01/11/2026):**
- Bàn giao phải **tùy chọn**, làm được bất cứ lúc nào (chủ nhiệm có việc gấp giữa nhiệm kỳ), và luôn **bắt đầu từ bước 1**.
- Mỗi người giữ vai trong ban điều hành **tự bàn giao vai của mình** cho người khác.
- Chủ nhiệm có thể **bàn giao hộ** vai của người không liên lạc được, nhưng phải chống việc chủ nhiệm tự tiện.

## 2. Đã chốt (Hiệu, 01 và 09/11/2026)

1. **Ai làm gì:**

| Người bấm | Vai được bàn giao | Gọi là |
|---|---|---|
| Phó chủ nhiệm, thủ quỹ, trưởng ban | Chỉ vai của chính mình | **Tự bàn giao** |
| Chủ nhiệm | Vai của chính mình | Tự bàn giao |
| Chủ nhiệm | Vai của người khác (phó chủ nhiệm, thủ quỹ, trưởng ban) | **Bàn giao hộ** |
| Mentor | **Vai chủ nhiệm** khi chủ nhiệm không liên lạc được | Bàn giao hộ (chỉ mentor) |

2. **Người nhận luôn tự xác nhận** (bước 6), nên không ai bị đẩy vai vào khi chưa đồng ý.
3. **Bàn giao hộ vai chủ nhiệm: chỉ mentor.** Phó chủ nhiệm không làm được.
4. **Thế nào là "không liên lạc được" (Hiệu chốt 09/11/2026):** người gửi yêu cầu **ghi tối thiểu 3 lần liên hệ** với người giữ vai, mỗi lần có ngày, kênh (điện thoại, Zalo, email, qua bạn chung) và kết quả, **kèm ít nhất một ảnh chụp màn hình** làm bằng chứng (tin nhắn, nhật ký cuộc gọi). **Mentor duyệt bằng chứng** trước khi bàn giao hộ; bằng chứng chưa đủ thì mentor từ chối và yêu cầu bổ sung. Mức 3 lần lấy từ đề xuất của hội sinh viên UCL (Anh); đó không phải quy định áp dụng ở FPT.
   - Người gửi yêu cầu: **chủ nhiệm** với vai khác; với vai **chủ nhiệm** thì **phó chủ nhiệm hoặc thành viên ban điều hành** gửi bằng chứng cho mentor, và chỉ mentor quyết và thực hiện.
5. **Người thứ hai xác nhận và duyệt bằng chứng** để chủ nhiệm không tự quyết một mình khi bàn giao hộ:
   - **Mentor duyệt.** Vai **thủ quỹ bắt buộc có mentor** (vì liên quan tiền).
   - CLB chưa có mentor: dùng phó chủ nhiệm duyệt cho các vai khác thủ quỹ.
6. **Thứ tự và thời hạn chờ 3 ngày:** người gửi gửi yêu cầu kèm bằng chứng → **mentor duyệt bằng chứng trước** → chỉ sau khi duyệt, hệ thống mới **báo người giữ vai và bắt đầu đếm 3 ngày** (tránh báo nhầm khi bằng chứng chưa đủ). Trong 3 ngày họ bấm **"Tôi vẫn đảm nhận"** thì yêu cầu bị hủy. Im lặng hết 3 ngày thì được làm tiếp các bước.
7. **Trưởng ban (Hiệu chốt 09/11/2026):** **mỗi ban đúng một trưởng ban**, và **một người được làm trưởng nhiều ban**. Hệ quả:
   - Bàn giao vai trưởng ban là bàn giao **theo từng ban**: chọn ban rồi chọn người nhận. Người đang làm trưởng ba ban thì bàn giao riêng từng ban được, không phải giao cả ba.
   - Bỏ giới hạn "tối đa 10 trưởng ban" ở máy chủ, vì mỗi ban chỉ có một trưởng.
   - Bàn giao cả ban thì mỗi ban chọn một trưởng ban (một người có thể được chọn cho nhiều ban).
8. **Danh sách ban do CLB cấu hình trước (Hiệu chốt 09/11/2026).** Số ban và tên ban không gõ tay lúc gán trưởng ban: gán trưởng ban chỉ **chọn từ danh sách ban đã tạo**, nên luôn biết đang nói tới ban nào.
   - **Chỉ chủ nhiệm** tạo, đổi tên và xóa ban.
   - **CLB mới có sẵn vài ban mẫu** (gợi ý: Ban chủ nhiệm, Hậu cần, Truyền thông, Sự kiện). Chủ nhiệm thêm, bớt, đổi tên. Tên ban mẫu chỉ là gợi ý, **chưa có nguồn** nào nói CLB thường có những ban này.
   - **Xóa ban bị chặn** khi ban còn thành viên hoặc còn trưởng ban. Chủ nhiệm phải chuyển thành viên sang ban khác và bàn giao vị trí trưởng ban trước.
9. **Quy tắc đi kèm (đề xuất, Hiệu sửa):**
   - Tên ban **không trùng** trong cùng một CLB (không phân biệt hoa thường), tối đa 60 ký tự như ô `department` hiện nay.
   - **Đổi tên ban** giữ nguyên thành viên và trưởng ban; biên bản bàn giao cũ giữ tên ban tại thời điểm đó.
   - **"Chưa xếp ban"** là trạng thái của thành viên mới nhận lời mời, **không phải một ban** và không có trưởng ban.
   - Ban được **để trống trưởng** (xem mục 3.2). Chưa đặt giới hạn số ban.
   - Nhập danh sách thành viên từ file: cột ban phải khớp tên một ban đã tạo; tên chưa có thì hỏi chủ nhiệm có tạo ban mới không, không tự tạo.
10. **Bằng chứng (Hiệu chốt 09/11/2026):** ảnh chỉ **người gửi yêu cầu và mentor** xem. Người bị bàn giao hộ xem được **nhật ký chữ** (ngày, kênh, kết quả) nhưng **không xem ảnh**. **Ảnh bị xóa sau 30 ngày** (trùng hạn "Báo vấn đề"), nhật ký chữ giữ lại. Giới hạn đề xuất (chưa có nguồn, Hiệu sửa): ảnh JPG hoặc PNG, tối đa 5 MB mỗi ảnh, tối đa 10 ảnh mỗi yêu cầu.

11. **Tự bàn giao bắt đầu bằng đơn gửi chủ nhiệm (Hiệu chốt 09/11/2026).** Phó chủ nhiệm, thủ quỹ, trưởng ban không phải chờ chủ nhiệm mở bàn giao:
   - **Bước 1 của họ là "Gửi đơn bàn giao"**: ghi vai (với trưởng ban: chọn ban), **người nhận đề xuất** và lý do. Người nhận phải là thành viên đã nhận lời mời.
   - Chủ nhiệm **nhận thông báo** và có màn **Duyệt đơn bàn giao**. **Duyệt** thì người gửi sang bước 2 (không phải chọn lại người nhận). **Từ chối** thì **bắt buộc ghi lý do**; người gửi sửa và gửi lại, đơn bị từ chối giữ trong lịch sử.
   - Người gửi **rút đơn** được khi chưa duyệt. Mỗi vai một đơn tại một thời điểm.
   - **Chủ nhiệm không cần đơn** khi bàn giao vai của mình (không còn ai ở trên để duyệt; khi cần thì đã có đường mentor ở mục 2.3). Chủ nhiệm vẫn tự mở bàn giao cả ban (7 bước hiện có) và bàn giao hộ như đã duyệt.
   - Bước 6 không đổi: người nhận vẫn tự xác nhận hai bước.

## 3. Đề xuất mặc định cho các điểm chưa hỏi (Hiệu sửa chỗ nào không đồng ý)

1. **Mỗi người một chức danh** (chủ nhiệm, phó chủ nhiệm, thủ quỹ, trưởng ban, thành viên) như hiện nay; nhận chức danh mới thì chức danh cũ bỏ. **Ngoại lệ đã chốt:** trưởng ban được giữ nhiều ban cùng lúc (mục 2.7).
2. **Vai hoặc ban được để trống** (ví dụ thủ quỹ, hoặc một ban chưa có trưởng), kèm cảnh báo đỏ ở trang chủ ban điều hành.
3. **Trưởng ban:** đã chốt ở mục 2.7, không còn là điểm mở.
4. **Nhãn kỳ:** bàn giao giữa kỳ giữ học kỳ hiện tại và ghi "bàn giao giữa kỳ". Học kỳ của CLB chỉ đổi khi bàn giao cả ban cuối kỳ.
5. **Hủy được** trước khi người nhận xác nhận. Bản nháp và lịch sử giữ lại, đánh dấu "đã hủy".
6. **Nhiều lần bàn giao:** mỗi vai một lần tại một thời điểm, các vai khác nhau chạy song song. Lần cũ giữ làm lịch sử chỉ đọc. Chủ nhiệm mới xong vẫn bàn giao tiếp được.
7. **Chống làm phiền:** sau khi người giữ vai bấm "Tôi vẫn đảm nhận", chủ nhiệm **không gửi lại yêu cầu cùng vai trong 7 ngày**. Muốn đổi tiếp thì chuyển mentor quyết.
8. **Người bị bàn giao hộ:** nhận thông báo ngay (lúc bắt đầu), vẫn xem được mọi thứ liên quan tới mình tới lúc xác nhận; sau khi xong xem chỉ đọc như quy tắc hiện nay. Có nút **"Báo vấn đề"** trong 30 ngày, mentor xem; khôi phục bằng một lần bàn giao ngược.
9. **Chỉ chuyển quyền, không chuyển dữ liệu riêng** của người cũ (email, số điện, ảnh chứng từ chỉ thủ quỹ và chủ nhiệm mới xem).

## 4. Luồng

**Tự bàn giao một vai** (bảy bước, bước nào không liên quan ghi "không áp dụng"; với phó chủ nhiệm, thủ quỹ, trưởng ban, bước 1 là gửi đơn lên chủ nhiệm, duyệt xong mới sang bước 2; mục 2.11):

| Bước | Một vai |
|---|---|
| 1. Chọn người nhận | Chọn vai (của mình) và người nhận, phải là thành viên đã nhận lời mời |
| 2. Chốt số dư | Chỉ khi vai là thủ quỹ |
| 3. Kiểm tra kho | Chỉ những mục kho người đó giữ, và việc cần làm đang giao cho họ |
| 4. Đổi tài khoản nhận quỹ | Chỉ khi vai là thủ quỹ |
| 5. Chuyển quyền quản trị | Chỉ tài khoản (fanpage, Drive, email) người đó giữ |
| 6. Người nhận xác nhận | Hai bước như hiện nay (cảnh báo, rồi gõ BAN GIAO), chỉ đổi **một vai** |
| 7. Biên bản | Ghi ai giao, ai nhận, vai nào, lý do, những gì đã chuyển |

**Bàn giao hộ:** chủ nhiệm (với vai chủ nhiệm: phó chủ nhiệm hoặc thành viên ban điều hành gửi lên mentor) bấm "Bàn giao hộ", chọn vai, ghi lý do, **nhật ký tối thiểu 3 lần liên hệ kèm ảnh chụp màn hình** → **mentor duyệt bằng chứng** (hoặc từ chối, yêu cầu bổ sung; CLB chưa có mentor thì phó chủ nhiệm duyệt cho các vai khác thủ quỹ) → hệ thống **báo người giữ vai và toàn ban, bắt đầu đếm 3 ngày** → nếu họ bấm "Tôi vẫn đảm nhận" thì hủy; nếu im lặng thì làm tiếp các bước 1 đến 5 như trên → người nhận xác nhận → biên bản.

## 5. Ảnh hưởng tới mã (ước lượng, chưa làm)

- **Dữ liệu:** từ một bản ghi bàn giao mỗi CLB sang **danh sách** có loại (cả ban, một vai, bàn giao hộ) và trạng thái (đang mở, đã xong, đã hủy), kèm nhật ký liên hệ và hạn chờ. Cần migration mới đặt tên tiếng Anh; migration đã chạy giữ nguyên.
- **Ban và trưởng ban:** hiện "ban" chỉ là một ô chữ (`department`, tối đa 60 ký tự) trên từng thành viên, **không có bảng ban và không có ràng buộc nào**. Để có luật "mỗi ban đúng một trưởng ban, một người làm trưởng nhiều ban", cần:
  - bảng **ban của CLB** (tên ban, trưởng ban là một người; mỗi ban một trưởng);
  - đưa các chữ `department` đang có (ví dụ "Ban chủ nhiệm", "Chưa xếp ban") thành các ban, và đặt trưởng ban theo vai `head` hiện có (nếu một ban đang có hai người vai `head` thì phải chọn một người, Hiệu quyết);
  - `Membership.department` vẫn là ban mà người đó thuộc, tách khỏi chuyện làm trưởng;
  - đổi `headIds` (danh sách) ở bàn giao cả ban thành "trưởng của từng ban";
  - sửa màn Thành viên (nút "Sửa vai và ban") để **chọn ban từ danh sách** thay vì gõ chữ, đặt trưởng theo ban, và hiển thị người làm trưởng nhiều ban;
  - thêm khối **"Các ban"** ở màn Thành viên (chỉ chủ nhiệm thấy nút): danh sách ban, số thành viên, trưởng ban, nút Thêm, Đổi tên, Xóa (bị chặn khi còn người). Màn này **chưa có bản vẽ**, cần Hiệu duyệt riêng;
  - nhập danh sách thành viên từ file: kiểm cột ban theo danh sách (mục 2.9);
  - tạo CLB mới (`/clubs/new`) tạo kèm các ban mẫu;
  - bỏ giới hạn 10 ở `server/src/schemas.ts`, thêm test cho luật mới và migration mới đặt tên tiếng Anh.
- **Tải ảnh bằng chứng (chưa có hạ tầng nào):** hiện sản phẩm **chưa tải ảnh ở đâu cả** (ảnh chứng từ của khoản chi chỉ là dấu "có chứng từ", bản MVP chưa tải ảnh). Cần dựng thêm: nơi lưu file, kiểm loại và dung lượng ở máy chủ, quyền xem (chỉ người gửi và mentor, kiểm ở `access.ts`), tác vụ **xóa ảnh sau 30 ngày**, và phản hồi API không trả đường dẫn cho người bị bàn giao hộ. Đây là phần việc lớn nhất của tính năng, và là lần đầu sản phẩm lưu ảnh nên nên làm một nhóm việc riêng. Chi phí lưu trữ chưa tính vào bảng dự toán CP4.
- **API:** thêm bắt đầu, hủy, phản hồi "tôi vẫn đảm nhận", ghi liên hệ, tải ảnh bằng chứng, mentor duyệt hoặc từ chối bằng chứng, xác nhận của người thứ hai. Sửa `server/src/contract.ts` trước, rồi handler, rồi `docs/api.md`, rồi chạy `npm test` và `npm run test:db`. **Báo Khoa**, vì đổi hợp đồng API và hành vi `acceptHandover`.
- **Quyền:** thêm vào `web/src/lib/selectors.ts` và kiểm ở `server/src/access.ts` (không tin giao diện).
- **Giao diện:** nút "Bắt đầu bàn giao" (chọn loại, ghi lý do), nút "Bàn giao hộ", nhật ký liên hệ, danh sách các lần bàn giao cũ, hộp "Cần bạn phản hồi" cho người giữ vai (dùng khối "Cần bạn xác nhận" và chuông thông báo đã có). Giữ hệ Lịch bloc, khung xương và chuyển động theo luật.
- **Mentor:** hiện CLB chỉ có tên mentor dạng chữ (`club.mentor`), chưa nối tới tài khoản. Màn nhà trường đã có chỗ mentor xác nhận biên bản. Cần quyết cách nối "mentor của CLB này" với tài khoản cán bộ trường.
- **Dữ liệu mẫu và demo:** đổi bắt đầu từ bước 1 thì phải quay lại video trang đầu; để sau, khi nhóm chốt. Đã quay lại ngày 11/11/2026: video ban điều hành có thêm cảnh "Bàn giao một vai" (trưởng ban Gia Huy gửi đơn, chủ nhiệm duyệt, Phan Thanh Tâm xác nhận) trước cảnh "Bàn giao cả ban".
- **Nút "Bàn giao vai của bạn" (11/11/2026):** chỉ hiện với người đang có vai trong ban. Chủ nhiệm mới ở bước 6 chưa gõ BAN GIAO vẫn là thành viên thường, chưa có vai nào để bàn giao, nên màn xác nhận của họ không có nút này.
- **Trang Bàn giao từng vai tự cập nhật (11/11/2026):** hỏi lại mỗi 3 giây, để người giao thấy đơn vừa được duyệt và người nhận thấy đơn vừa tới bước 6 mà không phải tải lại trang.
- **Test:** thêm cho các luật mới ở cả web và máy chủ.

## 6. Việc ngoài phần mềm (phần mềm không giải quyết được)

- Thủ quỹ nhận tiền vào tài khoản cá nhân rồi biến mất: sản phẩm không giữ tiền nên không xử lý được. Cần quy trình ngoài phần mềm (CLB hoặc phòng quản lý CLB).
- Người cũ đã tải Excel hoặc chụp màn hình trước khi giao thì không thu hồi được. Đề xuất thêm dòng nhắc "hãy xóa bản đã tải" ở bước xác nhận.
- "Đã thông báo" hiện chỉ là thông báo trong ứng dụng, chưa có email. Cần kênh khác (Zalo?) cho trường hợp người giữ vai không mở app.
- Phòng quản lý CLB của FPT có quy định miễn nhiệm, khuyết chức danh, hạn bổ sung không? Chưa ai hỏi.
- **Ảnh bằng chứng chứa dữ liệu cá nhân** của người không liên lạc được và có thể của người thứ ba (tên, số điện thoại, nội dung tin nhắn). Người bị bàn giao hộ chưa đồng ý cho lưu. Dự án có nguyên tắc dữ liệu cá nhân (Luật 91/2025, Nghị định 356/2025); nhóm chưa hỏi người hiểu luật xem cách lưu 30 ngày rồi xóa có đủ không. Đây là thiết kế theo nguyên tắc tối thiểu, không phải tư vấn pháp lý.
- Điều khoản bàn giao hộ có nên ghi vào điều lệ CLB không, có cần người hiểu luật xem không? Nhóm chưa hỏi luật sư; đây là thiết kế theo nguyên tắc tối thiểu quyền, **không phải tư vấn pháp lý**.

## 7. Cần Hiệu duyệt

1. Bảng "ai làm gì" và bốn điều đã chốt ở mục 2 đã đúng ý chưa.
2. Các mặc định ở mục 3: giữ hay sửa.
3. Cách nối mentor với CLB (mục 5).
4. Khi chuyển dữ liệu ban hiện có (mục 5): một ban đang có hai người vai trưởng ban thì chọn ai làm trưởng.
5. Quy tắc đi kèm về ban ở mục 2.9 (tên không trùng, đổi tên, "Chưa xếp ban", nhập từ file) và bốn ban mẫu gợi ý.
6. Giới hạn ảnh bằng chứng đề xuất ở mục 2.10 (5 MB, 10 ảnh, JPG hoặc PNG) và việc tách "tải ảnh" thành một nhóm việc riêng, làm sau phần chưa cần ảnh nếu muốn ra sớm (ghi chữ trước, ảnh sau).
7. Duyệt thì tôi làm theo thứ tự: dữ liệu và API, rồi quyền, rồi giao diện, rồi test, và chỉ commit khi Hiệu bảo.

## 8. Đã code ngày 09/11/2026: cách làm cho các điểm mô tả chưa nói rõ (Hiệu sửa chỗ nào không đồng ý)

- **Mentor là ai:** mọi tài khoản cán bộ trường (kiểu "staff") đều duyệt được và xem ảnh; chưa liên kết riêng từng mentor với từng CLB (dữ liệu hiện chỉ có tên mentor trong hồ sơ CLB). **"CLB có mentor"** nghĩa là hồ sơ CLB có ghi tên mentor.
- **Ai gửi bàn giao hộ (Hiệu chọn 09/11/2026, thay mục 2.4):** mọi người trong ban điều hành gửi được cho mọi vai khác, trừ vai của chính mình. Vai chủ nhiệm vẫn chỉ mentor duyệt. Mentor bấm một nút "Thực hiện bàn giao hộ" làm thay các bước 3 và 5 (ghi quyền quản trị mọi tài khoản kho người giữ vai đang giữ sang người nhận); người nhận vẫn xác nhận ở bước 6.
- **Vai khác khi CLB chưa có mentor:** phó chủ nhiệm (không phải người gửi, không phải người giữ vai) duyệt bằng chứng; vai thủ quỹ và chủ nhiệm cần mentor, chưa có thì không gửi được.
- **3 ngày chờ:** tính từ lúc bằng chứng được duyệt. Hết hạn thì đơn tự sang bước làm vào lần kế tiếp có người mở trang hoặc gọi API (chưa có tác vụ chạy nền). Người gửi làm bước 2 đến 5 thay người giữ vai (thủ quỹ: người gửi nhập tài khoản nhận quỹ mới của người nhận).
- **"Tôi vẫn đảm nhận":** đơn thành "người giữ vai vẫn đảm nhận"; người gửi không gửi lại cùng vai trong 7 ngày.
- **Ảnh:** tải lên bằng JSON mã hóa base64; JPG hoặc PNG thật (máy chủ đọc vài byte đầu), tối đa 5 MB mỗi ảnh, tối đa 10 ảnh mỗi yêu cầu; mỗi người giữ tối đa 10 ảnh chưa gắn yêu cầu. Chỉ người tải lên và cán bộ trường xem; người giữ vai chỉ thấy số ảnh. Xóa sau 30 ngày kể từ lúc tải, làm vào lần kế tiếp có người gọi API; nhật ký chữ giữ lại. Bản demo lưu ảnh trong bộ nhớ hoặc trong bảng `evidence_files`.
- **Chưa làm:** kiểm tra tự động bằng chứng giả (mentor tự đọc), liên kết mentor với từng CLB, tác vụ chạy nền xóa ảnh và mở bước, bàn giao hộ vai nhiều người cùng giữ.

