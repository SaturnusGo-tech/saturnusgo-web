import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createProject, updateProject } from "./createProject";

test("default-environment failure never performs an unsafe project rollback", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (resource, init = {}) => {
      const url = String(resource);
      calls.push({ url, init });
      if (url.endsWith("/projects")) {
        return new Response(JSON.stringify({ data: {
          id: "project-1", workspaceId: "workspace-1", key: "TMS", slug: "tms",
          name: "TMS", description: "Manual QA", status: "active",
          createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
        } }), { status: 201, headers: { "content-type": "application/json", etag: '"project:project-1:1"' } });
      }
      return new Response(JSON.stringify({ error: {
        code: "CONFLICT", message: "Environment exists", requestId: "request-1",
      } }), { status: 409, headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });

  const result = await createProject({
    http, workspaceId: "workspace-1", name: "TMS", key: "tms", description: "Manual QA",
    environmentName: "Local", baseUrl: "http://localhost:3000", offline: false,
    locale: "en", operationKey: "workspace-project-operation",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "environment",
    failure: {
      message: "Environment exists",
      code: "CONFLICT",
      requestId: "request-1",
    },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls.some(({ init }) => init.method === "DELETE"), false);
  assert.equal(new Headers(calls[0].init.headers).get("idempotency-key"), "workspace-project-operation:project");
  assert.equal(new Headers(calls[1].init.headers).get("idempotency-key"), "workspace-project-operation:environment");
});

test("editing project metadata retains its permanent key and uses optimistic concurrency", async () => {
  const project = { id: "project-1", workspaceId: "workspace-1", key: "HOST", slug: "host",
    name: "Host", description: "", status: "active" as const,
    createdAt: "2026-09-09T00:00:00.000Z", updatedAt: "2026-09-09T00:00:00.000Z" };
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test-token",
    fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: { ...project, ...JSON.parse(String(init?.body)) } }), {
        status: 200, headers: { "content-type": "application/json", etag: '\"project:project-1:2\"' },
      });
    }) as typeof fetch,
  });
  const result = await updateProject({ http, project, etag: '\"project:project-1:1\"', offline: false,
    name: "  Umbrella Host  ", description: "  Product QA  ", key: "UNUSED", operationKey: "edit-project-operation" });
  assert.deepEqual(JSON.parse(String(request?.body)), { name: "Umbrella Host", description: "Product QA" });
  assert.equal(new Headers(request?.headers).get("if-match"), '\"project:project-1:1\"');
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "edit-project-operation");
  assert.equal(result.data.key, "HOST");
  assert.equal(result.etag, '\"project:project-1:2\"');
});
