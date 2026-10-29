"use client";

// Ban điều hành · Đối soát sao kê (design/screens/BDH-DoiSoat.html), thế giới "Lịch bloc". Người dùng chính là thủ quỹ.
// CampusHub không kết nối tài khoản ngân hàng: thủ quỹ tự tải file sao kê lên (CSV trong bản MVP). Máy chủ đọc file,
// xếp loại giao dịch và ghi sổ (POST .../statements); gán tay: POST .../statements/:statementId/txns/:txnId/resolve.
// Đợt thu: ?collection=<mã đợt> (mở từ màn Đợt thu của đợt đó); không có thì đợt tạo gần nhất.

import { useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import type { CollectionRes, ReconciliationRes, ReconRowDto, ResolveTxnRes, UploadStatementRes } from "@contract";
import { apiGet, apiPost } from "@/api/client";
import { errorText, keys, useClubMutation, useReconciliation } from "@/api/queries";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop, TableSkeleton } from "@/components/lich/PageTop";
import { downloadCsv } from "@/lib/csv";
import { dm, dmy, hm, money } from "@/lib/format";
import { extractCodes } from "@/lib/reconcile";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { toAsciiUpper } from "@/lib/text";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="reconcile" fallback={<ReconcileSkeleton canMoney />}>
        <Reconcile />
      </BoardFrame>
    </LichPage>
  );
}

const LOCK_ID = "doi-soat-quyen";
const COLUMNS = ["Ngày", "Số tiền", "Người chuyển", "Nội dung chuyển khoản", "Vì sao chưa khớp", "Gán cho thành viên"];
// Theo độ rộng chữ đo trên dữ liệu mẫu ở laptop 1440px: tên, nội dung và nhãn lý do dài nhất vẫn nằm trên một dòng.
const WIDTHS = ["6.5%", "8%", "15.5%", "19%", "18.5%", "32.5%"];
const HELP = "CampusHub không kết nối với tài khoản ngân hàng. Thủ quỹ tự tải file sao kê từ app ngân hàng rồi đưa lên đây.";

/** Khung xương đúng bố cục màn: khối file, nhãn ba ô kết quả, tiêu đề bảng và tiêu đề cột là thật; số liệu là thanh giữ chỗ. */
function ReconcileSkeleton({ canMoney }: { canMoney: boolean }) {
  return (
    <>
      <PageTop title="Đối soát sao kê" sub={<Skel w={440} h={15} />} actions={<Skel w={164} h={40} />} />
      <Loading className="l-sheet">
        <div className="l-sec l-file">
          <span className="l-file-icon" aria-hidden="true"><Icon name="doc" /></span>
          <div className="l-file-text">
            <span className="l-file-name"><SkelLine w={240} /></span>
            <span className="l-note"><SkelLine w={430} /></span>
            <span className="l-linkbtn">Tải file CSV mẫu</span>
          </div>
          <p className="l-note l-file-help">{HELP}</p>
        </div>
        <div className="l-sec l-strip">
          {["Khớp tự động", canMoney ? "Cần bạn gán tay" : "Cần gán tay", "Không thuộc đợt thu"].map((label) => (
            <div key={label} className="l-cell">
              <span className="l-cell-label">{label}</span>
              <span className="l-cell-value"><SkelLine w={44} /></span>
              <span className="l-cell-note"><SkelLine w="78%" /></span>
            </div>
          ))}
        </div>
        <div className="l-sec">
          <div className="l-sec-head"><h2>Cần gán tay</h2></div>
          <TableSkeleton headers={COLUMNS} widths={WIDTHS} rows={4} right={[1, 5]} />
        </div>
      </Loading>
    </>
  );
}
type Suggestion = ReconRowDto["suggestion"][number];

/** Ghép nhãn "Tên · mã · ghi chú", bỏ phần trống. */
const joinLabel = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ");
const senderCellId = (row: ReconRowDto) => `nguoi-chuyen-${row.statementId}-${row.txnId}`;

