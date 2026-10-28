"use client";

// Cổng vào của cảnh 3D ở trang đầu. Chỉ tải Three.js và GSAP khi máy đủ điều kiện:
// màn từ 1100px có chuột (chỗ trống bên phải tiêu đề), không bật giảm chuyển động, có WebGL, đủ bộ nhớ khi trình duyệt cho biết.
// Không thì không tải gì, trang vẫn trọn vẹn. Việc tải chờ lúc rảnh để không tranh với lúc trang mở và video.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LeafScene = dynamic(() => import("./LeafScene"), { ssr: false });

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function LeafStage() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1100px)");
    const mouse = window.matchMedia("(hover: hover)");
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    let idle = 0;
    const update = () => {
      window.clearTimeout(idle);
      const ok = !calm.matches && wide.matches && mouse.matches && (memory === undefined || memory >= 4);
      if (!ok) return setOn(false);
      idle = window.setTimeout(() => setOn(hasWebGL()), 600);
    };
    update();
    const queries = [calm, wide, mouse];
    for (const q of queries) q.addEventListener("change", update);
    return () => {
      window.clearTimeout(idle);
      for (const q of queries) q.removeEventListener("change", update);
    };
  }, []);

  return on ? <LeafScene /> : null;
}
