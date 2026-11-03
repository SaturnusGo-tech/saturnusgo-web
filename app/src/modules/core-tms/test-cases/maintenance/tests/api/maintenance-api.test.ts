import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { getCaseMaintenance, changeCaseMaintenance } from "../../data/maintenance-api";
const source = { runId: "run", runItemId: "item", attemptNo: 2, revision: 4 };
const current = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, note: null, source: null, etag: '"test-case-maintenance:case:v0"' } as const;
test("maintenance uses its own ETag and sends exact source context and idempotency without revising or executing", async () => {
  const calls: unknown[][] = [];
  const http = { getResource: async (...args: unknown[]) => { calls.push(args); return { data: current, etag: current.etag }; },
    mutateResource: async (...args: unknown[]) => { calls.push(args); return { data: { ...current, status: "needs_update", source }, etag: '"test-case-maintenance:case:v1"' }; } } as unknown as TmsHttpClient;
  const read = await getCaseMaintenance(http, "case");
  await changeCaseMaintenance(http, "case", { status: "needs_update", source, note: "Clarify expected result" }, read.etag!, "idempotency-key-123");
  assert.equal(calls[0][0], "/test-cases/case/maintenance");
  assert.equal(calls[1][0], "/test-cases/case/maintenance"); assert.equal(calls[1][1], "POST");
  assert.deepEqual(calls[1][2], { status: "needs_update", source, note: "Clarify expected result" });
  assert.deepEqual(calls[1][3], { ifMatch: current.etag, idempotencyKey: "idempotency-key-123", signal: undefined });
});
test("clear uses a separate current command and never carries the historical source", async () => {
  let body: unknown;
  const http = { mutateResource: async (_p: string, _m: string, input: unknown) => { body = input; return { data: current, etag: current.etag }; } } as unknown as TmsHttpClient;
  await changeCaseMaintenance(http, "case", { status: "current", note: "Updated steps" }, current.etag, "idempotency-key-123");
  assert.deepEqual(body, { status: "current", note: "Updated steps" });
});
