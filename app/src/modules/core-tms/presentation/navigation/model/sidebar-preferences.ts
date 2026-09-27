import type { View } from "../../../state/types/workspace";
import { canonicalSidebarView, SIDEBAR_NAVIGATION_IDS } from "./sidebar-navigation";

export type SidebarPreferences = { readonly mode: "all" | "contextual"; readonly pinned: readonly View[] };
export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = Object.freeze({ mode: "all", pinned: Object.freeze([]) });

export function parseSidebarPreferences(raw: string | null): SidebarPreferences {
  if (!raw) return DEFAULT_SIDEBAR_PREFERENCES;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_SIDEBAR_PREFERENCES;
    const stored = value as { mode?: unknown; pinned?: unknown };
    const pins = new Set(Array.isArray(stored.pinned) ? stored.pinned.map(canonicalSidebarView) : []);
    return { mode: stored.mode === "contextual" ? "contextual" : "all", pinned: SIDEBAR_NAVIGATION_IDS.filter(id => pins.has(id)) };
  } catch {
    return DEFAULT_SIDEBAR_PREFERENCES;
  }
}

export function sidebarPreferenceKey(workspaceId: string, subject: string | null | undefined): string {
  return `tms.sidebar.v1:${JSON.stringify([workspaceId, subject ?? null])}`;
}
