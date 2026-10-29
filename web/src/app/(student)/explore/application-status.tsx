// Nhãn quan hệ của sinh viên với một CLB, dùng ở danh sách CLB và trang CLB. Nghĩa màu theo design/README.md mục 6;
// đơn bị từ chối và CLB tạm ngưng dùng nhãn trung tính (Lịch bloc: đỏ chỉ dành cho hôm nay và hạn gấp).

import type { ClubCardDto } from "@contract";

export function ClubTag({ club }: { club: ClubCardDto }) {
  switch (club.my.status) {
    case "member": return <span className="l-tag ok">Bạn đang ở CLB này</span>;
    case "invited": return <span className="l-tag off">Chưa nhận lời mời</span>;
    case "applied": return <span className="l-tag wait">Đã gửi đơn</span>;
    case "rejected": return <span className="l-tag off">Đơn bị từ chối</span>;
    case "none": return club.acceptingApplications ? <span className="l-tag ok">Đang nhận đơn</span> : <span className="l-tag off">Tạm ngưng nhận đơn</span>;
  }
}
