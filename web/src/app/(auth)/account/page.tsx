"use client";

// Đặt hoặc đổi tên tài khoản và mật khẩu (chưa có trong bản vẽ; mô tả Hiệu duyệt ngày 05/10/2026).
// Mở ngay sau lần đầu đăng ký bằng Google (?new=1, có nút "Để sau"), từ "Của tôi", hoặc sau "Quên mật khẩu? Đặt lại bằng Google" (?reset=1).
// Luật tên tài khoản và mật khẩu ở src/lib/account.ts; máy chủ kiểm tra lại trước khi lưu (PUT /me/account).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MeRes, UpdateAccountBody } from "@contract";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, apiPut } from "@/api/client";
import { homeFor, safeNext } from "@/api/after-login";
import { errorText, keys, useMe } from "@/api/queries";
import { ErrorGate, LichLoading } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { displayNameError, passwordError, usernameError } from "@/lib/account";

type Key = "name" | "username" | "currentPassword" | "password" | "confirm";

/** Dòng gợi ý dưới từng ô. Khung xương dùng đúng các dòng này, để thẻ không đổi chiều cao khi dữ liệu về. */
const HINT = {
  name: "Tên mọi người trong CLB thấy.",
  email: "Email Google, không đổi được. Đăng nhập bằng email này cũng được.",
  username: "3–30 ký tự: chữ không dấu, số, dấu chấm, gạch dưới. Không trùng với người khác.",
  password: "Ít nhất 10 ký tự, có chữ hoa, chữ số và ký tự đặc biệt. Không chứa tên tài khoản hay email.",
};
type Errors = Partial<Record<Key, string>>;

export default function AccountPage() {
  return <Suspense fallback={<LichLoading />}><Account /></Suspense>;
}

function Account() {
  const me = useMe();
  const params = useSearchParams();
  const saw = useSawPending(me.isPending);
  const isNew = params.get("new") === "1";
  const reset = params.get("reset") === "1";
  // next là trang đăng nhập (đăng ký từ /register): đi thẳng về trang của mình, không ghé lại trang đăng nhập.
  const raw = safeNext(params.get("next"));
  const next = raw?.startsWith("/login") ? undefined : raw;
  if (me.error) return <ErrorGate error={me.error} onRetry={() => me.refetch()} />;
  const has = me.data?.account.hasPassword;
  // Mở từ "Của tôi": chưa biết đã có mật khẩu chưa thì tiêu đề và câu dưới là thanh giữ chỗ, không đổi chữ khi tải xong.
  const unknown = me.isPending && !isNew && !reset;

  let sub: ReactNode;
  if (isNew) sub = "Bạn vừa đăng ký bằng Google. Đặt thêm tên tài khoản và mật khẩu để lần sau đăng nhập không cần Google.";
  else if (reset) sub = "Bạn vừa đăng nhập bằng Google, nên trong 15 phút tới đặt được mật khẩu mới mà không cần mật khẩu cũ.";
  else if (unknown) sub = <><SkelLine w="95%" /><br /><SkelLine w="60%" /></>;
  else if (has) sub = "Đổi tên tài khoản hoặc mật khẩu thì cần nhập mật khẩu hiện tại.";
  else sub = "Đặt tên tài khoản và mật khẩu để đăng nhập mà không cần Google.";
  let title: ReactNode = has && !isNew ? "Đổi tên tài khoản và mật khẩu" : "Đặt tên tài khoản và mật khẩu";
  if (unknown) title = <SkelLine w={240} />;

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
            <p>{sub}</p>
            {me.data
              ? <Reveal from={saw}><AccountForm me={me.data} isNew={isNew} reset={reset} next={next} /></Reveal>
              : <AccountSkeleton isNew={isNew} />}
          </div>
        </main>
      </div>
    </LichPage>
  );
}

