import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";

export type CaseCollaborationLoadStatus =
  | "unavailable" | "loading" | "ready" | "error";

export type TestCaseComment = {
  id: string;
  projectId: string;
  caseId: string;
  body: string;
  author: { identityId: string; displayName: string };
  createdAt: string;
};

export type CaseRetestEvidence = {
  occurrenceId: string;
  testCaseId: string;
  runId: string;
  runItemId: string;
  attemptNo: number;
  stepId: string | null;
  completedAt: string;
};

export type CaseFixVerification = CaseRetestEvidence & {
  verifiedAt: string;
};

export type CaseDefectStatusEvent = {
  fromStatus: Defect["status"] | null;
  toStatus: Defect["status"];
  reason: string | null;
  occurredAt: string;
};

export type CaseLinkedDefect = {
  defectId: string;
  defectEtag: string;
  key: string;
  title: string;
  status: Defect["status"];
  readyForTest: boolean;
  reportedAt: string;
  reportedByIdentityId: string;
  occurrence: {
    id: string;
    runId: string;
    runItemId: string;
    attemptNo: number;
    stepId: string | null;
    stepOrder: number | null;
    stepAction: string | null;
    createdAt: string;
  };
  falconUrl: string;
  youTrack: null | {
    id: string;
    key: string;
    url: string;
    status: string;
    workflowState: string;
    readyForTest: boolean;
    syncStatus: "linked" | "error" | "deleted";
    lastSyncedAt: string | null;
  };
  youTrackCreation: null | {
    target: "android" | "ios" | "backend";
    status: "pending" | "published" | "failed" | "uncertain";
    lastErrorCode: string | null;
  };
  statusHistory: CaseDefectStatusEvent[];
  historyTruncated: boolean;
  eligibleRetest: CaseRetestEvidence | null;
  fixVerification: CaseFixVerification | null;
  youTrackTransition: null | {
    status: "pending" | "published" | "failed" | "superseded";
    targetStatus: string;
    observedAccepted: boolean;
    lastErrorCode: string | null;
  };
  fixConfirmationBlockedReason:
    | null
    | "not_ready_for_test"
    | "youtrack_link_required"
    | "youtrack_workflow_guard_required"
    | "youtrack_not_ready_for_test"
    | "retest_required";
};

export type CaseCollaborationResource<T> = {
  status: CaseCollaborationLoadStatus;
  items: T[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreFailed: boolean;
  refreshing: boolean;
  refreshFailed: boolean;
};

export type CaseCollaborationFailure =
  | "forbidden" | "stale" | "retest_required" | "youtrack_required"
  | "youtrack_workflow_guard" | "youtrack_not_ready"
  | "invalid_transition" | "unknown";

export function upsertNewestComment(
  comments: readonly TestCaseComment[],
  created: TestCaseComment,
) {
  return [created, ...comments.filter((comment) => comment.id !== created.id)]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function readyDefectCount(defects: readonly CaseLinkedDefect[]) {
  return new Set(defects.filter((defect) => defect.readyForTest)
    .map((defect) => defect.defectId)).size;
}

export function canConfirmDefectFix(defect: CaseLinkedDefect) {
  return defect.readyForTest
    && defect.fixConfirmationBlockedReason === null
    && defect.eligibleRetest !== null
    && defect.eligibleRetest.occurrenceId === defect.occurrence.id;
}

export function collaborationScopeKey(projectId: string, caseId: string) {
  return JSON.stringify([projectId, caseId]);
}

export function hasPendingYouTrackWork(defect: CaseLinkedDefect) {
  const transition = defect.youTrackTransition;
  return (!defect.youTrack && defect.youTrackCreation?.status === "pending")
    || ((defect.status === "verified" || defect.status === "closed")
      && defect.youTrack?.syncStatus === "linked"
      && (transition?.status === "pending" || transition?.status === "published")
      && transition.observedAccepted === false);
}
