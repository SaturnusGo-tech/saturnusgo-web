import assert from "node:assert/strict";
import test from "node:test";
import { runProgress } from "../rows/progress/model";

test("work queue reports finalized results separately from pass rate and ongoing work", () => {
  const progress = runProgress({ total: 10, passed: 3, failed: 1, blocked: 1, skipped: 1, inProgress: 1, notRun: 3 });
  assert.equal(progress.completed, 6);
  assert.equal(progress.percent, 60);
  assert.deepEqual(progress.segments.map(({ kind, percent }) => [kind, percent]), [
    ["passed", 30], ["failed", 10], ["blocked", 10], ["skipped", 10], ["inProgress", 10], ["notRun", 30],
  ]);
  assert.equal(progress.segments.reduce((sum, segment) => sum + segment.percent, 0), 100);
});

test("empty and unstarted runs never produce NaN or invented completion", () => {
  const empty = runProgress({ total: 0, passed: 0, failed: 0, blocked: 0, skipped: 0, inProgress: 0, notRun: 0 });
  assert.deepEqual(empty, { total: 0, completed: 0, percent: 0, segments: [] });
  const unstarted = runProgress({ total: 5, passed: 0, failed: 0, blocked: 0, skipped: 0, inProgress: 0, notRun: 5 });
  assert.equal(unstarted.completed, 0);
  assert.equal(unstarted.percent, 0);
  assert.deepEqual(unstarted.segments, [{ kind: "notRun", count: 5, percent: 100 }]);
});

test("a finished single-check run displays the complete authoritative result", () => {
  const finished = runProgress({ total: 1, passed: 1, failed: 0, blocked: 0, skipped: 0, inProgress: 0, notRun: 0 });
  assert.equal(finished.completed, 1);
  assert.equal(finished.percent, 100);
  assert.deepEqual(finished.segments, [{ kind: "passed", count: 1, percent: 100 }]);
});
