// Trạng thái đang chạy của hướng dẫn: mở hay đóng, đang ở bước nào. Nằm ngoài React để sống qua các lần chuyển trang
// (hướng dẫn đi qua nhiều trang của CLB; mỗi trang dựng lại khung riêng). Không dùng API của trình duyệt.

export interface TourState {
  open: boolean;
  index: number;
}

let state: TourState = { open: false, index: 0 };
const listeners = new Set<() => void>();
const set = (next: TourState) => { state = next; listeners.forEach((l) => l()); };

export const getTour = () => state;
export const subscribeTour = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const startTour = () => set({ open: true, index: 0 });
export const goTour = (index: number) => { if (state.open) set({ open: true, index }); };
export const stopTour = () => set({ open: false, index: 0 });
