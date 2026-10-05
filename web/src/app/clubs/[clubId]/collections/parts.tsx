"use client";

// Phần dùng chung của các màn Đợt thu: khung xương, dải chọn đợt thu (thêm ngày 04/10/2026 khi CLB tạo được nhiều đợt thu),
// hộp "Sửa đợt thu". Bản vẽ BDH-DotThu chỉ có một đợt thu; dải chọn và hộp sửa được Hiệu duyệt theo mô tả.

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { CollectionDto, CollectionInfoRes } from "@contract";
import { apiPut } from "@/api/client";
import { errorText, useClubMutation, useCollections } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { DialogClose, LichDialog } from "@/components/lich/Dialog";
import { LeafSkel, LinkIcon, Loading, Skel, SkelLine } from "@/components/lich/motion";
import { PageTop, TableSkeleton } from "@/components/lich/PageTop";
import { parseMoneyInput } from "@/components/money-input";
import { money, nowIso } from "@/lib/format";

export const COLUMNS = ["Họ tên", "Mã trong nội dung chuyển khoản", "Trạng thái", "Cách đóng", "Ngày ghi nhận", "Thao tác"];
export const WIDTHS = ["17%", "24%", "20%", "10%", "13%", "16%"];
const CELLS = ["Đã đóng", "Báo đã chuyển, chờ đối soát", "Chưa đóng"];
const CHIPS = ["Tất cả", "Chưa đóng", "Báo đã chuyển", "Đã đóng"];

/** Khung xương đúng bố cục màn: dải chọn đợt thu, tờ lịch hạn đóng, nhãn ô số, bộ lọc và tiêu đề cột là thật; số liệu là thanh giữ chỗ. */
export function CollectionSkeleton() {
  return (
    <>
      <PageTop title={<Skel w={280} h={28} />} sub={<Skel w={480} h={15} />} actions={<><Skel w={196} h={40} /><Skel w={170} h={40} /></>} />
      <Loading className="l-sheet">
        <TabsSkeleton />
        <div className="l-sec l-strip lead">
          <div className="l-cell leaf"><LeafSkel /></div>
          {CELLS.map((label) => (
            <div key={label} className="l-cell">
              <span className="l-cell-label">{label}</span>
              <span className="l-cell-value"><SkelLine w={96} /></span>
              <span className="l-cell-note"><SkelLine w="70%" /></span>
            </div>
          ))}
        </div>
        <div className="l-sec">
          <div className="l-sec-head"><div className="l-seg">{CHIPS.map((c, i) => <span key={c} className={`l-chip l-chip-skel${i === 0 ? " l-on" : ""}`}>{c}<Skel w={22} h={12} /></span>)}</div></div>
          <TableSkeleton headers={COLUMNS} widths={WIDTHS} rows={7} right={[5]} />
          <div className="l-foot"><span className="l-grow"><SkelLine w="60%" /></span><Skel w={88} h={34} /></div>
        </div>
      </Loading>
    </>
  );
}

function TabsSkeleton() {
  return <div className="l-tabs-list l-coltabs" aria-hidden="true"><span className="l-tab-trigger"><SkelLine w={150} /></span></div>;
}

/** Dải chọn đợt thu: mỗi đợt một thẻ (đợt tạo gần nhất trước), cuối dải là "Tạo đợt thu" cho thủ quỹ và chủ nhiệm. */
export function CollectionTabs({ clubId, currentId, canMoney }: { clubId: string; currentId?: string; canMoney: boolean }) {
  const list = useCollections(clubId);
  if (!list.data) return <TabsSkeleton />;
  return (
    <nav className="l-tabs-list l-coltabs" aria-label="Các đợt thu">
      {list.data.collections.map((c) => (
        <Link key={c.id} className="l-tab-trigger" href={`/clubs/${clubId}/collections/${c.id}`} aria-current={c.id === currentId ? "page" : undefined}>{c.name}</Link>
      ))}
      {canMoney && <Link className="l-tab-trigger l-tab-add" href={`/clubs/${clubId}/collections/new`}><LinkIcon name="plus" size={16} />Tạo đợt thu</Link>}
    </nav>
  );
}

