import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createExecutionDataClient } from "../../data/execution/execution-client";
test("attempt manifest is scoped to immutable attempt and strips secret material", async () => {
  let requested = "";
  const http = createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async url => {
    requested = String(url);
    return new Response(JSON.stringify({ data: { id: "snapshot-1", runId: "run", runItemId: "item", attemptNo: 2, caseId: "case", caseRevision: 3, environmentId: "env", preparedAt: "2026-11-14T00:00:00Z", sources: [{ alias: "admin", sourceType: "CREDENTIAL", id: "credential", name: "Admin", versionId: "secret-v2", fields: [{ key: "password", type: "String", secret: true, value: "never-retain" }] }] } }));
  }) as typeof fetch });
  const result = await createExecutionDataClient(http, "project").manifest({ runId: "run", itemId: "item", attemptNo: 2 }, new AbortController().signal);
  assert.equal(requested, "https://falcon.example.test/api/v1/projects/project/test-runs/run/items/item/attempts/2/test-data");
  assert.equal(result?.executionId, "snapshot-1"); assert.equal(result?.sources[0].versionId, "secret-v2");
  assert.equal(result?.sources[0].fields[0].value, undefined); assert.equal(JSON.stringify(result).includes("never-retain"), false);
});
test("legacy attempt has no manifest and does not produce a fabricated empty snapshot", async () => {
  const http = createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async () => new Response('{"data":null}')) as typeof fetch });
  assert.equal(await createExecutionDataClient(http, "project").manifest({ runId: "r", itemId: "i", attemptNo: 1 }, new AbortController().signal), null);
});
test("existing case validation supplies the owned revision context while new drafts omit it", async () => {
  const requests: unknown[] = [];
  const http = createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async (_url, init) => {
    requests.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ data: { valid: true, errors: [], warnings: [], variables: [], referencedResources: [] } }));
  }) as typeof fetch });
  const client = createExecutionDataClient(http, "project"), signal = new AbortController().signal;
  const actualSteps = [{ id: "step", action: "Enter value", expectedResult: "Accepted", order: 1, testData: "Legacy", required: true, attachmentIds: [], sharedStepId: null }];
  await client.validate([], actualSteps, signal, { caseId: "case", revision: 7 });
  await client.validate([], [], signal);
  assert.deepEqual(requests, [{ bindings: [], steps: [{ id: "step", action: "Enter value", expectedResult: "Accepted" }], caseId: "case", revision: 7 }, { bindings: [], steps: [] }]);
});
test("binding field validation returns actionable findings instead of a request/access failure", async () => {
  const http = createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async () =>
    new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Request validation failed", requestId: "req-alias",
      details: [{ field: "bindings.0.alias", code: "invalid_format", message: "Request field is invalid." }] } }), { status: 400 })) as typeof fetch });
  for (const sourceType of ["STATIC", "CREDENTIAL"] as const) {
    const base = { id: "binding", alias: "qa account", required: true };
    const binding = sourceType === "STATIC" ? { ...base, sourceType, staticDefinition: { name: "Amount", type: "Decimal" as const, value: "0.01" } }
      : { ...base, sourceType, sourceId: "credential" };
    const result = await createExecutionDataClient(http, "project").validate([binding], [], new AbortController().signal);
    assert.equal(result.valid, false);
    assert.deepEqual(result.errors, [{ code: "TEST_DATA_ALIAS_INVALID", alias: "qa account", field: "alias" }]);
    assert.deepEqual(result.referencedResources, []);
  }
});
test("authorization and transport errors stay failures rather than becoming binding findings", async () => {
  const http = createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async () =>
    new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Not allowed", requestId: "req-denied" } }), { status: 403 })) as typeof fetch });
  await assert.rejects(() => createExecutionDataClient(http, "project").validate([], [], new AbortController().signal), { status: 403, code: "FORBIDDEN" });
});
