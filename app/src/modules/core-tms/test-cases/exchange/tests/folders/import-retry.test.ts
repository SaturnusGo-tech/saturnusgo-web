import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient, TmsMutationOptions } from "../../../../../../core/tms/transport/http";
import { importProjectCases } from "../../application/import-project-cases";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";
import { TEST_CASE_EXCHANGE_SCHEMA } from "../../model/test-case-exchange";

function document() { return parseTestCaseExchange(JSON.stringify({ schemaVersion: TEST_CASE_EXCHANGE_SCHEMA,
  exportedAt: "2026-09-09", project: { key: "QA", name: "Quality" },
  testCases: [{ title: "Same title" }, { title: "Same title" }, { title: "Third case" }] })); }

test("counts only successful imports, preserves duplicate occurrences, and retries only failed indices with the same key", async () => {
  const requests: { title: string; key: string | undefined }[] = [];
  let failing = true;
  const http = { mutateResource: async (_path: string, _method: string, body: { title: string }, options: TmsMutationOptions) => {
    requests.push({ title: body.title, key: options.idempotencyKey });
    if (requests.length === 2 && failing) throw new Error("Temporary failure");
    return { data: {}, etag: null };
  } } as unknown as TmsHttpClient;
  const first = await importProjectCases(http, "project", document());
  assert.equal(first.completed, 2);
  assert.equal(first.attempted, 3);
  assert.deepEqual(first.successfulIndices, [0, 2]);
  assert.equal(first.failed[0]?.index, 1);
  assert.notEqual(requests[0]?.key, requests[1]?.key);
  failing = false;
  const retry = await importProjectCases(http, "project", document(), undefined, { successfulIndices: first.successfulIndices });
  assert.equal(retry.completed, 3);
  assert.equal(retry.failed.length, 0);
  assert.equal(requests.length, 4);
  assert.equal(requests[1]?.key, requests[3]?.key);
});
test("stops after cancellation, retains confirmed successes, and retries uncertain requests with identical idempotency", async () => {
  const abort = new AbortController();
  const keys: (string | undefined)[] = [];
  const http = { mutateResource: async (_path: string, _method: string, _body: unknown, options: TmsMutationOptions) => {
    keys.push(options.idempotencyKey);
    if (keys.length === 2) { abort.abort(); throw new DOMException("Aborted", "AbortError"); }
    return { data: {}, etag: null };
  } } as unknown as TmsHttpClient;
  const first = await importProjectCases(http, "project", document(), undefined, { signal: abort.signal });
  assert.equal(first.cancelled, true);
  assert.equal(first.completed, 1);
  assert.equal(keys.length, 2);
  const resumed = await importProjectCases(http, "project", document(), undefined, { successfulIndices: first.successfulIndices });
  assert.equal(resumed.completed, 3);
  assert.equal(keys[1], keys[2]);
});
test("does not start any mutation for an already cancelled import", async () => {
  const abort = new AbortController(); abort.abort();
  let calls = 0;
  const http = { mutateResource: async () => { calls += 1; } } as unknown as TmsHttpClient;
  const result = await importProjectCases(http, "project", document(), undefined, { signal: abort.signal });
  assert.equal(result.completed, 0);
  assert.equal(calls, 0);
});
