import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/browser-state";
import "./globals.css";
import "./lich.css";

// Chữ của Lịch bloc (lich.css). Lúc font đang tải thì dùng Segoe UI và font hệ thống, không để next/font tự tạo font dự phòng từ Arial.
// Mã chuyển khoản dùng JetBrains Mono.
const mono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], weight: ["500"], variable: "--font-jetbrains", display: "swap", adjustFontFallback: false, fallback: ["Consolas", "monospace"] });
// Chữ thường Barlow, số ngày và số đếm Barlow Condensed như số trên tờ lịch.
const lichBody = Barlow({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"], variable: "--font-barlow", display: "swap", adjustFontFallback: false, fallback: ["Segoe UI", "system-ui", "sans-serif"] });
const lichNum = Barlow_Condensed({ subsets: ["latin", "vietnamese"], weight: ["600", "700"], variable: "--font-barlow-condensed", display: "swap", adjustFontFallback: false, fallback: ["Segoe UI", "sans-serif"] });

export const metadata: Metadata = {
  title: { default: "CampusHub · bản demo", template: "%s · CampusHub" },
  description: "Bản demo CampusHub: quản lý thành viên, điểm danh, sổ quỹ và bàn giao cho CLB sinh viên. Dữ liệu là dữ liệu mẫu.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${mono.variable} ${lichBody.variable} ${lichNum.variable}`}>
      <body>
        <noscript>Trang cần bật JavaScript.</noscript>
        <MotionProvider>
          <Providers>
            <StoreProvider>{children}</StoreProvider>
          </Providers>
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
