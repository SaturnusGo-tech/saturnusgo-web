import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createExternalLinkResource } from "../data/external-link-api";

test("external-link create sends the discriminated DTO with idempotency", async () => {
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: {
        id: "link-1", projectId: "project-1", owner: { kind: "defect", defectId: "defect-1" },
        label: "Defect link", targetUri: "https://example.test/issue/1", kind: "url",
        externalSystem: null, externalKey: null, status: "active", archivedAt: null,
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
      } }), { status: 201, headers: { "content-type": "application/json", etag: '"link:link-1:1"' } });
    }) as typeof fetch,
  });

  const result = await createExternalLinkResource(http, {
    projectId: "project-1", owner: { kind: "defect", defectId: "defect-1" },
    label: "Defect link", targetUri: "https://example.test/issue/1", kind: "url",
  }, "external-link-operation-key");

  assert.equal(result.id, "link-1");
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "external-link-operation-key");
});
