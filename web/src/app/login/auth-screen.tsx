"use client";

// Khung chung của trang Đăng nhập (/login) và Đăng ký (/register). Chưa có trong bản vẽ; mô tả Hiệu duyệt ngày 05/10/2026.
// Đăng nhập: tên tài khoản (hoặc email) và mật khẩu, hoặc Google. Quên mật khẩu: đăng nhập Google rồi đặt mật khẩu mới.
// Đăng ký: chỉ bằng Google (email đã được Google xác minh); lần đầu xong, máy chủ đưa sang /account để đặt mật khẩu.
// Bản demo: dưới ô đăng nhập là tài khoản mẫu của từng vai và nút đặt lại dữ liệu mẫu (thay trang chọn vai, Hiệu duyệt 05/10/2026).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoginErrorCode, MeRes, PasswordLoginBody } from "@contract";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError, apiPost } from "@/api/client";
import { homeFor, safeNext } from "@/api/home";
import { errorText, keys, useHealth, useMe } from "@/api/queries";
import { LichConfirm } from "@/components/lich/Confirm";
import { signOutDone, useLogout } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, Loading, Reveal, Skel, useSawPending } from "@/components/lich/motion";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { useStore } from "@/lib/store";

type Mode = "login" | "register";

/** Câu cho từng mã lỗi máy chủ gửi về (`/login?loi=<mã>`). Mã lạ thì hiện câu chung: không hiện chữ lấy từ link. */
const LOGIN_ERRORS: Record<LoginErrorCode, string> = {
  "google-chua-bat": "Máy chủ chưa bật đăng nhập Google.",
  huy: "Bạn đã hủy đăng nhập Google.",
  "het-han": "Lượt đăng nhập đã hết hạn. Bạn bấm đăng nhập lại.",
  "google-loi": "Không đăng nhập được bằng Google. Bạn thử lại.",
  "email-chua-xac-minh": "Google chưa xác nhận email của tài khoản này.",
};
const loginError = (code: string | null) =>
  code === null ? undefined : (LOGIN_ERRORS[code as LoginErrorCode] ?? "Đăng nhập chưa xong. Bạn thử lại.");

/** Link bắt đầu đăng nhập Google; xong thì máy chủ đưa về `next`. */
const googleHref = (next: string) => `/api/v1/auth/google/start?next=${encodeURIComponent(next)}`;
/** Giữ trang cần mở khi chuyển qua lại giữa Đăng nhập và Đăng ký. */
const withNext = (path: string, next: string | undefined) => (next ? `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}` : path);

