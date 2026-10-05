"use client";

// Ban điều hành · Việc cần làm (design/screens/BDH-TrangChu.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/board (khung) và GET /clubs/:clubId/dashboard. Quyền kiểm tra ở máy chủ;
// ở đây chỉ ẩn những việc vai đang xem không làm được.

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import type { DashboardRes, Role } from "@contract";
import { useDashboard } from "@/api/queries";
import { CopyButton } from "@/components/CopyButton";
import { Icon, type IconName } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { daysLeft, dueLabel, isUrgent, Leaf, TodayLeaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, LinkIcon, Loading, Reveal, Skel, useSawPending } from "@/components/lich/motion";
import { appUrl } from "@/components/url";
import { agoLabel, dm, dmy, hm, money } from "@/lib/format";
import { can } from "@/lib/selectors";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useDashboard(clubId); // tải song song với khung, để khung xương chỉ hiện một lần
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="home" fallback={<><Top sub={<Skel w={230} h={15} />} actions={<><Skel w={168} h={40} /><Skel w={190} h={40} /></>} /><SheetSkeleton /></>}>
        <Home />
      </BoardFrame>
    </LichPage>
  );
}

/** Đầu trang: tờ lịch hôm nay, tiêu đề, dòng phụ, hai nút chính. */
function Top({ sub, actions }: { sub: ReactNode; actions?: ReactNode }) {
  return (
    <header className="l-top">
      <TodayLeaf />
      <div className="l-top-text">
        <h1>Việc cần làm</h1>
        <div className="l-top-sub">{sub}</div>
      </div>
      <div className="l-top-actions">{actions}</div>
    </header>
  );
}

/** Khung xương của tờ giấy làm việc: tiêu đề các khối hiện ngay, số liệu là thanh giữ chỗ. */
function SheetSkeleton() {
  return (
    <Loading className="l-split">
      <div className="l-stack">
        <section className="l-panel">
          <div className="l-panel-head"><h2>Cần bạn xử lý</h2></div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="l-todo">
              <span className="l-todo-n"><Skel w={26} h={30} /></span>
              <span className="l-todo-text"><Skel w="58%" h={16} /><Skel w="82%" h={13} /></span>
            </div>
          ))}
        </section>
        <section className="l-panel">
          <div className="l-panel-head"><h2>Sự kiện sắp tới</h2></div>
          {[0, 1].map((i) => (
            <div key={i} className="l-event">
              <LeafSkel sub="Thứ Bảy" />
              <span className="l-event-text"><Skel w="40%" h={16} /><Skel w="72%" h={13} /></span>
            </div>
          ))}
        </section>
      </div>
      <div className="l-stack">
        <section className="l-panel">
          <div className="l-panel-body l-collect">
            <div className="l-collect-head">
              <span className="l-collect-title"><Skel w="62%" h={22} /><Skel w="46%" h={13} /></span>
              <LeafSkel />
            </div>
            <Skel w={150} h={40} />
            <Skel w="100%" h={8} />
            <Skel w="100%" h={64} />
          </div>
        </section>
        <section className="l-panel">
          <div className="l-panel-head"><h2>Quỹ hiện có</h2></div>
          <div className="l-panel-body"><Skel w={210} h={40} /><Skel w="100%" h={96} /></div>
        </section>
      </div>
    </Loading>
  );
}

