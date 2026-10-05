"use client";

// Video demo trên trang đầu: quay từ bản demo bằng e2e/quay-video.cjs (giờ bắt đầu từng bước ở video-buoc.json).
// Tự chạy không tiếng khi cuộn tới, lặp lại, cuộn qua thì dừng cho đỡ tốn pin. Máy bật giảm chuyển động thì đứng yên,
// bấm "Phát video" mới chạy. Danh sách bước cho thấy video đang ở bước nào; bấm một bước thì nhảy tới bước đó.

import { useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import timing from "./video-buoc.json";

export type DemoStep = { key: string; title: string; text: string };

/** Khối trượt bao xa (px) khi vào và khi ra. */
const SHIFT = 72;

/**
 * Một khối của trang đầu đi theo vị trí cuộn, như framer.com (Hiệu yêu cầu): cuộn xuống thì khối tiếp theo trượt từ bên
 * trái vào và rõ dần, khối đã xem trượt sang phải và mờ đi. Theo vị trí cuộn, không theo thời gian.
 * - Vào: mép trên của khối đi từ đáy màn hình lên tới 70% chiều cao màn hình. Khối nằm sẵn trong màn hình lúc mở trang thì rõ ngay.
 * - Ra: mép dưới của khối đi từ 35% chiều cao màn hình lên tới đỉnh, nên phần đang đọc chưa mờ.
 * - small: khối thấp nằm gần cuối trang (mép trên có thể không lên tới 70%): rõ hẳn khi cả khối đã vào màn hình.
 * Máy bật giảm chuyển động thì đứng yên.
 */
export function ScrollFade({ className, labelledBy, small = false, children }: { className: string; labelledBy?: string; small?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const enter = useScroll({ target: ref, offset: small ? ["start end", "end end"] : ["start end", "start 0.7"] }).scrollYProgress;
  const leave = useScroll({ target: ref, offset: ["end 0.35", "end start"] }).scrollYProgress;
  const x = useTransform([enter, leave], ([e, l]: number[]) => (e - 1) * SHIFT + l * SHIFT);
  const opacity = useTransform([enter, leave], ([e, l]: number[]) => e * (1 - l));
  return <m.section ref={ref} className={className} aria-labelledby={labelledBy} style={reduce ? undefined : { x, opacity }}>{children}</m.section>;
}
type Name = keyof typeof timing;

export function DemoVideo({ name, device, label, steps, layout }: {
  name: Name;
  device: "phone" | "laptop";
  /** Mô tả video cho trình đọc màn hình. */
  label: string;
  steps: DemoStep[];
  /** "side": danh sách bước nằm cạnh video (điện thoại). "below": các bước thành một hàng dưới video (laptop). */
  layout: "side" | "below";
}) {
  // Theo dõi khung thiết bị (khung bao ngoài có thể là display: contents, không có kích thước).
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(frame, { amount: 0.35 });
  const reduce = useReducedMotion();
  // null: người xem chưa bấm gì. Khi đó máy giảm chuyển động thì coi như đang dừng, còn lại tự chạy.
  const [choice, setChoice] = useState<"play" | "pause" | null>(null);
  const paused = choice ? choice === "pause" : !!reduce;
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // Trình duyệt chặn tự chạy thì hiện nút phát. Lỗi khác (lệnh dừng cắt ngang khi cuộn nhanh qua) thì bỏ qua.
    if (inView && !paused) v.play().catch((e: unknown) => { if (e instanceof DOMException && e.name === "NotAllowedError") setChoice("pause"); });
    else v.pause();
  }, [inView, paused]);

  const starts = steps.map((s) => (timing[name].steps as Record<string, number>)[s.key] ?? 0);
  let active = 0;
  starts.forEach((t, i) => { if (time >= t) active = i; });
  const end = starts[active + 1] ?? timing[name].duration;
  const progress = Math.min(1, Math.max(0, (time - starts[active]) / Math.max(0.1, end - starts[active])));

  function jump(i: number) {
    const v = video.current;
    if (!v) return;
    v.currentTime = starts[i] + 0.01;
    setTime(starts[i]);
    setChoice("play");
  }

  const list = (
    <ol className="l-vsteps">
      {steps.map((s, i) => (
        <li key={s.key} className="l-vstep">
          <button type="button" onClick={() => jump(i)} aria-current={i === active ? "step" : undefined}>
            <span className="l-vstep-n" aria-hidden="true">{i + 1}</span>
            <span className="l-vstep-t">{s.title}</span>
            <span className="l-vstep-d">{s.text}</span>
            <span className="l-sr">Bấm để xem đoạn này trong video.</span>
          </button>
          {/* Thanh tiến độ của bước đang chạy; key đổi theo bước để thanh mới bắt đầu từ 0, không chạy lùi. */}
          {i === active && <span key={`${active}`} className="l-vstep-bar" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></span>}
        </li>
      ))}
    </ol>
  );

  return (
    <div className={`l-vid-play ${layout}`}>
      <div ref={frame} className={`l-device ${device}`}>
        <video
          ref={video}
          className="l-device-video"
          src={`/video/${name}.mp4`}
          poster={`/video/${name}.jpg`}
          muted
          playsInline
          loop
          preload="metadata"
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        />
        {paused && !playing && time < 0.05 ? (
          <button type="button" className="l-btn l-device-start" onClick={() => setChoice("play")}>
            <Icon name="play" size={18} />Phát video
          </button>
        ) : (
          <button type="button" className="l-device-toggle" onClick={() => setChoice(playing ? "pause" : "play")} aria-label={playing ? "Dừng video" : "Phát video"}>
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
        )}
      </div>
      {list}
    </div>
  );
}
