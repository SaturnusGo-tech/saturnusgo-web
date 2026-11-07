import { dashboardSections, type DashboardSection } from "../sections/widget-sections";
import type { DashboardPeriod } from "../../model/dashboard-analytics";
export type DashboardPreferences = {
  section: DashboardSection | "all"; period: DashboardPeriod; filtersOpen: boolean;
  environmentId: string; buildReference: string; queueTab: "activeRuns" | "readyForRetest"; freshnessPage: 0 | 1;
};
export const defaultPreferences: DashboardPreferences = { section: "overview", period: "30d", filtersOpen: false,
  environmentId: "", buildReference: "", queueTab: "activeRuns", freshnessPage: 0 };
export function preferenceKey(subject: string | null, workspace: string, project: string): string {
  return `falcon.dashboard.context.v2:${JSON.stringify([subject, workspace, project])}`;
}
export function parsePreferences(raw: string | null): DashboardPreferences {
  try {
    const item: unknown = raw ? JSON.parse(raw) : null;
    if (!item || typeof item !== "object" || Array.isArray(item)) return { ...defaultPreferences };
    const p = item as Record<string, unknown>;
    return {
      section: typeof p.section === "string" && ["all", ...dashboardSections].includes(p.section) ? p.section as DashboardPreferences["section"] : "overview",
      period: typeof p.period === "string" && ["7d", "30d", "90d"].includes(p.period) ? p.period as DashboardPeriod : "30d",
      filtersOpen: p.filtersOpen === true,
      environmentId: typeof p.environmentId === "string" && p.environmentId.length <= 200 ? p.environmentId : "",
      buildReference: typeof p.buildReference === "string" && p.buildReference.length <= 500 ? p.buildReference : "",
      queueTab: p.queueTab === "readyForRetest" ? "readyForRetest" : "activeRuns", freshnessPage: p.freshnessPage === 1 ? 1 : 0,
    };
  } catch { return { ...defaultPreferences }; }
}

export function readLegacyPreferences(raw: string): DashboardPreferences | null {
  const value = parsePreferences(raw);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value.environmentId)) value.environmentId = "";
  return JSON.stringify(value) === JSON.stringify(defaultPreferences) ? null : value;
}
