import assert from "node:assert/strict";
import { test } from "node:test";
import { defectInsightView } from "../insight-view";

void test("a stacked segment preserves both dimensions and the report window in its drill", () => {
  const period = { from: "2026-11-01T00:00:00.000Z", to: "2026-11-07T00:00:00.000Z" };
  const result = defectInsightView({ total: 4, groupCount: 1, truncated: false, period,
    periodApplied: true, groups: [{ key: null, label: null, count: 4,
      segments: [{ key: "open", count: 3 }, { key: "closed", count: 1 }] }] },
  { query: { workspaceId: "w", period: "7d" }, basis: "reported", groupBy: "assignee", segmentBy: "status" }, "en");
  const group = result.groups[0];
  assert.equal(group.label, "Unassigned");
  assert.deepEqual(group.cells.find(cell => cell.key === "open")?.drill?.filter,
    { entity: "defect", basis: "reported", unassigned: true, status: "open" });
  assert.deepEqual(group.drill?.window, period);
  assert.equal(result.total, 4);
});
