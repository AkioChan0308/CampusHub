---
name: CampusHub
description: Quản lý CLB sinh viên theo lịch. Hệ thiết kế "Lịch bloc", đã chốt, mọi màn đã chuyển (04/10/2026).
colors:
  ground: "#ECEEF2"
  paper: "#FFFFFF"
  ink: "#16171C"
  ink-2: "#3B3F49"
  ink-3: "#5B606C"
  rule: "#D5D9E0"
  rule-soft: "#E6E9EE"
  red: "#D0261C"
  red-ink: "#A51D15"
  red-tint: "#FCE8E6"
  blue: "#1D47A3"
  blue-hover: "#163985"
  blue-tint: "#E7EDFA"
  ok: "#17703F"
  ok-tint: "#E2F2E8"
  warn: "#8F5200"
  warn-tint: "#FFF0D4"
typography:
  display:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(40px, 5.2vw, 76px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  leaf-numeral:
    fontFamily: "Barlow Condensed, Segoe UI, sans-serif"
    fontSize: "76px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Barlow Condensed, Segoe UI, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  cell-figure:
    fontFamily: "Barlow Condensed, Segoe UI, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.3
  leaf-band:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.02em"
  code:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sheet: "4px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  panel-x: "20px"
  board-gutter: "40px"
  board-stack: "22px"
  phone-gutter: "16px"
  phone-stack: "12px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-primary-busy:
    backgroundColor: "{colors.blue-hover}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-disabled:
    backgroundColor: "{colors.rule-soft}"
    textColor: "{colors.ink-3}"
  button-small:
    padding: "0 12px"
    height: "34px"
  button-large:
    height: "48px"
    width: "100%"
  leaf:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "64px"
  leaf-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.leaf-band}"
  leaf-band-red:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
  leaf-day-red:
    textColor: "{colors.red-ink}"
  leaf-md:
    rounded: "{rounded.md}"
    width: "80px"
  leaf-xl:
    rounded: "{rounded.lg}"
    width: "112px"
    typography: "{typography.leaf-numeral}"
  sheet:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.sheet}"
  strip-cell:
    padding: "16px 20px"
    typography: "{typography.cell-figure}"
  nav-item:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.blue}"
  chip-filter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 13px"
    height: "34px"
  chip-filter-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tag-ok:
    backgroundColor: "{colors.ok-tint}"
    textColor: "{colors.ok}"
    rounded: "{rounded.pill}"
    height: "26px"
    padding: "0 10px"
  tag-wait:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.blue}"
    rounded: "{rounded.pill}"
    height: "26px"
    padding: "0 10px"
  tag-warn:
    backgroundColor: "{colors.warn-tint}"
    textColor: "{colors.warn}"
    rounded: "{rounded.pill}"
    height: "26px"
    padding: "0 10px"
  tag-off:
    backgroundColor: "{colors.rule-soft}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    height: "26px"
    padding: "0 10px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  input-disabled:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-3}"
  pick-item-selected:
    backgroundColor: "{colors.blue-tint}"
    padding: "12px 16px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px"
    width: "440px"
  alert:
    backgroundColor: "{colors.red-tint}"
    textColor: "{colors.red-ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  pay-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "16px"
  button-projector:
    padding: "0 28px"
    height: "52px"
  step-todo:
    textColor: "{colors.ink-3}"
    padding: "14px 16px"
  step-done:
    backgroundColor: "{colors.ok-tint}"
    textColor: "{colors.ok}"
  step-now:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
  step-now-cell:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.ink}"
  check-stamp:
    backgroundColor: "{colors.ok-tint}"
    textColor: "{colors.ok}"
    rounded: "{rounded.pill}"
    size: "44px"
  video-block:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "40px"
  video-step:
    textColor: "{colors.ink-3}"
    padding: "14px 4px"
  video-step-current:
    textColor: "{colors.ink}"
  device-phone:
    backgroundColor: "{colors.ink}"
    padding: "9px"
    width: "300px"
  auth-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "24px 24px 28px"
    width: "440px"
  tab-role:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    rounded: "12px"
    padding: "0 8px"
    height: "44px"
  tab-role-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue}"
  tab-role-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  chat-fab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue}"
    rounded: "{rounded.pill}"
    size: "56px"
  chat-fab-hover:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
  chat-window:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    width: "360px"
  chat-window-head:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "8px 6px 8px 16px"
  post-row:
    textColor: "{colors.ink}"
    padding: "14px 0"
---

# Design System: CampusHub

## Overview

**Creative North Star: "Lịch bloc"**

CLB sinh viên sống theo lịch. Vì vậy mỗi màn mở bằng tờ lịch hôm nay, và mỗi hạn chót là một tờ lịch nhỏ đếm ngày. Hình mẫu là cuốn lịch bloc xé từng tờ treo tường của Việt Nam: giấy trắng, dải tháng ở đầu tờ, số ngày to và đậm, dòng thứ ở dưới.

Giấy trắng nằm trên nền xám lạnh. Chữ là mực gần đen. Đỏ lịch hiếm, chỉ dành cho hôm nay và việc gấp. Xanh mực là màu của thao tác. Các khối chia nhau bằng nét kẻ mảnh 1px, không dùng bóng đổ. Thế giới này bỏ kiểu dashboard thẻ trắng có ô số liệu ở góc.

**Phạm vi hiện tại.** Hiệu duyệt Lịch bloc ngày 03/10/2026, nên đây là hệ thiết kế của dự án. Ngày 04/10/2026 mọi màn đã chuyển: đủ 16 màn của bản vẽ, trang `/login` và các trang chặn, lỗi, đang tải. Nhóm 3 là các màn thành viên và sinh viên trên điện thoại: TV-CuaToi (`/me`, cả tab Quỹ `/me/pay`), TV-LoiMoi, SV-DanhSach, SV-DonXinVao. Nhóm 4 là hai màn nhà trường trên laptop: NT-TongQuan, NT-ChiTietCLB. Hiệu duyệt hai nhóm này ngày 04/10/2026. Năm màn tạo dữ liệu từ đầu không có bản vẽ; Hiệu duyệt mô tả bằng chữ ngày 04/10/2026, và cả năm qua lượt duyệt hoàn thiện ngày 05/10/2026: Tạo CLB (`/clubs/new`), Thêm thành viên (`/clubs/[clubId]/members/add`), cột Thao tác của màn Thành viên, Các buổi (`/clubs/[clubId]/events`) và Tạo đợt thu (`/clubs/[clubId]/collections/new`). Ngày 05/10/2026 trang chọn vai (chỉ có ở bản demo; sau đó bỏ hẳn, thay bằng bảng tài khoản mẫu ở `/login`), trang lỗi và trang không tìm thấy cũng chuyển, và hệ tím cũ (`design/ui.css`) bị bỏ khỏi code: Lịch bloc là hệ duy nhất. Cũng ngày 05/10/2026, Hiệu duyệt các trang không có bản vẽ: trang đầu `/` (giới thiệu cho người chưa đăng nhập, hai video quay từ bản demo), đăng ký (`/register`), đặt tên tài khoản và mật khẩu (`/account`), form mật khẩu của `/login`, và mục "Đăng nhập" ở Của tôi. Biến màu khai báo ở `:root` trong `web/src/app/lich.css`; kiểu của màn nằm dưới lớp `.lich`. `web/src/app/globals.css` chỉ còn quy tắc nền cho thẻ HTML và biến theme của shadcn/ui, nối vào biến của Lịch bloc.

**Trang chung (29/10/2026).** Mọi vai đã đăng nhập có một trang chung (`/feed`) và một thanh tab chung (`HubNav`). Logo CampusHub ở góc trái trên của mọi khung (điện thoại, ban điều hành, nhà trường) là link về đó. Trang chung và bong bóng chat là khung mẫu: tin lấy từ `web/src/lib/feed-sample.ts`, chat chưa gửi được, và màn ghi rõ như vậy.

**Key Characteristics:**
- Tờ lịch là dấu hiệu nhận ra sản phẩm: dải tháng, số ngày Barlow Condensed cỡ lớn, dòng thứ hoặc "còn N ngày".
- Một mặt giấy, chia bằng nét kẻ 1px; không bóng đổ, không gradient.
- Đỏ chỉ cho hôm nay và hạn gấp, cùng chữ và viền báo lỗi; xanh mực cho thao tác.
- Số liệu (ngày, số việc, số tiền) dùng chữ hẹp đậm cỡ lớn, như số trên tờ lịch.
- Chữ giao diện tiếng Việt.

## Colors

Bảng màu gần như đơn sắc: giấy, mực, nét kẻ. Hai màu nhấn có vai trò rõ, không lẫn nhau.

### Primary
- **Xanh mực** (blue): nút chính, liên kết, mục điều hướng đang chọn, viền focus, viền ô nhập đang focus, ô đánh dấu. Link thao tác trong hàng tab: "Tạo đợt thu" ở cuối dải đợt thu. Thanh tiến độ: thanh đợt thu, thanh đếm giờ của mã QR, cột các tuần đã có mặt trên điện thoại, thanh dưới bước đang chạy của video ở trang đầu. Ô số của bước đang làm khi bàn giao. Khi rê chuột thì đậm hơn (blue-hover). Nền nhạt (blue-tint) cho mục đang chọn (thanh bên, danh sách chọn bên trái), bước đang làm khi bàn giao, ảnh đại diện chữ tắt và nhãn "chờ" ("Chờ thủ quỹ xác nhận", "Đã gửi đơn", đề nghị hỗ trợ "Chờ duyệt", buổi "Đang mở điểm danh").

### Secondary
- **Đỏ lịch** (red): dải tháng của tờ lịch hôm nay và tờ lịch hạn gấp; viền ô nhập bị lỗi.
- **Mực đỏ** (red-ink): số ngày trên tờ lịch đỏ, dòng báo lỗi dưới ô nhập, chữ của hộp báo lỗi. Nền hộp báo lỗi là red-tint.

### Tertiary
- **Xanh lá sổ quỹ** (ok): khoản thu trong sổ quỹ, nhãn "Đã đóng" (và "Đã đóng · tiền mặt"), "Đã chi", "Đã ghi nhận", "Đang nhận đơn", "Bạn đang ở CLB này", dự trù "Đã nộp", đề nghị hỗ trợ "Đã duyệt"; ô số của bước bàn giao đã xong; dấu đã điểm danh. Nền nhạt là ok-tint.
- **Nâu hổ phách** (warn): nhãn "Chưa đóng", "Đóng thiếu", "Chưa có chứng từ", "Đang xử lý yêu cầu xóa", dự trù "Chưa nộp"; dòng báo số dư lệch khi bàn giao; số ở ô cần chú ý của dải số (còn chưa đóng, còn chưa gán); số dư cuối kỳ khi quỹ thiếu. Nền nhạt là warn-tint.

