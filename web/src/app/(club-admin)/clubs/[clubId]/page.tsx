"use client";

// Ban điều hành · Trang chủ (design/screens/BDH-TrangChu.html; bản vẽ đặt tên "Việc cần làm", đổi thành "Trang chủ" từ 22/10/2026 vì trùng tên với mục Việc cần làm mới), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/board (khung) và GET /clubs/:clubId/dashboard. Quyền kiểm tra ở máy chủ;
// ở đây chỉ ẩn những việc vai đang xem không làm được.

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import type { DashboardRes, Role } from "@contract";
import { useDashboard } from "@/api/queries";
import { Icon, type IconName } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { daysLeft, Leaf, TodayLeaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { agoLabel, dm, dmy, hm, money } from "@/lib/format";
import { HANDOVER_STEPS } from "@/lib/handover-steps";
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
        <h1>Trang chủ</h1>
        <div className="l-top-sub">{sub}</div>
      </div>
      <div className="l-top-actions">{actions}</div>
    </header>
  );
}

/** Khung xương của tờ giấy làm việc: tiêu đề các khối hiện ngay, số liệu là thanh giữ chỗ. Mỗi khối cao bằng khối thật. */
function SheetSkeleton() {
  return (
    <Loading className="l-split">
      <div className="l-stack">
        <section className="l-panel">
          <div className="l-panel-head"><h2>Việc cần làm</h2><Skel w={104} h={34} /></div>
          <p className="l-note l-panel-sub"><SkelLine w={150} /></p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="l-event">
              <LeafSkel sub="còn 7 ngày" />
              <span className="l-event-text"><Skel w="52%" h={16} /><Skel w="38%" h={13} /></span>
            </div>
          ))}
          <p className="l-note l-panel-sub"><SkelLine w={100} /></p>
        </section>
        <section className="l-panel">
          <div className="l-panel-head"><h2>Bàn giao</h2><Skel w={150} h={34} /></div>
          <div className="l-panel-body"><Skel w="86%" h={16} /><Skel w="100%" h={8} /><Skel w="64%" h={28} /></div>
        </section>
        <section className="l-panel">
          <div className="l-panel-head"><h2>Sự kiện sắp tới</h2><Skel w={118} h={34} /></div>
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
          <div className="l-panel-head"><h2>Cần bạn xử lý</h2></div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="l-todo">
              <span className="l-todo-n"><Skel w={26} h={30} /></span>
              <span className="l-todo-text"><Skel w="58%" h={16} /><Skel w="82%" h={13} /><Skel w="40%" h={16} /></span>
            </div>
          ))}
        </section>
        <section className="l-panel">
          <div className="l-panel-head"><h2>Thống kê tham gia</h2><Skel w={150} h={26} /></div>
          <div className="l-panel-body"><Skel w="100%" h={64} /><Skel w="90%" h={13} /><Skel w={160} h={34} /></div>
        </section>
        <section className="l-panel">
          <div className="l-panel-body l-fundline"><h2 className="l-subhead">Quỹ</h2><Skel w="52%" h={16} /><Skel w={90} h={34} /></div>
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
    todo.push({ href: `${base}/events?create=1`, icon: "calendar", title: "Tạo buổi sinh hoạt đầu tiên", sub: "Có buổi thì mới mở được mã QR điểm danh." });
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
  const canCheckinTop = !!nextSessionId && canCheckin; // đầu trang đã có nút "Mở QR điểm danh" đặc, dòng buổi dùng nút viền

  const stepName = d.handover ? HANDOVER_STEPS[d.handover.step - 1] : undefined;
  const taskSub = (due: string, overdue: boolean) => { const n = daysLeft(due); return overdue ? `quá ${-n} ngày` : n === 0 ? "hôm nay" : `còn ${n} ngày`; };

  return (
    <>
      {top}
      <Reveal from={saw} className="l-split">
        <div className="l-stack">
          <section className="l-panel" aria-labelledby="tasks-h">
            <div className="l-panel-head">
              <h2 id="tasks-h">Việc cần làm</h2>
              <Link className="l-btn2 l-sm" href={`${base}/tasks`}><LinkIcon name="check" size={16} />Tất cả việc</Link>
            </div>
            <p className="l-note l-panel-sub">{d.tasks.open} việc chưa xong · {d.tasks.overdue} quá hạn</p>
            {d.tasks.items.length === 0 && <p className="l-empty">Không còn việc nào chưa xong.</p>}
            {d.tasks.items.map((t) => (
              <Link key={t.id} className="l-event l-task-mini" href={`${base}/tasks`}>
                <Leaf date={t.due} sub={taskSub(t.due, t.overdue)} tone={t.overdue || daysLeft(t.due) <= 3 ? "urgent" : undefined} label={`Hạn ${dmy(t.due)}, ${taskSub(t.due, t.overdue)}`} />
                <span className="l-event-text">
                  <span className="l-event-title">{t.title}</span>
                  <span className="l-event-sub">{t.assignee.name} · {t.status === "doing" ? "đang làm" : "chưa làm"}</span>
                </span>
                <LinkIcon name="chevronRight" className="l-todo-arrow" />
              </Link>
            ))}
            {d.tasks.open > d.tasks.items.length && <p className="l-note l-panel-sub">Còn {d.tasks.open - d.tasks.items.length} việc nữa.</p>}
          </section>

          <section className="l-panel" aria-labelledby="handover-h">
            <div className="l-panel-head">
              <h2 id="handover-h">Bàn giao</h2>
              <Link className="l-btn2 l-sm" href={`${base}/handover-kit`}><LinkIcon name="doc" size={16} />Mở kho bàn giao</Link>
            </div>
            <div className="l-panel-body">
              <p>
                Kho bàn giao: {d.kit.documents} biểu mẫu, {d.kit.processes} quy trình, {d.kit.accounts} tài khoản ·{" "}
                {d.kit.missing > 0 ? <span className="l-attn">{d.kit.missing} mục thiếu</span> : "không thiếu mục nào"}
              </p>
              {d.handover ? (
                <>
                  <div className="l-bar" role="progressbar" aria-valuemin={0} aria-valuemax={HANDOVER_STEPS.length} aria-valuenow={d.handover.accepted ? HANDOVER_STEPS.length : d.handover.step - 1} aria-label="Tiến độ bàn giao">
                    <span style={{ width: `${((d.handover.accepted ? HANDOVER_STEPS.length : d.handover.step - 1) / HANDOVER_STEPS.length) * 100}%` }} />
                  </div>
                  <p>
                    {d.handover.accepted ? `Bàn giao sang ban ${d.handover.toTerm} đã xong.` : <>Bàn giao sang ban {d.handover.toTerm}: bước {d.handover.step} / {HANDOVER_STEPS.length}, {stepName?.toLowerCase()}.</>}{" "}
                    <Link className="l-linkbtn" href={`${base}/handover`}>{d.handover.accepted ? "Xem biên bản" : "Tiếp tục bàn giao"}</Link>
                  </p>
                </>
              ) : <p className="l-note">CLB chưa bắt đầu bàn giao.</p>}
            </div>
          </section>

          <section className="l-panel" aria-labelledby="events-h">
            <div className="l-panel-head">
              <h2 id="events-h">Sự kiện sắp tới</h2>
              {canCheckin
                ? <Link className="l-btn2 l-sm" href={`${base}/events?create=1`}><LinkIcon name="plus" size={16} />Tạo sự kiện</Link>
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
                  ? <Link className={`${e.id === nextSessionId && !canCheckinTop ? "l-btn" : "l-btn2"} l-sm`} href={`${base}/events/${e.id}/qr`}><LinkIcon name="qr" size={16} />Mở QR</Link>
                  : <Link className="l-btn2 l-sm" href={`${base}/events`}>Xem</Link>}
              </div>
            ))}
          </section>
        </div>

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

          {/* Tính năng thuộc gói trả phí (chốt 30/10/2026). Bản demo mở hết, nên số hiện đủ; khi ra bản chính thức, CLB dùng bản miễn phí sẽ chỉ thấy khung có số làm mờ. */}
          <section className="l-panel" aria-labelledby="stats-h">
            <div className="l-panel-head"><h2 id="stats-h">Thống kê tham gia</h2><span className="l-tag wait">Thuộc gói trả phí</span></div>
            <div className="l-panel-body">
              <dl className="l-facts">
                <div><dt>Có mặt {d.participation.sessions} buổi gần đây</dt><dd>{d.participation.rate ?? "–"}%</dd></div>
                <div><dt>Vắng liền {d.participation.sessions} buổi</dt><dd>{d.participation.absentRuns} người</dd></div>
              </dl>
              <p className="l-note">Phân tích tự động từ dữ liệu điểm danh (phép đếm, không phải AI). Bản demo mở hết tính năng; bản chính thức chỉ có ở gói trả phí.</p>
              <div className="l-row-actions"><Link className="l-btn2 l-sm" href={`${base}/paid-plan`}>Tìm hiểu bản trả phí</Link></div>
            </div>
          </section>

        </div>
      </Reveal>
      <Reveal from={saw} className="l-split-foot">
        <section className="l-panel" aria-labelledby="fund-h">
          <div className="l-panel-body l-fundline">
            <h2 id="fund-h" className="l-subhead">Quỹ</h2>
            <span className="l-fundline-text"><strong>{money(d.balance)}</strong> · {d.pendingExpenses.count} khoản chờ duyệt</span>
            <Link className="l-btn2 l-sm" href={c ? `${base}/collections/${c.id}` : `${base}/collections`}>Mở quỹ</Link>
          </div>
        </section>
      </Reveal>
    </>
  );
}
