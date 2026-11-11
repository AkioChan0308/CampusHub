// Các thao tác làm thay đổi dữ liệu. Mỗi hàm nhận tham số và trả về một hàm (state cũ) => state mới.
// Mã và thời điểm được tạo ở nơi gọi, để các hàm này thuần (chạy lại hai lần vẫn ra cùng kết quả).
// Khi có backend, mỗi hàm ở đây ứng với một lời gọi API.

import { classify, type MemberRef } from "./reconcile.ts";
import { dmy, money, nowIso } from "./format.ts";
import { balance, kitSummary, MENTOR_THRESHOLD, openCollections, personName } from "./selectors.ts";
import { NO_DEPARTMENT, ROLE_LABEL, SAMPLE_DEPARTMENTS, TASK_STATUS_LABEL, type AppNotification, type AppState, type BudgetItem, type Club, type ClubEvent, type ClubPost, type ClubTask, type Collection, type Department, type ExpenseRequest, type Handover, type KitAccount, type KitDocument, type KitProcess, type NewBoard, type Payment, type Person, type ContactAttempt, type ContactChannel, type EvidenceFile, type Role, type RoleHandover, type Statement, type StatementTxn, type TaskStatus } from "./types.ts";

export type Update = (s: AppState) => AppState;

/** Gửi một thông báo cho mỗi người trong danh sách (mỗi người một bản, mỗi người chỉ một lần). */
const notify = (s: AppState, personIds: string[], n: Omit<AppNotification, "id" | "personId" | "readAt">): AppState => {
  const ids = [...new Set(personIds)];
  return ids.length === 0 ? s : { ...s, notifications: [...s.notifications, ...ids.map((personId) => ({ id: uid("tb"), personId, ...n }))] };
};
const staffIds = (s: AppState) => s.persons.filter((p) => p.kind === "staff").map((p) => p.id);
const clubName = (s: AppState, clubId: string) => s.clubs.find((c) => c.id === clubId)?.name ?? clubId;

const CONSENT_VERSION = "chinh-sach-du-lieu-v1";

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export const setPersona = (personId: string | null): Update => (s) => ({ ...s, persona: personId });

/** Đổi tên hiển thị của một người (màn "Đặt tên tài khoản và mật khẩu"). Tên đã kiểm ở nơi gọi (displayNameError). */
export const setPersonName = (personId: string, name: string): Update => (s) => ({
  ...s,
  persons: s.persons.map((p) => (p.id === personId ? { ...p, name: name.trim() } : p)),
});

// ---------- Thành viên, đơn xin vào, lời mời ----------

export const submitApplication = (a: { id: string; clubId: string; personId: string; year: number; reason: string; at: string }): Update => (s) => {
  const p = s.persons.find((x) => x.id === a.personId);
  if (!p) return s;
  return {
    ...s,
    applications: [...s.applications, { id: a.id, clubId: a.clubId, personId: p.id, name: p.name, email: p.email, year: a.year, reason: a.reason, submittedAt: a.at, status: "pending" }],
    consents: [...s.consents, { personId: p.id, clubId: a.clubId, purpose: "application", version: CONSENT_VERSION, at: a.at }],
  };
};

/** Mã thành viên kế tiếp trong CLB (A001, A002…): số lớn nhất đang có cộng một. */
export function nextMemberCode(s: AppState, clubId: string): string {
  const used = s.memberships.filter((m) => m.clubId === clubId).map((m) => Number(m.code.slice(1))).filter(Number.isFinite);
  return `A${String(Math.max(0, ...used) + 1).padStart(3, "0")}`;
}

/** Duyệt đơn: người xin vào thành thành viên ở trạng thái "chưa nhận lời mời", nhận email có link mời để tự đồng ý lưu dữ liệu. */
export const approveApplication = (id: string, by: string, at: string): Update => (s) => {
  const app = s.applications.find((a) => a.id === id);
  if (!app || app.status !== "pending") return s;
  const code = nextMemberCode(s, app.clubId);
  const already = s.memberships.some((m) => m.clubId === app.clubId && m.personId === app.personId);
  const collections = openCollections(s, app.clubId, at);
  return {
    ...s,
    applications: s.applications.map((a) => (a.id === id ? { ...a, status: "approved", decidedAt: at, decidedBy: by } : a)),
    memberships: already ? s.memberships : [...s.memberships, { clubId: app.clubId, personId: app.personId, code, department: "Chưa xếp ban", role: "member", invite: "pending", inviteCode: `moi-${app.personId}` }],
    payments: already ? s.payments : [...s.payments, ...collections.map((c): Payment => ({ collectionId: c.id, personId: app.personId, status: "unpaid", amountPaid: 0 }))],
  };
};

export const rejectApplication = (id: string, by: string, at: string): Update => (s) => ({
  ...s,
  applications: s.applications.map((a) => (a.id === id && a.status === "pending" ? { ...a, status: "rejected", decidedAt: at, decidedBy: by } : a)),
});

export const acceptInvite = (inviteCode: string, phone: boolean, at: string): Update => (s) => {
  const m = s.memberships.find((x) => x.inviteCode === inviteCode && x.invite === "pending");
  if (!m) return s;
  const base = { personId: m.personId, clubId: m.clubId, version: CONSENT_VERSION, at };
  return {
    ...s,
    persona: m.personId,
    memberships: s.memberships.map((x) => (x === m ? { ...x, invite: "accepted", inviteCode: undefined } : x)),
    consents: [...s.consents, { ...base, purpose: "membership" }, { ...base, purpose: "age16" }, ...(phone ? [{ ...base, purpose: "phone" as const }] : [])],
  };
};

export const withdrawPhoneConsent = (personId: string, clubId: string, at: string): Update => (s) => ({
  ...s,
  consents: s.consents.map((c) => (c.personId === personId && c.clubId === clubId && c.purpose === "phone" && !c.withdrawnAt ? { ...c, withdrawnAt: at } : c)),
});

export const requestDeletion = (personId: string, clubId: string, at: string): Update => (s) => ({
  ...s,
  memberships: s.memberships.map((m) => (m.personId === personId && m.clubId === clubId ? { ...m, deletionRequestedAt: at } : m)),
});

// ---------- Điểm danh ----------

export const openEvent = (eventId: string): Update => (s) => ({
  ...s,
  events: s.events.map((e) => (e.id === eventId && e.status === "upcoming" ? { ...e, status: "open" } : e)),
});

export const closeEvent = (eventId: string, at: string): Update => (s) => ({
  ...s,
  events: s.events.map((e) => (e.id === eventId ? { ...e, status: "closed", closedAt: at } : e)),
});

export const checkIn = (a: { eventId: string; personId: string; at: string; method: "qr" | "manual"; by?: string; deviceId?: string }): Update => (s) => {
  if (s.attendance.some((x) => x.eventId === a.eventId && x.personId === a.personId)) return s;
  return { ...s, attendance: [...s.attendance, { eventId: a.eventId, personId: a.personId, at: a.at, method: a.method, byPersonId: a.by, deviceId: a.deviceId }] };
};

// ---------- Đợt thu, sổ quỹ ----------

export const reportTransfer = (collectionId: string, personId: string, at: string): Update => (s) => ({
  ...s,
  payments: s.payments.map((p) => (p.collectionId === collectionId && p.personId === personId && (p.status === "unpaid" || p.status === "partial") ? { ...p, status: "reported", reportedAt: at } : p)),
});

type MoneyIn = { collectionId: string; personId: string; method: "transfer" | "cash"; amount: number; at: string; by: string; ledgerId: string };

/** Ghi tiền vào khoản đóng của thành viên và thêm một bút toán thu vào sổ quỹ. Đóng dư thì bút toán ghi "đóng thừa", để sau hoàn lại. */
function addMoney(s: AppState, a: MoneyIn): AppState {
  const c = s.collections.find((x) => x.id === a.collectionId);
  const p = s.payments.find((x) => x.collectionId === a.collectionId && x.personId === a.personId);
  if (!c || !p) return s;
  const amountPaid = p.amountPaid + a.amount;
  // Người đã đóng đủ thì giữ nguyên cách đóng và ngày đóng của khoản đầu, chỉ cộng thêm tiền.
  const next: Payment = p.status === "paid" ? { ...p, amountPaid } : { ...p, amountPaid, method: a.method, status: amountPaid >= c.amount ? "paid" : "partial", paidAt: a.at };
  return {
    ...s,
    payments: s.payments.map((x) => (x === p ? next : x)),
    ledger: [...s.ledger, {
      id: a.ledgerId, clubId: c.clubId, date: a.at, direction: "in", amount: a.amount,
      description: `${c.name} · ${personName(s, a.personId)}${a.method === "cash" ? " · tiền mặt" : ""}${amountPaid > c.amount ? " · đóng thừa" : ""}`,
      collectionId: c.id, personId: a.personId, createdBy: a.by, createdAt: a.at,
    }],
  };
}

const awaitingOf = (s: AppState, collectionId: string, personId: string) =>
  s.payments.find((x) => x.collectionId === collectionId && x.personId === personId)?.awaitingStatement ?? 0;

/** Đặt số tiền chuyển khoản đã ghi nhận tay mà chưa thấy trong sao kê; về 0 thì bỏ trường. */
function setAwaiting(s: AppState, collectionId: string, personId: string, amount: number): AppState {
  return {
    ...s,
    payments: s.payments.map((p) => {
      if (p.collectionId !== collectionId || p.personId !== personId) return p;
      const { awaitingStatement: _old, ...rest } = p;
      return amount > 0 ? { ...rest, awaitingStatement: amount } : rest;
    }),
  };
}

/**
 * Thủ quỹ tự ghi (tiền mặt, "Ghi nhận tay"): người đã đóng rồi thì không ghi nữa, tránh bấm hai lần thành ghi trùng.
 * Ghi nhận tay một khoản chuyển khoản thì nhớ số tiền: khi dòng sao kê của khoản đó về, chỉ nối, không ghi lần hai.
 */
