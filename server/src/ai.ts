// Trợ lý cho bàn giao (22/10/2026; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.5).
// Hai việc, cả hai gắn với bàn giao: tóm tắt cho ban mới, và hỏi đáp trong Kho bàn giao. KHÔNG phải chatbot chung.
//
// Giao diện `Assistant` dùng chung cho bản mẫu và bản thật (AI_MODE=mock|real), để sau này chỉ thay phần bên trong.
// Bản mẫu (mặc định) TÍNH từ dữ liệu của CLB, không dán sẵn câu trả lời: đếm việc quá hạn, mục thiếu, tài khoản chưa chuyển;
// hỏi đáp thì tìm từ khóa trong nội dung kho và trả về mục khớp nhất, luôn kèm mục nguồn.
// Bản thật (AI_MODE=real) gọi Gemini, viết ở ai-real.ts; gọi lỗi thì lùi về bản mẫu và kết quả ghi mode "mock".

import { createGeminiAssistant } from "./ai-real.ts";
import type { Config } from "./config.ts";
import {
  dm, kitSummary, KIT_CATEGORY_LABEL, membershipOf, openTasks, personName, toAsciiUpper, upcomingEvents,
  type AppState, type Club,
} from "./domain.ts";

export type AiMode = "mock" | "real";

/** mode là chế độ của lần trả lời này: bản thật lùi về bản mẫu khi gọi lỗi nên có thể khác AI_MODE. */
export interface AiSummary {
  mode: AiMode;
  text: string;
  bullets: string[];
}

export interface AiSource {
  kind: "document" | "process" | "account";
  id: string;
  name: string;
}

export interface AiAnswer {
  mode: AiMode;
  found: boolean;
  answer: string;
  sources: AiSource[];
}

export interface Assistant {
  readonly mode: AiMode;
  /** Bản nháp tóm tắt cho ban mới. Không lưu gì, không gửi cho ai. */
  summarize(s: AppState, club: Club, now: number): Promise<AiSummary>;
  /** Trả lời chỉ từ nội dung Kho bàn giao mà người hỏi được thấy. includeAccounts: chỉ ban điều hành (bản thật không gửi phần tài khoản). */
  ask(s: AppState, club: Club, question: string, includeAccounts: boolean): Promise<AiAnswer>;
}

/** Phần tính toán của bản mẫu, chạy ngay không cần chờ. */
interface MockCore {
  summarize(s: AppState, club: Club, now: number): Omit<AiSummary, "mode">;
  ask(s: AppState, club: Club, question: string, includeAccounts: boolean): Omit<AiAnswer, "mode">;
}

const DAY = 86_400_000;
const MAX_SOURCES = 3;

/** Câu hỏi về tiền hay dữ liệu cá nhân: trợ lý không trả lời, kể cả khi trong kho có chữ trùng. */
const OFF_LIMITS = /\b(SO DU|SO QUY|SAO KE|BAO NHIEU TIEN|DONG QUY|CHI TIEU|KHOAN CHI|MAT KHAU|PASSWORD|SO DIEN THOAI|SDT|DANH SACH THANH VIEN)\b/;
const OFF_LIMITS_ANSWER = "Trợ lý chỉ trả lời về kho bàn giao (biểu mẫu, quy trình, tài khoản). Không trả lời về tiền, sổ quỹ, mật khẩu hay dữ liệu cá nhân của thành viên.";
const NOT_FOUND_ANSWER = "Không tìm thấy trong kho bàn giao.";

/** Từ hay gặp trong câu hỏi mà không giúp tìm: bỏ đi trước khi so với nội dung kho. */
const STOP = new Set(["LA", "O", "DAU", "AI", "GIU", "CUA", "VA", "THE", "NAO", "NHU", "CO", "KHONG", "GI", "CHO", "TOI", "MINH", "EM", "BAN", "DUOC", "CAN", "LAM", "SAO", "NHUNG", "CAC", "MOT", "TREN", "TRONG", "VOI", "DE", "RA", "HAY"]);

