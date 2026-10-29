"use client";

// Sinh viên chưa vào CLB · Trang CLB và đơn xin vào (design/screens/SV-DonXinVao.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId (kèm quan hệ của người đang xem với CLB); "Gửi đơn" gọi POST /clubs/:clubId/applications.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { ApplicationRes, ApplyBody, ClubCardDto, MeRes } from "@contract";
import { ApiError, apiPost } from "@/api/client";
import { errorText, keys, useClubCard, useFeed, useMe } from "@/api/queries";
import { ChatButton } from "@/components/lich/ChatBubble";
import { ErrorGate } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PhoneFrame } from "@/components/lich/PhoneFrame";
import { PostRow } from "@/components/lich/Post";
import { sampleAbout } from "@/lib/feed-sample";
import { dm } from "@/lib/format";
import { ClubTag } from "../application-status";

const BACK = { href: "/explore", label: "Danh sách CLB" };
const FOOTNOTE = "Ban điều hành thấy đơn của bạn ngay ở trang chủ của họ. Bạn nhận email khi đơn được duyệt hoặc bị từ chối.";

export default function ClubPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const me = useMe();
  const card = useClubCard(clubId);
  const saw = useSawPending(!card.data || !me.data);

  const error = card.error ?? me.error;
  if (error) return <ErrorGate error={error} onRetry={() => { void card.refetch(); void me.refetch(); }} back={{ href: "/explore", label: "Xem danh sách CLB" }} />;

  return (
    <LichPage>
      <PhoneFrame back={BACK} personName={me.data?.person.name} tab="explore" fade={saw}>
        {card.data && me.data ? <Club club={card.data.club} me={me.data} fade={saw} /> : <ClubSkeleton />}
      </PhoneFrame>
    </LichPage>
  );
}

/** Đầu màn: tờ lịch hôm nay, tên CLB, lĩnh vực và số thành viên. */
function ClubTop({ name, meta }: { name: ReactNode; meta: ReactNode }) {
  return (
    <div className="l-ptop">
      <TodayLeaf size="md" />
      <div className="l-ptop-text">
        <h1 className="l-phone-title">{name}</h1>
        <span className="l-ptop-sub">{meta}</span>
      </div>
    </div>
  );
}

/** Khung xương vẽ trạng thái hay gặp nhất: CLB đang nhận đơn, chưa gửi đơn, nên có form. Nhãn ô nhập là chữ thật. */
function ClubSkeleton() {
  return (
    <Loading className="l-pay-body">
      <ClubTop name={<SkelLine w="80%" />} meta={<SkelLine w={190} />} />
      <span className="l-meta"><SkelLine w="94%" /><br /><SkelLine w="30%" /></span>
      <p className="l-club-about"><SkelLine w="96%" /><br /><SkelLine w="62%" /></p>
      <div className="l-pay-card l-form l-inert">
        <div className="l-field"><h2 className="l-subhead">Đơn xin vào</h2><span className="l-note"><SkelLine w={230} /></span></div>
        <div className="l-field"><span className="l-flabel">Họ tên</span><span className="l-input l-input-ro"><SkelLine w={150} /></span></div>
        <div className="l-field"><span className="l-flabel">Năm học</span><span className="l-select"><SkelLine w={60} /></span></div>
        <div className="l-field"><span className="l-flabel">Vì sao bạn muốn tham gia? (không bắt buộc)</span><span className="l-textarea" /></div>
        <span className="l-check"><input type="checkbox" readOnly tabIndex={-1} /><span>Cho ban điều hành CLB xem họ tên, email và năm học của tôi để xét đơn.</span></span>
        <Skel w="100%" h={48} />
        <p className="l-fine">{FOOTNOTE}</p>
      </div>
    </Loading>
  );
}

