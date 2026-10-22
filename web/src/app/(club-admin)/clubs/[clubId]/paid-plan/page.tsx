"use client";

// Ban điều hành · Bản trả phí (22/10/2026; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.5). Chỉ là trang mô tả, một GIẢ THUYẾT:
// chưa có giá, chưa có bằng chứng ai trả tiền, chưa có thanh toán. Chữ ở đây không hứa gì ngoài những gì file mô tả ghi.

import Link from "next/link";
import { useParams } from "next/navigation";
import { BoardFrame } from "@/components/lich/BoardFrame";
import { LichPage, Loading, LinkIcon, Skel, SkelLine } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";

const TITLE = "Bản trả phí";
const ROWS: [string, string][] = [
  ["Tóm tắt bàn giao cơ bản mỗi kỳ", "Tóm tắt sâu, nhiều phiên bản, so sánh với kỳ trước"],
  ["Hỏi đáp trong Kho bàn giao, giới hạn lượt theo kỳ", "Hỏi đáp không giới hạn lượt"],
  ["", "Thống kê tham gia, báo cáo cho trường"],
];

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="home" fallback={<><PageTop title={TITLE} sub={<SkelLine w={280} />} /><Loading className="l-sheet"><Skel w="100%" h={260} /></Loading></>}>
        <PageTop title={TITLE} sub="Một ý tưởng đang thử, chưa phải sản phẩm bán" />
        <div className="l-sheet">
          <section className="l-sec" aria-labelledby="plan-title">
            <div className="l-sec-head"><h2 id="plan-title">Bản miễn phí và bản trả phí</h2></div>
            <div className="l-table-wrap">
              <table className="l-table">
                <thead><tr><th>Miễn phí</th><th>Trả phí (ý tưởng)</th></tr></thead>
                <tbody>{ROWS.map(([free, paid]) => <tr key={paid}><td>{free || <span className="l-note">Không có</span>}</td><td>{paid}</td></tr>)}</tbody>
              </table>
            </div>
            <ul className="l-ho-list l-sec-pad">
              <li>Chưa có giá và chưa có bằng chứng có CLB nào trả tiền. Chưa có thanh toán trong CampusHub.</li>
              <li>Không khóa phần cốt lõi: bàn giao, kho bàn giao, việc cần làm, điểm danh và sổ quỹ luôn miễn phí.</li>
              <li>Bàn giao diễn ra khoảng mỗi kỳ một lần, nên mọi giới hạn tính theo kỳ, không theo ngày.</li>
              <li>"Thống kê tham gia" là phân tích tự động từ dữ liệu điểm danh (phép đếm), không phải AI.</li>
              <li>Quảng cáo mẫu chỉ có ở bản miễn phí, không nhắm theo người dùng.</li>
            </ul>
            <div className="l-sec-pad"><Link className="l-btn2" href={`/clubs/${clubId}`}><LinkIcon name="chevronLeft" size={18} />Về trang chủ CLB</Link></div>
          </section>
        </div>
      </BoardFrame>
    </LichPage>
  );
}
