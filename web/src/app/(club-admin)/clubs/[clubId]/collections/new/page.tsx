"use client";

// Ban điều hành · Tạo đợt thu. Bản vẽ chưa có màn này: mô tả được Hiệu duyệt ngày 04/10/2026.
// Bên trái là form, bên phải là phần xem trước: thành viên sẽ thấy gì ở màn đóng quỹ.
// Gửi POST /clubs/:clubId/collections. Máy chủ chỉ lưu 4 số cuối của số tài khoản (mã QR của bản demo là mã giả).

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { CollectionInfoRes, CreateCollectionBody, MembersRes } from "@contract";
import { apiPost } from "@/api/client";
import { errorText, useClubMutation, useMembers } from "@/api/queries";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { dueLabel, isUrgent, Leaf } from "@/components/lich/Leaf";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { PageTop } from "@/components/lich/PageTop";
import { parseMoneyInput } from "@/components/money-input";
import { dmy, money, nowIso } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { toAsciiUpper } from "@/lib/text";
import { ROLE_LABEL } from "@/lib/types";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useMembers(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="collection" fallback={<NewSkeleton />}>
        <NewCollection />
      </BoardFrame>
    </LichPage>
  );
}

const TITLE = "Tạo đợt thu";
const SUB = "Mỗi thành viên sẽ có mã chuyển khoản riêng. Tiền vào thẳng tài khoản của người nhận, CampusHub không giữ tiền.";
const LABELS = ["Tên đợt thu", "Mức thu mỗi người (₫)", "Hạn đóng", "Mã đầu nội dung chuyển khoản", "Người nhận tiền", "Tên chủ tài khoản", "Ngân hàng", "Số tài khoản"];
/** Dòng gợi ý dưới ô (theo vị trí trong LABELS), dùng chung cho form thật và khung xương. */
const HINTS: Record<number, string> = {
  2: "Hết 23:59 ngày này.",
  3: "Ghép với mã thành viên, ví dụ QFALL26 A017.",
  5: "Như app ngân hàng hiện: chữ in hoa, không dấu.",
  7: "CampusHub chỉ lưu 4 số cuối.",
};

/** Khung xương: nhãn ô nhập là chữ thật, ô nhập không bấm được; phần xem trước là tờ lịch và các thanh giữ chỗ. */
function NewSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={SUB} />
      <Loading className="l-sheet l-form-split">
        <div className="l-sec-pad l-form l-inert">
          <div className="l-form-grid">
            {LABELS.map((l, i) => <div key={l} className="l-field"><span className="l-flabel">{l}</span><span className="l-input"><SkelLine w="40%" /></span>{HINTS[i] && <span className="l-hint">{HINTS[i]}</span>}</div>)}
          </div>
          <div className="l-form-actions"><Skel w={140} h={40} /></div>
        </div>
        <aside className="l-sec-pad l-preview"><PreviewHead /><SkelLine w={200} /></aside>
      </Loading>
    </>
  );
}

/** Đầu phần xem trước: tiêu đề và câu giải thích cùng một hàng, có nét kẻ phía dưới. */
function PreviewHead() {
  return <div className="l-preview-head"><h2>Xem trước</h2><span className="l-note">Thành viên thấy ở màn đóng quỹ</span></div>;
}

