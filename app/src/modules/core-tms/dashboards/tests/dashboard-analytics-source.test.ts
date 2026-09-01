import assert from "node:assert/strict";
import test from "node:test";
import type { Bootstrap, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createBootstrapDashboardAnalyticsSource } from "../source/bootstrap-dashboard-analytics-source";
import { createHttpDashboardAnalyticsSource } from "../source/http-dashboard-analytics-source";

const progress = (passed: number, failed: number) => ({
  total: passed + failed, executed: passed + failed, percent: 100,
  counts: { passed, failed, blocked: 0, skipped: 0, not_run: 0, in_progress: 0 },
});

const run = (id: string, projectId: string, passed: number, failed: number): TestRunSummary => ({
  id, projectId, key: id.toUpperCase(), name: id, description: "", type: "regression", status: "completed",
  environment: { id: "env", key: "qa", name: "QA", baseUrl: "https://qa.test" }, suiteId: null,
  build: "42", configuration: {}, itemCount: passed + failed, progress: progress(passed, failed),
  createdAt: "2026-08-20T09:00:00.000Z", startedAt: "2026-08-21T09:00:00.000Z",
  completedAt: "2026-08-22T09:00:00.000Z", archivedAt: null, archivedBy: null, archiveReason: null,
});

const data: Bootstrap = {
  workspace: { id: "workspace", key: "WS", slug: "workspace", name: "Workspace" },
  projects: [
    { id: "alpha", key: "A", name: "Alpha" },
    { id: "beta", key: "B", name: "Beta" },
  ],
  environments: [], suites: [], dashboards: [], activity: [],
  testCases: [
    {
      id: "case-a", projectId: "alpha", key: "A-1", folderPath: "/", currentRevision: 1,
      title: "Automated checkout", type: "automated", lifecycle: "ready", priority: "critical",
      component: "Checkout", ownerIdentityId: null, tags: ["smoke", "payments"], estimatedMinutes: 2,
      revisionCount: 1, archivedAt: null, createdAt: "2026-08-15T00:00:00.000Z",
      updatedAt: "2026-08-15T00:00:00.000Z", etag: '"case-a:1"',
    },
    {
      id: "case-b", projectId: "alpha", key: "A-2", folderPath: "/", currentRevision: 1,
      title: "Manual refund", type: "manual", lifecycle: "ready", priority: "high",
      component: "Checkout", ownerIdentityId: null, tags: [], estimatedMinutes: 5,
      revisionCount: 1, archivedAt: null, createdAt: "2026-08-16T00:00:00.000Z",
      updatedAt: "2026-08-16T00:00:00.000Z", etag: '"case-b:1"',
    },
    {
      id: "case-c", projectId: "beta", key: "B-1", folderPath: "/", currentRevision: 1,
      title: "Profile checklist", type: "checklist", lifecycle: "draft", priority: "medium",
      component: "Profile", ownerIdentityId: null, tags: ["smoke"], estimatedMinutes: null,
      revisionCount: 1, archivedAt: null, createdAt: "2026-08-17T00:00:00.000Z",
      updatedAt: "2026-08-17T00:00:00.000Z", etag: '"case-c:1"',
    },
  ],
  runs: [run("run-a", "alpha", 2, 1), run("run-b", "beta", 3, 0)],
  defects: [
    {
      id: "defect-a", projectId: "alpha", key: "BUG-1", title: "Payment rejected", description: "",
      severity: "critical", priority: "high", status: "open", reproducibility: "always",
      assigneeIdentityId: null, component: "Checkout", integrationTarget: "backend", externalIssue: null,
      labels: [], runId: "run-a", runItemId: null, stepId: null, expectedResult: "", actualResult: "",
      attachmentIds: [], linkIds: ["link-a"], createdAt: "2026-08-23T00:00:00.000Z",
    },
  ],
  externalLinks: [{
    id: "link-a", projectId: "alpha", owner: { kind: "defect", defectId: "defect-a" },
    label: "BUG-42", targetUri: "https://tracker.test/BUG-42", kind: "external_issue", status: "active",
  }],
  meta: { generatedAt: "2026-08-29T12:00:00.000Z", apiVersion: "v1", authorization: { role: "admin", capabilities: [] } },
};

const query = { workspaceId: "workspace", period: "30d" as const };

