import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { listWorkspaceMembers } from "../data/member-api";

test("member searches forward cancellation and opaque pagination", async () => {
  const controller = new AbortController(); let url = "";
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input, init) => { url = String(input); assert.equal(init?.signal, controller.signal);
      return Response.json({ data: [{ identityId: "member-1", displayName: "QA Admin", email: "qa@example.test" }], meta: { limit: 100, hasMore: true, nextCursor: "next" } }); }) as typeof fetch });
  const page = await listWorkspaceMembers(http, "workspace-1", " QA Admin ", "opaque+cursor", controller.signal);
  const query = new URL(url).searchParams;
  assert.ok(new URL(url).pathname.endsWith("/workspaces/workspace-1/members"));
  assert.equal(query.get("search"), "QA Admin"); assert.equal(query.get("cursor"), "opaque+cursor");
  assert.deepEqual(page.items, [{ id: "member-1", name: "QA Admin", email: "qa@example.test" }]);
  assert.equal(page.nextCursor, "next");
});

test("selected member names resolve by identity without listing the workspace", async () => {
  let url = "";
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input) => { url = String(input); return Response.json({ data: [], meta: { limit: 100, hasMore: false, nextCursor: null } }); }) as typeof fetch });
  const page = await listWorkspaceMembers(http, "workspace-1", "", null, undefined, "member-1");
  assert.equal(new URL(url).searchParams.get("identityId"), "member-1"); assert.deepEqual(page.items, []);
});
