"use client";

// Ban điều hành · Thêm thành viên: nhập từ file Excel (.xlsx) hoặc CSV, hoặc gõ tay từng người. Bản vẽ chưa có màn này:
// mô tả được Hiệu duyệt ngày 04/10/2026. Xem trước trong bảng sửa được, dòng lỗi báo ngay tại dòng đó.
// Gửi POST /clubs/:clubId/members. Bản demo chưa gửi email: xong thì hiện link mời của từng người để gửi qua Zalo.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, type ChangeEvent, type RefObject } from "react";
import { toast } from "sonner";
import type { AddMembersRes } from "@contract";
import { apiPost } from "@/api/client";
import { errorText, useClubMutation, useMembers } from "@/api/queries";
import { CopyButton } from "@/components/CopyButton";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop } from "@/components/lich/PageTop";
import { appUrl } from "@/components/url";
import { downloadCsv } from "@/lib/csv";
import { hasErrors, MEMBER_FILE_HEADERS, memberErrors, tableToMembers, toAddMembers, type DraftMember } from "@/lib/members-file";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { parseCsv } from "@/lib/text";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useMembers(clubId); // tải song song với khung
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="members" fallback={<AddSkeleton />}>
        <AddMembers />
      </BoardFrame>
    </LichPage>
  );
}

const TITLE = "Thêm thành viên";
const SUB = "Nhập danh sách từ Excel hoặc gõ từng người. Mỗi người nhận một link mời riêng để tự đồng ý cho CLB lưu dữ liệu.";
const MAX_ROWS = 300;
const COLS = ["Họ tên", "Email", "Ban", "Năm học", ""];
const WIDTHS = ["30%", "34%", "18%", "10%", "8%"];
const EMPTY: DraftMember = { name: "", email: "", department: "", year: "" };
const isBlank = (r: DraftMember) => !r.name.trim() && !r.email.trim() && !r.department.trim() && !r.year.trim();

function TemplateButton() {
  // Dữ liệu mẫu tự đặt, không phải người thật.
  const download = () => downloadCsv("mau-danh-sach-thanh-vien.csv", [[...MEMBER_FILE_HEADERS], ["Nguyễn Văn Mẫu", "mau.nguyen@example.com", "Truyền thông", 1], ["Trần Thị Thử", "thu.tran@example.com", "Hậu cần", 2]]);
  return <button type="button" className="l-btn2" onClick={download}><Icon name="download" size={18} />Tải file mẫu</button>;
}

/** Khung xương: phần chọn file và tiêu đề cột là chữ thật; một dòng nhập trống như lúc mới mở. */
function AddSkeleton() {
  return (
    <>
      <PageTop title={TITLE} sub={SUB} actions={<Skel w={140} h={40} />} />
      <Loading className="l-sheet">
        <div className="l-sec l-file-pick">
          <span className="l-btn2 l-inert"><Icon name="upload" size={18} />Chọn file Excel hoặc CSV</span>
          <span className="l-note">Cột: Họ tên, Email, Ban, Năm học. Cột MSSV, STT có trong file thì bỏ qua, không lưu.</span>
        </div>
        <div className="l-sec">
          <div className="l-sec-head"><h2>Danh sách sẽ thêm (<SkelLine w={12} />)</h2></div>
          <div className="l-table-wrap">
            <table className="l-table l-fixed l-edit-table">
              <ColGroup widths={WIDTHS} />
              <thead><tr>{COLS.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody><tr>{COLS.slice(0, 4).map((h) => <td key={h}><span className="l-input sm l-inert" /></td>)}<td className="r"><span className="l-btn2 l-sm l-inert">Bỏ</span></td></tr></tbody>
            </table>
          </div>
          <div className="l-foot l-inert">
            <span className="l-btn2 l-sm"><Icon name="plus" size={16} />Thêm dòng</span>
            <span className="l-grow" />
            <span className="l-btn" aria-disabled="true">Thêm người</span>
          </div>
        </div>
      </Loading>
    </>
  );
}

function AddMembers() {
  const { club, me } = useLichBoard();
  const members = useMembers(club.id);
  const sawHere = useSawPending(members.isPending);
  const sawFrame = useFrameSawPending();
  if (!can(me.role, "approveApplication")) return <><PageTop title={TITLE} /><div className="l-sheet"><p className="l-empty">{RIGHT_LABEL.approveApplication}</p></div></>;
  if (members.isError) return <><PageTop title={TITLE} /><ErrorGate inline error={members.error} onRetry={() => members.refetch()} back={{ href: `/clubs/${club.id}/members`, label: "Về danh sách thành viên" }} /></>;
  if (!members.data) return <AddSkeleton />;
  return <AddForm existing={new Set(members.data.members.map((m) => m.email.toLowerCase()))} fade={sawHere || sawFrame} />;
}

/** Đọc file trong trình duyệt: .csv bằng parseCsv, .xlsx bằng read-excel-file (chỉ tải thư viện khi cần). */
async function readTable(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCsv(await file.text());
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    return (await readSheet(file)) as unknown[][];
  }
  if (name.endsWith(".xls")) throw new Error("File .xls đời cũ: mở bằng Excel rồi lưu thành .xlsx.");
  throw new Error("Chỉ nhận file .xlsx hoặc .csv.");
}

