"use client";

// Trang đăng ký: chỉ bằng Google (chưa có trong bản vẽ; mô tả Hiệu duyệt ngày 05/10/2026). Nội dung ở (auth)/login/auth-screen.tsx.

import { Suspense } from "react";
import { LichLoading } from "@/components/lich/Gate";
import { AuthScreen } from "../login/auth-screen";

export default function RegisterPage() {
  return <Suspense fallback={<LichLoading />}><AuthScreen mode="register" /></Suspense>;
}
