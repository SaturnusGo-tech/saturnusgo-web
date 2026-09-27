import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "../../../state/types/workspace";
import { canonicalSidebarView, SIDEBAR_NAVIGATION_IDS } from "../model/sidebar-navigation";
import { DEFAULT_SIDEBAR_PREFERENCES, parseSidebarPreferences, sidebarPreferenceKey, type SidebarPreferences } from "../model/sidebar-preferences";

type Snapshot = { key: string | null; preferences: SidebarPreferences; ready: boolean };
const INITIAL: Snapshot = { key: null, preferences: DEFAULT_SIDEBAR_PREFERENCES, ready: false };

function readPreferences(key: string): SidebarPreferences {
  try { return parseSidebarPreferences(window.localStorage.getItem(key)); }
  catch { return DEFAULT_SIDEBAR_PREFERENCES; }
}

export function useSidebarPreferences(workspaceId: string, subject: string | null | undefined) {
  const key = sidebarPreferenceKey(workspaceId, subject);
  const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL);
  const latest = useRef(snapshot);
  useEffect(() => {
    const refresh = () => {
      const next = { key, preferences: readPreferences(key), ready: true };
      latest.current = next; setSnapshot(next);
    };
    refresh();
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) refresh(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const change = useCallback((update: (previous: SidebarPreferences) => SidebarPreferences) => {
    const previous = latest.current.key === key ? latest.current.preferences : readPreferences(key);
    const preferences = update(previous);
    const next = { key, preferences, ready: true };
    latest.current = next; setSnapshot(next);
    try { window.localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Session-local preferences still work. */ }
  }, [key]);
  const setMode = useCallback((mode: SidebarPreferences["mode"]) => change(previous => ({ ...previous, mode })), [change]);
  const togglePinned = useCallback((view: View) => {
    const id = canonicalSidebarView(view);
    if (!id) return;
    change(previous => {
      const pinned = new Set(previous.pinned);
      if (pinned.has(id)) pinned.delete(id); else pinned.add(id);
      return { ...previous, pinned: SIDEBAR_NAVIGATION_IDS.filter(candidate => pinned.has(candidate)) };
    });
  }, [change]);
  const reset = useCallback(() => change(() => DEFAULT_SIDEBAR_PREFERENCES), [change]);
  // A scope change must never paint the previous workspace/user preferences while its effect loads.
  const current = snapshot.key === key ? snapshot : INITIAL;
  return { preferences: current.preferences, ready: current.ready, setMode, togglePinned, reset };
}
