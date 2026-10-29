// GIỚI THIỆU MẪU của từng CLB trên Cộng đồng (Hiệu chọn 29/10/2026: phần nặng chỉ làm khung mẫu, ghi rõ "đang phát triển").
// Giới thiệu CLB do ban điều hành tự viết và sửa là việc làm sau (chưa có API, chưa có bảng dữ liệu); câu dưới đây do nhóm viết để minh họa.
// Tin của CLB thì đã làm thật (đăng, duyệt trước hiện sau): xem ClubPost trong types.ts và docs/mo-ta-bang-tin-chung.md.

/** Giới thiệu mẫu của từng CLB mẫu; CLB khác (do người dùng tạo) dùng câu chung. */
const ABOUT: Record<string, string> = {
  "cau-long-san-nha": "Chơi cầu lông vui và đều, từ người mới cầm vợt đến người đã chơi lâu. Mỗi buổi có tập kỹ thuật và đánh giao hữu.",
  "vong-lap": "Nhóm cùng tập lập trình qua bài tập và dự án nhỏ. Hợp với bạn muốn học code có bạn đồng hành.",
  "hau-truong": "Làm hậu cần, kịch bản và truyền thông cho sự kiện sinh viên. Bạn thích đứng sau sân khấu thì đây là chỗ của bạn.",
  "gieo-mam": "Đội tình nguyện hoạt động theo đợt vào cuối tuần: dạy học, dọn dẹp, hỗ trợ cộng đồng.",
  "day-nam": "Tập guitar và biểu diễn chung. Có buổi dành riêng cho người mới bắt đầu.",
  "trang-mo": "Đọc chung mỗi tháng một cuốn và trao đổi vào chiều Chủ nhật. Nhỏ, thân mật, ai cũng nói được.",
};

export const sampleAbout = (clubId: string): string =>
  ABOUT[clubId] ?? "CLB chưa viết phần giới thiệu. Ban điều hành sẽ giới thiệu CLB làm gì và ai nên tham gia ở đây.";
