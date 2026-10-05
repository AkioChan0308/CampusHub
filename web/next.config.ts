import type { NextConfig } from "next";

// Web gọi API ở cùng địa chỉ (/api/v1/...), Next chuyển tiếp sang máy chủ. Nhờ vậy cookie đăng nhập thuộc địa chỉ của web,
// vẫn chạy trong trình duyệt nằm trong Zalo, Messenger (các trình duyệt này hay chặn cookie của địa chỉ khác).
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
      // Trình duyệt đôi khi vẫn hỏi /favicon.ico dù trang đã khai báo icon.svg: trả luôn icon.svg thay vì lỗi 404.
      { source: "/favicon.ico", destination: "/icon.svg" },
    ];
  },
};

export default nextConfig;
