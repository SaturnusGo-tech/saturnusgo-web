import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { attachProject } from "../application/assignment/attach-project";
import { loadProjectCatalog } from "../application/list-projects";

const base = { id: "project-1", workspaceId: "workspace-1", key: "PAY", name: "Payments", description: "Checks", status: "active", rowVersion: 2, responsibleIdentityId: null };

test("a project assigned after the picker opened cannot silently move portfolios", async () => {
  let requests = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async () => { requests++; return new Response(JSON.stringify({ data: { ...base, portfolioId: "other-portfolio" } }), { headers: { etag: '"project:project-1:2"' } }); }) as typeof fetch });
  await assert.rejects(attachProject(http, base.id, "target-portfolio", "assignment-operation-key"), /another portfolio/);
  assert.equal(requests, 1);
});

test("a retry after a successful attach resolves without issuing another write", async () => {
  let requests = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async () => { requests++; return new Response(JSON.stringify({ data: { ...base, portfolioId: "target-portfolio" } }), { headers: { etag: '"project:project-1:2"' } }); }) as typeof fetch });
  const result = await attachProject(http, base.id, "target-portfolio", "assignment-operation-key");
  assert.equal(result.data.portfolioId, "target-portfolio"); assert.equal(requests, 1);
});

test("attach carries the observed project version and command key", async () => {
  const requests: RequestInit[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (_url, init) => { requests.push(init!); return new Response(JSON.stringify({ data: { ...base, portfolioId: requests.length > 1 ? "target-portfolio" : null } }), { headers: { etag: '"project:project-1:2"' } }); }) as typeof fetch });
  await attachProject(http, base.id, "target-portfolio", "assignment-operation-key");
  assert.equal(requests.length, 2); assert.equal(requests[1].method, "PATCH");
  assert.deepEqual(JSON.parse(String(requests[1].body)), { portfolioId: "target-portfolio" });
  assert.equal(new Headers(requests[1].headers).get("If-Match"), '"project:project-1:2"');
  assert.equal(new Headers(requests[1].headers).get("Idempotency-Key"), "assignment-operation-key");
});

test("project catalog filters are bounded and workspace-scoped", async () => {
  let url = "";
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input) => { url = String(input); return Response.json({ data: [], meta: { limit: 100, hasMore: false, nextCursor: null } }); }) as typeof fetch });
  await loadProjectCatalog(http, { workspaceId: "workspace-1", status: "active", unassigned: true }, null);
  const query = new URL(url).searchParams;
  assert.equal(query.get("workspaceId"), "workspace-1"); assert.equal(query.get("unassigned"), "true");
  assert.equal(query.get("limit"), "100"); assert.equal(query.has("portfolioId"), false);
});
