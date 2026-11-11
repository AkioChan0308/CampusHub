// Bàn giao MỘT vai và bàn giao hộ (09/11/2026; mô tả: docs/mo-ta-ban-giao-theo-vai.md, mục 2 và 4).
// Tự bàn giao: người giữ vai gửi đơn lên chủ nhiệm; chủ nhiệm duyệt hoặc từ chối (ghi lý do); duyệt xong người giao làm các bước 2 đến 5; người nhận xác nhận ở bước 6.
// Bàn giao hộ: chủ nhiệm (vai chủ nhiệm: ban điều hành khác) gửi yêu cầu kèm nhật ký liên hệ và ảnh; mentor (hoặc phó chủ nhiệm) duyệt bằng chứng; người giữ vai có 3 ngày để bấm
// "Tôi vẫn đảm nhận"; hết hạn thì người gửi làm tiếp các bước (vai chủ nhiệm: mentor làm thay).
// Cán bộ trường (mentor) không phải thành viên CLB nhưng gọi được các API này để duyệt, thực hiện và xem ảnh của yêu cầu bàn giao hộ.

import { findClub, requireMember } from "../access.ts";
import {
  acceptRoleHandover, acceptRoleHandoverBlock, addEvidence, cancelRoleHandover, decideProxyRoleHandover, decideRoleHandover, EVIDENCE_MAX_BYTES, EVIDENCE_MAX_FILES,
  executeProxyRoleHandover, finishRoleHandoverTransfer, findDepartment, keepRoleHandover, lockRoleHandoverBalance, nowIso, proxyRequestBlock, proxyViceApproves,
  purgeExpiredEvidence, requestProxyRoleHandover, requestRoleHandover, reviewRoleHandoverKit, roleHandoverActor, roleHandoverHolding, roleHandoverOpen, roleHandoverRequestBlock,
  roleHolder, saveRoleHandoverAccount, startProxyRoleHandover, transferRoleHandoverAccount, uid, type AppState, type Person, type RoleHandover, type Update,
} from "../domain.ts";
import { conflict, forbidden, invalid, notFound } from "../errors.ts";
import { advanceRoleHandoverBody, createRoleHandoverBody, decideRoleHandoverBody, parseBody, uploadEvidenceBody } from "../schemas.ts";
import { roleHandoversRes } from "../responses.ts";
import type { Handlers } from "./types.ts";

/** Phần của ctx mà các hàm dùng chung bên dưới cần (mọi API của file này đều có). */
interface Lite { readonly me: Person; readonly state: AppState; params: { clubId: string }; now(): number; update(fn: Update): AppState }

type Keys = "listRoleHandovers" | "createRoleHandover" | "decideRoleHandover" | "cancelRoleHandover" | "advanceRoleHandover" | "keepRoleHandover" | "executeRoleHandover" | "uploadEvidence" | "getEvidence" | "deleteEvidence";

function findRoleHandover(s: AppState, clubId: string, id: string): RoleHandover {
  const h = s.roleHandovers.find((x) => x.id === id && x.clubId === clubId);
  if (!h) throw notFound("Không tìm thấy đơn bàn giao này.");
  return h;
}

/** Thành viên đã nhận lời mời, hoặc cán bộ trường (chỉ đụng được tới đơn bàn giao hộ). */
function viewerOf(ctx: Lite) {
  if (ctx.me.kind === "staff") return { club: findClub(ctx.state, ctx.params.clubId), ms: undefined, staff: true as const };
  const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
  return { club, ms, staff: false as const };
}

/**
 * Việc dọn theo thời gian, làm mỗi lần có người gọi (chưa có tác vụ chạy nền): xóa ảnh quá 30 ngày; yêu cầu bàn giao hộ hết 3 ngày chờ thì sang bước làm.
 * Chỉ ghi khi có gì để đổi.
 */