/** Người được gợi ý đã đóng rồi: "đã ghi nhận tay" hoặc "đã đóng, ghi là đóng thừa". Lý do chưa khớp được tính lúc tải file, nên xét lại lúc hiện. */
const paidNote = (s: Suggestion) => (s.state === "hand-confirmed" ? "đã ghi nhận tay" : s.state === "paid" ? "đã đóng, ghi là đóng thừa" : "");
const isPaid = (state: Suggestion["state"]) => state === "paid" || state === "hand-confirmed";

/** Câu dưới tiêu đề hộp hỏi trước khi ghi giao dịch vào sổ quỹ, theo trạng thái của những người được gán. */
function confirmText(people: { name: string; state: Suggestion["state"] }[]): string {
  const hand = people.filter((x) => x.state === "hand-confirmed").map((x) => x.name);
  const paid = people.filter((x) => x.state === "paid").map((x) => x.name);
  return [
    hand.length > 0 && `Khoản đã ghi nhận tay của ${hand.join(", ")} chỉ được nối với dòng này, không ghi lần hai; chỉ phần chênh được ghi thêm.`,
    paid.length > 0 && `${paid.join(", ")} đã đóng rồi, nên phần tiền đó được ghi là đóng thừa.`,
    "Sổ quỹ không sửa, không xóa được.",
  ].filter(Boolean).join(" ");
}

/** Chữ cạnh nút "Ghi nhận" khi máy chủ đã gợi ý người. */
function suggestionHint(row: ReconRowDto, fee: number): string {
  const [first] = row.suggestion;
  // Nội dung không có mã nào: gợi ý theo tên người chuyển.
  if (extractCodes(row.content).length === 0) return `Gợi ý: ${first.name} (${["trùng tên", paidNote(first)].filter(Boolean).join(", ")})`;
  const names = row.suggestion.map((s) => (paidNote(s) ? `${s.name} (${paidNote(s)})` : s.name)).join(", ");
  const after = first.amountPaid + row.amount;
  return row.suggestion.length === 1 && after < fee ? `${names}, còn nợ ${money(fee - after)}` : names;
}

function Reconcile() {
  const board = useLichBoard();
  const { club, me } = board;
  const collectionId = useSearchParams().get("collection") || board.collectionId;
  const query = useReconciliation(club.id, collectionId);
  const sawHere = useSawPending(query.isPending && !!collectionId);
  const sawFrame = useFrameSawPending();
  if (!collectionId) return <PageTop title="Đối soát sao kê" sub="CLB chưa có đợt thu nào." />;
  if (query.isPending) return <ReconcileSkeleton canMoney={can(me.role, "money")} />;
  if (query.isError) return <><PageTop title="Đối soát sao kê" /><ErrorGate inline error={query.error} onRetry={() => query.refetch()} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  return <ReconcileBody data={query.data} clubId={club.id} canMoney={can(me.role, "money")} fade={sawHere || sawFrame} />;
}