/** Hạ chữ đầu để tên đứng giữa câu. Chữ viết tắt như "CLB…", "QR…" giữ nguyên. */
function lowerFirst(s: string) {
  return /^\p{Lu}\p{M}*\p{Ll}/u.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

interface Todo {
  href: string;
  /** Số việc cỡ lớn ở ô bên trái; không có thì hiện biểu tượng (mặc định là cảnh báo). */
  n?: number;
  icon?: IconName;
  title: string;
  sub: string;
}

/** Việc đang chờ mà vai đang xem làm được. Khoản do chính người xem đề xuất vẫn được đếm, như bản vẽ. */
function buildTodo(d: DashboardRes, base: string, role: Role): Todo[] {
  const todo: Todo[] = [];
  // CLB mới (thêm ngày 04/10/2026, mô tả được Hiệu duyệt): nhắc ba việc mở đầu cho tới khi làm xong.
  if (d.setup.members <= 1 && can(role, "approveApplication")) {
    todo.push({ href: `${base}/members/add`, icon: "users", title: "Thêm thành viên", sub: "Nhập danh sách từ Excel hoặc gõ từng người, rồi gửi link mời qua Zalo." });
  }
  if (d.setup.events === 0 && can(role, "checkin")) {
    todo.push({ href: `${base}/events?tao=1`, icon: "calendar", title: "Tạo buổi sinh hoạt đầu tiên", sub: "Có buổi thì mới mở được mã QR điểm danh." });
  }
  if (!d.collection && can(role, "money")) {
    todo.push({ href: `${base}/collections/new`, icon: "wallet", title: "Tạo đợt thu quỹ", sub: "Mỗi thành viên có mã chuyển khoản riêng và hạn đóng." });
  }
  const apps = d.pendingApplications;
  if (apps.count > 0 && can(role, "approveApplication")) {
    todo.push({
      href: `${base}/members`,
      n: apps.count,
      title: "Đơn xin vào CLB đang chờ duyệt",
      sub: `${apps.count === 1 ? "Đơn gửi" : "Đơn cũ nhất gửi"} ${apps.oldestAt ? agoLabel(apps.oldestAt) : ""}. Người xin vào chưa nhận được trả lời.`,
    });
  }
  const exp = d.pendingExpenses;
  if (exp.count > 0 && can(role, "approveExpense")) {
    const titles = exp.titles.map((t, i) => (i === 0 ? t : lowerFirst(t)));
    const joined = titles.length > 1 ? `${titles.slice(0, -1).join(", ")} và ${titles[titles.length - 1]}` : titles[0];
    todo.push({ href: `${base}/expenses`, n: exp.count, title: `Khoản chi chờ duyệt · ${money(exp.total)}`, sub: `${joined}.` });
  }
  const rec = d.reconcile;
  if (rec.openManual > 0 && rec.lastUploadAt && can(role, "money")) {
    todo.push({
      href: `${base}/reconcile`,
      n: rec.openManual,
      title: "Giao dịch trong sao kê chưa khớp",
      sub: `Sai cú pháp, chuyển hộ hoặc thiếu tiền. Lần tải sao kê gần nhất: ${dmy(rec.lastUploadAt)}.`,
    });
  }
  if (d.budget.forecast < 0 && can(role, "budget")) {
    todo.push({ href: `${base}/budget`, title: `Dự trù ${d.budget.term} đang thiếu ${money(-d.budget.forecast)}`, sub: "Xem lại các khoản dự trù." });
  }
  return todo;
}

function Home() {
  const { club, me, nextSessionId } = useLichBoard();
  const query = useDashboard(club.id);
  const base = `/clubs/${club.id}`;
  const canCheckin = can(me.role, "checkin");
  const todo = query.data ? buildTodo(query.data, base, me.role) : [];
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  const saw = sawHere || sawFrame;

  const top = (
    <Top
      sub={query.data ? `${todo.length === 0 ? "Hôm nay không có việc nào đang chờ" : `${todo.length} việc đang chờ bạn`} · học kỳ ${club.term}` : <Skel w={230} h={15} />}
      actions={<>
        <Link className="l-btn2" href={`${base}/members`}><LinkIcon name="link" size={18} />Mời thành viên</Link>
        {nextSessionId && canCheckin && <Link className="l-btn" href={`${base}/events/${nextSessionId}/qr`}><LinkIcon name="qr" size={18} />Mở QR điểm danh</Link>}
      </>}
    />
  );

  if (query.isPending) return <>{top}<SheetSkeleton /></>;
  if (query.isError) return <>{top}<ErrorGate inline error={query.error} onRetry={() => query.refetch()} /></>;
  const d = query.data;
  const c = d.collection;

  return (
    <>
      {top}
      <Reveal from={saw} className="l-split">
        <div className="l-stack">
          <section className="l-panel" aria-labelledby="todo-h">
            <div className="l-panel-head"><h2 id="todo-h">Cần bạn xử lý</h2></div>
            {todo.length === 0 && <p className="l-empty">Không có việc nào đang chờ.</p>}
            {todo.map((t) => (
              <Link key={t.href} className="l-todo" href={t.href}>
                <span className="l-todo-n">{t.n ?? <Icon name={t.icon ?? "alert"} size={26} />}</span>
                <span className="l-todo-text">
                  <span className="l-todo-title">{t.title}</span>
                  <span className="l-todo-sub">{t.sub}</span>
                </span>
                <LinkIcon name="chevronRight" className="l-todo-arrow" />
              </Link>
            ))}
          </section>

          <section className="l-panel" aria-labelledby="events-h">
            <div className="l-panel-head">
              <h2 id="events-h">Sự kiện sắp tới</h2>
              {canCheckin
                ? <Link className="l-btn2 l-sm" href={`${base}/events?tao=1`}><LinkIcon name="plus" size={16} />Tạo sự kiện</Link>
                : <Link className="l-btn2 l-sm" href={`${base}/events`}><LinkIcon name="calendar" size={16} />Các buổi</Link>}
            </div>
            {d.upcomingEvents.length === 0 && <p className="l-empty">Chưa có sự kiện nào sắp tới.</p>}
            {d.upcomingEvents.map((e) => (
              <div key={e.id} className="l-event">
                <Leaf date={e.start} tone={daysLeft(e.start) === 0 ? "today" : undefined} sub={daysLeft(e.start) === 0 ? "hôm nay" : undefined} />
                <div className="l-event-text">
                  <span className="l-event-title">{e.title}</span>
                  <span className="l-event-sub">
                    {hm(e.start)}–{hm(e.end)} · {lowerFirst(e.location)}
                    {e.kind === "session" ? ` · ${e.status === "open" ? "đang mở điểm danh" : "điểm danh"} đến ${hm(e.checkinUntil)}` : " · mở cho cả người ngoài CLB"}
                  </span>
                </div>
                {e.kind === "session" && canCheckin
                  ? <Link className={`${e.id === nextSessionId ? "l-btn" : "l-btn2"} l-sm`} href={`${base}/events/${e.id}/qr`}><LinkIcon name="qr" size={16} />Mở QR</Link>
                  : <Link className="l-btn2 l-sm" href={`${base}/events`}>Xem</Link>}
              </div>
            ))}
          </section>
        </div>

        <div className="l-stack">
          {c && (
            <section className="l-panel" aria-labelledby="collect-h">
              <div className="l-panel-body l-collect">
                <div className="l-collect-head">
                  <div className="l-collect-title">
                    <h2 id="collect-h">{c.name}</h2>
                    <span className="l-meta">{money(c.amount)}/người · hạn {dmy(c.dueDate)}</span>
                  </div>
                  <Leaf date={c.dueDate} sub={dueLabel(c.dueDate)} tone={isUrgent(c.dueDate) ? "urgent" : undefined} label={`Hạn đóng ${dmy(c.dueDate)}, ${dueLabel(c.dueDate)}`} />
                </div>
                <div className="l-count">
                  <span className="l-count-n">{c.stats.paid}</span>
                  <span className="l-count-of">/{c.stats.total}</span>
                  <span className="l-count-label">người đã đóng</span>
                </div>
                <div className="l-bar" role="progressbar" aria-valuemin={0} aria-valuemax={c.stats.total} aria-valuenow={c.stats.paid} aria-label="Số người đã đóng">
                  <span style={{ width: `${c.stats.total > 0 ? Math.min(100, (c.stats.paid / c.stats.total) * 100) : 0}%` }} />
                </div>
                <dl className="l-facts">
                  <div><dt>Chuyển khoản</dt><dd>{c.stats.transfer}</dd></div>
                  <div><dt>Tiền mặt</dt><dd>{c.stats.cash}</dd></div>
                  <div><dt>Báo đã chuyển, chờ đối soát</dt><dd>{c.stats.reported}</dd></div>
                  <div><dt>Chưa đóng</dt><dd>{c.stats.unpaid}</dd></div>
                </dl>
                <div className="l-row-actions">
                  <Link className="l-btn2 l-sm" href={`${base}/collections/${c.id}`}><LinkIcon name="users" size={16} />Xem ai chưa đóng</Link>
                  <CopyButton className="l-btn2 l-sm" icon="link" text={appUrl(`/me/pay/${c.id}`)} label="Sao chép link đóng quỹ để gửi vào nhóm Zalo" notice="Đã sao chép link đóng quỹ. Dán vào nhóm Zalo của CLB." />
                </div>
              </div>
            </section>
          )}

          <section className="l-panel" aria-labelledby="fund-h">
            <div className="l-panel-head"><h2 id="fund-h">Quỹ hiện có</h2></div>
            <div className="l-panel-body">
              <div>
                <span className="l-money-big">{money(d.balance)}</span>
                {d.reconcile.reconciledTo && <p className="l-meta">Theo sổ quỹ, đã đối soát sao kê đến {dmy(d.reconcile.reconciledTo)}.</p>}
              </div>
              {d.recentLedger.length === 0 ? <p className="l-note">Sổ quỹ chưa có giao dịch nào.</p> : (
                <div className="l-ledger">
                  {d.recentLedger.map((r) => (
                    <div key={`${r.date}-${r.direction}-${r.label}`} className="l-ledger-row">
                      <span className="l-ledger-date">{dm(r.date)}</span>
                      <span>{r.direction === "in" ? "Thu" : "Chi"} · {r.label}{r.count > 1 ? ` (${r.count} khoản)` : ""}</span>
                      <span className={r.direction === "in" ? "l-in" : "l-out"}>{r.direction === "in" ? "+" : "−"}{money(r.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="l-note">Sổ quỹ chỉ thêm, không sửa hay xóa được. Thành viên xem sổ quỹ ở chế độ chỉ đọc.</p>
            </div>
          </section>
        </div>
      </Reveal>
    </>
  );
}
