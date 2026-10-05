"use client";

// Trang chặn của các màn thành viên (Điểm danh, Quỹ, Của tôi) khi người đang xem chưa ở CLB nào đã nhận lời mời.

import Link from "next/link";
import type { MeRes } from "@contract";
import { LichGate } from "./Gate";

export function NoClubGate({ me }: { me: MeRes }) {
  const invite = me.memberships.find((x) => x.invite === "pending");
  if (invite) {
    return (
      <LichGate title="Bạn chưa nhận lời mời" text={`Nhận lời mời của ${invite.clubName} để điểm danh và đóng quỹ.`}>
        {invite.inviteCode && <Link className="l-btn" href={`/invite/${invite.inviteCode}`}>Xem lời mời</Link>}
      </LichGate>
    );
  }
  if (me.person.kind === "staff") {
    return <LichGate title="Bạn chưa ở CLB nào" text="Trang này dành cho thành viên CLB."><Link className="l-btn" href="/school">Về trang nhà trường</Link></LichGate>;
  }
  return (
    <LichGate title="Bạn chưa ở CLB nào" text="Tìm CLB và gửi đơn xin vào. Khi được duyệt, bạn điểm danh từ buổi sau. Bạn là chủ nhiệm thì tạo CLB mới.">
      <Link className="l-btn" href="/explore">Tìm CLB và gửi đơn</Link>
      <Link className="l-btn2" href="/clubs/new">Tạo CLB mới</Link>
    </LichGate>
  );
}
