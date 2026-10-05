"use client";

// Ban điều hành · mục "Đợt thu" khi chưa biết đợt nào: có đợt thu thì chuyển sang đợt tạo gần nhất,
// CLB chưa có đợt thu nào thì mời tạo (trạng thái chưa có bản vẽ, mô tả được Hiệu duyệt ngày 04/10/2026).

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCollections } from "@/api/queries";
import { BoardFrame, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, LinkIcon, Reveal } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { CollectionSkeleton } from "./parts";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useCollections(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="collection" fallback={<CollectionSkeleton />}>
        <CollectionsIndex />
      </BoardFrame>
    </LichPage>
  );
}

function CollectionsIndex() {
  const { club, me } = useLichBoard();
  const router = useRouter();
  const query = useCollections(club.id);
  const latest = query.data?.collections[0]?.id;

  useEffect(() => {
    if (latest) router.replace(`/clubs/${club.id}/collections/${latest}`);
  }, [latest, club.id, router]);

  if (query.isError) return <><PageTop title="Đợt thu" /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  if (!query.data || latest) return <CollectionSkeleton />;

  const canMoney = can(me.role, "money");
  return (
    <>
      <PageTop title="Đợt thu" sub={`Học kỳ ${club.term} · CLB chưa có đợt thu nào.`} />
      <Reveal from className="l-sheet">
        <div className="l-sec l-sec-pad l-start">
          <p>Tạo đợt thu để mỗi thành viên có mã chuyển khoản riêng, hạn đóng, và để thủ quỹ biết ai đã đóng, ai chưa.</p>
          {canMoney
            ? <Link className="l-btn" href={`/clubs/${club.id}/collections/new`}><LinkIcon name="plus" size={18} />Tạo đợt thu</Link>
            : <p className="l-note">{RIGHT_LABEL.money}</p>}
        </div>
      </Reveal>
    </>
  );
}
