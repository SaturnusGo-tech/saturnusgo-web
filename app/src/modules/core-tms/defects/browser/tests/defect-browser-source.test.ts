import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createHttpDefectBrowser } from "../data/http-defect-browser";
import { DefectBrowserAccessError } from "../model/defect-browser-error";
import { createLocalDefectBrowser } from "../data/local-defect-browser";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";

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
  const groups = await source.groups({ projectId: "project-a", q: "Checkout & auth", scope: "active" }, "group-cursor", signal);
  assert.equal(groups.totals.total, 1200);
  await source.records({ projectId: "project-a", q: "Checkout & auth", severitySort: "desc", scope: "closed" }, "", "record-cursor", signal);
  assert.equal(urls[0].searchParams.get("limit"), "50");
  assert.equal(urls[0].searchParams.get("cursor"), "group-cursor");
  assert.equal(urls[0].searchParams.get("scope"), "active");
  assert.equal(urls[1].searchParams.has("component"), true);
  assert.equal(urls[1].searchParams.get("component"), "");
  assert.equal(urls[1].searchParams.get("q"), "Checkout & auth");
  assert.equal(urls[1].searchParams.get("severitySort"), "desc");
  assert.equal(urls[1].searchParams.get("cursor"), "record-cursor");
  assert.equal(urls[1].searchParams.get("scope"), "closed");
});

test("scope partitions lifecycle states before group counts, search and sorted records", async () => {
  const statuses: Defect["status"][] = ["open", "triaged", "in_progress", "ready_for_retest", "reopened", "verified", "closed"];
  const defects = statuses.map((status, index) => ({ id: `bug-${index}`, projectId: "project", key: `BUG-${index}`,
    title: "Платёж", description: "", status, component: index < 5 ? "Checkout" : "History",
    severity: index % 2 ? "critical" : "high", priority: "high", reproducibility: "always", assigneeIdentityId: null,
    labels: [], integrationTarget: null, externalIssue: null, runId: null, runItemId: null, stepId: null,
    expectedResult: "", actualResult: "", attachmentIds: [], linkIds: [], createdAt: "2026-09-13T00:00:00Z" } as Defect));
  defects.push({ ...defects[0], id: "other-project", projectId: "other" });
  const source = createLocalDefectBrowser(defects); const signal = new AbortController().signal;
  const active = { projectId: "project", q: "платеж", scope: "active" as const };
  const groups = await source.groups(active, null, signal);
  assert.deepEqual(groups.groups, [{ component: "Checkout", total: 5, open: 5, critical: 2 }]);
  assert.equal(groups.totals.total, 5);
  const records = await source.records({ ...active, severitySort: "desc" }, "Checkout", null, signal);
  assert.equal(records.items.length, 5);
  assert.ok(records.items.some(item => item.status === "ready_for_retest"));
  assert.deepEqual(records.items.slice(0, 2).map(item => item.severity), ["critical", "critical"]);
  const closed = await source.groups({ ...active, scope: "closed" }, null, signal);
  assert.deepEqual(closed.groups, [{ component: "History", total: 2, open: 0, critical: 0 }]);
  assert.equal((await source.records({ ...active, scope: "closed" }, "Checkout", null, signal)).items.length, 0);
  assert.equal((await source.groups({ ...active, scope: "all" }, null, signal)).totals.total, 7);
  assert.equal((await source.groups({ projectId: "project", q: "" }, null, signal)).totals.total, 7);
  assert.equal((await source.groups({ ...active, q: "missing" }, null, signal)).groupCount, 0);
  assert.deepEqual(defects.slice(0, 7).map(item => item.status), statuses);
});

test("revoked authorization has an explicit presentation-safe access error", async () => {
  const source = createHttpDefectBrowser(createClient(() => new Response(JSON.stringify({ error: {
    code: "FORBIDDEN", message: "Forbidden", requestId: "request-denied",
  } }), { status: 403, headers: { "content-type": "application/json" } })));
  await assert.rejects(source.groups({ projectId: "a", q: "" }, null, new AbortController().signal), DefectBrowserAccessError);
});