export const confirmPayment = (a: MoneyIn): Update => (s) => {
  const p = s.payments.find((x) => x.collectionId === a.collectionId && x.personId === a.personId);
  if (!p || p.status === "paid") return s;
  const next = addMoney(s, a);
  return a.method === "transfer" ? setAwaiting(next, a.collectionId, a.personId, awaitingOf(next, a.collectionId, a.personId) + a.amount) : next;
};

/** Lý do của giao dịch đã có ở một lần tải sao kê trước: không ghi lại, màn đối soát đếm riêng. */
export const DUPLICATE_TXN = "Đã có ở lần tải trước";

const txnKey = (t: { date: string; amount: number; sender: string; content: string }) => `${t.date.slice(0, 10)}|${t.amount}|${t.sender}|${t.content}`;

/**
 * Đưa một file sao kê vào một đợt thu: xếp loại từng giao dịch; giao dịch khớp tự động thì ghi luôn vào sổ quỹ.
 * Một file có thể chứa tiền của nhiều đợt thu: dòng ghi mã đợt khác không thuộc đợt này, và tải cùng file vào đợt khác vẫn đối soát được.
 */
export const importStatement = (a: { id: string; collectionId: string; fileName: string; rows: { date: string; amount: number; sender: string; content: string }[]; at: string; by: string }): Update => (s) => {
  const c = s.collections.find((x) => x.id === a.collectionId);
  if (!c) return s;
  const members: MemberRef[] = s.memberships.filter((m) => m.clubId === c.clubId).map((m) => ({ personId: m.personId, code: m.code, name: personName(s, m.personId) }));
  const others = s.collections.filter((x) => x.clubId === c.clubId && x.id !== c.id);
  // Dòng đã có ở lần tải trước của chính đợt này: không ghi lại.
  const seen = new Set(s.statements.filter((st) => st.collectionId === c.id).flatMap((st) => st.txns.map(txnKey)));
  // Dòng đã ghi vào sổ ở đợt khác (khớp tự động hoặc đã gán): không ghi lần hai ở đợt này.
  const recordedElsewhere = new Map(s.statements.filter((st) => others.some((o) => o.id === st.collectionId)).flatMap((st) =>
    st.txns.filter((t) => t.result.kind === "auto" || (t.result.kind === "manual" && t.result.resolvedTo))
      .map((t) => [txnKey(t), others.find((o) => o.id === st.collectionId)!.name] as const)));
  let next = s;
  const txns: StatementTxn[] = [];
  a.rows.forEach((r, i) => {
    const id = `${a.id}-${i + 1}`;
    if (seen.has(txnKey(r))) {
      txns.push({ id, ...r, result: { kind: "ignored", reason: DUPLICATE_TXN } });
      return;
    }
    const elsewhere = recordedElsewhere.get(txnKey(r));
    if (elsewhere) {
      txns.push({ id, ...r, result: { kind: "ignored", reason: `Đã ghi ở đợt thu khác: ${elsewhere}` } });
      return;
    }
    const mine = next.payments.filter((p) => p.collectionId === c.id);
    const result = classify(r, {
      fee: c.amount, codePrefix: c.codePrefix, otherCollections: others.map((o) => ({ codePrefix: o.codePrefix, name: o.name })), members,
      settledPersonIds: new Set(mine.filter((p) => p.status === "paid").map((p) => p.personId)),
      awaitingStatement: new Map(mine.filter((p) => p.awaitingStatement).map((p) => [p.personId, p.awaitingStatement!])),
    });
    if (result.kind === "auto") {
      const pid = result.personIds[0];
      if (result.alreadyRecorded) next = setAwaiting(next, c.id, pid, awaitingOf(next, c.id, pid) - r.amount);
      else next = addMoney(next, { collectionId: c.id, personId: pid, method: "transfer", amount: r.amount, at: r.date, by: a.by, ledgerId: `l-${id}` });
    }
    txns.push({ id, ...r, result });
  });
  const dates = a.rows.map((r) => r.date).sort();
  const st: Statement = { id: a.id, clubId: c.clubId, collectionId: c.id, fileName: a.fileName, from: dates[0] ?? a.at, to: dates[dates.length - 1] ?? a.at, uploadedAt: a.at, txns };
  return { ...next, statements: [...next.statements, st] };
};

/**
 * Thủ quỹ gán tay một giao dịch cho một hoặc nhiều thành viên. Tiền chia đều cho số người, phần lẻ vào người cuối.
 * Tiền trong sao kê là tiền đã vào tài khoản, nên luôn được ghi đủ vào sổ quỹ; người đã đóng rồi thì phần của họ ghi là đóng thừa.
 * Riêng phần tiền thủ quỹ đã "Ghi nhận tay" mà chưa thấy trong sao kê: giao dịch này chứa khoản đó, nên phần đó chỉ nối;
 * chỉ phần chênh được ghi thêm vào sổ quỹ.
 */
export const resolveTxn = (statementId: string, txnId: string, personIds: string[], by: string, at: string): Update => (s) => {
  const st = s.statements.find((x) => x.id === statementId);
  const t = st?.txns.find((x) => x.id === txnId);
  if (!st || !t || t.result.kind !== "manual" || t.result.resolvedTo || personIds.length === 0) return s;
  let next = s;
  const share = Math.floor(t.amount / personIds.length);
  personIds.forEach((pid, i) => {
    const amount = i === personIds.length - 1 ? t.amount - share * (personIds.length - 1) : share;
    const waiting = awaitingOf(next, st.collectionId, pid);
    const linked = Math.min(amount, waiting);
    if (linked > 0) next = setAwaiting(next, st.collectionId, pid, waiting - linked);
    if (amount > linked) next = addMoney(next, { collectionId: st.collectionId, personId: pid, method: "transfer", amount: amount - linked, at: t.date, by, ledgerId: `l-${txnId}-${i}` });
  });
  const result = { ...t.result, resolvedTo: personIds, resolvedAt: at };
  return {
    ...next,
    statements: next.statements.map((x) => (x.id === statementId ? { ...x, txns: x.txns.map((y) => (y.id === txnId ? { ...y, result } : y)) } : x)),
  };
};

// ---------- Chi, duyệt chi ----------

export const createExpense = (e: Omit<ExpenseRequest, "status" | "history">): Update => (s) => ({
  ...s,
  expenses: [...s.expenses, { ...e, status: "pending", history: [{ at: e.createdAt, by: e.requesterId, text: e.kind === "proposal" ? "tạo đề xuất" : "gửi yêu cầu hoàn ứng" }] }],
});

/** Duyệt khoản chi. Ghi chú (không bắt buộc) của người duyệt được lưu vào lịch sử, như lý do khi từ chối. */
export const approveExpense = (id: string, by: string, at: string, note = ""): Update => (s) => {
  const withNote = (text: string) => (note.trim() ? `${text}: “${note.trim()}”` : text);
  return {
    ...s,
    expenses: s.expenses.map((e) => {
      if (e.id !== id) return e;
      if (e.status === "pending" && e.requesterId !== by) {
        const toMentor = e.amount > MENTOR_THRESHOLD;
        return { ...e, status: toMentor ? "mentor" : "approved", history: [...e.history, { at, by, text: withNote(toMentor ? "duyệt, chuyển mentor vì trên 2.000.000 ₫" : "duyệt") }] };
      }
      if (e.status === "mentor" && e.requesterId !== by) return { ...e, status: "approved", history: [...e.history, { at, by, text: withNote("mentor duyệt") }] };
      return e;
    }),
  };
};

export const rejectExpense = (id: string, by: string, at: string, note: string): Update => (s) => ({
  ...s,
  expenses: s.expenses.map((e) => (e.id === id && (e.status === "pending" || e.status === "mentor") ? { ...e, status: "rejected", rejectNote: note, history: [...e.history, { at, by, text: `từ chối: “${note}”` }] } : e)),
});

/** Sau khi đã chi thật, thủ quỹ ghi khoản chi vào sổ quỹ. */
export const markSpent = (id: string, by: string, at: string, ledgerId: string): Update => (s) => {
  const e = s.expenses.find((x) => x.id === id);
  if (!e || e.status !== "approved") return s;
  return {
    ...s,
    expenses: s.expenses.map((x) => (x.id === id ? { ...x, status: "spent", history: [...x.history, { at, by, text: "ghi đã chi vào sổ quỹ" }] } : x)),
    ledger: [...s.ledger, { id: ledgerId, clubId: e.clubId, date: at, direction: "out", amount: e.amount, description: e.title, expenseId: e.id, budgetItemId: e.budgetItemId, createdBy: by, createdAt: at }],
  };
};

// ---------- Dự trù ----------

export const addBudgetItem = (item: BudgetItem): Update => (s) => ({ ...s, budgetItems: [...s.budgetItems, item] });

export const submitBudget = (clubId: string, term: string, at: string): Update => (s) => ({
  ...s,
  budgets: s.budgets.map((b) => (b.clubId === clubId && b.term === term ? { ...b, submittedAt: at } : b)),
});

// ---------- Bàn giao: 7 bước ----------
// Mỗi bước chỉ làm được khi bàn giao đang đúng ở bước đó (nơi gọi kiểm tra), làm xong thì sang bước kế và ghi vào biên bản (history).

type HandoverChange = (h: Handover, s: AppState) => Partial<Handover>;

const stepTo = (clubId: string, to: number, by: string, at: string, text: string | ((s: AppState) => string), change: HandoverChange = () => ({})): Update => (s) => ({
  ...s,
  handovers: s.handovers.map((h) => (h.clubId !== clubId ? h : { ...h, ...change(h, s), step: to, history: [...h.history, { at, by, text: typeof text === "function" ? text(s) : text }] })),
});

