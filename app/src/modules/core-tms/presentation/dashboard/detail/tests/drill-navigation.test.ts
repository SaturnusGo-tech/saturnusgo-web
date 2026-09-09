import assert from "node:assert/strict";
import test from "node:test";
import type { Bootstrap } from "../../../../../../core/tms/contracts/legacy-contract";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { drillHref, readDrillRoute, type DrillRoute } from "../../navigation/drill-route";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import { groupRunRecords } from "../groups/group-records";
const href = "https://tms.example/work/?workspaceId=w&projectId=p&view=dashboard";
const drill = { id: "component:legal", label: "Legal", filter: { entity: "test_case" as const, basis: "current" as const, component: "Legal" }, projectId: "p" };
const route: DrillRoute = { kind: "analytics", period: "90d", origin: drill, selected: drill };
test("a detail URL restores the period, component and original selection", () => {
  const encoded = drillHref(href, route);
  assert.deepEqual(readDrillRoute(encoded), route);
  assert.equal(readDrillRoute(drillHref(encoded, null)), null);
  assert.equal(readDrillRoute(href + "&dashboardDetail=invalid"), null);
});
test("workspace URL synchronization preserves details only in the same dashboard scope", () => {
  const detail = drillHref(href, route);
  const input = { workspaceId: "w", projectId: "p", view: "dashboard" as const, runId: null };
  assert.deepEqual(readDrillRoute(buildWorkspaceDeepLink(detail, input)), route);
  assert.equal(readDrillRoute(buildWorkspaceDeepLink(detail, { ...input, projectId: "different" })), null);
  assert.equal(new URL(buildWorkspaceDeepLink(detail, { ...input, view: "runs" })).searchParams.has("dashboardDetail"), false);
});
test("invalid, oversized and cross-project routes cannot restore an API request", () => {
  for (const value of [{ ...route, period: "forever" }, { ...route, selected: { ...drill, projectId: "other" } },
    { ...route, selected: { ...drill, filter: { entity: "admin", basis: "all" } } },
    { ...route, selected: { ...drill, label: "x".repeat(7000) } },
    { ...route, origin: { ...drill, window: { from: "2026-01-01", to: "invalid" } } }]) {
    assert.equal(readDrillRoute(drillHref(href, value as DrillRoute)), null);
  }
});
test("freshness routes round-trip environment and build characters without losing scope", () => {
  const value: DrillRoute = { kind: "workbench", selection: "outdatedItems", filters: { environmentId: "env-a", buildReference: "release/a + #7" } };
  assert.deepEqual(readDrillRoute(drillHref(href, value)), value);
});
const row = (projectId: string, id: string): DashboardDrillRow => ({ id, projectId, entity: "run_item", key: "RUN · TC-1", caseKey: "TC-1",
  title: "Checkout", project: projectId, runId: "same-run", runItemId: id, runName: "Checkout regression", detail: "", status: "not_run", links: [] });
test("grouping isolates repositories by project and preserves the precise execution target", () => {
  const groups = groupRunRecords([row("p", "item1"), row("other", "item2"), row("p", "item3")], { runs: [], testCases: [] } as unknown as Bootstrap);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].rows.length, 2);
  assert.equal(groups[0].rows[1].runItemId, "item3");
  assert.equal(groups[0].run.id, "same-run");
  assert.equal(groups[0].run.entity, "run");
  assert.equal(groups[0].run.runItemId, undefined);
  assert.equal(groups[0].run.progress, undefined, "a partially loaded group must not invent a full-run progress bar");
  assert.equal(groups[0].rows[0].caseKey, "TC-1");
});
