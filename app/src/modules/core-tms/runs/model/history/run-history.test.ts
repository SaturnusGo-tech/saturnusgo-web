import assert from "node:assert/strict";
import test from "node:test";
import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { defaultWorkingRun, isHistoricalRunChoice, nextRunAfterFinish } from "./run-history";
const run = (id: string, status: TestRunSummary["status"], date = "2026-09-13", archivedAt: string | null = null) =>
  ({ id, status, createdAt: date, archivedAt, projectId: "project" } as TestRunSummary);

test("defaults exclude completed, aborted and explicitly archived runs, including legacy completed records", () => {
  const history = [run("complete", "completed"), run("abort", "aborted"), run("archive", "active", undefined, "2026-09-13")];
  assert.equal(defaultWorkingRun(history), null);
  assert.equal(defaultWorkingRun([...history, run("paused", "paused", "2026-09-11"), run("draft", "draft", "2026-09-12")])?.id, "draft");
  assert.equal(defaultWorkingRun([run("active", "active")], "another-project"), null);
});

test("a mixed batch stays current until every constituent run becomes historical", () => {
  const completed = run("a", "completed"); const active = run("b", "active");
  assert.equal(isHistoricalRunChoice({ runs: [completed, active] }), false);
  assert.equal(isHistoricalRunChoice({ runs: [completed, run("b", "completed")] }), true);
  assert.equal(isHistoricalRunChoice({ runs: [] }), false);
});

test("completion chooses the next working run in menu order and never the old terminal results", () => {
  const a = run("a", "active"); const b = run("b", "paused"); const c = run("c", "draft");
  const choices = [{ runs: [a, b] }, { runs: [run("old", "completed")] }, { runs: [c] }];
  assert.equal(nextRunAfterFinish(choices, [run("a", "completed"), run("b", "completed")])?.id, "c");
  assert.equal(nextRunAfterFinish(choices, [run("a", "completed")])?.id, "b");
  assert.equal(nextRunAfterFinish(choices.slice(0, 2), [run("a", "completed"), run("b", "completed")]), null);
});