/** Bước 1: chọn ban mới. */
export const saveHandoverBoard = (clubId: string, board: NewBoard, by: string, at: string): Update =>
  stepTo(clubId, 2, by, at, (s) => `chọn ban mới: chủ nhiệm ${personName(s, board.president)}`, () => ({ newBoard: board }));

/** Bước 2: chốt số dư bằng số dư sổ quỹ lúc bấm. Sổ quỹ chỉ được thêm bút toán, nên số này không bị sửa lùi. */
export const lockHandoverBalance = (clubId: string, by: string, at: string): Update =>
  stepTo(clubId, 3, by, at, (s) => `chốt số dư ${money(balance(s, clubId))}`, (_h, s) => ({ lockedBalance: balance(s, clubId), lockedAt: at }));

/** Bước 3: đã xem kho bàn giao. Không chặn nếu còn thiếu, chỉ ghi lại thiếu bao nhiêu. */
export const reviewHandoverKit = (clubId: string, by: string, at: string): Update =>
  stepTo(clubId, 4, by, at, (s) => {
    const k = kitSummary(s, clubId);
    return `kiểm tra kho bàn giao: ${k.documents} biểu mẫu, ${k.processes} quy trình, ${k.accounts} tài khoản, ${k.missing} mục thiếu`;
  });

/** Bước 4: tài khoản nhận quỹ mới. */
export const saveHandoverAccount = (clubId: string, newReceiver: { personId: string; bank: string; account: string }, transferRef: string, by: string, at: string): Update =>
  stepTo(clubId, 5, by, at, (s) => `đổi tài khoản nhận quỹ sang ${personName(s, newReceiver.personId)} (${newReceiver.bank})`, () => ({ newReceiver, transferRef }));

/** Bước 5, từng dòng: người nhận mới giữ quyền quản trị của tài khoản. Việc đổi quyền làm ở chính dịch vụ; ở đây chỉ ghi lại. */
export const transferHandoverAccount = (clubId: string, accountId: string, holderId: string, by: string, at: string): Update => (s) => {
  const account = s.kitAccounts.find((a) => a.id === accountId);
  if (!account) return s;
  return {
    ...s,
    kitAccounts: s.kitAccounts.map((a) => (a.id === accountId ? { ...a, holderId, updatedAt: at } : a)),
    handovers: s.handovers.map((h) => (h.clubId !== clubId ? h : {
      ...h,
      transferred: h.transferred.includes(accountId) ? h.transferred : [...h.transferred, accountId],
      history: [...h.history, { at, by, text: `chuyển quyền quản trị ${account.service} cho ${personName(s, holderId)}` }],
    })),
  };
};

export const finishHandoverTransfer = (clubId: string, by: string, at: string): Update => (s) => {
  const done = stepTo(clubId, 6, by, at, "chuyển xong quyền quản trị các tài khoản bắt buộc")(s);
  const h = done.handovers.find((x) => x.clubId === clubId);
  if (!h?.newBoard) return done;
  // Chủ nhiệm mới nhận thông báo cần xác nhận (cùng lúc khối "Cần bạn xác nhận" ở Cộng đồng và Của tôi).
  return notify(done, [h.newBoard.president], {
    kind: "handover-accept", title: "Cần bạn xác nhận nhận bàn giao", at, href: `/clubs/${clubId}/handover`,
    body: `${personName(done, by)} đã chuyển bàn giao ${clubName(done, clubId)} (từ ${h.fromTerm} sang ${h.toTerm}) cho bạn. Xem rồi xác nhận để nhận quyền chủ nhiệm.`,
  });
};

/**
 * Bước 6: chủ nhiệm mới xác nhận đã nhận. Sau đó biên bản không sửa được.
 * Cùng lúc đổi vai theo ban mới đã chọn ở bước 1 (Hiệu chọn 29/10/2026): chủ nhiệm, phó chủ nhiệm, thủ quỹ, trưởng ban mới nhận vai;
 * mọi người khác đang ở ban điều hành (ban cũ) về thành viên thường. Ban (department) giữ nguyên. Ghi vào lịch sử bàn giao.
 */
export const acceptHandover = (clubId: string, by: string, at: string): Update => (s) => {
  let accepted = stepTo(clubId, 7, by, at, (st) => `${personName(st, by)} xác nhận đã nhận bàn giao`, () => ({ acceptedAt: at, acceptedBy: by }))(s);
  const board = accepted.handovers.find((h) => h.clubId === clubId)?.newBoard;
  if (!board) return accepted;
  const roles = new Map<string, Role>([[board.president, "president"]]);
  if (board.vice) roles.set(board.vice, "vice");
  if (board.treasurer) roles.set(board.treasurer, "treasurer");
  for (const h of board.heads) if (!roles.has(h.personId)) roles.set(h.personId, "head");
  // Mỗi ban nhận đúng trưởng ban đã chọn; ban không được chọn thì để trống trưởng.
  accepted = cancelOpenRoleHandovers(accepted, clubId, by, at, "ban mới đã nhận bàn giao cả ban");
  accepted = { ...accepted, departments: accepted.departments.map((d) => (d.clubId !== clubId ? d : withHead(d, board.heads.find((h) => h.department === d.name)?.personId))) };
  let gained = 0, lost = 0;
  const memberships = accepted.memberships.map((m) => {
    if (m.clubId !== clubId) return m;
    const next: Role | undefined = roles.get(m.personId) ?? (m.role === "member" ? undefined : "member");
    if (!next || next === m.role) return m;
    if (next === "member") lost++; else gained++;
    return { ...m, role: next };
  });
  const text = `đổi vai trò theo ban mới: ${gained} người nhận vai trong ban điều hành, ${lost} người ban cũ về thành viên`;
  const changed: AppState = { ...accepted, memberships, handovers: accepted.handovers.map((h) => (h.clubId !== clubId ? h : { ...h, history: [...h.history, { at, by, text }] })) };
  // Thông báo "Bàn giao xong" cho mọi người đổi vai (ban cũ về thành viên vẫn thấy dù đã mất quyền), và cho cán bộ trường để mentor xác nhận.
  const name = clubName(changed, clubId);
  const term = changed.handovers.find((h) => h.clubId === clubId)?.toTerm ?? "";
  let out: AppState = changed;
  for (const m of accepted.memberships) {
    if (m.clubId !== clubId) continue;
    const now = memberships.find((x) => x.clubId === clubId && x.personId === m.personId)?.role;
    if (!now || now === m.role) continue;
    out = now === "member"
      ? notify(out, [m.personId], { kind: "handover-done", title: "Bàn giao xong", at, href: "/me", body: `${personName(out, by)} đã xác nhận nhận bàn giao ${name}. Bạn đã chuyển thành thành viên của CLB; biên bản bàn giao đã khóa.` })
      : notify(out, [m.personId], { kind: "handover-done", title: "Bàn giao xong: bạn có vai mới", at, href: `/clubs/${clubId}`, body: `Bạn nhận vai ${ROLE_LABEL[now].toLowerCase()} của ${name}, nhiệm kỳ ${term}.` });
  }
  out = notify(out, staffIds(out), { kind: "handover-mentor", title: "Bàn giao chờ mentor xác nhận", at, href: `/school/clubs/${clubId}`, body: `${name} đã bàn giao xong sang ${term}. Mentor xác nhận biên bản ở trang chi tiết CLB.` });
  // Thông báo "Cần bạn xác nhận" của người vừa xác nhận coi như đã đọc.
  return { ...out, notifications: out.notifications.map((n) => (n.personId === by && n.kind === "handover-accept" && n.href === `/clubs/${clubId}/handover` && !n.readAt ? { ...n, readAt: at } : n)) };
};

/** Mentor xác nhận biên bản (không đổi bước). Chỉ gọi khi ban mới đã xác nhận và mentor chưa xác nhận (máy chủ kiểm trước). */
export const confirmHandoverByMentor = (clubId: string, by: string, at: string): Update => (s) => {
  const next: AppState = {
    ...s,
    handovers: s.handovers.map((h) => (h.clubId !== clubId ? h : {
      ...h, mentorConfirmedBy: by, mentorConfirmedAt: at,
      history: [...h.history, { at, by, text: `${personName(s, by)} (mentor) xác nhận biên bản bàn giao` }],
    })),
  };
  const receiver = s.handovers.find((h) => h.clubId === clubId)?.acceptedBy;
  return receiver ? notify(next, [receiver], { kind: "handover-mentor", title: "Mentor đã xác nhận biên bản", at, href: `/clubs/${clubId}/handover`, body: `${personName(s, by)} đã xác nhận biên bản bàn giao ${clubName(s, clubId)}.` }) : next;
};

/** Quay lại bước trước (chỉ chủ nhiệm cũ, và chỉ khi ban mới chưa xác nhận). */
export const setHandoverStep = (clubId: string, step: number, by: string, at: string): Update => stepTo(clubId, step, by, at, `quay lại bước ${step}`);

/** Lưu bản tóm tắt vào biên bản (không đổi bước). Ghi ai lưu, lúc nào. */
export const saveHandoverSummary = (clubId: string, text: string, mock: boolean, by: string, at: string): Update => (s) => ({
  ...s,
  handovers: s.handovers.map((h) => (h.clubId !== clubId ? h : {
    ...h, summary: { text, by, at, mock },
    history: [...h.history, { at, by, text: `lưu bản tóm tắt cho ban mới vào biên bản${mock ? " (bản mẫu, chưa dùng AI thật)" : ""}` }],
  })),
});

/** Ghi một lượt dùng trợ lý của CLB trong học kỳ. */
export const countAiUse = (clubId: string, term: string, kind: "asks" | "summaries"): Update => (s) => {
  const has = s.aiUsage.some((u) => u.clubId === clubId && u.term === term);
  return {
    ...s,
    aiUsage: has
      ? s.aiUsage.map((u) => (u.clubId === clubId && u.term === term ? { ...u, [kind]: u[kind] + 1 } : u))
      : [...s.aiUsage, { clubId, term, asks: kind === "asks" ? 1 : 0, summaries: kind === "summaries" ? 1 : 0 }],
  };
};

