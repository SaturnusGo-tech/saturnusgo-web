import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient, TmsMutationOptions } from "../../../../../core/tms/transport/http";
import { exportProjectCases } from "../application/export-project-cases";
import { importProjectCases } from "../application/import-project-cases";
import { TEST_CASE_EXCHANGE_SCHEMA, type TestCaseExchangeDocument } from "../model/test-case-exchange";

function document(): TestCaseExchangeDocument {
  return {
    schemaVersion: TEST_CASE_EXCHANGE_SCHEMA,
    exportedAt: "2026-08-29T00:00:00.000Z",
    project: { key: "HOST", name: "Umbrella-Host" },
    testCases: [{
      sourceKey: "HOST-ENTRY-001",
      folderPath: "/Host/Entry",
      title: "Host entry",
      description: "Description",
      preconditions: "Signed out",
      type: "automated",
      lifecycle: "ready",
      priority: "critical",
      component: "Host Entry",
      tags: ["host", "ui", "ci.backend"],
      estimatedMinutes: 4,
      testData: "",
      steps: [{ order: 1, action: "Open", expectedResult: "Visible", testData: "", required: true }],
      checklist: [],
    }],
  };
}

test("imports with a stable key and preserves the external source marker", async () => {
  const requests: { body: unknown; options?: TmsMutationOptions }[] = [];
  const http = {
    mutateResource: async (_path: string, _method: string, body: unknown, options?: TmsMutationOptions) => {
      requests.push({ body, options });
      return { data: {}, etag: '"1"' };
    },
  } as unknown as TmsHttpClient;
  const first = await importProjectCases(http, "project-host", document());
  const second = await importProjectCases(http, "project-host", document());
  assert.equal(first.failed.length, 0);
  assert.equal(second.failed.length, 0);
  assert.equal(requests[0]?.options?.idempotencyKey, requests[1]?.options?.idempotencyKey);
  const body = requests[0]?.body as { ownerIdentityId: unknown; tags: string[]; changeNote: string };
  assert.equal(body.ownerIdentityId, null);
  assert.ok(body.tags.includes("source-host-entry-001"));
  assert.deepEqual(body.tags.slice(0, 3), ["host", "ui", "ci.backend"]);
  assert.equal((requests[0]?.body as { type: string }).type, "automated");
  assert.equal(body.changeNote, "Imported from HOST-ENTRY-001");
});

test("exports all cursor pages and current revision content", async () => {
  let page = 0;
  const http = {
    get: async () => {
      page += 1;
      return { data: [{ id: page === 1 ? "case-1" : "case-2" }], meta: { nextCursor: page === 1 ? "next" : null } };
    },
    getResource: async (path: string) => ({ data: {
      id: path.endsWith("case-1") ? "case-1" : "case-2",
      key: path.endsWith("case-1") ? "HOST-TC-1" : "HOST-TC-2",
      folderPath: "/Host",
      current: {
        title: "Case", description: "", preconditions: "", type: "automated", lifecycle: "ready",
        priority: "high", component: "Host", tags: ["host", "ci.backend"], estimatedMinutes: 3, testData: "",
        steps: [{ order: 1, action: "Act", expectedResult: "Observe", required: true }], checklist: [],
      },
    }, etag: '"1"' }),
  } as unknown as TmsHttpClient;
  const exported = await exportProjectCases(http, { id: "project-host", key: "HOST", name: "Umbrella-Host" });
  assert.equal(exported.schemaVersion, "saturnusgo.tms.test-cases.v2");
  assert.equal(exported.testCases.length, 2);
  assert.deepEqual(exported.testCases.map((item) => item.sourceKey), ["HOST-TC-1", "HOST-TC-2"]);
  assert.equal(exported.testCases[0]?.steps[0]?.testData, "");
  assert.equal(exported.testCases[0]?.type, "automated");
  assert.deepEqual(exported.testCases[0]?.tags, ["host", "ci.backend"]);
});
