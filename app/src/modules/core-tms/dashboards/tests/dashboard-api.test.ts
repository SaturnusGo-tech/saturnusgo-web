import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createDashboardResource } from "../data/dashboard-api";

test("dashboard create maps bounded widgets and sends idempotency", async () => {
  let request: RequestInit | undefined;
  const widget = {
    id: "widget-1", type: "summary" as const, title: "Run status",
    position: { x: 0, y: 0, width: 12, height: 4 }, settings: {},
  };
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ data: {
        id: "dashboard-1", workspaceId: "workspace-1", projectId: "project-1",
        name: "Release", description: "Release health", isDefault: false, status: "active",
        createdByIdentityId: "identity-1", widgets: [widget],
        createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z",
      } }), { status: 201, headers: { "content-type": "application/json", etag: '"dashboard:dashboard-1:1"' } });
    }) as typeof fetch,
  });

  const result = await createDashboardResource(http, {
    workspaceId: "workspace-1", projectId: "project-1", name: "Release",
    description: "Release health", isDefault: false, widgets: [widget],
  }, "dashboard-operation-key");

  assert.deepEqual(result.data.widgets, [{ id: "widget-1", type: "summary", title: "Run status" }]);
  assert.equal(new Headers(request?.headers).get("idempotency-key"), "dashboard-operation-key");
});
