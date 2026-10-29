// DỮ LIỆU MẪU của trang chung (Hiệu chọn 29/10/2026: phần nặng chỉ làm khung mẫu, ghi rõ "đang phát triển").
// Chưa có API, chưa có bảng dữ liệu: tin, giới thiệu CLB và lối liên hệ dưới đây do nhóm tự viết để minh họa, ngày tính theo hôm nay
// nên danh sách luôn trông mới. Làm thật thì thay file này bằng GET /feed (xem docs/mo-ta-bang-tin-chung.md, mục 5).

export type PostKind = "event" | "promo" | "news";

export const POST_KIND_LABEL: Record<PostKind, string> = { event: "Sự kiện", promo: "Quảng bá", news: "Tin tức" };

export interface SamplePost {
  id: string;
  clubId: string;
  clubName: string;
  kind: PostKind;
  title: string;
  body: string;
  postedAt: number;
  /** Sự kiện: ngày giờ diễn ra và nơi diễn ra. */
  eventAt?: number;
  place?: string;
}

const DAY = 86_400_000;

/** Tin mẫu, mới nhất trước. `now` để test cố định ngày. */
export function samplePosts(now: number = Date.now()): SamplePost[] {
  const posts: SamplePost[] = [
    {
      id: "giai-noi-bo", clubId: "cau-long-san-nha", clubName: "CLB Cầu lông Sân Nhà", kind: "event",
      title: "Giải cầu lông nội bộ Fall 2026",
      body: "Giải giao hữu mở cho thành viên và khách mời. Thi đấu đôi, xếp cặp ngay tại buổi sinh hoạt. Mang theo vợt của bạn.",
      postedAt: now - DAY, eventAt: now + 3 * DAY, place: "[sân sinh hoạt]",
    },
    {
      id: "tuyen-spring", clubId: "vong-lap", clubName: "CLB Lập trình Vòng Lặp", kind: "promo",
      title: "Tuyển thành viên kỳ Spring 2027",
      body: "Vòng Lặp mở đơn cho bạn nào muốn tập code cùng nhóm. Không cần biết lập trình từ trước, buổi đầu cả CLB làm bài cùng nhau.",
      postedAt: now - 2 * DAY,
    },
    {
      id: "hau-can", clubId: "hau-truong", clubName: "CLB Sự kiện Hậu Trường", kind: "promo",
      title: "Cần thêm bạn hỗ trợ hậu cần cho sự kiện các CLB",
      body: "Hậu Trường tìm CLB muốn cùng tổ chức sự kiện chung và bạn muốn thử sức làm hậu cần. Nhắn cho CLB để hẹn trao đổi.",
      postedAt: now - 3 * DAY,
    },
    {
      id: "tong-ket-tinh-nguyen", clubId: "gieo-mam", clubName: "Đội Tình nguyện Gieo Mầm", kind: "news",
      title: "Tổng kết đợt tình nguyện cuối tuần",
      body: "Cảm ơn các bạn đã tham gia đợt tình nguyện vừa rồi. Đội sẽ gửi tổng kết hoạt động và thông báo đợt tiếp theo trong tuần này.",
      postedAt: now - 4 * DAY,
    },
    {
      id: "dem-nhac", clubId: "day-nam", clubName: "CLB Guitar Dây Năm", kind: "event",
      title: "Đêm nhạc cuối kỳ",
      body: "Buổi biểu diễn cuối kỳ của các thành viên Dây Năm, mở cho mọi người đến nghe. Bạn nào muốn lên sân khấu thì nhắn cho CLB.",
      postedAt: now - 5 * DAY, eventAt: now + 9 * DAY, place: "[phòng sinh hoạt]",
    },
    {
      id: "sach-thang", clubId: "trang-mo", clubName: "CLB Đọc sách Trang Mở", kind: "news",
      title: "Sách của tháng này",
      body: "Tháng này Trang Mở đọc chung một cuốn và trao đổi vào chiều Chủ nhật. Ai muốn mượn sách của CLB thì đến sớm buổi sinh hoạt.",
      postedAt: now - 6 * DAY,
    },
  ];
  return posts.sort((a, b) => b.postedAt - a.postedAt);
}

export const samplePost = (id: string, now?: number) => samplePosts(now).find((p) => p.id === id);

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
