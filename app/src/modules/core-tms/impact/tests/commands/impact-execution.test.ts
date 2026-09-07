import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { impactApi } from "../../data/impact-api";
import { ImpactOperations } from "../../application/commands/impact-operation";
import { executeImpactOperation } from "../../application/commands/execute-impact-operation";
import { analysis, scope, storageFixture } from "../fixtures/impact-fixture";
test("accepted operation with failed refresh retains key until the same request and a fresh GET complete", async () => {
  let writes = 0; let reads = 0; const keys: string[] = [];
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (_, init) => {
    if (init?.method === "POST") { writes++; keys.push(new Headers(init.headers).get("idempotency-key")!); }
    else if (++reads === 1) return new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Read denied" } }), { status: 403 });
    return new Response(JSON.stringify({ data: analysis({ rowVersion: 8 }) }), { headers: { etag: "v8" } });
  } }));
  const journal = new ImpactOperations("accept-refresh-failed", storageFixture(), () => "stable-key");
  const operation = journal.begin({ action: "approve", body: {} }, "v7"); const accepted: number[] = [];
  const input = { scope, id: "analysis_qa", operation, signal: new AbortController().signal, owns: () => true };
  await assert.rejects(executeImpactOperation(input, { api, journal, accept: (value) => { accepted.push(value.data.rowVersion); } }));
  assert.equal(journal.pending()?.key, "stable-key");
  await executeImpactOperation(input, { api, journal, accept: (value) => { accepted.push(value.data.rowVersion); } });
  assert.equal(writes, 2); assert.deepEqual(keys, ["stable-key", "stable-key"]); assert.equal(journal.pending(), null);
  assert.deepEqual(accepted, [8, 8, 8]);
});
test("a late response after owner change cannot update the next project and preserves replay identity", async () => {
  let owns = true; let applied = false; let reads = 0;
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (_, init) => {
    if (init?.method === "POST") owns = false; else reads++;
    return new Response(JSON.stringify({ data: analysis() }));
  } }));
  const journal = new ImpactOperations("owner-change", storageFixture(), () => "owner-key");
  const operation = journal.begin({ action: "approve", body: {} }, "v7");
  await assert.rejects(executeImpactOperation({ scope, id: "analysis_qa", operation, signal: new AbortController().signal, owns: () => owns },
    { api, journal, accept: () => { applied = true; } }), { name: "AbortError" });
  assert.equal(applied, false); assert.equal(reads, 0); assert.equal(journal.pending()?.key, "owner-key"); journal.complete("owner-key");
});
test("412 before acceptance requires a new review, without silently submitting a new scope", async () => {
  let calls = 0;
  const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async () => {
    calls++; return new Response(JSON.stringify({ error: { code: "PRECONDITION_FAILED", message: "changed" } }), { status: 412 });
  } }));
  const journal = new ImpactOperations("stale-scope", storageFixture(), () => "stale-key");
  const operation = journal.begin({ action: "scope", body: { caseIds: ["case_old"] } }, "v7");
  await assert.rejects(executeImpactOperation({ scope, id: "analysis_qa", operation, signal: new AbortController().signal, owns: () => true },
    { api, journal, accept: () => { throw new Error("must not apply"); } }));
  assert.equal(calls, 1); assert.equal(journal.pending(), null);
});
test("definitive 422 and 403 rejection unlock a corrected command while retryable responses retain identity", async () => {
  for (const [status, code, retained] of [[422, "VALIDATION_ERROR", false], [403, "FORBIDDEN", false], [409, "BUILD_NOT_SUCCESSFUL", false],
    [429, "QUOTA_EXCEEDED", true], [503, "INTERNAL_ERROR", true], [409, "IDEMPOTENCY_IN_PROGRESS", true]] as const) {
    const api = impactApi(createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async () =>
      new Response(JSON.stringify({ error: { code, message: "request rejected" } }), { status }) }));
    const journal = new ImpactOperations(`rejected-${code}`, storageFixture(), () => "rejected-key");
    const operation = journal.begin({ action: "scope", body: { caseIds: ["invalid_case"] } }, "v7");
    await assert.rejects(executeImpactOperation({ scope, id: "analysis_qa", operation, signal: new AbortController().signal, owns: () => true },
      { api, journal, accept: () => { throw new Error("must not apply"); } }));
    assert.equal(Boolean(journal.pending()), retained);
    if (!retained) assert.doesNotThrow(() => journal.begin({ action: "approve", body: {} }, "v9"));
    journal.complete("rejected-key");
  }
});