const words = (text: string) => toAsciiUpper(text).split(/[^A-Z0-9]+/).filter(Boolean);

/** Từ trong câu hỏi khớp một từ của mục: bằng nhau, hoặc (từ dài từ 4 chữ) là phần đầu của từ trong mục ("phep" khớp "phep", "ho so" không khớp bậy). */
const hits = (query: string[], haystack: Set<string>) => query.filter((q) => haystack.has(q) || (q.length >= 4 && [...haystack].some((w) => w.startsWith(q)))).length;

interface Item extends AiSource {
  haystack: Set<string>;
  line: string;
}

function itemsOf(s: AppState, club: Club, includeAccounts: boolean): Item[] {
  const items: Item[] = [];
  for (const d of s.kitDocuments.filter((x) => x.clubId === club.id)) {
    items.push({
      kind: "document", id: d.id, name: d.name, haystack: new Set(words(`${d.name} ${KIT_CATEGORY_LABEL[d.category]} ${personName(s, d.holderId)}`)),
      line: `Biểu mẫu "${d.name}" (${KIT_CATEGORY_LABEL[d.category].toLowerCase()}). Người giữ: ${personName(s, d.holderId)}. Link: ${d.link}.`,
    });
  }
  for (const p of s.kitProcesses.filter((x) => x.clubId === club.id)) {
    const docs = p.documentIds.map((id) => s.kitDocuments.find((d) => d.id === id)?.name).filter(Boolean) as string[];
    items.push({
      kind: "process", id: p.id, name: p.name, haystack: new Set(words(`${p.name} ${p.steps.map((t) => `${t.text} ${t.who}`).join(" ")} ${docs.join(" ")}`)),
      line: `Quy trình "${p.name}": ${p.steps.map((t, i) => `${i + 1}) ${t.text}${t.who ? ` (${t.who})` : ""}`).join("; ")}.${p.leadDays !== undefined ? ` Thường phải xong trước ${p.leadDays} ngày.` : ""}${docs.length ? ` Biểu mẫu đi kèm: ${docs.join(", ")}.` : ""}`,
    });
  }
  if (includeAccounts) {
    for (const a of s.kitAccounts.filter((x) => x.clubId === club.id)) {
      const holder = a.holderId ? personName(s, a.holderId) : undefined;
      items.push({
        kind: "account", id: a.id, name: a.service, haystack: new Set(words(`${a.service} ${a.label} ${holder ?? ""}`)),
        line: `${a.service}: ${a.label}. ${holder ? `Người giữ quyền quản trị: ${holder}.` : "Chưa có người giữ quyền quản trị."}${a.ownership === "personal" ? " Đang đứng tên cá nhân." : ""}`,
      });
    }
  }
  return items;
}