function AccountForm({ me, isNew, reset, next }: { me: MeRes; isNew: boolean; reset: boolean; next?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const had = me.account.hasPassword;
  const [f, setF] = useState(() => ({
    name: me.person.name,
    // Gợi ý tên tài khoản từ phần trước @ của email khi phần đó hợp lệ; người dùng sửa được.
    username: me.account.username ?? (usernameError(me.person.email.split("@")[0]) ? "" : me.person.email.split("@")[0]),
    currentPassword: "", password: "", confirm: "",
  }));
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<string>();
  // Hỏi mật khẩu hiện tại khi đã có mật khẩu, trừ khi vừa đặt lại bằng Google. Máy chủ đòi thì cũng hiện ô này.
  const [askCurrent, setAskCurrent] = useState(had && !reset);
  const [leaving, setLeaving] = useState(false);
  const done = next ?? homeFor(me);
  const set = (k: Key, v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const save = useMutation({
    mutationFn: (body: UpdateAccountBody) => apiPut<MeRes>("/me/account", body),
    onSuccess: (res) => {
      setLeaving(true); // giữ vòng xoay trên nút tới khi trang tiếp theo mở
      client.setQueryData(keys.me, res);
      toast.success(had ? "Đã đổi tên tài khoản và mật khẩu." : "Đã lưu. Lần sau bạn đăng nhập được bằng tên tài khoản và mật khẩu.");
      router.replace(next ?? homeFor(res));
    },
    onError: (e) => {
      const fields = e instanceof ApiError ? (e.details?.fields as Errors | undefined) : undefined;
      if (fields) {
        if (fields.currentPassword) setAskCurrent(true);
        setErrors(fields);
        setAlert(undefined);
        focusFirst(fields);
      } else {
        setAlert(errorText(e));
      }
    },
  });
  const busy = save.isPending || leaving;

  function focusFirst(errs: Errors) {
    const first = (["name", "username", "currentPassword", "password", "confirm"] as Key[]).find((k) => errs[k]);
    if (first) requestAnimationFrame(() => document.getElementById(`account-${first}`)?.focus());
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Errors = {
      name: displayNameError(f.name),
      username: usernameError(f.username),
      currentPassword: askCurrent && !f.currentPassword ? "Cần nhập mật khẩu hiện tại." : undefined,
      password: passwordError(f.password, { username: f.username, email: me.person.email }),
      confirm: f.confirm !== f.password ? "Hai lần nhập mật khẩu chưa giống nhau." : undefined,
    };
    setErrors(errs);
    setAlert(undefined);
    if (Object.values(errs).some(Boolean)) return focusFirst(errs);
    save.mutate({
      name: f.name.trim(), username: f.username.trim(), password: f.password,
      ...(askCurrent ? { currentPassword: f.currentPassword } : {}),
    });
  }

  // Ô mật khẩu giữ dòng luật dưới câu báo lỗi, để người dùng vẫn thấy đủ các luật khi sai một luật.
  const keepHint = (k: Key) => k === "password";
  const field = (k: Key, label: string, input: ReactNode, hint?: string) => (
    <div className="l-field">
      <label className="l-flabel" htmlFor={`account-${k}`}>{label}</label>
      {input}
      {errors[k] && <span id={`account-${k}-error`} className="l-error">{errors[k]}</span>}
      {hint && (!errors[k] || keepHint(k)) && <span id={`account-${k}-hint`} className="l-hint">{hint}</span>}
    </div>
  );
  const aria = (k: Key, hint = false) => ({
    id: `account-${k}`,
    className: "l-input",
    value: f[k],
    onChange: (e: { target: { value: string } }) => set(k, e.target.value),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": [errors[k] && `account-${k}-error`, hint && (!errors[k] || keepHint(k)) && `account-${k}-hint`].filter(Boolean).join(" ") || undefined,
  });
  const pw = show ? "text" : "password";

  return (
    <form className="l-form" onSubmit={submit} noValidate>
      {field("name", "Tên hiển thị", <input {...aria("name", true)} autoComplete="name" />, HINT.name)}
      <div className="l-field">
        <label className="l-flabel" htmlFor="account-email">Email</label>
        <input id="account-email" className="l-input" value={me.person.email} readOnly aria-describedby="account-email-hint" />
        <span id="account-email-hint" className="l-hint">{HINT.email}</span>
      </div>
      {field("username", "Tên tài khoản",
        <input {...aria("username", true)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />,
        HINT.username)}
      {askCurrent && field("currentPassword", "Mật khẩu hiện tại", <input {...aria("currentPassword")} type={pw} autoComplete="current-password" />)}
      {field("password", had ? "Mật khẩu mới" : "Mật khẩu",
        <input {...aria("password", true)} type={pw} autoComplete="new-password" />,
        HINT.password)}
      {field("confirm", "Nhập lại mật khẩu", <input {...aria("confirm")} type={pw} autoComplete="new-password" />)}
      <label className="l-check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />Hiện mật khẩu</label>
      {alert && <p className="l-alert" role="alert">{alert}</p>}
      <div className="l-login-actions">
        <button type="submit" className="l-btn l-lg" aria-busy={busy || undefined}>Lưu</button>
        <Link className="l-btn2 l-lg" href={done} replace={isNew}>{isNew ? "Để sau" : "Hủy"}</Link>
      </div>
    </form>
  );
}

/**
 * Khung xương: tên ô và dòng gợi ý cố định là chữ thật, ô nhập (cao 40px như .l-input) và nút là thanh giữ chỗ.
 * Tên ô mật khẩu tùy người đó đã có mật khẩu chưa ("Mật khẩu" hay "Mật khẩu mới"), nên chỉ viết sẵn khi chắc là người
 * mới đăng ký; còn lại là thanh giữ chỗ. Ô "Mật khẩu hiện tại" chỉ biết sau khi tải xong.
 */
function AccountSkeleton({ isNew }: { isNew: boolean }) {
  const rows: [string, string?][] = [
    ["Tên hiển thị", HINT.name], ["Email", HINT.email], ["Tên tài khoản", HINT.username],
    [isNew ? "Mật khẩu" : "", HINT.password], ["Nhập lại mật khẩu"],
  ];
  return (
    <Loading className="l-form">
      {rows.map(([t, hint], i) => (
        <div key={i} className="l-field">
          <span className="l-flabel">{t || <SkelLine w={110} />}</span>
          <Skel w="100%" h={40} />
          {hint && <span className="l-hint">{hint}</span>}
        </div>
      ))}
      <span className="l-check" aria-hidden="true"><Skel w={18} h={18} />Hiện mật khẩu</span>
      <div className="l-login-actions"><Skel w="100%" h={48} /><Skel w="100%" h={48} /></div>
    </Loading>
  );
}
