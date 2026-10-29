// Kho bàn giao (22/10/2026): biểu mẫu, quy trình, tài khoản và quyền truy cập của CLB. Bản vẽ chưa có; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.2.
// Đọc: mọi thành viên đã nhận lời mời, nhưng tài khoản chỉ ban điều hành thấy (responses.ts). Sửa: chủ nhiệm, phó chủ nhiệm, trưởng ban.
// Không lưu mật khẩu ở đâu cả.

import { requireBoard, requireMember, requireRight } from "../access.ts";
import {
  membershipOf, removeKitAccount, removeKitDocument, removeKitProcess, saveKitAccount, saveKitDocument, saveKitProcess, uid,
  type AppState,
} from "../domain.ts";
import { invalid, notFound } from "../errors.ts";
import { kitAccountBody, kitDocumentBody, kitProcessBody, parseBody } from "../schemas.ts";
import { kitAccountDto, kitDocumentDto, kitProcessDto, kitRes } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys =
  | "getKit" | "createKitDocument" | "updateKitDocument" | "deleteKitDocument"
  | "createKitProcess" | "updateKitProcess" | "deleteKitProcess"
  | "createKitAccount" | "updateKitAccount" | "deleteKitAccount";

/** Người giữ phải là thành viên của chính CLB này. */
function requireHolder(s: AppState, clubId: string, personId: string) {
  if (!membershipOf(s, clubId, personId)) throw invalid("Người giữ phải là thành viên của CLB.");
}

function findItem<T extends { id: string; clubId: string }>(list: T[], clubId: string, id: string, what: string): T {
  const item = list.find((x) => x.id === id && x.clubId === clubId);
  if (!item) throw notFound(`Không tìm thấy ${what}.`);
  return item;
}

/** Biểu mẫu đi kèm quy trình phải là biểu mẫu của chính CLB này. */
function requireDocuments(s: AppState, clubId: string, ids: string[]) {
  if (ids.some((id) => !s.kitDocuments.some((d) => d.id === id && d.clubId === clubId))) throw invalid("Biểu mẫu đi kèm phải nằm trong kho của CLB.");
}

export const kitHandlers: Pick<Handlers, Keys> = {
  getKit: (ctx) => {
    const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    return kitRes(ctx.state, club, ms.role !== "member");
  },

  createKitDocument: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const body = parseBody(kitDocumentBody, ctx.body);
    requireHolder(ctx.state, club.id, body.holderId);
    const id = uid("kit-doc");
    const s = ctx.update(saveKitDocument({ id, clubId: club.id, ...body, updatedAt: ctx.nowIso() }));
    return { document: kitDocumentDto(s, s.kitDocuments.find((d) => d.id === id)!) };
  },

  updateKitDocument: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const old = findItem(ctx.state.kitDocuments, club.id, ctx.params.itemId, "biểu mẫu");
    const body = parseBody(kitDocumentBody, ctx.body);
    requireHolder(ctx.state, club.id, body.holderId);
    const s = ctx.update(saveKitDocument({ ...old, ...body, updatedAt: ctx.nowIso() }));
    return { document: kitDocumentDto(s, s.kitDocuments.find((d) => d.id === old.id)!) };
  },

  deleteKitDocument: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const old = findItem(ctx.state.kitDocuments, club.id, ctx.params.itemId, "biểu mẫu");
    ctx.update(removeKitDocument(old.id));
    return { ok: true };
  },

  createKitProcess: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const body = parseBody(kitProcessBody, ctx.body);
    requireDocuments(ctx.state, club.id, body.documentIds);
    const id = uid("kit-proc");
    const s = ctx.update(saveKitProcess({ id, clubId: club.id, ...body, updatedAt: ctx.nowIso() }));
    return { process: kitProcessDto(s, s.kitProcesses.find((p) => p.id === id)!) };
  },

  updateKitProcess: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const old = findItem(ctx.state.kitProcesses, club.id, ctx.params.itemId, "quy trình");
    const body = parseBody(kitProcessBody, ctx.body);
    requireDocuments(ctx.state, club.id, body.documentIds);
    // Không gửi leadDays nghĩa là bỏ hạn thường gặp, nên không giữ giá trị cũ.
    const { leadDays: _old, ...rest } = old;
    const s = ctx.update(saveKitProcess({ ...rest, ...body, updatedAt: ctx.nowIso() }));
    return { process: kitProcessDto(s, s.kitProcesses.find((p) => p.id === old.id)!) };
  },

  deleteKitProcess: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const old = findItem(ctx.state.kitProcesses, club.id, ctx.params.itemId, "quy trình");
    ctx.update(removeKitProcess(old.id));
    return { ok: true };
  },

  createKitAccount: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const body = parseBody(kitAccountBody, ctx.body);
    if (body.holderId) requireHolder(ctx.state, club.id, body.holderId);
    const id = uid("kit-acc");
    const s = ctx.update(saveKitAccount({ id, clubId: club.id, ...body, updatedAt: ctx.nowIso() }));
    return { account: kitAccountDto(s, s.kitAccounts.find((a) => a.id === id)!) };
  },

  updateKitAccount: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const old = findItem(ctx.state.kitAccounts, club.id, ctx.params.itemId, "tài khoản");
    const body = parseBody(kitAccountBody, ctx.body);
    if (body.holderId) requireHolder(ctx.state, club.id, body.holderId);
    // Không gửi holderId nghĩa là chưa ai nhận, nên không giữ người giữ cũ.
    const { holderId: _old, ...rest } = old;
    const s = ctx.update(saveKitAccount({ ...rest, ...body, updatedAt: ctx.nowIso() }));
    return { account: kitAccountDto(s, s.kitAccounts.find((a) => a.id === old.id)!) };
  },

  deleteKitAccount: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "kit");
    const old = findItem(ctx.state.kitAccounts, club.id, ctx.params.itemId, "tài khoản");
    ctx.update(removeKitAccount(old.id));
    return { ok: true };
  },
};
