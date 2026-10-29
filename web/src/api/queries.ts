"use client";

// Các truy vấn API dùng chung giữa nhiều màn. Khóa lưu tạm (queryKey) đặt ở đây để màn nào sửa dữ liệu cũng làm mới đúng chỗ.
// Mọi khóa của một CLB bắt đầu bằng ["clubs", clubId], nên sửa gì trong CLB thì làm mới cả CLB một lần (useClubMutation).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AiStatusRes, ApplicationsRes, BoardRes, BudgetRes, ClubRes, ClubsRes, CollectionRes, CollectionsRes, DashboardRes, EventsRes, EventDetailRes, ExpensesRes, HandoverRes, HealthRes, InviteRes,
  ClubPostsRes, FeedRes, KitRes, LedgerRes, MeRes, MembersRes, MyAttendanceRes, MyClubRes, MyPaymentRes, MyTasksRes, PostRes, QrRes, ReconciliationRes, SchoolClubRes, SchoolClubsRes, SchoolPostsRes, TasksRes,
} from "@contract";
import { ApiError, apiGet } from "./client";

export const keys = {
  health: ["health"] as const,
  me: ["me"] as const,
  club: (clubId: string) => ["clubs", clubId] as const,
  board: (clubId: string) => ["clubs", clubId, "board"] as const,
  dashboard: (clubId: string) => ["clubs", clubId, "dashboard"] as const,
  collection: (clubId: string, collectionId: string) => ["clubs", clubId, "collections", collectionId] as const,
  reconciliation: (clubId: string, collectionId: string) => ["clubs", clubId, "collections", collectionId, "reconciliation"] as const,
  expenses: (clubId: string) => ["clubs", clubId, "expenses"] as const,
  budget: (clubId: string) => ["clubs", clubId, "budget"] as const,
  members: (clubId: string) => ["clubs", clubId, "members"] as const,
  events: (clubId: string) => ["clubs", clubId, "events"] as const,
  collections: (clubId: string) => ["clubs", clubId, "collections"] as const,
  applications: (clubId: string) => ["clubs", clubId, "applications"] as const,
  event: (clubId: string, eventId: string) => ["clubs", clubId, "events", eventId] as const,
  eventQr: (clubId: string, eventId: string) => ["clubs", clubId, "events", eventId, "qr"] as const,
  handover: (clubId: string) => ["clubs", clubId, "handover"] as const,
  kit: (clubId: string) => ["clubs", clubId, "handover-kit"] as const,
  ai: (clubId: string) => ["clubs", clubId, "ai"] as const,
  tasks: (clubId: string) => ["clubs", clubId, "tasks"] as const,
  feed: ["feed"] as const,
  post: (postId: string) => ["feed", "post", postId] as const,
  clubPosts: (clubId: string) => ["clubs", clubId, "posts"] as const,
  schoolPosts: ["school", "posts"] as const,
  myTasks: ["me", "tasks"] as const,
  ledger: (clubId: string) => ["clubs", clubId, "ledger"] as const,
  myPayment: (collectionId: string) => ["me", "collections", collectionId] as const,
  myClub: (clubId: string) => ["me", "clubs", clubId] as const,
  myAttendance: (clubId: string) => ["me", "clubs", clubId, "attendance"] as const,
  // Sinh viên tìm CLB: danh sách và trang một CLB cùng đầu khóa, gửi đơn xong làm mới cả hai.
  explore: ["explore"] as const,
  exploreClub: (clubId: string) => ["explore", clubId] as const,
  invite: (code: string) => ["invites", code] as const,
  // Nhà trường: danh sách và chi tiết cùng đầu khóa, mentor duyệt xong làm mới cả hai (số đếm trên menu nằm ở danh sách).
  school: ["school"] as const,
  schoolClub: (clubId: string) => ["school", clubId] as const,
};

/** Chế độ đăng nhập của máy chủ: "demo" thì còn trang chọn vai, "google" thì chỉ đăng nhập Google. */
export const useHealth = () => useQuery({ queryKey: keys.health, queryFn: () => apiGet<HealthRes>("/health"), staleTime: Infinity });
export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => apiGet<MeRes>("/me") });
export const useBoardQuery = (clubId: string) => useQuery({ queryKey: keys.board(clubId), queryFn: () => apiGet<BoardRes>(`/clubs/${clubId}/board`) });
export const useDashboard = (clubId: string) => useQuery({ queryKey: keys.dashboard(clubId), queryFn: () => apiGet<DashboardRes>(`/clubs/${clubId}/dashboard`) });
export const useMyPayment = (collectionId: string) => useQuery({ queryKey: keys.myPayment(collectionId), queryFn: () => apiGet<MyPaymentRes>(`/me/collections/${collectionId}`) });

