"use client";

// Thành viên · Đóng quỹ bằng VietQR (design/screens/TV-DongQuy.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /me/collections/:collectionId; nút "Mình đã chuyển khoản" gọi POST .../report-transfer.
// BẢN DEMO: mã QR ở đây KHÔNG phải mã chuyển khoản thật (máy chủ trả qrIsDemo), quét bằng app ngân hàng sẽ không chuyển được tiền.
// Khi làm thật: máy chủ tạo mã VietQR theo chuẩn NAPAS từ tài khoản của thủ quỹ; CampusHub không giữ tiền.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useParams } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import type { MyPaymentRes } from "@contract";
import { ApiError, apiPost } from "@/api/client";
import { keys, useMe, useMyPayment } from "@/api/queries";
import { CopyButton } from "@/components/CopyButton";
import { ErrorGate } from "@/components/lich/Gate";
import { dueLabel, isUrgent, Leaf } from "@/components/lich/Leaf";
import { LichPage, Reveal, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { PaySkeleton } from "../pay-skeleton";
import { downloadQrPng, QrSvg } from "@/components/Qr";
import { dm, dmy, hm, money } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/types";

export default function PayPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const me = useMe();
  const pay = useMyPayment(collectionId);
  const ready = !!me.data && !!pay.data;
  const saw = useSawPending(!ready);
  // Lỗi của đợt thu (chưa vào CLB, không tìm thấy…) rõ nghĩa hơn lỗi của /me, nên xét trước.
  const error = pay.error ?? me.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void me.refetch(); void pay.refetch(); }} />;
  return (
    <LichPage>
      <PhoneFrame clubName={pay.data?.club.name} personName={me.data?.person.name} tab="pay" payHref={`/me/pay/${collectionId}`} fade={saw}>
        {me.data && pay.data ? <PayView data={pay.data} fade={saw} /> : <PaySkeleton />}
      </PhoneFrame>
    </LichPage>
  );
}

function PayView({ data, fade }: { data: MyPaymentRes; fade: boolean }) {
  const { club, collection, payment, transfer } = data;
  const client = useQueryClient();
  const statusRef = useRef<HTMLDivElement>(null);
  const report = useMutation({
    mutationFn: () => apiPost<MyPaymentRes>(`/me/collections/${collection.id}/report-transfer`),
    onSuccess: (res) => {
      client.setQueryData(keys.myPayment(collection.id), res);
      // Trang Của tôi cũng hiện trạng thái đóng quỹ: cho dữ liệu đã lưu tạm hết hạn, mở lại là tải mới.
      void client.invalidateQueries({ queryKey: keys.myClub(club.id) });
      statusRef.current?.focus();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Chưa báo được. Thử lại sau."),
  });
  const paid = payment.status === "paid";
  const partial = !paid && payment.amountPaid > 0;

  return (
    <Reveal from={fade} className="l-pay-body">
      <div className="l-pay-top">
        <div className="l-pay-title">
          <h1>{collection.name}</h1>
          <span className="l-pay-amount">{money(paid ? collection.amount : transfer.amountDue)}</span>
          <span className="l-meta">
            {paid ? `Mức đóng mỗi người · hạn ${dmy(collection.dueDate)}` : partial ? `Số tiền còn thiếu · bạn đã đóng ${money(payment.amountPaid)}` : `Hạn đóng ${dmy(collection.dueDate)}`}
          </span>
        </div>
        {!paid && (
          <Leaf date={collection.dueDate} sub={dueLabel(collection.dueDate)} tone={isUrgent(collection.dueDate) ? "urgent" : undefined}
            label={`Hạn đóng ${dmy(collection.dueDate)}, ${dueLabel(collection.dueDate)}`} />
        )}
      </div>

      {paid ? (
        <section className="l-pay-card">
          <span className="l-tag ok">Đã đóng</span>
          <p>Bạn đã đóng {money(payment.amountPaid)}{payment.paidAt ? ` ngày ${dm(payment.paidAt)}` : ""}{payment.method === "cash" ? " bằng tiền mặt" : ""}. Không cần làm gì thêm.</p>
        </section>
      ) : (
        <>
          <section className="l-pay-card" aria-label="Chuyển khoản">
            <div className="l-qr"><QrSvg value={transfer.qrPayload} label={`Mã QR đóng ${money(transfer.amountDue)}`} /></div>
            {transfer.qrIsDemo && <p className="l-qr-demo">Bản demo: mã này không chuyển tiền được.</p>}
            <div className="l-receiver">
              <span className="l-label">Người nhận</span>
              <span className="l-receiver-name">{transfer.accountName}</span>
              <span className="l-receiver-sub">{transfer.receiver.role ? ROLE_LABEL[transfer.receiver.role] : "Người nhận quỹ của"} {club.name}, nhiệm kỳ {collection.term} · {transfer.bankLabel} •••• {transfer.last4}</span>
            </div>
            <div className="l-coderow">
              <div className="l-field">
                <span className="l-label">Nội dung chuyển khoản</span>
                <span className="l-code">{transfer.content}</span>
              </div>
              <CopyButton iconOnly className="l-icon-btn" text={transfer.content} label="Sao chép nội dung chuyển khoản" notice="Đã sao chép nội dung chuyển khoản. Dán vào ô nội dung trong app ngân hàng." />
            </div>
          </section>

          <p className="l-fine">
            Giữ nguyên nội dung chuyển khoản để thủ quỹ nhận ra khoản của bạn. Nhờ người khác chuyển hộ thì nhắc họ dán đúng nội dung này. Đóng tiền mặt thì đưa trực tiếp cho thủ quỹ.
          </p>

          <div className="l-actions">
            {/* Vùng báo trạng thái có sẵn từ đầu để trình đọc màn hình đọc khi trạng thái đổi. */}
            <div ref={statusRef} className="l-status" role="status" tabIndex={-1}>
              <AnimatePresence initial={false}>
                {payment.status === "reported" && (
                  <m.div key="reported" className="l-status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut", delay: 0.12 }}>
                    <span className="l-tag wait">Chờ thủ quỹ xác nhận</span>
                    {payment.reportedAt && <p className="l-fine">Bạn báo đã chuyển lúc {hm(payment.reportedAt)} ngày {dm(payment.reportedAt)}.</p>}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            {/* Báo xong thì nút thu lại (cả khoảng cách 10px bên dưới), nhãn trạng thái hiện vào đúng chỗ đó. */}
            <AnimatePresence initial={false}>
              {payment.status !== "reported" && (
                <m.div key="report" className="l-collapse" exit={{ opacity: 0, height: 0, marginBottom: -10 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                  <button type="button" className="l-btn l-lg" aria-busy={report.isPending || undefined} onClick={() => { if (!report.isPending) report.mutate(); }}>Mình đã chuyển khoản</button>
                </m.div>
              )}
            </AnimatePresence>
            <button type="button" className="l-btn2 l-lg" onClick={() => downloadQrPng(transfer.qrPayload, `ma-qr-${collection.id}.png`)}>Lưu ảnh mã QR</button>
          </div>
        </>
      )}
    </Reveal>
  );
}
