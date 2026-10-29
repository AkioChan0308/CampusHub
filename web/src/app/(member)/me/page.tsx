"use client";

// Thành viên · Của tôi (design/screens/TV-CuaToi.html), thế giới "Lịch bloc".
// Quyền của người có dữ liệu: xem, sửa, tải về, rút đồng ý, xóa (Luật 91/2025, Nghị định 356/2025).
// Dữ liệu từ GET /me và /me/clubs/:clubId. Tải dữ liệu: GET /me/export. Rút đồng ý: POST .../consents/phone/withdraw.
// Rời CLB và xóa dữ liệu: POST .../deletion-request.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ConsentRes, MeRes, MyClubRes, MyExportRes } from "@contract";
import { apiGet, apiPost } from "@/api/client";
import { myDataRows } from "@/api/excel-rows";
import { errorText, keys, useMe, useMyClub } from "@/api/queries";
import { useActiveMembership } from "@/api/active-club";
import { Icon } from "@/components/Icon";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate, NOT_IN_MVP, useLogout } from "@/components/lich/Gate";
import { dueLabel, isUrgent, Leaf } from "@/components/lich/Leaf";
import { LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, Spinner, useSawPending } from "@/components/lich/motion";
import { MeLocked, NoClubGate } from "@/components/lich/NoClub";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { SponsoredSlot } from "@/components/lich/SponsoredSlot";
import { downloadCsv } from "@/lib/csv";
import { dm, dmy, initials, money } from "@/lib/format";

/** "Yêu cầu xóa được xử lý trong tối đa 20 ngày" (bản vẽ TV-CuaToi). */
const DELETION_DAYS = 20;

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "ban Hậu cần". Tên đã có chữ "Ban" hoặc là "Chưa xếp ban" thì chỉ hạ chữ cái đầu. */
function departmentText(department: string): string {
  return /^(ban|chưa) /i.test(department) ? lowerFirst(department) : `ban ${department}`;
}

export default function MePage() {
  const me = useMe();
  const membership = useActiveMembership(me.data);
  const club = useMyClub(membership?.clubId);
  const saw = useSawPending(!club.data);

  const error = me.error ?? club.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void me.refetch(); void club.refetch(); }} />;
  if (me.data && !membership) {
    // Sinh viên chưa ở CLB nào: vẫn xem được thông tin, tính năng cần CLB bị khóa. Cán bộ trường và người có lời mời chờ vẫn qua trang chặn.
    const invited = me.data.memberships.some((x) => x.invite === "pending");
    return me.data.person.kind === "staff" || invited ? <NoClubGate me={me.data} /> : <MeLocked me={me.data} />;
  }

  const data = club.data;
  return (
    <LichPage>
      <PhoneFrame clubName={data?.club.name} personName={me.data?.person.name} tab="me" payHref={data?.collection ? `/me/pay/${data.collection.id}` : undefined} fade={saw}>
        {me.data && data ? <Me me={me.data} data={data} fade={saw} /> : <MeSkeleton />}
      </PhoneFrame>
    </LichPage>
  );
}

/** Khung xương: chữ cố định (tên mục, tên thao tác, dòng chữ nhỏ) là thật, chỉ tên, email, số buổi và tên đợt thu là thanh giữ chỗ. */
function MeSkeleton() {
  return (
    <Loading className="l-pay-body">
      <div className="l-profile">
        <span className="l-avatar lg l-skel" aria-hidden="true" />
        <div className="l-field">
          <h1 className="l-phone-title"><SkelLine w={190} /></h1>
          {/* Email và ban trên điện thoại thường dài hơn một dòng. */}
          <span className="l-meta"><SkelLine w={250} /><br /><SkelLine w={110} /></span>
        </div>
      </div>
      <Skel w="100%" h={116} />
      <section className="l-pay-card l-list">
        <h2 className="l-list-head">Kỳ <SkelLine w={84} /></h2>
        <div className="l-kv"><span>Điểm danh</span><span className="l-kv-value"><SkelLine w={64} /></span></div>
        <div className="l-kv"><span><SkelLine w={150} /></span><Skel w={150} h={26} /></div>
        <div className="l-kv"><span>Sổ quỹ của CLB</span><span className="l-note">Xem (chỉ đọc) · chưa có</span></div>
        <span className="l-act l-inert"><span>Việc được giao cho tôi</span></span>
      </section>
      <section className="l-pay-card l-list">
        <h2 className="l-list-head">Đăng nhập</h2>
        <div className="l-kv"><span>Tên tài khoản</span><SkelLine w={120} /></div>
        <span className="l-act l-inert"><span><SkelLine w={130} /></span></span>
        <span className="l-act l-inert"><span>Đăng xuất</span></span>
      </section>
      <section className="l-pay-card l-list">
        <h2 className="l-list-head">Dữ liệu của tôi</h2>
        {["Xem và sửa thông tin của tôi", "Tải dữ liệu của tôi (Excel)", "Rút đồng ý lưu số điện thoại", "Rời CLB và xóa dữ liệu"].map((t) => (
          <span key={t} className="l-act l-inert"><span>{t}</span></span>
        ))}
      </section>
      <FinePrint />
    </Loading>
  );
}

