import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createRunHistoryResource } from "../../state/run-history/run-history-resource";

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
