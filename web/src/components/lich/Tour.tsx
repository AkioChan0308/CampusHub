"use client";

// Hướng dẫn cho ban điều hành (Hiệu chọn 29/10/2026): lớp tối phủ màn, khung sáng ôm phần tử cần chỉ, một tờ giấy chú thích đứng cạnh.
// Đi qua từng tab của CLB và từng mục trong tab: bước nào có trang thì tự chuyển sang trang đó, có nút cần bấm thì bấm trước (ví dụ chuyển tab của kho).
// Các bước, cách nêu phần tử cần chỉ và chỗ lưu "đã xem" ở lib/tour.ts; trạng thái đang chạy ở lib/tour-store.ts (sống qua các lần chuyển trang).
// TourHost nằm trong layout của /clubs/[clubId], nên không bị dựng lại khi đổi trang. Phần tử chưa có (trang đang tải) thì chờ tới 5 giây rồi bỏ bước.
// Khung sáng là mặt nạ SVG (không dùng bóng đổ); khung và tờ chú thích trượt sang bước kế trong 220 ms, tắt khi máy bật giảm chuyển động.
// Bàn phím: Esc thoát, Tab chạy vòng trong tờ chú thích, tiêu điểm trả về chỗ cũ khi đóng. Lớp phủ chặn bấm nhầm vào màn phía sau.

import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useMe } from "@/api/queries";
import { groupPosition, hasSeenTour, markTourSeen, nextGroupStart, pageOf, stepsFor, type TourStep, type TourStorage } from "@/lib/tour";
import { getTour, goTour, startTour, stopTour, subscribeTour } from "@/lib/tour-store";

const PAD = 6; // khung sáng rộng hơn phần tử mỗi phía
const GAP = 16; // khoảng giữa khung sáng và tờ chú thích
const EDGE = 12; // cách mép màn tối thiểu
const BOX_W = 320;
const WAIT_MS = 5000;

interface Box { x: number; y: number; w: number; h: number }

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, Math.max(lo, hi)));
const same = (a: Box | null, b: Box) => !!a && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

const storage = (): TourStorage | undefined => {
  try { return window.localStorage; } catch { return undefined; }
};

/** Phần tử đang hiện, không nằm trong khung xương (đang tải). */
const usable = (el: HTMLElement) => el.getClientRects().length > 0 && !el.closest("[aria-busy='true']");

/** Tìm phần tử theo cách nêu ở lib/tour.ts (TourStep). */
function resolve(spec: string): HTMLElement | null {
  const main = ".l-main";
  let el: HTMLElement | null = null;
  if (spec.startsWith("css:")) {
    el = [...document.querySelectorAll<HTMLElement>(spec.slice(4))].find(usable) ?? null;
  } else if (spec.startsWith("h:")) {
    const text = spec.slice(2);
    const h = [...document.querySelectorAll<HTMLElement>(`${main} h1, ${main} h2, ${main} h3`)].find((x) => (x.textContent ?? "").trim().startsWith(text) && usable(x));
    el = h ? h.closest<HTMLElement>(".l-sec, .l-panel, section") ?? h : null;
  } else if (spec.startsWith("b:")) {
    const text = spec.slice(2);
    const all = [...document.querySelectorAll<HTMLElement>(`${main} a, ${main} button`)].filter(usable);
    const label = (x: HTMLElement) => (x.textContent ?? "").trim();
    el = all.find((x) => label(x) === text) ?? all.find((x) => label(x).startsWith(text)) ?? null;
  } else {
    el = document.querySelector<HTMLElement>(`[data-tour="${spec}"]`);
  }
  return el && usable(el) ? el : null;
}

async function until<T>(find: () => T | null, ms: number): Promise<T | null> {
  const end = Date.now() + ms;
  for (;;) {
    const v = find();
    if (v || Date.now() > end) return v;
    await sleep(100);
  }
}

/** Nằm trong hướng dẫn của layout /clubs/[clubId]: tự mở lần đầu cho ban điều hành, mở lại bằng startTour (menu avatar). */
export function TourHost() {
  const { clubId } = useParams<{ clubId: string }>();
  const me = useMe();
  const pathname = usePathname();
  const { open, index } = useSyncExternalStore(subscribeTour, getTour, getTour);
  const personId = me.data?.person.id;
  const role = me.data?.memberships.find((m) => m.clubId === clubId && m.invite === "accepted")?.role;
  const steps = useMemo(() => stepsFor(role), [role]);

  // Chủ nhiệm mới (vai thành viên) không tự mở: họ chỉ có hai trang, hướng dẫn xem được từ menu avatar.
  useEffect(() => {
    if (personId && role && role !== "member" && !hasSeenTour(storage(), personId)) startTour();
  }, [personId, role]);

  const close = useCallback(() => { stopTour(); if (personId) markTourSeen(storage(), personId); }, [personId]);
  if (!open || steps.length === 0) return null;
  return <TourRun steps={steps} index={Math.min(index, steps.length - 1)} base={`/clubs/${clubId}`} pathname={pathname} onClose={close} />;
}