function ReconcileBody({ data, clubId, canMoney, fade }: { data: ReconciliationRes; clubId: string; canMoney: boolean; fade: boolean }) {
  const { collection, latest } = data;
  const client = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const base = `/clubs/${clubId}/collections/${collection.id}`;

  const upload = useClubMutation(clubId, (v: { fileName: string; csv: string }) => apiPost<UploadStatementRes>(`${base}/statements`, v), {
    onSuccess: (res) => {
      setMessage(res.skippedDates > 0
        ? { text: `Bỏ qua ${res.skippedDates} dòng có ngày không có thật. Ngày ghi dạng ngày/tháng/năm, ví dụ 27/09/2026.`, error: false }
        : null);
      toast.success(`Đã đọc ${res.txnCount} giao dịch tiền vào: ${res.auto} khớp tự động, ${res.manual} cần gán tay.`);
    },
    onError: (e) => setMessage({ text: errorText(e), error: true }),
  });

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    upload.mutate({ fileName: file.name, csv: await file.text() });
  }

  /** File CSV mẫu lấy từ dữ liệu: hai người chưa đóng chuyển đúng cú pháp, một người chuyển không có mã để thử gán tay. */
  async function downloadSample() {
    try {
      const c = await client.fetchQuery({ queryKey: keys.collection(clubId, collection.id), queryFn: () => apiGet<CollectionRes>(base) });
      const now = Date.now();
      const when = `${dmy(now)} ${hm(now)}`;
      const unpaid = c.payments.filter((p) => p.status === "unpaid");
      const row = (p: (typeof unpaid)[number], content: string) => [when, String(collection.amount), toAsciiUpper(p.name), content];
      downloadCsv("sao-ke-mau.csv", [
        ["Ngày", "Số tiền", "Người chuyển", "Nội dung"],
        ...unpaid.slice(0, 2).map((p) => row(p, [collection.codePrefix, p.code].filter(Boolean).join(" "))),
        ...unpaid.slice(2, 3).map((p) => row(p, "dong quy")),
      ]);
    } catch (e) {
      toast.error(errorText(e));
    }
  }

  const uploadLabel = latest ? "Tải sao kê khác" : "Tải sao kê";
  return (
    <>
      <PageTop
        title="Đối soát sao kê"
        sub={`Đợt thu: ${collection.name} · tài khoản nhận quỹ của ${collection.receiver.name}`}
        actions={<>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="l-sr-input" onChange={onFile} tabIndex={-1} aria-hidden="true" />
          <button type="button" className={latest ? "l-btn2" : "l-btn"} disabled={!canMoney} aria-describedby={canMoney ? undefined : LOCK_ID}
            aria-busy={upload.isPending || undefined} onClick={() => { if (!upload.isPending) fileRef.current?.click(); }}>
            <Icon name="upload" size={18} />{uploadLabel}
          </button>
        </>}
      />
      {!canMoney && <p className="l-note" id={LOCK_ID}>{RIGHT_LABEL.money}</p>}
      {message?.error && <p className="l-alert" role="alert">{message.text}</p>}

      <Reveal from={fade} className="l-sheet">
        <div className="l-sec l-file">
          <span className="l-file-icon" aria-hidden="true"><Icon name="doc" /></span>
          <div className="l-file-text">
            <span className="l-file-name">{latest ? latest.fileName : "Chưa có file sao kê nào"}</span>
            {latest && (
              <span className="l-note">
                {latest.txnCount} giao dịch tiền vào, {latest.from.slice(0, 4) === latest.to.slice(0, 4) ? `từ ${dm(latest.from)} đến ${dmy(latest.to)}` : `từ ${dmy(latest.from)} đến ${dmy(latest.to)}`}
                {latest.duplicates > 0 ? ` · ${latest.duplicates} giao dịch đã có ở lần tải trước` : ""} · tải lên lúc {hm(latest.uploadedAt)} ngày {dm(latest.uploadedAt)}
              </span>
            )}
            {message && !message.error && <span className="l-file-warn" role="status">{message.text}</span>}
            <button type="button" className="l-linkbtn" onClick={downloadSample}>Tải file CSV mẫu</button>
          </div>
          <p className="l-note l-file-help">{HELP}</p>
        </div>
        {latest && <Result data={data} clubId={clubId} canMoney={canMoney} />}
      </Reveal>
    </>
  );
}

