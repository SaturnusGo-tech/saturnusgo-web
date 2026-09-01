import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import {
  confirmDefectFix, createTestCaseComment, listTestCaseComments, listTestCaseDefects,
} from "../data/test-case-collaboration-api";
import {
  appendUniqueCasePage, loadCasePageWindow, nextCasePageCursor,
} from "../model/case-pagination";
import type { CaseLinkedDefect } from "../model/test-case-collaboration";
import {
  DEFECT_VISIBLE_REFRESH_INTERVAL, scheduleVisibleDefectRefresh,
} from "../../../state/case-collaboration/useCaseCollaboration";

const time = "2026-09-01T09:00:00.000Z";
const comment = {
  id: "comment-1", projectId: "project-1", caseId: "case-1", body: "Retest on iOS 26",
  author: { identityId: "tester-1", displayName: "Ada QA" }, createdAt: time,
};
const linkedDefect: CaseLinkedDefect = {
  defectId: "defect-1", defectEtag: '"defect:defect-1:4"', key: "BUG-17",
  title: "Checkout crashes", status: "ready_for_retest", readyForTest: true,
  reportedAt: time, reportedByIdentityId: "tester-1", falconUrl: "https://tms.example.test/?projectId=project-1&defectId=defect-1",
  occurrence: { id: "occurrence-1", runId: "run-1", runItemId: "item-1", attemptNo: 1,
    stepId: "step-2", stepOrder: 2, stepAction: "Tap Pay", createdAt: time },
  youTrack: { id: "yt-1", key: "APP-17", url: "https://yt.example.test/issue/APP-17",
    status: "Ready for test", workflowState: "ready_for_test", readyForTest: true,
    syncStatus: "linked", lastSyncedAt: time },
  youTrackCreation: null,
  statusHistory: [{ fromStatus: "in_progress", toStatus: "ready_for_retest",
    reason: "Build deployed", occurredAt: time }], historyTruncated: false,
  eligibleRetest: { occurrenceId: "occurrence-1", testCaseId: "case-1", runId: "run-2",
    runItemId: "item-2", attemptNo: 2, stepId: "step-2",
    completedAt: "2026-09-01T10:00:00.000Z" },
  fixVerification: null,
  youTrackTransition: null,
  fixConfirmationBlockedReason: null,
};

test("case collaboration adapters keep tenant scope and mutation guards", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const responses = [
    { data: [comment], meta: { limit: 50, hasMore: false, nextCursor: null } },
    { data: comment },
    { data: [linkedDefect], meta: { limit: 50, hasMore: false, nextCursor: null } },
    { data: { defect: { id: "defect-1", status: "verified" },
      verification: { ...linkedDefect.eligibleRetest, verifiedAt: time },
      youTrackTransition: { status: "pending", targetStatus: "Acceptance",
        observedAccepted: false, lastErrorCode: null } } },
  ];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url, init) => {
      requests.push({ url: String(url), init });
      const body = responses[requests.length - 1];
      return new Response(JSON.stringify(body), { status: requests.length === 2 ? 201 : 200,
        headers: requests.length === 4 ? { etag: '"defect:defect-1:5"' } : undefined });
    }) as typeof fetch,
  });

  const comments = await listTestCaseComments(http, "project-1", "case-1");
  const created = await createTestCaseComment(
    http, "project-1", "case-1", "Retest on iOS 26", "comment-operation-1",
  );
  const defects = await listTestCaseDefects(http, "project-1", "case-1");
  const confirmed = await confirmDefectFix(http, linkedDefect, "fix-operation-123");

  assert.equal(comments.items[0]?.author.displayName, "Ada QA");
  assert.equal(created.body, "Retest on iOS 26");
  assert.equal(defects.items[0]?.eligibleRetest?.runId, "run-2");
  assert.equal(confirmed.data.youTrackTransition.status, "pending");
  assert.equal(new URL(requests[0]!.url).searchParams.get("projectId"), "project-1");
  assert.equal(new Headers(requests[1]!.init?.headers).get("idempotency-key"), "comment-operation-1");
  assert.equal(new Headers(requests[3]!.init?.headers).get("if-match"), linkedDefect.defectEtag);
  assert.equal(new Headers(requests[3]!.init?.headers).get("idempotency-key"), "fix-operation-123");
  assert.deepEqual(JSON.parse(String(requests[3]!.init?.body)), {
    occurrenceId: "occurrence-1", runId: "run-2", runItemId: "item-2",
    attemptNo: 2, stepId: "step-2",
  });
});

