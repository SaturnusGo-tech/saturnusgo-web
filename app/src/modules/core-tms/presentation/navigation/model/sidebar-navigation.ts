import type { View } from "../../../state/types/workspace";
import type { SidebarPreferences } from "./sidebar-preferences";

export const SIDEBAR_GROUPS = [
  { id: "overview", ids: ["dashboard"] },
  { id: "testing", ids: ["cases", "product-docs", "shared-steps", "test-data", "runs", "suites"] },
  { id: "management", ids: ["portfolios", "custom-fields", "api", "hooks", "files"] },
  { id: "insights", ids: ["reports"] },
] as const;
export type SidebarGroupId = typeof SIDEBAR_GROUPS[number]["id"];
export type SidebarNavigationId = typeof SIDEBAR_GROUPS[number]["ids"][number];
export const SIDEBAR_NAVIGATION_IDS: readonly SidebarNavigationId[] = SIDEBAR_GROUPS.flatMap(group => [...group.ids]);
export const PRIMARY_SIDEBAR_IDS: readonly SidebarNavigationId[] = ["dashboard", "cases", "product-docs", "shared-steps", "runs", "suites", "reports"];
export const RARE_SIDEBAR_IDS: readonly SidebarNavigationId[] = SIDEBAR_GROUPS[2].ids;

export function canonicalSidebarView(view: unknown): SidebarNavigationId | null {
  const candidate = view === "imports" ? "cases" : view;
  return SIDEBAR_NAVIGATION_IDS.find(id => id === candidate) ?? null;
}

/** Availability must be supplied after capability checks; this model never grants access. */
export function getSidebarNavigation({ availableIds, activeView, preferences }: {
  availableIds: readonly View[]; activeView: View; preferences: SidebarPreferences;
}) {
  const available = SIDEBAR_NAVIGATION_IDS.filter(id => availableIds.includes(id));
  const candidate = canonicalSidebarView(activeView);
  const activeId = candidate && available.includes(candidate) ? candidate : null;
  const pins = new Set(preferences.pinned.map(canonicalSidebarView));
  const pinnedIds = available.filter(id => pins.has(id));
  const railIds = new Set<SidebarNavigationId>([...PRIMARY_SIDEBAR_IDS, ...pinnedIds]);
  const visibleIds = available.filter(id => railIds.has(id));
  const visible = new Set(visibleIds);
  return {
    groups: SIDEBAR_GROUPS.map(group => ({ id: group.id, ids: group.ids.filter(id => visible.has(id)) })).filter(group => group.ids.length),
    availableIds: available,
    visibleIds,
    hiddenIds: available.filter(id => !visible.has(id)),
    activeId,
    pinnedIds,
  };
}
