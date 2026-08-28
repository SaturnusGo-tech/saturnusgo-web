import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createEnvironmentResource } from "../data/environment-api";

test("environment create sends the generated DTO with idempotency", async () => {
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: {
        id: "environment-1", projectId: "project-1", key: "LOCAL", name: "Local",
        baseUrl: "http://localhost:3000", description: "Local target", variableKeys: [],
        isDefault: true, status: "active", createdAt: "2026-08-28T00:00:00.000Z",
        updatedAt: "2026-08-28T00:00:00.000Z",
      } }), { status: 201, headers: { "content-type": "application/json", etag: '"environment:environment-1:1"' } });
    }) as typeof fetch,
  });

  const result = await createEnvironmentResource(http, {
    projectId: "project-1", key: "LOCAL", name: "Local", baseUrl: "http://localhost:3000",
    description: "Local target", isDefault: true,
  }, "environment-operation-key");

  assert.equal(result.data.key, "LOCAL");
  assert.equal(result.data.isDefault, true);
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "environment-operation-key");
});
