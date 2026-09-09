import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { getPortfolio, listPortfolios, savePortfolio, transitionPortfolio } from "../data/portfolio-api";

const portfolio = { id: "portfolio-1", workspaceId: "workspace-1", name: "Payments", description: "Checks", responsibleIdentityId: null,
  status: "active", archivedAt: null, projectCount: 3, rowVersion: 2, createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z" };

test("portfolio lists preserve bounded scope, cursor and authoritative project counts", async () => {
  let url = "";
  const controller = new AbortController();
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (input, init) => { url = String(input); assert.equal(init?.signal, controller.signal);
      return Response.json({ data: [portfolio], meta: { limit: 100, hasMore: true, nextCursor: "cursor-next" } }); }) as typeof fetch });
  const result = await listPortfolios(http, "workspace-1", "active", "opaque+/cursor", controller.signal);
  const query = new URL(url).searchParams;
  assert.equal(query.get("workspaceId"), "workspace-1"); assert.equal(query.get("cursor"), "opaque+/cursor");
  assert.equal(query.get("limit"), "100"); assert.equal(query.get("status"), "active");
  assert.equal(result.items[0].projectCount, 3); assert.equal(result.nextCursor, "cursor-next");
});

test("portfolio creation, edits and archive carry stable command headers", async () => {
  const requests: RequestInit[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async (_url, init) => { requests.push(init!); return new Response(JSON.stringify({ data: portfolio }), { headers: { etag: '"portfolio:portfolio-1:2"' } }); }) as typeof fetch });
  const draft = { name: " Payments ", description: " Checks ", responsibleIdentityId: null };
  const created = await savePortfolio(http, "workspace-1", draft, null, "portfolio-create-key");
  assert.deepEqual(JSON.parse(String(requests[0].body)), { workspaceId: "workspace-1", name: "Payments", description: "Checks", responsibleIdentityId: null });
  assert.equal(new Headers(requests[0].headers).get("Idempotency-Key"), "portfolio-create-key");
  await savePortfolio(http, "workspace-1", draft, { id: portfolio.id, etag: created.etag }, "portfolio-update-key");
  assert.equal(new Headers(requests[1].headers).get("If-Match"), created.etag);
  await transitionPortfolio(http, portfolio.id, "archive", created.etag!, "portfolio-archive-key");
  assert.equal(requests[2].method, "DELETE"); assert.equal(requests[2].body, undefined);
  assert.equal(new Headers(requests[2].headers).get("If-Match"), created.etag);
});

test("a missing portfolio version cannot overwrite another editor", async () => {
  let requests = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async () => { requests++; return Response.json({ data: portfolio }); }) as typeof fetch });
  await assert.rejects(savePortfolio(http, "workspace-1", { name: "Payments", description: "", responsibleIdentityId: null }, { id: portfolio.id, etag: null }, "portfolio-update-key"), /ETag/);
  assert.equal(requests, 0);
});

test("portfolio detail retains server ETag", async () => {
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "test.token.value",
    fetch: (async () => new Response(JSON.stringify({ data: portfolio }), { headers: { etag: 'W/"portfolio:portfolio-1:2"' } })) as typeof fetch });
  assert.equal((await getPortfolio(http, portfolio.id)).etag, '"portfolio:portfolio-1:2"');
});