function Club({ club, me, fade }: { club: ClubCardDto; me: MeRes; fade: boolean }) {
  const [justSent, setJustSent] = useState(false);
  const statusRef = useRef<HTMLElement>(null);
  const { my } = club;
  // Đơn bị từ chối thì vẫn gửi đơn mới được: hiện thẻ trạng thái rồi tới form.
  const canApply = club.acceptingApplications && (my.status === "none" || my.status === "rejected");
  const showStatus = my.status !== "none" || !club.acceptingApplications;
  const place = club.location.charAt(0).toLowerCase() + club.location.slice(1);

  // Gửi đơn xong thì đưa focus tới thẻ trạng thái vừa hiện, để trình đọc màn hình đọc kết quả.
  useEffect(() => { if (justSent) statusRef.current?.focus(); }, [justSent]);

  return (
    <Reveal from={fade} className="l-pay-body">
      <ClubTop name={club.name} meta={`${club.field} · ${club.members} thành viên`} />
      <span className="l-meta">{[club.schedule, place].filter(Boolean).join(", ")}</span>
      <p className="l-club-about">{sampleAbout(club.id)}</p>
      <p className="l-note">Giới thiệu mẫu: ban điều hành CLB sẽ tự viết phần này.</p>
      <div className="l-row-actions"><ChatButton className="l-btn2 l-lg" to={{ id: club.id, name: club.name }}>Nhắn cho CLB</ChatButton></div>

      {showStatus && (
        <m.section ref={statusRef} tabIndex={-1} className="l-pay-card l-status-card" aria-label="Đơn của bạn"
          initial={justSent ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut", delay: justSent ? 0.12 : 0 }}>
          <ClubTag club={club} />
          <StatusDetail club={club} canApply={canApply} />
        </m.section>
      )}
      <AnimatePresence initial={false}>
        {canApply && (
          <m.div key="form" className="l-collapse" exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            <ApplyForm club={club} me={me} onSent={() => setJustSent(true)} />
          </m.div>
        )}
      </AnimatePresence>
      <ClubPosts clubId={club.id} />
    </Reveal>
  );
}

/** Chữ và nút dưới nhãn trạng thái. */
function StatusDetail({ club, canApply }: { club: ClubCardDto; canApply: boolean }) {
  const { my } = club;
  switch (my.status) {
    case "member": return null;
    case "invited": return my.inviteCode ? <Link className="l-btn l-lg" href={`/invite/${my.inviteCode}`}>Xem lời mời<LinkIcon name="chevronRight" size={18} /></Link> : null;
    case "applied": return <p className="l-fine">Đơn của bạn gửi {my.applicationSubmittedAt ? dm(my.applicationSubmittedAt) : ""}, đang chờ ban điều hành duyệt.</p>;
    case "rejected": return <p className="l-fine">Ban điều hành đã từ chối đơn bạn gửi ngày {my.applicationSubmittedAt ? dm(my.applicationSubmittedAt) : ""}.{canApply ? " Bạn có thể gửi đơn mới ở dưới." : ""}</p>;
    case "none": return <p className="l-fine">Xem CLB khác ở Danh sách CLB.</p>;
  }
}

const CONSENT_ERROR = "Cần đồng ý cho ban điều hành xem thông tin thì mới gửi được đơn.";

function ApplyForm({ club, me, onSent }: { club: ClubCardDto; me: MeRes; onSent: () => void }) {
  const client = useQueryClient();
  // null: chưa chọn, dùng năm học trong tài khoản (nếu có).
  const [picked, setPicked] = useState<number | "" | null>(null);
  const [reason, setReason] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ year?: string; agree?: string }>({});
  const yearRef = useRef<HTMLSelectElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const year = picked ?? me.person.year ?? "";

  const apply = useMutation({
    mutationFn: (body: ApplyBody) => apiPost<ApplicationRes>(`/clubs/${club.id}/applications`, body),
    // Chờ trang CLB tải lại trạng thái mới rồi mới thả nút, để thẻ "Đã gửi đơn" hiện đúng lúc form thu lại.
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: keys.explore });
      onSent();
    },
    onError: (e) => {
      toast.error(errorText(e));
      // Đơn đã có hoặc CLB vừa ngưng nhận đơn: tải lại để thấy trạng thái thật.
      if (e instanceof ApiError && e.status === 409) void client.invalidateQueries({ queryKey: keys.explore });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (apply.isPending) return;
    const next = { year: year === "" ? "Chọn năm học." : undefined, agree: agree ? undefined : CONSENT_ERROR };
    setErrors(next);
    if (year === "") { yearRef.current?.focus(); return; }
    if (next.agree) { agreeRef.current?.focus(); return; }
    apply.mutate({ year, reason: reason.trim() || undefined, consent: true });
  };

  return (
    <form onSubmit={submit} className="l-pay-card l-form" noValidate>
      <div className="l-field">
        <h2 className="l-subhead">Đơn xin vào</h2>
        <span className="l-note">Gửi bằng tài khoản {me.person.email}</span>
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="full-name">Họ tên</label>
        <input id="full-name" className="l-input" value={me.person.name} readOnly aria-describedby="full-name-source" />
        <span id="full-name-source" className="l-sr">Lấy từ tài khoản Google, không sửa ở đây.</span>
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="study-year">Năm học</label>
        <select ref={yearRef} id="study-year" className="l-select" value={year}
          onChange={(e) => { setPicked(e.target.value ? Number(e.target.value) : ""); setErrors((x) => ({ ...x, year: undefined })); }}
          aria-invalid={errors.year ? true : undefined} aria-describedby={errors.year ? "study-year-error" : undefined}>
          {!me.person.year && <option value="">Chọn năm học</option>}
          {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y === 5 ? "Năm 5 trở lên" : `Năm ${y}`}</option>)}
        </select>
        {errors.year && <span id="study-year-error" className="l-error">{errors.year}</span>}
      </div>
      <div className="l-field">
        <label className="l-flabel" htmlFor="application-reason">Vì sao bạn muốn tham gia? (không bắt buộc)</label>
        <textarea id="application-reason" className="l-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="l-field">
        <label className="l-check" htmlFor="consent-share">
          <input ref={agreeRef} id="consent-share" type="checkbox" checked={agree}
            onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, agree: undefined })); }}
            aria-invalid={errors.agree ? true : undefined} aria-describedby={errors.agree ? "consent-share-error" : undefined} />
          <span>Cho ban điều hành CLB xem họ tên, email và năm học của tôi để xét đơn.</span>
        </label>
        {errors.agree && <span id="consent-share-error" className="l-error" role="alert">{errors.agree}</span>}
      </div>
      <button type="submit" className="l-btn l-lg" aria-busy={apply.isPending || undefined}>Gửi đơn</button>
      <p className="l-fine">{FOOTNOTE}</p>
    </form>
  );
}