test("comments and defect history fetch one cursor page only when requested", async () => {
  const urls: string[] = [];
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async (url) => {
      const href = String(url);
      urls.push(href);
      const cursor = new URL(href).searchParams.get("cursor");
      const defectRequest = href.includes("/defects?");
      const data = defectRequest
        ? [{ ...linkedDefect, defectId: cursor ? "defect-2" : "defect-1",
          occurrence: { ...linkedDefect.occurrence, id: cursor ? "occurrence-2" : "occurrence-1" } }]
        : [{ ...comment, id: cursor ? "comment-2" : "comment-1" }];
      return new Response(JSON.stringify({ data, meta: cursor
        ? { limit: 50, hasMore: false, nextCursor: null }
        : { limit: 50, hasMore: true, nextCursor: defectRequest ? "defects-2" : "comments-2" } }),
      );
    }) as typeof fetch,
  });

  const comments = await listTestCaseComments(http, "project-1", "case-1");
  const olderComments = await listTestCaseComments(
    http, "project-1", "case-1", comments.meta.nextCursor,
  );
  const defects = await listTestCaseDefects(http, "project-1", "case-1");
  const olderDefects = await listTestCaseDefects(
    http, "project-1", "case-1", defects.meta.nextCursor,
  );

  assert.deepEqual(comments.items.map(({ id }) => id), ["comment-1"]);
  assert.deepEqual(olderComments.items.map(({ id }) => id), ["comment-2"]);
  assert.deepEqual(defects.items.map(({ defectId }) => defectId), ["defect-1"]);
  assert.deepEqual(olderDefects.items.map(({ defectId }) => defectId), ["defect-2"]);
  assert.equal(new URL(urls[1]!).searchParams.get("cursor"), "comments-2");
  assert.equal(new URL(urls[3]!).searchParams.get("cursor"), "defects-2");
});

test("a failed next comment page can be retried without dropping the first page", async () => {
  let attempts = 0;
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: (async () => {
      attempts += 1;
      return attempts === 2
        ? new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Retry" } }),
          { status: 500 })
        : new Response(JSON.stringify({ data: [{ ...comment,
          id: attempts === 1 ? "comment-1" : "comment-2" }], meta: attempts === 1
          ? { limit: 50, hasMore: true, nextCursor: "comments-2" }
          : { limit: 50, hasMore: false, nextCursor: null } }));
    }) as typeof fetch,
  });

  const first = await listTestCaseComments(http, "project-1", "case-1");
  await assert.rejects(() => listTestCaseComments(
    http, "project-1", "case-1", first.meta.nextCursor,
  ));
  assert.deepEqual(first.items.map(({ id }) => id), ["comment-1"]);
  const retried = await listTestCaseComments(
    http, "project-1", "case-1", first.meta.nextCursor,
  );
  assert.equal(attempts, 3);
  assert.deepEqual(appendUniqueCasePage(first.items, retried.items, ({ id }) => id)
    .map(({ id }) => id), ["comment-1", "comment-2"]);
});

test("history pagination dedupes pages and rejects a cursor cycle without losing items", () => {
  const loaded = appendUniqueCasePage(
    [comment], [{ ...comment }, { ...comment, id: "comment-2" }], ({ id }) => id,
  );
  assert.deepEqual(loaded.map(({ id }) => id), ["comment-1", "comment-2"]);
  assert.throws(
    () => nextCasePageCursor(
      { hasMore: true, nextCursor: "same-page" }, new Set(["same-page"]),
    ),
    /repeated cursor/,
  );
  assert.deepEqual(loaded.map(({ id }) => id), ["comment-1", "comment-2"]);
});

test("silent refresh atomically replays loaded cursors and keeps same-defect occurrences", async () => {
  const cursors: Array<string | null> = [];
  const firstPage = Array.from({ length: 50 }, (_, index) => ({ ...linkedDefect,
    occurrence: { ...linkedDefect.occurrence, id: `occurrence-${index + 1}` } }));
  const older = { ...linkedDefect, status: "verified" as const,
    occurrence: { ...linkedDefect.occurrence, id: "occurrence-51" } };
  const window = await loadCasePageWindow(async (cursor) => {
    cursors.push(cursor);
    return cursor === null
      ? { items: firstPage, meta: { hasMore: true, nextCursor: "defects-2" } }
      : { items: [older], meta: { hasMore: false, nextCursor: null } };
  }, 2, (item) => item.occurrence.id, new AbortController().signal);
  assert.deepEqual(cursors, [null, "defects-2"]);
  assert.equal(window.items.length, 51);
  assert.equal(window.items[50]?.status, "verified");
  assert.equal(new Set(window.items.map(({ defectId }) => defectId)).size, 1);
});

test("visible defect refresh interval has deterministic cleanup", () => {
  let callback: (() => void) | null = null;
  let delay = 0;
  let cleared = false;
  let refreshes = 0;
  const cancel = scheduleVisibleDefectRefresh(() => { refreshes += 1; }, {
    set: (next, wait) => { callback = next; delay = wait; return "refresh-timer"; },
    clear: (timer) => { cleared = timer === "refresh-timer"; },
  });
  assert.equal(delay, DEFECT_VISIBLE_REFRESH_INTERVAL);
  (callback as (() => void) | null)?.();
  assert.equal(refreshes, 1);
  cancel();
  assert.equal(cleared, true);
});
