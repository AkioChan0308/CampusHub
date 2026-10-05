"use client";

// Trang đăng nhập (chưa có trong bản vẽ; ghi ở web/README.md mục "Chỗ code khác bản vẽ").
// Đăng nhập bằng Google qua máy chủ (GET /auth/google/start). Bản demo còn lối vào trang chọn vai.

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { homeFor, safeNext } from "@/api/home";
import { useHealth, useMe } from "@/api/queries";
import { LichLoading, signOutDone, useLogout } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, Loading, Reveal, Skel, useSawPending } from "@/components/lich/motion";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  return <Suspense fallback={<LichLoading />}><Login /></Suspense>;
}

function Login() {
  const params = useSearchParams();
  const router = useRouter();
  const health = useHealth();
  const me = useMe();
  const { logout, pending: leaving } = useLogout();
  const { choosePersona } = useStore();
  const [toGoogle, setToGoogle] = useState(false);
  const client = useQueryClient();
  useEffect(() => signOutDone(client), [client]);
  const error = params.get("loi");
  const next = safeNext(params.get("next"));
  // Vừa đăng nhập Google xong (máy chủ đưa về /login?xong=1) hoặc đang có trang cần mở lại: đi tiếp luôn.
  const goOn = next !== undefined || params.get("xong") === "1";
  // Chưa biết đã đăng nhập chưa, hoặc máy chủ có nút Google không: khung xương giữ chỗ cho câu và hai nút.
  const pending = me.isPending || health.isPending;
  const saw = useSawPending(pending);

  useEffect(() => {
    if (!me.data) return;
    choosePersona(me.data.person.id); // các màn chưa nối máy chủ đọc vai từ trình duyệt
    if (goOn) router.replace(next ?? homeFor(me.data));
  }, [me.data, goOn, next, router, choosePersona]);

  const googleHref = `/api/v1/auth/google/start?next=${encodeURIComponent(next ?? "/login?xong=1")}`;
  const serverDown = health.isError;

  let body;
  if (pending) {
    body = (
      <Loading className="l-login-body">
        <span className="l-field"><Skel w="100%" h={15} /><Skel w="92%" h={15} /><Skel w="48%" h={15} /></span>
        <div className="l-login-actions"><Skel w="100%" h={48} /><Skel w="100%" h={48} /></div>
      </Loading>
    );
  } else if (me.data && !goOn) {
    body = (
      <Reveal from={saw} className="l-login-body">
        <p>Bạn đang đăng nhập với tên <strong>{me.data.person.name}</strong> ({me.data.person.email}).</p>
        <div className="l-login-actions">
          <Link className="l-btn l-lg" href={homeFor(me.data)}>Tiếp tục</Link>
          <button type="button" className="l-btn2 l-lg" aria-busy={leaving || undefined} onClick={() => logout()}>Đăng xuất</button>
        </div>
      </Reveal>
    );
  } else if (me.data) {
    body = <p className="l-login-body" role="status">Đang mở trang của bạn…</p>;
  } else {
    body = (
      <Reveal from={saw} className="l-login-body">
        <p>Dùng tài khoản Google có email mà CLB đã dùng để mời bạn. Chưa ở CLB nào thì đăng nhập rồi tìm CLB để gửi đơn.</p>
        <div className="l-login-actions">
          {health.data?.googleLogin
            ? <a className="l-btn l-lg" href={googleHref} aria-busy={toGoogle || undefined} onClick={() => setToGoogle(true)}>Đăng nhập bằng Google</a>
            : health.data && <p className="l-note">Đăng nhập Google chưa mở. Báo ban điều hành CLB.</p>}
          {health.data?.authMode === "demo" && <Link className="l-btn2 l-lg" href="/">Chọn vai có sẵn (bản demo)</Link>}
        </div>
      </Reveal>
    );
  }

  return (
    <LichPage>
      <div className="lich">
        <main className="l-login">
          <div className="l-login-card">
            <div className="l-brand"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></div>
            <div className="l-login-head">
              <TodayLeaf />
              <h1>Đăng nhập</h1>
            </div>
            {error && <p className="l-alert" role="alert">{error}</p>}
            {serverDown && <p className="l-alert" role="alert">Máy chủ CampusHub chưa chạy hoặc đang lỗi. Thử lại sau.</p>}
            {body}
          </div>
        </main>
      </div>
    </LichPage>
  );
}
