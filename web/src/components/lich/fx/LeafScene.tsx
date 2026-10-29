"use client";

// Cảnh 3D của trang đầu: một cuốn lịch 7 tờ, đúng câu "Cả tuần của CLB, trên một cuốn lịch".
// Cuộn xuống thì từng tờ bị xé, ngày chạy tiếp tới hết tuần (GSAP ScrollTrigger điều khiển theo vị trí cuộn).
// Luật Lịch bloc vẫn giữ: màu lấy từ biến --l-* của lich.css, vẽ phẳng, không đèn, không bóng đổ, không gradient;
// đỏ chỉ cho tờ hôm nay. Chỉ vẽ lại khi có cuộn, rê chuột hoặc đổi cỡ (không chạy vòng lặp), nên ngoài màn hình thì không tốn gì.
// Tải chậm (LeafStage) và chỉ tải khi máy cho phép; thiếu WebGL hoặc bật giảm chuyển động thì không tải gì.

import { useEffect, useRef } from "react";
import {
  BoxGeometry, CanvasTexture, CapsuleGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SRGBColorSpace,
  WebGLRenderer, type Texture,
} from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { dmy, weekday } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

const LEAVES = 7;
const W = 1.9;
const H = 2.2;
const THICK = 0.018;
/** Quãng cuộn (px) để xé hết các tờ. Ngắn, vì cuốn lịch nằm ở đầu trang và trôi lên khi cuộn. */
const SCROLL_RANGE = 240;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

type Palette = { paper: string; ink: string; ink3: string; rule: string; red: string; redInk: string };

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    paper: get("--l-paper", "#FFFFFF"), ink: get("--l-ink", "#16171C"), ink3: get("--l-ink-3", "#5B606C"),
    rule: get("--l-rule", "#D5D9E0"), red: get("--l-red", "#D0261C"), redInk: get("--l-red-ink", "#A51D15"),
  };
}

