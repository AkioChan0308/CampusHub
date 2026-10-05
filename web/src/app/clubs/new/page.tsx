"use client";

// Tạo CLB lần đầu. Bản vẽ chưa có màn này: mô tả được Hiệu duyệt ngày 04/10/2026.
// Ai đã đăng nhập cũng tạo được (phương án nghiệp vụ N1: không cần xác minh); người tạo là chủ nhiệm.
// Gửi POST /clubs, xong thì mở trang chủ CLB (trang chủ nhắc thêm thành viên, tạo buổi, tạo đợt thu).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { CreateClubBody, CreateClubRes } from "@contract";
import { toast } from "sonner";
import { ApiError, apiPost } from "@/api/client";
import { errorText, keys, useMe } from "@/api/queries";
import { ErrorGate } from "@/components/lich/Gate";
import { TodayLeaf } from "@/components/lich/Leaf";
import { LichPage, LinkIcon } from "@/components/lich/motion";
import { nowIso } from "@/lib/format";
import { FIELDS } from "@/lib/types";

/** Học kỳ hiện tại và hai kỳ sau. Mỗi năm 3 kỳ: Spring (tháng 1–4), Summer (5–8), Fall (9–12). */
function termOptions(): string[] {
  const [y, mo] = nowIso().slice(0, 7).split("-").map(Number);
  const names = ["Spring", "Summer", "Fall"];
  let i = Math.floor((mo - 1) / 4);
  let year = y;
  const list: string[] = [];
  for (let k = 0; k < 3; k++) {
    list.push(`${names[i]} ${year}`);
    i = (i + 1) % 3;
    if (i === 0) year++;
  }
  return list;
}

type Fields = { name: string; field: string; schedule: string; location: string; term: string; mentor: string; accepting: boolean };

export default function NewClubPage() {
  const me = useMe();
  if (me.error) return <ErrorGate error={me.error} onRetry={() => me.refetch()} back={{ href: "/explore", label: "Về danh sách CLB" }} />;
  return (
    <LichPage>
      <div className="lich">
        <main className="l-onboard">
          <Link className="l-back" href="/explore"><LinkIcon name="chevronLeft" size={18} />Danh sách CLB</Link>
          <div className="l-ptop">
            <TodayLeaf size="md" />
            <div className="l-ptop-text">
              <h1 className="l-phone-title">Tạo CLB mới</h1>
              <span className="l-ptop-sub">Bạn sẽ là chủ nhiệm. Tạo xong thì thêm thành viên, tạo buổi sinh hoạt và đợt thu quỹ.</span>
            </div>
          </div>
          <NewClubForm />
        </main>
      </div>
    </LichPage>
  );
}

function NewClubForm() {
  const router = useRouter();
  const client = useQueryClient();
  const terms = termOptions();
  const [f, setF] = useState<Fields>({ name: "", field: "", schedule: "", location: "", term: terms[0], mentor: "", accepting: true });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [leaving, setLeaving] = useState(false);
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const create = useMutation({
    mutationFn: (body: CreateClubBody) => apiPost<CreateClubRes>("/clubs", body),
    onSuccess: async (r) => {
      setLeaving(true); // giữ vòng xoay trên nút tới khi trang chủ CLB mở
      await client.invalidateQueries({ queryKey: keys.me });
      void client.invalidateQueries({ queryKey: keys.explore });
      void client.invalidateQueries({ queryKey: keys.school });
      router.push(`/clubs/${r.club.id}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) { setErrors({ name: e.message }); document.getElementById("clb-name")?.focus(); }
      else toast.error(errorText(e));
    },
  });
  const busy = create.isPending || leaving;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!f.name.trim()) next.name = "Cần ghi tên CLB.";
    if (!f.field) next.field = "Cần chọn lĩnh vực.";
    if (!f.schedule.trim()) next.schedule = "Cần ghi lịch sinh hoạt.";
    if (!f.location.trim()) next.location = "Cần ghi nơi sinh hoạt.";
    setErrors(next);
    const first = (Object.keys(next) as (keyof Fields)[])[0];
    if (first) { document.getElementById(`clb-${first}`)?.focus(); return; }
    create.mutate({
      name: f.name.trim(), field: f.field, schedule: f.schedule.trim(), location: f.location.trim(), term: f.term,
      acceptingApplications: f.accepting, ...(f.mentor.trim() ? { mentor: f.mentor.trim() } : {}),
    });
  }

  const field = (k: keyof Fields, label: string, input: ReactNode, hint?: string) => (
    <div className="l-field">
      <label className="l-flabel" htmlFor={`clb-${k}`}>{label}</label>
      {input}
      {errors[k] ? <span id={`clb-${k}-loi`} className="l-error">{errors[k]}</span>
        : hint ? <span id={`clb-${k}-goi-y`} className="l-hint">{hint}</span> : null}
    </div>
  );
  const aria = (k: keyof Fields, hint = false) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `clb-${k}-loi` : hint ? `clb-${k}-goi-y` : undefined,
  });

  return (
    <form className="l-sheet l-sec-pad l-form" onSubmit={submit} noValidate aria-label="Thông tin CLB">
      <div className="l-form-grid">
        {field("name", "Tên CLB", <input id="clb-name" className="l-input" value={f.name} placeholder="Ví dụ: CLB Bóng bàn Nhanh Tay" onChange={(e) => set("name", e.target.value)} {...aria("name")} />)}
        {field("field", "Lĩnh vực", (
          <select id="clb-field" className="l-select" value={f.field} onChange={(e) => set("field", e.target.value)} {...aria("field")}>
            <option value="">Chọn lĩnh vực</option>
            {FIELDS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        ))}
        {field("schedule", "Lịch sinh hoạt", <input id="clb-schedule" className="l-input" value={f.schedule} placeholder="Ví dụ: Sáng Thứ Bảy, 07:30–09:30" onChange={(e) => set("schedule", e.target.value)} {...aria("schedule")} />)}
        {field("location", "Nơi sinh hoạt", <input id="clb-location" className="l-input" value={f.location} placeholder="Ví dụ: Sân cầu lông khu thể thao" onChange={(e) => set("location", e.target.value)} {...aria("location")} />)}
        {field("term", "Học kỳ hiện tại", (
          <select id="clb-term" className="l-select" value={f.term} onChange={(e) => set("term", e.target.value)} {...aria("term", true)}>
            {terms.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ), "Thu quỹ, dự trù và báo cáo tính theo học kỳ.")}
        {field("mentor", "Mentor (không bắt buộc)", <input id="clb-mentor" className="l-input" value={f.mentor} placeholder="Tên giảng viên hướng dẫn" onChange={(e) => set("mentor", e.target.value)} />)}
      </div>
      <label className="l-check" htmlFor="clb-accepting">
        <input id="clb-accepting" type="checkbox" checked={f.accepting} onChange={(e) => set("accepting", e.target.checked)} />
        <span>Đang nhận đơn xin vào: sinh viên thấy CLB trong danh sách và gửi đơn được.</span>
      </label>
      <div className="l-form-actions">
        <Link className="l-btn2" href="/explore">Hủy</Link>
        <button type="submit" className="l-btn" aria-busy={busy || undefined}>Tạo CLB</button>
      </div>
    </form>
  );
}
