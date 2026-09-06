import assert from "node:assert/strict";
import test from "node:test";

import { createTmsHttpClient, TmsApiError } from "../../../../core/tms/transport/http";
import { describeDefectCreateError } from "../../application/defects/describeDefectCreateError";
import { createDefectResource } from "../data/defect-api";
import {
  defectClientLabels, inferDefectIntegrationTarget, inferLegacyDefectIntegrationTarget,
  initialDefectIntegrationChoice,
  resolveDefectIntegrationChoice,
} from "../model/integration-target";

test("leaves component and tag routing to the workspace configuration", () => {
  assert.equal(inferDefectIntegrationTarget(["android", "positive"], "Checkout"), null);
  assert.equal(inferDefectIntegrationTarget(["web"], "Payments API"), null);
});

test("the default choice enables server-side automatic routing", () => {
  const choice = initialDefectIntegrationChoice(["ios", "android"], "Host");
  assert.equal(choice, "");
  assert.deepEqual(resolveDefectIntegrationChoice(choice), { resolved: true, target: null });
});

test("legacy workspaces keep the previous explicit routing until v2 is saved", () => {
  assert.equal(inferLegacyDefectIntegrationTarget(["ios"], "Checkout"), "ios");
  assert.equal(inferLegacyDefectIntegrationTarget([], "Payments API"), "backend");
  assert.deepEqual(resolveDefectIntegrationChoice("", false), { resolved: false, target: null });
  assert.deepEqual(resolveDefectIntegrationChoice("tms", false), { resolved: true, target: null });
});

test("explicit routing preserves an arbitrary route id", () => {
  assert.deepEqual(resolveDefectIntegrationChoice("route-web-client"),
    { resolved: true, target: "route-web-client" });
});

test("run defect creation leaves immutable provenance labels to the server", () => {
  assert.deepEqual(defectClientLabels(true), []);
  assert.deepEqual(defectClientLabels(false), ["reported"]);
});

test("defect create sends the explicit YouTrack target", async () => {
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: { id: "defect-1", projectId: "project-1",
        key: "QA-BUG-001", title: "Crash", description: "", severity: "high", priority: "high",
        status: "open", reproducibility: "always", assigneeIdentityId: null, component: "Checkout",
        labels: [], integrationTarget: "route-web-client", externalIssue: null, occurrence: null,
        expectedResult: "Success", actualResult: "Crash", attachmentIds: [], linkIds: [],
        createdByIdentityId: "identity-1", createdAt: "2026-08-30T00:00:00.000Z",
        updatedAt: "2026-08-30T00:00:00.000Z" } }), { status: 201,
        headers: { "content-type": "application/json", etag: '"defect:defect-1:1"' } });
    }) as typeof fetch });
  await createDefectResource(http, { projectId: "project-1", title: "Crash",
    integrationTarget: "route-web-client" }, "defect-operation-key");
  const body = JSON.parse(String(request?.body)) as { integrationTarget?: string };
  assert.equal(body.integrationTarget, "route-web-client");
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "defect-operation-key");
});

test("defect creation surfaces a safe API error and request ID", () => {
  const error = new TmsApiError("YouTrack routing failed.", 502, "request-safe-1", "HTTP_ERROR");
  assert.equal(describeDefectCreateError(error, "Fallback", "ru"),
    "YouTrack routing failed. (ID запроса: request-safe-1)");
  assert.equal(describeDefectCreateError(new Error("raw"), "Fallback", "en"), "Fallback");
});