/** collectionId trống (CLB chưa có đợt thu): không gọi. */
export const useCollection = (clubId: string, collectionId: string | undefined) => useQuery({
  queryKey: keys.collection(clubId, collectionId ?? ""), enabled: !!collectionId,
  queryFn: () => apiGet<CollectionRes>(`/clubs/${clubId}/collections/${collectionId}`),
});
export const useReconciliation = (clubId: string, collectionId: string | undefined) => useQuery({
  queryKey: keys.reconciliation(clubId, collectionId ?? ""), enabled: !!collectionId,
  queryFn: () => apiGet<ReconciliationRes>(`/clubs/${clubId}/collections/${collectionId}/reconciliation`),
});
export const useExpenses = (clubId: string) => useQuery({ queryKey: keys.expenses(clubId), queryFn: () => apiGet<ExpensesRes>(`/clubs/${clubId}/expenses`) });
export const useBudget = (clubId: string) => useQuery({ queryKey: keys.budget(clubId), queryFn: () => apiGet<BudgetRes>(`/clubs/${clubId}/budget`) });

export const useMembers = (clubId: string) => useQuery({ queryKey: keys.members(clubId), queryFn: () => apiGet<MembersRes>(`/clubs/${clubId}/members`) });
export const useApplications = (clubId: string) => useQuery({ queryKey: keys.applications(clubId), queryFn: () => apiGet<ApplicationsRes>(`/clubs/${clubId}/applications`) });
export const useEvents = (clubId: string) => useQuery({ queryKey: keys.events(clubId), queryFn: () => apiGet<EventsRes>(`/clubs/${clubId}/events`) });
export const useCollections = (clubId: string) => useQuery({ queryKey: keys.collections(clubId), queryFn: () => apiGet<CollectionsRes>(`/clubs/${clubId}/collections`) });
export const useHandover = (clubId: string) => useQuery({ queryKey: keys.handover(clubId), queryFn: () => apiGet<HandoverRes>(`/clubs/${clubId}/handover`) });
/** Cộng đồng: mọi tin đã duyệt, cộng tin chưa duyệt của chính mình (hiện mờ). Mọi khóa tin nằm dưới ["feed"] nên đăng hay duyệt tin thì làm mới một lần. */
export const useFeed = () => useQuery({ queryKey: keys.feed, queryFn: () => apiGet<FeedRes>("/feed") });
export const usePost = (postId: string) => useQuery({ queryKey: keys.post(postId), queryFn: () => apiGet<PostRes>(`/posts/${postId}`), retry: false });
export const useClubPosts = (clubId: string) => useQuery({ queryKey: keys.clubPosts(clubId), queryFn: () => apiGet<ClubPostsRes>(`/clubs/${clubId}/posts`) });
export const useSchoolPosts = () => useQuery({ queryKey: keys.schoolPosts, queryFn: () => apiGet<SchoolPostsRes>("/school/posts") });
export const useTasks = (clubId: string) => useQuery({ queryKey: keys.tasks(clubId), queryFn: () => apiGet<TasksRes>(`/clubs/${clubId}/tasks`) });
export const useMyTasks = () => useQuery({ queryKey: keys.myTasks, queryFn: () => apiGet<MyTasksRes>("/me/tasks") });
export const useAiStatus = (clubId: string) => useQuery({ queryKey: keys.ai(clubId), queryFn: () => apiGet<AiStatusRes>(`/clubs/${clubId}/ai`) });
export const useKit = (clubId: string) => useQuery({ queryKey: keys.kit(clubId), queryFn: () => apiGet<KitRes>(`/clubs/${clubId}/handover-kit`) });
export const ledgerQuery = (clubId: string) => ({ queryKey: keys.ledger(clubId), queryFn: () => apiGet<LedgerRes>(`/clubs/${clubId}/ledger`) });
export const membersQuery = (clubId: string) => ({ queryKey: keys.members(clubId), queryFn: () => apiGet<MembersRes>(`/clubs/${clubId}/members`) });
export const budgetQuery = (clubId: string) => ({ queryKey: keys.budget(clubId), queryFn: () => apiGet<BudgetRes>(`/clubs/${clubId}/budget`) });

