import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createHttpDashboardWorkbenchSource } from "../data/http-workbench-source";
import { WorkbenchReadError } from "../model/workbench-error";
import { workbenchFixture, workbenchQuery } from "./fixtures/workbench-fixture";

function httpFixture(reply: () => Response) {
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  const http = createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", production: false,
    accessToken: async () => "fixture-session", fetch: async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return reply();
    } });
  return { source: createHttpDashboardWorkbenchSource(http), calls };
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json" },
});

test("workbench HTTP uses scoped current context without leaking historical period", async () => {
  const fixture = workbenchFixture();
  const { source, calls } = httpFixture(() => json({ data: fixture }));
  const controller = new AbortController();
  const snapshot = await source.read(workbenchQuery, controller.signal);
  assert.equal(calls[0]?.url.pathname, "/api/v1/workspaces/workspace-a/dashboard-analytics/workbench");
  assert.deepEqual(Object.fromEntries(calls[0]!.url.searchParams), {
    projectId: "project-a", environmentId: "env-a", buildReference: "release/a + #7", limit: "20",
  });
  assert.equal(calls[0]?.init?.signal, controller.signal);
  assert.equal(calls[0]?.init?.method, "GET");
  assert.equal(calls[0]?.init?.cache, "no-store");
  assert.deepEqual(snapshot.counts, fixture.counts);
  assert.deepEqual(snapshot.freshness, fixture.freshness);
  assert.equal(snapshot.queues.activeRuns.rows.length, 1);
  assert.equal(snapshot.queues.activeRuns.total, 23);
  assert.equal(snapshot.queues.activeRuns.truncated, true);
});

test("item and retest navigation keeps exact server project, run, item and occurrence identity", async () => {
  const { source } = httpFixture(() => json({ data: workbenchFixture() }));
  const snapshot = await source.read(workbenchQuery);
  const blocked = snapshot.queues.blockedItems.rows[0]!;
  assert.equal(blocked.navigation.id, "item-active");
  assert.equal(blocked.navigation.runItemId, "item-active");
  assert.equal(blocked.navigation.runId, "run-active");
  assert.equal(blocked.navigation.projectId, "project-a");
  assert.equal(blocked.navigation.key, "QA-TR-1 · QA-TC-1");
  assert.equal(blocked.attemptNo, 2);
  const retest = snapshot.queues.readyForRetest.rows[0]!.navigation;
  assert.equal(retest.entity, "defect");
  assert.equal(retest.id, "defect-a");
  assert.equal(retest.runId, "run-completed-source");
  assert.equal(retest.runItemId, "item-failed-source");
  const outdated = snapshot.queues.outdatedItems.rows[0]!;
  assert.equal(outdated.navigation.status, "passed");
  assert.equal(outdated.snapshotRevisionNo, 1);
  assert.equal(outdated.currentRevisionNo, 3);
});

test("workspace context omits filters and retains bounded choices rather than inventing values", async () => {
  const query = { workspaceId: "workspace-a", environmentId: "", buildReference: "", limit: 100 };
  const fixture = workbenchFixture(query);
  fixture.contextChoices.environments.truncated = true;
  fixture.contextChoices.environments.total = 101;
  const { source, calls } = httpFixture(() => json({ data: fixture }));
  const snapshot = await source.read(query);
  assert.deepEqual(Object.fromEntries(calls[0]!.url.searchParams), { limit: "100" });
  assert.equal(snapshot.scope.projectId, undefined);
  assert.deepEqual(snapshot.filters, { environmentId: "", buildReference: "" });
  assert.equal(snapshot.choices.environmentsTruncated, true);
  assert.equal(snapshot.choices.environments[0]?.projectName, "Project A");
  assert.equal(snapshot.queues.openDefects.rows[1]?.navigation.runId, undefined);
});

test("workbench rejects wrong envelope, record tenant/project, filter and malformed date before rendering", async () => {
  for (const corrupt of [
    (value: ReturnType<typeof workbenchFixture>) => { value.workspaceId = "other"; },
    (value: ReturnType<typeof workbenchFixture>) => { value.activeRuns.items[0]!.workspaceId = "other"; },
    (value: ReturnType<typeof workbenchFixture>) => { value.readyForRetest.items[0]!.projectId = "other"; },
    (value: ReturnType<typeof workbenchFixture>) => { value.filters.buildReference = "other"; },
    (value: ReturnType<typeof workbenchFixture>) => { value.blockedItems.items[0]!.updatedAt = "invalid"; },
  ]) {
    const value = workbenchFixture(); corrupt(value);
    const { source } = httpFixture(() => json({ data: value }));
    await assert.rejects(source.read(workbenchQuery), WorkbenchReadError);
  }
});

test("authentication, permission, scope and retryable failures stay explicit with no bootstrap fallback", async () => {
  for (const [status, code, kind] of [[401, "AUTHENTICATION_REQUIRED", "authentication"],
    [403, "FORBIDDEN", "permission"], [404, "NOT_FOUND", "scope"],
    [422, "ANALYTICS_SCOPE_TOO_LARGE", "scopeTooLarge"],
    [503, "ANALYTICS_TEMPORARILY_UNAVAILABLE", "unavailable"], [404, "HTTP_ERROR", "error"]] as const) {
    const { source, calls } = httpFixture(() => json({ error: { code, message: "Failure", requestId: "request-safe" } }, status));
    await assert.rejects(source.read(workbenchQuery), (error: unknown) => {
      assert.ok(error instanceof WorkbenchReadError);
      assert.deepEqual(error.failure, { kind, requestId: "request-safe" }); return true;
    });
    assert.equal(calls.length, 1);
  }
});

test("aborted HTTP fulfillment cannot return an obsolete workbench snapshot", async () => {
  const controller = new AbortController();
  const { source } = httpFixture(() => { controller.abort(); return json({ data: workbenchFixture() }); });
  await assert.rejects(source.read(workbenchQuery, controller.signal), { name: "AbortError" });
});