### Neutral
- **Nền xám lạnh** (ground): nền trang, ô tên CLB ở thanh bên, nền khi rê chuột lên mục điều hướng, nền ô nhập bị khóa và ô chỉ đọc, ô biểu tượng file sao kê.
- **Giấy** (paper): mặt giấy của bảng làm việc, tờ lịch, thanh bên, thẻ đóng quỹ, hộp hỏi lại, thông báo ngắn, đầu và chân khung điện thoại.
- **Mực** (ink): chữ chính, dải tháng của tờ lịch thường, logo, nền của bộ lọc đang chọn, gạch dưới của tab đang chọn. Khoản chi trong sổ quỹ cũng dùng mực, không dùng đỏ.
- **Mực 2** (ink-2): chữ phụ có nội dung (dòng dưới tiêu đề, thông tin đợt thu), nhãn ô số và nhãn ô nhập, đơn vị cạnh số, chữ nhãn "off".
- **Mực 3** (ink-3): chú thích, nhãn ô, tiêu đề cột bảng, ngày trong sổ quỹ và lịch sử, giờ trong danh sách điểm danh, dấu + − = của phép tính, mũi tên, chữ của nút bị khóa, chữ "Vắng", bước bàn giao chưa làm, phần "/ tổng" của số điểm danh.
- **Nét kẻ** (rule): viền ngoài của tờ giấy, viền nút phụ, viền ô nhập và bộ lọc, đường chia phần, chia cột và chia ô.
- **Nét kẻ mờ** (rule-soft): đường chia giữa các dòng trong một khối và trong bảng, nền nút bị khóa, nền nhãn "off", nền thanh tiến độ, thanh giữ chỗ của khung xương.

### Named Rules
**The One Solid Blue Rule.** Mỗi vùng có đúng một thứ đặc xanh mực. Ở thanh tab của trang chung đó là nút theo vai đầu tiên. Bong bóng chat nằm cùng màn nên chỉ viền xanh nền giấy, nhẹ hơn một bậc; mục theo vai thứ hai trở đi cũng chỉ viền xanh. Mục theo vai của trang đang mở đổi sang mực, cùng nghĩa với bộ lọc đang chọn.

**The Red Day Rule.** Đỏ chỉ xuất hiện ở ba chỗ: tờ lịch hôm nay; hạn chót còn 3 ngày trở xuống hoặc đã quá hạn; chữ và viền báo lỗi khi nhập. Không dùng đỏ để trang trí, để nhấn tiêu đề, cho khoản chi, khoản bị từ chối, quỹ thiếu, người chưa đóng hay yêu cầu xóa dữ liệu.

**The Neutral Refusal Rule.** Trạng thái bị từ chối, đã đóng lại hay phải chờ người khác dùng nhãn trung tính "off": nền rule-soft, chữ mực 2. Gồm khoản chi bị từ chối, khoản do chính mình đề xuất (phải chờ người khác duyệt), "Đơn bị từ chối", "Tạm ngưng nhận đơn", "Chưa nhận lời mời", "Quá 30 ngày" (lâu không hoạt động), đề nghị hỗ trợ "Từ chối", và nhãn của buổi: "Sắp tới", "Đã đóng", "Chưa mở điểm danh" (buổi đã qua mà chưa từng mở điểm danh). Thiếu tiền, chưa đóng và dự trù "Chưa nộp" dùng hổ phách. Việc đang chờ duyệt ("Chờ duyệt", "Đã gửi đơn") và buổi đang mở điểm danh dùng nhãn "chờ".

**The Ink Blue Rule.** Mọi thao tác bấm được dùng xanh mực. Xanh mực không dùng cho thứ không bấm được, trừ thanh tiến độ (cả thanh đếm giờ của mã QR và cột tuần đã có mặt), nhãn "chờ" và bước đang làm khi bàn giao. Bộ lọc đang chọn tô mực, không tô xanh, vì nó là trạng thái chứ không phải thao tác chính.

## Typography

**Display Font:** Barlow Condensed (dự phòng Segoe UI)
**Body Font:** Barlow (dự phòng Segoe UI, system-ui)
**Label/Mono Font:** JetBrains Mono (dự phòng Consolas), chỉ cho mã nội dung chuyển khoản và chuỗi người dùng phải đối chiếu đúng từng ký tự

**Character:** Barlow Condensed đậm cho mọi con số đáng nhìn, giống số in trên tờ lịch. Barlow thường cho chữ, gọn và dễ đọc tiếng Việt. Cả ba font nạp bằng `next/font` trong `web/src/app/layout.tsx`, có bộ chữ tiếng Việt. Số trong trang dùng chữ số đều cột (tabular-nums).

### Hierarchy
- **Display**: chỉ tiêu đề trang đầu. Barlow 700 (là chữ, không phải số), co giãn theo bề rộng màn; dưới 640px là 34px, giãn -0.02em.
- **Leaf numeral**: số ngày trên tờ lịch cỡ xl. Tờ lịch cỡ vừa dùng cùng font, 44px; tờ lịch thường 30px.
- **Figure**: số lớn của màn: quỹ hiện có (44px), số người đã đóng (46px), số tiền phải đóng trên điện thoại (36px), số việc ở mỗi dòng "Cần bạn xử lý" (34px), số tiền của khoản chi đang mở (34px), số trong dòng của màn Của tôi (22px, đơn vị 15px), số người đã điểm danh ở dòng buổi (22px; phần "/tổng" là Barlow 600 16px mực 3), số người đã điểm danh trên màn chiếu (76px, phần "/ tổng" Barlow Condensed 600 32px mực 3).
- **Cell figure**: số trong dải số của màn trong (32px). Dấu + − = của phép tính 26px mực 3. Số tiền trong danh sách chọn 17px. Số thứ tự bước bàn giao 17px.
- **Headline**: tiêu đề trang. Trang chủ ban điều hành 34px, màn trong 28px, trang đăng nhập 32px, trang chặn 26px, tiêu đề đợt thu và tiêu đề màn trên điện thoại 24px, màn chiếu 30px. Tiêu đề khoản chi đang mở 22px. Kết quả điểm danh trên điện thoại 26px; "Đã điểm danh" 32px. Câu chính của khung mã QR trên màn chiếu 28px. Tiêu đề khối video ở trang đầu co giãn 28–44px (3.2vw), cao dòng 1.08, giãn -0.02em; dưới 640px 28px.
- **Title**: tiêu đề từng phần trên tờ giấy (19px). Tiêu đề hộp hỏi lại 19px. Tiêu đề đợt thu 21px. Tiêu đề nhỏ trong chi tiết 15px đậm. Tên CLB trong danh sách CLB 17px. Đầu danh sách và ô đồng ý trên điện thoại 15px đậm 700. Phần xem trước của Tạo đợt thu: tiêu đề "Xem trước" 17px, tên đợt thu 18px đậm 700.
- **Body**: chữ thường, 15px. Bảng, danh sách định nghĩa và hộp hỏi lại 14.5px. Dòng trong danh sách 16px đậm vừa (600) cho tiêu đề dòng, 14px mực 3 cho dòng phụ. Câu giới thiệu ở trang đầu 18px, cao dòng 1.5, mực 2 (dưới 640px 16.5px); câu dưới tiêu đề khối video 17px mực 2.
- **Label**: nhãn ô ("Người nhận", "Nội dung chuyển khoản"), chú thích, gợi ý, dòng lỗi (13.5px; trong ô của bảng nhập là 12.5px), tiêu đề cột bảng (13px, 600, mực 3), nhãn ô số và nhãn ô nhập (14px, 600, mực 2), nhãn nhóm ở thanh bên.
- **Leaf band**: chữ trên dải tháng ("Tháng 10"; cỡ vừa 12px; "Tháng 10, 2026" ở cỡ xl là 13px).
- **Code**: mã nội dung chuyển khoản, để đọc và chép đúng từng ký tự. Trong bảng, mã dùng mono 14px.

### Named Rules
**The Calendar Numeral Rule.** Số ngày, số đếm và số tiền lớn dùng Barlow Condensed 700. Chữ thường không dùng Barlow Condensed, trừ tên thương hiệu cạnh logo.

**The Unit Word Rule.** Chữ đơn vị đứng cạnh số ("người") là chữ thường: Barlow 500 17px, mực 2. Chỉ con số mới dùng Barlow Condensed.

**The Mono Only For Codes Rule.** JetBrains Mono chỉ dùng cho mã người dùng phải chép hoặc đối chiếu đúng. Không dùng mono để trang trí.

**The Fixed Work Type Rule.** Cỡ chữ co giãn theo bề rộng (`clamp`) chỉ có ở trang đầu (Display và tiêu đề khối video). Màn làm việc, đăng nhập và điện thoại giữ cỡ cố định.

## Layout

**Laptop (ban điều hành).** Lưới hai cột: thanh bên rộng 248px, dính trên màn hình, và vùng nội dung tối đa 1280px. Khung rộng tối thiểu 1100px, vì ban điều hành dùng laptop. Vùng nội dung lề 28px trên, 40px hai bên, các khối cách nhau 22px.

**Trang chủ.** Đầu trang là một hàng: bên trái tờ lịch hôm nay cỡ xl, giữa là tiêu đề và dòng phụ, bên phải là hai nút chính. Các phần căn theo đáy. Dưới đầu trang là một tờ giấy duy nhất, chia hai cột theo tỉ lệ 1.35 : 1. Mỗi cột là một chồng khối. Cột cách cột và khối cách khối bằng nét kẻ 1px, không có khe hở. Trong khối, lề ngang 20px; các dòng cách nhau bằng nét kẻ mờ.

Dòng việc cần làm là lưới ba ô: ô số 56px, chữ ở giữa, mũi tên 20px. Dòng sổ quỹ là lưới: ngày 52px, nội dung, số tiền canh phải.

**Màn trong (Đợt thu, Đối soát, Duyệt chi, Dự trù).** Đầu trang cùng kiểu hàng, nhưng mở bằng tờ lịch hôm nay cỡ vừa, cách 18px, tiêu đề 28px. Dòng phụ rộng tối đa 80ch.

Dưới đầu trang là một tờ giấy làm việc, chia thành các phần xếp chồng. Phần cách phần bằng nét kẻ 1px (rule), không có khe và không tách thành thẻ. Đầu phần lề 16px trên, 20px hai bên, 12px dưới; tiêu đề phần bên trái, bộ lọc hoặc nút bên phải.

Phần đầu tiên thường là **dải số**: các ô số đứng cạnh nhau, chia đều bề rộng, ngăn bằng nét dọc 1px. Ô lề 16px trên dưới, 20px hai bên: nhãn ở trên, số ở giữa, chú thích ở dưới. Khi có hạn chót, ô đầu dải là tờ lịch hạn đóng; ô này chỉ rộng vừa tờ lịch, các ô sau chia phần còn lại.

Màn có danh sách và chi tiết (Duyệt chi) chia tờ giấy thành hai cột: danh sách bên trái (tối thiểu 300px, tỉ lệ 0.9), chi tiết bên phải (tỉ lệ 1.4), ngăn bằng nét dọc.

**Bàn giao.** Dưới đầu trang là một tờ giấy: phần đầu là dải sáu bước, dưới là hai cột chia nét dọc (tỉ lệ 1.55 : 0.75, cột phải tối thiểu 280px). Cột trái là bước đang làm, cột phải là các ghi chú cố định của bàn giao.

**Màn chiếu (BDH-QR).** Vừa đúng một màn hình (100dvh), không có thanh bên, lề 24px 32px 28px. Đầu màn mở bằng tờ lịch hôm nay cỡ vừa, tiêu đề 30px, bên phải là giờ đóng điểm danh và nút. Dưới là một tờ giấy chia hai cột bằng nét dọc (tỉ lệ 1.3 : 0.7, cột phải tối thiểu 360px). Cột trái: mã QR lớn (rộng clamp 260–440px, theo 44vh), thanh đếm giờ cùng bề rộng và câu hướng dẫn. Cột phải: số "N / tổng", danh sách người vừa điểm danh (máy chiếu hỏi lại máy chủ mỗi 3 giây), và điểm danh tay. Danh sách điểm danh tay cuộn bên trong cột, nên nút "Đóng điểm danh" luôn thấy.

