import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createWorkspaceCapabilityReader } from "../data/workspace-capability-api";
test("a capability response for another workspace never grants client administration", async () => {
  const http = createTmsHttpClient({ apiBase: "https://tms.test/api/v1", credentials: "include", fetch: async () => Response.json({ data: { workspaceId: "other", teamAdministrationAvailable: true } }) });
  await assert.rejects(createWorkspaceCapabilityReader(http)("wanted", new AbortController().signal), /workspace/i);
});
