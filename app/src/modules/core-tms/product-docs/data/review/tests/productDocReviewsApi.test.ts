import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createProductDocReviewsApi } from "../productDocReviewsApi";

test("review requests and decisions use document-scoped routes and retain the exact draft and command ID", async () => {
  const calls: unknown[][] = [];
  const http = {
    getResource: async (...args: unknown[]) => { calls.push(args); return { data: { reviews: [], currentDraftVersion: 3 } }; },
    mutateResource: async (...args: unknown[]) => { calls.push(args); return { data: { id: "r/1" } }; },
  } as unknown as TmsHttpClient;
  const api = createProductDocReviewsApi(http);
  const target = { workspaceId: "team-a", projectId: "project-a", docId: "doc/a" };
  const path = "/workspaces/team-a/projects/project-a/product-docs/doc%2Fa/reviews";
  const abort = new AbortController();
  const request = { expectedDraftVersion: 3, reviewerIdentityId: "qa-member", sectionId: "payments", commandId: "review-1" };
  const decision = { decision: "changes_requested", note: "Document the retry window.", commandId: "decision-1" } as const;
  await api.list(target, { cursor: "second", signal: abort.signal });
  await api.request(target, request);
  await api.decide(target, "r/1", decision);
  assert.deepEqual(calls, [[path + "?limit=30&cursor=second", abort.signal], [path, "POST", request],
    [path + "/r%2F1/decision", "POST", decision]]);
});
