import assert from "node:assert/strict";
import test from "node:test";

import { createTmsHttpClient, TmsApiError } from "../../../../core/tms/transport/http";
import { describeDefectCreateError } from "../../application/defects/describeDefectCreateError";
import { createDefect } from "../../application/defects/createDefect";
import { createDefectResource } from "../data/defect-api";
import { defect } from "../execution-context/tests/fixtures/execution-fixture";
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
        key: "QA-BUG-001", title: "Crash", description: "", preconditions: "", testData: "", severity: "high", priority: "high",
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

test("creation preserves narrative Markdown through the request and detail read", async () => {
  const preconditions = "**Signed-in QA**\n\n- Sandbox enabled\n- Existing payment";
  const testData = "| Account | Amount |\n| --- | --- |\n| `qa-42` | 100 |";
  const payload = { ...defect, preconditions, testData, runId: null, runItemId: null, stepId: null };
  const requests: Array<{ method: string; body: Record<string, unknown> }> = [];
  let stored = { ...payload, preconditions: "", testData: "", occurrence: null };
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (_url, init) => {
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      requests.push({ method, body });
      if (method === "POST") stored = { ...stored, ...body };
      return new Response(JSON.stringify({ data: stored }), { status: method === "POST" ? 201 : 200,
        headers: { "content-type": "application/json", etag: '"defect:bug-1:1"' } });
    }) as typeof fetch });
  const input = { http, attachments: {} as never, projectId: "project-1", payload,
    files: [], operationKey: "narrative-operation", locale: "en" as const };
  const saved = await createDefect({ ...input, offline: false });
  assert.deepEqual(requests.map(request => request.method), ["POST", "GET"]);
  assert.equal(requests[0].body.preconditions, preconditions);
  assert.equal(requests[0].body.testData, testData);
  assert.equal(saved.preconditions, preconditions);
  assert.equal(saved.testData, testData);
  const local = await createDefect({ ...input, offline: true });
  assert.equal(local.preconditions, preconditions);
  assert.equal(local.testData, testData);
  assert.equal(requests.length, 2, "offline creation must not contact the server");
});
