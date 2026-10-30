"use client";

// Khung quảng cáo MẪU (22/10/2026; mô tả ở docs/tien-do-mvp.md, phần B, mục 5.10). Chỉ là chỗ trống có nhãn "Được tài trợ" với nội dung mẫu:
// chưa có nhãn hàng thật, chưa có trang cho nhãn hàng, chưa có giá. Nội dung giống nhau cho mọi người: không nhắm theo cá nhân, không đếm lượt xem hay bấm.
// Luật thiết kế: nằm trong dòng nội dung, nhỏ hơn nhiều so với 30% màn hình; không pop-up, không che nội dung, không phát tiếng, không nhấp nháy, không đếm ngược.
// Chỉ đặt ở bản miễn phí, không đặt ở màn tiền, màn đồng ý, lúc quét QR, bàn giao. "Ẩn quảng cáo này" ẩn khung trong phiên đang dùng.
// Cộng đồng (Hiệu yêu cầu 30/10/2026, tham khảo AdMob native ads và MGID): hai kiểu, mỗi màn chỉ hiện một.
//   SponsoredSide: cột bên phải (laptop từ 1200px), dính theo khi cuộn, nằm ở chỗ đang trống nên không che gì.
//   SponsoredPost: một dòng xen trong danh sách tin (điện thoại và màn hẹp), sau tin thứ 4, cùng dáng dòng tin nhưng có nhãn và viền riêng.
// Cả hai dùng chung trạng thái "ẩn" với SponsoredSlot.

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { NOT_IN_MVP } from "./Gate";

const KEY = "campushub-hide-sponsored";
const EVENT = "campushub-sponsored";

const subscribe = (notify: () => void) => { window.addEventListener(EVENT, notify); return () => window.removeEventListener(EVENT, notify); };
/** Đọc trước lần vẽ đầu của trình duyệt, nên người đã ẩn không thấy khung nháy rồi biến. Không đọc được thì khung cứ hiện. */
const hiddenNow = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };

function useHidden() {
  return useSyncExternalStore(subscribe, hiddenNow, () => false);
}

function hide() {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* bỏ qua */ }
  window.dispatchEvent(new Event(EVENT));
}

/** Nội dung mẫu: chưa có nhãn hàng thật. Nút "Tìm hiểu thêm" chưa dẫn đi đâu, nên báo như các phần chưa làm. */
const SAMPLE = { title: "Chỗ đặt quảng cáo (ví dụ)", text: "Khung mẫu cho nhãn hàng sau này. Chưa có nhãn hàng thật; nội dung giống nhau cho mọi người." };

/** Cột bên của Cộng đồng trên laptop. */
export function SponsoredSide() {
  const hidden = useHidden();
  if (hidden) return null;
  return (
    <aside className="l-sponsor l-sponsor-side" aria-label="Quảng cáo mẫu">
      <div className="l-sponsor-top">
        <span className="l-sponsor-label">Được tài trợ</span>
        <button type="button" className="l-linkbtn" onClick={hide}>Ẩn quảng cáo này</button>
      </div>
      <div className="l-sponsor-art" aria-hidden="true">Hình mẫu</div>
      <strong>{SAMPLE.title}</strong>
      <span className="l-note">{SAMPLE.text}</span>
      <button type="button" className="l-btn2 l-sm" onClick={() => toast(NOT_IN_MVP)}>Tìm hiểu thêm</button>
    </aside>
  );
}

/** Một dòng xen trong danh sách tin của Cộng đồng (điện thoại và màn hẹp). */
export function SponsoredPost() {
  const hidden = useHidden();
  if (hidden) return null;
  return (
    <li className="l-post-ad">
      <aside className="l-sponsor l-sponsor-post" aria-label="Quảng cáo mẫu">
        <div className="l-sponsor-top">
          <span className="l-sponsor-label">Được tài trợ</span>
          <button type="button" className="l-linkbtn" onClick={hide}>Ẩn quảng cáo này</button>
        </div>
        <strong>{SAMPLE.title}</strong>
        <span className="l-note">{SAMPLE.text}</span>
        <button type="button" className="l-btn2 l-sm" onClick={() => toast(NOT_IN_MVP)}>Tìm hiểu thêm</button>
      </aside>
    </li>
  );
}

export function SponsoredSlot() {
  const hidden = useHidden();
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
