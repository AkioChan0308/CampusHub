"use client";

// Thành viên · Lời mời và đồng ý dữ liệu (design/screens/TV-LoiMoi.html), thế giới "Lịch bloc".
// Ô đồng ý không đánh dấu sẵn, tách theo mục đích, có xác nhận đủ 16 tuổi (Luật 91/2025, Nghị định 356/2025).
// Dữ liệu từ GET /invites/:code (chỉ đúng người được mời xem được); "Tham gia CLB" gọi POST /invites/:code/accept.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";
import type { AcceptInviteBody, AcceptInviteRes, InviteRes } from "@contract";
import { ApiError, apiPost } from "@/api/client";
import { errorText, keys, useInvite } from "@/api/queries";
import { ErrorGate, LichGate, useLogout } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, Loading, Reveal, SkelLine, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { ROLE_LABEL } from "@/lib/types";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const invite = useInvite(code);
  const saw = useSawPending(!invite.data);
  const [declined, setDeclined] = useState(false);
  // Đổi qua lại giữa lời mời và "Bạn đã không tham gia": nút vừa bấm biến mất, nên đưa focus tới chỗ tương ứng ở màn mới.
  const [moved, setMoved] = useState(false);

  if (invite.error instanceof ApiError && invite.error.status === 404) {
    return (
      <LichGate title="Link mời không còn dùng được" text={invite.error.message}>
        <Link className="l-btn" href="/me">Vào trang của tôi</Link>
      </LichGate>
    );
  }
  // 401 chuyển sang đăng nhập rồi quay lại link này; 403 là lời mời của tài khoản khác.
  if (invite.error) return <ErrorGate error={invite.error} onRetry={() => invite.refetch()} />;

  return (
    <LichPage>
      <PhoneFrame brand>
        {!invite.data ? <InviteSkeleton />
          : declined ? <Declined clubName={invite.data.club.name} onBack={() => { setMoved(true); setDeclined(false); }} />
          : <Invite code={code} data={invite.data} fade={saw} focusDecline={moved} onDecline={() => { setMoved(true); setDeclined(true); }} />}
      </PhoneFrame>
    </LichPage>
  );
}

const DATA_NOTE = "Dữ liệu lưu tại [nhà cung cấp cloud], máy chủ đặt tại [quốc gia]. CampusHub không chia sẻ dữ liệu cho bên thứ ba. Bạn xem, sửa, tải về hoặc xóa dữ liệu của mình ở mục Của tôi.";
const HINT = "Chọn 2 ô bắt buộc để tiếp tục";

/** Đầu màn: tờ lịch hôm nay và tiêu đề lời mời. */
function InviteTop({ title, titleRef }: { title: ReactNode; titleRef?: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="l-ptop">
      <TodayLeaf size="md" />
      <div className="l-ptop-text">
        <h1 className="l-phone-title" ref={titleRef} tabIndex={titleRef ? -1 : undefined}>{title}</h1>
      </div>
    </div>
  );
}

