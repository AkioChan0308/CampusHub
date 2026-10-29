// Chuyển dữ liệu nội bộ (AppState) thành đúng dạng trả về đã ghi trong contract.ts.
// Chỗ này quyết định ai thấy gì: ví dụ phía trường chỉ nhận số tổng hợp, không nhận danh sách thành viên.

import type * as C from "./contract.ts";
import {
  attendanceOf, averageAttendance, balance, budgetView, clubCollection, clubMembers, clubSummary, collectionStats, daysAgo, DUPLICATE_TXN,
  handConfirmedTransfers, heldSessions, kitSummary, latestStatement, ledgerOf, membershipOf, nextSession, isTaskOverdue, openManualAll, openTasks, participationStats, paymentsOf,
  pendingApplications, pendingExpenses, personName, recentLedger, statementsOf, tasksOf, upcomingEvents,
  type AppState, type Application, type Attendance, type Club, type ClubEvent, type Collection, type ExpenseRequest,
  type ClubPost, type ClubTask, type Handover, type KitAccount, type KitDocument, type KitProcess, type Membership, type Payment, type Person, type StatementTxn,
} from "./domain.ts";

export const CONSENT_VERSION = "chinh-sach-du-lieu-v1";

export function personRef(s: AppState, personId: string): C.PersonRef {
  return { personId, name: personName(s, personId) };
}

const codeOf = (s: AppState, clubId: string, personId: string) => membershipOf(s, clubId, personId)?.code ?? "";
const byCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code);

export function clubRef(c: Club): C.ClubRef {
  return { id: c.id, name: c.name, term: c.term };
}

export function membershipDto(s: AppState, m: Membership): C.MembershipDto {
  const club = s.clubs.find((c) => c.id === m.clubId);
  return {
    clubId: m.clubId, clubName: club?.name ?? "", term: club?.term ?? "", code: m.code, department: m.department, role: m.role,
    invite: m.invite, inviteCode: m.invite === "pending" ? m.inviteCode : undefined,
  };
}

export function personDto(p: Person): C.MeRes["person"] {
  return { id: p.id, name: p.name, email: p.email, kind: p.kind, staffTitle: p.staffTitle, year: p.year };
}

/** Người đang đăng nhập và các CLB họ ở (GET /me, và kết quả của đăng nhập nhanh). */
/** account: tài khoản đăng nhập bằng mật khẩu của người này (kho riêng, src/accounts.ts). Chỉ trả tên tài khoản và có mật khẩu chưa. */
export function meRes(s: AppState, p: Person, account?: { username?: string; passwordHash?: string }): C.MeRes {
  return {
    person: personDto(p),
    memberships: s.memberships.filter((m) => m.personId === p.id).map((m) => membershipDto(s, m)),
    account: { ...(account?.username ? { username: account.username } : {}), hasPassword: !!account?.passwordHash },
  };
}

export function eventDto(e: ClubEvent): C.EventDto {
  return { id: e.id, title: e.title, kind: e.kind, start: e.start, end: e.end, location: e.location, checkinUntil: e.checkinUntil, status: e.status, closedAt: e.closedAt };
}

/** Người nhận tiền của đợt thu, kèm vai hiện tại trong CLB (không còn ở CLB thì không có vai). */
function receiverRef(s: AppState, c: Collection): C.CollectionDto["receiver"] {
  const role = s.memberships.find((m) => m.clubId === c.clubId && m.personId === c.receiverId)?.role;
  return { ...personRef(s, c.receiverId), ...(role ? { role } : {}) };
}

export function collectionDto(s: AppState, c: Collection): C.CollectionDto {
  return { id: c.id, name: c.name, term: c.term, amount: c.amount, dueDate: c.dueDate, codePrefix: c.codePrefix, receiver: receiverRef(s, c) };
}

export function statsDto(s: AppState, collectionId: string): C.CollectionStatsDto {
  return collectionStats(s, collectionId);
}

export function applicationDto(a: Application): C.ApplicationDto {
  return { id: a.id, personId: a.personId, name: a.name, email: a.email, year: a.year, reason: a.reason, submittedAt: a.submittedAt, status: a.status, decidedAt: a.decidedAt };
}

