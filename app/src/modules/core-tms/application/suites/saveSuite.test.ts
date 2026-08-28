import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { saveSuite } from "./saveSuite";

test("suite retries preserve the caller-owned operation key", async () => {
  const keys: Array<string | undefined> = [];
  const http = {
    async mutateResource(_path: string, _method: string, _body: unknown, options: {
      idempotencyKey?: string;
    }) {
      keys.push(options.idempotencyKey);
      throw new TmsApiError("Suite persistence failed.", 500, "request-suite-1", "INTERNAL_ERROR");
    },
  } as unknown as TmsHttpClient;
  const input = {
    http,
    projectId: "project-1",
    name: "Smoke",
    description: "Release smoke",
    type: "static" as const,
    caseIds: ["case-1"],
    tags: [],
    offline: false,
    operationKey: "stable-suite-operation",
  };

  await assert.rejects(() => saveSuite(input), TmsApiError);
  await assert.rejects(() => saveSuite(input), TmsApiError);
  assert.deepEqual(keys, ["stable-suite-operation", "stable-suite-operation"]);
});