function NewCollection() {
  const { club, me } = useLichBoard();
  const members = useMembers(club.id);
  const sawHere = useSawPending(members.isPending);
  const sawFrame = useFrameSawPending();
  if (!can(me.role, "money")) {
    return <><PageTop title={TITLE} /><div className="l-sheet"><p className="l-empty">{RIGHT_LABEL.money}</p></div></>;
  }
  if (members.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={members.error} onRetry={() => members.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  if (!members.data) return <NewSkeleton />;
  return <NewForm data={members.data} fade={sawHere || sawFrame} />;
}

/** Gợi ý mã đầu nội dung từ tên đợt thu: "Quỹ học kỳ Fall 2026" → QFALL26; "Quỹ giải nội bộ" → QGNB26 (năm lấy theo học kỳ). */
function suggestPrefix(name: string, term: string): string {
  const up = toAsciiUpper(name);
  const t = /(SPRING|SUMMER|FALL) (?:20)?(\d{2})\b/.exec(up) ?? /(SPRING|SUMMER|FALL) (?:20)?(\d{2})\b/.exec(toAsciiUpper(term));
  if (t && /(SPRING|SUMMER|FALL)/.test(up)) return `Q${t[1]}${t[2]}`.slice(0, 10);
  const initials = up.replace(/[^A-Z0-9 ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).join("");
  return `${initials}${t?.[2] ?? ""}`.slice(0, 10);
}

type Fields = { name: string; amount: string; due: string; prefix: string; receiverId: string; accountName: string; bank: string; account: string };

function NewForm({ data, fade }: { data: MembersRes; fade: boolean }) {
  const { club, me } = useLichBoard();
  const router = useRouter();
  const accepted = data.members.filter((m) => m.invite === "accepted");
  const myCode = data.members.find((m) => m.personId === me.personId)?.code ?? "A001";
  const defaultReceiver = accepted.find((m) => m.role === "treasurer") ?? accepted.find((m) => m.personId === me.personId) ?? accepted[0];
  const [f, setF] = useState<Fields>(() => {
    const name = `Quỹ học kỳ ${club.term}`;
    return {
      name, amount: "", due: nowIso(Date.now() + 14 * 86_400_000).slice(0, 10), prefix: suggestPrefix(name, club.term),
      receiverId: defaultReceiver?.personId ?? "", accountName: defaultReceiver ? toAsciiUpper(defaultReceiver.name) : "", bank: "", account: "",
    };
  });
  // Mã đầu nội dung và tên chủ tài khoản đi theo tên đợt thu và người nhận, cho tới khi người dùng tự sửa.
  const [touched, setTouched] = useState({ prefix: false, accountName: false });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const receiver = accepted.find((m) => m.personId === f.receiverId);

  const set = <K extends keyof Fields>(k: K, v: string) => {
    setF((x) => {
      const next = { ...x, [k]: v };
      if (k === "name" && !touched.prefix) next.prefix = suggestPrefix(v, club.term);
      if (k === "receiverId" && !touched.accountName) next.accountName = toAsciiUpper(accepted.find((m) => m.personId === v)?.name ?? "");
      return next;
    });
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const create = useClubMutation(club.id, (body: CreateCollectionBody) => apiPost<CollectionInfoRes>(`/clubs/${club.id}/collections`, body), {
    onSuccess: (r) => { toast.success(`Đã tạo ${r.collection.name}.`); router.push(`/clubs/${club.id}/collections/${r.collection.id}`); },
    onError: (e) => toast.error(errorText(e)),
  });

  const amount = parseMoneyInput(f.amount);
  const prefix = f.prefix.trim().toUpperCase();
  const dueIso = f.due ? `${f.due}T23:59:00+07:00` : "";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (create.isPending) return;
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!f.name.trim()) next.name = "Cần ghi tên đợt thu.";
    if (!amount || amount <= 0) next.amount = "Ghi số tiền, ví dụ 100.000.";
    if (!f.due) next.due = "Cần chọn hạn đóng.";
    if (!/^[A-Z0-9]{2,10}$/.test(prefix)) next.prefix = "Chỉ gồm chữ không dấu và số, 2–10 ký tự.";
    if (!f.receiverId) next.receiverId = "Cần chọn người nhận tiền.";
    if (!/^[A-Z ]+$/.test(toAsciiUpper(f.accountName)) || !f.accountName.trim()) next.accountName = "Ghi tên như app ngân hàng hiện, chỉ gồm chữ cái.";
    if (!f.bank.trim()) next.bank = "Cần ghi ngân hàng.";
    if (!/^\d{4,30}$/.test(f.account.trim())) next.account = "Số tài khoản chỉ gồm chữ số.";
    setErrors(next);
    const first = (Object.keys(next) as (keyof Fields)[])[0];
    if (first) { document.getElementById(`collection-${first}`)?.focus(); return; }
    create.mutate({ name: f.name.trim(), amount: amount!, dueDate: dueIso, codePrefix: prefix, receiverId: f.receiverId, accountName: f.accountName.trim(), bank: f.bank.trim(), account: f.account.trim() });
  }

  const field = (k: keyof Fields, label: string, input: ReactNode, hint?: string) => (
    <div className="l-field">
      <label className="l-flabel" htmlFor={`collection-${k}`}>{label}</label>
      {input}
      {errors[k] ? <span id={`collection-${k}-error`} className="l-error">{errors[k]}</span> : hint ? <span id={`collection-${k}-hint`} className="l-hint">{hint}</span> : null}
    </div>
  );
  const aria = (k: keyof Fields, hint = false) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `collection-${k}-error` : hint ? `collection-${k}-hint` : undefined,
  });
  const last4 = /^\d{4,}$/.test(f.account.trim()) ? f.account.trim().slice(-4) : "••••";
  // Cùng chữ với màn đóng quỹ: vai hiện tại của người nhận trong CLB.
  const receiverRole = receiver ? ROLE_LABEL[receiver.role] : "Người nhận quỹ của";

  return (
    <>
      <PageTop title={TITLE} sub={SUB} />
      <Reveal from={fade} className="l-sheet l-form-split">
        <form className="l-sec-pad l-form" onSubmit={submit} noValidate aria-label={TITLE}>
          <div className="l-form-grid">
            {field("name", LABELS[0], <input id="collection-name" className="l-input" value={f.name} onChange={(e) => set("name", e.target.value)} {...aria("name")} />)}
            {field("amount", LABELS[1], <input id="collection-amount" className="l-input" inputMode="numeric" placeholder="100.000" value={f.amount} onChange={(e) => set("amount", e.target.value)} {...aria("amount")} />)}
            {field("due", LABELS[2], <input id="collection-due" className="l-input" type="date" value={f.due} onChange={(e) => set("due", e.target.value)} {...aria("due", true)} />, HINTS[2])}
            {field("prefix", LABELS[3], <input id="collection-prefix" className="l-input l-mono-input" value={f.prefix} maxLength={10}
              onChange={(e) => { setTouched((t) => ({ ...t, prefix: true })); set("prefix", e.target.value.toUpperCase()); }} {...aria("prefix", true)} />, HINTS[3])}
            {field("receiverId", LABELS[4], (
              <select id="collection-receiverId" className="l-select" value={f.receiverId} onChange={(e) => set("receiverId", e.target.value)} {...aria("receiverId")}>
                {accepted.map((m) => <option key={m.personId} value={m.personId}>{m.name} · {ROLE_LABEL[m.role]}</option>)}
              </select>
            ))}
            {field("accountName", LABELS[5], <input id="collection-accountName" className="l-input" value={f.accountName}
              onChange={(e) => { setTouched((t) => ({ ...t, accountName: true })); set("accountName", e.target.value); }} {...aria("accountName", true)} />, HINTS[5])}
            {field("bank", LABELS[6], <input id="collection-bank" className="l-input" placeholder="Ví dụ: [ngân hàng]" value={f.bank} onChange={(e) => set("bank", e.target.value)} {...aria("bank")} />)}
            {field("account", LABELS[7], <input id="collection-account" className="l-input" inputMode="numeric" autoComplete="off" value={f.account} onChange={(e) => set("account", e.target.value)} {...aria("account", true)} />, HINTS[7])}
          </div>
          <div className="l-form-actions">
            <Link className="l-btn2" href={`/clubs/${club.id}/collections`}>Hủy</Link>
            <button type="submit" className="l-btn" aria-busy={create.isPending || undefined}>Tạo đợt thu</button>
          </div>
        </form>

        {/* Xem trước: giống màn đóng quỹ của thành viên (TV-DongQuy), cập nhật theo từng ô. */}
        <aside className="l-sec-pad l-preview" aria-label="Xem trước màn đóng quỹ">
          <PreviewHead />
          <div className="l-pay-top">
            <div className="l-pay-title">
              <span className="l-preview-name">{f.name.trim() || "Tên đợt thu"}</span>
              <span className="l-pay-amount">{amount ? money(amount) : "– ₫"}</span>
              <span className="l-meta">{f.due ? `Hạn đóng ${dmy(dueIso)}` : "Chưa chọn hạn đóng"}</span>
            </div>
            {f.due && <Leaf date={dueIso} sub={dueLabel(dueIso)} tone={isUrgent(dueIso) ? "urgent" : undefined} label={`Hạn đóng ${dmy(dueIso)}, ${dueLabel(dueIso)}`} />}
          </div>
          <div className="l-receiver">
            <span className="l-label">Người nhận</span>
            <span className="l-receiver-name">{toAsciiUpper(f.accountName) || "TÊN CHỦ TÀI KHOẢN"}</span>
            <span className="l-receiver-sub">{receiverRole} {club.name}, nhiệm kỳ {club.term} · {f.bank.trim() || "[ngân hàng]"} •••• {last4}</span>
          </div>
          <div className="l-field">
            <span className="l-label">Nội dung chuyển khoản của bạn</span>
            <span className="l-code">{prefix || "MÃ"} {myCode}</span>
          </div>
        </aside>
      </Reveal>
    </>
  );
}