// ---------- Tin của CLB trên Cộng đồng ----------

/** Tin mới luôn ở trạng thái chờ trường duyệt. */
export const createPost = (p: Omit<ClubPost, "status" | "reviewedBy" | "reviewedAt" | "rejectReason">): Update => (s) =>
  notify({ ...s, posts: [...s.posts, { ...p, status: "pending" }] }, staffIds(s), { kind: "post-pending", title: "Tin mới chờ duyệt", at: p.createdAt, href: "/school/posts", body: `${clubName(s, p.clubId)}: "${p.title}"` });

/** Sửa tin bị từ chối rồi gửi lại: nội dung mới, tin quay về chờ duyệt (xóa lý do và người duyệt cũ), tính lại giờ gửi để vào cuối hàng chờ. */
export const resubmitPost = (id: string, change: { kind: ClubPost["kind"]; title: string; body: string; eventAt?: string; place?: string }, at: string): Update => (s) => {
  const next: AppState = {
    ...s,
    posts: s.posts.map((p) => {
      if (p.id !== id) return p;
      const { eventAt: _e, place: _p, rejectReason: _r, reviewedBy: _b, reviewedAt: _a, ...rest } = p;
      return { ...rest, ...change, status: "pending", createdAt: at };
    }),
  };
  const post = s.posts.find((p) => p.id === id);
  return post ? notify(next, staffIds(s), { kind: "post-pending", title: "Tin gửi lại chờ duyệt", at, href: "/school/posts", body: `${clubName(s, post.clubId)}: "${change.title}"` }) : next;
};

/** Cán bộ trường duyệt: tin hiện cho mọi người. Chỉ gọi cho tin đang chờ (máy chủ kiểm trước). */
export const approvePost = (id: string, by: string, at: string): Update => (s) => {
  const next: AppState = {
    ...s,
    posts: s.posts.map((p) => {
      if (p.id !== id) return p;
      const { rejectReason: _r, ...rest } = p;
      return { ...rest, status: "approved", reviewedBy: by, reviewedAt: at };
    }),
  };
  const post = s.posts.find((p) => p.id === id);
  return post ? notify(next, [post.createdBy], { kind: "post-approved", title: "Tin của bạn đã được duyệt", at, href: `/feed/${id}`, body: `"${post.title}" đã hiện trên Cộng đồng.` }) : next;
};

/** Cán bộ trường từ chối: kèm lý do, người đăng thấy lý do. */
export const rejectPost = (id: string, reason: string, by: string, at: string): Update => (s) => {
  const next: AppState = {
    ...s,
    posts: s.posts.map((p) => (p.id === id ? { ...p, status: "rejected", reviewedBy: by, reviewedAt: at, rejectReason: reason } : p)),
  };
  const post = s.posts.find((p) => p.id === id);
  return post ? notify(next, [post.createdBy], { kind: "post-rejected", title: "Tin của bạn bị từ chối", at, href: `/clubs/${post.clubId}/posts`, body: `"${post.title}": ${reason}` }) : next;
};

// ---------- Thông báo ----------

/** Đánh dấu đã đọc thông báo của một người: các id đã cho, hoặc tất cả nếu không cho id. Thông báo đã đọc giữ nguyên giờ đọc cũ. */
export const markNotificationsRead = (personId: string, ids: string[] | undefined, at: string): Update => (s) => ({
  ...s,
  notifications: s.notifications.map((n) => (n.personId === personId && !n.readAt && (!ids || ids.includes(n.id)) ? { ...n, readAt: at } : n)),
});

// ---------- Việc cần làm ----------

export const createTask = (t: Omit<ClubTask, "status" | "history">): Update => (s) => ({
  ...s,
  tasks: [...s.tasks, { ...t, status: "todo", history: [{ at: t.createdAt, by: t.createdBy, text: `tạo việc, giao cho ${personName(s, t.assigneeId)}` }] }],
});

/** Sửa tên, người phụ trách, hạn. Đổi người phụ trách thì ghi "giao lại". */
export const updateTask = (id: string, change: { title: string; assigneeId: string; due: string; eventId?: string; processId?: string }, by: string, at: string): Update => (s) => ({
  ...s,
  tasks: s.tasks.map((t) => {
    if (t.id !== id) return t;
    const { eventId: _e, processId: _p, ...rest } = t;
    const note = change.assigneeId !== t.assigneeId ? `giao lại cho ${personName(s, change.assigneeId)}` : "sửa việc";
    return { ...rest, ...change, history: [...t.history, { at, by, text: note }] };
  }),
});

export const setTaskStatus = (id: string, status: TaskStatus, by: string, at: string): Update => (s) => ({
  ...s,
  tasks: s.tasks.map((t) => (t.id === id && t.status !== status ? { ...t, status, history: [...t.history, { at, by, text: `đổi trạng thái: ${TASK_STATUS_LABEL[status].toLowerCase()}` }] } : t)),
});

// ---------- Kho bàn giao: biểu mẫu, quy trình, tài khoản ----------

/** Thêm mới, hoặc sửa nếu mã đã có. Nơi gọi đã kiểm tra dữ liệu và quyền. */
const upsert = <T extends { id: string }>(list: T[], item: T): T[] => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

export const saveKitDocument = (d: KitDocument): Update => (s) => ({ ...s, kitDocuments: upsert(s.kitDocuments, d) });
export const saveKitProcess = (p: KitProcess): Update => (s) => ({ ...s, kitProcesses: upsert(s.kitProcesses, p) });
export const saveKitAccount = (a: KitAccount): Update => (s) => ({ ...s, kitAccounts: upsert(s.kitAccounts, a) });

/** Xóa một biểu mẫu, và gỡ nó khỏi các quy trình đang dùng. */
export const removeKitDocument = (id: string): Update => (s) => ({
  ...s,
  kitDocuments: s.kitDocuments.filter((d) => d.id !== id),
  kitProcesses: s.kitProcesses.map((p) => (p.documentIds.includes(id) ? { ...p, documentIds: p.documentIds.filter((x) => x !== id) } : p)),
});
export const removeKitProcess = (id: string): Update => (s) => ({ ...s, kitProcesses: s.kitProcesses.filter((p) => p.id !== id) });
export const removeKitAccount = (id: string): Update => (s) => ({ ...s, kitAccounts: s.kitAccounts.filter((a) => a.id !== id) });

// ---------- Tạo dữ liệu từ đầu: CLB, thành viên, buổi, đợt thu (04/10/2026, mô tả được Hiệu duyệt) ----------

/** Tạo CLB. Người tạo thành chủ nhiệm, mã A001, đã nhận lời mời (không cần đồng ý qua link mời của chính mình). */
export const createClub = (c: Omit<Club, "staticStats"> & { personId: string }): Update => (s) => {
  if (s.clubs.some((x) => x.id === c.id)) return s;
  const { personId, ...club } = c;
  return {
    ...s,
    clubs: [...s.clubs, club],
    memberships: [...s.memberships, { clubId: c.id, personId, code: "A001", department: SAMPLE_DEPARTMENTS[0], role: "president", invite: "accepted" }],
    departments: [...s.departments, ...SAMPLE_DEPARTMENTS.map((name, i) => ({ id: `ban-${c.id}-${i + 1}`, clubId: c.id, name }))],
  };
};

export interface NewMember {
  /** Người đã có (cùng email) thì dùng lại mã người đó; người mới thì nơi gọi tạo mã. */
  personId: string;
  name: string;
  email: string;
  year?: number;
  department: string;
  inviteCode: string;
}

/**
 * Thêm thành viên (nhập từ Excel hoặc thêm tay). Mỗi người: mã thành viên mới, vai "Thành viên", chưa nhận lời mời,
 * có link mời riêng, và một khoản phải đóng ở đợt thu đang mở của kỳ hiện tại (không tính đợt cũ). Người đã ở CLB thì bỏ qua.
 */
export const addMembers = (clubId: string, people: NewMember[], at: string): Update => (s) => {
  const collections = openCollections(s, clubId, at);
  let next = s;
  for (const p of people) {
    if (next.memberships.some((m) => m.clubId === clubId && m.personId === p.personId)) continue;
    const person: Person[] = next.persons.some((x) => x.id === p.personId) ? [] : [{ id: p.personId, name: p.name, email: p.email, kind: "student", ...(p.year ? { year: p.year } : {}) }];
    const code = nextMemberCode(next, clubId);
    next = {
      ...next,
      persons: person.length ? [...next.persons, ...person] : next.persons,
      memberships: [...next.memberships, { clubId, personId: p.personId, code, department: p.department, role: "member", invite: "pending", inviteCode: p.inviteCode }],
      payments: [...next.payments, ...collections.map((c): Payment => ({ collectionId: c.id, personId: p.personId, status: "unpaid", amountPaid: 0 }))],
    };
  }
  return next;
};

/**
 * Đổi vai trò và ban. Đổi chủ nhiệm không làm ở đây (làm khi bàn giao).
 * Vai "trưởng ban" là trưởng của ban đã chọn (người trưởng cũ của ban đó về thành viên nếu không còn làm trưởng ban nào);
 * đổi sang vai khác thì người đó thôi làm trưởng mọi ban.
 */
export const updateMember = (clubId: string, personId: string, change: { role: Role; department: string }): Update => (s) => {
  const target = s.departments.find((d) => d.clubId === clubId && d.name === change.department);
  const departments = s.departments.map((d) => {
    if (d.clubId !== clubId) return d;
    if (change.role !== "head") return d.headId === personId ? withHead(d, undefined) : d;
    return d.id === target?.id ? withHead(d, personId) : d;
  });
  const memberships = s.memberships.map((m) => (m.clubId === clubId && m.personId === personId ? { ...m, role: change.role, department: change.department } : m));
  return syncHeadRoles({ ...s, departments, memberships }, clubId);
};

