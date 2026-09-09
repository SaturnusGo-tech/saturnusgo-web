import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { patchOrganization } from "../data/organization-api";
import { validChecklist } from "../model/organization";
for (const targetType of ["project", "portfolio"] as const) test(`${targetType} workflow/checklist use entity version and keep archived lifecycle separate`, async () => {
  let request: RequestInit = {}; let url = "";
  const controller = new AbortController();
  const items = [{ id: "item-id", text: " Check refunds ", completed: true }];
  const data = { id: "target", key: "PAY", name: "Payments", description: "", testingPlan: "", workflowPhase: "in_review", checklist: [{ ...items[0], text: "Check refunds" }],
    status: "active", workspaceId: "workspace", responsibleIdentityId: null, projectCount: 2, rowVersion: 4 };
  const http = createTmsHttpClient({ apiBase: "https://example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input, init) => { url = String(input); request = init!; return new Response(JSON.stringify({ data }), { headers: { etag: '"version-4"' } }); }) as typeof fetch });
  const result = await patchOrganization(http, { workspaceId: "workspace", targetId: "target", targetType }, { workflowPhase: "in_review", checklist: items }, '"version-3"', "stable-phase-key", controller.signal);
  assert.equal(new URL(url).pathname, `/api/v1/${targetType}s/target`);
  assert.equal(request.method, "PATCH"); assert.equal(request.signal, controller.signal);
  assert.equal(new Headers(request.headers).get("If-Match"), '"version-3"');
  assert.equal(new Headers(request.headers).get("Idempotency-Key"), "stable-phase-key");
  assert.deepEqual(JSON.parse(String(request.body)), { workflowPhase: "in_review", checklist: [{ id: "item-id", text: "Check refunds", completed: true }] });
  assert.equal(result.etag, '"version-4"'); assert.equal(result.data.status, "active"); assert.equal(result.data.workflowPhase, "in_review");
  assert.deepEqual(result.data.checklist, [{ id: "item-id", text: "Check refunds", completed: true }]);
});
test("checklists reject empty, oversized and duplicate items without losing stable IDs", () => {
  assert.equal(validChecklist([]), true);
  assert.equal(validChecklist(undefined), true); assert.equal(validChecklist(null), true);
  const item = { id: "stable", text: "Verify", completed: false };
  assert.equal(validChecklist([item]), true); assert.equal(validChecklist([item, item]), false);
  assert.equal(validChecklist([{ ...item, text: " " }]), false);
  assert.equal(validChecklist([{ ...item, text: "a".repeat(501) }]), false);
  assert.equal(validChecklist(Array.from({ length: 101 }, (_, id) => ({ ...item, id: String(id) }))), false);
});
