"use client";

// Ban điều hành · Đợt thu: ai đã đóng (design/screens/BDH-DotThu.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/collections/:collectionId. Ghi tiền mặt, ghi nhận tay: POST .../payments/:personId.
// Số tiền do máy chủ tính (phần còn thiếu của người đó); quyền ghi tiền kiểm tra ở máy chủ.

import * as m from "motion/react-m";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { CollectionRes, PaymentRowDto, RecordPaymentRes } from "@contract";
import { apiPost } from "@/api/client";
import { useClubMutation, useCollection } from "@/api/queries";
import { CopyButton } from "@/components/CopyButton";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate } from "@/components/lich/Gate";
import { dueLabel, isUrgent, Leaf } from "@/components/lich/Leaf";
import { LichPage, LinkIcon, Reveal, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop } from "@/components/lich/PageTop";
import { PayTag } from "@/components/lich/PayTag";
import { CollectionSkeleton, CollectionTabs, COLUMNS, EditCollection, WIDTHS } from "../collection-shared";
import { appUrl } from "@/components/url";
import { dm, dmy, money } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { ROLE_LABEL } from "@/lib/types";

// Số dòng hiện trước khi bấm "Xem tiếp", theo bản vẽ ("Đang hiện 7/42").
const FIRST_ROWS = 7;
const LOCK_ID = "ly-do-khoa-tien";

export default function Page() {
  const { clubId, collectionId } = useParams<{ clubId: string; collectionId: string }>();
  useCollection(clubId, collectionId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="collection" fallback={<CollectionSkeleton />}>
        <CollectionView collectionId={collectionId} />
      </BoardFrame>
    </LichPage>
  );
}

type Filter = "all" | "unpaid" | "reported" | "paid";

const METHOD_LABEL = { transfer: "Chuyển khoản", cash: "Tiền mặt" } as const;

function CollectionView({ collectionId }: { collectionId: string }) {
  const { club, me } = useLichBoard();
  const query = useCollection(club.id, collectionId);
  const sawHere = useSawPending(query.isPending);
  const sawFrame = useFrameSawPending();
  if (query.isPending) return <CollectionSkeleton />;
  if (query.isError) {
    return <><PageTop title="Đợt thu" /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  }
  return <CollectionBody data={query.data} clubId={club.id} canMoney={can(me.role, "money")} fade={sawHere || sawFrame} />;
}

