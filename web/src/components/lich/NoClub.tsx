"use client";

// Trang chặn của các màn thành viên (Điểm danh, Quỹ, Của tôi) khi người đang xem chưa ở CLB nào đã nhận lời mời.

import Link from "next/link";
import type { MeRes } from "@contract";
import { initials } from "@/lib/format";
import { LichGate } from "./Gate";
import { LichPage, Reveal } from "./motion";
import { PhoneFrame } from "./PhoneFrame";

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

/**
 * Trang Của tôi của người chưa ở CLB nào (Hiệu chốt 29/10/2026): vẫn ra thông tin tài khoản, nhưng các tính năng của thành viên bị khóa
 * và phải tham gia một CLB mới dùng được. Một sinh viên có thể ở nhiều CLB. Khóa kèm câu nhìn thấy được, không để nút xám trơ.
 */
export function MeLocked({ me }: { me: MeRes }) {
  return (
    <LichPage>
      <PhoneFrame brand personName={me.person.name} tab="hub">
        <Reveal from={false} className="l-pay-body">
          <div className="l-profile">
            <span className="l-avatar lg" aria-hidden="true">{initials(me.person.name)}</span>
            <div className="l-field">
              <h1 className="l-phone-title">{me.person.name}</h1>
              <span className="l-meta">{me.person.email}<br />Chưa ở CLB nào</span>
            </div>
          </div>
          <section className="l-pay-card" aria-labelledby="need-club">
            <h2 id="need-club" className="l-subhead">Cần tham gia một CLB</h2>
            <p className="l-fine">Bạn xem được trang chung và gửi đơn xin vào CLB. Điểm danh, đóng quỹ và việc của tôi chỉ mở khi bạn được duyệt vào một CLB. Một sinh viên có thể ở nhiều CLB cùng lúc.</p>
            <Link className="l-btn l-lg" href="/explore">Khám phá CLB</Link>
            <Link className="l-btn2 l-lg" href="/clubs/new">Tạo CLB mới</Link>
          </section>
          <section className="l-pay-card l-list" aria-labelledby="member-features">
            <h2 id="member-features" className="l-list-head">Dành cho thành viên CLB</h2>
            {["Điểm danh", "Đóng quỹ", "Việc của tôi"].map((name) => (
              <div key={name} className="l-kv"><span>{name}</span><span className="l-note">Cần tham gia CLB</span></div>
            ))}
          </section>
        </Reveal>
      </PhoneFrame>
    </LichPage>
  );
}
