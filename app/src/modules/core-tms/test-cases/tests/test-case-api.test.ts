import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createRunHistoryResource } from "../../state/run-history/run-history-resource";
import { listTestCases } from "../data/test-case-api";

type Api = components["schemas"];
const time = "2026-08-28T00:00:00.000Z";
const revision: Api["TestCaseRevision"] = {
  revision: 3, title: "Sign in", description: "", preconditions: "", type: "manual",
  lifecycle: "ready", priority: "critical", component: "Auth", ownerIdentityId: null,
  tags: ["smoke"], estimatedMinutes: 3, testData: "", steps: [], checklist: [],
  attachmentIds: [], changeNote: "Clarified", createdBy: "identity-1", createdAt: time,
};
const summary: Api["TestCaseRevisionSummary"] = {
  revision: 3, title: "Sign in", type: "manual", lifecycle: "ready", priority: "critical",
  component: "Auth", ownerIdentityId: null, estimatedMinutes: 3, changeNote: "Clarified",
  createdBy: "identity-1", createdAt: time,
};
const caseSummary = (id: number): Api["TestCaseSummary"] => ({
  id: `case-${id}`, projectId: "project-1", key: `HOST-TC-${id}`,
  folderPath: "/Host", currentRevision: 1, title: `Case ${id}`, type: "manual",
  lifecycle: "ready", priority: "medium", component: "Host", ownerIdentityId: null,
  tags: ["Host", "Ui"], estimatedMinutes: 2, revisionCount: 1, archivedAt: null,
  createdAt: time, updatedAt: time, etag: `"case-${id}:1"`,
});

test("test-case collection follows every cursor page", async () => {
  const urls: string[] = [];
  const pages = [
    { data: [caseSummary(240), caseSummary(239)], meta: { limit: 2, hasMore: true, nextCursor: "page-2" } },
    { data: [caseSummary(238)], meta: { limit: 2, hasMore: false, nextCursor: null } },
  ];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify(pages[urls.length - 1]), { status: 200 });
    }) as typeof fetch,
  });

  const result = await listTestCases(http, "project-1");

  assert.deepEqual(result.items.map((item) => item.key), ["HOST-TC-240", "HOST-TC-239", "HOST-TC-238"]);
  assert.equal(new URL(urls[0]!).searchParams.get("cursor"), null);
  assert.equal(new URL(urls[1]!).searchParams.get("cursor"), "page-2");
  assert.equal(result.meta.hasMore, false);
  assert.equal(result.meta.limit, 2);
});

test("test-case pagination stops before another request when cancelled", async () => {
  const controller = new AbortController();
  let calls = 0;
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async () => {
      calls += 1;
      controller.abort(new DOMException("Project changed", "AbortError"));
      return new Response(JSON.stringify({
        data: [caseSummary(240)],
        meta: { limit: 100, hasMore: true, nextCursor: "page-2" },
      }), { status: 200 });
    }) as typeof fetch,
  });

  await assert.rejects(() => listTestCases(http, "project-1", controller.signal), /Project changed/);
  assert.equal(calls, 1);
});

test("revision history preserves cursor pagination and immutable detail", async () => {
  const urls: string[] = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url) => {
      urls.push(String(url));
      const body = String(url).includes("?")
        ? { data: [summary], meta: { nextCursor: "older", limit: 20 } }
        : { data: revision };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch,
  });
  const history = createRunHistoryResource(http);
  const page = await history.listRevisions("case-1", { cursor: "current", limit: 20 });
  const detail = await history.getRevision("case-1", 3);

  assert.equal(new URL(urls[0]!).searchParams.get("cursor"), "current");
  assert.equal(new URL(urls[0]!).searchParams.get("limit"), "20");
  assert.equal(page.items[0]?.changeNote, "Clarified");
  assert.deepEqual(detail.tags, ["smoke"]);
  assert.equal(urls[1]?.endsWith("/test-cases/case-1/revisions/3"), true);
});
