import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../../core/tms/generated/tms-api";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createTmsHttpClient, TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { refreshRunAfterSuccessfulMutation } from "../../../state/run-actions/useRunActions";
import { archiveRun, mutateRunWithEtagRecovery, transitionRun, updateRunItem } from "../../data/run-api";

type Api = components["schemas"];
const time = "2026-08-29T00:00:00.000Z";
const attempt: Api["RunAttempt"] = {
  attemptNo: 1, status: "not_run", actualResult: "", comment: "", blockedReason: "",
  attachmentIds: [], startedAt: null, completedAt: null, createdAt: time, updatedAt: time,
  stepResults: [],
};
const item: Api["RunItem"] = {
  id: "item-1", caseId: "case-1", caseKey: "TMS-TC-1", revision: 1,
  assigneeIdentityId: null, status: "not_run", attemptCount: 1, activeAttemptNo: 1,
  createdAt: time, updatedAt: time,
  snapshot: { revision: 1, title: "Checkout", description: "", preconditions: "",
    type: "manual", lifecycle: "ready", priority: "high", component: "Checkout",
    ownerIdentityId: null, tags: [], estimatedMinutes: 2, testData: "", steps: [],
    checklist: [], attachmentIds: [], changeNote: "Created", createdBy: "identity-1",
    createdAt: time },
  activeAttempt: attempt,
};
const run: Api["Run"] = {
  id: "run-1", projectId: "project-1", key: "TMS-TR-1", name: "Smoke", description: "",
  type: "smoke", status: "active",
  environment: { id: "env-1", key: "QA", name: "QA", baseUrl: "https://qa.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: "42", configuration: {}, itemCount: 1,
  progress: { total: 1, executed: 0, percent: 0,
    counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: time, completedAt: null,
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null,
  archiveReason: null, createdAt: time, updatedAt: time,
};

test("item status accepts the authoritative PATCH resource without a follow-up GET", async () => {
  const calls: Array<{ path: string; method: string; options?: { ifMatch?: string } }> = [];
  const updated = { ...item, status: "failed" as const,
    activeAttempt: { ...attempt, status: "failed" as const, actualResult: "Mismatch" } };
  const http = {
    async mutateResource(path: string, method: string, _body: unknown, options?: { ifMatch?: string }) {
      calls.push({ path, method, options });
      return { data: updated, etag: '"item-1:2"' };
    },
    async getResource() { throw new Error("unexpected GET"); },
  } as unknown as TmsHttpClient;
  const result = await updateRunItem(http, "run-1", "item-1", {
    status: "failed", actualResult: "Mismatch",
  }, '"item-1:1"', "item-fail-key");
  assert.deepEqual(calls[0], { path: "/runs/run-1/items/item-1/status", method: "PATCH",
    options: { ifMatch: '"item-1:1"', idempotencyKey: "item-fail-key" } });
  assert.equal(result.data.status, "failed");
  assert.equal(result.etag, '"item-1:2"');
});

test("run mutation refreshes a stale ETag once with a new idempotency signature", async () => {
  const calls: Array<{ method: string; etag: string | null; key: string | null }> = [];
  let request = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "token", fetch: (async (_url, init = {}) => {
      request += 1;
      const headers = new Headers(init.headers);
      calls.push({ method: String(init.method), etag: headers.get("if-match"),
        key: headers.get("idempotency-key") });
      if (request === 1) return new Response(JSON.stringify({ error: {
        code: "PRECONDITION_FAILED", message: "stale", requestId: "request-1",
      } }), { status: 412 });
      if (request === 2) return new Response(JSON.stringify({ data: run }), {
        status: 200, headers: { etag: '"run-1:2"' },
      });
      return new Response(JSON.stringify({ data: { ...run, archivedAt: time,
        archivedBy: "identity-1", archiveReason: "Cleanup" } }), {
        status: 200, headers: { etag: '"run-1:3"' },
      });
    }) as typeof fetch });
  let operation: PendingOperation | null = null;
  const result = await mutateRunWithEtagRecovery(http, "run-1", '"run-1:1"', (etag) => {
    operation = resolvePendingOperation(operation, JSON.stringify({ runId: "run-1", etag }));
    return archiveRun(http, "run-1", etag, operation.key, "Cleanup");
  });
  assert.deepEqual(calls.map((call) => call.method), ["DELETE", "GET", "DELETE"]);
  assert.deepEqual(calls.map((call) => call.etag), ['"run-1:1"', null, '"run-1:2"']);
  assert.notEqual(calls[0]?.key, calls[2]?.key);
  assert.equal(result.etag, '"run-1:3"');
});

test("run transition is authoritative and preserves non-412 errors", async () => {
  let reads = 0;
  const completed = { ...run, status: "completed" as const, completedAt: time };
  const http = { async mutateResource() { return { data: completed, etag: '"run-1:7"' }; },
    async getResource() { reads += 1; throw new Error("unexpected GET"); } } as unknown as TmsHttpClient;
  const result = await transitionRun(http, "run-1", "complete", '"run-1:6"', "complete-key");
  assert.equal(result.data.status, "completed");
  assert.equal(result.etag, '"run-1:7"');
  assert.equal(reads, 0);
  const expected = new TmsApiError("unavailable", 500, "request-2", "INTERNAL_ERROR");
  await assert.rejects(() => mutateRunWithEtagRecovery(http, "run-1", '"run-1:7"',
    async () => { throw expected; }), (error) => error === expected);
  assert.equal(reads, 0);
});

test("a failed post-mutation refresh invalidates ETag without rejecting the write", async () => {
  let invalidated = 0;
  await assert.doesNotReject(() => refreshRunAfterSuccessfulMutation(
    async () => { throw new Error("read failed after write"); },
    () => { invalidated += 1; },
  ));
  assert.equal(invalidated, 1);
});