export function attendanceDto(s: AppState, clubId: string, a: Attendance): C.AttendanceDto {
  return {
    eventId: a.eventId, personId: a.personId, name: personName(s, a.personId), code: codeOf(s, clubId, a.personId),
    at: a.at, method: a.method, by: a.byPersonId ? personRef(s, a.byPersonId) : undefined,
  };
}

export function paymentRowDto(s: AppState, clubId: string, p: Payment): C.PaymentRowDto {
  return {
    personId: p.personId, name: personName(s, p.personId), code: codeOf(s, clubId, p.personId), status: p.status, method: p.method,
    amountPaid: p.amountPaid, paidAt: p.paidAt, reportedAt: p.reportedAt,
  };
}

// ---------- Ban điều hành ----------

export function boardRes(s: AppState, club: Club, me: Person, ms: Membership): C.BoardRes {
  const collection = clubCollection(s, club.id);
  return {
    club: clubRef(club),
    me: { personId: me.id, name: me.name, role: ms.role },
    counts: {
      pendingApplications: pendingApplications(s, club.id).length,
      openManualTxns: collection ? openManualAll(s, collection.id).length : 0,
      pendingExpenses: pendingExpenses(s, club.id).length,
    },
    nextSessionId: nextSession(s, club.id)?.id,
    collectionId: collection?.id,
  };
}

export function dashboardRes(s: AppState, club: Club, now: number): C.DashboardRes {
  const apps = pendingApplications(s, club.id);
  const exps = pendingExpenses(s, club.id);
  const collection = clubCollection(s, club.id);
  const st = collection ? latestStatement(s, collection.id) : undefined;
  const open = openTasks(s, club.id);
  const handover = s.handovers.find((h) => h.clubId === club.id);
  return {
    pendingApplications: { count: apps.length, oldestAt: apps[0]?.submittedAt },
    pendingExpenses: { count: exps.length, total: exps.reduce((sum, e) => sum + e.amount, 0), titles: exps.map((e) => e.title) },
    reconcile: { openManual: collection ? openManualAll(s, collection.id).length : 0, lastUploadAt: st?.uploadedAt, reconciledTo: st?.to },
    budget: { term: club.term, forecast: budgetView(s, club.id, club.term).forecast },
    upcomingEvents: upcomingEvents(s, club.id).slice(0, 2).map(eventDto),
    nextSessionId: nextSession(s, club.id)?.id,
    collection: collection ? { ...collectionDto(s, collection), stats: statsDto(s, collection.id) } : undefined,
    balance: balance(s, club.id),
    recentLedger: recentLedger(s, club.id, 3).map(({ date, direction, amount, label, count }) => ({ date, direction, amount, label, count })),
    setup: { members: s.memberships.filter((m) => m.clubId === club.id).length, events: s.events.filter((e) => e.clubId === club.id).length },
    tasks: {
      open: open.length, overdue: open.filter((t) => isTaskOverdue(t, now)).length,
      items: [...open].sort((a, b) => Number(isTaskOverdue(b, now)) - Number(isTaskOverdue(a, now)) || a.due.localeCompare(b.due)).slice(0, 4)
        .map((t) => ({ id: t.id, title: t.title, assignee: personRef(s, t.assigneeId), due: t.due, status: t.status, overdue: isTaskOverdue(t, now) })),
    },
    handover: handover ? { step: handover.step, toTerm: handover.toTerm, accepted: !!handover.acceptedAt } : undefined,
    kit: (({ documents, processes, accounts, missing }) => ({ documents, processes, accounts, missing }))(kitSummary(s, club.id)),
    participation: participationStats(s, club.id),
  };
}

