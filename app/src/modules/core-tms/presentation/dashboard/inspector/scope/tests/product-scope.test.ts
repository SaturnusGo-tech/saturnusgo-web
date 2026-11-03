import assert from "node:assert/strict";
import test from "node:test";
import type { DashboardDrill } from "../../../../../dashboards/model/dashboard-analytics";
import { scopedDashboardDrill } from "../product-scope";
import { drillHref, readDrillRoute } from "../../../navigation/drill-route";
const metric: DashboardDrill = { id: "widget:reportedDefects", label: "New defects", projectId: "project_ui_preview",
  window: { from: "2026-10-01T00:00:00Z", to: "2026-11-01T00:00:00Z" },
  filter: { entity: "defect", basis: "reported", status: "open", severity: "critical", hasLink: true } };
test("product filtering preserves the metric, entity, period and non-product predicates", () => {
  const scoped = scopedDashboardDrill(metric, { productGroupId: "g1", productId: "p1", regression: false });
  assert.deepEqual(scoped.filter, { ...metric.filter, productGroupId: "g1", productId: "p1", regression: false });
  assert.equal(scoped.label, "New defects"); assert.equal(scoped.projectId, metric.projectId); assert.deepEqual(scoped.window, metric.window);
  const route = { kind: "analytics" as const, origin: scoped, selected: scoped, period: "90d" as const };
  assert.deepEqual(readDrillRoute(drillHref("https://falcon.test/?view=dashboard&projectId=project_ui_preview", route)), route);
});
test("clearing or replacing product filters removes prior IDs without losing metric constraints", () => {
  const scoped = scopedDashboardDrill(metric, { productGroupId: "g1", productId: "p1", regression: false });
  const clear = scopedDashboardDrill(scoped, {});
  assert.deepEqual(clear.filter, metric.filter);
  assert.equal(scopedDashboardDrill(scoped, { productId: "p2" }).filter.productGroupId, undefined);
  assert.equal(scopedDashboardDrill(scoped, { productId: "p2" }).filter.regression, undefined);
  assert.equal(scopedDashboardDrill(clear, { productGroupId: "g1", productId: "p1", regression: false }).id, scoped.id);
});
test("run and execution scopes retain their original basis and exact execution target", () => {
  for (const filter of [{ entity: "run" as const, basis: "active" as const, status: "active" as const },
    { entity: "run_item" as const, status: "blocked" as const, runId: "run-a", testCaseId: "case-a" }]) {
    assert.deepEqual(scopedDashboardDrill({ ...metric, filter }, { regression: true }).filter, { ...filter, regression: true });
  }
});
test("an explicit product-context view retains its entity tabs and uses the selected product label", () => {
  const origin: DashboardDrill = { ...metric, id: "product-context:host:related:run", label: "Host", filter: { entity: "run", basis: "completed", productId: "old" } };
  const next = scopedDashboardDrill(origin, { productId: "new" }, "Guest app");
  assert.match(next.id, /^product-context:/); assert.equal(next.label, "Guest app");
  assert.equal(next.filter.entity, "run"); assert.equal(next.filter.basis, "completed");
  assert.equal(scopedDashboardDrill(metric, { productId: "new" }, "Guest app").label, metric.label);
});
