import assert from "node:assert/strict";
import test from "node:test";
import type { DashboardDrill } from "../../model/dashboard-analytics";
import { relatedDashboardDrill } from "../../../presentation/dashboard/inspector/dashboard-drill-navigation";
import { drillHref, readDrillRoute } from "../../../presentation/dashboard/navigation/drill-route";
import { matchesDashboardProducts } from "../../model/products/dashboard-products";
import { mapTestCaseDrill, mapRunItemDrill } from "../../http/dashboard-drill-mapper";
import type { components } from "../../../../../core/tms/generated/tms-api";
const products = { productGroupId: "group-commerce", productId: "product-checkout", regression: false };
const origin: DashboardDrill = { id: "product-context:checkout", label: "Checkout", projectId: "project-a",
  filter: { entity: "test_case", basis: "current", ...products } };
test("product IDs and false regression survive related entities and restored navigation", () => {
  for (const entity of ["run", "defect"] as const) {
    const related = relatedDashboardDrill(origin, entity)!;
    assert.deepEqual({ productGroupId: related.filter.productGroupId, productId: related.filter.productId,
      regression: related.filter.regression }, products);
    if (related.filter.entity === "run") assert.equal(related.filter.basis, "completed");
    const route = { kind: "analytics" as const, origin, selected: related, period: "30d" as const };
    assert.deepEqual(readDrillRoute(drillHref("https://falcon.test/?view=dashboard&projectId=project-a", route)), route);
  }
  assert.equal(readDrillRoute(drillHref("https://falcon.test/?view=dashboard&projectId=project-a", {
    kind: "analytics", origin, selected: { ...origin, filter: { ...origin.filter, productId: "bad/id" } }, period: "30d" })), null);
});
test("product matching compares stable IDs and preserves explicit non-regression", () => {
  assert.equal(matchesDashboardProducts({ ...products, regression: undefined }, products), true);
  assert.equal(matchesDashboardProducts({ ...products, regression: true }, products), false);
  assert.equal(matchesDashboardProducts({ ...products, productId: "other-product" }, products), false);
});
test("analytics case and execution rows retain immutable product labels with stable IDs", () => {
  type Api = components["schemas"];
  const projection = { ...products, customFields: [{ fieldId: "field-product", name: "Product", type: "string" as const,
    systemKey: "product" as const, values: [{ id: products.productId, value: "Old Checkout", label: "Old Checkout", parentValueId: products.productGroupId }] }] };
  const meta = { limit: 50, nextCursor: null, hasMore: false, periodApplied: false,
    period: { preset: "30d" as const, from: "2026-09-01T00:00:00Z", to: "2026-09-30T00:00:00Z" } };
  const item: Api["DashboardAnalyticsTestCase"] = { ...projection, id: "case-1", projectId: "project-a", key: "QA-1",
    title: "Checkout", type: "manual", lifecycle: "ready", priority: "high", component: "Legacy component", tags: [],
    archivedAt: null, basis: "current", etag: '"case:1"', createdAt: meta.period.from, updatedAt: meta.period.from, sortAt: meta.period.from };
  const cases = mapTestCaseDrill({ data: [item], meta }, new Map());
  assert.equal(cases.rows[0].product, "Old Checkout"); assert.equal(cases.rows[0].productId, products.productId);
  const execution: Api["DashboardAnalyticsRunItem"] = { ...projection, id: "item-1", projectId: "project-a", runId: "run-1",
    runKey: "RUN-1", runName: "Release", runType: "regression", testCaseId: "case-1", testCaseKey: "QA-1", revisionNo: 1,
    title: "Checkout", caseType: "manual", component: "Legacy component", status: "passed", attemptNo: 1,
    eventAt: meta.period.to, sortAt: meta.period.to };
  const executions = mapRunItemDrill({ data: [execution], meta: { ...meta, periodApplied: true, total: 1 } }, new Map());
  assert.equal(executions.rows[0].product, "Old Checkout"); assert.equal(executions.rows[0].regression, false);
});
