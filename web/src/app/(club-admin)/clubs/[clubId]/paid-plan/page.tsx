"use client";

// Ban điều hành · Bản trả phí (22/10/2026; chốt tính năng 30/10/2026, xem docs/tien-do-mvp.md). Chỉ là trang mô tả, một GIẢ THUYẾT:
// giá 99.000 ₫ mỗi CLB mỗi tháng là giả định của nhóm, chưa có bằng chứng ai trả tiền, chưa có thanh toán.
// Bản demo mở hết tính năng; khóa theo gói chỉ bật ở bản chính thức. Hai mục "chưa làm" ghi rõ để không hứa quá.

import Link from "next/link";
import { useParams } from "next/navigation";
import { BoardFrame } from "@/components/lich/BoardFrame";
import { LichPage, Loading, LinkIcon, Skel, SkelLine } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";

const TITLE = "Bản trả phí";
const ROWS: [string, string][] = [
  ["Tối đa 100 thành viên mỗi CLB", "Không giới hạn số thành viên"],
  ["Tóm tắt bàn giao cơ bản mỗi kỳ", "Tóm tắt sâu, nhiều phiên bản, so sánh với kỳ trước (chưa làm)"],
  ["Hỏi đáp trong Kho bàn giao: 10 lượt mỗi CLB mỗi kỳ", "Hỏi đáp không giới hạn lượt"],
  ["", "Thống kê tham gia"],
  ["", "Báo cáo cho trường (chưa làm)"],
  ["Có quảng cáo mẫu, không tắt được ở bản chính thức", "Không có quảng cáo"],
];

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="home" fallback={<><PageTop title={TITLE} sub={<SkelLine w={280} />} /><Loading className="l-sheet"><Skel w="100%" h={260} /></Loading></>}>
        <PageTop title={TITLE} sub="Một ý tưởng đang thử, chưa phải sản phẩm bán. Bản demo mở hết tính năng." />
        <div className="l-sheet">
          <section className="l-sec" aria-labelledby="plan-title">
            <div className="l-sec-head"><h2 id="plan-title">Bản miễn phí và bản trả phí</h2></div>
            <div className="l-table-wrap">
              <table className="l-table">
                <thead><tr><th>Miễn phí</th><th>Trả phí: bỏ trần thành viên và mở các tính năng nâng cao (ý tưởng)</th></tr></thead>
                <tbody>{ROWS.map(([free, paid]) => <tr key={paid}><td>{free || <span className="l-note">Không có</span>}</td><td>{paid}</td></tr>)}</tbody>
              </table>
            </div>
            <ul className="l-ho-list l-sec-pad">
              <li>Giá thử: 99.000 ₫ mỗi CLB mỗi tháng. Đây là giả định của nhóm, chưa có bằng chứng có CLB nào trả tiền, chưa có thanh toán trong CampusHub.</li>
              <li>Ai trả: CLB trên 100 thành viên, hoặc CLB nào muốn các tính năng nâng cao ở bảng trên. Bản miễn phí có trần 100 thành viên (mốc mentor gợi ý) vì tải của hệ thống tăng theo số thành viên; nhóm chưa đo tải nên con số này chưa kiểm.</li>
              <li>Phần cốt lõi (bàn giao, kho bàn giao, việc cần làm, điểm danh, sổ quỹ, quản lý thành viên) miễn phí đến 100 thành viên mỗi CLB. Bản demo chưa chặn số thành viên.</li>
              <li>Bàn giao diễn ra khoảng mỗi kỳ một lần, nên mọi giới hạn tính theo kỳ, không theo ngày.</li>
              <li>"Thống kê tham gia" là phân tích tự động từ dữ liệu điểm danh (phép đếm), không phải AI.</li>
              <li>Quảng cáo mẫu: bản miễn phí có và không tắt được ở bản chính thức, gói trả phí không có. Bản demo vẫn cho ẩn.</li>
            </ul>
            <div className="l-sec-pad"><Link className="l-btn2" href={`/clubs/${clubId}`}><LinkIcon name="chevronLeft" size={18} />Về trang chủ CLB</Link></div>
          </section>
        </div>
      </BoardFrame>
    </LichPage>
  );
}
