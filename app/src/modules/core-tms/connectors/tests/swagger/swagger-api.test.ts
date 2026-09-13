import assert from "node:assert/strict";
import { test } from "node:test";
import { readApiSpecification } from "../../../api-sources/data/api-source-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
test("shared specification uses source identity, project union and request cancellation", async () => {
  const controller = new AbortController(); const spec = { title: "Test API" };
  const http = { get: async (path: string, signal: AbortSignal) => {
    assert.equal(path, "/integrations/api-sources/source-a/specification?workspaceId=workspace-a&projectIds=project-a%2Cproject-b");
    assert.equal(signal, controller.signal); return { data: spec };
  } } as unknown as TmsHttpClient;
  assert.equal(await readApiSpecification(http, "workspace-a", "source-a", { projectIds: ["project-b", "project-a"] }, controller.signal), spec);
});
