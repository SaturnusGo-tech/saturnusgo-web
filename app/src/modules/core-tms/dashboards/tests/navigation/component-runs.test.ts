import assert from "node:assert/strict";
import test from "node:test";
import type { Bootstrap } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { createHttpDashboardAnalyticsSource } from "../../source/http-dashboard-analytics-source";
import { relatedDashboardDrill } from "../../../presentation/dashboard/inspector/dashboard-drill-navigation";
import { drillHref, readDrillRoute } from "../../../presentation/dashboard/navigation/drill-route";

test("component run navigation sends the supported completed basis without losing scope", async () => {
  const requests: URL[] = [];
  const http = { async get(path: string) {
    requests.push(new URL(path, "https://falcon.test"));
    return { data: [], meta: { hasMore: false, nextCursor: null, periodApplied: true } };
  } } as unknown as TmsHttpClient;
  const source = createHttpDashboardAnalyticsSource(http, { projects: [] } as unknown as Bootstrap);
  const query = { workspaceId: "w", projectId: "p", period: "30d" as const };
  for (const scope of [{ component: "Host Shell" }, { componentIsEmpty: true as const }]) {
    const origin = { id: "component", label: "Component", projectId: "p",
      filter: { entity: "test_case" as const, basis: "current" as const, ...scope } };
    const selected = relatedDashboardDrill(origin, "run")!;
    assert.deepEqual(selected.filter, { entity: "run", basis: "completed", ...scope });
    const page = await source.drill({ query, drill: selected });
    const request = requests[requests.length - 1]!;
    assert.equal(request.pathname, "/dashboard-analytics/runs");
    assert.equal(request.searchParams.get("basis"), "completed");
    assert.equal(request.searchParams.get("projectId"), "p");
    for (const [key, value] of Object.entries(scope)) assert.equal(request.searchParams.get(key), String(value));
    assert.deepEqual(page.rows, [], "a valid empty response stays empty");
    const href = "https://falcon.test/work/?workspaceId=w&projectId=p&view=dashboard";
    const route = { kind: "analytics" as const, origin, selected, period: "30d" as const };
    assert.deepEqual(readDrillRoute(drillHref(href, route)), route);
    assert.equal(readDrillRoute(drillHref(href, { ...route, selected: { ...selected,
      filter: { entity: "run", basis: "launched", ...scope } } })), null);
  }
});

test("unscoped run navigation retains the launched-run lifecycle", () => {
  assert.deepEqual(relatedDashboardDrill({ id: "all", label: "All cases",
    filter: { entity: "test_case", basis: "current" } }, "run")?.filter,
  { entity: "run", basis: "launched" });
});
