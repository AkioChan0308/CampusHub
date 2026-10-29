# Mô tả: Trang chung (bảng tin và giao lưu giữa các CLB)

*Bản 1: 22/10/2026 (Bảng tin chung). **Bản 2: 29/10/2026**, theo ý Hiệu: biến nó thành trang chung của cả hệ thống, có nhắn tin với ban điều hành CLB. Đây là bản mô tả để duyệt, **chưa có dòng code nào** cho phần mới. Theo luật của dự án, màn chưa có bản vẽ thì viết mô tả trước, Hiệu duyệt rồi mới làm. Đường dẫn đặt theo luật đặt tên (tiếng Anh).*

## 1. Vì sao có màn này

Hiện CampusHub chỉ có góc nhìn **trong một CLB** (ban điều hành quản lý, thành viên dùng việc của mình) và danh bạ **Tìm CLB** (`/explore`, chỉ để xin vào). Chưa có chỗ để các CLB **đăng tin, quảng bá và thấy tin của nhau**.

Ý của Hiệu (29/10/2026):
- Một **trang chung** mà **mọi vai đã đăng nhập** đều vào được. Bấm logo CampusHub ở góc trái trên của bất kỳ màn nào thì về đây.
- Trang chung không chỉ để xem CLB và nộp đơn. Nó là nơi các CLB **đăng sự kiện, hoạt động quảng bá, tin tức**, và là nơi **giao lưu** giữa các CLB.
- Mỗi vai có **một mục riêng trên thanh công cụ** dẫn tới trang việc của vai đó. Các trang việc đó **giữ nguyên, hoạt động như cũ**.

**Chưa có bằng chứng** là các CLB cần việc này: khảo sát CP2 nói về bàn giao, không nói về giao lưu giữa CLB. Bù lại nó khớp góp ý của cô ("kết nối ra cơ hội bên ngoài"). Nên làm bản nhỏ nhất, từng bước, và hỏi CLB trong đợt khảo sát tới.

## 2. Đã chốt (Hiệu, 29/10/2026)

1. **Chỉ người đã đăng nhập** xem được trang chung. Trang đầu `/` vẫn là trang giới thiệu cho khách.
2. **Trang đầu tiên sau đăng nhập:**
   - Ban điều hành: trang CLB của họ, như hiện nay.
   - Ban quản lý CLB của trường: `/school`, như hiện nay.
   - **Sinh viên là thành viên CLB: vào thẳng trang chung.** Muốn vào `/me` thì bấm tab trên thanh công cụ, tab này phải nổi bật, dễ thấy.
   - Link từ Zalo (điểm danh, lời mời, đóng quỹ) vẫn mở thẳng trang đích, không bị đẩy về trang chung.
3. **Sinh viên chưa vào CLB nào** vẫn đăng nhập được. Bấm `/me` thì vẫn ra thông tin nhưng **giới hạn một số tính năng và phải tham gia một CLB mới dùng được** (xem 3.6).
4. **Một sinh viên có thể ở nhiều CLB cùng lúc** (xem 3.7).
5. **Giao lưu** nghĩa là:
   - thấy sự kiện, hoạt động quảng bá, tin tức của nhiều CLB trên cùng một trang;
   - bấm vào tin để xem chi tiết;
   - bấm vào CLB để xem giới thiệu chi tiết của CLB đó;
   - **nhắn tin trực tiếp với admin của CLB đó ngay trên nền tảng**;
   - Zalo, Facebook: CLB dán link ở phần giới thiệu.
6. **Phần nặng chỉ làm khung mẫu** (Hiệu chọn 29/10/2026): tin, giới thiệu CLB, nhắn tin và đăng tin dùng dữ liệu mẫu trong web, ghi rõ "dữ liệu mẫu" và "tính năng đang phát triển" (ví dụ bấm nhắn tin thì hiện khung chat kèm dòng đang phát triển). Chưa có API, chưa có bảng dữ liệu cho các phần này. Điều hướng, trang đầu tiên sau đăng nhập và `/me` giới hạn thì làm thật.
7. **Vai trò theo từng CLB, và tài khoản duyệt tin** (Hiệu khuyên 29/10/2026):
   - Mỗi CLB có vai trò riêng của mình (chủ nhiệm, phó chủ nhiệm, thủ quỹ, trưởng ban, thành viên). **Chủ nhiệm phân quyền cho thành viên của CLB**: đã có ở màn Thành viên (nút Sửa vai và ban, quyền `assignRole`).
   - Cần một **tài khoản admin tổng để duyệt tin** của các CLB. Hướng đi: người bên trường (cán bộ trường, `person.kind = "staff"`, đã có) duyệt. **Việc duyệt để sau.** Trước mắt chỉ có vai và quyền: thêm quyền **đăng tin** (`post`: chủ nhiệm, phó chủ nhiệm, trưởng ban) vào bảng quyền (`web/src/lib/selectors.ts`). Tin đăng hiện ngay; khi làm phần duyệt thì thêm trạng thái "chờ trường duyệt" và nút duyệt cho cán bộ trường.

