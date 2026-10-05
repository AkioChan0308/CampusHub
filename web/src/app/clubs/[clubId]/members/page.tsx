"use client";

// Ban điều hành · Thành viên và đơn xin vào (design/screens/BDH-ThanhVien.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/members và /applications. Duyệt, từ chối đơn: POST .../applications/:id/approve | reject.
// Thêm ngày 04/10/2026 (mô tả được Hiệu duyệt): "Nhập từ Excel" mở màn Thêm thành viên; cột Thao tác có link mời của người
// chưa nhận lời mời và nút "Sửa" vai trò, ban (chủ nhiệm): PUT .../members/:personId.

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { ApplicationDto, ApplicationRes, ApproveApplicationRes, MembersRes, Role, UpdateMemberRes } from "@contract";
import { apiPost, apiPut } from "@/api/client";
import { memberRows } from "@/api/exports";
import { errorText, useApplications, useClubMutation, useMembers } from "@/api/queries";
import { CopyButton } from "@/components/CopyButton";
import { Icon } from "@/components/Icon";
import { BoardFrame, useFrameSawPending, useLichBoard } from "@/components/lich/BoardFrame";
import { LichConfirm } from "@/components/lich/Confirm";
import { DialogClose, LichDialog } from "@/components/lich/Dialog";
import { ErrorGate } from "@/components/lich/Gate";
import { LichPage, LinkIcon, Loading, Reveal, Skel, SkelLine, useSawPending } from "@/components/lich/motion";
import { ColGroup, PageTop, TableSkeleton } from "@/components/lich/PageTop";
import { PayTag } from "@/components/lich/PayTag";
import { appUrl } from "@/components/url";
import { downloadCsv } from "@/lib/csv";
import { agoLabel, dm } from "@/lib/format";
import { can, RIGHT_LABEL } from "@/lib/selectors";
import { matchesSearch } from "@/lib/text";
import { ROLE_LABEL } from "@/lib/types";

const FIRST_ROWS = 6;
const WIDTHS = ["22%", "13%", "12%", "12%", "18%", "13%", "10%"];
const columns = (term: string) => ["Họ tên", "Ban", "Vai trò", "Điểm danh kỳ này", `Quỹ ${term}`, "Tài khoản", "Thao tác"];
const FOOT_NOTE = "Người chưa nhận lời mời vẫn có tên trong danh sách và vẫn được điểm danh tay.";

export default function Page() {
  const { clubId } = useParams<{ clubId: string }>();
  useMembers(clubId); // tải song song với khung
  useApplications(clubId);
  return (
    <LichPage>
      <BoardFrame clubId={clubId} active="members" fallback={<MembersSkeleton />}>
        <Members />
      </BoardFrame>
    </LichPage>
  );
}

/** Ô lọc của danh sách: dùng chung cho màn thật và khung xương. Khung xương: ô giữ đúng kiểu của trang thật nhưng không bấm được. */
function Filters({ query, onQuery, dept, onDept, depts, placeholder = false }: {
  query: string; onQuery: (v: string) => void; dept: string; onDept: (v: string) => void; depts: string[]; placeholder?: boolean;
}) {
  const inert = placeholder ? { tabIndex: -1, "aria-hidden": true, readOnly: true } as const : {};
  return (
    <div className={placeholder ? "l-filters l-inert" : "l-filters"}>
      <label htmlFor="tim-tv" className="l-flabel">Tìm</label>
      <input id="tim-tv" className="l-input sm l-search" type="search" placeholder="Tên hoặc email" value={query} {...inert} onChange={(e) => onQuery(e.target.value)} />
      <label htmlFor="loc-ban" className="l-flabel">Ban</label>
      <select id="loc-ban" className="l-select sm" value={dept} tabIndex={placeholder ? -1 : undefined} aria-hidden={placeholder || undefined} onChange={(e) => onDept(e.target.value)}>
        <option value="all">Tất cả các ban</option>
        {depts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );
}

/** Khung xương đúng cấu trúc màn: tiêu đề hai phần, ô lọc, tiêu đề cột là thật; số liệu là thanh trong dòng chữ. */
function MembersSkeleton({ term }: { term?: string }) {
  const noop = () => {};
  return (
    <>
      <PageTop title="Thành viên" sub={<SkelLine w={380} />} actions={<><Skel w={150} h={40} /><Skel w={120} h={40} /><Skel w={140} h={40} /></>} />
      <Loading className="l-sheet">
        <div className="l-sec">
          <div className="l-sec-head"><h2>Đơn xin vào đang chờ (<SkelLine w={14} />)</h2><span className="l-note"><SkelLine w={320} /></span></div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="l-app">
              <div className="l-field"><span className="l-app-name"><SkelLine w={150} /></span><span className="l-note"><SkelLine w={190} /></span></div>
              <span className="l-app-reason"><SkelLine w="70%" /></span>
              <div className="l-row-actions"><Skel w={84} h={34} /><Skel w={76} h={34} /></div>
            </div>
          ))}
        </div>
        <div className="l-sec">
          <div className="l-sec-head"><h2>Danh sách thành viên</h2><Filters query="" onQuery={noop} dept="all" onDept={noop} depts={[]} placeholder /></div>
          <TableSkeleton headers={columns(term ?? "").map((h, i) => (i === 6 ? <span key={h} className="l-sr">{h}</span> : h))} widths={WIDTHS} rows={FIRST_ROWS} right={[3, 6]} tags={[4]} />
          <div className="l-foot"><span className="l-grow"><SkelLine w="60%" /></span><Skel w={88} h={34} /></div>
        </div>
      </Loading>
    </>
  );
}

