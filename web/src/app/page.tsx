"use client";

// Trang chọn vai của bản demo: bấm một vai là đăng nhập nhanh bằng tài khoản mẫu (POST /auth/dev-login).
// Máy chủ chạy chế độ Google (AUTH_MODE=google) thì không còn trang này: chuyển sang /login hoặc trang của người đã đăng nhập.

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, apiGet, apiPost, setTabDemoUser } from "@/api/client";
import { homeFor } from "@/api/home";
import { keys, useHealth, useMe } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { LichConfirm } from "@/components/lich/Confirm";
import { LichLoading } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, Spinner } from "@/components/lich/motion";
import { money } from "@/lib/format";
import { MENTOR_THRESHOLD, membershipOf, person, personName } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { AppState } from "@/lib/types";

const CLUB = "cau-long-san-nha";

/** Tên người lấy từ dữ liệu mẫu; detail là phần sau dấu "·" (tên CLB, ban), không có thì để trống. */
const PERSONAS: { id: string; title: string; href: string; note: string; detail?: (s: AppState) => string | undefined }[] = [
  { id: "a001", title: "Chủ nhiệm CLB", href: `/clubs/${CLUB}`, note: "Việc cần làm, duyệt đơn xin vào, chiếu QR điểm danh, dự trù, bàn giao", detail: (s) => s.clubs.find((c) => c.id === CLUB)?.name },
  { id: "a002", title: "Thủ quỹ", href: `/clubs/${CLUB}/reconcile`, note: "Đợt thu, đối soát sao kê, ghi tiền mặt, ghi đã chi" },
  { id: "a005", title: "Trưởng ban", href: `/clubs/${CLUB}/expenses`, note: "Duyệt khoản chi do chủ nhiệm đề xuất", detail: (s) => { const d = membershipOf(s, CLUB, "a005")?.department; return d && `ban ${d}`; } },
  { id: "a017", title: "Thành viên", href: "/me", note: "Điểm danh, đóng quỹ, dữ liệu của tôi" },
  { id: "a022", title: "Thành viên mới được mời", href: "/invite/moi-a022", note: "Nhận lời mời và đồng ý lưu dữ liệu" },
  { id: "p-bao-chau", title: "Sinh viên chưa vào CLB", href: "/explore", note: "Tìm CLB, gửi đơn xin vào" },
  { id: "p-thu-trang", title: "Ban quản lý CLB của trường", href: "/school", note: `Xem các CLB, duyệt khoản chi trên ${money(MENTOR_THRESHOLD)}`, detail: () => "kiêm mentor" },
];