## 3. Các màn

### 3.1 Thanh trên chung (mọi vai, mọi màn)

- **Trái:** logo CampusHub, bấm là về trang chung (hiện nay logo dẫn về trang riêng của vai).
- **Giữa:** **Trang chung**, **Khám phá CLB** (Tìm CLB hiện có). Tin nhắn không phải tab: là **bong bóng chat** ở góc phải dưới (Hiệu yêu cầu 29/10/2026, xem 3.5).
- **Phải, theo vai (đề xuất, Hiệu sửa):**

| Vai | Mục | Dẫn tới |
|---|---|---|
| Ban điều hành | **Quản lý CLB** (chọn CLB nếu ở nhiều CLB) | `/clubs/[clubId]` |
| Thành viên | **Của tôi** | `/me` |
| Sinh viên chưa vào CLB | **Của tôi** (giới hạn), **Tạo CLB** | `/me`, `/clubs/new` |
| Ban quản lý CLB của trường | **Nhà trường** | `/school` |

- Người ở hai vai (thành viên CLB này, ban điều hành CLB kia) thấy cả hai mục.
- Các màn riêng của từng vai giữ nguyên thanh bên và thanh tab hiện có. Thanh trên chung chỉ thêm lối ra trang chung và lối sang mục khác.
- **Điện thoại:** giữ ba tab đã duyệt (Điểm danh, Quỹ, Của tôi). Logo và biểu tượng Trang chung ở thanh trên đưa về trang chung. Sinh viên là thành viên mở app vào trang chung trước, nên tab **Của tôi** phải rõ nhất ở thanh tab.

### 3.2 Trang chung: `/feed` (đã có khung rỗng)

- **Đầu màn:** tờ lịch hôm nay, tiêu đề "Trang chung".
- **Ba phần:** **Tin** (tin của mọi CLB, mới nhất trước), **CLB** (danh sách khám phá, chính là Tìm CLB hiện có, có bộ lọc lĩnh vực), **CLB của tôi** (chỉ tin và việc của các CLB mình ở).
- **Mỗi tin là một dòng trên tờ giấy:** tên CLB, nhãn loại tin, tiêu đề, vài dòng đầu, thời điểm đăng. Sự kiện có tờ lịch nhỏ (đỏ nếu diễn ra hôm nay hoặc trong 3 ngày tới, theo luật Lịch bloc). Bấm vào tin mở **chi tiết tin** (3.3); bấm tên CLB mở **giới thiệu CLB** (3.4).
- **Bộ lọc:** theo lĩnh vực, theo loại tin; ô tìm theo tên CLB hoặc chữ trong tin.
- **Trạng thái rỗng:** "Chưa có tin nào." Ban điều hành thấy thêm lối "Đăng tin đầu tiên của CLB".

### 3.3 Tin và chi tiết tin: `/feed/[postId]`

- **Ba loại tin (đề xuất, Hiệu sửa):** **Sự kiện** (có ngày giờ, nơi diễn ra; có thể gắn với buổi mở cho người ngoài CLB đã có), **Quảng bá** (tuyển thành viên, hoạt động của CLB), **Tin tức** (kết quả, lời cảm ơn, thông báo).
- **Chi tiết tin:** tiêu đề, nội dung chữ đầy đủ, thời điểm, tên CLB (bấm để xem giới thiệu), nút **Nhắn cho CLB**.
- Chỉ chữ. **Chưa có ảnh, video**: ảnh có mặt người là dữ liệu cá nhân, phải có đồng ý theo từng mục đích (Luật 91/2025); chưa làm phần đồng ý nên chưa làm ảnh.

### 3.4 Giới thiệu CLB: `/explore/[clubId]` (đã có, làm đầy)

Hiện trang này chỉ có chữ giữ chỗ ở phần giới thiệu. Thêm:
- **Giới thiệu do CLB tự viết**: CLB làm gì, ai nên tham gia, có thu quỹ không.
- **Liên hệ công khai:** link Zalo, Facebook, email do CLB tự dán.
- **Tin gần đây của CLB** (vài tin mới nhất, "Xem tất cả" ra trang chung đã lọc theo CLB).
- Nút **Nhắn cho CLB** và nút **Xin vào** (đã có).

