import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createSuiteLifecycleActions } from "../../state/suite-lifecycle/suite-lifecycle-actions";

type Api = components["schemas"];
const suite: Api["Suite"] = {
  id: "suite-1", projectId: "project-1", key: "TMS-TS-1", name: "Smoke",
  description: "Release smoke", type: "static", caseIds: ["case-1"], filter: {},
  caseCount: 1, resolvedCaseCount: 1, status: "archived",
  createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
};

test("suite archive and restore use explicit lifecycle routes with CAS", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: suite }), {
        status: 200, headers: { etag: '"suite-1:2"' },
      });
    }) as typeof fetch,
  });
  const keys = ["archive-key", "restore-key"];
  const actions = createSuiteLifecycleActions(http, () => keys.shift()!);

  await actions.archive("suite-1", '"suite-1:1"');
  const restored = await actions.restore("suite-1", '"suite-1:2"');

  assert.equal(calls[0]?.init.method, "DELETE");
  assert.equal(new URL(calls[0]!.url).pathname, "/api/v1/suites/suite-1");
  assert.equal(calls[1]?.init.method, "POST");
  assert.equal(new URL(calls[1]!.url).pathname, "/api/v1/suites/suite-1/restore");
  assert.deepEqual(calls.map(({ init }) => new Headers(init.headers).get("idempotency-key")),
    ["archive-key", "restore-key"]);
  assert.deepEqual(calls.map(({ init }) => new Headers(init.headers).get("if-match")),
    ['"suite-1:1"', '"suite-1:2"']);
  assert.equal(restored.etag, '"suite-1:2"');
});