function TourRun({ steps, index, base, pathname, onClose }: { steps: TourStep[]; index: number; base: string; pathname: string; onClose: () => void }) {
  const router = useRouter();
  const step = steps[index];
  const page = pageOf(steps, index);
  const [hole, setHole] = useState<Box | null>(null);
  const [boxH, setBoxH] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const dir = useRef(1);
  const navigated = useRef(new Set<number>());

  const measure = useCallback(() => {
    const el = resolve(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    // Phần tử cao hơn màn thì khung sáng chỉ ôm phần đang thấy.
    const x = Math.max(r.left - PAD, 4), y = Math.max(r.top - PAD, 4);
    const next = { x, y, w: Math.min(r.right + PAD, vw - 4) - x, h: Math.min(r.bottom + PAD, vh - 4) - y };
    setHole((prev) => (same(prev, next) ? prev : next));
  }, [step]);

  const go = (to: number) => {
    dir.current = to >= index ? 1 : -1;
    if (to < 0 || to >= steps.length) onClose();
    else goTour(to);
  };

  useEffect(() => {
    let cancelled = false;
    let watch: MutationObserver | undefined;
    setHole(null);
    const desired = base + page;
    if (pathname !== desired && !navigated.current.has(index)) {
      navigated.current.add(index); // một lần thôi: trang như "Đợt thu" tự chuyển tiếp sang trang khác
      router.push(desired);
      return;
    }
    void (async () => {
      if (step.click) {
        const button = await until(() => resolve(step.click!), WAIT_MS);
        if (cancelled) return;
        button?.click();
        await sleep(120);
      }
      const el = await until(() => resolve(step.target), WAIT_MS);
      if (cancelled) return;
      if (!el) { go(index + dir.current); return; }
      el.scrollIntoView({ block: "center", inline: "nearest" });
      measure();
      const main = document.querySelector(".l-main");
      if (main) { watch = new MutationObserver(() => requestAnimationFrame(measure)); watch.observe(main, { childList: true, subtree: true, attributes: true }); }
    })();
    return () => { cancelled = true; watch?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go đổi theo mỗi lần vẽ nhưng chỉ dùng index và steps đã có trong danh sách phụ thuộc
  }, [index, pathname, step, base, page, router, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [measure]);

  useLayoutEffect(() => {
    const h = boxRef.current?.offsetHeight ?? 0;
    if (h !== boxH) setBoxH(h);
  });

  // Tiêu điểm vào nút chính ở mỗi bước (hơi trễ để menu avatar đang đóng lại nhả tiêu điểm trước); đóng thì trả về chỗ đứng trước đó.
  useEffect(() => {
    const t = setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [index, hole === null]);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => { if (before && document.contains(before)) before.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !boxRef.current) return;
      const items = [...boxRef.current.querySelectorAll<HTMLElement>("button")];
      if (items.length === 0) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!boxRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pos = groupPosition(steps, index);
  const nextGroup = nextGroupStart(steps, index);
  const last = index === steps.length - 1;

  // Chỗ đứng của tờ chú thích: bên phải khung sáng, không đủ thì xuống dưới, sang trái, lên trên, cuối cùng là góc phải dưới của màn.
  let left = 0, top = 0;
  if (hole) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const right = hole.x + hole.w + GAP;
    if (right + BOX_W <= vw - EDGE) { left = right; top = clamp(hole.y, EDGE, vh - boxH - EDGE); }
    else if (hole.y + hole.h + GAP + boxH <= vh - EDGE) { left = clamp(hole.x, EDGE, vw - BOX_W - EDGE); top = hole.y + hole.h + GAP; }
    else if (hole.x - GAP - BOX_W >= EDGE) { left = hole.x - GAP - BOX_W; top = clamp(hole.y, EDGE, vh - boxH - EDGE); }
    else if (hole.y - GAP - boxH >= EDGE) { left = clamp(hole.x, EDGE, vw - BOX_W - EDGE); top = hole.y - GAP - boxH; }
    else { left = vw - BOX_W - EDGE; top = vh - boxH - EDGE; }
  }
  const geometry = hole && { x: `${hole.x}px`, y: `${hole.y}px`, width: `${hole.w}px`, height: `${hole.h}px` };

  return createPortal(
    <div className="l-tour">
      <svg className="l-tour-veil" aria-hidden="true">
        <defs>
          <mask id="l-tour-mask">
            <rect width="100%" height="100%" fill="#FFFFFF" />
            {hole && <rect className="l-tour-hole" x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="8" style={geometry!} fill="#000000" />}
          </mask>
        </defs>
        <rect className="l-tour-shade" width="100%" height="100%" mask="url(#l-tour-mask)" />
        {hole && <rect className="l-tour-ring" x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx="8" style={geometry!} />}
      </svg>
      {hole && (
        <div ref={boxRef} className="l-tour-box" role="dialog" aria-modal="true" aria-labelledby="l-tour-title" aria-describedby="l-tour-text" tabIndex={-1} style={{ left, top }}>
          <div className="l-tour-count">{pos.group} · {pos.n}/{pos.total}</div>
          <h2 id="l-tour-title">{step.title}</h2>
          <p id="l-tour-text">{step.text}</p>
          {index === 0 && <p className="l-tour-note">Hướng dẫn đi qua từng mục. Bạn thoát lúc nào cũng được và xem lại được từ avatar.</p>}
          <div className="l-tour-actions">
            <span className="l-tour-links">
              {!last && <button type="button" className="l-linkbtn" onClick={onClose}>Thoát</button>}
              {nextGroup > 0 && <button type="button" className="l-linkbtn" onClick={() => go(nextGroup)}>Bỏ qua phần này</button>}
            </span>
            {index > 0 && <button type="button" className="l-btn2 l-sm" onClick={() => go(index - 1)}>Trước</button>}
            <button ref={nextRef} type="button" className="l-btn l-sm" onClick={() => (last ? onClose() : go(index + 1))}>{last ? "Xong" : "Tiếp theo"}</button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