Bảng có độ rộng cột cố định (xem Components). Bảng rộng tối thiểu 960px; màn hẹp hơn thì bảng cuộn ngang, không đè chữ.

**Điện thoại (thành viên).** Khung rộng tối đa 430px, căn giữa. Đầu khung cao 56px và thanh tab dưới cao 58px, cả hai dính và có nét kẻ 1px. Thanh tab có ba mục và chừa vùng an toàn của máy. Thanh tab không bắt buộc: màn quét mã (`/checkin`) dùng đầu khung chỉ có logo và chữ CampusHub, không có thanh tab, vì lúc đó chưa biết CLB nào (`PhoneFrame brand`). Nội dung lề 16px, các khối cách nhau 12px. Nút thao tác đẩy xuống cuối vùng nội dung.

**Trang chung (điện thoại và laptop).** Màn của trang chung (`/feed`, `/explore`, và `/me` của người chưa ở CLB nào) dùng thanh tab của trang chung thay cho ba tab thành viên, và vùng nội dung có thêm lớp `hub` (`.l-pmain.hub`). Dưới 1024px thanh tab nằm đáy khung, cao 58px (`--l-tabbar-h`), nội dung chừa thêm chỗ phía dưới bằng 16px cộng bong bóng chat (56px) và khe 14px, để bong bóng không che dòng cuối. Từ 1024px thanh tab là thanh ngang ở đầu, mục theo vai dồn sang phải, và bong bóng cách mép phải và mép dưới 24px. Đầu khung điện thoại có tên CLB thì logo "C" bên trái là link về `/feed`, vùng bấm rộng ra 44px mà không đổi bố cục.

**Điện thoại, màn không có thanh tab** (danh sách CLB, trang một CLB và đơn xin vào, lời mời). Đầu khung là logo và chữ CampusHub (`PhoneFrame brand`) hoặc link quay lại (`PhoneFrame back`; trang một CLB: "Danh sách CLB"). Ảnh đại diện đứng ở mép phải khi biết người đang xem. Màn mở bằng tờ lịch hôm nay cỡ vừa cạnh tiêu đề, căn theo đáy, cách 14px; dưới tiêu đề là dòng phụ 14px mực 2. Ba màn có thanh tab (Điểm danh, Quỹ, Của tôi) không có tờ lịch hôm nay ở đầu. Danh sách CLB là một tờ giấy, mỗi CLB một dòng, không tách thẻ.

**Laptop nhà trường (NT-TongQuan, NT-ChiTietCLB).** Cùng lưới hai cột của ban điều hành (`SchoolFrame`): thanh bên 248px, vùng nội dung lề như màn trong. Đầu trang là `PageTop` với tờ lịch hôm nay cỡ vừa. Trang chi tiết một CLB đặt link quay lại "Các CLB" ngay trên đầu trang, cách 10px. Tổng quan là một tờ giấy: hàng bộ lọc ở đầu, dưới là bảng các CLB. Chi tiết là một tờ giấy chia hai cột bằng nét dọc (tỉ lệ 1.4 : 1, cột phải tối thiểu 340px). Cột trái là dự trù và thực chi, rồi dải số sinh hoạt. Cột phải là phần chờ duyệt, đề nghị hỗ trợ và nhiệm kỳ. Dải số nằm giữa cột thì có nét kẻ mờ phía trên.

**Tạo CLB (`/clubs/new`).** Không có thanh bên, vì người tạo chưa có CLB nào. Một cột giữa màn, rộng tối đa 760px (hẹp hơn thì chừa 16px mỗi bên), lề 20px trên, 48px dưới, các khối cách 18px. Thứ tự: link quay lại "Danh sách CLB", đầu màn như điện thoại (tờ lịch hôm nay cỡ vừa cạnh tiêu đề và dòng phụ, `.l-ptop`), rồi form trên một tờ giấy. Cùng một bố cục cho điện thoại và laptop.

**Form trên tờ giấy.** Form nhiều ô là lưới hai cột, cách 14px dọc và 16px ngang; ô dài (tên buổi, nơi diễn ra) chiếm cả hàng. Dưới 640px còn một cột. Hàng nút cuối form canh phải, cách 10px. Dưới 640px các nút xếp dọc, nút chính ở trên, cao 48px, rộng hết hàng, chữ 16px.

**Thêm thành viên.** Một tờ giấy: hàng chọn file (nút chọn file và câu nói các cột, lề 16px 20px), phần bảng nhập sửa được, chân phần có "Thêm dòng", câu trạng thái và nút chính. Thêm xong thì tờ giấy kết quả thay vào: bảng link mời từng người, nút chính "Sao chép tất cả link mời" ở đầu phần.

**Các buổi.** Một tờ giấy, hai phần "Sắp tới" và "Đã qua". Form tạo hoặc sửa buổi mở ngay trong tờ giấy, là phần đầu tiên, phía trên "Sắp tới".

**Tạo đợt thu.** Một tờ giấy chia hai cột bằng nét dọc rule (tỉ lệ 1.35 : 0.85, cột phải tối thiểu 300px). Cột trái là form, cột phải là phần xem trước màn đóng quỹ.

**Trang đầu (`/`).** Cho người chưa đăng nhập; đã đăng nhập thì về thẳng trang của mình. Thanh trên nền giấy, nét kẻ rule bên dưới, dính ở đầu màn khi cuộn: logo bên trái; link "Tìm CLB", "Đăng nhập" và nút chính "Đăng ký" bên phải (dưới 640px nút ẩn vì phần đầu đã có). Nội dung một cột tối đa 1280px, lề 64px 40px 72px, các khối cách 48px; dưới 1024px cách 40px, lề 24px; dưới 640px cách 32px, lề 16px. Từ trên xuống:
- **Phần đầu:** tờ lịch hôm nay cỡ xl cạnh tiêu đề hai dòng, căn theo đáy, cách 28px. Dưới là câu giới thiệu (tối đa 640px) và hàng hai nút (nút chính, nút phụ); link phụ canh phải ở đáy hàng. Dưới 1024px link phụ xuống dưới; dưới 640px hai nút rộng hết hàng, cao 48px.
- **Khối video thành viên:** tiêu đề, danh sách bước và chú thích bên trái; điện thoại bên phải, cách 72px. Dưới 1024px còn một cột: tiêu đề, điện thoại ở giữa, danh sách bước, chú thích.
- **Khối video ban điều hành:** video laptop rộng hết khối, năm bước thành một hàng ngay dưới, cách 20px. Dưới 1024px các bước thành danh sách dọc.
- **Cuối trang:** dòng "CampusHub không giữ tiền…" 15px mực 2, rồi chân trang nền giấy, nét kẻ trên, 14px mực 3. Dòng "Bản demo dùng dữ liệu mẫu." chỉ có ở chế độ demo.

Mỗi khối của trang đầu là một tờ giấy riêng trên nền xám, đọc lần lượt khi cuộn. Đây không phải bảng làm việc, nên không áp cách chia nét của tờ giấy làm việc.

**Đăng nhập, đăng ký, tài khoản.** Một thẻ giấy trên nền xám, giữa theo chiều ngang, rộng tối đa 440px, neo phía trên (cách đỉnh `clamp(24px, 10vh, 96px)`) chứ không canh giữa theo chiều dọc: nút Google, câu lỗi hiện thêm thì nằm dưới, không đẩy thẻ (Zero Shift). Các phần cách 18px: logo, đầu thẻ (tờ lịch hôm nay cỡ xl cạnh tiêu đề 32px, căn theo đáy), hộp báo lỗi nếu có, form hoặc nút, chân thẻ. `/login`, `/register` (`(auth)/login/auth-screen.tsx`) và `/account` dùng chung thẻ này. Nút trong thẻ là nút lớn rộng hết hàng, xếp dọc cách 10px, nút chính ở trên.

**The Fold Rule.** Ở khung 390x844, nút chính của màn đóng quỹ ("Mình đã chuyển khoản") phải nằm trọn phía trên thanh tab, không phải cuộn mới thấy.

## Elevation & Depth

Không có bóng đổ. Độ sâu chỉ có hai lớp: nền xám lạnh và giấy trắng. Giấy tách khỏi nền bằng màu và viền 1px (rule). Trong giấy, các khối tách nhau bằng nét kẻ. Thanh dính ở điện thoại cũng chỉ có nét kẻ, không có bóng. Hộp hỏi lại nổi lên bằng lớp phủ mực trong suốt (mực 42%) phía sau, không bằng bóng đổ.

### Named Rules
**The Ruled Sheet Rule.** Không bóng đổ, ở bất kỳ trạng thái nào. Muốn tách hai khối thì kẻ một nét 1px.

## Shapes

Góc bo vừa phải, giống góc tờ giấy đã cắt. Nút, ô nhập, tờ lịch thường và cỡ vừa, mục điều hướng, hộp báo lỗi, thông báo ngắn và ô mã QR bo 10px (md). Tờ lịch xl, thẻ đóng quỹ, thẻ đăng nhập, trang chặn và hộp hỏi lại bo 14px (lg). Tờ giấy lớn của bảng làm việc bo ít hơn, 4px (sheet), để trông như một mặt phẳng chứ không như một thẻ. Nhãn trạng thái, bộ lọc và thanh tiến độ bo tròn hẳn (pill). Ảnh đại diện chữ tắt là hình tròn. Logo là ô vuông mực bo 8px, chữ "C" Barlow Condensed.

Mọi viền đều 1px. Tờ lịch cắt phần thừa (overflow hidden) để dải tháng ăn sát góc bo.

Khung thiết bị của video ở trang đầu theo hình thiết bị thật: điện thoại là viền mực dày 9px bo 40px, màn trong bo 31px (dưới 640px: 8px, 36px, 28px); laptop là khung nét 1px rule bo 14px, cắt phần thừa. Viền mực dày chỉ dùng cho khung điện thoại này. Nút dừng video là hình tròn.

## Components

