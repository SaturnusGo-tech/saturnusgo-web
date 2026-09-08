import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSwaggerSpecification } from "../../data/swagger/swagger-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
test("specification loading uses the authenticated scoped Falcon endpoint and cancellation", async () => {
  const controller = new AbortController();
  const spec = { title: "Test API" };
  const http = { get: async (path: string, signal: AbortSignal) => {
    assert.equal(path, "/integrations/connectors/swagger/specification?workspaceId=workspace-a&projectId=project-a");
    assert.equal(signal, controller.signal); return { data: spec };
  } } as unknown as TmsHttpClient;
  assert.equal(await loadSwaggerSpecification(http, { workspaceId: "workspace-a", projectId: "project-a" }, controller.signal), spec);
});
