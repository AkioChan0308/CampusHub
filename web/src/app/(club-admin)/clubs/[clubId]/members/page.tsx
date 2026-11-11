"use client";

// Ban điều hành · Thành viên và đơn xin vào (design/screens/BDH-ThanhVien.html), thế giới "Lịch bloc".
// Dữ liệu từ GET /clubs/:clubId/members và /applications. Duyệt, từ chối đơn: POST .../applications/:id/approve | reject.
// Thêm ngày 04/10/2026 (mô tả được Hiệu duyệt): "Nhập từ Excel" mở màn Thêm thành viên; cột Thao tác có link mời của người
// chưa nhận lời mời và nút "Sửa" vai trò, ban (chủ nhiệm): PUT .../members/:personId.
// Thêm ngày 09/11/2026 (mô tả: docs/mo-ta-ban-giao-theo-vai.md): khối "Các ban" (chủ nhiệm thêm, đổi tên, đặt trưởng, xóa ban:
// POST, PUT, DELETE .../departments); ô Ban của hộp "Sửa" chọn từ danh sách ban thay vì gõ chữ.

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { ApplicationDto, ApplicationRes, ApproveApplicationRes, DepartmentDto, DepartmentsRes, MembersRes, Role, UpdateMemberRes } from "@contract";
import { apiDelete, apiPost, apiPut } from "@/api/client";
import { memberRows } from "@/api/excel-rows";
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
import { NO_DEPARTMENT, ROLE_LABEL } from "@/lib/types";

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
      <label htmlFor="member-search" className="l-flabel">Tìm</label>
      <input id="member-search" className="l-input sm l-search" type="search" placeholder="Tên hoặc email" value={query} {...inert} onChange={(e) => onQuery(e.target.value)} />
      <label htmlFor="department-filter" className="l-flabel">Ban</label>
      <select id="department-filter" className="l-select sm" value={dept} tabIndex={placeholder ? -1 : undefined} aria-hidden={placeholder || undefined} onChange={(e) => onDept(e.target.value)}>
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
  // Ban để lọc và để chọn: các ban của CLB, kèm "Chưa xếp ban" khi còn người chưa xếp.
  const depts = [...data.departments.map((d) => d.name), ...(data.members.some((x) => x.department === NO_DEPARTMENT) ? [NO_DEPARTMENT] : [])];
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
                        {canAssign && <EditMember clubId={club.id} member={x} departments={data.departments} />}
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

        <DepartmentsSection clubId={club.id} data={data} canAssign={canAssign} />
      </Reveal>
    </>
  );
}

type MemberRow = MembersRes["members"][number];
/** Vai chọn được khi sửa: chủ nhiệm chỉ đổi ở màn Bàn giao. */
const ASSIGNABLE: Role[] = ["vice", "treasurer", "head", "member"];

