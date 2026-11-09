import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { listWorkspaceMembers } from "../data/member-api";
import { listWorkspaceActors } from "../data/actors/actor-api";

test("member searches forward cancellation and opaque pagination", async () => {
  const controller = new AbortController(); let url = "";
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input, init) => { url = String(input); assert.equal(init?.signal, controller.signal);
      return Response.json({ data: [{ identityId: "member-1", kind: "human", name: "QA Admin", email: "qa@example.test" }], meta: { limit: 100, hasMore: true, nextCursor: "next" } }); }) as typeof fetch });
  const page = await listWorkspaceMembers(http, "workspace-1", " QA Admin ", "opaque+cursor", controller.signal);
  const query = new URL(url).searchParams;
  assert.ok(new URL(url).pathname.endsWith("/workspaces/workspace-1/actors"));
  assert.equal(query.get("search"), "QA Admin"); assert.equal(query.get("cursor"), "opaque+cursor");
  assert.deepEqual(page.items, [{ id: "member-1", kind: "human", name: "QA Admin", email: "qa@example.test" }]);
  assert.equal(page.nextCursor, "next");
});

test("selected member names resolve by identity without listing the workspace", async () => {
  let url = "";
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input) => { url = String(input); return Response.json({ data: [], meta: { limit: 100, hasMore: false, nextCursor: null } }); }) as typeof fetch });
  const page = await listWorkspaceMembers(http, "workspace-1", "", null, undefined, "member-1");
  assert.equal(new URL(url).searchParams.get("identityId"), "member-1"); assert.deepEqual(page.items, []);
});

test("profile details remain scoped to an exact human actor lookup", async () => {
  const signedIn = "2026-11-09T04:58:00.000Z";
  const profile = { lastSignedInAt: signedIn, presence: "online", timeZone: "Asia/Almaty", workspaceName: "Umbrella Host" };
  const human = { identityId: "member-1", kind: "human", name: "QA Admin", email: null, ...profile };
  const agent = { identityId: "agent-1", kind: "agent", name: "Codex", provider: "codex", status: "active", ...profile };
  const other = { ...human, identityId: "member-2" };
  const queries: URLSearchParams[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: async input => {
      queries.push(new URL(String(input)).searchParams);
      return Response.json({ data: [human, agent, other], meta: { limit: 100, hasMore: false, nextCursor: null } });
    } });
  const exact = await listWorkspaceActors(http, "workspace-1", { identityId: "member-1", includeSignIn: true });
  const avatar = await listWorkspaceActors(http, "workspace-1", { identityId: "member-1" });
  const search = await listWorkspaceActors(http, "workspace-1", { search: "QA", includeSignIn: true });
  assert.deepEqual(queries.map(query => query.get("includeSignIn")), ["true", null, null]);
  assert.deepEqual(exact.items[0], human);
  assert.ok([...exact.items.slice(1), ...avatar.items, ...search.items].every(item =>
    Object.keys(profile).every(field => !(field in item))));
});
