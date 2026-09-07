import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { impactApi } from "../data/impact-api";
import { ImpactOperations } from "../application/commands/impact-operation";
import type { ImpactCommand } from "../model/impact-types";
import { shouldRefreshImpact } from "../application/detail/impact-refresh";
import { analysis, repository, scope, storageFixture } from "./fixtures/impact-fixture";
test("analysis list and detail retain exact project/run context, pagination and concurrency ETag", async () => {
  const requests: URL[] = [];
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (input) => {
    const url = new URL(String(input)); requests.push(url);
    return new Response(JSON.stringify(url.pathname.endsWith("/analyses") ? { data: [analysis()], nextCursor: "analysis_old" } : { data: analysis() }),
      { headers: { etag: 'W/"impact-analysis:analysis_qa:v7"' } });
  } }));
  const controller = new AbortController();
  assert.equal((await api.list(scope, controller.signal, "analysis_before", "run_qa")).nextCursor, "analysis_old");
  assert.deepEqual(Object.fromEntries(requests[0].searchParams), { ...scope, before: "analysis_before", runId: "run_qa" });
  assert.equal((await api.detail(scope, "analysis_qa", controller.signal)).etag, '"impact-analysis:analysis_qa:v7"');
});
test("foreign project, mismatched analysis and mismatched linked run are rejected before presentation", async () => {
  for (const patch of [{ projectId: "other" }, { workspaceId: "other" }, { runId: "other" }]) {
    const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include",
      fetch: async () => new Response(JSON.stringify({ data: [analysis(patch)], nextCursor: null })) }));
    await assert.rejects(api.list(scope, new AbortController().signal, undefined, "run_qa"), /IMPACT_SCOPE_MISMATCH/);
  }
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include",
    fetch: async () => new Response(JSON.stringify({ data: analysis({ id: "other" }) })) }));
  await assert.rejects(api.detail(scope, "analysis_qa", new AbortController().signal), /IMPACT_SCOPE_MISMATCH/);
});
test("lost AI acceptance replays the original body, ETag and key after controller reconstruction", async () => {
  const packets: { body: string; etag: string | null; key: string | null }[] = [];
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (url, init) => {
    assert.equal(new URL(String(url)).pathname, "/api/v1/impact/analyses/analysis_qa/gaps/gap_1/generate");
    const headers = new Headers(init?.headers); packets.push({ body: String(init?.body), etag: headers.get("if-match"), key: headers.get("idempotency-key") });
    if (packets.length === 1) throw new TypeError("response lost after acceptance");
    return new Response(JSON.stringify({ data: analysis({ rowVersion: 8 }) }), { status: 202, headers: { etag: '"impact-analysis:analysis_qa:v8"' } });
  } }));
  const storage = storageFixture(); const owner = "operation-lost-ai";
  const first = new ImpactOperations(owner, storage, () => "same-key");
  const input = { action: "gaps/gap_1/generate" as const, body: { mode: "ai" as const } };
  const operation = first.begin(input, '"impact-analysis:analysis_qa:v7"');
  await assert.rejects(api.command(scope, "analysis_qa", operation.command, { ifMatch: operation.etag, idempotencyKey: operation.key }));
  const restored = new ImpactOperations(owner, storage, () => "wrong-new-key");
  const replay = restored.begin(input, '"impact-analysis:analysis_qa:v99"');
  await api.command(scope, "analysis_qa", replay.command, { ifMatch: replay.etag, idempotencyKey: replay.key });
  assert.deepEqual(packets[0], packets[1]); assert.equal(packets[1].key, "same-key");
  assert.throws(() => restored.begin({ action: "approve", body: {} }, "v100"), /UNRESOLVED/);
  restored.complete("wrong-key"); assert.ok(restored.pending()); restored.complete("same-key"); assert.equal(restored.pending(), null);
});
test("repository registration is one scoped PATCH using existing connection and explicit new-version precondition", async () => {
  let count = 0;
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (input, init) => {
    count++; const url = new URL(String(input)); assert.equal(url.pathname, "/api/v1/impact/repositories/repository_new");
    assert.deepEqual(Object.fromEntries(url.searchParams), scope); assert.equal(init?.method, "PATCH");
    assert.equal(new Headers(init?.headers).get("if-match"), '"impact-repository:repository_new:v0"');
    assert.deepEqual(JSON.parse(String(init?.body)), repository);
    return new Response(JSON.stringify({ data: { ...repository, ...scope, id: "repository_new", rowVersion: 1 } }));
  } }));
  await api.saveRepository(scope, "repository_new", repository, { ifMatch: '"impact-repository:repository_new:v0"' });
  assert.equal(count, 1);
});
test("manual scope and gap actions use the documented normal API, never change historical result endpoints", async () => {
  const calls: string[] = [];
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (input, init) => {
    calls.push(new URL(String(input)).pathname); assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("idempotency-key"), "operation-key");
    return new Response(JSON.stringify({ data: analysis() }));
  } }));
  const commands: ImpactCommand[] = [{ action: "scope", body: { caseIds: ["case_qa"] } }, { action: "approve", body: {} },
    { action: "gaps/gap_1/generate", body: { mode: "manual" } }, { action: "gaps/gap_1/acknowledge", body: { reason: "Covered by smoke" } }];
  for (const command of commands) {
    await api.command(scope, "analysis_qa", command, { ifMatch: "version", idempotencyKey: "operation-key" });
  }
  assert.equal(calls.length, 4); assert.ok(calls.every((path) => path.startsWith("/api/v1/impact/analyses/analysis_qa/")));
});
test("completed analysis keeps refreshing until pending CI finishes and independently follows draft generation", () => {
  assert.equal(shouldRefreshImpact(analysis({ status: "complete", buildStatus: "pending", runId: null })), true);
  assert.equal(shouldRefreshImpact(analysis({ status: "complete", buildStatus: "success" })), false);
  assert.equal(shouldRefreshImpact(analysis({ status: "failed", buildStatus: "failed" })), false);
  assert.equal(shouldRefreshImpact(analysis({ gapActions: [{ gapId: "gap", status: "generating", reason: "", testCaseId: null, errorCode: null }] })), true);
});
