import type { DashboardDrill, DashboardPeriod } from "../../../dashboards/model/dashboard-analytics";
import type { WorkbenchFilters, WorkbenchKind } from "../../../dashboards/workbench/model/workbench";
export type DrillRoute = { kind: "analytics"; origin: DashboardDrill; selected: DashboardDrill; period: DashboardPeriod }
  | { kind: "workbench"; selection: WorkbenchKind; filters: WorkbenchFilters };
export const detailParameter = "dashboardDetail";
const workbenchKinds = ["activeRuns", "readyForRetest", "blockedItems", "openDefects", "notRunItems", "inProgressItems", "outdatedItems", "runsWithoutBuild"];
const text = (value: unknown, max = 500): value is string => typeof value === "string" && value.length <= max;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
function validDrill(value: unknown): value is DashboardDrill {
  if (!object(value) || !text(value.id, 600) || !text(value.label) || !object(value.filter)) return false;
  if (value.projectId !== undefined && !text(value.projectId, 128)) return false;
  if (value.window !== undefined && (!object(value.window) || !text(value.window.from, 40) || !text(value.window.to, 40)
    || !Number.isFinite(Date.parse(value.window.from)) || !Number.isFinite(Date.parse(value.window.to)) || Date.parse(value.window.from) >= Date.parse(value.window.to))) return false;
  const f = value.filter;
  const entities: Record<string, string[]> = { test_case: ["current", "created"], run: ["launched", "completed", "active"], run_item: [], defect: ["reported", "current"] };
  if (!text(f.entity) || !Object.prototype.hasOwnProperty.call(entities, f.entity)) return false;
  if (f.entity !== "run_item" && (!text(f.basis) || !entities[f.entity].includes(f.basis))) return false;
  if (f.entity === "run" && f.basis !== "completed" &&
    (f.component !== undefined || f.componentIsEmpty || f.itemStatus !== undefined)) return false;
  const strings = ["component", "status", "type", "tag", "coverage", "outcome", "itemStatus", "severity", "runId", "testCaseId"];
  const flags = ["componentIsEmpty", "untagged", "hasLink", "activeOnly"];
  return Object.entries(f).every(([key, field]) => ["entity", "basis"].includes(key) || strings.includes(key) && text(field) || flags.includes(key) && typeof field === "boolean");
}
export function readDrillRoute(href: string): DrillRoute | null {
  try {
    const url = new URL(href); if (url.searchParams.get("view") !== "dashboard") return null;
    const raw = url.searchParams.get(detailParameter); if (!raw || raw.length > 6500) return null;
    const value: unknown = JSON.parse(raw); if (!object(value)) return null;
    if (value.kind === "workbench" && text(value.selection) && workbenchKinds.includes(value.selection) && object(value.filters)
      && text(value.filters.environmentId, 128) && text(value.filters.buildReference)) return value as DrillRoute;
    if (value.kind === "analytics" && validDrill(value.origin) && validDrill(value.selected) && ["7d", "30d", "90d"].includes(value.period as string)) {
      const project = url.searchParams.get("projectId");
      if (project && [value.origin, value.selected].some(drill => drill.projectId && drill.projectId !== project)) return null;
      return value as DrillRoute;
    }
  } catch { /* Invalid or obsolete links return to the dashboard without requesting a different scope. */ }
  return null;
}
export function drillHref(href: string, route: DrillRoute | null) {
  const url = new URL(href); url.searchParams.set("view", "dashboard");
  if (route) url.searchParams.set(detailParameter, JSON.stringify(route)); else url.searchParams.delete(detailParameter);
  return url.href;
}
