import { useCallback, useEffect, useRef, useState } from "react";
import { resolvePendingOperation, type PendingOperation } from "../../../../core/tms/idempotency/pending-operation";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import {
  confirmDefectFix, createTestCaseComment, listTestCaseComments, listTestCaseDefects,
} from "../../test-cases/collaboration/data/test-case-collaboration-api";
import {
  canConfirmDefectFix, type CaseCollaborationFailure, type CaseLinkedDefect,
  collaborationScopeKey, type TestCaseComment, upsertNewestComment,
} from "../../test-cases/collaboration/model/test-case-collaboration";
import {
  classifyCollaborationFailure, DEFECT_TRANSITION_POLL_DELAYS,
  pendingDefectTransitionSignature, scheduleDefectTransitionPoll,
  usePagedCaseResource,
} from "./usePagedCaseResource";

type Input = {
  active: boolean; connected: boolean; projectId: string; caseId: string;
  canComment: boolean; canConfirmFix: boolean;
};

const commentKey = (comment: TestCaseComment) => comment.id;
const defectKey = (defect: CaseLinkedDefect) => defect.occurrence.id;
export const DEFECT_VISIBLE_REFRESH_INTERVAL = 30_000;
type IntervalApi = { set: (callback: () => void, delay: number) => unknown;
  clear: (timer: unknown) => void };
export function scheduleVisibleDefectRefresh(refresh: () => void, timers: IntervalApi = {
  set: (callback, delay) => setInterval(callback, delay),
  clear: (timer) => clearInterval(timer as ReturnType<typeof setInterval>),
}) {
  const timer = timers.set(refresh, DEFECT_VISIBLE_REFRESH_INTERVAL);
  return () => timers.clear(timer);
}