export default function DemoStart() {
  const { state, choosePersona, reset } = useStore();
  const router = useRouter();
  const client = useQueryClient();
  const health = useHealth();
  const google = health.data?.authMode === "google";
  const me = useMe();
  const current = person(state, state.persona);

  useEffect(() => {
    if (!google) return;
    if (me.data) router.replace(homeFor(me.data));
    else if (me.isError) router.replace("/login");
  }, [google, me.data, me.isError, router]);

  // Vai đang đăng nhập: nút đó hiện vòng xoay, bấm thêm không gửi lần hai.
  const [picking, setPicking] = useState<string | null>(null);

  async function pick(p: (typeof PERSONAS)[number]) {
    if (picking) return;
    setPicking(p.id);
    try {
      await apiPost("/auth/dev-login", { personId: p.id });
    } catch (e) {
      setPicking(null);
      toast.error(e instanceof ApiError ? e.message : "Chưa đăng nhập được. Thử lại sau.");
      return;
    }
    setTabDemoUser(null); // tab này dùng phiên vừa đăng nhập, bỏ vai riêng của tab (nếu có)
    client.clear(); // bỏ dữ liệu đã tải của vai trước
    // Màn đã nối máy chủ: bắt đầu tải dữ liệu ngay, để mở ra là có số, không phải chờ khung xương.
    const club = /^\/clubs\/([^/]+)$/.exec(p.href)?.[1];
    if (club) {
      void client.prefetchQuery({ queryKey: keys.board(club), queryFn: () => apiGet(`/clubs/${club}/board`) });
      void client.prefetchQuery({ queryKey: keys.dashboard(club), queryFn: () => apiGet(`/clubs/${club}/dashboard`) });
    }
    choosePersona(p.id);
    router.push(p.href);
  }

  async function resetAll() {
    try {
      await apiPost("/demo/reset");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Chưa đặt lại được dữ liệu trên máy chủ. Thử lại sau.");
      return;
    }
    client.clear();
    reset();
    toast.success("Đã đặt lại dữ liệu mẫu.");
  }

  if (google) return <LichLoading />;

  return (
    <LichPage>
      <div className="lich">
        <main className="l-demo">
          <div className="l-demo-sheet">
            <header className="l-demo-head">
              <div className="l-brand"><span className="l-logo" aria-hidden="true">C</span><span className="l-brand-name">CampusHub</span></div>
              <div className="l-login-head">
                <TodayLeaf />
                <h1>Bản demo giao diện</h1>
              </div>
              <p className="l-demo-lead">
                Bản demo chạy cùng máy chủ CampusHub trên máy này, mọi màn đều lấy dữ liệu từ máy chủ. Dữ liệu là dữ liệu mẫu tự đặt.
                Bấm một vai để đăng nhập nhanh bằng tài khoản mẫu, hoặc <Link href="/login">đăng nhập bằng Google</Link>.
              </p>
              {current && <p className="l-note">Đang xem với vai: <strong>{current.name}</strong></p>}
            </header>

            <ul className="l-demo-roles" aria-label="Chọn vai">
              {PERSONAS.map((p) => (
                <li key={p.id}>
                  <button type="button" className="l-demo-role" aria-busy={picking === p.id || undefined} onClick={() => pick(p)}>
                    <span className="l-demo-role-title">{p.title}</span>
                    <span className="l-demo-role-who">{[personName(state, p.id), p.detail?.(state)].filter(Boolean).join(" · ")}</span>
                    <span className="l-demo-role-note">{p.note}</span>
                    <span className="l-demo-role-go">{picking === p.id ? <Spinner /> : <Icon name="chevronRight" size={20} />}</span>
                  </button>
                </li>
              ))}
            </ul>

            <section className="l-demo-try" aria-labelledby="thu-nhanh">
              <h2 id="thu-nhanh">Thử nhanh các luồng chính</h2>
              <ol>
                <li>Chọn <strong>Chủ nhiệm</strong>, bấm “Mở QR điểm danh” rồi “Bắt đầu điểm danh”. Dưới mã QR, chọn một thành viên rồi bấm “Mở link điểm danh”: một tab mới điểm danh bằng vai đó, và tab chiếu QR thấy tên người vừa điểm danh. Thử thêm người thứ hai trên cùng trình duyệt để thấy luật “mỗi điện thoại chỉ điểm danh cho một người”.</li>
                <li>Chọn <strong>Sinh viên chưa vào CLB</strong>, gửi đơn vào CLB Cầu lông. Chuyển sang <strong>Chủ nhiệm</strong>, duyệt đơn ở mục Thành viên.</li>
                <li>Chọn <strong>Thủ quỹ</strong>, gán tay các giao dịch chưa khớp ở Đối soát sao kê: Đợt thu và Trang chủ đổi số theo.</li>
                <li>Chọn <strong>Trưởng ban</strong>, duyệt khoản “Mua 2 ống cầu” do chủ nhiệm đề xuất. Chủ nhiệm không tự duyệt được khoản của mình.</li>
                <li>Chọn <strong>Ban quản lý CLB của trường</strong>, duyệt khoản chi đang chờ mentor. Sau đó thủ quỹ ghi đã chi, và Dự trù kỳ đổi theo.</li>
              </ol>
              <div>
                <LichConfirm className="l-btn2" title="Đặt lại dữ liệu mẫu?" description="Xóa mọi thay đổi bạn đã làm và quay về dữ liệu mẫu ban đầu." confirm="Đặt lại"
                  onConfirm={resetAll}>
                  Đặt lại dữ liệu mẫu
                </LichConfirm>
              </div>
            </section>
          </div>
        </main>
      </div>
    </LichPage>
  );
}
