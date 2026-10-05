"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Vẽ mã QR dạng SVG. `label` là chữ cho trình đọc màn hình. */
export function QrSvg({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#14121A", light: "#FFFFFF" } })
      .then((s) => { if (alive) setSvg(s); })
      .catch(() => { if (alive) setSvg(""); });
    return () => { alive = false; };
  }, [value]);
  return <div role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Lưu ảnh PNG 640px của mã (lề 2 ô) để quét bằng app ngân hàng trên chính điện thoại này. */
export async function downloadQrPng(value: string, filename: string): Promise<void> {
  const url = await QRCode.toDataURL(value, { width: 640, margin: 2, errorCorrectionLevel: "M" });
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
