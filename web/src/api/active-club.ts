"use client";

// CLB đang chọn của người ở nhiều CLB (Hiệu chọn 29/10/2026: chọn trong menu avatar). Lưu trong trình duyệt, riêng từng máy.
// Các màn của thành viên (/me, /me/attendance, /me/pay) dùng CLB này; chưa chọn hoặc CLB đã rời thì dùng CLB đầu tiên đã nhận lời mời.

import { useSyncExternalStore } from "react";
import type { MeRes } from "@contract";

const KEY = "campushub.activeClub";
const listeners = new Set<() => void>();

function read(): string | null {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}

export function setActiveClub(clubId: string): void {
  try { window.localStorage.setItem(KEY, clubId); } catch { /* không lưu được thì chỉ lần này, không sao */ }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Phần tử membership của CLB đang chọn; không có thì CLB đầu tiên đã nhận lời mời. */
export function useActiveMembership(me: MeRes | undefined) {
  const id = useSyncExternalStore(subscribe, read, () => null);
  const accepted = me?.memberships.filter((m) => m.invite === "accepted") ?? [];
  return accepted.find((m) => m.clubId === id) ?? accepted[0];
}