// ---------- Ban và trưởng ban (09/11/2026, mô tả: docs/mo-ta-ban-giao-theo-vai.md) ----------

const nameKey = (name: string) => name.replace(/\s+/g, " ").trim().toLocaleLowerCase("vi");
const tidy = (name: string) => name.replace(/\s+/g, " ").trim();

/** Ban với trưởng ban mới (không có trưởng thì bỏ hẳn trường headId, như dữ liệu đọc từ cơ sở dữ liệu). */
function withHead(d: Department, personId: string | undefined): Department {
  const { headId: _old, ...rest } = d;
  return personId ? { ...rest, headId: personId } : rest;
}

/** Vai "trưởng ban" luôn khớp danh sách ban: ai làm trưởng ít nhất một ban thì có vai head, ai không còn làm trưởng ban nào thì về thành viên. Vai khác (chủ nhiệm, phó, thủ quỹ) giữ nguyên. */
function syncHeadRoles(s: AppState, clubId: string): AppState {
  const heads = new Set(s.departments.filter((d) => d.clubId === clubId && d.headId).map((d) => d.headId));
  return {
    ...s,
    memberships: s.memberships.map((m) => {
      if (m.clubId !== clubId) return m;
      if (heads.has(m.personId) && m.role === "member") return { ...m, role: "head" as Role };
      if (!heads.has(m.personId) && m.role === "head") return { ...m, role: "member" as Role };
      return m;
    }),
  };
}

/** Ban của CLB theo tên (không phân biệt hoa thường). */
export const findDepartment = (s: AppState, clubId: string, name: string): Department | undefined =>
  s.departments.find((d) => d.clubId === clubId && nameKey(d.name) === nameKey(name));

/** Lý do không dùng được tên ban này, hoặc undefined nếu dùng được. exceptId: ban đang đổi tên. */
export function departmentNameError(s: AppState, clubId: string, name: string, exceptId?: string): string | undefined {
  const clean = tidy(name);
  if (!clean) return "Cần ghi tên ban.";
  if (clean.length > 60) return "Tên ban tối đa 60 ký tự.";
  if (nameKey(clean) === nameKey(NO_DEPARTMENT)) return `"${NO_DEPARTMENT}" không phải một ban.`;
  if (s.departments.some((d) => d.clubId === clubId && d.id !== exceptId && nameKey(d.name) === nameKey(clean))) return "CLB đã có ban tên này.";
  return undefined;
}

/** Lý do không xóa được ban (còn trưởng ban hoặc còn thành viên), hoặc undefined nếu xóa được. */
export function departmentDeleteBlock(s: AppState, id: string): string | undefined {
  const d = s.departments.find((x) => x.id === id);
  if (!d) return "Không tìm thấy ban này.";
  if (d.headId) return "Ban còn trưởng ban. Bàn giao vị trí trưởng ban trước.";
  const n = s.memberships.filter((m) => m.clubId === d.clubId && m.department === d.name).length;
  return n ? `Ban còn ${n} thành viên. Chuyển họ sang ban khác trước.` : undefined;
}

/** Lý do người này không làm trưởng ban được, hoặc undefined. Chủ nhiệm, phó chủ nhiệm, thủ quỹ không kiêm trưởng ban. */
export function headBlock(s: AppState, clubId: string, personId: string): string | undefined {
  const m = s.memberships.find((x) => x.clubId === clubId && x.personId === personId);
  if (!m) return "Người này không có trong danh sách thành viên.";
  if (m.invite !== "accepted") return "Trưởng ban phải là thành viên đã nhận lời mời.";
  if (m.role === "president" || m.role === "vice" || m.role === "treasurer") return `${ROLE_LABEL[m.role]} không kiêm trưởng ban.`;
  return undefined;
}

export const createDepartment = (clubId: string, id: string, name: string): Update => (s) => ({ ...s, departments: [...s.departments, { id, clubId, name: tidy(name) }] });

/** Đổi tên ban: thành viên và trưởng ban giữ nguyên. Biên bản bàn giao đã xác nhận giữ tên ban tại thời điểm đó. */
export const renameDepartment = (id: string, name: string): Update => (s) => {
  const d = s.departments.find((x) => x.id === id);
  if (!d) return s;
  const to = tidy(name);
  return {
    ...s,
    departments: s.departments.map((x) => (x.id === id ? { ...x, name: to } : x)),
    memberships: s.memberships.map((m) => (m.clubId === d.clubId && m.department === d.name ? { ...m, department: to } : m)),
    handovers: s.handovers.map((h) => (h.clubId !== d.clubId || h.acceptedAt || !h.newBoard
      ? h
      : { ...h, newBoard: { ...h.newBoard, heads: h.newBoard.heads.map((x) => (x.department === d.name ? { ...x, department: to } : x)) } })),
  };
};

/** Xóa ban. Nơi gọi kiểm departmentDeleteBlock trước. */
export const deleteDepartment = (id: string): Update => (s) => ({ ...s, departments: s.departments.filter((d) => d.id !== id) });

/** Đặt (hoặc bỏ, personId trống) trưởng của một ban. Người trưởng cũ về thành viên nếu không còn làm trưởng ban nào. Nơi gọi kiểm headBlock trước. */
export const setDepartmentHead = (id: string, personId: string | undefined): Update => (s) => {
  const d = s.departments.find((x) => x.id === id);
  if (!d) return s;
  return syncHeadRoles({ ...s, departments: s.departments.map((x) => (x.id === id ? withHead(x, personId) : x)) }, d.clubId);
};

export type EventFields = Pick<ClubEvent, "title" | "kind" | "start" | "end" | "location" | "checkinUntil">;

export const createEvent = (e: EventFields & { id: string; clubId: string }): Update => (s) => ({
  ...s,
  events: [...s.events, { id: e.id, clubId: e.clubId, title: e.title, kind: e.kind, start: e.start, end: e.end, location: e.location, checkinUntil: e.checkinUntil, status: "upcoming" }],
});

/** Sửa buổi: chỉ khi chưa mở điểm danh. */
export const updateEvent = (id: string, f: EventFields): Update => (s) => ({
  ...s,
  events: s.events.map((e) => (e.id === id && e.status === "upcoming" ? { ...e, ...f } : e)),
});

/** Xóa buổi: chỉ khi chưa mở điểm danh và chưa ai điểm danh. */
export const deleteEvent = (id: string): Update => (s) => {
  const e = s.events.find((x) => x.id === id);
  if (!e || e.status !== "upcoming" || s.attendance.some((a) => a.eventId === id)) return s;
  return { ...s, events: s.events.filter((x) => x.id !== id) };
};

/** Tạo đợt thu: mọi thành viên của CLB (kể cả người chưa nhận lời mời) có một khoản "Chưa đóng". */
export const createCollection = (c: Collection): Update => (s) => {
  if (s.collections.some((x) => x.id === c.id)) return s;
  const members = s.memberships.filter((m) => m.clubId === c.clubId);
  return {
    ...s,
    collections: [...s.collections, c],
    payments: [...s.payments, ...members.map((m): Payment => ({ collectionId: c.id, personId: m.personId, status: "unpaid", amountPaid: 0 }))],
  };
};

/** Sửa đợt thu: hạn đóng lúc nào cũng sửa được; mức thu chỉ sửa khi chưa ai đóng hay báo đã chuyển. */
export const updateCollection = (id: string, change: { dueDate?: string; amount?: number }): Update => (s) => {
  const c = s.collections.find((x) => x.id === id);
  if (!c) return s;
  const touched = s.payments.some((p) => p.collectionId === id && (p.status !== "unpaid" || p.amountPaid > 0));
  const amount = change.amount !== undefined && !touched ? change.amount : c.amount;
  return { ...s, collections: s.collections.map((x) => (x.id === id ? { ...x, amount, dueDate: change.dueDate ?? x.dueDate } : x)) };
};

// ---------- Bàn giao một vai (09/11/2026) ----------
// Tách khỏi bàn giao cả ban. Mỗi thao tác làm được khi đơn đang đúng ở bước đó (nơi gọi kiểm tra). Mô tả: docs/mo-ta-ban-giao-theo-vai.md, mục 2.11.

export const ROLE_HANDOVER_ROLES: RoleHandover["role"][] = ["president", "vice", "treasurer", "head"];

/** Đơn còn đang chạy (chưa xong, chưa bị từ chối hay hủy). */
export const roleHandoverOpen = (h: RoleHandover): boolean => h.status === "requested" || h.status === "waiting" || h.status === "active";

/** Tên vai kèm ban (trưởng ban nào) để hiện cho người đọc. */
export const roleHandoverLabel = (h: Pick<RoleHandover, "role" | "department">): string =>
  h.role === "head" && h.department ? `${ROLE_LABEL.head.toLowerCase()} ${h.department}` : ROLE_LABEL[h.role].toLowerCase();

/** Người nhận phải là thành viên đã nhận lời mời, không phải chính mình, và chưa giữ chức danh khác (chủ nhiệm, phó chủ nhiệm, thủ quỹ); trưởng ban nhận thêm ban thì được. */
export function roleHandoverTargetBlock(s: AppState, clubId: string, role: RoleHandover["role"], fromId: string, toId: string): string | undefined {
  if (toId === fromId) return "Người nhận phải là người khác.";
  const m = s.memberships.find((x) => x.clubId === clubId && x.personId === toId);
  if (!m) return "Người nhận không có trong danh sách thành viên.";
  if (m.invite !== "accepted") return "Người nhận phải là thành viên đã nhận lời mời.";
  if (m.role === "president" || m.role === "vice" || m.role === "treasurer") return `${ROLE_LABEL[m.role]} đang giữ chức danh khác, mỗi người một chức danh.`;
  if (m.role === "head" && role !== "head") return "Trưởng ban đang giữ chức danh khác, mỗi người một chức danh (trừ làm trưởng nhiều ban).";
  return undefined;
}