/** Một dòng của bảng thành viên: trạng thái quỹ theo đợt thu đang dùng. Link mời chỉ có khi chưa nhận lời mời. */
export function memberRow(s: AppState, club: Club, m: Membership): C.MembersRes["members"][number] {
  const collection = clubCollection(s, club.id);
  const p = s.payments.find((x) => x.collectionId === collection?.id && x.personId === m.personId);
  return {
    personId: m.personId, code: m.code, name: personName(s, m.personId), email: s.persons.find((x) => x.id === m.personId)?.email ?? "",
    department: m.department, role: m.role, invite: m.invite, inviteCode: m.invite === "pending" ? m.inviteCode : undefined,
    deletionRequestedAt: m.deletionRequestedAt,
    attended: attendanceOf(s, club.id, m.personId).attended,
    payment: p ? { status: p.status, amountPaid: p.amountPaid, method: p.method } : undefined,
  };
}

export function membersRes(s: AppState, club: Club): C.MembersRes {
  const collection = clubCollection(s, club.id);
  return {
    term: club.term,
    heldSessions: heldSessions(s, club.id).length,
    collection: collection ? { id: collection.id, amount: collection.amount } : undefined,
    members: clubMembers(s, club.id).map((m) => memberRow(s, club, m)).sort(byCode),
  };
}

/** Các đợt thu của CLB, đợt tạo gần nhất trước. */
export function collectionsRes(s: AppState, clubId: string): C.CollectionsRes {
  return { collections: s.collections.filter((c) => c.clubId === clubId).reverse().map((c) => ({ ...collectionDto(s, c), stats: statsDto(s, c.id) })) };
}

/** Buổi chưa đóng trước (sớm nhất trước), rồi tới các buổi đã đóng (gần nhất trước). */
export function eventsRes(s: AppState, clubId: string): C.EventsRes {
  const all = s.events.filter((e) => e.clubId === clubId);
  const open = all.filter((e) => e.status !== "closed").sort((a, b) => a.start.localeCompare(b.start));
  const closed = all.filter((e) => e.status === "closed").sort((a, b) => b.start.localeCompare(a.start));
  const attended = (id: string) => s.attendance.filter((a) => a.eventId === id).length;
  return { events: [...open, ...closed].map((e) => ({ ...eventDto(e), attended: attended(e.id) })), memberCount: clubMembers(s, clubId).length };
}

export function eventDetailRes(s: AppState, clubId: string, e: ClubEvent): C.EventDetailRes {
  const members = clubMembers(s, clubId);
  const done = s.attendance.filter((a) => a.eventId === e.id).sort((a, b) => b.at.localeCompare(a.at));
  const doneIds = new Set(done.map((a) => a.personId));
  return {
    event: eventDto(e),
    totalMembers: members.length,
    attendance: done.map((a) => attendanceDto(s, clubId, a)),
    notCheckedIn: members.filter((m) => !doneIds.has(m.personId)).map((m) => ({ personId: m.personId, name: personName(s, m.personId), code: m.code, invite: m.invite })).sort(byCode),
  };
}

const PAY_ORDER: Record<Payment["status"], number> = { reported: 0, partial: 1, unpaid: 1, paid: 2 };

export function collectionRes(s: AppState, clubId: string, c: Collection): C.CollectionRes {
  return {
    collection: collectionDto(s, c),
    stats: statsDto(s, c.id),
    payments: paymentsOf(s, c.id).map((p) => paymentRowDto(s, clubId, p)).sort((a, b) => PAY_ORDER[a.status] - PAY_ORDER[b.status] || byCode(a, b)),
  };
}

function payState(p: Payment | undefined, handConfirmed: Set<string>): C.PayState {
  if (!p) return "unpaid";
  return p.status === "paid" && handConfirmed.has(p.personId) ? "hand-confirmed" : p.status;
}

function reconRowDto(s: AppState, c: Collection, latestId: string | undefined, statementId: string, t: StatementTxn, handConfirmed: Set<string>): C.ReconRowDto {
  const r = t.result;
  const suggestion = r.kind === "manual" ? r.suggestion ?? [] : [];
  return {
    statementId, txnId: t.id, fromEarlierFile: statementId !== latestId,
    date: t.date, amount: t.amount, sender: t.sender, content: t.content,
    reason: r.kind === "auto" ? "" : r.reason,
    suggestion: suggestion.map((personId) => {
      const p = s.payments.find((x) => x.collectionId === c.id && x.personId === personId);
      return { personId, name: personName(s, personId), code: codeOf(s, c.clubId, personId), state: payState(p, handConfirmed), amountPaid: p?.amountPaid ?? 0 };
    }),
    resolvedTo: r.kind === "manual" && r.resolvedTo ? r.resolvedTo.map((id) => personRef(s, id)) : undefined,
    resolvedAt: r.kind === "manual" ? r.resolvedAt : undefined,
  };
}

