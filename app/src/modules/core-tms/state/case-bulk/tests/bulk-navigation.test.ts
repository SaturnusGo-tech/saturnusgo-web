import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { bulkNavigationHarness } from "./bulk-navigation-harness";

test("late bulk conflicts never cancel a pending project switch or notify its destination", async () => {
  for (const code of ["PRECONDITION_FAILED", "CONFLICT", "NOT_FOUND"] as const) {
    const app = bulkNavigationHarness();
    const mutation = app.render().bulkChangeCasePriority(["case-a"], "high");
    const navigation = app.requests.beginNavigation();
    app.writes[0].reject(new TmsApiError("changed", 412, null, code));
    assert.equal((await mutation).ok, false);
    assert.equal(navigation.signal.aborted, false, `${code} must not abort project B`);
    assert.deepEqual(app.refreshes, []); assert.deepEqual(app.notices, []);
    assert.equal(app.dataWrites(), 0); app.h.dispose();
  }
});

test("current bulk conflicts refresh collections without starting navigation and retain replay protection", async () => {
  const app = bulkNavigationHarness();
  const before = app.requests.captureNavigationGuard();
  const first = app.render().bulkChangeCasePriority(["case-a"], "high");
  app.writes[0].reject(new TmsApiError("changed", 412, null, "PRECONDITION_FAILED"));
  assert.equal((await first).ok, false);
  assert.deepEqual(app.refreshes, ["background:a"]); assert.equal(before(), true);
  assert.equal(app.notices.length, 1);
  const retry = app.render().bulkChangeCasePriority(["case-a"], "high");
  assert.equal(app.writes[0].key, app.writes[1].key);
  app.succeed(1); assert.equal((await retry).ok, true); app.h.dispose();
});

test("a stale successful mutation cannot reconcile another workspace or retry its selected detail", async () => {
  for (const change of ["project", "workspace", "view", "unmount"] as const) {
    const app = bulkNavigationHarness();
    const mutation = app.render().bulkChangeCasePriority(["case-a"], "high");
    if (change === "project") app.derived.project = { id: "b" };
    if (change === "workspace") app.state.data = { ...app.state.data, workspace: { ...app.state.data.workspace, id: "other" } };
    if (change === "view") app.state.view = "portfolios";
    if (change === "unmount") app.h.dispose(); else app.render();
    app.succeed(); assert.equal((await mutation).ok, false);
    assert.equal(app.dataWrites(), 0); assert.deepEqual(app.detailRetries, []); assert.deepEqual(app.notices, []);
    app.h.dispose();
  }
});

test("current success reconciles the selected project's revision and does not reload a newly selected case", async () => {
  const app = bulkNavigationHarness();
  const mutation = app.render().bulkChangeCasePriority(["case-a"], "high");
  app.state.selectedCaseId = "other-case"; app.render();
  app.succeed(); assert.equal((await mutation).ok, true);
  assert.equal(app.state.data.testCases[0].priority, "high");
  assert.equal(app.state.data.testCases[0].currentRevision, 2);
  assert.equal(app.state.data.testCases[0].revisionCount, 2);
  assert.deepEqual(app.detailRetries, []); assert.equal(app.notices.length, 1); app.h.dispose();
});

test("a project transition already in progress rejects bulk submission before sending a request", async () => {
  const app = bulkNavigationHarness();
  const navigation = app.requests.beginNavigation();
  assert.equal((await app.render().bulkChangeCaseLifecycle(["case-a"], "ready")).ok, false);
  assert.equal(app.writes.length, 0); assert.equal(navigation.signal.aborted, false); app.h.dispose();
});