export function useCaseCollaboration(input: Input) {
  const http = useTmsHttpClient();
  const available = input.connected && Boolean(input.projectId && input.caseId);
  const scopeKey = available ? collaborationScopeKey(input.projectId, input.caseId) : "";
  const loadComments = useCallback((cursor: string | null, signal: AbortSignal) => (
    listTestCaseComments(http, input.projectId, input.caseId, cursor, signal)
  ), [http, input.caseId, input.projectId]);
  const loadDefects = useCallback((cursor: string | null, signal: AbortSignal) => (
    listTestCaseDefects(http, input.projectId, input.caseId, cursor, signal)
  ), [http, input.caseId, input.projectId]);
  const commentPages = usePagedCaseResource({
    active: input.active, available, scopeKey, load: loadComments, keyOf: commentKey,
  });
  const defectPages = usePagedCaseResource({
    active: input.active, available, scopeKey, load: loadDefects, keyOf: defectKey,
  });
  const [commentPending, setCommentPending] = useState({ scope: "", active: false });
  const [commentFailure, setCommentFailure] = useState<{
    scope: string; reason: CaseCollaborationFailure } | null>(null);
  const [confirmationPending, setConfirmationPending] = useState<{
    scope: string; occurrenceId: string | null;
  }>({ scope: "", occurrenceId: null });
  const [confirmationFailure, setConfirmationFailure] = useState<{
    scope: string; occurrenceId: string; reason: CaseCollaborationFailure;
  } | null>(null);
  const commentOperation = useRef<PendingOperation | null>(null);
  const fixOperations = useRef(new Map<string, PendingOperation>());
  const transitionPoll = useRef({ scope: scopeKey, signature: "", attempt: 0 });
  const currentScope = useRef(scopeKey);
  const scopeEpoch = useRef(0);
  if (currentScope.current !== scopeKey) {
    currentScope.current = scopeKey;
    scopeEpoch.current += 1;
  }
  const commentSubmitting = commentPending.scope === scopeKey && commentPending.active;
  const confirmingOccurrenceId = confirmationPending.scope === scopeKey
    ? confirmationPending.occurrenceId : null;

  useEffect(() => {
    setCommentFailure(null);
    setConfirmationFailure(null);
    setCommentPending({ scope: scopeKey, active: false });
    setConfirmationPending({ scope: scopeKey, occurrenceId: null });
    commentOperation.current = null;
    fixOperations.current.clear();
    transitionPoll.current = { scope: scopeKey, signature: "", attempt: 0 };
  }, [scopeKey]);

  const pendingTransition = pendingDefectTransitionSignature(defectPages.resource.items);
  useEffect(() => {
    const state = transitionPoll.current;
    if (!available || !input.active || defectPages.resource.status !== "ready"
      || defectPages.resource.refreshing) return;
    if (!pendingTransition) { state.signature = ""; state.attempt = 0; return; }
    if (state.scope !== scopeKey || state.signature !== pendingTransition) {
      state.scope = scopeKey; state.signature = pendingTransition; state.attempt = 0;
    }
    if (state.attempt >= DEFECT_TRANSITION_POLL_DELAYS.length) return;
    const attempt = state.attempt;
    state.attempt += 1;
    return scheduleDefectTransitionPoll(attempt, () => {
      if (document.visibilityState !== "hidden") defectPages.refresh();
    });
  }, [available, defectPages.refresh, defectPages.resource.refreshing,
    defectPages.resource.status, input.active, pendingTransition, scopeKey]);

  useEffect(() => {
    if (!available || !input.active || defectPages.resource.status !== "ready"
      || defectPages.resource.refreshing) return;
    const refresh = () => {
      if (document.visibilityState !== "hidden") defectPages.refresh();
    };
    const cancelInterval = scheduleVisibleDefectRefresh(refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelInterval();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [available, defectPages.refresh, defectPages.resource.refreshing,
    defectPages.resource.status, input.active, scopeKey]);

  const addComment = useCallback(async (rawBody: string) => {
    const body = rawBody.trim();
    if (!available || !input.canComment || !body || commentSubmitting) return false;
    const signature = JSON.stringify({ projectId: input.projectId, caseId: input.caseId, body });
    const operation = resolvePendingOperation(commentOperation.current, signature);
    const epoch = scopeEpoch.current;
    commentOperation.current = operation;
    setCommentPending({ scope: scopeKey, active: true });
    setCommentFailure(null);
    try {
      const created = await createTestCaseComment(
        http, input.projectId, input.caseId, body, operation.key,
      );
      if (currentScope.current !== scopeKey || scopeEpoch.current !== epoch) return false;
      commentPages.updateItems((items) => upsertNewestComment(items, created));
      commentOperation.current = null;
      return true;
    } catch (error) {
      if (currentScope.current === scopeKey && scopeEpoch.current === epoch) {
        setCommentFailure({ scope: scopeKey, reason: classifyCollaborationFailure(error) });
      }
      return false;
    } finally {
      if (currentScope.current === scopeKey && scopeEpoch.current === epoch) {
        setCommentPending({ scope: scopeKey, active: false });
      }
    }
  }, [available, commentPages.updateItems, commentSubmitting, http,
    input.canComment, input.caseId, input.projectId, scopeKey]);

  const confirmFix = useCallback(async (defect: CaseLinkedDefect) => {
    if (!available || !input.canConfirmFix || confirmingOccurrenceId
      || !canConfirmDefectFix(defect)) return false;
    const signature = JSON.stringify({
      defectId: defect.defectId, etag: defect.defectEtag, evidence: defect.eligibleRetest,
    });
    const operation = resolvePendingOperation(
      fixOperations.current.get(defect.occurrence.id) ?? null, signature,
    );
    const epoch = scopeEpoch.current;
    fixOperations.current.set(defect.occurrence.id, operation);
    setConfirmationPending({ scope: scopeKey, occurrenceId: defect.occurrence.id });
    setConfirmationFailure(null);
    try {
      await confirmDefectFix(http, defect, operation.key);
      if (currentScope.current !== scopeKey || scopeEpoch.current !== epoch) return false;
      fixOperations.current.delete(defect.occurrence.id);
      defectPages.refresh();
      return true;
    } catch (error) {
      if (currentScope.current === scopeKey && scopeEpoch.current === epoch) {
        setConfirmationFailure({
          scope: scopeKey, occurrenceId: defect.occurrence.id,
          reason: classifyCollaborationFailure(error),
        });
        if (error instanceof TmsApiError && [409, 412].includes(error.status)) {
          defectPages.refresh();
        }
      }
      return false;
    } finally {
      if (currentScope.current === scopeKey && scopeEpoch.current === epoch) {
        setConfirmationPending({ scope: scopeKey, occurrenceId: null });
      }
    }
  }, [available, confirmingOccurrenceId, defectPages.refresh, http, input.canConfirmFix, scopeKey]);

  return {
    comments: commentPages.resource, defects: defectPages.resource,
    canComment: input.canComment && available, canConfirmFix: input.canConfirmFix && available,
    commentSubmitting,
    commentFailure: commentFailure?.scope === scopeKey ? commentFailure.reason : null,
    confirmingOccurrenceId,
    confirmationFailure: confirmationFailure?.scope === scopeKey ? confirmationFailure : null,
    addComment, confirmFix,
    retryComments: commentPages.retry, retryDefects: defectPages.retry,
    loadMoreComments: commentPages.loadMore, loadMoreDefects: defectPages.loadMore,
    refreshComments: commentPages.refresh, refreshDefects: defectPages.refresh,
  };
}

export type CaseCollaborationController = ReturnType<typeof useCaseCollaboration>;
