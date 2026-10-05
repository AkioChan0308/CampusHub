// Khung xương của màn đóng quỹ, dùng chung cho /me/pay (đang tìm đợt thu rồi chuyển sang) và /me/pay/:collectionId,
// để lúc chuyển từ trang này sang trang kia khung không đổi hình.

import { LeafSkel, Loading, Skel } from "@/components/lich/motion";

/** Khung xương của màn đóng quỹ: đúng chỗ của số tiền, tờ lịch hạn đóng, mã QR, người nhận, nội dung và hai nút. */
export function PaySkeleton() {
  return (
    <Loading className="l-pay-body">
      <div className="l-pay-top">
        <span className="l-pay-title"><Skel w="80%" h={26} /><Skel w="56%" h={34} /><Skel w="44%" h={14} /></span>
        <LeafSkel />
      </div>
      <section className="l-pay-card">
        <Skel w={160} h={160} className="l-skel-qr" />
        <Skel w="66%" h={13} className="l-skel-center" />
        <div className="l-receiver"><Skel w={74} h={13} /><Skel w="46%" h={18} /><Skel w="88%" h={14} /></div>
        <div className="l-coderow"><span className="l-field"><Skel w={140} h={13} /><Skel w={150} h={20} /></span><Skel w={44} h={44} /></div>
      </section>
      <span className="l-field"><Skel w="100%" h={13} /><Skel w="94%" h={13} /><Skel w="58%" h={13} /></span>
      <div className="l-actions"><Skel w="100%" h={48} /><Skel w="100%" h={48} /></div>
    </Loading>
  );
}
