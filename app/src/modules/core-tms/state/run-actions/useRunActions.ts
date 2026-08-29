import { useRef } from "react";
import type { ExecutionStatus, RunItem, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../core/tms/idempotency/pending-operation";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { statusLabel } from "../../helpers/status/statusLabel";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { getRun, getRunItem, mutateRunWithEtagRecovery, transitionRun,
  updateRunItem, updateRunStep } from "../../runs/data/run-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";
import { createRunItemMutationQueue } from "./run-item-mutation-queue";

export function stepMutationEvidence(
  status: ExecutionStatus,
  current: { actualResult: string; comment: string } | undefined,
  defaults: { failure: string; blocked: string },
) {
  return {
    actualResult: status === "failed"
      ? current?.actualResult || defaults.failure : current?.actualResult ?? "",
    comment: status === "blocked"
      ? current?.comment || defaults.blocked : current?.comment ?? "",
  };
}

export async function refreshRunAfterSuccessfulMutation(
  refresh: () => Promise<void>, invalidateEtag: () => void,
) {
  try { await refresh(); } catch { invalidateEtag(); }
}

export function useRunActions(
  state: ReturnType<typeof useWorkspaceState>, derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const { locale, t } = useTmsLocale();
  const queueRef = useRef<ReturnType<typeof createRunItemMutationQueue<RunItem>> | null>(null);
  const completeOperation = useRef<PendingOperation | null>(null);
  if (!queueRef.current) queueRef.current = createRunItemMutationQueue<RunItem>();
  const itemMutations = queueRef.current;
  if (derived.selectedRunItem && state.selectedRunItemEtag) {
    itemMutations.sync({ data: derived.selectedRunItem, etag: state.selectedRunItemEtag });
  }
  const statusVariables = (key: string, status: ExecutionStatus) => ({
    key, status: statusLabel(locale, status),
  });

  function openRunDialog(options?: { suiteId?: string; caseIds?: string[] }) {
    if (options?.suiteId) state.setSelectedSuiteId(options.suiteId);
    state.setRunPresetSuiteId(options?.suiteId ?? "");
    state.setRunPresetCaseIds(options?.caseIds ?? []);
    state.setDialog("run");
  }

  function commitItem(item: RunItem, etag: string | null) {
    const { snapshot: _snapshot, attempts: _attempts, ...summary } = item;
    itemMutations.replace({ data: item, etag });
    state.setSelectedRunItemDetail(item);
    state.setSelectedRunItemEtag(etag);
    state.setRunItems((current) => current.map((entry) => entry.id === item.id ? summary : entry));
  }

  function commitRun(run: TestRunSummary, etag: string | null) {
    state.setData((current) => ({ ...current,
      runs: current.runs.map((item) => item.id === run.id ? run : item) }));
    state.setSelectedRunEtag(etag);
  }

  async function refreshRun(runId: string) {
    const run = await getRun(http, runId);
    commitRun(run.data, run.etag);
  }

  async function recoverStaleItem(runId: string, itemId: string, error: unknown) {
    if (!(error instanceof TmsApiError) || error.status !== 412) return;
    try { const current = await getRunItem(http, runId, itemId);
      commitItem(current.data, current.etag); } catch {}
  }

  async function setStepStatus(stepId: string, status: ExecutionStatus) {
    const run = derived.selectedRun;
    const item = derived.selectedRunItem;
    if (!run || !item || !state.selectedRunItemEtag || state.connection !== "connected") return;
    const key = crypto.randomUUID();
    try {
      await itemMutations.run(item.id, async (current) => {
        if (!current.etag) throw new Error("Run item ETag is required.");
        const attempt = current.data.attempts.find((entry) =>
          entry.attemptNo === current.data.activeAttemptNo) ?? current.data.attempts[0];
        const result = attempt.stepResults.find((entry) => entry.stepId === stepId);
        try {
          const evidence = stepMutationEvidence(status, result, {
            failure: t("inlineDefect.observedDefault"), blocked: t("actions.stepBlocked"),
          });
          const refreshed = await updateRunStep(http, run.id, item.id, stepId, {
            status, ...evidence,
          }, current.data, current.etag, key);
          commitItem(refreshed.data, refreshed.etag);
          await refreshRunAfterSuccessfulMutation(() => refreshRun(run.id),
            () => state.setSelectedRunEtag(null));
          return refreshed;
        } catch (error) {
          await recoverStaleItem(run.id, item.id, error);
          throw error;
        }
      });
    } catch (error) {
      notify(formatTmsMutationFailure(toTmsMutationFailure(error), t("actions.stepSaveError")));
    }
  }

  function updateStepActualResult(stepId: string, value: string) {
    const item = derived.selectedRunItem;
    if (!item) return;
    const next = structuredClone(item);
    const attempt = next.attempts.find((entry) => entry.attemptNo === next.activeAttemptNo)
      ?? next.attempts[0];
    const result = attempt.stepResults.find((entry) => entry.stepId === stepId);
    if (!result) return;
    result.actualResult = value;
    attempt.actualResult = value;
    itemMutations.patch(item.id, () => next);
    state.setSelectedRunItemDetail(next);
  }

  async function setItemStatus(status: ExecutionStatus) {
    const run = derived.selectedRun;
    const item = derived.selectedRunItem;
    if (!run || !item || !state.selectedRunItemEtag || state.connection !== "connected") return;
    const key = crypto.randomUUID();
    let policyBlocked = false;
    try {
      await itemMutations.run(item.id, async (current) => {
        if (!current.etag) throw new Error("Run item ETag is required.");
        const currentItem = current.data;
        const attempt = currentItem.attempts.find((entry) =>
          entry.attemptNo === currentItem.activeAttemptNo) ?? currentItem.attempts[0];
        const required = executableSteps(currentItem.snapshot).filter((step) => step.required);
        if (status === "passed" && !required.every((step) => attempt.stepResults.find(
          (entry) => entry.stepId === step.id)?.status === "passed")) {
          policyBlocked = true;
          return current;
        }
        const actualResult = status === "failed" ? attempt.actualResult ||
          t("inlineDefect.observedDefault") : attempt.actualResult;
        const blockedReason = status === "blocked" ? attempt.blockedReason ||
          t("actions.executionBlockedDefault") : undefined;
        try {
          const refreshed = await updateRunItem(http, run.id, item.id, {
            status, actualResult, comment: attempt.comment, blockedReason,
          }, current.etag, key);
          commitItem(refreshed.data, refreshed.etag);
          await refreshRunAfterSuccessfulMutation(() => refreshRun(run.id),
            () => state.setSelectedRunEtag(null));
          return refreshed;
        } catch (error) {
          await recoverStaleItem(run.id, item.id, error);
          throw error;
        }
      });
    } catch (error) {
      const fallback = t("actions.itemMarkError", statusVariables(item.caseKey, status));
      notify(formatTmsMutationFailure(toTmsMutationFailure(error), fallback));
      return;
    }
    if (policyBlocked) { notify(t("actions.passRequiredFirst")); return; }
    notify(t("actions.itemMarked", statusVariables(item.caseKey, status)));
    if (status !== "failed") {
      const index = state.runItems.findIndex((entry) => entry.id === item.id);
      state.setSelectedRunItemId(state.runItems[index + 1]?.id ?? item.id);
    }
  }

  async function completeRun() {
    const run = derived.selectedRun;
    if (!run || state.connection !== "connected") return;
    try {
      const completed = await mutateRunWithEtagRecovery(http, run.id,
        state.selectedRunEtag, (etag) => {
          completeOperation.current = resolvePendingOperation(
            completeOperation.current,
            JSON.stringify({ runId: run.id, transition: "complete", etag }));
          return transitionRun(http, run.id, "complete", etag, completeOperation.current.key);
        });
      completeOperation.current = null;
      commitRun(completed.data, completed.etag);
    } catch (error) {
      notify(formatTmsMutationFailure(toTmsMutationFailure(error),
        t("actions.runCannotComplete")));
      return;
    }
    notify(t("actions.runCompleted", { key: run.key }));
  }

  return { openRunDialog, setStepStatus, updateStepActualResult, setItemStatus, completeRun };
}
