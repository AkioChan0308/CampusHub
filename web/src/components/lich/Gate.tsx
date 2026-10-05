"use client";

// Trang chặn, đang tải và lỗi API trong thế giới "Lịch bloc".

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, apiPost, setTabDemoUser } from "@/api/client";
import { keys, useHealth } from "@/api/queries";
import { useStore } from "@/lib/store";
import { TodayLeaf } from "./Leaf";
import { Loading, Skel } from "./motion";

// Đăng xuất xong mới xóa dữ liệu đã lưu tạm, khi trang đăng nhập đã mở (signOutDone). Xóa sớm thì trang đang mở
// tự tải lại, nhận 401 và chớp trang "Bạn cần đăng nhập" trước khi sang trang đăng nhập.
let signingOut = false;

/** Gọi ở trang đăng nhập: nếu vừa đăng xuất thì xóa hết dữ liệu của người cũ còn trong bộ nhớ. */
export function signOutDone(client: QueryClient) {
  if (!signingOut) return;
  signingOut = false;
  client.clear();
}

/** Câu báo khi bấm phần bản demo chưa làm. */
export const NOT_IN_MVP = "Bản demo chưa có phần này";

/** Đăng xuất: xóa phiên ở máy chủ và vai của bản demo, về trang đăng nhập, rồi xóa dữ liệu đã lưu tạm.
 *  pending: đang chờ máy chủ, để nút hiện vòng xoay và không bấm hai lần.
 *  logout(next): đăng nhập lại xong thì mở trang `next` (ví dụ link mời đang xem). */
export function useLogout() {
  const client = useQueryClient();
  const router = useRouter();
  const { choosePersona } = useStore();
  const [pending, setPending] = useState(false);
  async function logout(next?: string) {
    if (pending) return;
    setPending(true);
    try {
      await apiPost("/auth/logout");
    } catch (e) {
      setPending(false);
      toast.error(e instanceof ApiError ? e.message : "Chưa đăng xuất được. Thử lại sau.");
      return;
    }
    setTabDemoUser(null);
    client.removeQueries({ queryKey: keys.me }); // trang đăng nhập không hiện "Bạn đang đăng nhập với tên…" của người cũ
    choosePersona(null);
    signingOut = true;
    router.replace(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return { logout, pending };
}

/** Bản demo còn trang chọn vai; bản đăng nhập Google thì không. */
export function useDemoMode(): boolean {
  return useHealth().data?.authMode === "demo";
}

/** Cả trang đang tải hoặc đang chuyển đi: một tờ giấy giữ chỗ ở giữa màn, không có chữ "Đang tải…" to giữa nền trống. */
export function LichLoading({ text = "Đang tải…" }: { text?: string }) {
  return (
    <div className="lich">
      <Loading className="l-loading" label={text}>
        <span className="l-loading-card" aria-hidden="true">
          <Skel w={112} h={128} className="l-skel-leaf" />
          <span className="l-loading-lines"><Skel w="70%" h={22} /><Skel w="90%" /><Skel w="55%" /></span>
        </span>
      </Loading>
    </div>
  );
}

/** Trang chặn mở bằng tờ lịch hôm nay như mọi màn. inline: nằm trong vùng nội dung của khung (đầu trang đã có tờ lịch),
 *  chỉ phần dữ liệu của màn bị lỗi. Nút đầu tiên trong children là lối ra chính. */
export function LichGate({ title, text, inline = false, children }: { title: string; text: string; inline?: boolean; children?: ReactNode }) {
  const actions = children && <div className="l-gate-actions">{children}</div>;
  if (inline) return <section className="l-gate inline"><h1>{title}</h1><p>{text}</p>{actions}</section>;
  return (
    <div className="lich">
      <main className="l-gate">
        <div className="l-gate-head">
          <TodayLeaf />
          <h1>{title}</h1>
        </div>
        <p>{text}</p>
        {actions}
      </main>
    </div>
  );
}

/** Trang đang mở, kèm phần sau dấu "?" (ví dụ ?e=&t= của link QR điểm danh), để đăng nhập xong quay lại đúng chỗ. */
const here = () => window.location.pathname + window.location.search;

/** Lỗi khi tải dữ liệu của màn. Chưa đăng nhập thì chuyển sang trang đăng nhập, xong quay lại đúng trang này. */
export function ErrorGate({ error, onRetry, inline = false, back }: {
  error: unknown; onRetry: () => void; inline?: boolean;
  /** Lối về khi không tìm thấy hoặc không xem được, thay cho trang chọn vai, trang của tôi. Ví dụ "Về trang chủ CLB". */
  back?: { href: string; label: string };
}) {
  const router = useRouter();
  const demo = useDemoMode();
  const { logout, pending: leaving } = useLogout();
  const status = error instanceof ApiError ? error.status : 0;

  useEffect(() => {
    if (status === 401) router.replace(`/login?next=${encodeURIComponent(here())}`);
  }, [status, router]);

  if (status === 401) return inline ? <p className="l-empty" role="status">Bạn cần đăng nhập. Đang chuyển tới trang đăng nhập…</p> : <LichLoading text="Bạn cần đăng nhập. Đang chuyển tới trang đăng nhập…" />;

  const message = error instanceof ApiError ? error.message : "Có lỗi khi tải trang. Thử lại sau.";
  if (status === 0 || status >= 500) {
    return (
      <LichGate inline={inline} title="Chưa tải được trang" text={message}>
        <button type="button" className="l-btn" onClick={onRetry}>Thử lại</button>
      </LichGate>
    );
  }

  // Lối về: trang chọn vai ở bản demo, trang của tôi ở bản thật. Là nút chính khi không có việc nào hợp hơn.
  const home = (cls: string) => back ? <Link className={cls} href={back.href}>{back.label}</Link>
    : demo ? <Link className={cls} href="/">Chọn vai khác (bản demo)</Link> : <Link className={cls} href="/me">Về trang của tôi</Link>;
  const other = <button type="button" className="l-btn2" aria-busy={leaving || undefined} onClick={() => logout(here())}>Đăng nhập tài khoản khác</button>;

  if (error instanceof ApiError && error.code === "NOT_MEMBER") {
    return <LichGate inline={inline} title="Bạn chưa ở CLB này" text={message}><Link className="l-btn" href="/explore">Tìm CLB và gửi đơn</Link>{home("l-btn2")}</LichGate>;
  }
  if (error instanceof ApiError && error.code === "INVITE_PENDING" && typeof error.details?.inviteCode === "string") {
    return <LichGate inline={inline} title="Bạn chưa nhận lời mời" text={message}><Link className="l-btn" href={`/invite/${error.details.inviteCode}`}>Xem lời mời</Link>{home("l-btn2")}</LichGate>;
  }
  if (status === 404) return <LichGate inline={inline} title="Không tìm thấy trang này" text={message}>{home("l-btn")}</LichGate>;
  return <LichGate inline={inline} title="Bạn không xem được trang này" text={message}>{home("l-btn")}{other}</LichGate>;
}
