# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Người dùng ưu tiên: ban điều hành CLB sinh viên**, gồm chủ nhiệm, phó chủ nhiệm, thủ quỹ và trưởng ban. Họ dùng laptop để quản lý thành viên, mở điểm danh, thu quỹ, đối soát sao kê, duyệt chi và bàn giao nhiệm kỳ. Khi thiết kế phải chọn một bên, ưu tiên việc của nhóm này.
- **Thành viên CLB**: dùng trình duyệt điện thoại, thường mở link từ nhóm Zalo hoặc Messenger của CLB, để điểm danh, đóng quỹ và xem dữ liệu của mình. Phía thành viên làm gọn, ít màn.
- **Sinh viên chưa vào CLB**: dùng điện thoại để tìm CLB và gửi đơn xin vào.
- **Ban quản lý CLB của trường, kiêm mentor**: dùng laptop để nắm tình hình các CLB và duyệt khoản chi lớn. Phía trường chỉ làm bản mỏng, chỉ được nhận số tổng hợp.

## Product Purpose

CampusHub giúp ban điều hành CLB sinh viên quản lý thành viên, điểm danh, sổ quỹ và bàn giao nhiệm kỳ trên một chỗ, thay cho Google Sheets, Google Form và việc dò sao kê bằng tay. Nó cũng giúp ban quản lý CLB của trường nắm tình hình các CLB.

Thành công của MVP: chạy pilot ở CLB thật và đo được theo chỉ tiêu SMART ở Checkpoint 1 (các con số chưa có trong repo).

## Positioning

- **Không giữ tiền, không thu hộ.** Nghị định 52/2024 coi thu hộ là dịch vụ trung gian thanh toán, phải có giấy phép. CampusHub chỉ ghi sổ và tạo mã VietQR; tiền đi thẳng vào tài khoản của CLB hoặc thủ quỹ.
- **Đối soát bằng file sao kê do thủ quỹ tự tải lên**, không tự đọc giao dịch ngân hàng. Giao dịch lệch (sai cú pháp, chuyển hộ, thiếu tiền) hiện ra để gán tay.
- **Bàn giao nhiệm kỳ là một luồng có thật:** chốt số dư, đổi tài khoản nhận quỹ, chuyển quyền quản trị khỏi email trường của chủ nhiệm cũ (email trường bị thu hồi khi tốt nghiệp).
- **Không thay Zalo:** chỉ gửi link vào nhóm có sẵn; link phải mở tốt trong trình duyệt nằm trong Zalo và Messenger, không cần cài app.

## Operating Context

- Pilot ở ĐH FPT TP.HCM, sau đó mở rộng sang trường khác; tên trường trên giao diện để trống ("[Tên trường]"), không khóa riêng FPT.
- Kế hoạch, thu quỹ và báo cáo tính theo học kỳ, 3 kỳ mỗi năm. Một tài khoản vào được nhiều CLB.
- Cách làm hiện tại của các CLB (khảo sát Checkpoint 2, tóm tắt ở `docs/ke-hoach-mvp.md`): dò sao kê với Google Sheets mất 1–2 tiếng; điểm danh tick tay mất 10–15 phút; sau bàn giao phải làm lại danh sách thành viên.
- Điểm danh ở buổi sinh hoạt: ban điều hành chiếu mã QR trên màn lớn, thành viên quét bằng điện thoại.
- Khoản chi trên một ngưỡng phải có mentor của trường duyệt thêm; ngưỡng đang để 2.000.000 ₫, chưa chốt.

## Capabilities and Constraints