export function AuthScreen({ mode }: { mode: Mode }) {
  const params = useSearchParams();
  const router = useRouter();
  const health = useHealth();
  const me = useMe();
  const { logout, pending: leaving } = useLogout();
  const { choosePersona } = useStore();
  const client = useQueryClient();
  useEffect(() => signOutDone(client), [client]);
  const error = loginError(params.get("loi"));
  const next = safeNext(params.get("next"));
  // Vừa đăng nhập Google xong (máy chủ đưa về /login?xong=1) hoặc đang có trang cần mở lại: đi tiếp luôn.
  const goOn = next !== undefined || params.get("xong") === "1";
  // Đăng nhập bằng mật khẩu xong: giữ form với vòng xoay trên nút tới khi trang mới mở, không hiện câu "đang đăng nhập" xen giữa.
  const [signedIn, setSignedIn] = useState(false);
  // Tài khoản mẫu vừa bấm (bản demo): n tăng mỗi lần bấm để bấm lại cùng một dòng vẫn điền lại.
  const [picked, setPicked] = useState<{ username: string; n: number }>();
  const pending = me.isPending || health.isPending;
  const saw = useSawPending(pending);

  useEffect(() => {
    if (!me.data) return;
    choosePersona(me.data.person.id); // các màn chưa nối máy chủ đọc vai từ trình duyệt
    if (goOn && !signedIn) router.replace(next ?? homeFor(me.data));
  }, [me.data, goOn, next, router, choosePersona, signedIn]);

  function onSignedIn(res: MeRes) {
    setSignedIn(true);
    client.setQueryData(keys.me, res);
    router.replace(next ?? homeFor(res));
  }

  const google = health.data?.googleLogin;
  const demo = health.data?.authMode === "demo";
  const title = mode === "login" ? "Đăng nhập" : "Đăng ký";

  let body;
  if (pending) {
    body = mode === "login" ? <LoginSkeleton /> : <RegisterSkeleton />;
  } else if (me.data && !goOn && !signedIn) {
    body = (
      <Reveal from={saw} className="l-login-body">
        <p>Bạn đang đăng nhập với tên <strong>{me.data.person.name}</strong> ({me.data.person.email}).</p>
        <div className="l-login-actions">
          <Link className="l-btn l-lg" href={homeFor(me.data)}>Tiếp tục</Link>
          <button type="button" className="l-btn2 l-lg" aria-busy={leaving || undefined} onClick={() => logout()}>Đăng xuất</button>
        </div>
      </Reveal>
    );
  } else if (me.data && !signedIn) {
    body = <p className="l-login-body" role="status">Đang mở trang của bạn…</p>;
  } else if (mode === "login") {
    body = (
      <Reveal from={saw} className="l-login-body">
        <PasswordForm onSignedIn={onSignedIn} picked={picked} />
        {google && (
          <>
            <p className="l-auth-or">hoặc</p>
            <div className="l-login-actions">
              <GoogleButton className="l-btn2 l-lg" href={googleHref(next ?? "/login?xong=1")}>Đăng nhập bằng Google</GoogleButton>
              <p className="l-auth-help">Quên mật khẩu? <a href={googleHref(withNext("/account?datlai=1", next))}>Đặt lại bằng Google</a></p>
            </div>
          </>
        )}
        {demo && <DemoAccounts onPick={(username) => setPicked((p) => ({ username, n: (p?.n ?? 0) + 1 }))} />}
        <div className="l-auth-foot">
          <p>Chưa có tài khoản? <Link href={withNext("/register", next)}>Đăng ký bằng Google</Link></p>
        </div>
      </Reveal>
    );
  } else {
    body = (
      <Reveal from={saw} className="l-login-body">
        <p>CampusHub dùng tài khoản Google để biết email của bạn là thật. Đăng ký xong, bạn đặt tên tài khoản và mật khẩu để lần sau đăng nhập không cần Google.</p>
        <p className="l-note">Nếu CLB đã mời bạn, dùng đúng email trong lời mời.</p>
        <div className="l-login-actions">
          {google
            ? <GoogleButton className="l-btn l-lg" href={googleHref(next ?? "/login?xong=1")}>Đăng ký bằng Google</GoogleButton>
            : <p className="l-note">Đăng ký bằng Google chưa mở. Báo ban điều hành CLB.</p>}
        </div>
        <div className="l-auth-foot">
          <p>Đã có tài khoản? <Link href={withNext("/login", next)}>Đăng nhập</Link></p>
          {demo && <Link href={withNext("/login", next)}>Bản demo: đăng nhập bằng tài khoản mẫu</Link>}
        </div>
      </Reveal>
    );
  }

  return (
    <LichPage>
      <div className="lich">
        <main className="l-login">
          <div className="l-login-card">
            <Link className="l-brand" href="/"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></Link>
            <div className="l-login-head">
              <TodayLeaf />
              <h1>{title}</h1>
            </div>
            {error && <p className="l-alert" role="alert">{error}</p>}
            {health.isError && <p className="l-alert" role="alert">Máy chủ CampusHub chưa chạy hoặc đang lỗi. Thử lại sau.</p>}
            {body}
          </div>
        </main>
      </div>
    </LichPage>
  );
}

/** Nút sang Google: bấm rồi thì hiện vòng xoay tới khi trang Google mở. */
function GoogleButton({ href, className, children }: { href: string; className: string; children: string }) {
  const [going, setGoing] = useState(false);
  return <a className={className} href={href} aria-busy={going || undefined} onClick={() => setGoing(true)}>{children}</a>;
}

/**
 * Tên tài khoản hoặc email, và mật khẩu. Máy chủ báo chung một câu khi sai, và khóa 15 phút sau 5 lần sai.
 * picked (bản demo): người thử vừa bấm một tài khoản mẫu thì điền sẵn hai ô và đưa focus tới nút Đăng nhập.
 */
