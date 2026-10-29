"use client";

// Khung laptop của ban điều hành trong thế giới "Lịch bloc". Dữ liệu từ GET /clubs/:clubId/board.
// Mục menu giống BoardShell cũ: cùng thứ tự, cùng số đếm, cùng lý do khi bị khóa.
// Lúc đang tải: thanh bên vẫn hiện đủ mục với chữ thật, chỉ tên CLB và tên người là thanh giữ chỗ; vùng chính hiện `fallback`.

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { BoardRes } from "@contract";
import { useBoardQuery } from "@/api/queries";
import { Icon, type IconName } from "@/components/Icon";
import { ROLE_LABEL } from "@/lib/types";
import { BoardAccountMenu } from "./AccountMenu";
import { ErrorGate, useLogout } from "./Gate";
import { LinkIcon, Loading, Skel, useSawPending } from "./motion";

/** Mục đang chọn trên thanh bên. */
export type BoardNav = "home" | "members" | "checkin" | "collection" | "reconcile" | "expenses" | "budget" | "handover" | "kit" | "tasks" | "posts";

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
  { key: "tasks", icon: "check", label: "Việc cần làm", href: (base) => `${base}/tasks` },
  // Tin công khai của CLB trên trang chung (khung mẫu, 29/10/2026).
  { key: "posts", icon: "feed", label: "Bảng tin của CLB", href: (base) => `${base}/posts` },
  { key: "handover", icon: "swap", label: "Bàn giao", href: (base) => `${base}/handover`, group: "Nhiệm kỳ" },
  { key: "kit", icon: "doc", label: "Kho bàn giao", href: (base) => `${base}/handover-kit` },
  // Nhóm "Quỹ" ở dưới cùng, đóng mặc định (phần tiền là vùng rủi ro pháp lý, không đưa lên đầu). Xem FUND bên dưới.
  // Đợt thu đang dùng; CLB chưa có đợt thu nào thì trang đó mời tạo đợt thu.
  { key: "collection", icon: "wallet", label: "Đợt thu", href: (base, b) => (b.collectionId ? `${base}/collections/${b.collectionId}` : `${base}/collections`) },
  { key: "reconcile", icon: "listCheck", label: "Đối soát sao kê", href: (base) => `${base}/reconcile`, count: (b) => b.counts.openManualTxns },
  { key: "expenses", icon: "docCheck", label: "Đề xuất và duyệt chi", href: (base) => `${base}/expenses`, count: (b) => b.counts.pendingExpenses },
  { key: "budget", icon: "calendar", label: "Dự trù kỳ", href: (base) => `${base}/budget` },
];

/** Các mục của nhóm "Quỹ": gom lại, đóng mặc định, tự mở khi đang ở một trong các trang này. */
const FUND: BoardNav[] = ["collection", "reconcile", "expenses", "budget"];

export function BoardFrame({ clubId, active, fallback, children }: { clubId: string; active: BoardNav; fallback?: ReactNode; children: ReactNode }) {
  const query = useBoardQuery(clubId);
  const { logout, pending: leaving } = useLogout();
  const saw = useSawPending(query.isPending);
  const fade = saw ? " l-fade-in" : "";
  // Nhóm Quỹ: mỗi trang tự dựng khung, nên trạng thái đầu là "mở" khi đang ở một trang của quỹ; bấm nút đóng mở được.
  const [fundOpen, setFundOpen] = useState(FUND.includes(active));
  if (query.isError) return <ErrorGate error={query.error} onRetry={() => query.refetch()} />;

  const board = query.data;
  const base = `/clubs/${clubId}`;
  // Chủ nhiệm mới (đang là thành viên thường) chỉ vào được Bàn giao và Kho bàn giao cho tới khi bàn giao xong.
  const nav = board?.me.role === "member" ? NAV.filter((n) => n.key === "handover" || n.key === "kit") : NAV;
  // Nhóm Quỹ đóng thì vẫn thấy tổng số việc đang chờ ở đó.
  const fundCount = board ? NAV.filter((n) => FUND.includes(n.key)).reduce((sum, n) => sum + (n.count?.(board) ?? 0), 0) : 0;

  const item = (n: NavItem) => {
    const on = active === n.key;
    const label = <><Icon name={n.icon} />{n.label}</>;
    // Đang tải: mục hiện chữ thật nhưng chưa bấm được.
    if (!board) return <span className={`l-nav${on ? " on" : ""}`}>{label}</span>;
    const href = n.href(base, board);
    if (!href) return <button type="button" className="l-nav" aria-disabled="true" onClick={() => toast(n.reason)}>{label}</button>;
    const count = n.count?.(board) ?? 0;
    return (
      <Link className={`l-nav${on ? " on" : ""}`} href={href} aria-current={on ? "page" : undefined} data-tour={`nav-${n.key}`}>
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
              <Link className="l-brand" href="/feed" aria-label="CampusHub, Cộng đồng" data-tour="brand"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></Link>
              {board ? (
                <div className={`l-club${fade}`}>
                  <strong>{board.club.name}</strong>
                  <span>{ROLE_LABEL[board.me.role]} · {board.club.term}</span>
                </div>
              ) : (
                <Loading className="l-club"><Skel w="78%" h={15} /><Skel w="52%" h={12} /></Loading>
              )}
              <nav aria-label="Menu ban điều hành" className="l-navlist">
                {/* Trang chung là của mọi vai (Hiệu yêu cầu 29/10/2026), nên đứng trên các mục của riêng CLB. */}
                <div className="l-navgroup">
                  <Link className="l-nav" href="/feed"><LinkIcon name="feed" />Cộng đồng</Link>
                </div>
                {nav.map((n) => {
                  if (FUND.includes(n.key) && n.key !== "collection") return null; // nằm trong khối của nhóm Quỹ
                  if (n.key === "collection") {
                    return (
                      <div key="fund" className="l-navgroup">
                        <button type="button" className="l-navlab l-navtoggle" data-tour="nav-fund" aria-expanded={fundOpen} aria-controls={fundOpen ? "nav-fund" : undefined} onClick={() => setFundOpen((v) => !v)}>
                          <span>Quỹ</span>
                          <Icon name={fundOpen ? "chevronDown" : "chevronRight"} size={14} />
                          {!fundOpen && fundCount > 0 && <span className={`l-cnt${fade}`}>{fundCount}<span className="l-sr"> việc đang chờ trong nhóm Quỹ</span></span>}
                        </button>
                        {fundOpen && <div id="nav-fund">{NAV.filter((x) => FUND.includes(x.key)).map((x) => <div key={x.key}>{item(x)}</div>)}</div>}
                      </div>
                    );
                  }
                  return (
                    <div key={n.key} className="l-navgroup">
                      {n.group && <div className="l-navlab">{n.group}</div>}
                      {item(n)}
                    </div>
                  );
                })}
              </nav>
              <div className="l-who">
                {board ? (
                  <>
                    <BoardAccountMenu name={board.me.name} fade={saw} />
                    <div className={`l-who-text${fade}`}>
                      <strong>{board.me.name}</strong>
                      <div className="l-who-links">
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