function Result({ data, clubId, canMoney }: { data: ReconciliationRes; clubId: string; canMoney: boolean }) {
  const latest = data.latest!;
  const open = data.rows.filter((r) => !r.resolvedTo);
  const olderOpen = open.filter((r) => r.fromEarlierFile).length;
  const resolved = data.rows.length - open.length;
  const manualNote = open.length > 0
    ? `Sai cú pháp, chuyển hộ hoặc thiếu tiền.${olderOpen > 0 ? ` Có ${olderOpen} giao dịch từ file trước.` : ""}`
    : resolved > 0 ? `Đã gán ${resolved}.` : "Không còn giao dịch nào chờ gán.";
  const resolve = useClubMutation(clubId,
    (v: { row: ReconRowDto; personIds: string[] }) =>
      apiPost<ResolveTxnRes>(`/clubs/${clubId}/collections/${data.collection.id}/statements/${v.row.statementId}/txns/${v.row.txnId}/resolve`, { personIds: v.personIds }),
    { onSuccess: (res) => toast.success(`Đã ghi nhận ${money(res.row.amount)} cho ${(res.row.resolvedTo ?? []).map((p) => p.name).join(", ")}.`) });

  return (
    <>
      <div className="l-sec l-strip">
        <div className="l-cell">
          <span className="l-cell-label">Khớp tự động</span>
          <span className="l-cell-value">{latest.auto}</span>
          <span className="l-cell-note">Đúng mã và đúng số tiền, đã chuyển sang “Đã đóng”.</span>
        </div>
        <div className={`l-cell${open.length > 0 ? " attn" : ""}`}>
          <span className="l-cell-label">{canMoney ? "Cần bạn gán tay" : "Cần gán tay"}</span>
          <span className="l-cell-value">{data.openManual}</span>
          <span className="l-cell-note">{manualNote}</span>
        </div>
        <div className="l-cell">
          <span className="l-cell-label">Không thuộc đợt thu</span>
          <span className="l-cell-value">{latest.ignored - latest.duplicates}</span>
          <span className="l-cell-note">Ví dụ tiền hoàn ứng. Bỏ qua, không ghi vào đợt thu.</span>
        </div>
      </div>

      <div className="l-sec">
        <div className="l-sec-head">
          <h2>Cần gán tay ({open.length})</h2>
          {open.length > 0 && <span className="l-note">Chưa bấm “Ghi nhận” thì sổ quỹ chưa thay đổi.</span>}
        </div>
        <div className="l-table-wrap">
          <table className="l-table l-fixed">
            <ColGroup widths={WIDTHS} />
            <thead>
              <tr>{COLUMNS.map((h, i) => <th key={h} className={i === 1 || i === 5 ? "r" : undefined}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.statementId}-${row.txnId}`}>
                  <td>{dm(row.date)}{row.fromEarlierFile && <div className="l-note">file trước</div>}</td>
                  <td className="r money">{money(row.amount)}</td>
                  <td id={senderCellId(row)}>{row.sender}</td>
                  <td className="mono">{row.content}</td>
                  <td>{row.resolvedTo ? <span className="muted">{row.reason}</span> : <span className="l-tag warn">{row.reason}</span>}</td>
                  <td className="r">
                    <AssignCell row={row} fee={data.collection.amount} assignable={data.assignable} canMoney={canMoney}
                      busy={resolve.isPending && resolve.variables?.row.txnId === row.txnId && resolve.variables.row.statementId === row.statementId}
                      onAssign={(personIds) => resolve.mutate({ row, personIds })} />
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 && <tr><td colSpan={6} className="l-empty-cell">Không có giao dịch nào cần gán tay.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {data.reportedUnseen.length > 0 && <ReportedUnseen data={data} />}
    </>
  );
}

function AssignCell({ row, fee, assignable, canMoney, busy, onAssign }: {
  row: ReconRowDto; fee: number; assignable: ReconciliationRes["assignable"]; canMoney: boolean; busy: boolean; onAssign: (personIds: string[]) => void;
}) {
  const [pick, setPick] = useState("");
  const [error, setError] = useState("");
  const selectRef = useRef<HTMLSelectElement>(null);
  if (row.resolvedTo) return <span className="l-tag ok">Đã ghi nhận: {row.resolvedTo.map((p) => p.name).join(", ")}</span>;

  const describedBy = senderCellId(row);
  const amountText = `${money(row.amount)} của ${row.sender}`;
  // Mọi người được gợi ý đều đã đóng (xét theo trạng thái máy chủ trả về lúc này, không theo chữ của lý do tính lúc tải file):
  // có thể tiền là của người khác, nên thủ quỹ chọn tay. Còn người chưa đóng thì ghi nhận theo gợi ý, phần của người đã đóng là đóng thừa.
  const alreadyPaid = row.suggestion.length > 0 && row.suggestion.every((s) => isPaid(s.state));
  if (row.suggestion.length >= 1 && !alreadyPaid) {
    const n = row.suggestion.length;
    return (
      <div className="l-assign">
        <span className="l-assign-hint">{suggestionHint(row, fee)}</span>
        <LichConfirm className="l-btn l-sm" disabled={!canMoney} describedBy={describedBy} busy={busy} confirm="Ghi vào sổ"
          title={`Ghi nhận ${amountText} cho ${row.suggestion.map((s) => s.name).join(", ")}?`} description={confirmText(row.suggestion)}
          onConfirm={() => onAssign(row.suggestion.map((s) => s.personId))}>
          {n === 1 ? "Ghi nhận" : n === 2 ? "Ghi nhận cả hai" : `Ghi nhận cả ${n}`}
        </LichConfirm>
      </div>
    );
  }

  // Người đã đóng mà chuyển thêm: vẫn cho chọn đúng người đó, tiền ghi là đóng thừa (hoàn tiền chưa có trong bản MVP).
  const suggested = alreadyPaid ? row.suggestion.map((s) => ({ id: s.personId, name: s.name, state: s.state, label: joinLabel(s.name, s.code, paidNote(s)) })) : [];
  const others = assignable.filter((a) => !suggested.some((s) => s.id === a.personId))
    .map((a) => ({ id: a.personId, name: a.name, state: a.state, label: joinLabel(a.name, a.code, a.state === "reported" ? "đã báo chuyển" : undefined) }));
  const options = [...suggested, ...others];
  const picked = options.find((o) => o.id === pick);
  const errorId = `assign-error-${row.statementId}-${row.txnId}`;
  const selectId = `assign-${row.statementId}-${row.txnId}`;
  const askPick = () => { setError("Chọn thành viên trước."); selectRef.current?.focus(); };
  return (
    <div className="l-assign-col">
      <div className="l-assign">
        <label htmlFor={selectId} className="l-sr">Gán giao dịch {money(row.amount)} ngày {dm(row.date)} của {row.sender} cho thành viên</label>
        <select ref={selectRef} id={selectId} className="l-select sm" value={pick} disabled={!canMoney}
          onChange={(e) => { setPick(e.target.value); setError(""); }} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}>
          <option value="">Chọn thành viên</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        {picked
          ? <LichConfirm className="l-btn l-sm" disabled={!canMoney} describedBy={describedBy} busy={busy} confirm="Ghi vào sổ"
              title={`Ghi nhận ${amountText} cho ${picked.name}?`} description={confirmText([picked])} onConfirm={() => onAssign([picked.id])}>Ghi nhận</LichConfirm>
          : <button type="button" className="l-btn l-sm" disabled={!canMoney} aria-describedby={describedBy} onClick={askPick}>Ghi nhận</button>}
      </div>
      {error && <p id={errorId} className="l-error">{error}</p>}
    </div>
  );
}

function ReportedUnseen({ data }: { data: ReconciliationRes }) {
  const people = data.reportedUnseen;
  const lastDate = data.latest!.to;
  return (
    <div className="l-sec">
      <div className="l-sec-head"><h2>Báo đã chuyển nhưng chưa thấy trong sao kê ({people.length})</h2></div>
      {people.map((p) => (
        <div key={p.personId} className="l-unseen">
          <p>
            <strong>{p.name}</strong>{p.code && <> · <span className="code">{data.collection.codePrefix} {p.code}</span></>}
            {" · "}báo đã chuyển{p.reportedAt ? ` lúc ${hm(p.reportedAt)} ngày ${dm(p.reportedAt)}` : ""}. Sao kê này chỉ tới {dm(lastDate)}, giao dịch về trễ sẽ có ở lần tải sau.
          </p>
          <span className="l-tag wait">Chờ lần tải sau</span>
          <button type="button" className="l-btn2 l-sm" aria-disabled="true" onClick={() => toast("Bản demo chưa gửi tin nhắn được.")}>Nhắn hỏi</button>
        </div>
      ))}
    </div>
  );
}