export function reconRow(s: AppState, c: Collection, statementId: string, txnId: string): C.ReconRowDto {
  const st = s.statements.find((x) => x.id === statementId)!;
  const t = st.txns.find((x) => x.id === txnId)!;
  return reconRowDto(s, c, latestStatement(s, c.id)?.id, statementId, t, handConfirmedTransfers(s, c.id));
}

export function reconciliationRes(s: AppState, c: Collection): C.ReconciliationRes {
  const st = latestStatement(s, c.id);
  const handConfirmed = handConfirmedTransfers(s, c.id);
  const open = openManualAll(s, c.id);
  const resolvedLatest = st ? st.txns.filter((t) => t.result.kind === "manual" && t.result.resolvedTo).map((txn) => ({ statementId: st.id, txn })) : [];
  // Người đã có giao dịch trong một file sao kê nào đó (khớp tự động, được gợi ý, hoặc đã gán).
  const seen = new Set(statementsOf(s, c.id).flatMap((x) => x.txns).flatMap((t) =>
    t.result.kind === "auto" ? t.result.personIds : t.result.kind === "manual" ? [...(t.result.suggestion ?? []), ...(t.result.resolvedTo ?? [])] : []));
  const payments = paymentsOf(s, c.id);
  return {
    collection: collectionDto(s, c),
    latest: st ? {
      id: st.id, fileName: st.fileName, txnCount: st.txns.length, from: st.from, to: st.to, uploadedAt: st.uploadedAt,
      auto: st.txns.filter((t) => t.result.kind === "auto").length,
      ignored: st.txns.filter((t) => t.result.kind === "ignored").length,
      duplicates: st.txns.filter((t) => t.result.kind === "ignored" && t.result.reason === DUPLICATE_TXN).length,
      resolvedManual: resolvedLatest.length,
    } : undefined,
    openManual: open.length,
    rows: [...open, ...resolvedLatest].map(({ statementId, txn }) => reconRowDto(s, c, st?.id, statementId, txn, handConfirmed)),
    reportedUnseen: payments.filter((p) => p.status === "reported" && !seen.has(p.personId))
      .map((p) => ({ personId: p.personId, name: personName(s, p.personId), code: codeOf(s, c.clubId, p.personId), reportedAt: p.reportedAt })),
    assignable: payments.filter((p) => p.status !== "paid")
      .map((p) => ({ personId: p.personId, name: personName(s, p.personId), code: codeOf(s, c.clubId, p.personId), state: payState(p, handConfirmed) }))
      .sort((a, b) => Number(a.state === "reported") - Number(b.state === "reported") || byCode(a, b)),
  };
}

export function ledgerRes(s: AppState, clubId: string): C.LedgerRes {
  return {
    balance: balance(s, clubId),
    entries: ledgerOf(s, clubId).map((l) => ({ id: l.id, date: l.date, direction: l.direction, amount: l.amount, description: l.description, createdBy: personRef(s, l.createdBy) })),
  };
}

export function expenseDto(s: AppState, e: ExpenseRequest): C.ExpenseDto {
  const club = s.clubs.find((c) => c.id === e.clubId);
  const ms = membershipOf(s, e.clubId, e.requesterId);
  const item = club ? budgetView(s, club.id, club.term).items.find((b) => b.id === e.budgetItemId) : undefined;
  return {
    id: e.id, kind: e.kind, title: e.title, amount: e.amount, status: e.status,
    requester: { ...personRef(s, e.requesterId), role: ms?.role, department: ms?.department },
    createdAt: e.createdAt,
    budgetItem: item ? { id: item.id, name: item.name, planned: item.planned, remaining: item.remaining } : undefined,
    receipt: e.receipt, reason: e.reason, rejectNote: e.rejectNote,
    history: e.history.map((h) => ({ at: h.at, by: personRef(s, h.by), text: h.text })),
  };
}

