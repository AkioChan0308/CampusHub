"use client";

// Trang đầu (landing) cho người chưa đăng nhập. Đã đăng nhập thì src/proxy.ts chuyển đi trước khi trang được vẽ.
// Mô tả Hiệu duyệt ngày 05/10/2026: viết cho ban điều hành, thành viên và khách; không số liệu tự đặt, không lời khen giả.
// Bố cục xếp chồng như framer.com (Hiệu chọn): câu chính và hai nút ở trên, ngay dưới là video thành viên dùng trên điện thoại;
// cuộn xuống là video ban điều hành dùng trên laptop. Hai video quay từ bản demo bằng e2e/record-demo-videos.cjs.
// Cuộn xuống thì khối tiếp theo trượt từ trái vào, khối đã xem trượt sang phải và mờ đi (ScrollFade, Hiệu yêu cầu).
// Bên phải tiêu đề có cuốn lịch 3D, cuộn thì xé từng tờ (LeafStage, Hiệu yêu cầu 29/10/2026); thiếu điều kiện thì không có gì.

import Link from "next/link";
import { useHealth } from "@/api/queries";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LeafStage } from "@/components/lich/fx/LeafStage";
import { LichPage, LinkIcon } from "@/components/lich/motion";
import { DemoVideo, ScrollFade, type DemoStep } from "./demo-video";

const MEMBER_STEPS: DemoStep[] = [
  { key: "login", title: "Đăng nhập", text: "Bằng Google, hoặc tên tài khoản và mật khẩu." },
  { key: "invite", title: "Nhận lời mời", text: "Mở link CLB gửi trong nhóm Zalo. Bạn tự chọn cho CLB lưu những gì." },
  { key: "check-in", title: "Quét mã điểm danh", text: "Mã QR đổi mỗi 30 giây. Mỗi điện thoại chỉ điểm danh cho một người." },
  { key: "pay", title: "Đóng quỹ", text: "Chuyển khoản thẳng cho thủ quỹ bằng mã QR, rồi báo đã chuyển." },
  { key: "me", title: "Của tôi", text: "Xem buổi đã đi, khoản đã đóng. Tải hoặc xóa dữ liệu của mình." },
];

const BOARD_STEPS: DemoStep[] = [
  { key: "login", title: "Đăng nhập", text: "Trang chủ CLB liệt kê những việc đang chờ bạn." },
  { key: "check-in", title: "Chiếu mã điểm danh", text: "Ai vừa quét mã thì tên hiện ngay trên màn chiếu." },
  { key: "reconcile", title: "Đối soát sao kê", text: "Tải file sao kê ngân hàng, khoản đóng quỹ tự khớp theo nội dung chuyển khoản." },
  { key: "expenses", title: "Duyệt chi", text: "Không ai tự duyệt khoản mình đề xuất. Từ chối thì phải ghi lý do." },
  { key: "handover", title: "Bàn giao", text: "Chốt số dư, đổi tài khoản nhận quỹ, chuyển quyền cho nhiệm kỳ sau." },
];

export default function Landing() {
  const health = useHealth();
  const demo = health.data?.authMode === "demo";
  return (
    <LichPage>
      <div className="lich l-land-page">
        <header className="l-land-bar">
          <Link className="l-brand" href="/"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></Link>
          <nav className="l-land-nav" aria-label="Tài khoản">
            <Link className="l-land-link" href="/login?next=%2Fexplore">Tìm CLB</Link>
            <Link className="l-btn2" href="/login">Đăng nhập</Link>
            <Link className="l-btn" href="/register">Đăng ký</Link>
          </nav>
        </header>
        <main className="l-land">
          {/* Nằm ngoài ScrollFade để không mờ theo khối hero khi đang xé lịch. */}
          <LeafStage />
          <ScrollFade className="l-land-hero" labelledBy="land-title">
            <div className="l-land-head">
              <TodayLeaf />
              <h1 id="land-title">Cả tuần của CLB, trên một cuốn lịch.</h1>
            </div>
            <div className="l-land-sub">
              <div className="l-land-copy">
                <p className="l-land-lead">Bộ bàn giao cho ban điều hành CLB, dùng cạnh Google Sheets: biểu mẫu, cách làm và tài khoản của CLB nằm một chỗ, việc cần làm có người phụ trách, nhiệm kỳ sau không phải gọi hỏi nhiệm kỳ trước. Điểm danh bằng mã QR và ghi sổ quỹ đi kèm. Thành viên chỉ cần mở link CLB gửi trong nhóm Zalo, không cài app.</p>
                <div className="l-land-actions">
                  <Link className="l-btn" href="/register">Đăng ký bằng Google</Link>
                  <Link className="l-btn2" href="/login">Đăng nhập</Link>
                </div>
              </div>
              {/* Chưa biết máy chủ chạy bản demo hay bản thật thì giữ chỗ mà chưa hiện, để link không đổi chữ trước mắt người xem. */}
              <p className={health.isPending ? "l-land-aside l-hold" : "l-land-aside l-fade-in"}>
                {demo
                  ? <Link href="/login">Bản demo: đăng nhập bằng tài khoản mẫu<LinkIcon name="chevronRight" size={16} /></Link>
                  : <Link href="/login?next=%2Fexplore">Tìm CLB của trường bạn<LinkIcon name="chevronRight" size={16} /></Link>}
              </p>
            </div>
          </ScrollFade>

          <ScrollFade className="l-vid member" labelledBy="demo-member">
            <div className="l-vid-head">
              <h2 id="demo-member">Thành viên điểm danh, đóng quỹ ngay trên điện thoại.</h2>
              <p>Không cài app. Link mở được ngay trong Zalo và Messenger.</p>
            </div>
            <DemoVideo name="member" device="phone" layout="side" steps={MEMBER_STEPS}
              label="Video: thành viên đăng nhập, nhận lời mời, quét mã điểm danh, đóng quỹ và xem trang Của tôi trên điện thoại" />
            <p className="l-vid-note">Quay từ bản demo, dữ liệu mẫu.</p>
          </ScrollFade>

          <ScrollFade className="l-vid board" labelledBy="demo-club-admin">
            <div className="l-vid-head">
              <h2 id="demo-club-admin">Ban điều hành lo việc cả nhiệm kỳ trên laptop.</h2>
              <p>Từ buổi sinh hoạt đầu tiên tới ngày bàn giao cho nhiệm kỳ sau.</p>
            </div>
            <DemoVideo name="club-admin" device="laptop" layout="below" steps={BOARD_STEPS}
              label="Video: chủ nhiệm đăng nhập, chiếu mã QR điểm danh, đối soát sao kê, duyệt chi và bàn giao nhiệm kỳ trên laptop" />
            <p className="l-vid-note">Quay từ bản demo, dữ liệu mẫu.</p>
          </ScrollFade>

          <ScrollFade className="l-land-trust" small><p>CampusHub không giữ tiền: tiền đóng quỹ đi thẳng vào tài khoản của CLB, CampusHub chỉ ghi sổ.</p></ScrollFade>
        </main>
        <footer className="l-land-foot">
          <span>CampusHub · dự án môn EXE101 của nhóm NeedSleep, ĐH FPT TP.HCM.</span>
          {demo && <span>Bản demo dùng dữ liệu mẫu.</span>}
        </footer>
      </div>
    </LichPage>
  );
}