- **Có trong MVP:** thành viên (nhập danh sách, link mời, đơn xin vào), điểm danh QR đổi mã mỗi 30–60 giây kèm điểm danh tay có ghi người điểm danh, sổ quỹ (đợt thu với VietQR, ghi tiền mặt, đề xuất và duyệt chi, đối soát sao kê), dự trù kinh phí theo kỳ, bàn giao, xuất Excel bất cứ lúc nào, bản mỏng cho nhà trường, màn đồng ý dữ liệu cá nhân.
- **Không làm trong MVP:** tính năng cho nhãn hàng, nhà tài trợ; điểm danh sự kiện cấp trường; app cài đặt; ví điện tử, giữ tiền, cổng thanh toán.
- **Luật nghiệp vụ đã chốt:** sổ quỹ chỉ thêm bút toán, không sửa, không xóa; không ai tự duyệt khoản mình đề xuất; từ chối phải ghi lý do; mỗi thiết bị chỉ điểm danh cho một người trong một buổi; không thu thập vị trí GPS; màn đóng quỹ ghi rõ người nhận là ai, thủ quỹ CLB nào, nhiệm kỳ nào.
- **Dữ liệu cá nhân (Luật 91/2025, Nghị định 356/2025):** ô đồng ý không đánh dấu sẵn, tách theo mục đích, có xác nhận đủ 16 tuổi, lưu nhật ký đồng ý; thành viên tự xem, sửa, tải, rút đồng ý, xóa dữ liệu; ảnh chứng từ chỉ thủ quỹ và chủ nhiệm xem.
- **Kỹ thuật hiện tại:** web Next.js trong `web/`, server Express trong `server/`, luật nghiệp vụ dùng chung ở `web/src/lib`. Chưa có cơ sở dữ liệu (dự định PostgreSQL); đăng nhập Google đang được làm; web chưa gọi API. Mã VietQR của bản demo cố ý là mã giả.
- **Chưa chốt:** ngưỡng khoản chi cần mentor duyệt; mẫu dự trù của trường; ngân hàng của CLB pilot (quyết định cách đọc file sao kê).

## Brand Commitments

- Tên sản phẩm: CampusHub. Dự án của nhóm NeedSleep, môn EXE101, ĐH FPT TP.HCM.
- Giao diện viết tiếng Việt. Giọng văn thân thiện, rõ ràng: xưng "bạn", câu ngắn, nói thẳng việc cần làm; nút của thành viên có thể xưng "mình" (ví dụ "Mình đã chuyển khoản"). Không dùng emoji.
- Hệ thống giao diện: "Lịch bloc" (`DESIGN.md`, `web/src/app/lich.css`), Hiệu duyệt ngày 03/10/2026. Hệ tím cũ `design/ui.css` bỏ ngày 05/10/2026. 16 màn wireframe trong `design/screens/` (Hiệu duyệt tạm ngày 02/10/2026) vẫn là nguồn cho nội dung, chữ và luật của từng màn. Mỗi thay đổi về phong cách phải ghi lại để Hiệu (design lead) duyệt.

## Evidence on Hand

- 16 màn wireframe: `design/screens/`, mô tả từng màn và luật hiện trên màn ở `design/README.md`.
- Kết quả khảo sát Checkpoint 2: nằm ngoài repo (`../CP2/`), là dữ liệu thật nên không được đưa vào repo; phần tóm tắt dùng được ở `docs/ke-hoach-mvp.md`.
- Dữ liệu trên giao diện là dữ liệu mẫu tự đặt (`web/src/lib/seed.ts`); tên người và số tiền trong bản vẽ cũng là dữ liệu mẫu.
- Chưa có: khách hàng, CLB đang dùng, lời nhận xét, số liệu chỉ tiêu, giá. Không được bịa những thứ này.

## Product Principles

1. **Ban điều hành trước.** Việc lặp lại hằng tuần của chủ nhiệm và thủ quỹ (điểm danh, thu quỹ, đối soát, duyệt chi) phải nhanh hơn cách làm bằng Sheets hiện tại; phía thành viên chỉ giữ những gì cần.
2. **Ghi sổ, không giữ tiền.** Mọi thứ liên quan tới tiền phải minh bạch, có lịch sử, không sửa lùi; người dùng luôn biết tiền đi vào tài khoản của ai.
3. **Sống trong Zalo.** Thành viên đến từ một link trong nhóm chat, trên điện thoại, không cài app; mỗi màn của thành viên phải dùng được ngay trong trình duyệt nằm trong Zalo và Messenger.
4. **Dữ liệu của thành viên thuộc về thành viên.** Đồng ý rõ ràng, tách mục đích, rút được, xóa được; phía trường chỉ thấy số tổng hợp.
5. **Nhiệm kỳ đổi, dữ liệu còn.** Bàn giao giữ nguyên sổ quỹ, thành viên và quyền quản trị khi ban điều hành thay người.

## Accessibility & Inclusion

- Màn của thành viên chạy trên điện thoại khổ khoảng 390px, trong trình duyệt nằm trong Zalo và Messenger: vùng bấm tối thiểu 44px, không phụ thuộc rê chuột.
- Chữ tiếng Việt có dấu phải hiển thị đúng ở mọi font và cỡ chữ.
- Tôn trọng cài đặt giảm chuyển động của máy. Chưa chốt chuẩn WCAG cụ thể.