export function budgetRes(s: AppState, club: Club): C.BudgetRes {
  const bv = budgetView(s, club.id, club.term);
  return {
    term: club.term,
    submittedAt: bv.budget?.submittedAt,
    support: bv.budget?.support,
    items: bv.items.map((b) => ({ id: b.id, name: b.name, period: b.period, source: b.source, planned: b.planned, spent: b.spent, remaining: b.remaining })),
    totals: { planned: bv.planned, spent: bv.spent, toSpend: bv.toSpend },
    forecast: { current: bv.current, expected: bv.expected, expectedCount: bv.expectedCount, collections: bv.collections, fee: bv.fee, support: bv.support, toSpend: bv.toSpend, result: bv.forecast },
  };
}

/** Bàn giao. me: người đang xem, để biết có phải chủ nhiệm mới (được bấm xác nhận ở bước 6) không. */
/** Bàn giao của một CLB nhìn từ phía trường (không có tên thành viên ngoài người mentor xác nhận). */
export function schoolHandoverDto(s: AppState, h: Handover): C.SchoolHandoverDto {
  return {
    toTerm: h.toTerm, step: h.step, accepted: !!h.acceptedAt,
    ...(h.mentorConfirmedBy && h.mentorConfirmedAt ? { mentorConfirmed: { by: personRef(s, h.mentorConfirmedBy), at: h.mentorConfirmedAt } } : {}),
  };
}

export function handoverRes(s: AppState, club: Club, meId: string): C.HandoverRes | undefined {
  const h = s.handovers.find((x) => x.clubId === club.id);
  if (!h) return undefined;
  const collection = clubCollection(s, club.id);
  const members = clubMembers(s, club.id);
  const stats = collection ? collectionStats(s, collection.id) : undefined;
  const exps = pendingExpenses(s, club.id);
  const ref = (id: string | undefined) => (id ? personRef(s, id) : undefined);
  const b = h.newBoard;
  return {
    fromTerm: h.fromTerm, toTerm: h.toTerm, step: h.step, lockedBalance: h.lockedBalance, lockedAt: h.lockedAt, currentBalance: balance(s, club.id),
    currentPresident: ref(members.find((m) => m.role === "president")?.personId),
    currentReceiver: collection ? { ...personRef(s, collection.receiverId), bankLabel: collection.bankLabel, last4: collection.last4 } : undefined,
    newReceiver: h.newReceiver ? { ...personRef(s, h.newReceiver.personId), bank: h.newReceiver.bank, accountLast4: h.newReceiver.account.slice(-4) } : undefined,
    transferRef: h.transferRef || undefined,
    candidates: members.filter((m) => m.invite === "accepted").sort(byCode).map((m) => personRef(s, m.personId)),
    memberCount: members.length,
    newBoard: b ? { president: personRef(s, b.president), vice: ref(b.vice), treasurer: ref(b.treasurer), heads: b.heads.map((id) => personRef(s, id)) } : undefined,
    open: {
      unpaid: stats?.unpaid ?? 0, reported: stats?.reported ?? 0, pendingExpenses: exps.length, pendingExpenseTotal: exps.reduce((sum, e) => sum + e.amount, 0),
      openManual: collection ? openManualAll(s, collection.id).length : 0, openTasks: openTasks(s, club.id).length,
    },
    kit: kitSummary(s, club.id),
    accounts: s.kitAccounts.filter((a) => a.clubId === club.id).map((a) => ({
      id: a.id, service: a.service, label: a.label, holder: ref(a.holderId), ownership: a.ownership, required: a.required, transferred: h.transferred.includes(a.id),
    })),
    acceptedAt: h.acceptedAt, acceptedBy: ref(h.acceptedBy),
    mentorConfirmed: h.mentorConfirmedBy && h.mentorConfirmedAt ? { by: personRef(s, h.mentorConfirmedBy), at: h.mentorConfirmedAt } : undefined,
    history: h.history.map((x) => ({ at: x.at, by: personRef(s, x.by), text: x.text })),
    mentor: club.mentor,
    canAccept: !!b && b.president === meId,
    summary: h.summary ? { text: h.summary.text, by: personRef(s, h.summary.by), at: h.summary.at, mock: h.summary.mock } : undefined,
  };
}