/** Lý do không gửi được đơn, hoặc undefined nếu gửi được. `by` phải đang giữ đúng vai (với trưởng ban: đúng ban). */
export function roleHandoverRequestBlock(s: AppState, clubId: string, by: string, input: { role: RoleHandover["role"]; department?: string; toId: string }): string | undefined {
  const m = s.memberships.find((x) => x.clubId === clubId && x.personId === by);
  if (!m || m.invite !== "accepted") return "Bạn chưa là thành viên của CLB.";
  let dep: string | undefined;
  if (input.role === "head") {
    const d = input.department ? findDepartment(s, clubId, input.department) : undefined;
    if (!d) return "Chọn ban cần bàn giao.";
    if (d.headId !== by) return `Bạn không phải trưởng ban ${d.name}.`;
    dep = d.name;
  } else if (m.role !== input.role) {
    return `Bạn không giữ vai ${ROLE_LABEL[input.role].toLowerCase()}.`;
  }
  if (s.roleHandovers.some((h) => h.clubId === clubId && roleHandoverOpen(h) && h.role === input.role && h.department === dep && (input.role === "head" || h.fromId === by))) {
    return "Vai này đang có một đơn bàn giao chưa xong.";
  }
  return roleHandoverTargetBlock(s, clubId, input.role, by, input.toId);
}

/** Bước kế tiếp sau bước `from`: bước 2 (chốt số dư) và 4 (đổi tài khoản nhận quỹ) chỉ có với thủ quỹ, vai khác ghi "không áp dụng" và bỏ qua. */
export const roleHandoverNextStep = (h: Pick<RoleHandover, "role">, from: number): number => {
  let n = from + 1;
  while ((n === 2 || n === 4) && h.role !== "treasurer") n++;
  return n;
};

const touchRole = (s: AppState, id: string, change: Partial<RoleHandover>, entry?: { by: string; at: string; text: string }): AppState => ({
  ...s, roleHandovers: s.roleHandovers.map((h) => (h.id !== id ? h : { ...h, ...change, history: entry ? [...h.history, { at: entry.at, by: entry.by, text: entry.text }] : h.history })),
});

/** Gửi đơn. Chủ nhiệm bàn giao vai của mình không cần đơn: vào bước kế ngay. Người khác: chờ chủ nhiệm duyệt, chủ nhiệm nhận thông báo. */
export const requestRoleHandover = (h: Pick<RoleHandover, "id" | "clubId" | "role" | "department" | "fromId" | "toId" | "reason">, at: string): Update => (s) => {
  const direct = h.role === "president";
  const base: RoleHandover = {
    ...h, status: direct ? "active" : "requested", step: direct ? roleHandoverNextStep(h, 1) : 1, requestedAt: at, transferred: [],
    history: [{ at, by: h.fromId, text: `${direct ? "bắt đầu bàn giao" : "gửi đơn bàn giao"} vai ${roleHandoverLabel(h)} cho ${personName(s, h.toId)}: ${h.reason}` }],
  };
  const next: AppState = { ...s, roleHandovers: [...s.roleHandovers, base] };
  if (direct) return notify(next, [h.toId], { kind: "role-handover-request", title: "Có người muốn bàn giao vai cho bạn", at, href: `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, h.fromId)} đề xuất bàn giao vai ${roleHandoverLabel(h)} của ${clubName(s, h.clubId)} cho bạn. Bạn sẽ xác nhận ở bước 6.` });
  const presidents = s.memberships.filter((m) => m.clubId === h.clubId && m.role === "president").map((m) => m.personId);
  return notify(next, presidents, { kind: "role-handover-request", title: "Có đơn bàn giao chờ bạn duyệt", at, href: `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, h.fromId)} xin bàn giao vai ${roleHandoverLabel(h)} cho ${personName(s, h.toId)}. Lý do: ${h.reason}` });
};

/** Chủ nhiệm duyệt (người gửi sang bước kế tiếp) hoặc từ chối (kèm lý do). */
export const decideRoleHandover = (id: string, approve: boolean, rejectReason: string | undefined, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  if (!h) return s;
  const label = roleHandoverLabel(h);
  const next = approve
    ? touchRole(s, id, { status: "active", step: roleHandoverNextStep(h, 1), decidedAt: at, decidedBy: by }, { by, at, text: `${personName(s, by)} duyệt đơn bàn giao vai ${label}` })
    : touchRole(s, id, { status: "rejected", decidedAt: at, decidedBy: by, rejectReason }, { by, at, text: `${personName(s, by)} từ chối đơn bàn giao vai ${label}: ${rejectReason ?? ""}` });
  return notify(next, [h.fromId], {
    kind: "role-handover-decision", at, href: `/clubs/${h.clubId}/handover/roles`,
    title: approve ? "Đơn bàn giao đã được duyệt" : "Đơn bàn giao bị từ chối",
    body: approve ? `${personName(s, by)} đã duyệt đơn bàn giao vai ${label}. Bạn làm tiếp các bước tiếp theo.` : `${personName(s, by)} từ chối đơn bàn giao vai ${label}. Lý do: ${rejectReason ?? ""}. Bạn sửa rồi gửi lại được.`,
  });
};

/** Hủy trước khi người nhận xác nhận. Lịch sử giữ lại, đánh dấu "đã hủy". */
export const cancelRoleHandover = (id: string, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  return h ? touchRole(s, id, { status: "cancelled" }, { by, at, text: `${personName(s, by)} hủy bàn giao vai ${roleHandoverLabel(h)}` }) : s;
};

/** Bàn giao cả ban xong thì các đơn bàn giao một vai đang chạy không còn nghĩa: đánh dấu đã hủy. */
function cancelOpenRoleHandovers(s: AppState, clubId: string, by: string, at: string, why: string): AppState {
  return { ...s, roleHandovers: s.roleHandovers.map((h) => (h.clubId !== clubId || !roleHandoverOpen(h) ? h : { ...h, status: "cancelled" as const, history: [...h.history, { at, by, text: `tự hủy: ${why}` }] })) };
}

const advanceRole = (id: string, from: number, by: string, at: string, text: string | ((s: AppState) => string), change: (h: RoleHandover, s: AppState) => Partial<RoleHandover> = () => ({})): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  return h ? touchRole(s, id, { ...change(h, s), step: roleHandoverNextStep(h, from) }, { by, at, text: typeof text === "function" ? text(s) : text }) : s;
};

/** Bước 2 (thủ quỹ): chốt số dư sổ quỹ lúc bấm. */
export const lockRoleHandoverBalance = (id: string, by: string, at: string): Update =>
  advanceRole(id, 2, by, at, (s) => `chốt số dư ${money(balance(s, s.roleHandovers.find((x) => x.id === id)!.clubId))}`, (h, s) => ({ lockedBalance: balance(s, h.clubId), lockedAt: at }));

/** Những gì người đang giữ vai đang nắm: biểu mẫu, tài khoản trong kho (holderId là họ) và việc chưa xong giao cho họ. */
export function roleHandoverHolding(s: AppState, h: Pick<RoleHandover, "clubId" | "fromId">) {
  return {
    documents: s.kitDocuments.filter((d) => d.clubId === h.clubId && d.holderId === h.fromId).map((d) => ({ id: d.id, name: d.name })),
    accounts: s.kitAccounts.filter((a) => a.clubId === h.clubId && a.holderId === h.fromId),
    tasks: s.tasks.filter((t) => t.clubId === h.clubId && t.assigneeId === h.fromId && t.status !== "done").map((t) => ({ id: t.id, title: t.title, due: t.due })),
  };
}

/**
 * Bước 3: đã xem phần kho và việc của người đang giữ vai. Ghi lại danh sách đó (snapshot) và lời dặn cho người nhận (không bắt buộc).
 * Tài khoản chuyển quyền ở bước 5 sẽ không còn nằm trong phần "đang giữ", nên phải chụp lại ở đây.
 */
export const reviewRoleHandoverKit = (id: string, by: string, at: string, note?: string): Update =>
  advanceRole(id, 3, by, at, (s) => {
    const k = roleHandoverHolding(s, s.roleHandovers.find((x) => x.id === id)!);
    return `kiểm tra phần đang giữ: ${k.documents.length} biểu mẫu, ${k.accounts.length} tài khoản, ${k.tasks.length} việc chưa xong${note?.trim() ? "; để lại lời dặn cho người nhận" : ""}`;
  }, (h, s) => {
    const k = roleHandoverHolding(s, h);
    return {
      snapshot: { documents: k.documents, accounts: k.accounts.map((a) => ({ id: a.id, service: a.service, label: a.label, required: a.required })), tasks: k.tasks },
      ...(note?.trim() ? { note: note.trim() } : {}),
    };
  });

/** Bước 4 (thủ quỹ): tài khoản nhận quỹ mới của người nhận. */
export const saveRoleHandoverAccount = (id: string, newReceiver: { personId: string; bank: string; account: string }, transferRef: string, by: string, at: string): Update =>
  advanceRole(id, 4, by, at, (s) => `đổi tài khoản nhận quỹ sang ${personName(s, newReceiver.personId)} (${newReceiver.bank})`, () => ({ newReceiver, transferRef }));

/** Bước 5, từng dòng: người nhận giữ quyền quản trị của một tài khoản mà người giao đang giữ. Việc đổi quyền thật làm ở chính dịch vụ. */
export const transferRoleHandoverAccount = (id: string, accountId: string, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  const account = s.kitAccounts.find((a) => a.id === accountId);
  if (!h || !account) return s;
  const moved: AppState = { ...s, kitAccounts: s.kitAccounts.map((a) => (a.id === accountId ? { ...a, holderId: h.toId, updatedAt: at } : a)) };
  return touchRole(moved, id, { transferred: h.transferred.includes(accountId) ? h.transferred : [...h.transferred, accountId] }, { by, at, text: `chuyển quyền quản trị ${account.service} cho ${personName(s, h.toId)}` });
};