/** Tin gần đây của CLB (chỉ tin đã được trường duyệt, lấy từ GET /feed) và lối liên hệ qua Zalo, Facebook (CLB tự dán link ở phần giới thiệu, chưa làm). */
function ClubPosts({ clubId }: { clubId: string }) {
  const feed = useFeed();
  const posts = useMemo(() => (feed.data?.posts ?? []).filter((p) => p.club.id === clubId && p.status === "approved").slice(0, 3), [feed.data, clubId]);
  return (
    <>
      <section className="l-pay-card" aria-labelledby="club-contact">
        <h2 id="club-contact" className="l-subhead">Liên hệ CLB</h2>
        <p className="l-fine">Link Zalo và Facebook do ban điều hành CLB dán ở đây. Khung mẫu: chưa có link thật.</p>
      </section>
      {posts.length > 0 && (
        <section className="l-pay-card l-rows" aria-labelledby="club-posts">
          <h2 id="club-posts" className="l-subhead">Tin gần đây của CLB</h2>
          <ul className="l-posts">{posts.map((p) => <PostRow key={p.id} post={p} />)}</ul>
          <Link className="l-rowlink" href="/feed">Xem Cộng đồng<LinkIcon name="chevronRight" size={16} /></Link>
        </section>
      )}
    </>
  );
}