/** Mặt trước một tờ: vẽ như tờ lịch thật (dải tháng, số ngày, thứ), cùng chữ với `.l-leaf`. */
function leafFace(date: Date, today: boolean, fonts: { num: string; body: string }, c: Palette): CanvasTexture {
  const w = 512;
  const h = Math.round((w * H) / W);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  g.fillStyle = c.paper;
  g.fillRect(0, 0, w, h);
  const band = 76;
  g.fillStyle = today ? c.red : c.ink;
  g.fillRect(0, 0, w, band);
  const [day, month, year] = dmy(date).split("/");
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#FFFFFF";
  g.font = `600 30px ${fonts.body}`;
  g.fillText(`Tháng ${Number(month)}, ${year}`, w / 2, band / 2 + 2);
  g.fillStyle = today ? c.redInk : c.ink;
  g.font = `700 330px ${fonts.num}`;
  g.fillText(day, w / 2, band + (h - band - 70) / 2 + 12);
  g.fillStyle = c.ink3;
  g.font = `500 34px ${fonts.body}`;
  g.fillText(weekday(date), w / 2, h - 40);
  g.strokeStyle = c.rule;
  g.lineWidth = 4;
  g.strokeRect(2, 2, w - 4, h - 4);
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function LeafScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    // Dọn từng thứ ngay khi tạo xong, để lỗi giữa chừng cũng không bỏ sót gì.
    const disposers: (() => void)[] = [];
    const cleanup = () => {
      while (disposers.length) disposers.pop()!();
    };

    (async () => {
      // Chữ của tờ lịch lấy từ chính `.l-leaf` của trang; phải chờ đúng ba độ đậm mới vẽ, vì mặt tờ chỉ vẽ một lần.
      const dayEl = document.querySelector(".l-land-page .l-leaf-day");
      const bandEl = document.querySelector(".l-land-page .l-leaf-band");
      const fonts = {
        num: dayEl ? getComputedStyle(dayEl).fontFamily : "sans-serif",
        body: bandEl ? getComputedStyle(bandEl).fontFamily : "sans-serif",
      };
      await Promise.all([
        document.fonts.load(`700 330px ${fonts.num}`), document.fonts.load(`600 30px ${fonts.body}`), document.fonts.load(`500 34px ${fonts.body}`),
      ]);
      if (disposed) return;
      const colors = readPalette();

      const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      disposers.push(() => renderer.dispose());
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      disposers.push(() => renderer.domElement.remove());

      const scene = new Scene();
      const camera = new PerspectiveCamera(28, 1, 0.1, 40);
      camera.position.set(0, 0.1, 5.4);

      // Cả cuốn: nghiêng nhẹ theo kiểu nhìn chéo; rê chuột nghiêng thêm, lúc mở trang xoay vào chỗ (intro).
      const root = new Group();
      scene.add(root);

      const edge = new MeshBasicMaterial({ color: colors.rule, transparent: true });
      const back = new MeshBasicMaterial({ color: colors.paper, transparent: true });
      disposers.push(() => { edge.dispose(); back.dispose(); });
      const leafGeo = new BoxGeometry(W, H, THICK);
      disposers.push(() => leafGeo.dispose());

      const now = Date.now();
      const pivots: { pivot: Group; mats: MeshBasicMaterial[]; k: number }[] = [];
      for (let k = 0; k < LEAVES; k++) {
        const face: Texture = leafFace(new Date(now + k * 86_400_000), k === 0, fonts, colors);
        const front = new MeshBasicMaterial({ map: face, transparent: true });
        const e = edge.clone();
        const b = back.clone();
        disposers.push(() => { face.dispose(); front.dispose(); e.dispose(); b.dispose(); });
        const mesh = new Mesh(leafGeo, [e, e, e, e, front, b]);
        mesh.position.y = -H / 2;
        const pivot = new Group();
        pivot.add(mesh);
        // Các tờ dưới nhô ra một lát ở mép dưới, nhìn ra cả xấp.
        pivot.position.set(0, H / 2 - k * 0.026, -k * 0.03);
        root.add(pivot);
        pivots.push({ pivot, mats: [front, e, b], k });
      }

      // Gáy lò xo trên đầu cuốn lịch.
      const ringMat = new MeshBasicMaterial({ color: colors.ink });
      const ringGeo = new CapsuleGeometry(0.035, 0.16, 2, 8);
      disposers.push(() => { ringMat.dispose(); ringGeo.dispose(); });
      const rings = 8;
      for (let i = 0; i < rings; i++) {
        const ring = new Mesh(ringGeo, ringMat);
        ring.position.set(-W / 2 + 0.22 + (i * (W - 0.44)) / (rings - 1), H / 2 + 0.01, 0.06);
        root.add(ring);
      }

      const state = { p: 0 };
      const tilt = { x: 0, y: 0 };
      const intro = { y: 0.9, x: 0.25 };
      let raf = 0;
      disposers.push(() => { if (raf) cancelAnimationFrame(raf); });
      const draw = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          renderer.render(scene, camera);
        });
      };

      const apply = () => {
        for (const { pivot, mats, k } of pivots) {
          const t = smooth(clamp(state.p * (LEAVES - 1) - k));
          pivot.rotation.x = -t * 1.2;
          pivot.position.y = H / 2 - k * 0.026 + t * 0.55;
          pivot.position.z = -k * 0.03 + t * 0.9;
          const o = 1 - smooth(clamp((t - 0.25) / 0.6));
          for (const m of mats) m.opacity = o;
          pivot.visible = o > 0.01;
        }
        root.rotation.set(-0.1 + intro.x + tilt.y * 0.12, -0.3 + intro.y + tilt.x * 0.22, 0.025);
        draw();
      };

      const fit = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        root.scale.setScalar(Math.min(1, camera.aspect / 1.15));
        draw();
      };
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      disposers.push(() => ro.disconnect());
      fit();

      // Mất ngữ cảnh WebGL (máy yếu, tab nền): ẩn cảnh; có lại thì vẽ ngay, vì vẽ theo yêu cầu nên không tự có khung hình mới.
      const canvas = renderer.domElement;
      const onLost = (ev: Event) => { ev.preventDefault(); el.classList.remove("on"); };
      const onRestored = () => { el.classList.add("on"); draw(); };
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);
      disposers.push(() => {
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
      });

      apply();
      el.classList.add("on");

      // Mở trang: cả cuốn xoay vào chỗ (0,9 giây, một lần). Tách khỏi `tilt` nên rê chuột không làm nó giật.
      const introTween = gsap.to(intro, { x: 0, y: 0, duration: 0.9, ease: "power3.out", onUpdate: apply });
      disposers.push(() => introTween.kill());

      // Cuộn: xé từng tờ.
      const scroll = gsap.to(state, {
        p: 1, ease: "none", onUpdate: apply,
        scrollTrigger: { trigger: document.documentElement, start: 0, end: SCROLL_RANGE, scrub: 0.6 },
      });
      disposers.push(() => { scroll.scrollTrigger?.kill(); scroll.kill(); });

      // Rê chuột: nghiêng nhẹ (chỉ máy có chuột).
      if (window.matchMedia("(pointer: fine)").matches) {
        const onMove = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const nx = clamp((ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
          const ny = clamp((ev.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
          gsap.to(tilt, { x: nx, y: ny, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: apply });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        disposers.push(() => { window.removeEventListener("pointermove", onMove); gsap.killTweensOf(tilt); });
      }
    })().catch(() => {
      // Thiếu WebGL hay lỗi vẽ: dọn và ẩn cảnh. Không gỡ phần tử khỏi cây, vì nó do React giữ.
      cleanup();
      el.hidden = true;
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className="l-land-stage" aria-hidden="true" />;
}
