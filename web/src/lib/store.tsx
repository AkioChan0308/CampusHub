"use client";

// Kho dữ liệu của bản demo: giữ toàn bộ state trong React, lưu vào localStorage của trình duyệt,
// và đồng bộ giữa các tab (mở trang chiếu QR ở tab này, điểm danh ở tab kia vẫn thấy ngay).
// Khi có backend: thay phần đọc/ghi localStorage bằng gọi API; các trang giữ nguyên.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { createSeed, STATE_VERSION } from "./seed";
import type { AppState } from "./types";
import { setPersona, type Update } from "./actions";

const KEY = "campushub-demo-state";
const DEVICE_KEY = "campushub-demo-device";
const TAB_KEY = "campushub-demo-persona";

type Msg = { type: "load"; state: AppState } | { type: "update"; fn: Update };

function reducer(state: AppState, msg: Msg): AppState {
  if (msg.type === "load") return msg.state;
  return msg.fn(state);
}

interface StoreValue {
  /** state.persona ở đây là vai của tab đang mở. */
  state: AppState;
  update: (fn: Update) => void;
  reset: () => void;
  deviceId: string;
  choosePersona: (personId: string | null) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

/** sessionStorage bị chặn (chế độ ẩn danh, trình duyệt trong app): vai chỉ còn giữ trong bộ nhớ của tab. */
function trySession(fn: () => void): void {
  try { fn(); } catch { /* xem chú thích của hàm */ }
}

function readSaved(): AppState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    return parsed && parsed.v === STATE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function readDeviceId(): string {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `thiet-bi-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "thiet-bi-khong-luu-duoc";
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createSeed);
  const [ready, setReady] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  // Vai đang xem giữ riêng cho từng tab (sessionStorage), để tab chiếu QR của chủ nhiệm và tab của thành viên
  // mở cùng lúc được. Tab chưa chọn vai thì dùng vai chọn gần nhất (state.persona, lưu chung).
  const [tabPersona, setTabPersona] = useState<string | null>(null);
  const lastWritten = useRef<string>("");

  useEffect(() => {
    const saved = readSaved();
    if (saved) dispatch({ type: "load", state: saved });
    setDeviceId(readDeviceId());
    trySession(() => setTabPersona(window.sessionStorage.getItem(TAB_KEY)));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const next = readSaved();
      if (next) {
        lastWritten.current = e.newValue ?? "";
        dispatch({ type: "load", state: next });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const raw = JSON.stringify(state);
    if (raw === lastWritten.current) return;
    lastWritten.current = raw;
    try {
      window.localStorage.setItem(KEY, raw);
    } catch {
      // Trình duyệt chặn lưu (chế độ ẩn danh…): bản demo vẫn chạy, chỉ mất dữ liệu khi tải lại trang.
    }
  }, [state, ready]);

  const update = useCallback((fn: Update) => dispatch({ type: "update", fn }), []);
  const choosePersona = useCallback((id: string | null) => {
    trySession(() => {
      if (id) window.sessionStorage.setItem(TAB_KEY, id);
      else window.sessionStorage.removeItem(TAB_KEY);
    });
    setTabPersona(id);
    dispatch({ type: "update", fn: setPersona(id) });
  }, []);
  const reset = useCallback(() => {
    try { window.localStorage.removeItem(KEY); } catch { /* chặn lưu như ở trên: chỉ cần nạp lại dữ liệu mẫu */ }
    trySession(() => window.sessionStorage.removeItem(TAB_KEY));
    setTabPersona(null);
    dispatch({ type: "load", state: createSeed() });
  }, []);

  const view = useMemo(() => (tabPersona && tabPersona !== state.persona ? { ...state, persona: tabPersona } : state), [state, tabPersona]);
  const value = useMemo(() => ({ state: view, update, reset, deviceId, choosePersona }), [view, update, reset, deviceId, choosePersona]);

  // Đọc trình duyệt chỉ mất một nhịp: để nền trống của Lịch bloc, không hiện chữ "Đang tải…" rồi tắt ngay.
  if (!ready) return <div className="lich" aria-busy="true"><p className="l-sr" role="status">Đang tải…</p></div>;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore phải nằm trong StoreProvider");
  return v;
}