// ---------- Việc cần làm ----------

export function taskDto(s: AppState, t: ClubTask): C.TaskDto {
  const event = t.eventId ? s.events.find((e) => e.id === t.eventId) : undefined;
  const process = t.processId ? s.kitProcesses.find((p) => p.id === t.processId) : undefined;
  return {
    id: t.id, title: t.title, assignee: personRef(s, t.assigneeId), due: t.due, status: t.status,
    event: event ? { id: event.id, title: event.title } : undefined, process: process ? { id: process.id, name: process.name } : undefined,
    createdAt: t.createdAt, history: t.history.map((x) => ({ at: x.at, by: personRef(s, x.by), text: x.text })),
  };
}

export function tasksRes(s: AppState, club: Club): C.TasksRes {
  return {
    tasks: tasksOf(s, club.id).map((t) => taskDto(s, t)),
    assignees: clubMembers(s, club.id).filter((m) => m.invite === "accepted").sort(byCode).map((m) => personRef(s, m.personId)),
    events: s.events.filter((e) => e.clubId === club.id).map((e) => ({ id: e.id, title: e.title })),
    processes: s.kitProcesses.filter((p) => p.clubId === club.id).map((p) => ({ id: p.id, name: p.name })),
  };
}

// ---------- Tin của CLB trên Cộng đồng ----------

/**
 * internal: màn của ban điều hành CLB và của cán bộ trường, có tên người đăng và người duyệt. Cộng đồng chung không nêu tên người đăng.
 * Lý do từ chối chỉ đi kèm tin bị từ chối, mà tin chưa duyệt vốn chỉ đến tay người đăng, ban điều hành CLB đó và cán bộ trường.
 */
export function postDto(s: AppState, p: ClubPost, internal = false): C.PostDto {
  const club = s.clubs.find((c) => c.id === p.clubId)!;
  return {
    id: p.id, club: clubRef(club), kind: p.kind, title: p.title, body: p.body,
    ...(p.eventAt ? { eventAt: p.eventAt } : {}), ...(p.place ? { place: p.place } : {}),
    status: p.status, createdAt: p.createdAt,
    ...(p.rejectReason ? { rejectReason: p.rejectReason } : {}),
    ...(internal ? { author: personRef(s, p.createdBy), ...(p.reviewedBy ? { reviewedBy: personRef(s, p.reviewedBy) } : {}), ...(p.reviewedAt ? { reviewedAt: p.reviewedAt } : {}) } : {}),
  };
}

// ---------- Kho bàn giao ----------

export function kitDocumentDto(s: AppState, d: KitDocument): C.KitDocumentDto {
  return { id: d.id, name: d.name, category: d.category, link: d.link, holder: personRef(s, d.holderId), updatedAt: d.updatedAt };
}

export function kitProcessDto(s: AppState, p: KitProcess): C.KitProcessDto {
  return {
    id: p.id, name: p.name, steps: p.steps, leadDays: p.leadDays,
    documents: p.documentIds.map((id) => s.kitDocuments.find((d) => d.id === id)).filter((d): d is KitDocument => !!d).map((d) => ({ id: d.id, name: d.name })),
    updatedAt: p.updatedAt,
  };
}

export function kitAccountDto(s: AppState, a: KitAccount): C.KitAccountDto {
  return { id: a.id, service: a.service, label: a.label, holder: a.holderId ? personRef(s, a.holderId) : undefined, ownership: a.ownership, required: a.required, updatedAt: a.updatedAt };
}

/**
 * Kho bàn giao. Tài khoản và quyền truy cập, số mục thiếu và danh sách người giữ chỉ ban điều hành (board = true) nhận;
 * thành viên thường chỉ thấy biểu mẫu và quy trình. Đây là chỗ duy nhất quyết định ai thấy phần nào của kho.
 */
