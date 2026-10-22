// Các thao tác làm thay đổi dữ liệu. Mỗi hàm nhận tham số và trả về một hàm (state cũ) => state mới.
// Mã và thời điểm được tạo ở nơi gọi, để các hàm này thuần (chạy lại hai lần vẫn ra cùng kết quả).
// Khi có backend, mỗi hàm ở đây ứng với một lời gọi API.

import { classify, type MemberRef } from "./reconcile.ts";
import { money } from "./format.ts";
import { balance, kitSummary, MENTOR_THRESHOLD, openCollections, personName } from "./selectors.ts";
import { TASK_STATUS_LABEL, type AppState, type BudgetItem, type Club, type ClubEvent, type ClubTask, type Collection, type ExpenseRequest, type Handover, type KitAccount, type KitDocument, type KitProcess, type NewBoard, type Payment, type Person, type Role, type Statement, type StatementTxn, type TaskStatus } from "./types.ts";

export type Update = (s: AppState) => AppState;

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

export const finishHandoverTransfer = (clubId: string, by: string, at: string): Update => stepTo(clubId, 6, by, at, "chuyển xong quyền quản trị các tài khoản bắt buộc");

/** Bước 6: chủ nhiệm mới xác nhận đã nhận. Sau đó biên bản không sửa được. */
export const acceptHandover = (clubId: string, by: string, at: string): Update =>
  stepTo(clubId, 7, by, at, (s) => `${personName(s, by)} xác nhận đã nhận bàn giao`, () => ({ acceptedAt: at, acceptedBy: by }));

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
    memberships: [...s.memberships, { clubId: c.id, personId, code: "A001", department: "Ban chủ nhiệm", role: "president", invite: "accepted" }],
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

/** Đổi vai trò và ban. Đổi chủ nhiệm không làm ở đây (làm khi bàn giao). */
export const updateMember = (clubId: string, personId: string, change: { role: Role; department: string }): Update => (s) => ({
  ...s,
  memberships: s.memberships.map((m) => (m.clubId === clubId && m.personId === personId ? { ...m, role: change.role, department: change.department } : m)),
});

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