/** Hết bước 5 khi mọi tài khoản bắt buộc người giao đang giữ đã chuyển. Người nhận nhận thông báo cần xác nhận. */
export const finishRoleHandoverTransfer = (id: string, by: string, at: string): Update => (s) => {
  const done = advanceRole(id, 5, by, at, "chuyển xong quyền quản trị các tài khoản bắt buộc")(s);
  const h = done.roleHandovers.find((x) => x.id === id);
  if (!h) return done;
  return notify(done, [h.toId], {
    kind: "role-handover-accept", title: "Cần bạn xác nhận nhận bàn giao vai", at, href: `/clubs/${h.clubId}/handover/roles`,
    body: `${personName(done, h.fromId)} đã chuyển xong bàn giao vai ${roleHandoverLabel(h)} của ${clubName(done, h.clubId)} cho bạn. Xem rồi xác nhận để nhận vai.`,
  });
};

/** Lý do không xác nhận được ở bước 6 (người giao không còn giữ vai, người nhận không còn đủ điều kiện), hoặc undefined. */
export function acceptRoleHandoverBlock(s: AppState, h: RoleHandover): string | undefined {
  if (h.role === "head") {
    const d = findDepartment(s, h.clubId, h.department ?? "");
    if (!d || d.headId !== h.fromId) return "Người giao không còn là trưởng ban này.";
    return headBlock(s, h.clubId, h.toId);
  }
  const holder = s.memberships.find((m) => m.clubId === h.clubId && m.personId === h.fromId);
  if (!holder || holder.role !== h.role) return "Người giao không còn giữ vai này.";
  return roleHandoverTargetBlock(s, h.clubId, h.role, h.fromId, h.toId);
}

/** Bước 6: người nhận xác nhận. Người nhận có vai mới, người giao về thành viên (trưởng ban: chỉ đổi trưởng của ban đó). Xong thì biên bản (bước 7) khóa. */
export const acceptRoleHandover = (id: string, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  if (!h) return s;
  let out: AppState;
  if (h.role === "head") {
    const d = findDepartment(s, h.clubId, h.department ?? "");
    out = d ? setDepartmentHead(d.id, h.toId)(s) : s;
  } else {
    out = { ...s, memberships: s.memberships.map((m) => (m.clubId !== h.clubId ? m : m.personId === h.toId ? { ...m, role: h.role } : m.personId === h.fromId ? { ...m, role: "member" as Role } : m)) };
  }
  const label = roleHandoverLabel(h);
  out = touchRole(out, id, { status: "done", step: 7, acceptedAt: at }, { by, at, text: `${personName(s, by)} xác nhận đã nhận vai ${label}` });
  out = notify(out, [h.fromId], { kind: "role-handover-done", title: "Bàn giao vai xong", at, href: `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, h.toId)} đã xác nhận nhận vai ${label} của ${clubName(s, h.clubId)}. Biên bản đã khóa.` });
  const presidents = s.memberships.filter((m) => m.clubId === h.clubId && m.role === "president" && m.personId !== h.fromId && m.personId !== h.toId).map((m) => m.personId);
  if (h.proxy && h.proxy.requesterId !== h.fromId && h.proxy.requesterId !== h.toId && !presidents.includes(h.proxy.requesterId)) presidents.push(h.proxy.requesterId);
  out = notify(out, presidents, { kind: "role-handover-done", title: "Bàn giao vai xong", at, href: `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, h.fromId)} đã bàn giao vai ${label} cho ${personName(s, h.toId)}.` });
  return { ...out, notifications: out.notifications.map((n) => (n.personId === by && n.kind === "role-handover-accept" && n.href === `/clubs/${h.clubId}/handover/roles` && !n.readAt ? { ...n, readAt: at } : n)) };
};

// ---------- Bàn giao hộ (09/11/2026) ----------
// Người giữ vai không liên lạc được: một người khác trong ban điều hành (bất kỳ ai, cho bất kỳ vai nào khác vai của mình) gửi yêu cầu kèm nhật ký tối thiểu 3 lần liên hệ
// và ít nhất một ảnh chụp màn hình. Mentor duyệt bằng chứng (CLB chưa có mentor: phó chủ nhiệm duyệt, trừ vai thủ quỹ và chủ nhiệm) → báo người giữ vai và đếm 3 ngày
// → người giữ vai bấm "Tôi vẫn đảm nhận" thì hủy; im lặng hết 3 ngày thì làm tiếp các bước như tự bàn giao (người gửi làm thay; vai chủ nhiệm do mentor làm thay).

export const PROXY_MIN_CONTACTS = 3;
export const PROXY_MAX_CONTACTS = 10;
export const PROXY_WAIT_DAYS = 3;
export const PROXY_RETRY_DAYS = 7;
export const EVIDENCE_MAX_FILES = 10;
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_KEEP_DAYS = 30;
export const EVIDENCE_MIME = ["image/jpeg", "image/png"] as const;
const DAY_MS = 86_400_000;

export const CONTACT_CHANNEL_LABEL: Record<ContactChannel, string> = { phone: "Điện thoại", zalo: "Zalo", email: "Email", friend: "Qua bạn chung" };

/** Người làm các bước 2 đến 5: người giữ vai (tự bàn giao) hoặc người gửi yêu cầu (bàn giao hộ). */
export const roleHandoverActor = (h: Pick<RoleHandover, "fromId" | "proxy">): string => h.proxy?.requesterId ?? h.fromId;

/** Người đang giữ vai `role` (với trưởng ban: của ban `department`), hoặc undefined khi vai trống. */
export function roleHolder(s: AppState, clubId: string, role: RoleHandover["role"], department?: string): string | undefined {
  if (role === "head") return department ? findDepartment(s, clubId, department)?.headId : undefined;
  return s.memberships.find((m) => m.clubId === clubId && m.role === role && m.invite === "accepted")?.personId;
}

/** Ai duyệt được bằng chứng: mentor (cán bộ trường) luôn duyệt được; phó chủ nhiệm duyệt khi CLB chưa có mentor, trừ vai thủ quỹ và chủ nhiệm. */
export function proxyViceApproves(s: AppState, clubId: string, role: RoleHandover["role"]): boolean {
  const club = s.clubs.find((c) => c.id === clubId);
  return !club?.mentor && role !== "treasurer" && role !== "president";
}

