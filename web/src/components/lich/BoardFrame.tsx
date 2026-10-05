"use client";

// Khung laptop của ban điều hành trong thế giới "Lịch bloc". Dữ liệu từ GET /clubs/:clubId/board.
// Mục menu giống BoardShell cũ: cùng thứ tự, cùng số đếm, cùng lý do khi bị khóa.
// Lúc đang tải: thanh bên vẫn hiện đủ mục với chữ thật, chỉ tên CLB và tên người là thanh giữ chỗ; vùng chính hiện `fallback`.

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import { toast } from "sonner";
import type { BoardRes } from "@contract";
import { useBoardQuery } from "@/api/queries";
import { Icon, type IconName } from "@/components/Icon";
import { initials } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";
import { ErrorGate, useDemoMode, useLogout } from "./Gate";
import { LinkIcon, Loading, Skel, useSawPending } from "./motion";

/** Mục đang chọn trên thanh bên. */
export type BoardNav = "home" | "members" | "checkin" | "collection" | "reconcile" | "expenses" | "budget" | "handover";

const Ctx = createContext<BoardRes | null>(null);
const SawCtx = createContext(false);

export function useLichBoard(): BoardRes {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLichBoard phải nằm trong BoardFrame");
  return v;
}

/** Khung đã hiện khung xương trong lần mở này: nội dung của màn nên hiện dần thay vì bật ra. */
export const useFrameSawPending = () => useContext(SawCtx);

interface NavItem {
  key: BoardNav;
  icon: IconName;
  label: string;
  /** null: mục bị khóa (chưa có buổi hay đợt thu nào), bấm thì báo `reason`. */
  href: (base: string, b: BoardRes) => string | null;
  count?: (b: BoardRes) => number;
  reason?: string;
  group?: string; // nhãn nhóm đặt ngay trên mục này
}

const NAV: NavItem[] = [
  { key: "home", icon: "home", label: "Trang chủ", href: (base) => base },
  { key: "members", icon: "users", label: "Thành viên", href: (base) => `${base}/members`, count: (b) => b.counts.pendingApplications },
  // Danh sách buổi (tạo buổi, mở QR từng buổi); CLB chưa có buổi nào thì trang đó mời tạo buổi.
  { key: "checkin", icon: "qr", label: "Điểm danh", href: (base) => `${base}/events` },
  // Đợt thu đang dùng; CLB chưa có đợt thu nào thì trang đó mời tạo đợt thu.
  { key: "collection", icon: "wallet", label: "Đợt thu", href: (base, b) => (b.collectionId ? `${base}/collections/${b.collectionId}` : `${base}/collections`), group: "Sổ quỹ" },
  { key: "reconcile", icon: "listCheck", label: "Đối soát sao kê", href: (base) => `${base}/reconcile`, count: (b) => b.counts.openManualTxns },
  { key: "expenses", icon: "docCheck", label: "Đề xuất và duyệt chi", href: (base) => `${base}/expenses`, count: (b) => b.counts.pendingExpenses },
  { key: "budget", icon: "calendar", label: "Dự trù kỳ", href: (base) => `${base}/budget` },
  { key: "handover", icon: "swap", label: "Bàn giao", href: (base) => `${base}/handover`, group: "Nhiệm kỳ" },
];

export function BoardFrame({ clubId, active, fallback, children }: { clubId: string; active: BoardNav; fallback?: ReactNode; children: ReactNode }) {
  const query = useBoardQuery(clubId);
  const demo = useDemoMode();
  const { logout, pending: leaving } = useLogout();
  const saw = useSawPending(query.isPending);
  const fade = saw ? " l-fade-in" : "";
  if (query.isError) return <ErrorGate error={query.error} onRetry={() => query.refetch()} />;

  const board = query.data;
  const base = `/clubs/${clubId}`;

  const item = (n: NavItem) => {
    const on = active === n.key;
    const label = <><Icon name={n.icon} />{n.label}</>;
    // Đang tải: mục hiện chữ thật nhưng chưa bấm được.
    if (!board) return <span className={`l-nav${on ? " on" : ""}`}>{label}</span>;
    const href = n.href(base, board);
    if (!href) return <button type="button" className="l-nav" aria-disabled="true" onClick={() => toast(n.reason)}>{label}</button>;
    const count = n.count?.(board) ?? 0;
    return (
      <Link className={`l-nav${on ? " on" : ""}`} href={href} aria-current={on ? "page" : undefined}>
        <LinkIcon name={n.icon} />{n.label}{count > 0 && <span className={`l-cnt${fade}`}>{count}</span>}
      </Link>
    );
  };

  return (
    <Ctx.Provider value={board ?? null}>
      <SawCtx.Provider value={saw}>
        <div className="lich">
          <div className="l-board">
            <aside className="l-side">
              <Link className="l-brand" href={base}><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></Link>
              {board ? (
                <div className={`l-club${fade}`}>
                  <strong>{board.club.name}</strong>
                  <span>{ROLE_LABEL[board.me.role]} · {board.club.term}</span>
                </div>
              ) : (
                <Loading className="l-club"><Skel w="78%" h={15} /><Skel w="52%" h={12} /></Loading>
              )}
              <nav aria-label="Menu ban điều hành" className="l-navlist">
                {NAV.map((n) => (
                  <div key={n.key} className="l-navgroup">
                    {n.group && <div className="l-navlab">{n.group}</div>}
                    {item(n)}
                  </div>
                ))}
              </nav>
              <div className="l-who">
                {board ? (
                  <>
                    <span className={`l-avatar${fade}`} aria-hidden="true">{initials(board.me.name)}</span>
                    <div className={`l-who-text${fade}`}>
                      <strong>{board.me.name}</strong>
                      <div className="l-who-links">
                        {demo && <Link href="/">Đổi vai (bản demo)</Link>}
                        <button type="button" className="l-linkbtn" aria-busy={leaving || undefined} onClick={() => logout()}>Đăng xuất</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <><span className="l-avatar l-skel" aria-hidden="true" /><span className="l-who-text"><Skel w={120} /><Skel w={84} h={12} /></span></>
                )}
              </div>
            </aside>
            <main className="l-main">{board ? children : fallback}</main>
          </div>
        </div>
      </SawCtx.Provider>
    </Ctx.Provider>
  );
}