function tick(ctx: Lite): void {
  const now = ctx.now();
  const due = ctx.state.roleHandovers.filter((h) => h.status === "waiting" && h.proxy?.waitUntil && now >= Date.parse(h.proxy.waitUntil)).map((h) => h.id);
  if (purgeExpiredEvidence(ctx.state, now) === ctx.state && due.length === 0) return;
  ctx.update((s) => due.reduce((acc, id) => startProxyRoleHandover(id, nowIso(now))(acc), purgeExpiredEvidence(s, now)));
}

/** Đầu mọi API bàn giao một vai: kiểm người gọi rồi làm việc dọn theo thời gian. */
function enter(ctx: Lite) {
  const v = viewerOf(ctx);
  tick(ctx);
  return v;
}

/** Giải mã base64 bằng atob (có cả ở Node và trình duyệt: bản demo chạy máy chủ ngay trong trình duyệt, không có Buffer). */
function decodeBase64(b64: string): Uint8Array {
  let bin: string;
  try { bin = atob(b64); } catch { throw invalid("Nội dung ảnh không hợp lệ."); }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** JPG hoặc PNG thật (đọc vài byte đầu), không chỉ tin vào loại file mà trình duyệt báo. */
const MAGIC: Record<string, number[]> = { "image/png": [0x89, 0x50, 0x4e, 0x47], "image/jpeg": [0xff, 0xd8, 0xff] };

export const roleHandlers: Pick<Handlers, Keys> = {
  listRoleHandovers: (ctx) => {
    const { club } = enter(ctx);
    return roleHandoversRes(ctx.state, club, ctx.me);
  },

  createRoleHandover: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    tick(ctx);
    const body = parseBody(createRoleHandoverBody, ctx.body);
    const reason = body.reason.replace(/\s+/g, " ");
    const department = body.role === "head" ? findDepartment(ctx.state, club.id, body.department ?? "")?.name : undefined;
    if (body.proxy) {
      const contacts = body.proxy.contacts.map((c) => ({ ...c, result: c.result.replace(/\s+/g, " ") }));
      const blocked = proxyRequestBlock(ctx.state, club.id, ctx.me.id, ctx.now(), { role: body.role, department, toId: body.toId, contacts });
      if (blocked) throw invalid(blocked);
      const holder = roleHolder(ctx.state, club.id, body.role, department)!;
      const s = ctx.update(requestProxyRoleHandover({ id: uid("bh"), clubId: club.id, role: body.role, department, fromId: holder, toId: body.toId, reason, requesterId: ctx.me.id, contacts }, ctx.nowIso()));
      return roleHandoversRes(s, club, ctx.me);
    }
    const blocked = roleHandoverRequestBlock(ctx.state, club.id, ctx.me.id, body);
    if (blocked) throw invalid(blocked);
    const s = ctx.update(requestRoleHandover({ id: uid("bg"), clubId: club.id, role: body.role, department, fromId: ctx.me.id, toId: body.toId, reason }, ctx.nowIso()));
    return roleHandoversRes(s, club, ctx.me);
  },

  /**
   * Tự bàn giao: chỉ chủ nhiệm duyệt. Bàn giao hộ: mentor duyệt bằng chứng; CLB chưa có mentor thì phó chủ nhiệm duyệt (trừ vai thủ quỹ và chủ nhiệm).
   * Từ chối phải có lý do. Bàn giao hộ được duyệt thì mới báo người giữ vai và bắt đầu đếm 3 ngày.
   */
  decideRoleHandover: (ctx) => {
    const { club, ms, staff } = enter(ctx);
    const h = findRoleHandover(ctx.state, club.id, ctx.params.handoverId);
    if (h.status !== "requested") throw conflict("Đơn này đã được xử lý.");
    const body = parseBody(decideRoleHandoverBody, ctx.body);
    const reason = body.reason?.replace(/\s+/g, " ");
    if (h.proxy) {
      const viceOk = !staff && ms?.role === "vice" && proxyViceApproves(ctx.state, club.id, h.role) && ctx.me.id !== h.fromId && ctx.me.id !== h.proxy.requesterId;
      if (!staff && !viceOk) throw forbidden("Mentor (hoặc phó chủ nhiệm khi CLB chưa có mentor) duyệt bằng chứng bàn giao hộ.");
    } else {
      if (staff || ms?.role !== "president") throw forbidden("Chỉ chủ nhiệm duyệt đơn bàn giao.");
    }
    if (body.approve) {
      const stale = acceptRoleHandoverBlock(ctx.state, h);
      if (stale) throw conflict(stale);
    }
    const s = ctx.update(h.proxy ? decideProxyRoleHandover(h.id, body.approve, reason, ctx.me.id, ctx.nowIso()) : decideRoleHandover(h.id, body.approve, reason, ctx.me.id, ctx.nowIso()));
    return roleHandoversRes(s, club, ctx.me);
  },

  /** Tự bàn giao: người giao hoặc chủ nhiệm hủy. Bàn giao hộ: người gửi hủy (chủ nhiệm hủy được trừ vai chủ nhiệm); người giữ vai dùng "Tôi vẫn đảm nhận". */
  cancelRoleHandover: (ctx) => {
    const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    tick(ctx);
    const h = findRoleHandover(ctx.state, club.id, ctx.params.handoverId);
    const allowed = h.proxy ? h.proxy.requesterId === ctx.me.id || (ms.role === "president" && h.role !== "president") : h.fromId === ctx.me.id || ms.role === "president";
    if (!allowed) throw forbidden(h.proxy ? "Chỉ người gửi yêu cầu hủy được. Người giữ vai bấm \"Tôi vẫn đảm nhận\"." : "Chỉ người giao hoặc chủ nhiệm hủy được đơn này.");
    if (!roleHandoverOpen(h)) throw conflict("Đơn này đã xong hoặc đã đóng, không hủy được nữa.");
    const s = ctx.update(cancelRoleHandover(h.id, ctx.me.id, ctx.nowIso()));
    return roleHandoversRes(s, club, ctx.me);
  },

  /** Người giữ vai bấm "Tôi vẫn đảm nhận" trong 3 ngày chờ: yêu cầu bàn giao hộ bị hủy. */
  keepRoleHandover: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    tick(ctx);
    const h = findRoleHandover(ctx.state, club.id, ctx.params.handoverId);
    if (!h.proxy) throw conflict("Đây không phải đơn bàn giao hộ.");
    if (h.fromId !== ctx.me.id) throw forbidden("Chỉ người đang giữ vai bấm được.");
    if (h.status !== "waiting") throw conflict(h.status === "active" ? "Đã hết thời gian chờ, việc bàn giao đã đi tiếp." : "Yêu cầu này không còn trong thời gian chờ.");
    const s = ctx.update(keepRoleHandover(h.id, ctx.me.id, ctx.nowIso()));
    return roleHandoversRes(s, club, ctx.me);
  },

  /** Vai chủ nhiệm: chỉ mentor thực hiện bàn giao hộ (chuyển quyền quản trị các tài khoản người giữ vai đang giữ). */
  executeRoleHandover: (ctx) => {
    const { club, staff } = enter(ctx);
    if (!staff) throw forbidden("Chỉ mentor thực hiện bàn giao hộ vai chủ nhiệm.");
    const h = findRoleHandover(ctx.state, club.id, ctx.params.handoverId);
    if (!h.proxy || h.role !== "president") throw conflict("Chỉ bàn giao hộ vai chủ nhiệm do mentor thực hiện.");
    if (h.status !== "active" || h.step < 2 || h.step > 5) throw conflict(h.status === "waiting" ? "Chưa hết thời gian chờ của người giữ vai." : "Đơn không ở bước thực hiện.");
    const s = ctx.update(executeProxyRoleHandover(h.id, ctx.me.id, ctx.nowIso()));
    return roleHandoversRes(s, club, ctx.me);
  },

  advanceRoleHandover: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    tick(ctx);
    const h = findRoleHandover(ctx.state, club.id, ctx.params.handoverId);
    if (h.fromId !== ctx.me.id && h.toId !== ctx.me.id && h.proxy?.requesterId !== ctx.me.id) throw forbidden("Đơn này không có tên bạn.");
    if (h.status !== "active") throw conflict(h.status === "requested" ? "Đơn chưa được duyệt." : h.status === "waiting" ? "Chưa hết thời gian chờ của người giữ vai." : "Đơn này đã xong hoặc đã đóng.");
    const body = parseBody(advanceRoleHandoverBody, ctx.body);
    const at = ctx.nowIso();
    const atStep = (step: number, message: string) => { if (h.step !== step) throw conflict(message); };
    const giver = () => {
      if (h.proxy && h.role === "president") throw forbidden("Bàn giao hộ vai chủ nhiệm do mentor thực hiện.");
      if (roleHandoverActor(h) !== ctx.me.id) throw forbidden(h.proxy ? "Chỉ người gửi yêu cầu làm được bước này." : "Chỉ người đang giữ vai làm được bước này.");
    };
    switch (body.action) {
      case "lockBalance":
        giver(); atStep(2, "Đơn đang không ở bước chốt số dư.");
        return roleHandoversRes(ctx.update(lockRoleHandoverBalance(h.id, ctx.me.id, at)), club, ctx.me);
      case "reviewKit":
        giver(); atStep(3, "Đơn đang không ở bước kiểm tra phần đang giữ.");
        return roleHandoversRes(ctx.update(reviewRoleHandoverKit(h.id, ctx.me.id, at, body.note?.replace(/[ \t]+/g, " "))), club, ctx.me);
      case "setReceiver":
        giver(); atStep(4, "Đơn đang không ở bước đổi tài khoản nhận quỹ.");
        return roleHandoversRes(ctx.update(saveRoleHandoverAccount(h.id, { personId: h.toId, bank: body.bank, account: body.account }, body.transferRef ?? "", ctx.me.id, at)), club, ctx.me);
      case "transferAccount": {
        giver(); atStep(5, "Đơn đang không ở bước chuyển quyền quản trị.");
        if (!roleHandoverHolding(ctx.state, h).accounts.some((a) => a.id === body.accountId)) throw notFound("Tài khoản này không do người giao đang giữ.");
        return roleHandoversRes(ctx.update(transferRoleHandoverAccount(h.id, body.accountId, ctx.me.id, at)), club, ctx.me);
      }
      case "finishTransfer": {
        giver(); atStep(5, "Đơn đang không ở bước chuyển quyền quản trị.");
        const left = roleHandoverHolding(ctx.state, h).accounts.filter((a) => a.required && !h.transferred.includes(a.id));
        if (left.length) throw conflict(`Còn ${left.length} tài khoản bắt buộc chưa chuyển: ${left.map((a) => a.service).join(", ")}.`);
        return roleHandoversRes(ctx.update(finishRoleHandoverTransfer(h.id, ctx.me.id, at)), club, ctx.me);
      }
      case "accept": {
        atStep(6, "Đơn đang không ở bước người nhận xác nhận.");
        if (h.toId !== ctx.me.id) throw forbidden("Chỉ người nhận mới xác nhận đã nhận bàn giao.");
        const stale = acceptRoleHandoverBlock(ctx.state, h);
        if (stale) throw conflict(stale);
        return roleHandoversRes(ctx.update(acceptRoleHandover(h.id, ctx.me.id, at)), club, ctx.me);
      }
    }
  },

  /** Tải một ảnh bằng chứng (JPG hoặc PNG, tối đa 5 MB). Ảnh chưa gắn vào yêu cầu nào thì cũng bị xóa sau 30 ngày. */
  uploadEvidence: (ctx) => {
    const { club, ms } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    if (ms.role === "member") throw forbidden("Chỉ ban điều hành tải ảnh bằng chứng.");
    tick(ctx);
    const body = parseBody(uploadEvidenceBody, ctx.body);
    const b64 = body.dataBase64.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw invalid("Nội dung ảnh không hợp lệ.");
    const bytes = decodeBase64(b64);
    if (bytes.length === 0) throw invalid("Ảnh trống.");
    if (bytes.length > EVIDENCE_MAX_BYTES) throw invalid(`Ảnh tối đa ${EVIDENCE_MAX_BYTES / 1024 / 1024} MB.`);
    if (!MAGIC[body.mime].every((x, i) => bytes[i] === x)) throw invalid("File không phải ảnh JPG hoặc PNG thật.");
    if (ctx.state.evidence.filter((e) => e.uploaderId === ctx.me.id && e.clubId === club.id && !e.handoverId).length >= EVIDENCE_MAX_FILES) {
      throw invalid(`Bạn đang có ${EVIDENCE_MAX_FILES} ảnh chưa gắn vào yêu cầu nào. Gửi yêu cầu hoặc chờ ảnh tự xóa sau 30 ngày.`);
    }
    const id = uid("anh");
    ctx.update(addEvidence({ id, clubId: club.id, uploaderId: ctx.me.id, name: body.name.replace(/[\\/]/g, "_"), mime: body.mime, size: bytes.length, uploadedAt: ctx.nowIso(), data: b64 }));
    return { id, name: body.name, size: bytes.length };
  },

  /** Chỉ người đã tải ảnh lên và cán bộ trường (ảnh đã gắn vào một yêu cầu bàn giao hộ) xem được. Người khác, kể cả người giữ vai: không thấy (404). */
  getEvidence: (ctx) => {
    const { club, ms, staff } = enter(ctx);
    const f = ctx.state.evidence.find((e) => e.id === ctx.params.evidenceId && e.clubId === club.id);
    // Người duyệt thay mentor: phó chủ nhiệm khi CLB chưa có mentor (không phải người gửi, không phải người giữ vai), khi đơn còn chờ duyệt hoặc đang chờ 3 ngày.
    const h = f?.handoverId ? ctx.state.roleHandovers.find((x) => x.id === f.handoverId) : undefined;
    const viceOk = !staff && ms?.role === "vice" && !!h?.proxy && (h.status === "requested" || h.status === "waiting")
      && proxyViceApproves(ctx.state, club.id, h.role) && ctx.me.id !== h.fromId && ctx.me.id !== h.proxy.requesterId;
    if (!f || (staff ? !f.handoverId : f.uploaderId !== ctx.me.id && !viceOk)) throw notFound("Không tìm thấy ảnh này.");
    return { mime: f.mime, dataBase64: f.data };
  },

  /** Gỡ một ảnh đã tải lên mà chưa gắn vào yêu cầu nào (chụp nhầm, ảnh nhạy cảm). Ảnh đã gắn vào yêu cầu thì không gỡ được: chỉ chờ xóa sau 30 ngày. */
  deleteEvidence: (ctx) => {
    const { club } = requireMember(ctx.state, ctx.params.clubId, ctx.me);
    tick(ctx);
    const f = ctx.state.evidence.find((e) => e.id === ctx.params.evidenceId && e.clubId === club.id && e.uploaderId === ctx.me.id);
    if (!f) throw notFound("Không tìm thấy ảnh này.");
    if (f.handoverId) throw conflict("Ảnh đã gắn vào một yêu cầu bàn giao hộ nên không gỡ được. Ảnh tự xóa sau 30 ngày.");
    ctx.update((s) => ({ ...s, evidence: s.evidence.filter((e) => e.id !== f.id) }));
    return { ok: true as const };
  },
};
