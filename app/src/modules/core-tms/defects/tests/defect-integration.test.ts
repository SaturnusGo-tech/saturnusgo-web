import assert from "node:assert/strict";
import test from "node:test";

import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createDefectResource } from "../data/defect-api";
import { inferDefectIntegrationTarget } from "../model/integration-target";

test("infers only an unambiguous YouTrack target", () => {
  assert.equal(inferDefectIntegrationTarget(["android", "positive"], "Checkout"), "android");
  assert.equal(inferDefectIntegrationTarget(["ios", "android"], "Checkout"), null);
  assert.equal(inferDefectIntegrationTarget([], "Payments API"), "backend");
});

test("defect create sends the explicit YouTrack target", async () => {
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: { id: "defect-1", projectId: "project-1",
        key: "QA-BUG-001", title: "Crash", description: "", severity: "high", priority: "high",
        status: "open", reproducibility: "always", assigneeIdentityId: null, component: "Checkout",
        labels: [], integrationTarget: "android", externalIssue: null, occurrence: null,
        expectedResult: "Success", actualResult: "Crash", attachmentIds: [], linkIds: [],
        createdByIdentityId: "identity-1", createdAt: "2026-08-30T00:00:00.000Z",
        updatedAt: "2026-08-30T00:00:00.000Z" } }), { status: 201,
        headers: { "content-type": "application/json", etag: '"defect:defect-1:1"' } });
    }) as typeof fetch });
  await createDefectResource(http, { projectId: "project-1", title: "Crash",
    integrationTarget: "android" }, "defect-operation-key");
  const body = JSON.parse(String(request?.body)) as { integrationTarget?: string };
  assert.equal(body.integrationTarget, "android");
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "defect-operation-key");
});
