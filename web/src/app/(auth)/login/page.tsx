"use client";

// Trang đăng nhập (chưa có trong bản vẽ; ghi ở web/README.md mục "Chỗ code khác bản vẽ"). Nội dung ở auth-screen.tsx.

import { Suspense } from "react";
import { LichLoading } from "@/components/lich/Gate";
import { AuthScreen } from "./auth-screen";

export default function LoginPage() {
  return <Suspense fallback={<LichLoading />}><AuthScreen mode="login" /></Suspense>;
}
