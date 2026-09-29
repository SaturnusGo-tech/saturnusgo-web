"use client";
import { useEffect, useState } from "react";

export function useRunFocus(workspaceId: string) {
  const key = `falcon.run.focus.v1:${workspaceId}`;
  const [preference, setPreference] = useState({ key: "", focused: false });
  useEffect(() => {
    let focused = false;
    try { focused = window.localStorage.getItem(key) === "true"; } catch { /* Storage may be disabled. */ }
    setPreference({ key, focused });
  }, [key]);
  const ready = preference.key === key;
  const focused = ready && preference.focused;
  function toggle() {
    const next = !focused;
    setPreference({ key, focused: next });
    try { window.localStorage.setItem(key, String(next)); } catch { /* Keep this view usable without storage. */ }
  }
  return { focused, ready, toggle };
}