### Buttons
Phẳng, chắc, không bóng.
- **Shape:** bo 10px, cao 40px, lề ngang 16px, chữ Barlow 600 15px. Có biểu tượng thì cách chữ 8px.
- **Primary:** nền xanh mực, chữ trắng, viền cùng màu nền. Mỗi vùng chỉ một nút chính.
- **Secondary:** nền giấy, viền rule, chữ mực.
- **Hover / Focus:** nút chính đậm sang blue-hover; nút phụ đổi viền sang ink-3 và nền xám rất nhạt (#F6F7F9). Chuyển màu 160ms ease-out. Focus là viền ngoài 2px xanh mực, cách 2px.
- **Bấm xuống:** nút lún 1px và nhỏ lại 1,5% (150ms), như ấn vào giấy.
- **Đang gửi** (`aria-busy="true"`): nút giữ màu (nút chính đậm sang blue-hover), vòng xoay 16px đứng sát mép trái, chữ không xô. Không dùng kiểu nút khóa (xám) cho trạng thái này. Nút giữ trạng thái đang gửi cho tới khi số mới từ máy chủ về (`useClubMutation` chờ làm mới dữ liệu CLB xong), nên số trên màn không nhảy hai lần. Link đang mở trang mới thì vòng xoay thế chỗ biểu tượng của link (`LinkIcon`, dùng `useLinkStatus` của Next).
- **Disabled:** nền rule-soft, chữ ink-3, con trỏ cấm. Nút chưa có trong MVP dùng `aria-disabled` cùng kiểu này, và luôn kèm chữ "chưa có" thấy được (cạnh nút, cuối dòng thao tác, hoặc cuối mục thanh bên), nối với nút bằng `aria-describedby`.
- **Khóa vì thiếu quyền:** nút dùng `disabled` và phải có câu nói rõ lý do (`.l-note`, 13.5px mực 3) đặt gần nút, nối với nút bằng `aria-describedby`. Không để nút xám mà không nói vì sao.
- **Khóa vì chưa đủ điều kiện:** cùng luật. Ví dụ ở Thêm thành viên: "Thêm người" và "Thêm dòng" dùng `aria-disabled`, nối tới câu trạng thái ở chân phần. Ô chọn vai trò của chủ nhiệm khóa, kèm gợi ý "Đổi chủ nhiệm làm ở màn Bàn giao."
- **Cỡ:** nhỏ cao 34px, lề 12px, chữ 14px (nút trong dòng, trong bảng và đầu phần). Lớn cao 48px, rộng hết hàng, chữ 16px (nút trên điện thoại và trang đăng nhập). Màn cảm ứng: cao tối thiểu 44px.
- **Icon button:** ô 44x44px, nền giấy, viền rule, bo 10px. Dùng cho nút sao chép mã. Cỡ nhỏ trong bảng 34x34px (link mời ở cột Thao tác của Thành viên); màn cảm ứng vẫn 44px. Nút chỉ có biểu tượng phải có nhãn đọc nói rõ của ai ("Sao chép link mời của <tên>").

### Chips
- **Nhãn trạng thái:** cao 26px, bo tròn, chữ 13.5px đậm 600, nền nhạt và chữ đậm cùng tông. "ok" xanh lá ("Đã đóng", "Đã chi"), "wait" xanh mực ("Chờ thủ quỹ xác nhận", "Chờ mentor duyệt"), "warn" hổ phách ("Chưa đóng", "Đóng thiếu · còn nợ …", "Chưa có chứng từ"), "off" trung tính ("Đã từ chối", "Bạn đề xuất, cần người khác duyệt"). Nhãn trong bảng không xuống dòng.
- **Nhãn đóng quỹ** (`PayTag`, dùng ở Đợt thu và Thành viên): "Đã đóng" ok; "Báo đã chuyển <ngày>" wait; "Chưa đóng" và "Đóng thiếu · còn nợ …" warn. Khi bật `showMethod`, khoản đóng tiền mặt ghi "Đã đóng · tiền mặt". Chưa có khoản nào thì chỉ là dấu "–" mực 3.
- **Nhãn của thành viên:** "Đang xử lý yêu cầu xóa" là warn (hổ phách), không đỏ; "Chưa nhận lời mời" và "Điểm danh tay" là off.
- **Nhãn của CLB với sinh viên** (danh sách CLB): "Bạn đang ở CLB này" và "Đang nhận đơn" ok; "Đã gửi đơn" wait; "Chưa nhận lời mời", "Đơn bị từ chối", "Tạm ngưng nhận đơn" off.
- **Nhãn của nhà trường:** dự trù "Đã nộp" ok, "Chưa nộp" warn; "Quá 30 ngày" off, đứng sau ngày hoạt động gần nhất; đề nghị hỗ trợ "Chờ duyệt" wait, "Đã duyệt" ok, "Từ chối" off.
- **Bộ lọc:** nút bo tròn cao 34px, lề 13px, viền rule, nền giấy, chữ 600 14px mực 2, cách nhau 6px. Rê chuột: viền ink-3, chữ mực. Đang chọn (`aria-pressed="true"`): tô mực, chữ trắng. Chỉ một bộ lọc được chọn mỗi lúc. Trong khung xương, bộ lọc mặc định (đầu tiên) đã tô mực sẵn, nên lúc dữ liệu tới không đổi màu.

### Cards / Containers
- **Tờ giấy làm việc (laptop):** một mặt giấy, viền rule, bo 4px, chia cột và chia phần bằng nét kẻ. Không phải nhiều thẻ rời.
- **Dải số:** xem Layout. Ô cần chú ý (còn người chưa đóng, còn giao dịch chưa gán) tô số bằng hổ phách. Số đếm người viết "12 người", với "người" theo The Unit Word Rule.
- **Thẻ trên nền xám (điện thoại, đăng nhập, trang chặn):** nền giấy, viền rule, bo 14px. Thẻ đóng quỹ lề 16px; thẻ đăng nhập lề 24px; trang chặn rộng tối đa 520px.
- **Thẻ danh sách trên điện thoại** (Của tôi, danh sách CLB): cùng thẻ giấy bo 14px nhưng không có lề trong; mỗi dòng tự có lề 16px và ngăn bằng rule-soft.
- **Ô giữ chỗ cho chữ CLB tự viết** (giới thiệu CLB): viền đứt 1px rule, bo 10px, lề 12px 14px, chữ 14px mực 3. Chỉ dùng cho nội dung CLB tự viết mà chưa có; không dùng làm khung trang trí.
- **Khối video (trang đầu):** tờ giấy riêng, viền rule, bo 14px, lề 40px (dưới 1024px 32px 28px; dưới 640px 24px 16px), các phần cách 28px. Đầu khối là tiêu đề và một câu, rộng tối đa 640px; người dùng của khối nằm ngay trong tiêu đề ("Thành viên điểm danh, đóng quỹ ngay trên điện thoại."). Cuối khối là chú thích "Quay từ bản demo, dữ liệu mẫu." 13.5px mực 3.
- **Shadow Strategy:** không có (xem Elevation & Depth).

### Tables
- **Bảng:** rộng hết tờ giấy, chữ 14.5px. Tiêu đề cột 13px 600 mực 3, gạch dưới bằng rule. Ô lề 11px trên dưới, 12px hai bên; cột đầu và cột cuối lề 20px cho thẳng mép phần. Dòng ngăn bằng rule-soft; dòng cuối không có nét. Rê chuột: nền xám rất nhạt, chuyển 160ms. Dòng tổng ở chân bảng đậm, gạch trên bằng rule.
- **Số tiền và cột thao tác** canh phải. Tên người đậm 600. Mã chuyển khoản mono 14px.
- **Bảng cột cố định** (`.l-fixed`): độ rộng cột đặt bằng một `ColGroup` dùng chung cho bảng thật và khung xương của nó. Chữ dài xuống dòng trong cột.
- **Chân phần:** dòng 13.5px mực 3, lề 12px 20px, gạch trên bằng rule-soft.
- **Bảng trống:** một ô chữ mực 3, lề 18px 20px.
- **Dòng cao cố định:** bảng có ô có thể xuống hai dòng (bảng các CLB) đặt mọi dòng cao 66px. Chữ xuống dòng không làm dòng cao thêm, nên khung xương khớp bảng thật.
- **Bảng nhiều cột trên laptop** (bảng các CLB, tám cột): tiêu đề cột được xuống dòng và canh đáy, để số liệu đứng một dòng. Cột chữ canh trái đứng ngay sau cột số canh phải thì thêm lề trái 28px, cho hai tiêu đề không dính nhau.
- **Bảng hẹp** (dự trù trong cột trái của chi tiết CLB): rộng tối thiểu 480px thay vì 960px.
- **Link trong dòng:** chữ 600, mũi tên nhỏ, không xuống dòng.

### Inputs / Fields
- **Style:** ô nhập, ô chọn và ô nhiều dòng cao tối thiểu 40px, lề 8px 12px, viền rule, bo 10px, nền giấy, chữ 15px. Ô nhiều dòng cao tối thiểu 84px, kéo dọc được. Cỡ nhỏ cao 34px, chữ 14px (ô chọn trong dòng bảng).
- **Nhãn:** 14px 600 mực 2, đặt trên ô. Các ô trong form cách nhau 14px.
- **Hover / Focus:** rê chuột viền ink-3; focus viền xanh mực, chuyển 160ms.
- **Gợi ý:** 13.5px mực 3 dưới ô, ví dụ "Sẽ ghi: 150.000 đ" khi gõ số tiền.
- **Lỗi:** viền ô đỏ lịch (`aria-invalid`), dòng lỗi 13.5px mực đỏ ngay dưới chính ô đó, nối với ô bằng `aria-describedby`. Trong lưới form, mỗi ô giữ dòng lỗi của mình. Riêng form một hàng ngang (thêm dòng dự trù) có một dòng lỗi dưới cả hàng, để các ô vẫn thẳng. Gửi form mà có lỗi thì focus về ô lỗi đầu tiên.
- **Lỗi máy chủ** không thuộc ô nào: thông báo ngắn, hoặc một dòng báo lỗi chung (`role="alert"`) cuối form, ngay trên hàng nút.
- **Giá trị mặc định:** form điền sẵn hôm nay và giá trị hay dùng, nhưng không bao giờ đánh dấu sẵn ô đồng ý.
- **Ô tiền tố mã chuyển khoản:** chữ mono, giãn 0.02em, theo The Mono Only For Codes Rule.
- **Khóa:** nền xám lạnh, chữ mực 3, con trỏ cấm.
- **Chỉ đọc** (`readOnly`): nền xám lạnh, chữ mực 2, rê chuột không đổi viền.
- **Ô đánh dấu:** 18px, màu xanh mực, nhãn 14.5px bên phải.
- **Ô mật khẩu:** dưới các ô mật khẩu là ô đánh dấu "Hiện mật khẩu", không đánh dấu sẵn. Ô có lỗi thì dòng lỗi thay gợi ý; riêng ô mật khẩu giữ gợi ý luật ngay dưới dòng lỗi, vì người dùng cần luật để sửa. Cả hai nối với ô bằng `aria-describedby`.
- **Cặp nhãn và giá trị chỉ đọc** (màn đóng quỹ): nhãn 13.5px mực 3 ở trên, giá trị ở dưới.

### Navigation
- **Thanh bên (laptop):** nền giấy, nét kẻ bên phải. Trên cùng là logo và tên, rồi ô tên CLB nền xám, rồi danh sách mục. Mục cao 40px, chữ 15px mực 2, bo 10px. Rê chuột: nền xám. Đang chọn: nền blue-tint, chữ xanh mực đậm. Số đếm bên phải dùng Barlow Condensed đậm trên ô xám bo 6px. Nhãn nhóm 12.5px mực 3. Cuối thanh là người dùng, ngăn bằng nét kẻ mờ.
- **Thanh bên nhà trường** (`SchoolFrame`): cùng kiểu thanh bên. Ô tên là "[Tên trường]" và "Ban quản lý CLB · <học kỳ>". Mục chưa làm ("Dự trù và báo cáo") là mục khóa, cuối mục có chữ "chưa có" 12.5px 500 mực 3, nối bằng `aria-describedby`. Dưới tên người là chức danh 13px mực 3.
- **Thanh tab (điện thoại):** ba tab (Điểm danh, Quỹ, Của tôi), biểu tượng 22px trên nhãn 13px. Tab thường mực 3; tab đang chọn xanh mực đậm. Màn quét mã, danh sách CLB, trang một CLB và lời mời không có thanh tab (xem Layout).
- **Thanh tab của trang chung** (`HubNav`, `l-tabs hub`): hai mục chung cho mọi vai ("Trang chung", "Khám phá"; biểu tượng 22px, chia đều chỗ), rồi các mục theo vai do `web/src/lib/hub.ts` chọn: cán bộ trường "Nhà trường"; ban điều hành "Quản lý CLB"; thành viên hoặc người chưa ở CLB nào "Của tôi"; người chưa ở CLB nào thêm "Tạo CLB". Tin nhắn không còn là tab mà là bong bóng chat. Đang tải thì mục theo vai giữ chỗ bằng một thanh giữ chỗ, nên thanh không nhảy.
- **Nút theo vai** (`.l-tab.role`): nút bo 12px, viền 1.5px, chữ 14.5px đậm 700, không xuống dòng, biểu tượng cạnh chữ cách 8px. Mục đầu là nút đặc xanh mực chữ trắng (rê chuột blue-hover), cao 44px, lề ngoài 7px 5px; từ 1024px cao 40px, lề trái 6px, lề ngang trong 16px. Mục thứ hai trở đi ("Tạo CLB") nền giấy, viền và chữ xanh mực, rê chuột nền blue-tint. Đang ở đúng trang của mục (`aria-current="page"`) thì nền và viền mực, chữ trắng. Dưới 360px biểu tượng của nút ẩn để hai mục chung đủ chỗ cho chữ. Theo The One Solid Blue Rule.
- **Link quay lại:** mũi tên trái 18px và chữ 15px 600 mực 2, cách 4px; rê chuột thì chữ mực. Trên đầu khung điện thoại cao tối thiểu 44px. Dùng ở trang một CLB (điện thoại) và trang chi tiết CLB (nhà trường).
- **Thanh trên của trang đầu:** link chữ 600 mực 2, lề 10px 8px; rê chuột thì xanh mực và gạch dưới. Nút "Đăng ký" là nút chính.
- **Tab trong tờ giấy:** hàng tab sát trên một phần, gạch dưới bằng rule. Chữ 600 14.5px mực 3; rê chuột và đang chọn thì mực. Tab đang chọn có gạch mực 2px đè lên nét kẻ. Cuộn ngang khi hẹp.
- **Dải chọn đợt thu:** hàng tab trong tờ giấy, lề 4px 12px 0. Mỗi đợt là một link sang trang của đợt đó. Đợt đang xem có `aria-current="page"`, chữ mực và gạch mực 2px. Mục cuối "Tạo đợt thu" (biểu tượng cộng 16px) đẩy sang phải và tô xanh mực vì là thao tác; chỉ hiện cho người có quyền về tiền.
- **Danh sách chọn bên trái** (Duyệt chi): mỗi mục là một nút rộng hết cột, lề 12px 16px, ngăn bằng rule-soft. Dòng trên là tên khoản (600) và số tiền (Barlow Condensed 17px) ở hai đầu; dưới là dòng phụ và nhãn trạng thái. Rê chuột: nền xám rất nhạt. Đang mở (`aria-pressed="true"`): nền blue-tint.

### Dòng tin (trang chung)
Danh sách `.l-posts`, mỗi tin là một liên kết `.l-post` cả dòng. Lưới ba ô: ô trái 64px (tờ lịch thường cho tin sự kiện, hoặc nhãn loại tin), nội dung ở giữa, mũi tên 20px mực 3 bên phải; cột cách 14px, dòng lề 14px trên dưới, ngăn bằng rule-soft, dòng cuối không có nét. Nội dung xếp dọc cách 3px: dòng tên CLB 13.5px mực 3, tiêu đề 16px 600 cao dòng 1.3, vài dòng đầu 14px mực 2 cắt ở hai dòng. Rê chuột: tiêu đề gạch dưới. Dữ liệu là tin mẫu, nên màn có dòng "Dữ liệu mẫu: …" thấy được (`.l-placeholder` ở danh sách, `.l-note` ở chi tiết tin).

### Bong bóng chat và khung chat (mẫu)
Chưa dùng được, nên mọi thứ đều nói rõ "đang phát triển" ngay trên màn.
- **Bong bóng** (`.l-chatfab`): nút tròn 56px (`--l-fab`), nền giấy, viền 1.5px xanh mực, biểu tượng xanh mực 26px, cố định góc phải dưới. Dưới 1024px nằm cách mép phải 16px, ngay trên thanh tab (khe `--l-fab-gap` 14px cộng cao thanh tab `--l-tabbar-h` và vùng an toàn của máy); từ 1024px cách mép 24px. Rê chuột: tô xanh mực, biểu tượng trắng (150ms); bấm xuống nhỏ lại còn 95%. Không bóng. Nhãn đọc cố định "Tin nhắn", trạng thái mở nằm ở `aria-expanded`; mở thì biểu tượng đổi thành dấu đóng.
- **Khung chat** (`.l-chatw`): hộp thoại không chặn trang (`role="dialog"`, `aria-modal="false"`), rộng tối đa 360px (hẹp hơn thì chừa 16px mỗi bên), cao tối đa 460px, bo 14px, viền 1px mực 3, mở lên phía trên bong bóng, cách 10px. Chừa 72px trống ở trên cho đầu màn; chiều cao khai báo bằng `vh` trước rồi `dvh`, vì trình duyệt trong Zalo có thể chưa hiểu `dvh`. Đầu khung là dải mực chữ trắng như dải tháng của tờ lịch: tiêu đề 16px đậm ("Tin nhắn", hoặc "Nhắn cho <CLB>" khi mở từ nút `ChatButton`), nhãn hổ phách "Đang phát triển", nút đóng 44px.
- **Thân và ô viết:** thân có câu "Tính năng nhắn tin đang phát triển" và một câu nói hiện tại liên hệ CLB bằng cách nào. Ô viết và nút "Gửi" bị khóa, nối bằng `aria-describedby` tới dòng "Chưa gửi được: tính năng đang phát triển." thấy được ngay dưới (theo luật khóa nút ở mục Buttons).
- **Chuyển động và focus:** hiện bằng mờ dần, phóng từ 94% và nhích 8px trong 200ms (gốc ở góc dưới phải); giảm chuyển động thì không có. Mở thì focus vào khung; Esc hoặc nút đóng thì đóng và focus về chỗ đã mở (không còn thì về bong bóng). Khi in, bong bóng và khung ẩn.

### Chi tiết một khoản
Cột phải của Duyệt chi. Lề 18px 22px 22px, các khối cách nhau 18px. Đầu là tiêu đề 22px bên trái và số tiền Barlow Condensed 34px bên phải. Thông tin là danh sách định nghĩa hai cột: nhãn 140px mực 3, giá trị bên phải, chữ 14.5px. Lịch sử là danh sách thời gian: ngày giờ 96px mực 3, việc đã làm bên phải, 14px. Đổi trạng thái thì nhãn mới mờ dần và nhích 4px (200ms).

### Phép tính số dư (Dự trù)
Một dải số dạng phép tính: bốn ô và ô kết quả, giữa các ô là dấu + − = Barlow Condensed 26px mực 3 trong ô rộng 26px. Ô kết quả rộng hơn một chút (1.15) và có nét kẻ trái riêng. Khi quỹ thiếu, số kết quả tô hổ phách và dòng dưới dải nói rõ "Quỹ đang thiếu …" kèm biểu tượng hổ phách.

### Hộp nhập liệu
Sửa nhanh trong hộp: vai trò và ban của thành viên, sửa đợt thu (`LichDialog`). Cùng hộp giấy, lớp phủ và chuyển động với hộp hỏi lại, nhưng rộng tối đa 460px. Tiêu đề 19px, dòng mô tả nếu có. Hàng nút như hộp hỏi lại: "Hủy" và nút lưu. Đóng bằng Esc, "Hủy" hoặc bấm ra ngoài; focus về nút đã mở hộp.

### Danh sách buổi
Mỗi buổi là một dòng lưới cột cố định, nên nhãn, số và nút thẳng hàng giữa các dòng: tờ lịch thường 64px, tên buổi (16px 600) và dòng phụ, nhãn trạng thái 156px, số người 76px, thao tác 250px canh phải. Dòng lề 12px 20px, cột cách 18px, ngăn bằng rule-soft.
- **Sắp tới và Đã qua:** buổi vào "Đã qua" khi đã đóng điểm danh hoặc đã qua giờ kết thúc.
- **Nhãn:** "Đang mở điểm danh" là nhãn chờ; "Sắp tới", "Đã đóng" và "Chưa mở điểm danh" (buổi đã qua mà chưa từng mở) là nhãn off.
- **Số người:** Barlow Condensed 22px, phần "/tổng" Barlow 600 16px mực 3. Buổi chưa diễn ra ghi "–".
- Tờ lịch của buổi chỉ đỏ khi buổi là hôm nay.

### Bảng nhập sửa được (Thêm thành viên)
Bảng cột cố định; mỗi ô là ô nhập cỡ nhỏ. Ô canh trên, lề 8px trên dưới. Rê chuột không tô nền dòng. Lỗi nằm ngay dưới ô, 12.5px mực đỏ, nối bằng `aria-describedby`. Mỗi ô có nhãn đọc "<cột>, dòng N". Chân phần: nút nhỏ "Thêm dòng" bên trái, câu trạng thái mực 2 (`role="status"`) ở giữa, nút chính bên phải.

### Xem trước màn đóng quỹ (Tạo đợt thu)
Cột phải lặp lại màn đóng quỹ của thành viên và đổi theo từng ô của form: tên đợt thu, số tiền, hạn đóng kèm tờ lịch hạn đóng (đỏ khi gấp), người nhận theo The Real Role Rule, mã nội dung chuyển khoản bằng mono. Không vẽ mã QR, nên không có dòng "Bản demo" (dòng đó ở màn đóng quỹ thật). Ô chưa điền thì hiện chữ giữ chỗ ("Tên đợt thu", "– ₫", "TÊN CHỦ TÀI KHOẢN"). Đầu phần là tiêu đề "Xem trước" và ghi chú "Thành viên thấy ở màn đóng quỹ" cùng một hàng, nét kẻ mờ bên dưới, cách 10px. Không đặt nhãn nhỏ trên tiêu đề.

### Hộp hỏi lại
Dùng trước thao tác khó hoàn lại, vì sổ quỹ chỉ được thêm bút toán. Hộp giấy rộng tối đa 440px, lề 22px, viền rule, bo 14px, giữa màn. Lớp phủ mực 42%. Tiêu đề 19px, mô tả 14.5px mực 2. Hai nút: "Hủy" (nút phụ, nhận focus khi mở) và nút xác nhận (nút chính). Trên laptop hai nút cùng hàng bên phải; dưới 640px xếp dọc, nút xác nhận ở trên, cao 44px. Đóng hộp thì focus về nút đã mở nó; nếu nút đó biến mất sau khi xác nhận thì focus về chỗ hợp lý kế tiếp. Hộp được đưa ra cuối `<body>`, ngoài lớp `.lich`: biến màu khai báo ở `:root` nên vẫn dùng được, còn chữ và màu do `.l-dialog` tự đặt (`LichConfirm`).

### Thông báo ngắn
Thông báo sau khi làm xong ("Đã ghi: … chuyển khoản …", "Đã từ chối khoản chi."). Khi trang có `.lich`: nền giấy, viền rule, bo 10px, chữ Barlow 14.5px mực. Biểu tượng tích hoặc cảnh báo 18px. Điện thoại: giữa phía trên (nút chính và menu ở đáy). Từ 1024px: góc dưới bên phải. Mỗi lúc chỉ hiện một thông báo, tự tắt sau 2,5 giây. Lỗi từ máy chủ hiện bằng thông báo lỗi khi màn không có chỗ báo lỗi riêng.

### Màn chiếu mã QR
- **Mã QR lớn:** khung giấy viền rule, bo 14px, lề 18px, vuông. Mã đổi thì mã mới mờ chồng lên mã cũ (200ms).
- **Thanh đếm giờ:** thanh tiến độ cao 8px, bo tròn, nền rule-soft, phần còn lại xanh mực. Thanh rút ngắn bằng `transform: scaleX`, chạy đều mỗi giây (`transition: transform 1s linear`), không đổi độ rộng. Trên thanh là dòng đếm 15px 600 mực 2.
- **Số điểm danh:** "N" Barlow Condensed 76px, "/ tổng" 32px mực 3, nhãn 15px mực 2. Số đổi thì số mới mờ dần và nhích 6px (200ms).
- **Danh sách:** mỗi dòng là lưới giờ 54px (mực 3), tên đậm 600, nhãn bên phải; chữ 16px, ngăn bằng rule-soft. Người mới mờ dần vào đầu danh sách (200ms).
- **Nút màn chiếu:** cao 52px, lề 28px, chữ 17px, cho nút mở điểm danh khi chưa mở.

### Dải bước bàn giao
Sáu bước nằm trên một hàng, chia đều, ngăn bằng nét dọc rule-soft. Mỗi bước: ô số 30px bo 8px viền 1px, số Barlow Condensed 17px, rồi tên bước 14px.
- **Đã xong:** ô số nền ok-tint, dấu tích ok thay cho số; tên mực 2.
- **Đang làm:** cả ô bước nền blue-tint, tên mực đậm 700; ô số tô xanh mực, số trắng. Có `aria-current="step"`.
- **Chưa làm:** ô số chỉ có viền rule, số và tên mực 3.
- Trình đọc màn hình nghe thêm "(xong)", "(đang làm)", "(chưa làm)".

### Điểm danh trên điện thoại
- **Kết quả quét mã:** căn giữa: tờ lịch xl của buổi, tiêu đề, dòng tên buổi và giờ. Lỗi thì tờ lịch hôm nay, tiêu đề 26px, câu giải thích 15px mực 2 rộng tối đa 34ch.
- **Dấu đã điểm danh:** hình tròn 44px, viền 1px ok, nền ok-tint, dấu tích ok. Dấu đóng ở góc dưới bên phải tờ lịch, nằm ngoài cột chữ của tờ lịch (lệch 26px sang phải, 12px xuống dưới), nên không che chữ thứ. Không có bóng. Dấu hiện bằng mờ dần và phóng từ 60% (220ms). Tờ lịch chỉ đỏ khi buổi đó là hôm nay.
- **Các tuần trong kỳ:** mỗi buổi là một cột, thanh cao 10px bo tròn. Tuần có mặt: thanh xanh mực, chữ mực 2 đậm; tuần vắng: thanh rule-soft, chữ mực 3.
- **Lịch sử điểm danh:** mỗi buổi một dòng, cao tối thiểu 48px, ngăn bằng rule-soft. Đầu dòng là tờ lịch thường của ngày buổi đó, dòng dưới tờ lịch là thứ. Tiếp theo là tên buổi (600) và "Có mặt hh:mm" hoặc "Vắng" (mực 3). Cuối dòng là nhãn off "Điểm danh tay" nếu có.

### Của tôi (điện thoại)
- **Hồ sơ:** ảnh đại diện chữ tắt cỡ lớn (tròn 52px, chữ 19px) bên trái, tên và dòng phụ bên phải, cách 14px.
- **Dòng số liệu:** mỗi dòng cao tối thiểu 48px, lề 10px 16px, ngăn bằng rule-soft. Nhãn 15px mực 2 bên trái; bên phải là số Barlow Condensed 22px hoặc một nhãn trạng thái.
- **Dòng thao tác với dữ liệu:** mỗi thao tác là một nút rộng hết thẻ, cao tối thiểu 52px, chữ 500 15px mực, ngăn bằng rule-soft, không viền riêng. Rê chuột: nền xám rất nhạt; bấm xuống: nền xám lạnh. Cuối dòng là mũi tên, hoặc chữ "chưa có" 13.5px mực 3 khi thao tác chưa làm (dòng khóa có chữ mực 3, nối bằng `aria-describedby`).
- **Mục Đăng nhập:** đầu danh sách "Đăng nhập". Dòng "Tên tài khoản": giá trị chữ đậm 600 mực, canh phải; chưa đặt thì ghi chú mực 3 "Chưa đặt · đăng nhập bằng Google". Dòng "Đặt tên tài khoản và mật khẩu" (hoặc "Đổi …") là link cùng kiểu dòng thao tác, mũi tên ở cuối.
- **Dòng đã xong:** việc không còn gì để làm là chữ thường mực 3, cao 52px ("Bạn không cho lưu số điện thoại"). Không dùng nút khóa cho dòng này.
- **Yêu cầu xóa đã gửi:** dòng đổi thành tờ lịch thường đếm hạn xử lý 20 ngày, cạnh dòng "Đã gửi yêu cầu xóa ngày …" (đậm 600). Tờ lịch đỏ khi còn 3 ngày trở xuống. Dòng mới hiện dần 200ms.

### Danh sách CLB (điện thoại)
Hàng tìm và lọc là lưới hai ô (1.2 : 1, cách 10px). Dưới là một thẻ giấy, mỗi CLB một dòng: lề 14px trên, 16px dưới, ngăn bằng rule-soft. Hàng đầu là tên CLB (17px) và nhãn trạng thái bên phải; dưới là dòng phụ; cuối là nút phụ lớn rộng hết dòng, cách 8px.

### Ô đồng ý (lời mời)
Một thẻ giấy là `fieldset`, tiêu đề là `legend` 15px đậm 700 ("Trước khi tham gia, bạn chọn:"). Mỗi mục đích là một dòng có ô đánh dấu 20px, lề 12px trên dưới, ngăn bằng rule-soft, chữ 15px. Không ô nào đánh dấu sẵn. Dưới chữ của mỗi ô là ghi chú 13px mực 3; ô bắt buộc thì ghi chú đậm 600 mực 2. Phía trên thẻ là dòng tài khoản đang đăng nhập (14.5px), link đổi tài khoản bên phải.

### Trạng thái đơn xin vào
Thẻ giấy bo 14px, các phần cách 10px. Đổi trạng thái thì thẻ mới hiện dần và nhận focus.

### Chi tiết một CLB (nhà trường)
- **Tờ giấy hai cột:** xem Layout. Mỗi phần có đầu phần như màn trong. Phần chỉ có chữ dùng thân phần lề 0 20px 18px, các khối cách 12px.
- **Phần chờ duyệt:** một đầu phần cho cả nhóm: tiêu đề "Chờ bạn duyệt", ghi chú "Khoản trên <ngưỡng>" bên phải. Mỗi khoản là một khối chi tiết; tên khoản là tiêu đề cấp dưới, số tiền xuống dòng dưới vì cột hẹp. Các khoản ngăn nhau bằng rule-soft. Hết khoản chờ thì câu báo nằm ngay dưới đầu phần. Khoản vừa duyệt hay từ chối thu lại trong 200ms.
- **Dải số sinh hoạt:** ô đầu là tờ lịch thường của buổi gần nhất (đỏ chỉ khi buổi đó là hôm nay). Ô chưa có số ghi "chưa có" bằng chữ thường 17px mực 3, cao đúng bằng dòng số.
- **Thao tác chưa làm trong phần** ("Xem đề nghị"): nút phụ nhỏ khóa, cạnh chữ "chưa có", cách 10px.

### Video demo (trang đầu)
Video quay từ bản demo thật (`web/e2e/record-demo-videos.cjs`, file ở `web/public/video/`), không có phần chỉ có ở bản demo. Ảnh đầu video giữ chỗ trước khi video tải. Khung: điện thoại viền mực rộng 300px (dưới 640px 260px) hoặc laptop khung nét 1px (xem Shapes).
- **Tự chạy:** không tiếng, lặp lại, chỉ khi khung thấy ít nhất 35%; ra khỏi màn hình thì dừng.
- **Nút dừng luôn hiện** (WCAG 2.2.2): nút tròn nền giấy viền rule ở góc dưới phải video, nhãn đọc "Dừng video" / "Phát video".
- **Giảm chuyển động:** không tự chạy; giữa video là nút chính "Phát video" có biểu tượng.
- **Danh sách bước:** mỗi video 5 bước, mỗi bước là một nút: số Barlow Condensed 22px, tên 17px 700, mô tả 14.5px, ngăn bằng rule-soft. Bước chưa chạy mực 3 (rê chuột mực 2). Bước đang chạy (`aria-current="step"`) mực, mô tả mực 2, và có thanh xanh mực 2px đè lên nét kẻ của bước, chạy theo video (`scaleX`, 250ms linear). Bấm một bước thì video nhảy tới đó. Cạnh điện thoại là danh sách dọc; dưới laptop là một hàng năm bước, thanh ở mép trên, số 18px.

### Thẻ đăng nhập và tài khoản
- **Form mật khẩu:** ô "Tên tài khoản hoặc email", ô "Mật khẩu", ô đánh dấu "Hiện mật khẩu", nút chính lớn.
- **Chữ "hoặc":** 13.5px mực 3, giữa hai nét kẻ mờ 1px kéo hết hai bên, cách 12px. Ngăn form mật khẩu với nút Google (nút phụ lớn).
- **Dòng trợ giúp:** 14.5px mực 2, căn giữa, link đậm 600 ("Quên mật khẩu? Đặt lại bằng Google").
- **Chân thẻ:** nét kẻ mờ ở trên, lề trên 16px, các dòng xếp dọc cách 8px, chữ 14.5px mực 2, link đậm 600.
- **Lỗi từ Google:** máy chủ gửi mã (`?error=…`); trang đổi mã thành câu có sẵn trong hộp báo lỗi, mã lạ thì câu chung "Đăng nhập chưa xong. Bạn thử lại." Không hiện chữ lấy từ đường dẫn.
- **Khung xương:** nhãn ô cố định là chữ thật; nhãn chỉ có khi biết dữ liệu (ô "Mật khẩu hiện tại") là thanh giữ chỗ.

### Tờ lịch (Leaf) — thành phần đặc trưng
Dấu hiệu của cả thế giới. Ba tầng: dải tháng nền mực chữ trắng ở trên, số ngày Barlow Condensed đậm ở giữa, dòng nhỏ ở dưới. Dòng dưới là thứ trong tuần ("Thứ Bảy"), hoặc khoảng cách tới hạn ("còn 7 ngày", "hạn hôm nay", "quá hạn 2 ngày"), hoặc "hôm nay".
- **Cỡ thường** (rộng tối thiểu 64px, số 30px, dải "Tháng 10"): đánh dấu ngày diễn ra sự kiện và ngày hạn đóng, kể cả ô đầu dải số; hạn xử lý yêu cầu xóa dữ liệu (20 ngày) ở Của tôi; buổi sinh hoạt gần nhất ở chi tiết CLB của nhà trường.
- **Cỡ vừa** (rộng tối thiểu 80px, số 44px, dải 12px, dòng dưới 12.5px đậm mực 2): tờ lịch hôm nay mở đầu các màn trong của ban điều hành và hai màn nhà trường (`PageTop`), màn chiếu, và các màn điện thoại không có thanh tab (danh sách CLB, trang một CLB, lời mời), đứng cạnh tiêu đề.
- **Cỡ xl** (rộng tối thiểu 112px, số 76px, dải "Tháng 10, 2026"): tờ lịch hôm nay mở đầu trang đầu, trang chủ ban điều hành, trang đăng nhập, đăng ký, tài khoản và trang chặn toàn màn; tờ lịch của buổi vừa điểm danh.
- **Tông đỏ** (`today` hoặc `urgent`): dải tháng đỏ lịch, số ngày mực đỏ. Chỉ dùng theo The Red Day Rule.
- **Trợ năng:** cả tờ lịch là một ảnh có nhãn đọc đầy đủ, ví dụ "Hạn đóng 10/10/2026, còn 7 ngày". Các phần chữ bên trong bị ẩn với trình đọc màn hình.

### Dòng việc cần làm
Số việc Barlow Condensed 34px ở ô trái, tiêu đề 16px đậm vừa và dòng phụ ở giữa, mũi tên mực 3 ở phải. Cả dòng là một liên kết tới chỗ xử lý. Rê chuột: nền xám rất nhạt, chuyển 150ms. CLB mới chưa có thành viên, buổi hay đợt thu thì dòng là việc khởi đầu, và ô số chứa biểu tượng 26px (người, lịch, ví) thay cho số.

### Khối đóng quỹ (điện thoại)
Mã QR trong khung giấy rộng 160px, viền rule, bo 10px. Ngay dưới mã là dòng "Bản demo: mã này không chuyển tiền được.", chữ 13px mực 3, căn giữa. Dòng này phải ở lại cho tới khi có mã VietQR thật. Tiếp theo, ngăn bằng nét kẻ mờ, là người nhận: nhãn "Người nhận", tên chủ tài khoản đậm, rồi dòng "<vai trò> <CLB>, nhiệm kỳ <kỳ>" kèm ngân hàng và 4 số cuối. Cuối thẻ là mã nội dung chuyển khoản bằng mono 18px, cạnh nút sao chép.

**The Real Role Rule.** Người nhận tiền luôn ghi vai trò thật trong CLB (`ROLE_LABEL`), không viết cứng "thủ quỹ". Không rõ vai trò thì ghi "Người nhận quỹ của <CLB>".

### Chuyển động
Chuyển động chỉ để cho thấy cái gì vừa đổi. Thời lượng 150–250ms, ease-out. Luật này có đúng ba ngoại lệ có tên (The Time Indicator Exemption, The Scroll Position Exemption, The Authored Scene Exemption) và một lớp riêng cho màn làm việc (The Cascade Layer), mỗi cái có giới hạn ghi ngay dưới. Thứ gì ngoài danh sách đó thì theo luật 150–250ms. Màu vẫn theo Lịch bloc: hiệu ứng không thêm màu, bóng hay gradient, và đỏ vẫn chỉ cho hôm nay và việc gấp. Mọi ngoại lệ và lớp này đều tắt khi máy bật giảm chuyển động. Code ở `web/src/components/lich/motion.tsx`, `web/src/components/lich/fx/` và cuối `lich.css`.

**The Time Indicator Exemption.** Ba thứ chỉ báo thời gian không theo luật 150–250ms: vòng xoay (700ms một vòng), nhấp nháy của khung xương (1,1s), và thanh đếm giờ của mã QR (`transform 1s linear`, mỗi giây rút một nấc). Chúng đo thời gian, không phải hiệu ứng đổi trạng thái. Không dùng ngoại lệ này cho thứ khác.

**The Scroll Position Exemption.** Ở trang đầu, khối trượt theo vị trí cuộn chứ không theo thời gian, nên không có thời lượng và không theo luật 150–250ms (Hiệu duyệt 05/10/2026; `ScrollFade` trong `web/src/app/(landing)/demo-video.tsx`). Khối tiếp theo trượt 72px từ trái vào và rõ dần, rõ hẳn khi mép trên lên tới 70% màn hình (khối nhỏ cuối trang: khi nằm trọn trong màn hình). Khối đã xem trượt sang phải và mờ đi, bắt đầu khi mép dưới lên quá 35% màn hình, nên phần đang đọc không mờ. Khối nằm sẵn trong màn hình lúc mở trang thì rõ ngay. Trang cắt tràn ngang bằng `overflow-x: clip` (giữ được thanh trên dính); khi in, mọi khối hiện rõ. Giảm chuyển động thì tắt hẳn. Giới hạn: chỉ `ScrollFade`, chỉ opacity và transform, chỉ ở trang đầu, không bao giờ trong màn làm việc. Cảnh 3D của trang đầu cũng gắn với cuộn nhưng theo luật riêng (The Authored Scene Exemption).

**The Authored Scene Exemption.** Trang đầu có đúng một cảnh 3D nhỏ: cuốn lịch treo tường bảy tờ bên phải tiêu đề (Hiệu duyệt 29/10/2026; `LeafScene` và `LeafStage` trong `web/src/components/lich/fx/`, kiểu `.l-land-stage`). Cuộn trong 240px đầu thì tờ lịch bị xé dần, theo vị trí cuộn (GSAP ScrollTrigger, độ trễ theo 0,6s); con trỏ làm cuốn lịch nghiêng nhẹ; lúc vào chạy 0,9s; khung hiện dần 500ms. Nên không theo luật 150–250ms. Giới hạn cứng:
- Một cảnh duy nhất, chỉ ở trang đầu. Không thêm cảnh cho trang khác hay màn làm việc.
- Vật liệu phẳng, không đèn; màu đọc từ biến `--l-*`; không bóng đổ, không gradient, không màu mới. Đỏ chỉ ở tờ hôm nay (The Red Day Rule). Cảnh không vẽ số tiền, và tờ lịch hôm nay thật (`TodayLeaf`, tên `l-today`) giữ nguyên.
- Chỉ vẽ khi có thay đổi (không có vòng lặp liên tục), dọn sạch bộ nhớ khi tháo, và tự ẩn khi mất ngữ cảnh WebGL.
- Cổng tải: chỉ nạp (lazy) khi bề rộng từ 1100px, có chuột (`hover: hover`), không bật giảm chuyển động, có WebGL, và bộ nhớ máy từ 4GB trở lên khi trình duyệt cho biết; rồi chờ 600ms rảnh. Không đủ một điều kiện thì không nạp gì và trang y như cũ. Dưới 1100px khung ẩn.
- Chỉ để trang trí (`aria-hidden`, không nhận chuột). Không chứa thông tin, không là thao tác duy nhất của thứ gì, và không bao giờ bắt người dùng chờ: trang và nút chính hiện đủ trước khi cảnh nạp.

**The Cascade Layer.** Lớp hiệu ứng của màn làm việc (Hiệu duyệt 29/10/2026; cuối `lich.css`, trong `prefers-reduced-motion: no-preference`). Chỉ đổi opacity và transform, nên khung xương và màn đã tải trùng vị trí. Giới hạn cứng:
- Các phần của tờ giấy (`.l-sheet > .l-sec`) hiện lần lượt: mờ dần và nhích lên 8px, mỗi phần 200ms, trễ 0, 32, 64, 96ms (phần thứ tư trở đi cùng 96ms), nên xong trong 296ms.
- Tờ lịch hạn (không phải tờ hôm nay, không phải khung xương) lật xuống từ mép trên trong 240ms.
- Không chạy trong khung xương (`aria-busy`). Dòng bảng và dòng việc cần làm không chạy, vì bảng dài mà từng dòng chạy thì chậm và rối.
- Số tiền và số liệu tiền không bao giờ chạy hay đếm lên.
- Màn làm việc không bao giờ bắt người dùng chờ hiệu ứng: nội dung có trong DOM và bấm được ngay, hiệu ứng chỉ là lớp phủ trên cùng một vị trí. Không thêm hiệu ứng vào lớp này nếu tổng thời gian vượt 300ms.

- **Đang tải: khung xương, không chữ "Đang tải…".** Khung xương có đúng bố cục màn. Chữ không phụ thuộc dữ liệu (tiêu đề trang và phần, nhãn ô số, tiêu đề cột, tên bộ lọc, mục menu, tab, tờ lịch hôm nay) hiện thật ngay. Chỉ số liệu là thanh giữ chỗ `.l-skel`: màu rule-soft, nhấp nháy chậm 1,1s, không dùng dải màu chuyển. Trình đọc màn hình nghe "Đang tải…".
- **The Zero Shift Rule.** Khung xương phải khớp màn đã tải theo cả chiều ngang và chiều dọc; dữ liệu tới thì không gì nhảy. Cách làm:
  - Chữ cố định là chữ thật, không thay bằng thanh.
  - Thanh giữ chỗ nằm bên trong đúng phần tử chữ thật (`SkelLine`, cao 0,72em, đứng giữa dòng), nên dòng vẫn cao như chữ thật.
  - Tờ lịch đang tải dùng chính khung tờ lịch, chữ trong suốt (`LeafSkel`), nên đúng kích thước tờ lịch thật.
  - Bảng và khung xương của nó dùng chung độ rộng cột (`ColGroup`, `TableSkeleton`); tiêu đề cột là chữ thật.
  - Ô nhập trong khung xương giữ kiểu giấy của màn đã tải nhờ `.l-inert` (`readOnly`, `aria-hidden`, `tabIndex -1`, không nhận chuột), không dùng nền xám của ô bị khóa.
  - Cột có nhãn trạng thái trong `TableSkeleton` (`tags`) dùng một nhãn off chứa thanh giữ chỗ, nên dòng cao đúng như dòng có nhãn 26px của bảng thật (49px).
  - Khung xương lần tải đầu vẽ trạng thái hay gặp nhất: bàn giao vẽ form của bước 3; màn chiếu vẽ trạng thái chưa mở điểm danh (câu hướng dẫn và nút lớn, `.l-skel-btn-big`); Các buổi vẽ một buổi sắp tới và năm buổi đã qua; form vẽ cả dòng gợi ý dưới ô.
  - Khung xương vẽ đúng màu của trạng thái mặc định, nên không gì đổi màu lúc dữ liệu tới: bộ lọc đầu tiên tô mực sẵn (`.l-chip.l-on`), nhãn đề nghị hỗ trợ là nhãn "chờ".
  - Bảng có ô có thể xuống dòng dùng dòng cao cố định (`.l-rows-2`), nên chữ dài không xô dòng. Tiêu đề cột của `TableSkeleton` nhận cả chữ lẫn thành phần (ví dụ tiêu đề kèm thanh giữ chỗ cho học kỳ).
  - Đã đo độ dời khi dữ liệu tới: 0px ở bốn màn luồng tiền, ở Thành viên và Bàn giao (bước 3), ở màn chiếu (trạng thái chưa mở điểm danh), ở sáu màn của nhóm 3 và 4, và ở năm màn mới hoặc vừa đổi (Tạo CLB, Thêm thành viên, Thành viên có cột Thao tác, Các buổi, Tạo đợt thu). Khung xương và màn đã tải trùng vị trí. Chỉ độ rộng của chính chữ số liệu đổi theo dữ liệu.
- **Chữ chưa biết thì giữ chỗ:** chữ phụ thuộc dữ liệu mà không có khung xương (link ở phần đầu trang đầu, đổi theo bản demo hay bản thật) giữ chỗ bằng `.l-hold` (ẩn nhưng vẫn chiếm chỗ), rồi hiện dần 200ms (`.l-fade-in`). Không đổi chữ trước mắt người xem.
- **Hiện dần:** dữ liệu tới thì nội dung thay khung xương bằng mờ dần 200ms (`Reveal`). Nếu dữ liệu đã có sẵn trong bộ nhớ tạm (quay lại trang vừa xem) thì hiện ngay, không nháy.
- **Chuyển trang:** dùng View Transitions của trình duyệt qua `<ViewTransition>` của React (`LichPage`). Trang cũ mờ đi trong 150ms. Trang mới hiện dần trong 200ms và nhích lên 6px (240ms). Tờ lịch hôm nay mang tên `l-today` ở mọi màn có nó, cả cỡ xl ở trang chủ và cỡ vừa ở màn trong. Khi chuyển trang, trình duyệt dời đúng tờ lịch sang chỗ mới và thu nhỏ hoặc phóng to nó (240ms), thay vì xóa đi vẽ lại. Trình duyệt chưa hỗ trợ thì chuyển ngay, không lỗi.
- **Hộp hỏi lại:** lớp phủ hiện dần 180ms; hộp hiện dần và phóng từ 98% lên 100% trong 200ms. Đóng: mờ đi 150ms.
- **Đổi trạng thái tại chỗ:** báo đã chuyển xong thì nút "Mình đã chuyển khoản" thu lại (200ms), rồi nhãn "Chờ thủ quỹ xác nhận" mờ dần và nhích 8px vào đúng chỗ đó. Duyệt hay từ chối khoản chi thì nhãn mới mờ dần và nhích 4px. Chép nội dung chuyển khoản thì biểu tượng đổi thành dấu tích trong 1,5 giây. Màn chiếu: mã QR mới mờ chồng lên mã cũ (200ms); số điểm danh mới nhích 6px vào chỗ (200ms); người mới mờ dần vào danh sách (200ms). Dấu đã điểm danh hiện bằng mờ dần và phóng to (220ms).
- **Form mở tại chỗ** (Các buổi): form tạo hay sửa buổi cao dần và hiện dần (200ms), đóng thì thu lại. Mở thì focus vào ô đầu; đóng thì focus về nút đã mở, hoặc về tiêu đề "Sắp tới" khi nút đó không còn. Xóa buổi thì dòng thu lại (200ms).
- **Rê chuột:** mũi tên của dòng việc cần làm nhích sang 3px.
- **Giảm chuyển động:** khi máy bật giảm chuyển động thì tắt đổi màu dần, nhấp nháy, vòng xoay, mọi dịch chuyển, hiệu ứng của hộp hỏi lại, việc dời tờ lịch, và cả việc chạy dần của thanh đếm giờ (thanh nhảy từng nấc). Chuyển trang chỉ còn mờ qua trong 150ms. Trang đầu: khối không trượt, video không tự chạy, thanh của bước nhảy thẳng. Motion dùng `reducedMotion="user"`. Cảnh 3D của trang đầu không được nạp (không tải thư viện, không vẽ), nên trang y như chưa có cảnh. Lớp The Cascade Layer không chạy: các phần của tờ giấy và tờ lịch hạn hiện ngay, đúng chỗ.

## Do's and Don'ts

### Do:
- **Do** mở mỗi màn của Lịch bloc bằng tờ lịch: tờ lịch hôm nay cỡ xl ở trang đầu, trang chủ ban điều hành, đăng nhập, đăng ký, tài khoản và trang chặn; cỡ vừa ở các màn trong và màn nhà trường (`PageTop`), màn chiếu, và cạnh tiêu đề các màn điện thoại không có thanh tab (`.l-ptop`); tờ lịch hạn đóng cạnh số tiền trên màn đóng quỹ; tờ lịch của buổi (hoặc hôm nay) trên màn quét mã.
- **Do** biến mỗi hạn chót và ngày sự kiện thành tờ lịch nhỏ, dòng dưới ghi "còn N ngày" hoặc thứ trong tuần, kể cả hạn xử lý yêu cầu xóa dữ liệu (20 ngày). Có hạn chót thì cho tờ lịch đứng đầu dải số.
- **Do** chuyển tờ lịch sang đỏ khi hạn còn 3 ngày trở xuống hoặc đã quá hạn, và cho tờ lịch hôm nay.
- **Do** đặt nội dung bảng làm việc trên một tờ giấy, chia phần, chia cột và chia ô bằng nét kẻ 1px.
- **Do** dùng xanh mực cho mọi thao tác, và chỉ một nút chính mỗi vùng.
- **Do** cho nút đang gửi giữ màu và hiện vòng xoay bên trái (`aria-busy`) cho tới khi số mới về; nút khóa vì thiếu quyền thì kèm câu lý do nối bằng `aria-describedby`.
- **Do** ghi việc đã xong, không còn gì để làm, bằng chữ thường mực 3. Thao tác chưa làm thì khóa và kèm chữ "chưa có" thấy được, nối bằng `aria-describedby`.
- **Do** dựng khung xương khớp màn thật theo cả hai chiều và cùng màu của trạng thái mặc định: chữ cố định là chữ thật, `SkelLine` trong phần tử chữ thật, `LeafSkel` cho tờ lịch, `ColGroup` chung cho bảng, `tags` cho cột có nhãn, `.l-inert` cho ô nhập, `.l-rows-2` cho bảng có ô xuống dòng.
- **Do** dùng nhãn "off" trung tính cho khoản hay đơn bị từ chối, tạm ngưng nhận đơn, chưa nhận lời mời, lâu không hoạt động; dùng hổ phách cho thiếu tiền, chưa đóng, chưa nộp dự trù, yêu cầu xóa dữ liệu.
- **Do** giữ nút chính của màn đóng quỹ trên thanh tab ở khung 390x844.
- **Do** giữ dòng "Bản demo: mã này không chuyển tiền được." dưới mã QR, và ghi người nhận theo mẫu "<tên>, <vai trò> <CLB>, nhiệm kỳ <kỳ>", vai trò lấy từ `ROLE_LABEL` (The Real Role Rule).
- **Do** đặt dòng lỗi ngay dưới ô của nó (`aria-invalid`, `aria-describedby`) và đưa focus về ô lỗi đầu tiên; lỗi máy chủ không thuộc ô nào thì báo bằng thông báo ngắn hoặc dòng báo lỗi chung.
- **Do** điền sẵn hôm nay và giá trị hay dùng cho form, nhưng không đánh dấu sẵn ô đồng ý.
- **Do** đặt mọi kiểu mới của màn dưới lớp `.lich` (thành phần đưa ra ngoài trang, như hộp hỏi, tự đặt chữ và màu); biến màu tiền tố `--l-` khai báo ở `:root`, lớp tiền tố `l-`. Tìm trong `lich.css` trước khi đặt tên lớp mới: `.l-steps`/`.l-step` là dải bước bàn giao (trang chọn vai cũ từng dùng `.l-demo*`), nên trang đầu dùng `l-land*`, `l-vid*`, `l-vstep*`.
- **Do** cho video tự chạy không tiếng chỉ khi đang thấy, luôn hiện nút dừng, và đứng yên với nút "Phát video" khi máy bật giảm chuyển động.
- **Do** giữ chỗ chữ phụ thuộc dữ liệu bằng `.l-hold` rồi hiện dần, thay vì đổi chữ trước mắt người xem.
- **Do** chặn hiệu ứng nặng (WebGL) bằng bề rộng, có chuột, giảm chuyển động và năng lực máy, nạp lazy sau khi trang rảnh, vẽ khi có thay đổi chứ không lặp liên tục, và dọn sạch khi tháo. Máy không đủ điều kiện thì không nạp gì.
- **Do** giữ một thứ đặc xanh mực mỗi vùng: nút theo vai đầu tiên ở thanh tab của trang chung. Bong bóng chat và mục theo vai thứ hai trở đi chỉ viền xanh.
- **Do** ghi rõ trên màn khi tính năng là mẫu ("Dữ liệu mẫu: …", nhãn "Đang phát triển"), và khóa thao tác chưa có kèm lý do thấy được, nối bằng `aria-describedby`.
- **Do** để hộp thoại không chặn trang (như khung chat) có tên, Esc đóng được, đưa focus vào khi mở và trả focus về chỗ đã mở khi đóng.
- **Do** viết chữ giao diện bằng tiếng Việt.

### Don't:
- **Don't** dùng đỏ cho thứ không phải hôm nay, hạn gấp hay lỗi nhập, kể cả khoản chi, khoản bị từ chối, quỹ thiếu hay người chưa đóng.
- **Don't** dùng bóng đổ hay gradient.
- **Don't** chia bảng làm việc thành nhiều thẻ trắng rời có ô số liệu ở góc.
- **Don't** dùng Barlow Condensed cho chữ đơn vị cạnh số.
- **Don't** viết cứng "thủ quỹ" cho người nhận tiền.
- **Don't** dùng kiểu nút khóa (xám) cho trạng thái đang gửi, hay khóa nút mà không nói lý do.
- **Don't** để khung xương lệch bố cục màn thật, hay thay chữ cố định bằng thanh giữ chỗ.
- **Don't** dùng emoji, hay font Inter, Roboto, Arial.
- **Don't** để chuyển động dài hơn 250ms, chạy để trang trí, hay chạy khi máy bật giảm chuyển động, trừ bốn chỗ có tên và có giới hạn: vòng xoay, nhấp nháy của khung xương và thanh đếm giờ (The Time Indicator Exemption); hiệu ứng theo vị trí cuộn của trang đầu (The Scroll Position Exemption); một cảnh 3D ở trang đầu (The Authored Scene Exemption); lớp hiện lần lượt của màn làm việc (The Cascade Layer). Không mở rộng chúng sang thứ khác.
- **Don't** tô đặc xanh mực cho bong bóng chat, hay cho hơn một nút theo vai ở cùng thanh tab. Không đặt bóng đổ dưới bong bóng.
- **Don't** để bong bóng che dòng cuối của màn: màn có bong bóng chừa chỗ ở cuối nội dung.
- **Don't** làm tính năng mẫu trông như đã chạy được (ô gửi mở, tin mẫu không ghi "Dữ liệu mẫu").
- **Don't** làm số tiền chạy hay đếm lên, thêm cảnh 3D thứ hai hay cảnh ngoài trang đầu, hay bắt người dùng ở màn làm việc chờ hiệu ứng.
- **Don't** để hiệu ứng phá luật màu: không bóng, không gradient, không màu mới, không đỏ ngoài hôm nay và việc gấp.
- **Don't** đặt nhãn nhỏ phía trên tiêu đề (như "Lời mời tham gia" trên tên CLB). Nhãn như vậy trong bản vẽ thì bỏ, hoặc đổi thành đầu phần: tiêu đề phần và ghi chú bên phải. Ở trang đầu, người dùng của khối nằm ngay trong tiêu đề.
- **Don't** hiện chữ lấy từ đường dẫn (như lỗi đăng nhập); đổi mã thành câu có sẵn.
- **Don't** lấy màu hay kiểu từ bản vẽ trong `design/screens/` (hệ tím cũ, đã bỏ). Bản vẽ chỉ cho nội dung, chữ và luật. Component thêm bằng `npx shadcn add` dùng biến theme đã nối vào Lịch bloc; không thêm màu riêng cho nó.

## Câu hỏi còn mở

Ba ý sau chưa được quyết. Cần Hiệu đồng ý thì mới thành luật:
- Thêm dòng ngày âm lịch trên tờ lịch hôm nay.
- Mép xé của tập lịch (mép răng cưa ở đầu tờ lịch hoặc tờ giấy).
- Chuyển động lật tờ lịch khi sang ngày hoặc khi đổi trạng thái. (Tờ lịch hạn đã lật xuống lúc hiện ra, xem The Cascade Layer; lúc sang ngày hay đổi trạng thái thì chưa có.)
