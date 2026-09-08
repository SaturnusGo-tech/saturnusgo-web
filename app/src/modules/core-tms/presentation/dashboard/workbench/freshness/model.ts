import type { WorkbenchKind, WorkbenchSnapshot } from "../../../../dashboards/workbench/model/workbench";

export type FreshnessKind = Exclude<WorkbenchKind, "readyForRetest">;
type Check = { kind: FreshnessKind; count: number | undefined;
  hint?: "notRunHint" | "inProgressHint" | "outdatedHint" | "noBuildHint" };

export function freshnessPages(snapshot: WorkbenchSnapshot | null): Check[][] {
  const freshness = snapshot?.freshness;
  const counts = snapshot?.counts;
  return [[
    { kind: "notRunItems", count: freshness?.notRunActiveItems, hint: "notRunHint" },
    { kind: "inProgressItems", count: freshness?.inProgressActiveItems, hint: "inProgressHint" },
    { kind: "outdatedItems", count: freshness?.outdatedActiveItems, hint: "outdatedHint" },
    { kind: "runsWithoutBuild", count: freshness?.activeRunsWithoutBuild, hint: "noBuildHint" },
  ], [
    { kind: "activeRuns", count: counts?.activeRuns },
    { kind: "blockedItems", count: counts?.blockedActiveItems },
    { kind: "openDefects", count: counts?.openDefects },
  ]];
}

export const normalizeFreshnessPage = (page: number) => Number.isFinite(page) ? Math.max(0, Math.min(1, Math.trunc(page))) : 0;

export function pageForKey(page: number, key: string): number | undefined {
  if (key === "ArrowLeft") return normalizeFreshnessPage(page - 1);
  if (key === "ArrowRight") return normalizeFreshnessPage(page + 1);
  if (key === "Home") return 0;
  if (key === "End") return 1;
  return undefined;
}
