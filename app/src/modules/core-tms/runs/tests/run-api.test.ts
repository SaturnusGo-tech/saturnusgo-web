import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createRunHistoryResource } from "../../state/run-history/run-history-resource";
import { createRunLifecycleActions } from "../../state/run-lifecycle/run-lifecycle-actions";

type Api = components["schemas"];
const time = "2026-08-28T00:00:00.000Z";
const attempt: Api["RunAttempt"] = {
  attemptNo: 2, status: "not_run", actualResult: "", comment: "", blockedReason: "",
  attachmentIds: [], startedAt: null, completedAt: null, createdAt: time, updatedAt: time,
  stepResults: [],
};
const item: Api["RunItem"] = {
  id: "item-1", caseId: "case-1", caseKey: "TMS-TC-1", revision: 2,
  assigneeIdentityId: null, status: "not_run", attemptCount: 2, activeAttemptNo: 2,
  createdAt: time, updatedAt: time,
  snapshot: {
    revision: 2, title: "Sign in", description: "", preconditions: "", type: "manual",
    lifecycle: "ready", priority: "high", component: "Auth", ownerIdentityId: null,
    tags: [], estimatedMinutes: 2, testData: "", steps: [], checklist: [], attachmentIds: [],
    changeNote: "Updated", createdBy: "identity-1", createdAt: time,
  },
  activeAttempt: attempt,
};
const run: Api["Run"] = {
  id: "run-1", projectId: "project-1", key: "TMS-TR-1", name: "Smoke", description: "",
  type: "smoke", status: "active",
  environment: { id: "env-1", key: "LOCAL", name: "Local", baseUrl: "https://example.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: "42", configuration: {}, itemCount: 1,
  progress: { total: 1, executed: 0, percent: 0,
    counts: { not_run: 1, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: time, completedAt: null,
  abortedAt: null, abortReason: null, createdAt: time, updatedAt: time,
};

test("run lifecycle sends strong ETags and one stable key per operation", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url, init = {}) => {
      calls.push({ url: String(url), init });
      const data = String(url).endsWith("/retest") ? item : run;
      return new Response(JSON.stringify({ data }), {
        status: String(url).endsWith("/retest") ? 201 : 200,
        headers: { etag: String(url).endsWith("/retest") ? '"item-1:2"' : '"run-1:2"' },
      });
    }) as typeof fetch,
  });
  const keys = ["start-key", "abort-key", "retest-key"];
  const actions = createRunLifecycleActions(http, () => keys.shift()!);

  await actions.start("run-1", '"run-1:1"');
  await actions.abort("run-1", '"run-1:2"', "Build withdrawn");
  const retested = await actions.retest("run-1", "item-1", '"item-1:1"');

  assert.deepEqual(calls.map(({ url }) => new URL(url).pathname), [
    "/api/v1/runs/run-1/start", "/api/v1/runs/run-1/abort",
    "/api/v1/runs/run-1/items/item-1/retest",
  ]);
  assert.deepEqual(calls.map(({ init }) => new Headers(init.headers).get("idempotency-key")),
    ["start-key", "abort-key", "retest-key"]);
  assert.deepEqual(calls.map(({ init }) => new Headers(init.headers).get("if-match")),
    ['"run-1:1"', '"run-1:2"', '"item-1:1"']);
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), { reason: "Build withdrawn" });
  assert.equal(retested.data.activeAttemptNo, 2);
  assert.equal(retested.etag, '"item-1:2"');
});

test("attempt history preserves cursor pagination and loads immutable detail", async () => {
  const urls: string[] = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url) => {
      urls.push(String(url));
      const body = String(url).includes("/attempts?")
        ? { data: [{ ...attempt, stepResults: undefined }], meta: { nextCursor: null, limit: 25 } }
        : { data: attempt };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch,
  });
  const history = createRunHistoryResource(http);
  const page = await history.listAttempts("run-1", "item-1", { cursor: "next page", limit: 25 });
  const detail = await history.getAttempt("run-1", "item-1", 2);

  assert.equal(new URL(urls[0]!).searchParams.get("cursor"), "next page");
  assert.equal(new URL(urls[0]!).searchParams.get("limit"), "25");
  assert.equal(page.items[0]?.attemptNo, 2);
  assert.equal(detail.stepResults.length, 0);
});