function AddForm({ existing, fade }: { existing: Set<string>; fade: boolean }) {
  const { club } = useLichBoard();
  const fileRef = useRef<HTMLInputElement>(null);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const [rows, setRows] = useState<DraftMember[]>([EMPTY]);
  const [file, setFile] = useState<{ name: string; count: number; ignored: string[] } | null>(null);
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const [added, setAdded] = useState<AddMembersRes["added"] | null>(null);

  const errors = memberErrors(rows, existing);
  const filled = rows.map((r, i) => ({ r, i })).filter(({ r }) => !isBlank(r));
  const badRows = filled.filter(({ i }) => hasErrors(errors[i]));
  const ready = filled.length > 0 && badRows.length === 0;
  const full = rows.length >= MAX_ROWS;

  const add = useClubMutation(club.id, (list: DraftMember[]) => apiPost<AddMembersRes>(`/clubs/${club.id}/members`, { members: toAddMembers(list) }), {
    onSuccess: (res) => {
      setAdded(res.added);
      toast.success(`Đã thêm ${res.added.length} người.`);
      requestAnimationFrame(() => resultTitle.current?.focus());
    },
    onError: (e) => toast.error(errorText(e)),
  });

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFileError("");
    setReading(true);
    try {
      const { members, ignored } = tableToMembers(await readTable(f));
      if (members.length === 0) throw new Error("File không có dòng nào để thêm.");
      const kept = rows.filter((r) => !isBlank(r));
      if (kept.length + members.length > MAX_ROWS) throw new Error(`Mỗi lần thêm tối đa ${MAX_ROWS} người. File này có ${members.length} người.`);
      setRows([...kept, ...members]);
      setFile({ name: f.name, count: members.length, ignored });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Không đọc được file.");
    } finally {
      setReading(false);
    }
  }

  const setCell = (i: number, k: keyof DraftMember, v: string) => setRows((list) => list.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const removeRow = (i: number) => setRows((list) => (list.length === 1 ? [EMPTY] : list.filter((_, j) => j !== i)));

  function submit() {
    if (add.isPending) return;
    if (!ready) {
      // Chưa đủ: đưa tới ô lỗi đầu tiên, hoặc ô họ tên của dòng đầu khi chưa có ai.
      const first = badRows[0];
      const key = first ? (Object.keys(errors[first.i])[0] as keyof DraftMember) : "name";
      document.getElementById(`member-${first?.i ?? 0}-${key}`)?.focus();
      return;
    }
    add.mutate(filled.map(({ r }) => r));
  }

  if (added) return <Result added={added} titleRef={resultTitle} onMore={() => { setAdded(null); setRows([EMPTY]); setFile(null); }} />;

  const cell = (i: number, k: keyof DraftMember, label: string, type = "text") => {
    const err = !isBlank(rows[i]) ? errors[i][k] : undefined;
    return (
      <td>
        <input id={`member-${i}-${k}`} className="l-input sm" type={type} inputMode={k === "year" ? "numeric" : undefined} value={rows[i][k]}
          aria-label={`${label}, dòng ${i + 1}`} aria-invalid={err ? true : undefined} aria-describedby={err ? `member-${i}-${k}-error` : undefined}
          onChange={(e) => setCell(i, k, e.target.value)} />
        {err && <span id={`member-${i}-${k}-error`} className="l-error l-cell-error">{err}</span>}
      </td>
    );
  };

  return (
    <>
      <PageTop title={TITLE} sub={SUB} actions={<TemplateButton />} />
      <Reveal from={fade} className="l-sheet">
        <div className="l-sec l-file-pick">
          <input ref={fileRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="l-sr-input" onChange={onFile} tabIndex={-1} aria-hidden="true" />
          <button type="button" className="l-btn2" aria-busy={reading || undefined} onClick={() => { if (!reading) fileRef.current?.click(); }}>
            <Icon name="upload" size={18} />Chọn file Excel hoặc CSV
          </button>
          <span className="l-note" role="status">
            {fileError ? <span className="l-error">{fileError}</span>
              : file ? `Đã đọc ${file.count} người từ ${file.name}.${file.ignored.length ? ` Bỏ qua cột ${file.ignored.join(", ")} (không lưu).` : ""}`
              : "Cột: Họ tên, Email, Ban, Năm học. Cột MSSV, STT có trong file thì bỏ qua, không lưu."}
          </span>
        </div>

        <div className="l-sec">
          <div className="l-sec-head">
            <h2>Danh sách sẽ thêm ({filled.length})</h2>
            <span className="l-note">Sửa ngay trên bảng. Ban để trống thì ghi "Chưa xếp ban".</span>
          </div>
          <div className="l-table-wrap">
            <table className="l-table l-fixed l-edit-table">
              <ColGroup widths={WIDTHS} />
              <thead><tr>{COLS.map((h, i) => <th key={i}>{h || <span className="l-sr">Bỏ dòng</span>}</th>)}</tr></thead>
              <tbody>
                {rows.map((_, i) => (
                  <tr key={i}>
                    {cell(i, "name", "Họ tên")}
                    {cell(i, "email", "Email", "email")}
                    {cell(i, "department", "Ban")}
                    {cell(i, "year", "Năm học")}
                    <td className="r"><button type="button" className="l-btn2 l-sm" aria-label={`Bỏ dòng ${i + 1}`} onClick={() => removeRow(i)}>Bỏ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="l-foot">
            <button type="button" className="l-btn2 l-sm" aria-disabled={full || undefined} aria-describedby={full ? "add-members-status" : undefined}
              onClick={() => { if (!full) setRows((list) => [...list, EMPTY]); }}><Icon name="plus" size={16} />Thêm dòng</button>
            <span id="add-members-status" className="l-grow l-foot-msg" role="status">
              {badRows.length > 0 ? `Còn ${badRows.length} dòng có lỗi. Sửa ngay trên bảng hoặc bỏ dòng đó.`
                : filled.length === 0 ? "Chưa có ai trong danh sách."
                : full ? `Mỗi lần thêm tối đa ${MAX_ROWS} người.` : ""}
            </span>
            <button type="button" className="l-btn" aria-disabled={!ready || undefined} aria-describedby={ready ? undefined : "add-members-status"} aria-busy={add.isPending || undefined} onClick={submit}>
              Thêm {filled.length > 0 ? `${filled.length} ` : ""}người
            </button>
          </div>
        </div>
      </Reveal>
    </>
  );
}

function Result({ added, titleRef, onMore }: { added: AddMembersRes["added"]; titleRef: RefObject<HTMLHeadingElement | null>; onMore: () => void }) {
  const { club } = useLichBoard();
  const link = (code: string) => appUrl(`/invite/${code}`);
  const all = added.map((p) => `${p.name} (${p.code}): ${link(p.inviteCode)}`).join("\n");
  return (
    <>
      <PageTop title={TITLE} sub={SUB} actions={<TemplateButton />} />
      <Reveal from className="l-sheet">
        <div className="l-sec">
          <div className="l-sec-head">
            <h2 ref={titleRef} tabIndex={-1}>Đã thêm {added.length} người</h2>
            <CopyButton className="l-btn" icon="link" text={all} label="Sao chép tất cả link mời" notice="Đã sao chép tên và link mời của mọi người. Dán vào nhóm Zalo của CLB." />
          </div>
          <p className="l-sec-body l-fine">
            Bản demo chưa gửi email. Gửi link mời riêng của từng người qua Zalo: người đó mở link, đăng nhập bằng đúng email trong danh sách rồi đồng ý cho CLB lưu dữ liệu.
          </p>
          <div className="l-table-wrap">
            <table className="l-table l-fixed">
              <ColGroup widths={["12%", "32%", "40%", "16%"]} />
              <thead><tr><th>Mã</th><th>Họ tên</th><th>Email</th><th className="r">Link mời</th></tr></thead>
              <tbody>
                {added.map((p) => (
                  <tr key={p.personId}>
                    <td className="code">{p.code}</td>
                    <td className="name">{p.name}</td>
                    <td>{p.email}</td>
                    <td className="r"><CopyButton className="l-btn2 l-sm" icon="link" text={link(p.inviteCode)} label="Sao chép" notice={`Đã sao chép link mời của ${p.name}.`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="l-foot">
            <button type="button" className="l-btn2 l-sm" onClick={onMore}><Icon name="plus" size={16} />Thêm tiếp</button>
            <Link className="l-btn2 l-sm" href={`/clubs/${club.id}/members`}><LinkIcon name="users" size={16} />Về danh sách thành viên</Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}