/** Một buổi và danh sách điểm danh. live: đang chiếu QR, tải lại mỗi 3 giây để thấy người vừa quét. */
export const useEvent = (clubId: string, eventId: string, live: boolean) => useQuery({
  queryKey: keys.event(clubId, eventId), queryFn: () => apiGet<EventDetailRes>(`/clubs/${clubId}/events/${eventId}`),
  refetchInterval: live ? 3000 : false, refetchIntervalInBackground: true,
});

/** Mã QR đang chiếu. Tự lấy mã mới ngay sau `refreshAt` (máy chủ đổi mã mỗi 30 giây). */
export const useEventQr = (clubId: string, eventId: string, enabled: boolean) => useQuery({
  queryKey: keys.eventQr(clubId, eventId), enabled, staleTime: 0,
  queryFn: () => apiGet<QrRes>(`/clubs/${clubId}/events/${eventId}/qr`),
  refetchInterval: (q) => (q.state.data ? Math.max(500, Date.parse(q.state.data.refreshAt) - Date.now() + 250) : false),
  refetchIntervalInBackground: true,
});

/** CLB của thành viên (mã, đợt thu đang mở) và lịch sử điểm danh. clubId trống thì chưa gọi. */
export const useMyClub = (clubId: string | undefined) => useQuery({ queryKey: keys.myClub(clubId ?? ""), enabled: !!clubId, queryFn: () => apiGet<MyClubRes>(`/me/clubs/${clubId}`) });
export const useMyAttendance = (clubId: string | undefined) => useQuery({ queryKey: keys.myAttendance(clubId ?? ""), enabled: !!clubId, queryFn: () => apiGet<MyAttendanceRes>(`/me/clubs/${clubId}/attendance`) });

export const useClubs = () => useQuery({ queryKey: keys.explore, queryFn: () => apiGet<ClubsRes>("/clubs") });
export const useClubCard = (clubId: string) => useQuery({ queryKey: keys.exploreClub(clubId), queryFn: () => apiGet<ClubRes>(`/clubs/${clubId}`) });
export const useInvite = (code: string) => useQuery({ queryKey: keys.invite(code), queryFn: () => apiGet<InviteRes>(`/invites/${code}`) });
export const useSchoolClubs = () => useQuery({ queryKey: keys.school, queryFn: () => apiGet<SchoolClubsRes>("/school/clubs") });
export const useSchoolClub = (clubId: string) => useQuery({ queryKey: keys.schoolClub(clubId), queryFn: () => apiGet<SchoolClubRes>(`/school/clubs/${clubId}`) });

/** Câu lỗi để hiện cho người dùng: câu của máy chủ, hoặc câu chung khi mất mạng hay lỗi lạ. */
export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Chưa làm được. Thử lại sau.");

/**
 * Gửi một thay đổi trong CLB lên máy chủ. Xong thì làm mới mọi số của CLB (đếm trên menu, trang chủ, sổ quỹ…) rồi mới gọi onSuccess,
 * nên nút còn vòng xoay cho tới khi màn đã có số mới. Lỗi thì hiện câu của máy chủ bằng thông báo ngắn, trừ khi màn tự xử lý (onError).
 */
export function useClubMutation<TVars, TRes>(clubId: string, fn: (vars: TVars) => Promise<TRes>, opts: {
  onSuccess?: (res: TRes, vars: TVars) => void;
  onError?: (error: unknown, vars: TVars) => void;
} = {}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (res, vars) => {
      await client.invalidateQueries({ queryKey: keys.club(clubId) });
      opts.onSuccess?.(res, vars);
    },
    onError: (e, vars) => {
      // 409: dữ liệu trên màn đã cũ (ví dụ người khác vừa ghi tiền cho người này): tải lại để màn hiện trạng thái mới.
      if (e instanceof ApiError && e.status === 409) void client.invalidateQueries({ queryKey: keys.club(clubId) });
      if (opts.onError) opts.onError(e, vars); else toast.error(errorText(e));
    },
  });
}