const dayStart = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00+07:00`);

export function proxyRequestBlock(
  s: AppState, clubId: string, by: string, now: number,
  input: { role: RoleHandover["role"]; department?: string; toId: string; contacts: ContactAttempt[] },
): string | undefined {
  const me = s.memberships.find((m) => m.clubId === clubId && m.personId === by);
  if (!me || me.invite !== "accepted") return "Bạn chưa là thành viên của CLB.";
  const dep = input.role === "head" ? findDepartment(s, clubId, input.department ?? "")?.name : undefined;
  if (input.role === "head" && !dep) return "Chọn ban cần bàn giao.";
  // Mọi người trong ban điều hành gửi được cho mọi vai khác, trừ vai của chính mình (Hiệu chọn 09/11/2026). Thành viên thường thì không.
  if (me.role === "member") return "Chỉ ban điều hành gửi được yêu cầu bàn giao hộ.";
  const holder = roleHolder(s, clubId, input.role, dep);
  if (!holder) return "Vai này đang trống, không có người để bàn giao hộ.";
  if (holder === by) return "Bạn đang giữ vai này, hãy tự bàn giao.";
  const club = s.clubs.find((c) => c.id === clubId);
  const vice = s.memberships.find((m) => m.clubId === clubId && m.role === "vice" && m.invite === "accepted" && m.personId !== by && m.personId !== holder);
  if (!club?.mentor && !(proxyViceApproves(s, clubId, input.role) && vice)) {
    return input.role === "treasurer" || input.role === "president" ? "Vai này cần mentor duyệt, mà CLB chưa có mentor." : "CLB chưa có mentor và chưa có phó chủ nhiệm khác để duyệt bằng chứng.";
  }
  if (input.contacts.length < PROXY_MIN_CONTACTS) return `Cần ghi tối thiểu ${PROXY_MIN_CONTACTS} lần liên hệ với người giữ vai.`;
  if (input.contacts.length > PROXY_MAX_CONTACTS) return `Tối đa ${PROXY_MAX_CONTACTS} lần liên hệ.`;
  for (const c of input.contacts) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date) || Number.isNaN(dayStart(c.date))) return "Ngày liên hệ không hợp lệ.";
    if (dayStart(c.date) > now) return "Ngày liên hệ không được ở tương lai.";
    if (!c.result.trim()) return "Mỗi lần liên hệ cần ghi kết quả.";
  }
  const ids = input.contacts.flatMap((c) => c.evidenceIds);
  if (ids.length === 0) return "Cần đính kèm ít nhất một ảnh chụp màn hình làm bằng chứng.";
  if (new Set(ids).size !== ids.length) return "Một ảnh chỉ đính kèm một lần.";
  if (ids.length > EVIDENCE_MAX_FILES) return `Tối đa ${EVIDENCE_MAX_FILES} ảnh mỗi yêu cầu.`;
  for (const id of ids) {
    const f = s.evidence.find((e) => e.id === id);
    if (!f || f.clubId !== clubId || f.uploaderId !== by || f.handoverId) return "Có ảnh không dùng được (đã hết hạn hoặc không phải của bạn).";
  }
  if (s.roleHandovers.some((h) => h.clubId === clubId && roleHandoverOpen(h) && h.role === input.role && h.department === dep && (input.role === "head" || h.fromId === holder))) {
    return "Vai này đang có một đơn bàn giao chưa xong.";
  }
  const kept = s.roleHandovers.find((h) => h.clubId === clubId && h.role === input.role && h.department === dep && h.status === "kept" && h.proxy?.keptAt && now - Date.parse(h.proxy.keptAt) < PROXY_RETRY_DAYS * DAY_MS);
  if (kept) return `Người giữ vai vừa bấm "Tôi vẫn đảm nhận". Chờ ${PROXY_RETRY_DAYS} ngày kể từ lúc đó mới gửi lại được; muốn đổi sớm thì nhờ mentor quyết.`;
  return roleHandoverTargetBlock(s, clubId, input.role, holder, input.toId);
}

/** Một ảnh bằng chứng. `data` là nội dung ảnh mã hóa base64 (chỉ máy chủ giữ). Chưa gắn vào yêu cầu nào thì handoverId trống. */
export const addEvidence = (f: EvidenceFile): Update => (s) => ({ ...s, evidence: [...s.evidence, f] });

/** Xóa ảnh quá 30 ngày (nhật ký chữ của yêu cầu giữ lại). Trả về cùng tham chiếu nếu không có gì để xóa. */
export const purgeExpiredEvidence = (s: AppState, now: number): AppState => {
  const keep = s.evidence.filter((e) => now - Date.parse(e.uploadedAt) < EVIDENCE_KEEP_DAYS * DAY_MS);
  return keep.length === s.evidence.length ? s : { ...s, evidence: keep };
};

const staffTargets = (s: AppState, h: Pick<RoleHandover, "clubId" | "role" | "fromId" | "proxy">): { staff: string[]; vice: string[] } => ({
  staff: staffIds(s),
  vice: proxyViceApproves(s, h.clubId, h.role)
    ? s.memberships.filter((m) => m.clubId === h.clubId && m.role === "vice" && m.invite === "accepted" && m.personId !== h.fromId && m.personId !== h.proxy?.requesterId).map((m) => m.personId)
    : [],
});

/** Gửi yêu cầu bàn giao hộ: chờ mentor (hoặc phó chủ nhiệm) duyệt bằng chứng. Ảnh được gắn vào yêu cầu. Người giữ vai CHƯA được báo (chỉ báo sau khi bằng chứng được duyệt). */
export const requestProxyRoleHandover = (
  h: Pick<RoleHandover, "id" | "clubId" | "role" | "department" | "fromId" | "toId" | "reason"> & { requesterId: string; contacts: ContactAttempt[] }, at: string,
): Update => (s) => {
  const { requesterId, contacts, ...rest } = h;
  const base: RoleHandover = {
    ...rest, status: "requested", step: 1, requestedAt: at, transferred: [], proxy: { requesterId, contacts },
    history: [{ at, by: requesterId, text: `gửi yêu cầu bàn giao hộ vai ${roleHandoverLabel(rest)} từ ${personName(s, rest.fromId)} sang ${personName(s, rest.toId)} (${contacts.length} lần liên hệ, ${contacts.reduce((n, c) => n + c.evidenceIds.length, 0)} ảnh): ${rest.reason}` }],
  };
  const ids = new Set(contacts.flatMap((c) => c.evidenceIds));
  let next: AppState = { ...s, roleHandovers: [...s.roleHandovers, base], evidence: s.evidence.map((e) => (ids.has(e.id) ? { ...e, handoverId: rest.id } : e)) };
  const t = staffTargets(next, base);
  const body = `${personName(s, requesterId)} xin bàn giao hộ vai ${roleHandoverLabel(rest)} của ${clubName(s, rest.clubId)} vì không liên lạc được với ${personName(s, rest.fromId)}. Xem nhật ký liên hệ và ảnh bằng chứng rồi duyệt hoặc từ chối.`;
  next = notify(next, t.staff, { kind: "role-handover-request", title: "Có yêu cầu bàn giao hộ chờ duyệt bằng chứng", at, href: `/school/clubs/${rest.clubId}`, body });
  return notify(next, t.vice, { kind: "role-handover-request", title: "Có yêu cầu bàn giao hộ chờ duyệt bằng chứng", at, href: `/clubs/${rest.clubId}/handover/roles`, body });
};

/** Người duyệt (mentor hoặc phó chủ nhiệm) duyệt bằng chứng hoặc từ chối (kèm lý do). Duyệt thì mới báo người giữ vai, toàn ban và bắt đầu đếm 3 ngày. */
export const decideProxyRoleHandover = (id: string, approve: boolean, reason: string | undefined, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  if (!h?.proxy) return s;
  const label = roleHandoverLabel(h);
  if (!approve) {
    const out = touchRole(s, id, { status: "rejected", decidedAt: at, decidedBy: by, rejectReason: reason }, { by, at, text: `${personName(s, by)} từ chối bằng chứng bàn giao hộ vai ${label}: ${reason ?? ""}` });
    return notify(out, [h.proxy.requesterId], { kind: "role-handover-decision", title: "Bằng chứng bàn giao hộ bị từ chối", at, href: `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, by)} chưa duyệt bằng chứng bàn giao hộ vai ${label}. Lý do: ${reason ?? ""}. Bạn bổ sung rồi gửi yêu cầu mới.` });
  }
  const waitUntil = nowIso(Date.parse(at) + PROXY_WAIT_DAYS * DAY_MS);
  let out = touchRole(s, id, { status: "waiting", decidedAt: at, decidedBy: by, proxy: { ...h.proxy, approverId: by, waitUntil } }, { by, at, text: `${personName(s, by)} duyệt bằng chứng; báo ${personName(s, h.fromId)} và bắt đầu chờ ${PROXY_WAIT_DAYS} ngày (đến ${dmy(waitUntil)})` });
  const board = s.memberships.filter((m) => m.clubId === h.clubId && m.role !== "member" && m.invite === "accepted").map((m) => m.personId);
  out = notify(out, [h.fromId], {
    kind: "role-handover-proxy", title: "Có yêu cầu bàn giao vai của bạn", at, href: `/clubs/${h.clubId}/handover/roles`,
    body: `Ban điều hành xin bàn giao hộ vai ${label} của ${clubName(s, h.clubId)} sang ${personName(s, h.toId)} vì chưa liên lạc được với bạn. Nếu bạn vẫn đảm nhận, bấm "Tôi vẫn đảm nhận" trước ${dmy(waitUntil)}; im lặng thì việc bàn giao sẽ được làm tiếp.`,
  });
  return notify(out, board.filter((p) => p !== h.fromId), { kind: "role-handover-proxy", title: "Bàn giao hộ đã được duyệt bằng chứng", at, href: `/clubs/${h.clubId}/handover/roles`, body: `Vai ${label} sẽ được bàn giao hộ sau ${PROXY_WAIT_DAYS} ngày chờ (đến ${dmy(waitUntil)}) nếu ${personName(s, h.fromId)} không phản hồi.` });
};

/** Người giữ vai bấm "Tôi vẫn đảm nhận" trong thời gian chờ: yêu cầu hủy, người gửi không gửi lại cùng vai trong 7 ngày. */
export const keepRoleHandover = (id: string, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  if (!h?.proxy) return s;
  const out = touchRole(s, id, { status: "kept", proxy: { ...h.proxy, keptAt: at } }, { by, at, text: `${personName(s, by)} bấm "Tôi vẫn đảm nhận": hủy bàn giao hộ vai ${roleHandoverLabel(h)}` });
  const who = [h.proxy.requesterId, ...(h.proxy.approverId ? [h.proxy.approverId] : [])];
  return notify(out, who, { kind: "role-handover-decision", title: "Người giữ vai vẫn đảm nhận", at, href: `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, by)} đã bấm "Tôi vẫn đảm nhận" vai ${roleHandoverLabel(h)}. Yêu cầu bàn giao hộ bị hủy; ${PROXY_RETRY_DAYS} ngày tới không gửi lại cùng vai được.` });
};

/** Hết 3 ngày chờ mà người giữ vai không phản hồi: bàn giao đi tiếp (người gửi làm bước 2 đến 5). */
export const startProxyRoleHandover = (id: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  if (!h) return s;
  const out = touchRole(s, id, { status: "active", step: roleHandoverNextStep(h, 1) }, { by: h.proxy?.requesterId ?? h.fromId, at, text: `hết ${PROXY_WAIT_DAYS} ngày chờ, ${personName(s, h.fromId)} không phản hồi: bắt đầu bàn giao hộ` });
  const who = h.role === "president" ? staffIds(s) : h.proxy ? [h.proxy.requesterId] : [];
  return notify(out, who, { kind: "role-handover-decision", title: "Hết thời gian chờ, làm tiếp bàn giao hộ", at, href: h.role === "president" ? `/school/clubs/${h.clubId}` : `/clubs/${h.clubId}/handover/roles`, body: `${personName(s, h.fromId)} không phản hồi trong ${PROXY_WAIT_DAYS} ngày. Làm tiếp bàn giao hộ vai ${roleHandoverLabel(h)}.` });
};

/**
 * Vai chủ nhiệm: chỉ mentor quyết và thực hiện. Mentor thực hiện các bước 3 và 5 thay: chuyển quyền quản trị mọi tài khoản trong kho mà người giữ vai đang giữ
 * cho người nhận, sang bước 6 để người nhận xác nhận.
 */
export const executeProxyRoleHandover = (id: string, by: string, at: string): Update => (s) => {
  const h = s.roleHandovers.find((x) => x.id === id);
  if (!h) return s;
  let out = touchRole(s, id, { proxy: h.proxy ? { ...h.proxy, executedBy: by } : h.proxy }, { by, at, text: `${personName(s, by)} (mentor) thực hiện bàn giao hộ thay ${personName(s, h.fromId)}` });
  out = reviewRoleHandoverKit(id, by, at)(out);
  for (const a of roleHandoverHolding(out, h).accounts) out = transferRoleHandoverAccount(id, a.id, by, at)(out);
  return finishRoleHandoverTransfer(id, by, at)(out);
};
