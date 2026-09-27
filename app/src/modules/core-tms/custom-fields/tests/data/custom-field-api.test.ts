import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient, TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { listCustomFieldValues, saveCustomField, saveCustomFieldValue, transitionCustomFieldValue } from "../../data/custom-field-api";
import { customValueConflict } from "../../application/field-errors";
import { field, value, scope } from "../support/fixtures";
test("registry requests remain scoped and bounded; updates carry row-version and idempotency", async () => {
  const calls: { path: string; method?: string; body?: unknown; options?: unknown }[] = [];
  const http = { get: async (path: string) => { calls.push({ path }); return { data: [value], meta: { nextCursor: "next-page" } }; },
    mutateResource: async (path: string, method: string, body: unknown, options: unknown) => { calls.push({ path, method, body, options }); return { data: value, etag: "tag" }; } } as unknown as TmsHttpClient;
  const page = await listCustomFieldValues(http, scope, field.id, { search: "a & b", parentValueId: "group-1", cursor: "cursor/2" });
  assert.equal(page.nextCursor, "next-page");
  const url = new URL(calls[0].path, "https://example.test");
  assert.equal(url.searchParams.get("workspaceId"), scope.workspaceId); assert.equal(url.searchParams.get("limit"), "50");
  assert.equal(url.searchParams.get("search"), "a & b"); assert.equal(url.searchParams.get("parentValueId"), "group-1");
  await saveCustomField(http, scope, { name: field.name, identifier: field.identifier, type: field.type, multiple: false, required: true }, field, "field-op");
  assert.equal(calls[1].method, "PATCH"); assert.deepEqual(calls[1].options, { ifMatch: '"custom-field:field-a:v3"', idempotencyKey: "field-op", signal: undefined });
  await saveCustomFieldValue(http, scope, field.id, { value: "Acme 2", confirmedSimilarValueIds: [value.id] }, null, "value-op");
  assert.deepEqual(calls[2].body, { value: "Acme 2", confirmedSimilarValueIds: [value.id] });
  await transitionCustomFieldValue(http, scope, value, "archive", "archive-op");
  assert.match(calls[3].path, /\/values\/value-a\/archive\?/); assert.deepEqual(calls[3].options,
    { ifMatch: '"custom-field-value:value-a:v2"', idempotencyKey: "archive-op", signal: undefined });
});
test("the authenticated HTTP layer preserves exact and similar evidence for explicit confirmation", async () => {
  const client = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", production: true, accessToken: async () => "token",
    fetch: (async () => new Response(JSON.stringify({ error: { code: "CONFLICT", message: "Similar values exist.",
      details: { reason: "SIMILAR_VALUES_EXIST", similarValues: [value] } } }), { status: 409, headers: { "Content-Type": "application/json" } })) as typeof fetch });
  await assert.rejects(() => client.get("/custom-fields"), failure => {
    assert.ok(failure instanceof TmsApiError); assert.equal(failure.details?.reason, "SIMILAR_VALUES_EXIST");
    assert.deepEqual(customValueConflict(failure), { kind: "similar", values: [value] }); return true;
  });
});