Ban điều hành sửa phần này ở **Giới thiệu CLB**: `/clubs/[clubId]/profile`. Có dòng nhắc cố định: "Nội dung này hiện công khai cho mọi người đã đăng nhập. Không ghi thông tin cá nhân của thành viên, không ghi chuyện tiền quỹ."

### 3.4b Đăng tin của CLB: `/clubs/[clubId]/posts` (đã có khung rỗng)

- **Ai dùng:** ban điều hành. Chủ nhiệm, phó chủ nhiệm, trưởng ban đăng, sửa, ẩn; thủ quỹ chỉ xem (đề xuất, cần Hiệu chọn).
- **Nội dung:** danh sách tin của CLB (đang hiện, đã ẩn), nút "Đăng tin", form (loại, tiêu đề, nội dung; độ dài tối đa chưa chốt), có dòng nhắc như ở 3.4.
- **Nút:** Đăng, Sửa, **Ẩn tin** (có hộp hỏi lại). Không có "xóa hẳn", để còn lịch sử. Mọi đăng, sửa, ẩn lưu ai làm, lúc nào.

### 3.5 Nhắn tin với admin CLB (mới, chưa có gì)

Ý của Hiệu: bấm vào CLB thì nhắn được với admin CLB đó trực tiếp qua nền tảng. Đề xuất bản nhỏ nhất:
- **Người nhắn:** bất kỳ ai đã đăng nhập (sinh viên chưa vào CLB, thành viên CLB khác, ban điều hành CLB khác). Họ bấm **Nhắn cho CLB** ở giới thiệu CLB hoặc chi tiết tin, viết tin đầu tiên.
- **Người nhận:** **hộp thư chung của ban điều hành** CLB đó (không phải một cá nhân), ở `/clubs/[clubId]/inbox`. Chủ nhiệm, phó chủ nhiệm, trưởng ban đều thấy và trả lời. Đề xuất như vậy để tin không kẹt khi một người nghỉ hoặc hết nhiệm kỳ (khớp tinh thần bàn giao).
- **Phía người nhắn:** **bong bóng chat** ở góc phải dưới của trang chung: bấm thì khung chat mở lên, có danh sách cuộc trò chuyện, tin chưa đọc kèm số trên bong bóng. Nút "Nhắn cho CLB" mở cùng khung với CLB đó.
- **Chỉ chữ thuần.** Không ảnh, file, nhóm chat, không "đã xem". Độ dài tối đa chưa chốt.
- **Chưa có thông báo đẩy hay email:** người dùng thấy số chưa đọc khi mở app. Nói rõ trên màn: "Mở CampusHub để xem trả lời".
- **Chống làm phiền:** giới hạn số cuộc trò chuyện mới mỗi ngày của một người (con số chưa chốt, cần Hiệu chọn). Chưa có nút chặn hay báo cáo (xem câu hỏi 5).
- **Nguyên tắc cũ "CampusHub không thay Zalo" vẫn đúng:** đây chỉ là kênh **liên hệ CLB**, không phải nhóm chat; trò chuyện dài vẫn chuyển sang Zalo qua link CLB đã dán.

### 3.6 `/me` cho sinh viên chưa vào CLB

- Vẫn mở được trang. Hiện phần chung: tài khoản, đơn xin vào đã gửi, lời mời đang chờ.
- Các tính năng cần CLB (điểm danh, đóng quỹ, việc của tôi, lịch sử tham gia) **khóa**, kèm chữ thấy được: "Cần tham gia một CLB" và nút **Tìm CLB**. Khóa kèm lý do, đúng luật giao diện (nối bằng `aria-describedby`), không để nút xám trơ.

### 3.7 Một sinh viên ở nhiều CLB

- Hiện `/me` chỉ lấy CLB đầu tiên đã nhận lời mời, nên chưa dùng được khi ở nhiều CLB (đã ghi "đổi CLB khi ở nhiều CLB" ở danh sách chưa làm của `docs/ke-hoach-mvp.md`).
- Thêm **bộ chọn CLB** ở `/me` và ở mục Quản lý CLB; CLB đang chọn nhớ theo phiên. Điểm danh, đóng quỹ, việc của tôi hiện theo CLB đang chọn.

## 4. Luật nội dung, quyền và dữ liệu cá nhân

