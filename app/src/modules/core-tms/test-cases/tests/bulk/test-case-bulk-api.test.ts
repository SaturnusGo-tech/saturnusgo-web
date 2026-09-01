import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { bulkUpdateTestCases } from "../../data/bulk/test-case-bulk-api";

test("bulk case update sends exact ordered targets and idempotency key", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "token",
    fetch: (async (url, init) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: {
        items: [
          { id: "case-2", key: "P-TC-2", currentRevision: 4, lifecycle: "ready", priority: "high", updatedAt: "2026-09-01T00:00:00Z", etag: '"case-2:4"', changed: true },
          { id: "case-1", key: "P-TC-1", currentRevision: 2, lifecycle: "ready", priority: "high", updatedAt: "2026-09-01T00:00:00Z", etag: '"case-1:2"', changed: false },
        ],
        updatedCount: 1,
        unchangedCount: 1,
      } }), { status: 200 });
    }) as typeof fetch,
  });

  const result = await bulkUpdateTestCases(http, {
    projectId: "project-1",
    items: [
      { caseId: "case-2", ifMatch: '"case-2:3"' },
      { caseId: "case-1", ifMatch: '"case-1:2"' },
    ],
    patch: { priority: "high" },
  }, "operation-1");

  const request = requests[0];
  assert.ok(request);
  assert.equal(request.url.endsWith("/test-cases/bulk"), true);
  const { init } = request;
  assert.equal(init?.method, "PATCH");
  assert.equal(new Headers(init?.headers).get("Idempotency-Key"), "operation-1");
  assert.deepEqual(JSON.parse(String(init?.body)), {
    projectId: "project-1",
    items: [
      { caseId: "case-2", ifMatch: '"case-2:3"' },
      { caseId: "case-1", ifMatch: '"case-1:2"' },
    ],
    patch: { priority: "high" },
  });
  assert.deepEqual(result.items.map((item) => item.id), ["case-2", "case-1"]);
  assert.equal(result.updatedCount, 1);
  assert.equal(result.unchangedCount, 1);
});

test("bulk case update rejects a response for a different ordered scope", async () => {
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "token",
    fetch: (async () => new Response(JSON.stringify({ data: {
      items: [
        { id: "case-2", key: "P-TC-2", currentRevision: 2, lifecycle: "ready", priority: "high", updatedAt: "2026-09-01T00:00:00Z", etag: '"case-2:2"', changed: true },
        { id: "case-1", key: "P-TC-1", currentRevision: 2, lifecycle: "ready", priority: "high", updatedAt: "2026-09-01T00:00:00Z", etag: '"case-1:2"', changed: true },
      ],
      updatedCount: 2,
      unchangedCount: 0,
    } }), { status: 200 })) as typeof fetch,
  });

  await assert.rejects(() => bulkUpdateTestCases(http, {
    projectId: "project-1",
    items: [
      { caseId: "case-1", ifMatch: '"case-1:1"' },
      { caseId: "case-2", ifMatch: '"case-2:1"' },
    ],
    patch: { lifecycle: "ready" },
  }, "operation-2"), /does not match the requested scope/);
});