function CollectionBody({ data, clubId, canMoney, fade }: { data: CollectionRes; clubId: string; canMoney: boolean; fade: boolean }) {
  const { collection, stats, payments } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  // Người vừa được ghi nhận: nhãn trạng thái của dòng đó hiện dần để thấy chỗ vừa đổi.
  const [justRecorded, setJustRecorded] = useState<string | null>(null);
  const record = useClubMutation(clubId,
    (v: { personId: string; method: "cash" | "transfer"; name: string }) =>
      apiPost<RecordPaymentRes>(`/clubs/${clubId}/collections/${collection.id}/payments/${v.personId}`, { method: v.method }),
    {
      onSuccess: (res, v) => {
        setJustRecorded(v.personId);
        const amount = money(res.payment.amountPaid);
        toast.success(v.method === "cash" ? `Đã ghi: ${v.name} đóng ${amount} tiền mặt.` : `Đã ghi: ${v.name} chuyển khoản ${amount}.`);
      },
    });

  const rows = payments.filter((p) =>
    filter === "all" ? true : filter === "unpaid" ? p.status === "unpaid" || p.status === "partial" : p.status === filter);
  const visible = showAll ? rows : rows.slice(0, FIRST_ROWS);
  const due = (p: PaymentRowDto) => collection.amount - p.amountPaid;
  const busyFor = (personId: string) => record.isPending && record.variables?.personId === personId;

  const chip = (key: Filter, label: string) => (
    <button type="button" className="l-chip" aria-pressed={filter === key} onClick={() => { setFilter(key); setShowAll(false); }}>{label}</button>
  );

  return (
    <>
      <PageTop
        title={collection.name}
        sub={`${money(collection.amount)}/người · hạn ${dmy(collection.dueDate)} · tiền vào tài khoản của ${collection.receiver.name}${collection.receiver.role ? ` (${ROLE_LABEL[collection.receiver.role].toLowerCase()})` : ""}`}
        actions={<>
          {canMoney && <EditCollection clubId={clubId} collection={collection} touched={payments.some((p) => p.status !== "unpaid" || p.amountPaid > 0)} />}
          <CopyButton className="l-btn2" icon="link" text={appUrl(`/me/pay/${collection.id}`)} label="Sao chép link đóng quỹ" notice="Đã sao chép link đóng quỹ. Dán vào nhóm Zalo của CLB." />
          <Link className="l-btn" href={`/clubs/${clubId}/reconcile?collection=${collection.id}`}><LinkIcon name="listCheck" size={18} />Đối soát sao kê</Link>
        </>}
      />

      <Reveal from={fade} className="l-sheet">
        <CollectionTabs clubId={clubId} currentId={collection.id} canMoney={canMoney} />
        <div className="l-sec l-strip lead">
          <div className="l-cell leaf">
            <Leaf date={collection.dueDate} sub={dueLabel(collection.dueDate)} tone={isUrgent(collection.dueDate) ? "urgent" : undefined}
              label={`Hạn đóng ${dmy(collection.dueDate)}, ${dueLabel(collection.dueDate)}`} />
          </div>
          <div className="l-cell">
            <span className="l-cell-label">Đã đóng</span>
            <span className="l-cell-value">{stats.paid} <span className="l-cell-unit">người</span></span>
            <span className="l-cell-note">{money(stats.paidAmount)} · {stats.transfer} chuyển khoản, {stats.cash} tiền mặt</span>
          </div>
          <div className="l-cell">
            <span className="l-cell-label">Báo đã chuyển, chờ đối soát</span>
            <span className="l-cell-value">{stats.reported} <span className="l-cell-unit">người</span></span>
            <span className="l-cell-note">Sẽ khớp khi thủ quỹ tải sao kê</span>
          </div>
          <div className={`l-cell${stats.unpaid > 0 ? " attn" : ""}`}>
            <span className="l-cell-label">Chưa đóng</span>
            <span className="l-cell-value">{stats.unpaid} <span className="l-cell-unit">người</span></span>
            <span className="l-cell-note">{money(stats.unpaidAmount)} chưa thu</span>
          </div>
        </div>

        <div className="l-sec">
          <div className="l-sec-head">
            <div className="l-seg" role="group" aria-label="Lọc theo trạng thái">
              {chip("all", `Tất cả (${payments.length})`)}
              {chip("unpaid", `Chưa đóng (${stats.unpaid})`)}
              {chip("reported", `Báo đã chuyển (${stats.reported})`)}
              {chip("paid", `Đã đóng (${stats.paid})`)}
            </div>
            {!canMoney && <p className="l-note" id={LOCK_ID}>{RIGHT_LABEL.money}</p>}
          </div>
          <div className="l-table-wrap">
            <table className="l-table l-fixed">
              <ColGroup widths={WIDTHS} />
              <thead>
                <tr>{COLUMNS.map((h, i) => <th key={h} className={i === 5 ? "r" : undefined}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.personId}>
                    <td className="name">{p.name}</td>
                    <td className="code">{p.code ? `${collection.codePrefix} ${p.code}` : "–"}</td>
                    <td>
                      <m.span key={p.status} className="l-inline" initial={justRecorded === p.personId ? { opacity: 0, y: 4 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                        <PayTag payment={p} fee={collection.amount} showMethod={false} />
                      </m.span>
                    </td>
                    <td className={p.amountPaid > 0 && p.method ? undefined : "muted"}>{p.amountPaid > 0 && p.method ? METHOD_LABEL[p.method] : "–"}</td>
                    <td className={p.amountPaid > 0 && p.paidAt ? undefined : "muted"}>{p.amountPaid > 0 && p.paidAt ? dm(p.paidAt) : "–"}</td>
                    <td className="r">
                      {p.status === "reported" && (
                        <LichConfirm className="l-btn2 l-sm" disabled={!canMoney} describedBy={canMoney ? undefined : LOCK_ID} busy={busyFor(p.personId)} confirm="Ghi vào sổ"
                          title={`Ghi nhận ${p.name} đã chuyển khoản ${money(due(p))}?`} description="Chỉ bấm khi bạn đã thấy tiền vào tài khoản. Sổ quỹ không sửa, không xóa được."
                          onConfirm={() => record.mutate({ personId: p.personId, method: "transfer", name: p.name })}>Ghi nhận tay</LichConfirm>
                      )}
                      {(p.status === "unpaid" || p.status === "partial") && (
                        <LichConfirm className="l-btn2 l-sm" disabled={!canMoney} describedBy={canMoney ? undefined : LOCK_ID} busy={busyFor(p.personId)} confirm="Ghi vào sổ"
                          title={`Ghi nhận ${p.name} đã đóng ${money(due(p))} tiền mặt?`} description="Sổ quỹ không sửa, không xóa được. Muốn điều chỉnh thì thêm bút toán mới."
                          onConfirm={() => record.mutate({ personId: p.personId, method: "cash", name: p.name })}>Ghi tiền mặt</LichConfirm>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={6} className="l-empty-cell">Không có ai trong nhóm này.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="l-foot">
            <span>{rows.length > 0 && `Đang hiện ${visible.length}/${rows.length}. `}Tiền chuyển thẳng vào tài khoản của {collection.receiver.name}. CampusHub chỉ ghi sổ, không giữ tiền.</span>
            {rows.length > FIRST_ROWS && <button type="button" className="l-btn2 l-sm" onClick={() => setShowAll((v) => !v)}>{showAll ? "Thu gọn" : "Xem tiếp"}</button>}
          </div>
        </div>
      </Reveal>
    </>
  );
}
