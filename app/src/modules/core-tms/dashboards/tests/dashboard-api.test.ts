import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createDashboardResource } from "../data/dashboard-api";
import { mapDashboardAnalyticsSummary } from "../http/dashboard-summary-mapper";

test("dashboard create maps bounded widgets and sends idempotency", async () => {
  let request: RequestInit | undefined;
  const widget = {
    id: "widget-1", type: "summary" as const, title: "Run status",
    position: { x: 0, y: 0, width: 12, height: 4 }, settings: {},
  };
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: {
        id: "dashboard-1", workspaceId: "workspace-1", projectId: "project-1",
        name: "Release", description: "Release health", isDefault: false, status: "active",
        createdByIdentityId: "identity-1", widgets: [widget],
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
      } }), { status: 201, headers: { "content-type": "application/json", etag: '"dashboard:dashboard-1:1"' } });
    }) as typeof fetch,
  });

  const result = await createDashboardResource(http, {
    workspaceId: "workspace-1", projectId: "project-1", name: "Release",
    description: "Release health", isDefault: false, widgets: [widget],
  }, "dashboard-operation-key");

  assert.deepEqual(result.data.widgets, [{ id: "widget-1", type: "summary", title: "Run status" }]);
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "dashboard-operation-key");
});

test("analytics mapper keeps server timeline, risk counts, and exact drills", () => {
  type Summary = components["schemas"]["DashboardAnalyticsSummary"];
  const projectDimension = { buckets: [], totalBuckets: 0, truncated: false };
  const risk = { currentTestCases: 4, coveredTestCases: 3, runItemsInPeriod: 5,
    passedRunItems: 2, failedRunItems: 2, blockedRunItems: 1, openDefects: 2,
    criticalOpenDefects: 1, passRate: .4, coverageRate: .75,
    projectId: "project-1", projectKey: "P1", projectName: "Payments" };
  const summary = {
    workspaceId: "workspace-1", projectId: null,
    generatedAt: "2026-09-02T09:00:00.000Z", asOf: "2026-09-02T09:00:00.000Z",
    period: { preset: "30d", from: "2026-08-03T09:00:00.000Z", to: "2026-09-02T09:00:00.000Z" },
    basis: { testCaseCurrent: "current_inventory_at_as_of", testCaseCreated: "created_at",
      runLaunched: "started_at", runCompleted: "completed_at_or_aborted_at",
      runActive: "current_at_as_of", defectReported: "created_at", defectCurrent: "current_at_as_of" },
    testCases: { current: { total: 4,
      byType: [{ key: "manual", count: 1 }, { key: "checklist", count: 1 },
        { key: "automated", count: 2 }], byProject: projectDimension,
      byTag: { buckets: [{ key: "smoke", count: 3 }], totalBuckets: 2, truncated: true },
      untagged: 1, byComponent: null }, createdInPeriod: 1 },
    runs: { timeline: { timezone: "UTC", granularity: "day", buckets: [{
      start: "2026-09-01T09:00:00.000Z", end: "2026-09-02T09:00:00.000Z", launched: 2,
      completedOutcomes: { passed: 1, failed: 1, blocked: 0, incomplete: 0,
        notStarted: 0, aborted: 0 }, completedItems: { passed: 2, failed: 1, blocked: 1, skipped: 0 },
      passRate: .5 }] }, launchedInPeriod: { total: 2, byStatus: [], byProject: projectDimension },
      completedInPeriod: { total: 2, byOutcome: [{ key: "passed", count: 1 },
        { key: "failed", count: 1 }], byProject: projectDimension },
      currentActive: { total: 1, byProject: projectDimension } },
    defects: { reportedInPeriod: { total: 1, byProject: projectDimension }, current: {
      total: 4, linked: 2, totalExternalLinks: 2,
      byStatus: [{ key: "open", count: 2 }, { key: "verified", count: 1 },
        { key: "closed", count: 1 }], byProject: projectDimension } },
    riskHotspots: { basis: { runItems: "runs_completed_at_or_aborted_at_in_period",
      coverage: "current_cases_in_runs_started_in_period", defects: "current_open_at_as_of" },
      byProject: { hotspots: [risk], totalHotspots: 1, truncated: false,
        sort: "failed_desc_blocked_desc_critical_open_defects_desc_open_defects_desc_coverage_asc_pass_rate_asc_key_asc" },
      byComponent: { hotspots: [{ ...risk, component: "Checkout" }], totalHotspots: 1,
        truncated: false, sort: "failed_desc_blocked_desc_critical_open_defects_desc_open_defects_desc_coverage_asc_pass_rate_asc_key_asc" } },
  } as Summary;
  const mapped = mapDashboardAnalyticsSummary(summary,
    { workspaceId: "workspace-1", period: "30d" });
  assert.equal(mapped.metrics.passRate, 50);
  assert.equal(mapped.metrics.openDefects, 2);
  assert.deepEqual(mapped.trend[0] && [mapped.trend[0].start, mapped.trend[0].end],
    ["2026-09-01T09:00:00.000Z", "2026-09-02T09:00:00.000Z"]);
  assert.deepEqual(mapped.hotspots[0]?.drills.failures?.filter,
    { entity: "run_item", status: "failed" });
  assert.ok(mapped.dataNotes.includes("tags-truncated"));
});
