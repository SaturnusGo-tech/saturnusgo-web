import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../core/tms/generated/tms-api";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { createRunItemMutationQueue } from "../../state/run-actions/run-item-mutation-queue";
import { stepMutationEvidence } from "../../state/run-actions/useRunActions";
import { createRunHistoryResource } from "../../state/run-history/run-history-resource";
import { createRunLifecycleActions } from "../../state/run-lifecycle/run-lifecycle-actions";
import { listRunItems, updateRunStep } from "../data/run-api";
import { mapRunItem } from "../data/run-mapper";
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
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null,
  archiveReason: null, createdAt: time, updatedAt: time,
};
test("run execution follows every item cursor page", async () => {
  const urls: string[] = [];
  const itemSummary = ({ snapshot: _snapshot, activeAttempt: _attempt, ...value }: Api["RunItem"]): Api["RunItemSummary"] => value;
  const pages = [
    { data: [itemSummary(item)], meta: { limit: 1, hasMore: true, nextCursor: "page-2" } },
    { data: [itemSummary({ ...item, id: "item-2", caseId: "case-2", caseKey: "TMS-TC-2" })], meta: { limit: 1, hasMore: false, nextCursor: null } },
  ];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify(pages[urls.length - 1]), { status: 200 });
    }) as typeof fetch,
  });

  const result = await listRunItems(http, "run-1");

  assert.deepEqual(result.items.map((value) => value.id), ["item-1", "item-2"]);
  assert.equal(new URL(urls[1]!).searchParams.get("cursor"), "page-2");
  assert.equal(result.meta.limit, 1);
});
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
  const keys = ["start-key", "abort-key", "retest-key", "archive-key", "restore-key"];
  const actions = createRunLifecycleActions(http, () => keys.shift()!);

  await actions.start("run-1", '"run-1:1"');
  await actions.abort("run-1", '"run-1:2"', "Build withdrawn");
  const retested = await actions.retest("run-1", "item-1", '"item-1:1"');
  await actions.archive("run-1", '"run-1:3"', "Removed from active list");
  await actions.restore("run-1", '"run-1:4"');

  assert.deepEqual(calls.map(({ url }) => new URL(url).pathname), [
    "/api/v1/runs/run-1/start", "/api/v1/runs/run-1/abort", "/api/v1/runs/run-1/items/item-1/retest",
    "/api/v1/runs/run-1", "/api/v1/runs/run-1/restore",
  ]);
  const headerValues = (name: string) => calls.map(({ init }) => new Headers(init.headers).get(name));
  assert.deepEqual(headerValues("idempotency-key"), ["start-key", "abort-key", "retest-key", "archive-key", "restore-key"]);
  assert.deepEqual(headerValues("if-match"), ['"run-1:1"', '"run-1:2"', '"item-1:1"', '"run-1:3"', '"run-1:4"']);
  assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), { reason: "Build withdrawn" });
  assert.equal(calls[3]?.init.method, "DELETE");
  assert.deepEqual(JSON.parse(String(calls[3]?.init.body)), { reason: "Removed from active list" });
  assert.equal(calls[4]?.init.method, "POST");
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

test("serializes rapid writes so each mutation receives the latest item ETag", async () => {
  const queue = createRunItemMutationQueue<{ id: string; value: number }>();
  queue.sync({ data: { id: "item-1", value: 0 }, etag: '"item-1:1"' });
  const seenEtags: Array<string | null> = [];
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });

  const first = queue.run("item-1", async (current) => {
    seenEtags.push(current.etag);
    await firstGate;
    return { data: { id: "item-1", value: 1 }, etag: '"item-1:2"' };
  });
  const second = queue.run("item-1", async (current) => {
    seenEtags.push(current.etag);
    return { data: { id: "item-1", value: 2 }, etag: '"item-1:3"' };
  });
  queue.sync({ data: { id: "item-1", value: 0 }, etag: '"item-1:1"' });
  releaseFirst();

  const resources = await Promise.all([first, second]);
  assert.deepEqual(seenEtags, ['"item-1:1"', '"item-1:2"']);
  assert.equal(resources[1]?.data.value, 2);
  assert.equal(resources[1]?.etag, '"item-1:3"');
});

test("continues queued work from a resource refreshed after a stale write", async () => {
  const queue = createRunItemMutationQueue<{ id: string; value: number }>();
  queue.sync({ data: { id: "item-1", value: 0 }, etag: '"item-1:1"' });
  const stale = queue.run("item-1", async () => {
    queue.replace({ data: { id: "item-1", value: 4 }, etag: '"item-1:5"' });
    throw new Error("stale ETag");
  });
  const next = queue.run("item-1", async (current) => ({
    data: { id: current.data.id, value: current.data.value + 1 },
    etag: '"item-1:6"',
  }));

  await assert.rejects(stale, /stale ETag/);
  assert.deepEqual(await next, {
    data: { id: "item-1", value: 5 },
    etag: '"item-1:6"',
  });
});

test("supplies the evidence required by failed and blocked step transitions", () => {
  const defaults = { failure: "Observed result differs", blocked: "Dependency unavailable" };
  assert.deepEqual(stepMutationEvidence("failed", undefined, defaults), {
    actualResult: defaults.failure, comment: "",
  });
  assert.deepEqual(stepMutationEvidence("blocked", undefined, defaults), {
    actualResult: "", comment: defaults.blocked,
  });
  assert.deepEqual(stepMutationEvidence("failed", {
    actualResult: "Checkout returned 502", comment: "Captured at 12:00",
  }, defaults), {
    actualResult: "Checkout returned 502", comment: "Captured at 12:00",
  });
});

test("chains step PATCH mutations with the returned ETag and distinct keys", async () => {
  const calls: RequestInit[] = [];
  let version = 1;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "token", fetch: (async (_url, init = {}) => {
      calls.push(init); version += 1;
      const status = version === 2 ? "passed" : "failed";
      const result = { stepId: "step-1", status, actualResult: status === "failed" ? "Mismatch" : "",
        comment: "", attachmentIds: [], updatedAt: time };
      return new Response(JSON.stringify({ data: { runId: "run-1", runItemId: "item-1",
        attemptNo: 2, result } }), { status: 200, headers: { etag: `"item-1:${version}"` } });
    }) as typeof fetch });
  const current = mapRunItem({ ...item, activeAttempt: { ...attempt, stepResults: [
    { stepId: "step-1", status: "not_run", actualResult: "", comment: "", attachmentIds: [], updatedAt: time },
  ] } });
  const passed = await updateRunStep(http, "run-1", "item-1", "step-1", { status: "passed" }, current, '"item-1:1"', "step-pass-key");
  const failed = await updateRunStep(http, "run-1", "item-1", "step-1", { status: "failed", actualResult: "Mismatch" }, passed.data, passed.etag!, "step-fail-key");
  assert.deepEqual(calls.map((call) => call.method), ["PATCH", "PATCH"]);
  assert.deepEqual(calls.map((call) => new Headers(call.headers).get("if-match")), ['"item-1:1"', '"item-1:2"']);
  assert.deepEqual(calls.map((call) => new Headers(call.headers).get("idempotency-key")), ["step-pass-key", "step-fail-key"]);
  assert.equal(failed.data.attempts[0]?.stepResults[0]?.status, "failed");
});
