import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { createRun } from "./createRun";

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