/** Đã bấm "Không tham gia": vẫn mở bằng tờ lịch hôm nay; focus về tiêu đề để trình đọc màn hình đọc kết quả. */
function Declined({ clubName, onBack }: { clubName: string; onBack: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  return (
    <Reveal from className="l-pay-body">
      <InviteTop title="Bạn đã không tham gia" titleRef={title} />
      <p className="l-fine">{clubName} không lưu thêm dữ liệu nào của bạn. Nếu đổi ý, bạn mở lại link mời trong email.</p>
      <div className="l-actions"><button type="button" className="l-btn2 l-lg" onClick={onBack}>Xem lại lời mời</button></div>
    </Reveal>
  );
}

/** Khung xương: chỉ tên CLB, người mời và email là thanh giữ chỗ; ba ô đồng ý, dòng chữ nhỏ và hai nút là chữ thật. */
function InviteSkeleton() {
  return (
    <Loading className="l-pay-body">
      <InviteTop title={<><SkelLine w="88%" /><br /><SkelLine w="60%" /></>} />
      <p className="l-lead"><SkelLine w="94%" /><br /><SkelLine w="70%" /></p>
      <div className="l-pay-card l-login-row"><span>Đăng nhập bằng <SkelLine w={190} /></span></div>
      <div className="l-pay-card l-consent l-inert">
        <span className="l-consent-legend">Trước khi tham gia, bạn chọn:</span>
        <ConsentRows />
      </div>
      <p className="l-fine">{DATA_NOTE} <span>Đọc chính sách dữ liệu (chưa có)</span></p>
      <div className="l-actions l-inert">
        <span className="l-btn l-lg" aria-disabled="true">Tham gia CLB</span>
        <span className="l-hint l-center">{HINT}</span>
        <span className="l-btn2 l-lg">Không tham gia</span>
      </div>
    </Loading>
  );
}

type Box = "keep" | "phone" | "age";

/** Ba ô đồng ý, mỗi ô một mục đích. Không đánh dấu sẵn: trạng thái ban đầu luôn là chưa chọn. */
function ConsentRows({ value, onChange, refs }: {
  value?: Record<Box, boolean>; onChange?: (box: Box, on: boolean) => void; refs?: Record<"keep" | "age", RefObject<HTMLInputElement | null>>;
}) {
  const row = (box: Box, id: string, must: boolean, note: string, text: string) => (
    <label key={box} className="l-check l-consent-row" htmlFor={id}>
      <input id={id} type="checkbox" ref={box === "phone" ? undefined : refs?.[box]} checked={value?.[box] ?? false} readOnly={!onChange}
        onChange={onChange && ((e) => onChange(box, e.target.checked))} tabIndex={onChange ? undefined : -1} />
      <span className="l-field">
        <span>{text}</span>
        <span className={`l-need${must ? " must" : ""}`}>{note}</span>
      </span>
    </label>
  );
  return (
    <>
      {row("keep", "consent-keep", true, "Bắt buộc để tham gia", "Cho CLB lưu họ tên, email, lịch sử điểm danh và các khoản đóng quỹ của tôi để quản lý thành viên.")}
      {row("phone", "consent-phone", false, "Không bắt buộc", "Cho CLB lưu số điện thoại của tôi để liên lạc.")}
      {row("age", "consent-age", true, "Bắt buộc", "Tôi xác nhận đã đủ 16 tuổi.")}
    </>
  );
}

function Invite({ code, data, fade, focusDecline, onDecline }: { code: string; data: InviteRes; fade: boolean; focusDecline: boolean; onDecline: () => void }) {
  const client = useQueryClient();
  const router = useRouter();
  const { logout, pending: switching } = useLogout();
  const [boxes, setBoxes] = useState<Record<Box, boolean>>({ keep: false, phone: false, age: false });
  const [leaving, setLeaving] = useState(false);
  const keepRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const declineRef = useRef<HTMLButtonElement>(null);
  const ready = boxes.keep && boxes.age;
  // Quay lại từ "Bạn đã không tham gia": focus về nút "Không tham gia" như trước khi bấm.
  useEffect(() => { if (focusDecline) declineRef.current?.focus(); }, [focusDecline]);

  const accept = useMutation({
    mutationFn: (body: AcceptInviteBody) => apiPost<AcceptInviteRes>(`/invites/${code}/accept`, body),
    onSuccess: async () => {
      setLeaving(true); // giữ vòng xoay trên nút tới khi trang Của tôi mở
      await client.invalidateQueries({ queryKey: keys.me });
      void client.invalidateQueries({ queryKey: keys.explore });
      toast.success(`Đã tham gia ${data.club.name}.`);
      router.push("/me");
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const busy = accept.isPending || leaving;

  function join() {
    if (busy) return;
    // Chưa đủ ô bắt buộc: đưa tới ô còn thiếu thay vì im lặng.
    if (!ready) { (boxes.keep ? ageRef : keepRef).current?.focus(); return; }
    accept.mutate({ membership: true, age16: true, phone: boxes.phone });
  }

  const inviter = data.invitedBy ? `${data.invitedBy.name} (${ROLE_LABEL[data.invitedBy.role].toLowerCase()}) đã` : "Ban điều hành đã";

  return (
    <Reveal from={fade} className="l-pay-body">
      <InviteTop title={`${data.club.name} mời bạn tham gia`} />
      <p className="l-lead">{inviter} thêm bạn vào danh sách thành viên học kỳ {data.club.term}.</p>

      <div className="l-pay-card l-login-row">
        <span>Đăng nhập bằng <strong>{data.email}</strong></span>
        {/* Đăng xuất, đăng nhập đúng email rồi quay lại link này. */}
        <button type="button" className="l-linkbtn" aria-busy={switching || undefined} onClick={() => logout(`/invite/${code}`)}>Đổi</button>
      </div>

      <fieldset className="l-pay-card l-consent">
        <legend className="l-consent-legend">Trước khi tham gia, bạn chọn:</legend>
        <ConsentRows value={boxes} onChange={(box, on) => setBoxes((b) => ({ ...b, [box]: on }))} refs={{ keep: keepRef, age: ageRef }} />
      </fieldset>

      <p className="l-fine">{DATA_NOTE} <span>Đọc chính sách dữ liệu (chưa có)</span></p>

      <div className="l-actions">
        <button type="button" className="l-btn l-lg" aria-disabled={!ready || undefined} aria-busy={busy || undefined}
          aria-describedby={ready ? undefined : "consent-required-hint"} onClick={join}>Tham gia CLB</button>
        {/* Dòng nhắc luôn giữ chỗ, chỉ ẩn đi khi đã đủ ô, để hai nút không nhảy chỗ. */}
        <span id="consent-required-hint" className={`l-hint l-center${ready ? " l-hide" : ""}`} aria-hidden={ready || undefined}>{HINT}</span>
        <button type="button" className="l-btn2 l-lg" ref={declineRef} onClick={onDecline}>Không tham gia</button>
      </div>
    </Reveal>
  );
}
