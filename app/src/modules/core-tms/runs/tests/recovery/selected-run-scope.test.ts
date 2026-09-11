import assert from "node:assert/strict";
import test from "node:test";
import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { loadSelectedRun } from "../../../state/run-resource/load-selected-run";

const time = "2026-09-07T00:00:00.000Z";
const run: components["schemas"]["Run"] = {
  id: "run-1", projectId: "project-1", key: "TMS-TR-1", name: "Smoke", description: "",
  type: "smoke", status: "active", elapsedMilliseconds: 0, activeSince: "2026-09-11T00:00:00.000Z", measuredAt: "2026-09-11T00:00:00.000Z",
  environment: { id: "env-1", key: "QA", name: "QA", baseUrl: "https://qa.test", variableKeys: [] },
  suiteId: null, suiteResolutionId: null, build: "42", configuration: {}, itemCount: 0,
  progress: { total: 0, executed: 0, percent: 0,
    counts: { not_run: 0, in_progress: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 } },
  attachmentIds: [], createdBy: "identity-1", startedAt: time, completedAt: null,
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null,
  archiveReason: null, createdAt: time, updatedAt: time,
};

test("external run links resolve the exact run and check project scope before fetching items", async () => {
  const calls: string[] = [];
  const http = {
    async getResource(path: string) { calls.push(path); return { data: run, etag: '"run:1"' }; },
    async get(path: string) {
      calls.push(path);
      return { data: [], meta: { limit: 100, hasMore: false, nextCursor: null } };
    },
  } as unknown as TmsHttpClient;
  const loaded = await loadSelectedRun(http, "project-1", "run-1", new AbortController().signal);
  assert.equal(loaded.run.data.id, "run-1");
  assert.equal(loaded.run.etag, '"run:1"');
  assert.deepEqual(calls, ["/runs/run-1", "/runs/run-1/items?limit=100"]);
  calls.length = 0;
  await assert.rejects(() => loadSelectedRun(http, "foreign-project", "run-1", new AbortController().signal));
  assert.deepEqual(calls, ["/runs/run-1"]);
  calls.length = 0;
  await assert.rejects(() => loadSelectedRun(http, "project-1", "run-other", new AbortController().signal));
  assert.deepEqual(calls, ["/runs/run-other"]);
});

test("navigation cancellation stops late run responses before follow-up item requests", async () => {
  const controller = new AbortController();
  let requests = 0;
  const http = {
    async getResource() { requests += 1; controller.abort(); return { data: run, etag: '"run:1"' }; },
    async get() { requests += 1; throw new Error("Items must not be requested after navigation"); },
  } as unknown as TmsHttpClient;
  await assert.rejects(() => loadSelectedRun(http, "project-1", "run-1", controller.signal), { name: "AbortError" });
  assert.equal(requests, 1);
  await assert.rejects(() => loadSelectedRun(http, "project-1", "run-1", controller.signal), { name: "AbortError" });
  assert.equal(requests, 1);
});
