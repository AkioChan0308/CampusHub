"use client";

// Thành viên · tab Quỹ. CLB đang có đợt thu thì chuyển sang màn đóng quỹ của đợt đó (TV-DongQuy).
// Chưa có đợt thu nào thì báo một dòng: trạng thái này bản vẽ chưa có, được duyệt ngày 03/10/2026.
// Trong lúc tìm đợt thu và chuyển trang: khung xương của màn đóng quỹ, nên sang màn kia không đổi hình.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe, useMyClub } from "@/api/queries";
import { useActiveMembership } from "@/api/active-club";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Reveal, useSawPending } from "@/components/lich/motion";
import { NoClubGate } from "@/components/lich/NoClub";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { PaySkeleton } from "./pay-skeleton";

export default function Page() {
  const router = useRouter();
  const me = useMe();
  const membership = useActiveMembership(me.data);
  const club = useMyClub(membership?.clubId);
  const saw = useSawPending(!club.data);
  const collectionId = club.data?.collection?.id;

  useEffect(() => {
    if (collectionId) router.replace(`/me/pay/${collectionId}`);
  }, [collectionId, router]);

  const error = me.error ?? club.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void me.refetch(); void club.refetch(); }} />;
  if (me.data && !membership) return <NoClubGate me={me.data} />;
  const empty = me.data && club.data && !collectionId;

  return (
    <LichPage>
      <PhoneFrame clubName={empty ? club.data?.club.name : undefined} personName={me.data?.person.name} tab="pay" fade={saw}>
        {empty ? (
          <Reveal from={saw} className="l-pay-body">
            <h1 className="l-phone-title">Đóng quỹ</h1>
            <p className="l-fine">CLB chưa mở đợt thu nào. Khi thủ quỹ mở đợt thu, mã chuyển khoản sẽ hiện ở đây.</p>
          </Reveal>
        ) : <PaySkeleton />}
      </PhoneFrame>
    </LichPage>
  );
}