export function kitRes(s: AppState, club: Club, board: boolean): C.KitRes {
  const sum = kitSummary(s, club.id);
  return {
    documents: s.kitDocuments.filter((d) => d.clubId === club.id).map((d) => kitDocumentDto(s, d)),
    processes: s.kitProcesses.filter((p) => p.clubId === club.id).map((p) => kitProcessDto(s, p)),
    ...(board ? {
      accounts: s.kitAccounts.filter((a) => a.clubId === club.id).map((a) => kitAccountDto(s, a)),
      holders: clubMembers(s, club.id).sort(byCode).map((m) => personRef(s, m.personId)),
    } : {}),
    summary: board ? sum : { documents: sum.documents, processes: sum.processes },
  };
}

// ---------- Thành viên ----------

export function myClubRes(s: AppState, club: Club, me: Person, ms: Membership): C.MyClubRes {
  const att = attendanceOf(s, club.id, me.id);
  const collection = clubCollection(s, club.id);
  const p = collection ? s.payments.find((x) => x.collectionId === collection.id && x.personId === me.id) : undefined;
  return {
    club: clubRef(club),
    membership: { code: ms.code, department: ms.department, role: ms.role, deletionRequestedAt: ms.deletionRequestedAt },
    attendance: { attended: att.attended, held: att.held.length },
    collection: collection ? { id: collection.id, name: collection.name, amount: collection.amount, payment: p ? { status: p.status, amountPaid: p.amountPaid } : undefined } : undefined,
    consents: s.consents.filter((c) => c.personId === me.id && c.clubId === club.id)
      .map((c) => ({ purpose: c.purpose, version: c.version, at: c.at, withdrawnAt: c.withdrawnAt })),
  };
}

export function myAttendanceRes(s: AppState, club: Club, me: Person): C.MyAttendanceRes {
  const held = heldSessions(s, club.id);
  const clubEvents = new Map(s.events.filter((e) => e.clubId === club.id).map((e) => [e.id, e]));
  return {
    club: clubRef(club),
    held: held.map((e) => ({ eventId: e.id, title: e.title, start: e.start })),
    mine: s.attendance.filter((a) => a.personId === me.id && clubEvents.has(a.eventId)).sort((a, b) => b.at.localeCompare(a.at))
      .map((a) => ({ eventId: a.eventId, title: clubEvents.get(a.eventId)!.title, at: a.at, method: a.method })),
  };
}

export function myPaymentRes(s: AppState, club: Club, ms: Membership, c: Collection, me: Person): C.MyPaymentRes {
  const p = s.payments.find((x) => x.collectionId === c.id && x.personId === me.id);
  const amountPaid = p?.amountPaid ?? 0;
  const due = Math.max(0, c.amount - amountPaid);
  const content = `${c.codePrefix} ${ms.code}`;
  return {
    club: { id: club.id, name: club.name },
    collection: { id: c.id, name: c.name, term: c.term, amount: c.amount, dueDate: c.dueDate },
    payment: { status: p?.status ?? "unpaid", amountPaid, method: p?.method, paidAt: p?.paidAt, reportedAt: p?.reportedAt },
    transfer: {
      amountDue: due, content, accountName: c.accountName, bankLabel: c.bankLabel, last4: c.last4, receiver: receiverRef(s, c),
      // BẢN KHUNG: chuỗi giả, quét không chuyển được tiền. Bản thật tạo chuỗi VietQR theo chuẩn NAPAS từ tài khoản của thủ quỹ.
      qrPayload: `CAMPUSHUB-DEMO|KHONG-PHAI-MA-CHUYEN-KHOAN|${content}|${due}`,
      qrIsDemo: true,
    },
  };
}

