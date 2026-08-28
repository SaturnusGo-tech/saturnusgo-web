import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createProjectResource } from "../data/project-api";

test("project create uses the generated request and a stable idempotency key", async () => {
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: {
        id: "project-1", workspaceId: "workspace-1", key: "TMS", slug: "tms",
        name: "TMS", description: "Manual QA", status: "active",
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
      } }), { status: 201, headers: { "content-type": "application/json", etag: '"project:project-1:1"' } });
    }) as typeof fetch,
  });

  const result = await createProjectResource(http, {
    workspaceId: "workspace-1", key: "TMS", name: "TMS", description: "Manual QA",
  }, "project-operation-key");

  assert.equal(result.data.status, "active");
  assert.equal(result.etag, '"project:project-1:1"');
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "project-operation-key");
});