function FinePrint() {
  return (
    <p className="l-fine">
      Khi bạn xóa dữ liệu, các khoản đã đóng vẫn nằm trong sổ quỹ nhưng không còn tên bạn, để số dư không bị lệch. Yêu cầu xóa được xử lý trong tối đa {DELETION_DAYS} ngày.
    </p>
  );
}

/** Trạng thái đóng quỹ ở dòng "Quỹ học kỳ": cùng chữ với bản vẽ ("Chờ thủ quỹ xác nhận" khi đã báo chuyển). */
function PayState({ collection }: { collection: NonNullable<MyClubRes["collection"]> }) {
  const p = collection.payment;
  if (!p) return null;
  switch (p.status) {
    case "paid": return <span className="l-tag ok">Đã đóng</span>;
    case "reported": return <span className="l-tag wait">Chờ thủ quỹ xác nhận</span>;
    case "partial": return <span className="l-tag warn">Đóng thiếu · còn nợ {money(collection.amount - p.amountPaid)}</span>;
    default: return <span className="l-tag warn">Chưa đóng</span>;
  }
}

function Me({ me, data, fade }: { me: MeRes; data: MyClubRes; fade: boolean }) {
  const client = useQueryClient();
  const dataTitle = useRef<HTMLHeadingElement>(null);
  const { logout, pending: leaving } = useLogout();
  const [exporting, setExporting] = useState(false);
  const clubId = data.club.id;
  const { person } = me;
  const focusDataTitle = () => dataTitle.current?.focus();

  const withdraw = useMutation({
    mutationFn: () => apiPost<ConsentRes>(`/me/clubs/${clubId}/consents/phone/withdraw`),
    onSuccess: (res) => {
      client.setQueryData<MyClubRes>(keys.myClub(clubId), (old) => old && { ...old, consents: res.consents });
      toast.success("Đã rút đồng ý lưu số điện thoại.");
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const deletion = useMutation({
    mutationFn: () => apiPost<MyClubRes>(`/me/clubs/${clubId}/deletion-request`),
    onSuccess: (res) => {
      client.setQueryData(keys.myClub(clubId), res);
      toast.success("Đã gửi yêu cầu xóa dữ liệu.");
    },
    onError: (e) => toast.error(errorText(e)),
  });

  async function exportMine() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await apiGet<MyExportRes>("/me/export");
      downloadCsv(`du-lieu-cua-toi-${data.membership.code}.csv`, myDataRows(res));
      // Trình duyệt nằm trong Zalo, Messenger thường không lưu được file tải về.
      if (/Zalo|FBAN|FBAV/.test(navigator.userAgent)) toast("Mở trang bằng Chrome hoặc Safari để tải file.");
      else toast.success("Đã tạo file dữ liệu của bạn.");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setExporting(false);
    }
  }

  const phone = data.consents.filter((c) => c.purpose === "phone").at(-1);
  const phoneOn = !!phone && !phone.withdrawnAt;
  const requested = data.membership.deletionRequestedAt;
  const { attended, held } = data.attendance;

  return (
    <Reveal from={fade} className="l-pay-body">
      <div className="l-profile">
        <span className="l-avatar lg" aria-hidden="true">{initials(person.name)}</span>
        <div className="l-field">
          <h1 className="l-phone-title">{person.name}</h1>
          <span className="l-meta">{person.email} · {departmentText(data.membership.department)}</span>
        </div>
      </div>

      <SponsoredSlot />

      <section className="l-pay-card l-list" aria-labelledby="this-term">
        <h2 id="this-term" className="l-list-head">Kỳ {data.club.term}</h2>
        <div className="l-kv">
          <span>Điểm danh</span>
          {held > 0 ? <span className="l-kv-value">{attended}/{held} <span className="l-cell-unit">buổi</span></span> : <span className="l-note">Chưa có buổi nào</span>}
        </div>
        {data.collection && <div className="l-kv"><span>{data.collection.name}</span><PayState collection={data.collection} /></div>}
        <div className="l-kv"><span>Sổ quỹ của CLB</span><span className="l-note">Xem (chỉ đọc) · chưa có</span></div>
        <Link className="l-act" href="/me/tasks">
          <span>Việc được giao cho tôi</span>
          <span className="l-act-end"><LinkIcon name="chevronRight" size={18} /></span>
        </Link>
      </section>

      <section className="l-pay-card l-list" aria-labelledby="login-section">
        <h2 id="login-section" className="l-list-head">Đăng nhập</h2>
        <div className="l-kv">
          <span>Tên tài khoản</span>
          {me.account.username ? <strong className="l-kv-text">{me.account.username}</strong> : <span className="l-note">Chưa đặt · đăng nhập bằng Google</span>}
        </div>
        <Link className="l-act" href="/account?next=%2Fme">
          <span>{me.account.hasPassword ? "Đổi tên tài khoản và mật khẩu" : "Đặt tên tài khoản và mật khẩu"}</span>
          <span className="l-act-end"><LinkIcon name="chevronRight" size={18} /></span>
        </Link>
        <button type="button" className="l-act" aria-busy={leaving || undefined} onClick={() => logout()}>
          <span>Đăng xuất</span><span className="l-act-end">{leaving ? <Spinner /> : <Icon name="chevronRight" size={18} />}</span>
        </button>
      </section>

      <section className="l-pay-card l-list" aria-labelledby="my-data">
        <h2 id="my-data" className="l-list-head" ref={dataTitle} tabIndex={-1}>Dữ liệu của tôi</h2>
        <button type="button" className="l-act" aria-disabled="true" aria-describedby="edit-info-unavailable" onClick={() => toast(NOT_IN_MVP)}>
          <span>Xem và sửa thông tin của tôi</span><span id="edit-info-unavailable" className="l-act-end">chưa có</span>
        </button>
        <button type="button" className="l-act" aria-busy={exporting || undefined} onClick={exportMine}>
          <span>Tải dữ liệu của tôi (Excel)</span><span className="l-act-end">{exporting ? <Spinner /> : <Icon name="download" size={18} />}</span>
        </button>
        {phoneOn ? (
          <LichConfirm className="l-act" busy={withdraw.isPending} focusAfter={focusDataTitle}
            title="Rút đồng ý?" description="CLB sẽ không dùng số điện thoại của bạn nữa." confirm="Rút đồng ý" onConfirm={() => withdraw.mutate()}>
            <span>Rút đồng ý lưu số điện thoại</span>
            <span className="l-act-end">{withdraw.isPending ? <Spinner /> : <Icon name="chevronRight" size={18} />}</span>
          </LichConfirm>
        ) : (
          // Không còn gì để làm: chỉ là một dòng trạng thái, không phải nút bị khóa.
          <p className="l-act-status l-act-text">{phone?.withdrawnAt ? `Đã rút đồng ý lưu số điện thoại ngày ${dm(phone.withdrawnAt)}` : "Bạn không cho lưu số điện thoại"}</p>
        )}
        <AnimatePresence initial={false} mode="wait">
          {requested ? (
            <m.div key="sent" className="l-act-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <DeletionDue requestedAt={requested} />
            </m.div>
          ) : (
            <m.div key="ask" exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: "easeIn" }}>
              <LichConfirm className="l-act" busy={deletion.isPending} focusAfter={focusDataTitle}
                title={`Rời ${data.club.name} và xóa dữ liệu của bạn?`} description="Việc này không hoàn tác được." confirm="Rời CLB và xóa" onConfirm={() => deletion.mutate()}>
                <span>Rời CLB và xóa dữ liệu</span><span className="l-act-end">{deletion.isPending ? <Spinner /> : <Icon name="chevronRight" size={18} />}</span>
              </LichConfirm>
            </m.div>
          )}
        </AnimatePresence>
      </section>

      <FinePrint />
    </Reveal>
  );
}

/** Đã gửi yêu cầu xóa: hạn CLB phải xử lý là một tờ lịch đếm ngày. */
function DeletionDue({ requestedAt }: { requestedAt: string }) {
  const due = Date.parse(requestedAt) + DELETION_DAYS * 86_400_000;
  return (
    <>
      <Leaf date={due} sub={dueLabel(due)} tone={isUrgent(due) ? "urgent" : undefined} label={`Hạn xử lý yêu cầu xóa ${dmy(due)}, ${dueLabel(due)}`} />
      <span className="l-field">
        <span className="l-act-status-title">Đã gửi yêu cầu xóa ngày {dm(requestedAt)}</span>
        <span className="l-note">CLB xử lý xong trước ngày {dmy(due)}.</span>
      </span>
    </>
  );
}