export function myExportRes(s: AppState, me: Person, now: string): C.MyExportRes {
  const events = new Map(s.events.map((e) => [e.id, e]));
  const collections = new Map(s.collections.map((c) => [c.id, c]));
  return {
    exportedAt: now,
    person: personDto(me),
    memberships: s.memberships.filter((m) => m.personId === me.id).map((m) => membershipDto(s, m)),
    attendance: s.attendance.filter((a) => a.personId === me.id).map((a) => {
      const e = events.get(a.eventId);
      return { clubId: e?.clubId ?? "", eventId: a.eventId, title: e?.title ?? a.eventId, at: a.at, method: a.method };
    }),
    payments: s.payments.filter((p) => p.personId === me.id).map((p) => ({
      collectionId: p.collectionId, collectionName: collections.get(p.collectionId)?.name ?? "", status: p.status, amountPaid: p.amountPaid, paidAt: p.paidAt,
    })),
    consents: s.consents.filter((c) => c.personId === me.id).map((c) => ({ clubId: c.clubId, purpose: c.purpose, version: c.version, at: c.at, withdrawnAt: c.withdrawnAt })),
    applications: s.applications.filter((a) => a.personId === me.id).map(applicationDto),
  };
}

// ---------- Sinh viên tìm CLB ----------

export function clubCardDto(s: AppState, club: Club, me: Person): C.ClubCardDto {
  const sum = clubSummary(s, club);
  const ms = membershipOf(s, club.id, me.id);
  const app = s.applications.filter((a) => a.clubId === club.id && a.personId === me.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const my: C.ClubCardDto["my"] = ms
    ? (ms.invite === "accepted" ? { status: "member" } : { status: "invited", inviteCode: ms.inviteCode })
    : app?.status === "pending" ? { status: "applied", applicationSubmittedAt: app.submittedAt }
    : app?.status === "rejected" ? { status: "rejected", applicationSubmittedAt: app.submittedAt }
    : { status: "none" };
  return {
    id: club.id, name: club.name, field: club.field, schedule: club.schedule, location: club.location, acceptingApplications: club.acceptingApplications,
    members: sum.members, lastActivity: sum.lastActivity || undefined, my,
  };
}

// ---------- Nhà trường ----------

export function schoolRowDto(s: AppState, club: Club, now: number): C.SchoolClubRowDto {
  const sum = clubSummary(s, club);
  return {
    id: club.id, name: club.name, field: club.field, members: sum.members, sessions: sum.sessions,
    lastActivity: sum.lastActivity || undefined,
    activeIn30Days: !!sum.lastActivity && daysAgo(sum.lastActivity, now) <= 30,
    budgetSubmitted: sum.budgetSubmitted, planned: sum.planned, spent: sum.spent,
    waitingMentor: s.expenses.filter((e) => e.clubId === club.id && e.status === "mentor").length,
    detailed: sum.detailed,
  };
}

export function schoolClubRes(s: AppState, club: Club, now: number): C.SchoolClubRes {
  const row = schoolRowDto(s, club, now);
  const president = s.memberships.find((m) => m.clubId === club.id && m.role === "president");
  const base = { ...row, term: club.term, mentor: club.mentor, president: president ? personRef(s, president.personId) : undefined };
  if (!row.detailed) return { club: base };
  const bv = budgetView(s, club.id, club.term);
  const withAttendance = heldSessions(s, club.id).filter((e) => s.attendance.some((a) => a.eventId === e.id));
  const handover = s.handovers.find((h) => h.clubId === club.id);
  return {
    club: base,
    detail: {
      budget: {
        submittedAt: bv.budget?.submittedAt,
        items: bv.items.map((b) => ({ id: b.id, name: b.name, planned: b.planned, spent: b.spent })),
        totals: { planned: bv.planned, spent: bv.spent },
        support: bv.budget?.support,
      },
      sessions: { count: withAttendance.length, averageAttendance: averageAttendance(s, club.id), lastSessionStart: withAttendance[withAttendance.length - 1]?.start },
      waitingMentor: s.expenses.filter((e) => e.clubId === club.id && e.status === "mentor").map((e) => {
        const approval = [...e.history].reverse().find((h) => h.text.startsWith("duyệt"));
        const item = bv.items.find((b) => b.id === e.budgetItemId);
        return {
          id: e.id, title: e.title, amount: e.amount,
          boardApproval: approval ? { by: personRef(s, approval.by), at: approval.at } : undefined,
          budgetItem: item ? { name: item.name, planned: item.planned } : undefined,
          receipt: e.receipt,
        };
      }),
      handover: handover ? schoolHandoverDto(s, handover) : undefined,
    },
  };
}
