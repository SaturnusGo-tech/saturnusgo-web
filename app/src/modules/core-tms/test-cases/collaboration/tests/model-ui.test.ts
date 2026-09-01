import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDefectDeepLink, readDefectDeepLink } from "../../../defects/navigation/defect-deep-link";
import { canConfirmDefectFix, collaborationScopeKey, readyDefectCount, upsertNewestComment, type CaseLinkedDefect } from "../model/test-case-collaboration";
import {
  activityActorLabel, defectStepLabel, hasExactFixVerification, hasObservedYouTrackAcceptance,
  hasYouTrackSyncWarning, fixBlockedLabel,
  fixVerificationSourceLabel, supersededTransitionLabel, youTrackCreationLabel, youTrackTargetLabel,
} from "../../../presentation/cases/collaboration/model";
import { DEFECT_TRANSITION_POLL_DELAYS, pendingDefectTransitionSignature, scheduleDefectTransitionPoll } from "../../../state/case-collaboration/usePagedCaseResource";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const record = source("../../../presentation/cases/collaboration/defects/CaseDefectRecord.tsx");
const comments = source("../../../presentation/cases/collaboration/comments/CaseCommentsTab.tsx");
const activity = source("../../../presentation/cases/collaboration/defects/CaseActivityTab.tsx");
const panel = source("../../../presentation/cases/detail/CaseDetailPanel.tsx");
const controller = source("../../../state/case-collaboration/useCaseCollaboration.ts");
const paging = source("../../../state/case-collaboration/usePagedCaseResource.ts");
const defectResource = source("../../../state/defect-resource/useSelectedDefectResource.ts");
const defect = (blocked: CaseLinkedDefect["fixConfirmationBlockedReason"]): CaseLinkedDefect => ({
  defectId: "defect-1", defectEtag: '"defect:defect-1:2"', key: "BUG-1", title: "Crash",
  status: "ready_for_retest", readyForTest: true, reportedAt: "2026-09-01T08:00:00Z",
  reportedByIdentityId: "tester-1", occurrence: { id: "occurrence-1", runId: "run-1",
    runItemId: "item-1", attemptNo: 1, stepId: "step-2", stepOrder: 2,
    stepAction: "Tap Pay", createdAt: "2026-09-01T08:00:00Z" },
  falconUrl: "https://tms.example.test/?defectId=defect-1",
  youTrack: null, youTrackCreation: null, statusHistory: [], historyTruncated: false,
  eligibleRetest: blocked ? null : { occurrenceId: "occurrence-1", testCaseId: "case-1",
    runId: "run-2", runItemId: "item-2", attemptNo: 2, stepId: "step-2",
    completedAt: "2026-09-01T09:00:00Z" },
  fixVerification: null, youTrackTransition: null,
  fixConfirmationBlockedReason: blocked,
});
test("comment insertion is idempotent and keeps newest-first order", () => {
  const older = { id: "c-1", projectId: "p", caseId: "c", body: "Old",
    author: { identityId: "a", displayName: "Ada" }, createdAt: "2026-09-01T08:00:00Z" };
  const newer = { ...older, id: "c-2", body: "New", createdAt: "2026-09-01T09:00:00Z" };
  assert.deepEqual(upsertNewestComment([older, newer], newer).map(({ id }) => id), ["c-2", "c-1"]);
});
test("fix confirmation stays guarded by backend readiness and exact retest evidence", () => {
  assert.equal(canConfirmDefectFix(defect(null)), true);
  assert.equal(canConfirmDefectFix(defect("retest_required")), false);
  assert.equal(canConfirmDefectFix(defect("youtrack_not_ready_for_test")), false);
  assert.equal(canConfirmDefectFix(defect("youtrack_workflow_guard_required")), false);
  assert.equal(canConfirmDefectFix({ ...defect(null), eligibleRetest: {
    ...defect(null).eligibleRetest!, occurrenceId: "occurrence-2",
  } }), false);
  assert.match(fixBlockedLabel("ru", defect("youtrack_not_ready_for_test")), /YouTrack/);
  assert.match(fixBlockedLabel("ru", defect("youtrack_workflow_guard_required")), /workflow/);
  assert.equal(readyDefectCount([defect(null), { ...defect(null), readyForTest: false }]), 1);
});
test("verified status never substitutes for retest proof or observed YouTrack acceptance", () => {
  const statusOnly = { ...defect(null), status: "verified" as const };
  assert.equal(hasExactFixVerification(statusOnly), false);
  assert.equal(hasExactFixVerification({ ...statusOnly, fixVerification: {
    occurrenceId: "occurrence-1", testCaseId: "case-1", runId: "run-2",
    runItemId: "item-2", attemptNo: 2, stepId: "step-2",
    completedAt: "2026-09-01T09:00:00Z", verifiedAt: "2026-09-01T09:01:00Z",
  } }), true);
  const linked = { ...statusOnly, youTrack: { id: "yt-1", key: "APP-1",
    url: "https://yt.example.test/issue/APP-1", status: "Acceptance",
    workflowState: "acceptance", readyForTest: false,
    syncStatus: "linked" as const, lastSyncedAt: null } };
  assert.equal(hasObservedYouTrackAcceptance({ ...linked, youTrackTransition: {
    status: "published", targetStatus: "Acceptance", observedAccepted: false,
    lastErrorCode: null,
  } }), false);
  assert.equal(hasObservedYouTrackAcceptance({ ...linked, youTrackTransition: {
    status: "published", targetStatus: "Acceptance", observedAccepted: true,
    lastErrorCode: null,
  } }), true);
  assert.equal(hasYouTrackSyncWarning({ ...linked, youTrack: {
    ...linked.youTrack, syncStatus: "deleted",
  } }), true);
  const reopened = { ...linked, status: "reopened" as const, fixVerification: {
    occurrenceId: "occurrence-2", testCaseId: "case-1", runId: "run-2",
    runItemId: "item-2", attemptNo: 2, stepId: "step-2",
    completedAt: "2026-09-01T09:00:00Z", verifiedAt: "2026-09-01T09:01:00Z",
  }, youTrackTransition: { status: "published" as const, targetStatus: "Acceptance",
    observedAccepted: true, lastErrorCode: null } };
  assert.equal(hasExactFixVerification(reopened), false);
  assert.equal(fixVerificationSourceLabel("ru", reopened, "case-1"), "другого прогона этого шага");
  assert.equal(hasObservedYouTrackAcceptance(reopened), false);
});
test("pending YouTrack truth uses bounded fake-timer polling and stops on terminal states", () => {
  const linked = { ...defect(null), status: "verified" as const,
    youTrack: { id: "yt-1", key: "APP-1",
    url: "https://yt.example.test/issue/APP-1", status: "Acceptance",
    workflowState: "acceptance", readyForTest: true,
    syncStatus: "linked" as const, lastSyncedAt: null }, youTrackTransition: {
    status: "pending" as const, targetStatus: "Acceptance",
    observedAccepted: false, lastErrorCode: null,
  } };
  assert.match(pendingDefectTransitionSignature([linked]), /occurrence-1:pending/);
  assert.equal(pendingDefectTransitionSignature([{ ...linked,
    youTrackTransition: { ...linked.youTrackTransition, status: "failed" } }]), "");
  assert.equal(pendingDefectTransitionSignature([{ ...linked,
    youTrackTransition: { ...linked.youTrackTransition, status: "superseded" } }]), "");
  assert.doesNotMatch(supersededTransitionLabel("ru", true), /возвращён/);
  assert.match(supersededTransitionLabel("ru", false), /возвращён/);
  assert.equal(pendingDefectTransitionSignature([{ ...linked,
    youTrackTransition: { ...linked.youTrackTransition, observedAccepted: true } }]), "");
  assert.equal(pendingDefectTransitionSignature([{ ...linked, status: "reopened" }]), "");
  const creating = { ...defect("youtrack_link_required"), youTrackCreation: {
    target: "ios" as const, status: "pending" as const, lastErrorCode: null } };
  assert.match(pendingDefectTransitionSignature([creating]), /creation:pending/);
  assert.equal(pendingDefectTransitionSignature([{ ...creating, youTrackCreation: {
    ...creating.youTrackCreation, status: "published" } }]), "");
  const failedCreation = { ...creating, youTrackCreation: {
    ...creating.youTrackCreation, status: "failed" as const, lastErrorCode: "YOUTRACK_CREATE_FAILED" } };
  assert.equal(hasYouTrackSyncWarning(creating), false);
  assert.equal(hasYouTrackSyncWarning(defect(null)), false);
  assert.equal(hasYouTrackSyncWarning(failedCreation), true);
  assert.equal(hasYouTrackSyncWarning({ ...creating, youTrackCreation: { ...creating.youTrackCreation, status: "uncertain" } }), true);
  assert.match(youTrackCreationLabel("ru", failedCreation.youTrackCreation), /YOUTRACK_CREATE_FAILED/);
  let callback: (() => void) | null = null;
  let delay = 0;
  let cleared = false;
  let refreshes = 0;
  const cancel = scheduleDefectTransitionPoll(1, () => { refreshes += 1; }, {
    set: (next, wait) => { callback = next; delay = wait; return "timer-1"; },
    clear: (timer) => { cleared = timer === "timer-1"; },
  });
  assert.equal(delay, DEFECT_TRANSITION_POLL_DELAYS[1]);
  (callback as (() => void) | null)?.();
  assert.equal(refreshes, 1);
  cancel();
  assert.equal(cleared, true);
  let scheduledPastCap = false;
  scheduleDefectTransitionPoll(DEFECT_TRANSITION_POLL_DELAYS.length, () => {}, {
    set: () => { scheduledPastCap = true; return null; }, clear: () => {},
  });
  assert.equal(scheduledPastCap, false);
});
test("collaboration resources and mutations are isolated by project and case", () => {
  assert.notEqual(collaborationScopeKey("project-1", "case-1"), collaborationScopeKey("project-2", "case-1"));
  assert.match(controller, /scopeEpoch\.current !== epoch/);
  assert.match(paging, /currentScope\.current !== input\.scopeKey/);
  assert.match(paging, /current\.scope === input\.scopeKey/);
  assert.match(paging, /loadCasePageWindow/);
  assert.match(controller, /commentFailure\?\.scope === scopeKey/);
  assert.match(controller, /confirmationFailure\?\.scope === scopeKey/);
});
test("step labels use the immutable occurrence snapshot", () => {
  assert.equal(defectStepLabel("ru", defect(null).occurrence), "Шаг 2");
  assert.equal(defectStepLabel("en", {
    ...defect(null).occurrence, stepId: null, stepOrder: null, stepAction: null,
  }), "Entire test case");
  assert.equal(youTrackTargetLabel("ru", "Acceptance"), "Приёмка");
  assert.equal(youTrackTargetLabel("en", "Staging"), "Staging");
});
test("history never exposes raw identity or UUID actors", () => {
  assert.equal(activityActorLabel("identity_0192f7b2"), "Falcon");
  assert.equal(activityActorLabel("d9428888-122b-11e1-b85c-61cd3cbb3210"), "Falcon");
  assert.equal(activityActorLabel("Ada QA"), "Ada QA");
});
test("Falcon defect links preserve project scope and are reopenable", () => {
  const href = buildDefectDeepLink("https://tms.example.test/work/?caseId=c-1", {
    projectId: "project-1", defectId: "defect-1",
  });
  assert.deepEqual(readDefectDeepLink(href), { projectId: "project-1", defectId: "defect-1" });
  assert.deepEqual(readDefectDeepLink(
    "https://tms.example.test/work/?projectId=project-1&view=reports&defect=legacy-1",
  ), { projectId: "project-1", defectId: "legacy-1" });
  assert.deepEqual(readDefectDeepLink(
    "https://tms.example.test/work/?view=reports&defect=legacy-1",
  ), { projectId: null, defectId: "legacy-1" });
  assert.match(defectResource, /resource\.data\.projectId === projectId/);
});
test("collaboration UI exposes real links, cursor retry, and durable sync truth", () => {
  assert.match(record, /href=\{defect\.falconUrl\}/);
  assert.match(record, /href=\{defect\.youTrack\.url\}/);
  assert.match(record, /target="_blank" rel="noreferrer"/);
  assert.match(record, /defect\.reportedAt/);
  assert.match(record, /defect\.statusHistory\.map/);
  assert.match(record, /disabled=\{!allowed \|\| confirming\}/);
  assert.match(record, /defect\.youTrackTransition/);
  assert.match(record, /hasObservedYouTrackAcceptance/);
  assert.match(record, /syncWarning/);
  assert.match(record, /youTrackCreationLabel/);
  assert.match(record, /creation\.status === "pending"/);
  assert.match(record, /defect\.fixVerification/);
  assert.doesNotMatch(record, /model\.queuedTransition/);
  assert.match(comments, /event\.ctrlKey && !event\.metaKey/);
  assert.match(comments, /model\.retryComments/);
  assert.match(comments, /model\.loadMoreComments/);
  assert.match(comments, /loadMoreFailed/);
  assert.match(comments, /role="alert"/);
  assert.match(comments, /comment\.author\.displayName/);
  assert.match(comments, /<time dateTime=\{comment\.createdAt\}>/);
  assert.doesNotMatch(comments, /<form/);
  assert.match(activity, /model\.retryDefects/);
  assert.match(activity, /model\.loadMoreDefects/);
  assert.match(activity, /key=\{defect\.occurrence\.id\}/);
  assert.match(activity, /aria-busy="true"/);
  assert.doesNotMatch(activity, /status === "error"\) return/);
  assert.match(activity, /&& !props\.model\.defects\.refreshFailed/);
  assert.match(activity, /caseActivity\.length > 0/);
  assert.match(panel, /Готово к тестированию|Ready for testing/);
});