function Members() {
  const { club } = useLichBoard();
  const members = useMembers(club.id);
  const apps = useApplications(club.id);
  const pending = members.isPending || apps.isPending;
  const sawHere = useSawPending(pending);
  const sawFrame = useFrameSawPending();
  const error = members.error ?? apps.error;
  if (error) return <><PageTop title="Thành viên" /><ErrorGate inline error={error} onRetry={() => { void members.refetch(); void apps.refetch(); }} back={{ href: `/clubs/${club.id}`, label: "Về trang chủ CLB" }} /></>;
  if (!members.data || !apps.data) return <MembersSkeleton term={club.term} />;
  return <MembersBody data={members.data} applications={apps.data.applications} fade={sawHere || sawFrame} />;
}

function MembersBody({ data, applications, fade }: { data: MembersRes; applications: ApplicationDto[]; fade: boolean }) {
  const { club, me } = useLichBoard();
  // Duyệt hay từ chối xong thì dòng đơn biến mất: đưa focus về tiêu đề phần để không rơi về đầu trang.
  const appsTitle = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const canDecide = can(me.role, "approveApplication");
  const canAssign = can(me.role, "assignRole");
  const fee = data.collection?.amount ?? 0;
  const pendingInvites = data.members.filter((x) => x.invite === "pending").length;
  const depts = [...new Set(data.members.map((x) => x.department))].sort((a, b) => a.localeCompare(b, "vi"));
  const rows = data.members.filter((x) => (dept === "all" || x.department === dept) && (matchesSearch(x.name, query) || matchesSearch(x.email, query)));
  const visible = showAll ? rows : rows.slice(0, FIRST_ROWS);
  const cols = columns(data.term);

  const approve = useClubMutation(club.id, (a: ApplicationDto) => apiPost<ApproveApplicationRes>(`/clubs/${club.id}/applications/${a.id}/approve`), {
    onSuccess: (_res, a) => { toast.success(`Đã duyệt đơn của ${a.name}.`); appsTitle.current?.focus(); },
  });
  const reject = useClubMutation(club.id, (a: ApplicationDto) => apiPost<ApplicationRes>(`/clubs/${club.id}/applications/${a.id}/reject`), {
    onSuccess: (_res, a) => { toast.success(`Đã từ chối đơn của ${a.name}.`); appsTitle.current?.focus(); },
  });
  const busy = (a: ApplicationDto) => (approve.isPending && approve.variables?.id === a.id) || (reject.isPending && reject.variables?.id === a.id);

  return (
    <>
      <PageTop
        title="Thành viên"
        sub={`${data.members.length} thành viên · ${pendingInvites} người chưa nhận lời mời · học kỳ ${data.term}`}
        actions={<>
          {canDecide && <Link className="l-btn2" href={`/clubs/${club.id}/members/add`}><LinkIcon name="upload" size={18} />Nhập từ Excel</Link>}
          {/* Xuất cả danh sách, không theo ô Tìm và ô Ban: nút nằm xa bộ lọc nên người bấm tưởng đã xuất đủ. */}
          <button type="button" className="l-btn2" onClick={() => downloadCsv(`thanh-vien-${club.id}.csv`, memberRows(data))}><Icon name="download" size={18} />Xuất Excel</button>
          <CopyButton className="l-btn" icon="link" text={appUrl(`/explore/${club.id}`)} label="Tạo link mời" notice="Đã sao chép link trang CLB. Gửi link này để sinh viên gửi đơn xin vào." />
        </>}
      />

      <Reveal from={fade} className="l-sheet">
        <div className="l-sec">
          <div className="l-sec-head">
            <h2 ref={appsTitle} tabIndex={-1}>Đơn xin vào đang chờ ({applications.length})</h2>
            <span className="l-note">{canDecide ? "Người xin vào nhận email ngay khi bạn duyệt hoặc từ chối." : RIGHT_LABEL.approveApplication}</span>
          </div>
          {applications.length === 0 && <p className="l-empty">Không có đơn nào đang chờ.</p>}
          <AnimatePresence initial={false}>
            {applications.map((a) => (
              <m.div key={a.id} className="l-app" exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                <div className="l-field">
                  <span className="l-app-name">{a.name}</span>
                  <span className="l-note">Năm {a.year} · gửi {dm(a.submittedAt)} ({agoLabel(a.submittedAt)})</span>
                </div>
                {a.reason ? <span className="l-app-reason">“{a.reason}”</span> : <span className="l-note">Không ghi lý do.</span>}
                <div className="l-row-actions">
                  <LichConfirm className="l-btn2 l-sm" disabled={!canDecide} busy={reject.isPending && reject.variables?.id === a.id} title={`Từ chối đơn của ${a.name}?`}
                    description="Người xin vào sẽ thấy đơn bị từ chối ở trang CLB." confirm="Từ chối đơn" focusAfter={() => appsTitle.current?.focus()}
                    onConfirm={() => reject.mutate(a)}>Từ chối</LichConfirm>
                  <button type="button" className="l-btn l-sm" disabled={!canDecide} aria-busy={(approve.isPending && approve.variables?.id === a.id) || undefined}
                    onClick={() => { if (!busy(a)) approve.mutate(a); }}>Duyệt</button>
                </div>
              </m.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="l-sec">
          <div className="l-sec-head">
            <h2>Danh sách thành viên</h2>
            <Filters query={query} onQuery={(v) => { setQuery(v); setShowAll(false); }} dept={dept} onDept={(v) => { setDept(v); setShowAll(false); }} depts={depts} />
          </div>
          <div className="l-table-wrap">
            <table className="l-table l-fixed">
              <ColGroup widths={WIDTHS} />
              <thead><tr>{cols.map((h, i) => <th key={h} className={i === 3 || i === 6 ? "r" : undefined}>{i === 6 ? <span className="l-sr">{h}</span> : h}</th>)}</tr></thead>
              <tbody>
                {visible.map((x) => (
                  <tr key={x.personId}>
                    <td className="name">{x.name}{x.deletionRequestedAt && <> <span className="l-tag warn">Đang xử lý yêu cầu xóa</span></>}</td>
                    <td>{x.department}</td>
                    <td>{ROLE_LABEL[x.role]}</td>
                    <td className="r">{x.attended}/{data.heldSessions}</td>
                    <td><PayTag payment={x.payment} fee={fee} /></td>
                    <td>{x.invite === "accepted" ? "Đã nhận lời mời" : <span className="l-tag off">Chưa nhận lời mời</span>}</td>
                    <td className="r">
                      <span className="l-row-actions l-row-end">
                        {x.inviteCode && (
                          <CopyButton iconOnly className="l-icon-btn l-icon-sm" icon="link" text={appUrl(`/invite/${x.inviteCode}`)}
                            label={`Sao chép link mời của ${x.name}`} notice={`Đã sao chép link mời của ${x.name}. Gửi riêng cho người này qua Zalo.`} />
                        )}
                        {canAssign && <EditMember clubId={club.id} member={x} depts={depts} />}
                      </span>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={7} className="l-empty-cell">Không có thành viên nào khớp. Xóa ô Tìm hoặc chọn Tất cả các ban.</td></tr>}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="l-foot">
              <span>Đang hiện {visible.length}/{rows.length}. {FOOT_NOTE}</span>
              {rows.length > FIRST_ROWS && <button type="button" className="l-btn2 l-sm" onClick={() => setShowAll((v) => !v)}>{showAll ? "Thu gọn" : "Xem tiếp"}</button>}
            </div>
          )}
        </div>
      </Reveal>
    </>
  );
}

type MemberRow = MembersRes["members"][number];
/** Vai chọn được khi sửa: chủ nhiệm chỉ đổi ở màn Bàn giao. */
const ASSIGNABLE: Role[] = ["vice", "treasurer", "head", "member"];

/** Nút "Sửa" và hộp sửa vai trò, ban của một thành viên (chỉ chủ nhiệm). */
function EditMember({ clubId, member, depts }: { clubId: string; member: MemberRow; depts: string[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(member.role);
  const [dept, setDept] = useState(member.department);
  // deptError: lỗi của ô Ban; error: lỗi từ máy chủ (không thuộc ô nào).
  const [deptError, setDeptError] = useState("");
  const [error, setError] = useState("");
  const isPresident = member.role === "president";
  const save = useClubMutation(clubId, (body: { role: Role; department: string }) => apiPut<UpdateMemberRes>(`/clubs/${clubId}/members/${member.personId}`, body), {
    onSuccess: (r) => { toast.success(`Đã lưu: ${r.member.name} · ${ROLE_LABEL[r.member.role]} · ${r.member.department}.`); setOpen(false); },
    onError: (e) => setError(errorText(e)),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    if (!dept.trim()) { setDeptError("Cần ghi ban."); document.getElementById(`ban-o-${member.personId}`)?.focus(); return; }
    save.mutate({ role, department: dept.trim() });
  }

  const listId = `ban-${member.personId}`;
  return (
    <>
      <button type="button" className="l-btn2 l-sm" aria-label={`Sửa vai trò và ban của ${member.name}`}
        onClick={() => { setRole(member.role); setDept(member.department); setError(""); setDeptError(""); setOpen(true); }}>Sửa</button>
      <LichDialog open={open} onOpenChange={setOpen} title={`Sửa ${member.name}`} description={`Mã ${member.code} · ${member.email}`}>
        <form className="l-form" onSubmit={submit} noValidate>
          <div className="l-field">
            <label className="l-flabel" htmlFor={`vai-${member.personId}`}>Vai trò</label>
            <select id={`vai-${member.personId}`} className="l-select" value={role} disabled={isPresident} aria-describedby={isPresident ? `vai-${member.personId}-ly-do` : undefined}
              onChange={(e) => setRole(e.target.value as Role)}>
              {(isPresident ? ["president" as Role] : ASSIGNABLE).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            {isPresident && <span id={`vai-${member.personId}-ly-do`} className="l-hint">Đổi chủ nhiệm làm ở màn Bàn giao.</span>}
          </div>
          <div className="l-field">
            <label className="l-flabel" htmlFor={`ban-o-${member.personId}`}>Ban</label>
            <input id={`ban-o-${member.personId}`} className="l-input" list={listId} value={dept}
              aria-invalid={deptError ? true : undefined} aria-describedby={deptError ? `ban-o-${member.personId}-loi` : undefined}
              onChange={(e) => { setDept(e.target.value); setDeptError(""); setError(""); }} />
            {deptError && <span id={`ban-o-${member.personId}-loi`} className="l-error">{deptError}</span>}
            <datalist id={listId}>{depts.map((d) => <option key={d} value={d} />)}</datalist>
          </div>
          {error && <p className="l-error" role="alert">{error}</p>}
          <div className="l-dialog-actions">
            <DialogClose className="l-btn2">Hủy</DialogClose>
            <button type="submit" className="l-btn" aria-busy={save.isPending || undefined}>Lưu</button>
          </div>
        </form>
      </LichDialog>
    </>
  );
}