/** Nút "Sửa đợt thu" và hộp sửa: hạn đóng lúc nào cũng sửa được; mức thu chỉ sửa khi chưa ai đóng hay báo đã chuyển. */
export function EditCollection({ clubId, collection, touched }: { clubId: string; collection: CollectionDto; touched: boolean }) {
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState(nowIso(Date.parse(collection.dueDate)).slice(0, 10));
  const [amount, setAmount] = useState(String(collection.amount));
  // Lỗi của từng ô; error: lỗi từ máy chủ (không thuộc ô nào).
  const [fieldErrors, setFieldErrors] = useState<{ due?: string; amount?: string }>({});
  const [error, setError] = useState("");
  const save = useClubMutation(clubId, (body: { dueDate: string; amount?: number }) => apiPut<CollectionInfoRes>(`/clubs/${clubId}/collections/${collection.id}`, body), {
    onSuccess: () => { toast.success("Đã lưu đợt thu."); setOpen(false); },
    onError: (e) => setError(errorText(e)),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    const parsed = parseMoneyInput(amount);
    const next = { due: due ? undefined : "Cần chọn hạn đóng.", amount: !touched && (!parsed || parsed <= 0) ? "Mức thu là số tiền, ví dụ 100.000." : undefined };
    setFieldErrors(next);
    if (next.due) { document.getElementById("sua-han")?.focus(); return; }
    if (next.amount) { document.getElementById("sua-muc")?.focus(); return; }
    save.mutate({ dueDate: `${due}T23:59:00+07:00`, ...(touched ? {} : { amount: parsed! }) });
  }

  return (
    <>
      <button type="button" className="l-btn2" onClick={() => { setError(""); setFieldErrors({}); setDue(nowIso(Date.parse(collection.dueDate)).slice(0, 10)); setAmount(String(collection.amount)); setOpen(true); }}>Sửa đợt thu</button>
      <LichDialog open={open} onOpenChange={setOpen} title={`Sửa ${collection.name}`}>
        <form className="l-form" onSubmit={submit} noValidate>
          <div className="l-field">
            <label className="l-flabel" htmlFor="sua-han">Hạn đóng</label>
            <input id="sua-han" className="l-input" type="date" value={due} aria-invalid={fieldErrors.due ? true : undefined} aria-describedby={fieldErrors.due ? "sua-han-loi" : undefined}
              onChange={(e) => { setDue(e.target.value); setFieldErrors((x) => ({ ...x, due: undefined })); setError(""); }} />
            {fieldErrors.due && <span id="sua-han-loi" className="l-error">{fieldErrors.due}</span>}
          </div>
          <div className="l-field">
            <label className="l-flabel" htmlFor="sua-muc">Mức thu mỗi người (₫)</label>
            <input id="sua-muc" className="l-input" inputMode="numeric" value={touched ? money(collection.amount) : amount} disabled={touched}
              aria-invalid={fieldErrors.amount ? true : undefined} aria-describedby={touched ? "sua-muc-ly-do" : fieldErrors.amount ? "sua-muc-loi" : undefined}
              onChange={(e) => { setAmount(e.target.value); setFieldErrors((x) => ({ ...x, amount: undefined })); setError(""); }} />
            {fieldErrors.amount && <span id="sua-muc-loi" className="l-error">{fieldErrors.amount}</span>}
            {touched && <span id="sua-muc-ly-do" className="l-hint">Đã có người đóng hoặc báo đã chuyển, nên không đổi mức thu được nữa.</span>}
          </div>
          {error && <p className="l-error" role="alert">{error}</p>}
          <div className="l-dialog-actions">
            <DialogClose className="l-btn2">Hủy</DialogClose>
            <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}><Icon name="check" size={18} />Lưu</button>
          </div>
        </form>
      </LichDialog>
    </>
  );
}