function PasswordForm({ onSignedIn, picked }: { onSignedIn: (res: MeRes) => void; picked?: { username: string; n: number } }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ login?: string; password?: string; form?: string }>({});
  const [done, setDone] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!picked) return;
    setLogin(picked.username);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    submitRef.current?.focus();
  }, [picked]);
  const signIn = useMutation({
    mutationFn: (body: PasswordLoginBody) => apiPost<MeRes>("/auth/login", body),
    onSuccess: (res) => { setDone(true); onSignedIn(res); },
    onError: (e) => { setErrors({ form: errorText(e) }); setPassword(""); document.getElementById("dn-mat-khau")?.focus(); },
  });
  const busy = signIn.isPending || done;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next = {
      login: login.trim() ? undefined : "Cần nhập tên tài khoản hoặc email.",
      password: password ? undefined : "Cần nhập mật khẩu.",
    };
    setErrors(next);
    if (next.login) return document.getElementById("dn-ten")?.focus();
    if (next.password) return document.getElementById("dn-mat-khau")?.focus();
    signIn.mutate({ login: login.trim(), password });
  }

  return (
    <form className="l-form" onSubmit={submit} noValidate>
      <div className="l-field">
        <label className="l-flabel" htmlFor="dn-ten">Tên tài khoản hoặc email</label>
        <input id="dn-ten" className="l-input" value={login} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email"
          onChange={(e) => { setLogin(e.target.value); setErrors((x) => ({ ...x, login: undefined })); }}
          aria-invalid={errors.login ? true : undefined} aria-describedby={errors.login ? "dn-ten-loi" : undefined} />
        {errors.login && <span id="dn-ten-loi" className="l-error">{errors.login}</span>}
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="dn-mat-khau">Mật khẩu</label>
        <input id="dn-mat-khau" className="l-input" type={show ? "text" : "password"} value={password} autoComplete="current-password"
          onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }}
          aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? "dn-mat-khau-loi" : undefined} />
        {errors.password && <span id="dn-mat-khau-loi" className="l-error">{errors.password}</span>}
      </div>
      <label className="l-check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />Hiện mật khẩu</label>
      {errors.form && <p className="l-alert" role="alert">{errors.form}</p>}
      <button ref={submitRef} type="submit" className="l-btn l-lg" aria-busy={busy || undefined}>Đăng nhập</button>
    </form>
  );
}

/**
 * Chỉ ở bản demo: tài khoản mẫu của từng vai (web/src/lib/demo-accounts.ts; máy chủ tự tạo). Bấm một dòng là điền sẵn
 * ô đăng nhập. Dưới cùng là nút đặt lại dữ liệu mẫu (máy chủ tạo lại cả các tài khoản này). Lên bản thật thì bỏ phần này.
 */
function DemoAccounts({ onPick }: { onPick: (username: string) => void }) {
  const client = useQueryClient();
  const { reset } = useStore();
  const [resetting, setResetting] = useState(false);
  async function resetAll() {
    setResetting(true);
    try {
      await apiPost("/demo/reset");
      client.clear();
      reset();
      toast.success("Đã đặt lại dữ liệu mẫu và tài khoản mẫu.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Chưa đặt lại được dữ liệu. Thử lại sau.");
    } finally {
      setResetting(false);
    }
  }
  return (
    <section className="l-auth-demo" aria-labelledby="tk-mau">
      <h2 id="tk-mau">Tài khoản mẫu (bản demo)</h2>
      <p className="l-note">Bấm một vai để điền sẵn tên tài khoản và mật khẩu, rồi bấm Đăng nhập.</p>
      <ul className="l-auth-picks">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.username}>
            <button type="button" className="l-auth-pick" onClick={() => onPick(a.username)}>
              <strong>{a.role}</strong>
              <span className="l-auth-cred"><span className="l-sr">Tên tài khoản </span>{a.username}<span aria-hidden="true"> · </span><span className="l-sr">, mật khẩu </span>{DEMO_PASSWORD}</span>
            </button>
          </li>
        ))}
      </ul>
      <div>
        <LichConfirm className="l-btn2" busy={resetting} title="Đặt lại dữ liệu mẫu?" description="Xóa mọi thay đổi đã làm, kể cả mật khẩu đã đổi, và quay về dữ liệu mẫu ban đầu." confirm="Đặt lại"
          onConfirm={resetAll}>
          Đặt lại dữ liệu mẫu
        </LichConfirm>
      </div>
    </section>
  );
}

/** Khung xương: tên ô và chữ cố định là thật; chỉ ô nhập và nút (chưa biết máy chủ có bật Google không) là thanh giữ chỗ. */
function LoginSkeleton() {
  return (
    <Loading className="l-login-body">
      <div className="l-form">
        <div className="l-field"><span className="l-flabel">Tên tài khoản hoặc email</span><Skel w="100%" h={40} /></div>
        <div className="l-field"><span className="l-flabel">Mật khẩu</span><Skel w="100%" h={40} /></div>
        <span className="l-check" aria-hidden="true"><Skel w={18} h={18} />Hiện mật khẩu</span>
        <Skel w="100%" h={48} />
      </div>
    </Loading>
  );
}

function RegisterSkeleton() {
  return (
    <Loading className="l-login-body">
      <p>CampusHub dùng tài khoản Google để biết email của bạn là thật. Đăng ký xong, bạn đặt tên tài khoản và mật khẩu để lần sau đăng nhập không cần Google.</p>
      <p className="l-note">Nếu CLB đã mời bạn, dùng đúng email trong lời mời.</p>
      <div className="l-login-actions"><Skel w="100%" h={48} /></div>
    </Loading>
  );
}