test("bootstrap analytics produces workspace dimensions and exact project drills", async () => {
  const source = createBootstrapDashboardAnalyticsSource(data);
  const summary = await source.summary(query);
  assert.equal(summary.metrics.currentCases, 3);
  assert.deepEqual(summary.caseTypes.map(({ value }) => value), [1, 1, 1]);
  assert.equal(summary.hotspots[0]?.kind, "project");
  assert.equal(summary.hotspots[0]?.drills.failures, undefined);
  assert.equal(summary.hotspots[0]?.drills.defects?.projectId, "alpha");
  assert.ok(summary.dataNotes.includes("component-run-attribution-unavailable"));
});

test("bootstrap drill honors tag, outcome, link, scope, and cursor filters", async () => {
  const source = createBootstrapDashboardAnalyticsSource(data);
  const tagged = await source.drill({
    query, drill: { id: "smoke", label: "smoke", filter: { entity: "test_case", basis: "current", tag: "smoke" } }, limit: 1,
  });
  assert.equal(tagged.total, 2);
  assert.equal(tagged.rows[0]?.key, "B-1");
  assert.match(tagged.nextCursor ?? "", /^local:.+:1$/);
  const next = await source.drill({
    query, drill: { id: "smoke", label: "smoke", filter: { entity: "test_case", basis: "current", tag: "smoke" } },
    cursor: tagged.nextCursor, limit: 1,
  });
  assert.equal(next.rows[0]?.key, "A-1");

  const failed = await source.drill({
    query, drill: { id: "failed", label: "Failed", projectId: "alpha", filter: { entity: "run", basis: "completed", outcome: "failed" } },
  });
  assert.deepEqual(failed.rows.map(({ key }) => key), ["RUN-A"]);
  const linked = await source.drill({
    query, drill: { id: "linked", label: "Linked", filter: { entity: "defect", basis: "current", hasLink: true } },
  });
  assert.equal(linked.rows[0]?.links[0]?.url, "https://tracker.test/BUG-42");
  const closedSource = createBootstrapDashboardAnalyticsSource({ ...data, defects: [
    ...data.defects,
    { ...data.defects[0]!, id: "defect-closed", key: "BUG-2", status: "closed", linkIds: [] },
  ] });
  const closed = await closedSource.drill({
    query, drill: { id: "closed", label: "Closed", filter: { entity: "defect", basis: "current", status: "closed" } },
  });
  assert.deepEqual(closed.rows.map(({ key }) => key), ["BUG-2"]);
  await assert.rejects(source.drill({
    query,
    drill: { id: "manual", label: "Manual", filter: { entity: "test_case", basis: "current", type: "manual" } },
    cursor: tagged.nextCursor,
  }), /cursor scope mismatch/);
});

test("HTTP analytics source preserves exact run-item bucket filters and total", async () => {
  const calls: string[] = [];
  const http = { async get(path: string) {
    calls.push(path);
    return { data: [{ id: "item-1", projectId: "alpha", runId: "run-a",
      runKey: "RUN-A", runName: "Regression", runType: "regression",
      testCaseId: "case-a", testCaseKey: "A-1", revisionNo: 1,
      title: "Automated checkout", caseType: "automated", component: "Checkout",
      status: "failed", attemptNo: 1, eventAt: "2026-08-22T09:00:00.000Z",
      sortAt: "2026-08-22T09:00:00.000Z" }],
      meta: { limit: 25, hasMore: false, nextCursor: null,
        period: { preset: "custom", from: "2026-08-22T00:00:00.000Z",
          to: "2026-08-23T00:00:00.000Z" }, periodApplied: true, total: 1 } };
  } } as unknown as TmsHttpClient;
  const source = createHttpDashboardAnalyticsSource(http, data);
  const page = await source.drill({ query, drill: {
    id: "failed-bucket", label: "Failed", projectId: "alpha",
    window: { from: "2026-08-22T00:00:00.000Z", to: "2026-08-23T00:00:00.000Z" },
    filter: { entity: "run_item", status: "failed", component: "Checkout" },
  } });
  const url = new URL(calls[0]!, "https://falcon.test");
  assert.equal(url.pathname, "/dashboard-analytics/run-items");
  assert.deepEqual(Object.fromEntries(url.searchParams), { workspaceId: "workspace",
    projectId: "alpha", period: "custom", from: "2026-08-22T00:00:00.000Z",
    to: "2026-08-23T00:00:00.000Z", status: "failed", component: "Checkout",
    limit: "25" });
  assert.equal(page.total, 1);
  assert.equal(page.rows[0]?.key, "RUN-A · A-1");
});