- Tin và giới thiệu CLB **công khai cho mọi người đã đăng nhập**, chưa mở cho khách chưa đăng nhập.
- Chỉ chữ do ban điều hành viết. **Không** tự đưa dữ liệu thành viên, số tiền hay sổ quỹ vào tin. Máy chủ không kiểm được nội dung viết nên có dòng nhắc cố định; trách nhiệm là của người đăng.
- Ban điều hành chỉ đăng, sửa, ẩn tin và giới thiệu **của CLB mình**; chỉ ban điều hành CLB đó đọc hộp thư của CLB đó. Kiểm ở máy chủ (`server/src/access.ts`), không tin giao diện.
- **Tin nhắn là dữ liệu cá nhân.** Cần: dòng báo trước khi gửi ("Tin này gửi tới ban điều hành CLB, kèm tên hiển thị của bạn"); người gửi tải và xóa được tin của mình theo luồng dữ liệu cá nhân (mục 9 của `docs/luong-nguoi-dung.md`); CLB chỉ thấy tên hiển thị, không thấy email.
- Người đã rời CLB hoặc xóa dữ liệu: tin do họ đăng giữ nguyên (ghi tên CLB, không ghi tên người đăng).
- **Duyệt trước, hiện sau (Hiệu chốt 29/10/2026):** tin của CLB phải được cán bộ trường duyệt thì mới hiện trên Cộng đồng cho mọi người. Tin chưa duyệt ở trạng thái **chờ duyệt**: người đăng vẫn thấy tin như đã đăng lên nhưng **mờ đi**, kèm nhãn "Chờ trường duyệt"; người khác không thấy. Đề xuất chi tiết (chờ Hiệu duyệt): ban điều hành của chính CLB đó cũng thấy tin chờ duyệt ở "Bảng tin của CLB"; cán bộ trường thấy hàng chờ ở màn Nhà trường và bấm Duyệt hoặc Từ chối (từ chối thì ghi lý do, như luật duyệt chi); người đăng thấy tin bị từ chối kèm lý do và sửa gửi lại được. Người đăng không tự duyệt tin của mình. Nút Báo cáo và chặn người dùng để sau.

## 5. Dữ liệu và API (phác, để Khoa xem sau)

- Mới: **giới thiệu CLB** (mô tả, link Zalo, Facebook, email), **tin** (mã, CLB, loại, tiêu đề, nội dung, trạng thái, ai đăng, lúc đăng, lịch sử), **cuộc trò chuyện** (người nhắn, CLB, lúc cập nhật), **tin nhắn** (cuộc trò chuyện, người gửi, nội dung, lúc gửi), **đã đọc** (theo người và cuộc trò chuyện).
- API theo thứ tự `contract.ts`, handler, `docs/api.md`, test. Migration mới đặt tên tiếng Anh (ví dụ `007_club_posts.sql`, `008_messages.sql`).
- Dữ liệu mẫu: vài tin, giới thiệu và một cuộc trò chuyện mẫu của ba CLB tự bịa, ghi rõ là dữ liệu mẫu.

## 6. Thứ tự làm (đề xuất)

Mỗi bước xong thì chạy test, bấm thử Playwright, Hiệu duyệt rồi mới sang bước sau.

1. **Điều hướng** (không cần dữ liệu mới): thanh trên chung, logo về trang chung, mục theo vai, trang đầu tiên sau đăng nhập của thành viên, `/me` giới hạn cho người chưa vào CLB, bộ chọn CLB.
2. **Tin:** bảng tin, API, trang chung có tin thật, chi tiết tin, đăng tin ở `/clubs/[clubId]/posts`.
3. **Giới thiệu CLB:** làm đầy `/explore/[clubId]`, trang sửa giới thiệu, link Zalo và Facebook.
4. **Nhắn tin:** cuộc trò chuyện, hộp thư của CLB, mục Tin nhắn.

## 7. Câu hỏi cần Hiệu quyết