/** Nút "Sửa" và hộp sửa vai trò, ban của một thành viên (chỉ chủ nhiệm). */
function EditMember({ clubId, member, departments }: { clubId: string; member: MemberRow; departments: DepartmentDto[] }) {
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
    if (role === "head" && dept === NO_DEPARTMENT) { setDeptError("Chọn ban mà người này làm trưởng."); document.getElementById(`department-${member.personId}`)?.focus(); return; }
    save.mutate({ role, department: dept });
  }

  // Chọn vai Trưởng ban thì người này thành trưởng của ban đã chọn; trưởng cũ của ban đó về thành viên nếu không còn làm trưởng ban nào.
  const replaced = role === "head" ? departments.find((d) => d.name === dept)?.head : undefined;
  return (
    <>
      <button type="button" className="l-btn2 l-sm" aria-label={`Sửa vai trò và ban của ${member.name}`}
        onClick={() => { setRole(member.role); setDept(member.department); setError(""); setDeptError(""); setOpen(true); }}>Sửa</button>
      <LichDialog open={open} onOpenChange={setOpen} title={`Sửa ${member.name}`} description={`Mã ${member.code} · ${member.email}`}>
        <form className="l-form" onSubmit={submit} noValidate>
          <div className="l-field">
            <label className="l-flabel" htmlFor={`role-${member.personId}`}>Vai trò</label>
            <select id={`role-${member.personId}`} className="l-select" value={role} disabled={isPresident} aria-describedby={isPresident ? `role-${member.personId}-reason` : undefined}
              onChange={(e) => setRole(e.target.value as Role)}>
              {(isPresident ? ["president" as Role] : ASSIGNABLE).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            {isPresident && <span id={`role-${member.personId}-reason`} className="l-hint">Đổi chủ nhiệm làm ở màn Bàn giao.</span>}
          </div>
          <div className="l-field">
            <label className="l-flabel" htmlFor={`department-${member.personId}`}>Ban</label>
            <select id={`department-${member.personId}`} className="l-select" value={dept}
              aria-invalid={deptError ? true : undefined} aria-describedby={deptError ? `department-${member.personId}-error` : `department-${member.personId}-hint`}
              onChange={(e) => { setDept(e.target.value); setDeptError(""); setError(""); }}>
              <option value={NO_DEPARTMENT}>{NO_DEPARTMENT}</option>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            {deptError && <span id={`department-${member.personId}-error`} className="l-error">{deptError}</span>}
            <span id={`department-${member.personId}-hint`} className="l-hint">
              {role === "head"
                ? `Người này sẽ làm trưởng ban ${dept === NO_DEPARTMENT ? "đã chọn" : dept}.${replaced && replaced.personId !== member.personId ? ` ${replaced.name} đang là trưởng ban này và sẽ về thành viên nếu không còn làm trưởng ban nào.` : ""}`
                : "Ban chỉ chọn từ danh sách. Chưa có ban cần dùng thì chủ nhiệm thêm ở khối Các ban."}
            </span>
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

const DEPARTMENT_WIDTHS = ["34%", "30%", "14%", "22%"];
const DELETE_HINT_ID = "department-delete-hint";

/**
 * Các ban của CLB (09/11/2026): mỗi ban đúng một trưởng ban, một người được làm trưởng nhiều ban.
 * Chỉ chủ nhiệm thêm, đổi tên, đặt trưởng và xóa ban; người khác trong ban điều hành chỉ xem.
 */
function DepartmentsSection({ clubId, data, canAssign }: { clubId: string; data: MembersRes; canAssign: boolean }) {
  const title = useRef<HTMLHeadingElement>(null);
  const remove = useClubMutation(clubId, (d: DepartmentDto) => apiDelete<DepartmentsRes>(`/clubs/${clubId}/departments/${d.id}`), {
    onSuccess: (_res, d) => { toast.success(`Đã xóa ban ${d.name}.`); title.current?.focus(); },
  });
  const list = data.departments;
  return (
    <div className="l-sec">
      <div className="l-sec-head">
        <h2 ref={title} tabIndex={-1}>Các ban ({list.length})</h2>
        {canAssign ? <AddDepartment clubId={clubId} /> : <span className="l-note">{RIGHT_LABEL.assignRole}</span>}
      </div>
      {list.length === 0 && <p className="l-empty">CLB chưa có ban nào.{canAssign ? " Bấm Thêm ban để tạo ban đầu tiên." : ""}</p>}
      {list.length > 0 && (
        <div className="l-table-wrap">
          <table className="l-table l-fixed">
            <ColGroup widths={DEPARTMENT_WIDTHS} />
            <thead><tr><th>Ban</th><th>Trưởng ban</th><th className="r">Thành viên</th><th className="r"><span className="l-sr">Thao tác</span></th></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td className="name">{d.name}</td>
                  <td>{d.head ? d.head.name : <span className="l-note">Chưa có trưởng ban</span>}</td>
                  <td className="r">{d.members}</td>
                  <td className="r">
                    {canAssign && (
                      <span className="l-row-actions l-row-end">
                        <EditDepartment clubId={clubId} department={d} data={data} />
                        <LichConfirm className="l-btn2 l-sm" label={`Xóa ban ${d.name}`} describedBy={d.members > 0 || d.head ? DELETE_HINT_ID : undefined}
                          disabled={d.members > 0 || !!d.head} busy={remove.isPending && remove.variables?.id === d.id}
                          title={`Xóa ban ${d.name}?`} description="Ban chưa có thành viên và chưa có trưởng ban. Muốn dùng lại thì thêm ban mới."
                          confirm="Xóa ban" focusAfter={() => title.current?.focus()} onConfirm={() => remove.mutate(d)}>Xóa</LichConfirm>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="l-foot">
        <span id={DELETE_HINT_ID}>Mỗi ban có đúng một trưởng ban; một người được làm trưởng nhiều ban. Ban còn thành viên hoặc còn trưởng ban thì chưa xóa được: chuyển thành viên sang ban khác và bàn giao vị trí trưởng ban trước.</span>
      </div>
    </div>
  );
}

/** Nút Thêm ban và hộp nhập tên ban. Tên không trùng ban khác của CLB. */
function AddDepartment({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const add = useClubMutation(clubId, (body: { name: string }) => apiPost<DepartmentsRes>(`/clubs/${clubId}/departments`, body), {
    onSuccess: () => { toast.success(`Đã thêm ban ${name.trim()}.`); setOpen(false); },
    onError: (e) => { setError(errorText(e)); document.getElementById("department-new")?.focus(); },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (add.isPending) return;
    if (!name.trim()) { setError("Cần ghi tên ban."); document.getElementById("department-new")?.focus(); return; }
    add.mutate({ name: name.trim() });
  }
  return (
    <>
      <button type="button" className="l-btn2 l-sm" onClick={() => { setName(""); setError(""); setOpen(true); }}>Thêm ban</button>
      <LichDialog open={open} onOpenChange={setOpen} title="Thêm ban" description="Tên ban tối đa 60 ký tự, không trùng ban khác của CLB.">
        <form className="l-form" onSubmit={submit} noValidate>
          <div className="l-field">
            <label className="l-flabel" htmlFor="department-new">Tên ban</label>
            <input id="department-new" className="l-input" value={name} maxLength={60} aria-invalid={error ? true : undefined} aria-describedby={error ? "department-new-error" : undefined}
              onChange={(e) => { setName(e.target.value); setError(""); }} />
            {error && <span id="department-new-error" className="l-error" role="alert">{error}</span>}
          </div>
          <div className="l-dialog-actions">
            <DialogClose className="l-btn2">Hủy</DialogClose>
            <button type="submit" className="l-btn" aria-busy={add.isPending || undefined}>Thêm ban</button>
          </div>
        </form>
      </LichDialog>
    </>
  );
}

/** Đổi tên ban và đặt hoặc bỏ trưởng ban. Trưởng ban là thành viên đã nhận lời mời, không phải chủ nhiệm, phó chủ nhiệm, thủ quỹ. */
function EditDepartment({ clubId, department, data }: { clubId: string; department: DepartmentDto; data: MembersRes }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(department.name);
  const [head, setHead] = useState(department.head?.personId ?? "");
  const [error, setError] = useState("");
  const candidates = data.members.filter((x) => x.invite === "accepted" && (x.role === "member" || x.role === "head"));
  const otherBans = head ? data.departments.filter((d) => d.id !== department.id && d.head?.personId === head).map((d) => d.name) : [];
  const save = useClubMutation(clubId, (body: { name?: string; headId?: string | null }) => apiPut<DepartmentsRes>(`/clubs/${clubId}/departments/${department.id}`, body), {
    onSuccess: () => { toast.success(`Đã lưu ban ${name.trim()}.`); setOpen(false); },
    onError: (e) => setError(errorText(e)),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (save.isPending) return;
    if (!name.trim()) { setError("Cần ghi tên ban."); document.getElementById(`department-name-${department.id}`)?.focus(); return; }
    const body: { name?: string; headId?: string | null } = {};
    if (name.trim() !== department.name) body.name = name.trim();
    if (head !== (department.head?.personId ?? "")) body.headId = head || null;
    if (Object.keys(body).length === 0) { setOpen(false); return; }
    save.mutate(body);
  }
  return (
    <>
      <button type="button" className="l-btn2 l-sm" aria-label={`Sửa ban ${department.name}`}
        onClick={() => { setName(department.name); setHead(department.head?.personId ?? ""); setError(""); setOpen(true); }}>Sửa</button>
      <LichDialog open={open} onOpenChange={setOpen} title={`Sửa ban ${department.name}`} description="Đổi tên ban thì thành viên và trưởng ban giữ nguyên.">
        <form className="l-form" onSubmit={submit} noValidate>
          <div className="l-field">
            <label className="l-flabel" htmlFor={`department-name-${department.id}`}>Tên ban</label>
            <input id={`department-name-${department.id}`} className="l-input" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setError(""); }} />
          </div>
          <div className="l-field">
            <label className="l-flabel" htmlFor={`department-head-${department.id}`}>Trưởng ban</label>
            <select id={`department-head-${department.id}`} className="l-select" value={head} aria-describedby={`department-head-${department.id}-hint`}
              onChange={(e) => { setHead(e.target.value); setError(""); }}>
              <option value="">Chưa có trưởng ban</option>
              {candidates.map((x) => <option key={x.personId} value={x.personId}>{x.name}</option>)}
            </select>
            <span id={`department-head-${department.id}-hint`} className="l-hint">
              {otherBans.length > 0 ? `${data.members.find((x) => x.personId === head)?.name} cũng là trưởng ban ${otherBans.join(", ")}. Một người được làm trưởng nhiều ban.` : "Chỉ thành viên đã nhận lời mời; chủ nhiệm, phó chủ nhiệm và thủ quỹ không kiêm trưởng ban."}
            </span>
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
