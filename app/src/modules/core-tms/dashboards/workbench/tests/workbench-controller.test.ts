import assert from "node:assert/strict";
import test from "node:test";
import { DashboardWorkbenchController } from "../application/DashboardWorkbenchController";
import { mapDashboardWorkbench } from "../data/workbench-mapper";
import type { WorkbenchKind, WorkbenchPage, WorkbenchQuery, WorkbenchSnapshot } from "../model/workbench";
import { WorkbenchReadError } from "../model/workbench-error";
import { workbenchFixture, workbenchQuery } from "./fixtures/workbench-fixture";

function harness() {
  const calls: Array<{ query: WorkbenchQuery & { kind?: WorkbenchKind; cursor?: string }; signal?: AbortSignal;
    resolve: (value: WorkbenchSnapshot | WorkbenchPage) => void; reject: (reason: unknown) => void }> = [];
  const enqueue = <T extends WorkbenchSnapshot | WorkbenchPage>(query: typeof calls[number]["query"], signal?: AbortSignal) =>
    new Promise<T>((resolve, reject) => { calls.push({ query, signal, resolve: (value) => resolve(value as T), reject }); });
  const controller = new DashboardWorkbenchController({ read: (query, signal) => enqueue<WorkbenchSnapshot>(query, signal),
    records: (query, signal) => enqueue<WorkbenchPage>(query, signal) });
  const fulfill = (index: number) => {
    const call = calls[index]!;
    const snapshot = mapDashboardWorkbench(workbenchFixture(call.query), call.query);
    call.resolve(call.query.kind ? { queue: snapshot.queues[call.query.kind], generatedAt: snapshot.generatedAt,
      asOf: snapshot.asOf, nextCursor: snapshot.queues[call.query.kind].truncated ? "cursor-next" : null } : snapshot);
  };
  return { controller, calls, fulfill };
}
const scope = { workspaceId: workbenchQuery.workspaceId, projectId: workbenchQuery.projectId };
const filters = { environmentId: workbenchQuery.environmentId, buildReference: workbenchQuery.buildReference };
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test("scope change aborts and clears old rows; ignored cancellation cannot restore them", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters);
  controller.configure({ ...scope, projectId: "project-b" }, filters);
  assert.equal(calls[0]?.signal?.aborted, true);
  assert.equal(controller.getState().snapshot, null);
  fulfill(1); await tick();
  assert.equal(controller.getState().snapshot?.scope.projectId, "project-b");
  fulfill(0); await tick();
  assert.equal(controller.getState().snapshot?.scope.projectId, "project-b");
});

test("rapid context changes and refreshes preserve only the newest request", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters);
  controller.configure(scope, { ...filters, buildReference: "release-b" });
  void controller.refresh();
  assert.equal(calls[1]?.signal?.aborted, true);
  fulfill(2); await tick();
  calls[1]!.reject(new Error("Late network failure")); fulfill(0); await tick();
  assert.equal(controller.getState().snapshot?.filters.buildReference, "release-b");
  assert.equal(controller.getState().error, null);
});

test("failed refresh retains labeled snapshot and retry recovers without zeroing metrics", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters); fulfill(0); await tick();
  void controller.refresh();
  calls[1]!.reject(new WorkbenchReadError({ kind: "unavailable", requestId: "request-1" })); await tick();
  assert.equal(controller.getState().snapshot?.counts.activeRuns, 23);
  assert.deepEqual(controller.getState().error, { kind: "unavailable", requestId: "request-1" });
  void controller.refresh(); fulfill(2); await tick();
  assert.equal(controller.getState().error, null);
  assert.equal(controller.getState().loading, false);
});

test("drill uses the exact current filters and bounded detail, closes against late responses", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters); fulfill(0); await tick();
  controller.openDrill("blockedItems");
  assert.deepEqual(calls[1]?.query, { ...scope, ...filters, kind: "blockedItems", limit: 25 });
  controller.openDrill("readyForRetest");
  assert.equal(calls[1]?.signal?.aborted, true);
  fulfill(1); await tick();
  assert.equal(controller.getState().drill?.kind, "readyForRetest");
  assert.equal(controller.getState().drill?.page, null);
  fulfill(2); await tick();
  assert.equal(controller.getState().drill?.page?.queue.total, 1);
  void controller.retryDrill(); controller.closeDrill(); fulfill(3); await tick();
  assert.equal(controller.getState().drill, null);
});

test("permission failure clears all visible resource data and aborts concurrent drill", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters); fulfill(0); await tick();
  controller.openDrill("openDefects"); void controller.refresh();
  calls[2]!.reject(new WorkbenchReadError({ kind: "permission", requestId: "request-2" })); await tick();
  assert.equal(controller.getState().snapshot, null);
  assert.equal(controller.getState().drill, null);
  assert.equal(calls[1]?.signal?.aborted, true);
  fulfill(1); await tick();
  assert.equal(controller.getState().snapshot, null);
});

test("drill auth loss cancels in-flight summary; reset permits same-scope remount", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters); controller.openDrill("activeRuns");
  calls[1]!.reject(new WorkbenchReadError({ kind: "authentication", requestId: null })); await tick();
  assert.equal(calls[0]?.signal?.aborted, true);
  fulfill(0); await tick();
  assert.equal(controller.getState().snapshot, null);
  assert.equal(controller.getState().error?.kind, "authentication");
  controller.reset();
  assert.equal(controller.getState().key, "");
  controller.configure(scope, filters); fulfill(2); await tick();
  assert.equal(controller.getState().snapshot?.counts.activeRuns, 23);
});

test("load more retries the same cursor, de-duplicates live overlap, and reaches later records", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters); fulfill(0); await tick();
  controller.openDrill("activeRuns"); fulfill(1); await tick();
  const firstPage = controller.getState().drill!.page!;
  void controller.loadMore(); void controller.loadMore();
  assert.equal(calls.length, 3);
  assert.equal(calls[2]?.query.cursor, "cursor-next");
  calls[2]!.reject(new Error("network interrupted")); await tick();
  assert.equal(controller.getState().drill?.page?.queue.rows.length, 1);
  void controller.retryDrill();
  assert.equal(calls[3]?.query.cursor, calls[2]?.query.cursor);
  const row = firstPage.queue.rows[0]!;
  calls[3]!.resolve({ ...firstPage, nextCursor: null, queue: { ...firstPage.queue, truncated: false,
    rows: [row, { ...row, navigation: { ...row.navigation, id: "run-101", runId: "run-101", key: "QA-TR-101" } }] } });
  await tick();
  assert.deepEqual(controller.getState().drill?.page?.queue.rows.map((item) => item.navigation.id), ["run-active", "run-101"]);
  assert.equal(controller.getState().drill?.page?.queue.total, 23);
  assert.equal(controller.getState().drill?.page?.nextCursor, null);
  await controller.loadMore(); assert.equal(calls.length, 4);
});

test("changing context cancels paginated detail and never carries its cursor to another query", async () => {
  const { controller, calls, fulfill } = harness();
  controller.configure(scope, filters); fulfill(0); await tick();
  controller.openDrill("activeRuns"); fulfill(1); await tick();
  void controller.loadMore();
  controller.configure(scope, { ...filters, environmentId: "env-b" });
  assert.equal(calls[2]?.signal?.aborted, true);
  assert.equal(controller.getState().drill, null);
  fulfill(2); fulfill(3); await tick();
  controller.openDrill("activeRuns");
  assert.equal(calls[4]?.query.cursor, undefined);
  assert.equal(calls[4]?.query.environmentId, "env-b");
});
