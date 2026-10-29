"use client";

// Khung quảng cáo MẪU (22/10/2026; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.10). Chỉ là chỗ trống có nhãn "Được tài trợ" với nội dung mẫu:
// chưa có nhãn hàng thật, chưa có trang cho nhãn hàng, chưa có giá. Nội dung giống nhau cho mọi người: không nhắm theo cá nhân, không đếm lượt xem hay bấm.
// Luật thiết kế: nằm trong dòng nội dung, nhỏ hơn nhiều so với 30% màn hình; không pop-up, không che nội dung, không phát tiếng, không nhấp nháy, không đếm ngược.
// Chỉ đặt ở bản miễn phí, không đặt ở màn tiền, màn đồng ý, lúc quét QR, bàn giao. "Ẩn quảng cáo này" ẩn khung trong phiên đang dùng.

import { useSyncExternalStore } from "react";

const KEY = "campushub-hide-sponsored";
const EVENT = "campushub-sponsored";

const subscribe = (notify: () => void) => { window.addEventListener(EVENT, notify); return () => window.removeEventListener(EVENT, notify); };
/** Đọc trước lần vẽ đầu của trình duyệt, nên người đã ẩn không thấy khung nháy rồi biến. Không đọc được thì khung cứ hiện. */
const hiddenNow = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };

export function SponsoredSlot() {
  const hidden = useSyncExternalStore(subscribe, hiddenNow, () => false);
  if (hidden) return null;
  return (
    <aside className="l-sponsor" aria-label="Quảng cáo mẫu">
      <div className="l-sponsor-top">
        <span className="l-sponsor-label">Được tài trợ</span>
        <button type="button" className="l-linkbtn" onClick={() => { try { sessionStorage.setItem(KEY, "1"); } catch { /* bỏ qua */ } window.dispatchEvent(new Event(EVENT)); }}>Ẩn quảng cáo này</button>
      </div>
      <strong>Chỗ đặt quảng cáo (ví dụ)</strong>
      <span className="l-note">Khung mẫu cho nhãn hàng sau này. Chưa có nhãn hàng thật; nội dung giống nhau cho mọi người.</span>
    </aside>
  );
}