1. **Sinh viên chưa vào CLB nào** đăng nhập xong vào đâu? Đề xuất: trang chung (giống thành viên), vì `/me` của họ bị giới hạn.
2. **Ba loại tin** (Sự kiện, Quảng bá, Tin tức) có đủ không?
3. **Hộp thư nhận tin nhắn:** hộp thư chung của ban điều hành (đề xuất) hay từng người? Thủ quỹ có thấy không?
4. **Người trả lời** hiện tên người hay "Ban điều hành CLB X"? Đề xuất: tên người, kèm vai.
5. **Kiểm duyệt:** ban quản lý CLB của trường có ẩn được tin và cuộc trò chuyện vi phạm, người dùng có nút "Báo cáo" không? Đề xuất: bản đầu chỉ cho trường ẩn tin; nút báo cáo và chặn để sau.
6. **Giới hạn chống làm phiền:** mỗi người tối đa bao nhiêu cuộc trò chuyện mới mỗi ngày? (chưa có số; không tự đặt.)
7. **Ai đăng tin:** chủ nhiệm, phó chủ nhiệm, trưởng ban (đề xuất), hay cả thủ quỹ?
8. **Mức ưu tiên:** làm ngay hay sau? Phần AI thật cho CP3 đang là chỗ yếu nhất, và bước 1 (điều hành) làm được ngay không cần dữ liệu mới.
9. **Bằng chứng:** hỏi 5 CLB ở đợt khảo sát tới: "Lần gần nhất bạn muốn biết CLB khác đang làm gì, hoặc muốn liên hệ CLB khác, bạn làm thế nào?". Chưa hỏi nên chưa có số liệu.

## 8. Đã làm (29/10/2026) và chưa làm

**Đã làm thật (không cần dữ liệu mới):**
- Thanh công cụ chung (`HubNav`): Trang chung, Khám phá, rồi mục theo vai là nút đặc xanh mực nổi bật; logo CampusHub dẫn về `/feed` ở mọi khung (điện thoại, ban điều hành, nhà trường). Thanh bên của ban điều hành và nhà trường có thêm Trang chung; ban điều hành có thêm mục Bảng tin của CLB.
- Trang đầu tiên sau đăng nhập theo mục 2 (có test); `/me` của người chưa ở CLB nào bị giới hạn (`MeLocked`).
- Quyền `post` trong bảng quyền (chủ nhiệm, phó chủ nhiệm, trưởng ban).

**Đã làm thật (29/10/2026, Hiệu chốt "duyệt trước, hiện sau", chọn "luồng thật nhưng gọn"):** đăng tin (chủ nhiệm, phó chủ nhiệm, trưởng ban), tin luôn chờ trường duyệt; cán bộ trường duyệt hoặc từ chối kèm lý do ở `/school/posts`; Cộng đồng chỉ hiện tin đã duyệt, người đăng thấy tin chờ hoặc bị từ chối của mình **mờ** kèm nhãn; ban điều hành CLB thấy mọi tin của CLB ở Bảng tin của CLB. API `GET /feed`, `GET /posts/:postId`, `GET` và `POST /clubs/:clubId/posts`, `GET /school/posts`, `POST /school/posts/:postId/review` (xem `docs/api.md`), bảng `posts` (migration 007). Đã làm thêm (29/10/2026): sửa tin bị từ chối rồi gửi lại (`PUT /clubs/:clubId/posts/:postId`). Chưa làm: ẩn tin đã duyệt, ảnh đính kèm, nút Báo cáo.

**Còn dạng khung mẫu** (giới thiệu CLB viết sẵn ở `web/src/lib/feed-sample.ts`, nhắn tin ghi "đang phát triển"; chưa có API, chưa có bảng dữ liệu). Phần dưới đây là danh sách cũ, nay chỉ còn giới thiệu CLB và nhắn tin là khung mẫu:
- `/feed` (lọc theo phần và loại tin), `/feed/[postId]`, giới thiệu CLB mẫu và tin gần đây ở `/explore/[clubId]`.
- Bong bóng chat (`ChatBubble`): khung chat mở lên từ góc phải dưới, ô viết và nút gửi khóa, ghi "Tính năng nhắn tin đang phát triển".
- `/clubs/[clubId]/posts`: danh sách tin mẫu, nút "Đăng tin" báo đang phát triển.

**Chưa làm:** chọn CLB khi ở nhiều CLB (mục 3.7; `/me` vẫn lấy CLB đầu tiên, thanh công cụ chỉ có một mục Quản lý CLB), trang sửa giới thiệu CLB và link Zalo, Facebook, API và dữ liệu thật, đăng và ẩn tin thật, nhắn tin thật, cán bộ trường duyệt tin, kiểm duyệt.

**Giả định đã dùng, cần Hiệu xác nhận:** sinh viên chưa ở CLB nào đăng nhập xong vào trang chung (câu hỏi 1); ba loại tin Sự kiện, Quảng bá, Tin tức (câu hỏi 2).

## 9. Không làm (cố ý)

Bình luận, thích, theo dõi CLB; nhóm chat; ảnh và video; thông báo đẩy và email; quảng cáo của nhãn hàng trong tin; đa trường (bản demo coi mọi CLB cùng một trường, tên trường để trống "[Tên trường]").
