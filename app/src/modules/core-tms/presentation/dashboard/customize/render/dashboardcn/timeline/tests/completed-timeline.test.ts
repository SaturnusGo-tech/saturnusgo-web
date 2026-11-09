import assert from "node:assert/strict";
import { test } from "node:test";
import { completedBucket, completedRunDrill } from "../completed-timeline";

const start = "2026-11-01T00:00:00Z";
const end = "2026-11-08T00:00:00Z";

test("includes all recorded completion outcomes and excludes launches", () => {
  const point = { day: "2026-11-01", start, end, launched: 9, passed: 1, failed: 2, blocked: 0,
    incomplete: 3, not_started: 0, aborted: 1, passRate: 16.7 };
  const bucket = completedBucket(point);
  assert.equal(bucket.total, 7);
  assert.deepEqual(bucket.outcomes, [
    { key: "passed", count: 1 }, { key: "failed", count: 2 },
    { key: "incomplete", count: 3 }, { key: "aborted", count: 1 },
  ]);
  assert.deepEqual(completedRunDrill("Run results", bucket, "failed"), {
    id: `completed:${start}:failed`, label: "Run results", window: { from: start, to: end },
    filter: { entity: "run", basis: "completed", outcome: "failed" },
  });
});
