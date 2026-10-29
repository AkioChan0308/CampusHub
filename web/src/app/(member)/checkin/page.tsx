"use client";

// Mở từ mã QR điểm danh: /checkin?e=<buổi>&t=<mã 30 giây>, thế giới "Lịch bloc".
// Gửi POST /checkin; máy chủ kiểm tra mã (ký bằng khóa bí mật), buổi đã mở chưa, người quét có ở CLB không,
// và "mỗi điện thoại chỉ điểm danh cho một người trong một buổi". Xong thì sang màn "Đã điểm danh".
// Các trường hợp lỗi chưa có trong bản vẽ: làm tạm, ghi ở web/README.md.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import type { CheckinRes } from "@contract";
import { ApiError, apiPost, setTabDemoUser } from "@/api/client";
import { ErrorGate } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LeafSkel, LichPage, Loading } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { useStore } from "@/lib/browser-state";

export default function Page() {
  return <Suspense fallback={<Checking />}><CheckIn /></Suspense>;
}

/** Đang gửi mã lên máy chủ. Next dựng sẵn phần này lúc build, nên tờ lịch là tờ giữ chỗ (không mang ngày build). */
function Checking() {
  return (
    <PhoneFrame brand>
      <Loading className="l-result" label="Đang điểm danh…">
        <LeafSkel sub="Thứ Bảy" />
        <p className="l-result-lead" aria-hidden="true">Đang điểm danh…</p>
      </Loading>
    </PhoneFrame>
  );
}

/** Tiêu đề và câu giải thích của từng lỗi máy chủ trả về. */
function problemText(e: ApiError): [string, string] {
  const club = typeof e.details?.clubName === "string" ? e.details.clubName : "CLB";
  switch (e.code) {
    case "NOT_FOUND": return ["Không tìm thấy buổi này", "Mã QR không đúng. Quét lại mã đang chiếu trên màn hình."];
    case "CHECKIN_NOT_OPEN": return ["Buổi này chưa mở điểm danh", "Chờ ban điều hành mở mã QR rồi quét lại."];
    // Ban điều hành vẫn điểm danh tay được sau khi đóng (màn chiếu QR giữ nút "Điểm danh tay").
    case "CHECKIN_CLOSED": return ["Buổi này đã đóng điểm danh", "Nếu bạn có mặt mà chưa điểm danh, nhờ ban điều hành điểm danh tay."];
    case "QR_INVALID": return ["Mã QR đã hết hạn", "Mã đổi mỗi 30 giây. Quét lại mã đang chiếu trên màn hình."];
    case "NOT_MEMBER": return ["Bạn chưa là thành viên CLB này", `Gửi đơn xin vào ${club}. Khi được duyệt, bạn điểm danh từ buổi sau.`];
    case "INVITE_PENDING": return ["Bạn chưa nhận lời mời của CLB", `Nhận lời mời của ${club} rồi quét lại mã. Hoặc nhờ ban điều hành điểm danh tay.`];
    case "DEVICE_USED": return ["Điện thoại này đã điểm danh cho người khác", "Mỗi điện thoại chỉ điểm danh cho một người trong một buổi. Nhờ ban điều hành điểm danh tay cho bạn."];
    default: return ["Chưa điểm danh được", e.message];
  }
}

function CheckIn() {
  const params = useSearchParams();
  const eventId = params.get("e") ?? "";
  const token = params.get("t") ?? "";
  const demoPersona = params.get("as"); // chỉ có ở bản demo: chọn người điểm danh từ màn chiếu QR
  const { deviceId, choosePersona } = useStore();
  const router = useRouter();
  // Mỗi lần thử chỉ gửi một lần (React chạy effect hai lần khi phát triển). Bấm "Thử lại" thì tăng attempt để gửi lại.
  const [attempt, setAttempt] = useState(0);
  const sent = useRef(-1);
  const [problem, setProblem] = useState<unknown>(null);

  useEffect(() => {
    if (sent.current === attempt) return;
    sent.current = attempt;
    // Bản demo: tab này điểm danh bằng vai được chọn ở màn chiếu QR (header X-Demo-User), tab chiếu QR không đổi người.
    if (demoPersona) {
      setTabDemoUser(demoPersona);
      choosePersona(demoPersona);
    }
    if (!eventId || !token) {
      setProblem(new ApiError(404, "NOT_FOUND", "Không tìm thấy buổi này."));
      return;
    }
    apiPost<CheckinRes>("/checkin", { eventId, token, deviceId })
      .then(() => router.replace(`/me/attendance?checkedIn=1&e=${encodeURIComponent(eventId)}`))
      .catch(setProblem);
  }, [attempt, eventId, token, demoPersona, deviceId, choosePersona, router]);

  if (!problem) return <Checking />;
  // Chưa đăng nhập: sang trang đăng nhập rồi quay lại đúng link này. Lỗi mạng: cho thử lại.
  if (!(problem instanceof ApiError) || problem.status === 401 || problem.status === 0 || problem.status >= 500) {
    return <ErrorGate error={problem} onRetry={() => { setProblem(null); setAttempt((n) => n + 1); }} />;
  }

  const [title, body] = problemText(problem);
  const clubId = typeof problem.details?.clubId === "string" ? problem.details.clubId : undefined;
  const inviteCode = typeof problem.details?.inviteCode === "string" ? problem.details.inviteCode : undefined;
  return (
    <LichPage>
      <PhoneFrame brand>
        <div className="l-result" role="alert">
          <TodayLeaf />
          <h1 className="l-result-title">{title}</h1>
          <p className="l-result-lead">{body}</p>
        </div>
        <div className="l-actions">
          {problem.code === "NOT_MEMBER" && clubId && <Link className="l-btn l-lg" href={`/explore/${clubId}`}>Xem CLB và gửi đơn</Link>}
          {problem.code === "INVITE_PENDING" && inviteCode && <Link className="l-btn l-lg" href={`/invite/${inviteCode}`}>Xem lời mời</Link>}
          {problem.code !== "NOT_MEMBER" && problem.code !== "INVITE_PENDING" && <Link className="l-btn2 l-lg" href="/me/attendance">Xem lịch sử điểm danh</Link>}
        </div>
      </PhoneFrame>
    </LichPage>
  );
}