const mockCore: MockCore = {
  summarize(s, club, now) {
    const open = openTasks(s, club.id);
    const late = open.filter((t) => Date.parse(t.due) < now);
    const k = kitSummary(s, club.id);
    const accounts = s.kitAccounts.filter((a) => a.clubId === club.id);
    const handover = s.handovers.find((h) => h.clubId === club.id);
    const bullets: string[] = [];

    bullets.push(open.length === 0 ? "Không còn việc dở." : `Việc còn dở: ${open.length} việc chưa xong, ${late.length} quá hạn. ${open.slice(0, 3).map((t) => `${t.title} (${personName(s, t.assigneeId)}, hạn ${dm(t.due)})`).join("; ")}${open.length > 3 ? "…" : ""}.`);

    const soonTasks = open.filter((t) => Date.parse(t.due) >= now && Date.parse(t.due) <= now + 14 * DAY);
    const soonEvents = upcomingEvents(s, club.id).filter((e) => Date.parse(e.start) <= now + 14 * DAY && Date.parse(e.start) >= now);
    const soon = [...soonTasks.map((t) => `${t.title} (hạn ${dm(t.due)})`), ...soonEvents.map((e) => `${e.title} (${dm(e.start)})`)];
    bullets.push(soon.length ? `Hạn trong 14 ngày tới: ${soon.join("; ")}.` : "Chưa có hạn nào trong 14 ngày tới.");

    const missing = accounts.filter((a) => a.required && !a.holderId).map((a) => a.service);
    bullets.push(`Kho bàn giao có ${k.documents} biểu mẫu, ${k.processes} quy trình, ${k.accounts} tài khoản.${missing.length ? ` Còn thiếu người giữ quyền quản trị: ${missing.join(", ")}.` : " Không thiếu mục nào."}`);

    const personal = accounts.filter((a) => a.ownership === "personal").map((a) => a.service);
    if (personal.length) bullets.push(`Đang đứng tên cá nhân, nên chuyển sang tài khoản CLB: ${personal.join(", ")}.`);

    if (handover) {
      const left = accounts.filter((a) => a.required && !handover.transferred.includes(a.id)).map((a) => a.service);
      bullets.push(left.length ? `Tài khoản bắt buộc chưa chuyển quyền quản trị: ${left.join(", ")}.` : "Mọi tài khoản bắt buộc đã chuyển quyền quản trị.");
    }

    const president = s.memberships.find((m) => m.clubId === club.id && m.role === "president");
    const treasurer = s.memberships.find((m) => m.clubId === club.id && m.role === "treasurer");
    const who = [president && `chủ nhiệm ${personName(s, president.personId)}`, treasurer && `thủ quỹ ${personName(s, treasurer.personId)}`].filter(Boolean);
    if (who.length) bullets.push(`Hỏi lại nếu có thắc mắc: ${who.join(", ")}.`);

    return { bullets, text: [`Bàn giao ${club.name}: tóm tắt cho ban mới (bản mẫu, tính từ dữ liệu của CLB).`, ...bullets.map((b, i) => `${i + 1}. ${b}`)].join("\n") };
  },

  ask(s, club, question, includeAccounts) {
    if (OFF_LIMITS.test(toAsciiUpper(question))) return { found: false, answer: OFF_LIMITS_ANSWER, sources: [] };
    const query = [...new Set(words(question).filter((w) => !STOP.has(w)))];
    if (query.length === 0) return { found: false, answer: NOT_FOUND_ANSWER, sources: [] };
    const need = Math.ceil(query.length / 2);
    const ranked = itemsOf(s, club, includeAccounts)
      .map((item) => ({ item, score: hits(query, item.haystack) }))
      .filter((x) => x.score >= need)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SOURCES);
    if (ranked.length === 0) return { found: false, answer: NOT_FOUND_ANSWER, sources: [] };
    return {
      found: true,
      answer: ranked.map((x) => x.item.line).join("\n"),
      sources: ranked.map((x) => ({ kind: x.item.kind, id: x.item.id, name: x.item.name })),
    };
  },
};

const mockAssistant: Assistant = {
  mode: "mock",
  summarize: async (s, club, now) => ({ ...mockCore.summarize(s, club, now), mode: "mock" }),
  ask: async (s, club, question, includeAccounts) => ({ ...mockCore.ask(s, club, question, includeAccounts), mode: "mock" }),
};

export function createAssistant(config: Pick<Config, "aiMode" | "geminiApiKey" | "aiModel">): Assistant {
  if (config.aiMode !== "real") return mockAssistant;
  return createGeminiAssistant({
    apiKey: config.geminiApiKey, model: config.aiModel, fallback: mockAssistant,
    isOffLimits: (q) => OFF_LIMITS.test(toAsciiUpper(q)), notFound: NOT_FOUND_ANSWER,
  });
}

/** Người hỏi có phải ban điều hành (thấy cả phần tài khoản) không. */
export const asksAsBoard = (s: AppState, clubId: string, personId: string) => {
  const m = membershipOf(s, clubId, personId);
  return !!m && m.role !== "member";
};
