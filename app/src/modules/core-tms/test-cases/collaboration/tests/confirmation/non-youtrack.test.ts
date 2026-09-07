import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { confirmDefectFix, listTestCaseDefects } from "../../data/test-case-collaboration-api";
import { canConfirmDefectFix, type CaseLinkedDefect } from "../../model/test-case-collaboration";
import { hasExactFixVerification, hasYouTrackSyncWarning } from "../../../../presentation/cases/collaboration/model";
import { pendingDefectTransitionSignature } from "../../../../state/case-collaboration/usePagedCaseResource";

const time = "2026-09-07T00:00:00.000Z";
const ready: CaseLinkedDefect = {
  defectId: "defect-linear", defectEtag: '"defect:defect-linear:4"', key: "BUG-1", title: "Linear defect",
  status: "ready_for_retest", readyForTest: true, reportedAt: time, reportedByIdentityId: "qa",
  falconUrl: "https://tms.example/work/?projectId=project-1&defectId=defect-linear",
  occurrence: { id: "occurrence-1", runId: "run-1", runItemId: "item-1", attemptNo: 1,
    stepId: "step-1", stepOrder: 1, stepAction: "Check release", createdAt: time },
  youTrack: null, youTrackCreation: null, youTrackTransition: null,
  statusHistory: [], historyTruncated: false, fixVerification: null, fixConfirmationBlockedReason: null,
  eligibleRetest: { occurrenceId: "occurrence-1", testCaseId: "case-1", runId: "run-1",
    runItemId: "item-1", attemptNo: 2, stepId: "step-1", completedAt: time },
};

test("a non-YouTrack confirmation preserves exact proof and creates no YouTrack pending state", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const verification = { ...ready.eligibleRetest!, verifiedAt: time };
  const refreshed: CaseLinkedDefect = { ...ready, defectEtag: '"defect:defect-linear:5"',
    status: "verified", readyForTest: false, eligibleRetest: null, fixVerification: verification };
  const http = createTmsHttpClient({ apiBase: "https://api.example/api/v1", accessToken: async () => "test",
    fetch: (async (url, init) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify(init?.method === "POST" ? {
        data: { defect: { id: ready.defectId, status: "verified" }, verification, youTrackTransition: null },
      } : { data: [refreshed], meta: { limit: 50, hasMore: false, nextCursor: null } }),
      { headers: { etag: refreshed.defectEtag } });
    }) as typeof fetch });

  assert.equal(canConfirmDefectFix(ready), true);
  const result = await confirmDefectFix(http, ready, "fix-linear-operation");
  assert.equal(result.data.youTrackTransition, null);
  assert.deepEqual(result.data.verification, verification);
  assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
    occurrenceId: "occurrence-1", runId: "run-1", runItemId: "item-1", attemptNo: 2, stepId: "step-1",
  });
  assert.equal(new Headers(requests[0]?.init?.headers).get("if-match"), ready.defectEtag);
  assert.equal(new Headers(requests[0]?.init?.headers).get("idempotency-key"), "fix-linear-operation");
  const page = await listTestCaseDefects(http, "project-1", "case-1");
  assert.equal(new URL(requests[1]!.url).searchParams.get("projectId"), "project-1");
  assert.equal(hasExactFixVerification(page.items[0]!), true);
  assert.equal(hasYouTrackSyncWarning(page.items[0]!), false);
  assert.equal(pendingDefectTransitionSignature(page.items), "");
  assert.equal(canConfirmDefectFix(page.items[0]!), false);
});

test("non-YouTrack fixes still require server-provided retest evidence before any request", async () => {
  let requests = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.example/api/v1", accessToken: async () => "test",
    fetch: (async () => { requests += 1; throw new Error("Unexpected request"); }) as typeof fetch });
  const withoutRetest = { ...ready, eligibleRetest: null, fixConfirmationBlockedReason: "retest_required" as const };
  assert.equal(canConfirmDefectFix(withoutRetest), false);
  await assert.rejects(() => confirmDefectFix(http, withoutRetest, "missing-proof"), /Retest evidence/);
  assert.equal(requests, 0);
});
