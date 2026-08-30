import assert from "node:assert/strict";
import test from "node:test";
import type { Bootstrap, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { createDashboardSnapshot } from "../model/createDashboardSnapshot";

const progress = (passed: number, failed: number, blocked = 0, skipped = 0) => ({
  total: passed + failed + blocked + skipped,
  executed: passed + failed + blocked,
  percent: 100,
  counts: { passed, failed, blocked, skipped, not_run: 0, in_progress: 0 },
});

const run = (input: Partial<TestRunSummary> & Pick<TestRunSummary, "id" | "createdAt">): TestRunSummary => {
  const {
    id, createdAt, archivedAt = null, archivedBy = null, archiveReason = null, ...overrides
  } = input;
  return {
    id,
    createdAt,
    projectId: "project-1",
    key: id.toUpperCase(),
    name: id,
    description: "",
    type: "smoke",
    status: "completed",
    environment: { id: "env-1", key: "qa", name: "QA", baseUrl: "https://qa.test" },
    suiteId: null,
    build: "current",
    configuration: {},
    itemCount: 0,
    progress: progress(0, 0),
    startedAt: null,
    completedAt: null,
    archivedAt,
    archivedBy,
    archiveReason,
    ...overrides,
  };
};

const data: Bootstrap = {
  workspace: { id: "workspace-1", key: "workspace", slug: "workspace", name: "Workspace" },
  projects: [{ id: "project-1", key: "P1", name: "Project" }],
  environments: [],
  testCases: [
    {
      id: "case-1", projectId: "project-1", key: "TC-1", folderPath: "/", currentRevision: 1,
      title: "Current", type: "manual", lifecycle: "ready", priority: "high", component: "Core",
      ownerIdentityId: null, tags: [], estimatedMinutes: 5, revisionCount: 1, archivedAt: null,
      createdAt: "2026-08-10T10:00:00.000Z", updatedAt: "2026-08-10T10:00:00.000Z",
    },
    {
      id: "case-2", projectId: "project-1", key: "TC-2", folderPath: "/", currentRevision: 1,
      title: "Archived", type: "manual", lifecycle: "ready", priority: "low", component: "Core",
      ownerIdentityId: null, tags: [], estimatedMinutes: null, revisionCount: 1,
      archivedAt: "2026-08-20T10:00:00.000Z", createdAt: "2026-08-20T10:00:00.000Z",
      updatedAt: "2026-08-20T10:00:00.000Z",
    },
  ],
  suites: [],
  runs: [
    run({
      id: "run-1", createdAt: "2026-08-15T09:00:00.000Z", startedAt: "2026-08-16T09:00:00.000Z",
      completedAt: "2026-08-17T09:00:00.000Z", progress: progress(3, 1, 1, 2),
    }),
    run({
      id: "run-2", createdAt: "2026-07-01T09:00:00.000Z", startedAt: "2026-07-02T09:00:00.000Z",
      completedAt: "2026-08-02T09:00:00.000Z", progress: progress(2, 2),
      archivedAt: "2026-08-20T09:00:00.000Z", archivedBy: "identity-1", archiveReason: "History",
    }),
  ],
  defects: [
    {
      id: "defect-1", projectId: "project-1", key: "BUG-1", title: "Open", description: "",
      severity: "high", priority: "high", status: "open", reproducibility: "always",
      assigneeIdentityId: null, component: "Core", integrationTarget: null, externalIssue: null,
      labels: [], runId: null, runItemId: null,
      stepId: null, expectedResult: "", actualResult: "", attachmentIds: [], linkIds: [],
      createdAt: "2026-08-18T09:00:00.000Z",
    },
  ],
  externalLinks: [], dashboards: [],
  activity: [
    { id: "event-1", actor: "qa", action: "run.completed", entityKey: "RUN-1", createdAt: "2026-08-17T09:00:00.000Z" },
  ],
  meta: {
    generatedAt: "2026-08-29T09:00:00.000Z",
    apiVersion: "v1",
    authorization: { role: "workspace_admin", capabilities: ["run:archive"] },
  },
};

test("dashboard snapshot uses only authoritative project records in its 30-day window", () => {
  const result = createDashboardSnapshot(data, "project-1");
  assert.equal(result.cases, 1);
  assert.equal(result.casesCreated, 1);
  assert.equal(result.runsStarted, 2);
  assert.equal(result.runsStartedRecent, 1);
  assert.equal(result.failures, 3);
  assert.equal(result.failuresRecent, 3);
  assert.equal(result.openDefects, 1);
  assert.equal(result.passRate, 55.6);
  assert.equal(result.trend.length, 30);
  assert.equal(result.trend.find(({ day }) => day === "2026-08-16")?.runs, 1);
  assert.equal(result.trend.find(({ day }) => day === "2026-08-17")?.failures, 1);
  assert.deepEqual(result.distribution.map(({ value }) => value), [3, 1, 2]);
});
