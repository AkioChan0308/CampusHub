// Tin của CLB trên Cộng đồng (29/10/2026, Hiệu chốt: duyệt trước, hiện sau; mô tả ở docs/mo-ta-bang-tin-chung.md).
// Ban điều hành có quyền đăng (chủ nhiệm, phó chủ nhiệm, trưởng ban) viết tin; tin luôn vào trạng thái chờ. Cán bộ trường duyệt hoặc từ chối (kèm lý do);
// chỉ tin đã duyệt hiện cho mọi người. Người đăng thấy tin chưa duyệt của mình (hiện mờ), ban điều hành CLB đó thấy ở Bảng tin của CLB.
// Chưa có: sửa tin bị từ chối rồi gửi lại, ẩn tin đã duyệt, ảnh đính kèm.

import { requireBoard, requireRight, requireStaff } from "../access.ts";
import { approvePost, canSeePost, createPost, feedFor, nowIso, pendingPosts, postsOf, rejectPost, resubmitPost, uid, type AppState, type ClubPost } from "../domain.ts";
import { conflict, notFound } from "../errors.ts";
import { parseBody, postBody, postReviewBody } from "../schemas.ts";
import { postDto } from "../responses.ts";
import type { Handlers } from "./types.ts";

type Keys = "listFeed" | "getPost" | "listClubPosts" | "createPost" | "resubmitPost" | "listSchoolPosts" | "reviewPost";

const RECENT_REVIEWED = 10;

/** Thời điểm gửi lên đổi về đúng dạng mọi thời điểm trong dữ liệu ("2026-10-10T07:30:00+07:00"). */
const at = (iso: string) => nowIso(Date.parse(iso));

function findPost(s: AppState, postId: string): ClubPost {
  const p = s.posts.find((x) => x.id === postId);
  if (!p) throw notFound("Không tìm thấy tin này.");
  return p;
}

export const postHandlers: Pick<Handlers, Keys> = {
  listFeed: (ctx) => ({ posts: feedFor(ctx.state, ctx.me.id).map((p) => postDto(ctx.state, p)) }),

  /** Tin chưa duyệt mà người xem không có quyền thì báo không tìm thấy, để không lộ là có tin đó. */
  getPost: (ctx) => {
    const p = findPost(ctx.state, ctx.params.postId);
    if (!canSeePost(ctx.state, p, ctx.me)) throw notFound("Không tìm thấy tin này.");
    return { post: postDto(ctx.state, p, p.createdBy === ctx.me.id || ctx.me.kind === "staff" || p.status !== "approved") };
  },

  listClubPosts: (ctx) => {
    const { club } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    return { posts: postsOf(ctx.state, club.id).map((p) => postDto(ctx.state, p, true)) };
  },

  createPost: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "post");
    const body = parseBody(postBody, ctx.body);
    const id = uid("tin");
    const s = ctx.update(createPost({
      id, clubId: club.id, kind: body.kind, title: body.title.replace(/\s+/g, " "), body: body.body,
      ...(body.eventAt ? { eventAt: at(body.eventAt) } : {}), ...(body.place ? { place: body.place.replace(/\s+/g, " ") } : {}),
      createdBy: ctx.me.id, createdAt: ctx.nowIso(),
    }));
    return { post: postDto(s, s.posts.find((p) => p.id === id)!, true) };
  },

  /** Sửa tin bị từ chối rồi gửi lại: người có quyền đăng của CLB đó; chỉ tin đang bị từ chối. Tin vào lại hàng chờ. */
  resubmitPost: (ctx) => {
    const { club, ms } = requireBoard(ctx.state, ctx.params.clubId, ctx.me);
    requireRight(ms, "post");
    const old = ctx.state.posts.find((p) => p.id === ctx.params.postId && p.clubId === club.id);
    if (!old) throw notFound("Không tìm thấy tin này.");
    if (old.status !== "rejected") throw conflict("Chỉ sửa và gửi lại được tin đang bị từ chối.");
    const body = parseBody(postBody, ctx.body);
    const s = ctx.update(resubmitPost(old.id, {
      kind: body.kind, title: body.title.replace(/\s+/g, " "), body: body.body,
      ...(body.eventAt ? { eventAt: at(body.eventAt) } : {}), ...(body.place ? { place: body.place.replace(/\s+/g, " ") } : {}),
    }, ctx.nowIso()));
    return { post: postDto(s, s.posts.find((p) => p.id === old.id)!, true) };
  },

  listSchoolPosts: (ctx) => {
    requireStaff(ctx.me);
    const s = ctx.state;
    const reviewed = s.posts.filter((p) => p.status !== "pending" && p.reviewedAt).sort((a, b) => b.reviewedAt!.localeCompare(a.reviewedAt!)).slice(0, RECENT_REVIEWED);
    return { pending: pendingPosts(s).map((p) => postDto(s, p, true)), reviewed: reviewed.map((p) => postDto(s, p, true)) };
  },

  reviewPost: (ctx) => {
    requireStaff(ctx.me);
    const p = findPost(ctx.state, ctx.params.postId);
    if (p.status !== "pending") throw conflict("Tin này đã được xem xét rồi.");
    const body = parseBody(postReviewBody, ctx.body);
    const s = ctx.update(body.decision === "approve" ? approvePost(p.id, ctx.me.id, ctx.nowIso()) : rejectPost(p.id, body.reason!, ctx.me.id, ctx.nowIso()));
    return { post: postDto(s, s.posts.find((x) => x.id === p.id)!, true) };
  },
};
