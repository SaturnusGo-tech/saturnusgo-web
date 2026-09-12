import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createHttpDefectBrowser } from "../data/http-defect-browser";
import { DefectBrowserAccessError } from "../model/defect-browser-error";

const createClient = (handler: (url: URL) => Response) => createTmsHttpClient({
  apiBase: "https://api.example.test/api/v1", accessToken: async () => "header.payload.signature",
  fetch: (async (url: string | URL | Request) => handler(new URL(String(url)))) as typeof fetch,
});
test("HTTP source keeps exact blank component and passes query/sort/cursors without provider-only UI fields", async () => {
  const urls: URL[] = [];
  const http = createClient((url) => {
    urls.push(url);
    const data = url.pathname.endsWith("/groups") ? { groups: [{ component: "", total: 1200, open: 1190, critical: 10 }],
      totals: { total: 1200, open: 1190, critical: 10 }, groupCount: 1 } : [];
    return new Response(JSON.stringify({ data, meta: { limit: 50, hasMore: false, nextCursor: null } }),
      { status: 200, headers: { "content-type": "application/json" } });
  });
  const source = createHttpDefectBrowser(http); const signal = new AbortController().signal;
  const groups = await source.groups({ projectId: "project-a", q: "Checkout & auth" }, "group-cursor", signal);
  assert.equal(groups.totals.total, 1200);
  await source.records({ projectId: "project-a", q: "Checkout & auth", severitySort: "desc" }, "", "record-cursor", signal);
  assert.equal(urls[0].searchParams.get("limit"), "50");
  assert.equal(urls[0].searchParams.get("cursor"), "group-cursor");
  assert.equal(urls[1].searchParams.has("component"), true);
  assert.equal(urls[1].searchParams.get("component"), "");
  assert.equal(urls[1].searchParams.get("q"), "Checkout & auth");
  assert.equal(urls[1].searchParams.get("severitySort"), "desc");
  assert.equal(urls[1].searchParams.get("cursor"), "record-cursor");
});

test("revoked authorization has an explicit presentation-safe access error", async () => {
  const source = createHttpDefectBrowser(createClient(() => new Response(JSON.stringify({ error: {
    code: "FORBIDDEN", message: "Forbidden", requestId: "request-denied",
  } }), { status: 403, headers: { "content-type": "application/json" } })));
  await assert.rejects(source.groups({ projectId: "a", q: "" }, null, new AbortController().signal), DefectBrowserAccessError);
});
