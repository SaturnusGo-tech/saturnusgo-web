import assert from "node:assert/strict";
import { test } from "node:test";
import type { DashboardSnapshot } from "../../../../../../../dashboards/model/dashboard-analytics";
import { sliceDistribution } from "../dashboardcn-slices";

const summary: DashboardSnapshot = {
  generatedAt: "2026-11-07T12:00:00.000Z", query: { workspaceId: "w", projectId: "p", period: "7d" },
  metrics: { currentCases: 3, casesCreated: 1, currentDefects: 5, openDefects: 4,
    reportedDefects: 2, linkedDefects: 1, passRate: null, activeRuns: 0, completedRuns: 0,
    runsLaunched: 0, passedRuns: 0 },
  caseTypes: [{ key: "manual", label: "manual", value: 3, drill: { id: "cases:type:manual",
    label: "manual", filter: { entity: "test_case", basis: "current", type: "manual" } } }],
  defects: [{ key: "open", label: "open", value: 4, drill: { id: "defects:status:open",
    label: "open", filter: { entity: "defect", basis: "current", status: "open" } } }],
  trend: [], runOutcomes: [], tags: [], hotspots: [], dataNotes: [],
};

void test("defect buckets use the current status while related lists have their own basis", () => {
  const { all, segments, related } = sliceDistribution(summary, "defects", "current");
  assert.equal(all.count, 5);
  assert.deepEqual(segments[0]?.drill.filter, { entity: "defect", basis: "current", status: "open" });
  assert.deepEqual(related.map(({ count, drill }) => [count, drill.filter]), [
    [1, { entity: "defect", basis: "current", hasLink: true }],
    [2, { entity: "defect", basis: "reported" }],
  ]);
});

void test("created case selection never displays the current counts on an older summary", () => {
  const created = sliceDistribution(summary, "types", "created");
  assert.equal(created.all.count, 1);
  assert.equal(created.segments[0]?.count, undefined);
  assert.deepEqual(created.segments[0]?.drill.filter, { entity: "test_case", basis: "created", type: "manual" });
  const createdCaseTypes: DashboardSnapshot["caseTypes"] = [{ key: "manual", label: "manual", value: 1,
    drill: { id: "cases:created:type:manual", label: "manual", filter: { entity: "test_case", basis: "created", type: "manual" } } }];
  assert.equal(sliceDistribution({ ...summary, createdCaseTypes }, "types", "created").segments[0]?.count, 1);
});
