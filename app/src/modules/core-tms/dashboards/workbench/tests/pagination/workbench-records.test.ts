import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { DashboardWorkbenchController } from "../../application/DashboardWorkbenchController";
import { createHttpDashboardWorkbenchSource } from "../../data/http-workbench-source";
import type { WorkbenchKind, WorkbenchRecordsQuery } from "../../model/workbench";
import { WorkbenchReadError } from "../../model/workbench-error";
import { workbenchFixture, workbenchQuery } from "../fixtures/workbench-fixture";

type Envelope = components["schemas"]["DashboardWorkbenchRecordPageEnvelope"];
const selection: WorkbenchRecordsQuery = { ...workbenchQuery, kind: "blockedItems", limit: 25 };
function page(query: WorkbenchRecordsQuery = selection): Envelope {
  const summary = workbenchFixture(query);
  return { data: { workspaceId: summary.workspaceId, projectId: summary.projectId, generatedAt: summary.generatedAt,
    asOf: summary.asOf, filters: summary.filters, kind: query.kind, items: summary[query.kind].items,
    total: summary[query.kind].total }, meta: { limit: query.limit, hasMore: false, nextCursor: null } };
}
function client(response: (url: URL, init?: RequestInit) => Response) {
  return createHttpDashboardWorkbenchSource(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1",
    production: false, accessToken: async () => "fixture-session",
    fetch: async (input, init) => response(new URL(String(input)), init) }));
}
const json = (value: unknown) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });

test("records request binds exact scope, filters, kind and opaque cursor to a cancellable GET", async () => {
  const cursor = "opaque/+/cursor:=abc";
  const query = { ...selection, cursor };
  const controller = new AbortController();
  const source = client((url, init) => {
    assert.equal(url.pathname, "/api/v1/workspaces/workspace-a/dashboard-analytics/workbench/records");
    assert.deepEqual(Object.fromEntries(url.searchParams), { projectId: "project-a", environmentId: "env-a",
      buildReference: "release/a + #7", kind: "blockedItems", limit: "25", cursor });
    assert.equal(init?.signal, controller.signal);
    assert.equal(init?.method, "GET");
    return json(page(query));
  });
  const result = await source.records(query, controller.signal);
  assert.equal(result.queue.rows[0]?.navigation.runItemId, "item-active");
  assert.equal(result.queue.rows[0]?.navigation.runId, "run-active");
});

test("all eight drill kinds use matching record mappings and preserve total", async () => {
  const kinds: WorkbenchKind[] = ["activeRuns", "readyForRetest", "openDefects", "blockedItems",
    "notRunItems", "inProgressItems", "outdatedItems", "runsWithoutBuild"];
  for (const kind of kinds) {
    const query = { ...selection, kind };
    const response = page(query);
    const source = client(() => json(response));
    const result = await source.records(query);
    assert.equal(result.queue.total, response.data.total);
    assert.equal(result.queue.rows.length, response.data.items.length);
    if (kind === "readyForRetest") assert.equal(result.queue.rows[0]?.navigation.id, "defect-a");
    if (kind === "outdatedItems") assert.equal(result.queue.rows[0]?.navigation.status, "passed");
  }
});

test("records rejects another kind/context, wrong row shape and nonadvancing cursor", async () => {
  for (const corrupt of [
    (value: Envelope) => { value.data.kind = "activeRuns"; },
    (value: Envelope) => { value.data.filters.environmentId = "env-other"; },
    (value: Envelope) => { value.data.items[0]!.buildReference = "other-build"; },
    (value: Envelope) => { value.data.items = workbenchFixture().activeRuns.items; },
    (value: Envelope) => { value.meta.hasMore = true; value.meta.nextCursor = null; },
    (value: Envelope) => { value.meta.hasMore = true; value.meta.nextCursor = "same-cursor"; },
  ]) {
    const envelope = page(); corrupt(envelope);
    const source = client(() => json(envelope));
    await assert.rejects(source.records({ ...selection, cursor: "same-cursor" }), WorkbenchReadError);
  }
});

test("controller and real HTTP adapter reach record 101 without duplicates or a silent cap", async () => {
  const records = Array.from({ length: 101 }, (_, index) => ({ ...workbenchFixture().activeRuns.items[0]!,
    id: `run-${index}`, key: `QA-TR-${index + 1}` }));
  const calls: string[] = [];
  const source = client((url) => {
    if (!url.pathname.endsWith("/records")) return json({ data: workbenchFixture() });
    const cursor = url.searchParams.get("cursor");
    calls.push(cursor ?? "first");
    const offset = cursor ? Number(cursor.slice("opaque/+:=".length)) : 0;
    const next = offset + 25 < records.length ? `opaque/+:=${offset + 25}` : null;
    const response = page({ ...selection, kind: "activeRuns" });
    response.data.items = records.slice(offset, offset + 25);
    response.data.total = records.length;
    response.meta = { limit: 25, hasMore: next !== null, nextCursor: next };
    return json(response);
  });
  const controller = new DashboardWorkbenchController(source);
  controller.configure({ workspaceId: selection.workspaceId, projectId: selection.projectId }, {
    environmentId: selection.environmentId, buildReference: selection.buildReference,
  });
  controller.openDrill("activeRuns");
  await new Promise<void>((resolve) => setImmediate(resolve));
  while (controller.getState().drill?.page?.nextCursor) await controller.loadMore();
  const result = controller.getState().drill?.page;
  assert.equal(result?.queue.rows.length, 101);
  assert.equal(new Set(result?.queue.rows.map((row) => row.navigation.runId)).size, 101);
  assert.equal(result?.queue.rows[100]?.navigation.runId, "run-100");
  assert.equal(result?.queue.total, 101);
  assert.equal(result?.nextCursor, null);
  assert.deepEqual(calls, ["first", "opaque/+:=25", "opaque/+:=50", "opaque/+:=75", "opaque/+:=100"]);
});
