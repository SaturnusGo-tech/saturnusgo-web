import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../core/tms/transport/http";
import { createRun } from "./createRun";

type Api = components["schemas"];
const time = "2026-08-29T00:00:00.000Z";
const runDto: Api["Run"] = {
  id: "run-1", projectId: "project-1", key: "TMS-TR-1", name: "Smoke", description: "",
  type: "smoke", status: "active",
  environment: { id: "environment-1", key: "QA", name: "QA",
    baseUrl: "https://example.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: "42", configuration: {}, itemCount: 1,
  progress: { total: 1, executed: 0, percent: 0,
    counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: time, completedAt: null,
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null,
  archiveReason: null, createdAt: time, updatedAt: time,
};
test("run retries preserve one operation key and expose API diagnostics", async () => {
  const keys: Array<string | undefined> = [];
  const http = {
    async mutateResource(_path: string, _method: string, _body: unknown, options: {
      idempotencyKey?: string;
    }) {
      keys.push(options.idempotencyKey);
      throw new TmsApiError("Run persistence failed.", 500, "request-run-1", "INTERNAL_ERROR");
    },
  } as unknown as TmsHttpClient;
  const input = {
    http,
    project: { id: "project-1", key: "TMS", name: "TMS" },
    environment: {
      id: "environment-1", projectId: "project-1", key: "QA", name: "QA",
      baseUrl: "https://example.test", description: "", isDefault: true,
    },
    caseIds: ["case-1"],
    name: "Smoke",
    type: "smoke" as const,
    build: "42",
    offline: false,
    operationKey: "stable-run-operation",
  };

  const first = await createRun(input);
  const retry = await createRun(input);

  assert.deepEqual(keys, ["stable-run-operation", "stable-run-operation"]);
  assert.deepEqual(first, {
    ok: false,
    reason: "create",
    failure: {
      message: "Run persistence failed.",
      code: "INTERNAL_ERROR",
      requestId: "request-run-1",
    },
  });
  assert.deepEqual(retry, first);
});

test("successful run creation accepts the POST resource without a follow-up GET", async () => {
  let writes = 0;
  let reads = 0;
  const http = {
    async mutateResource() { writes += 1; return { data: runDto, etag: '"run-1:1"' }; },
    async getResource() { reads += 1; throw new Error("unexpected GET"); },
  } as unknown as TmsHttpClient;

  const result = await createRun({
    http,
    project: { id: "project-1", key: "TMS", name: "TMS" },
    environment: { id: "environment-1", projectId: "project-1", key: "QA", name: "QA",
      baseUrl: "https://example.test", description: "", isDefault: true },
    caseIds: ["case-1"], name: "Smoke", type: "smoke", build: "42", offline: false,
    operationKey: "create-key",
  });

  assert.equal(writes, 1);
  assert.equal(reads, 0);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual({ id: result.run.id, status: result.run.status },
    { id: "run-1", status: "active" });
});
