import type { ExecutionStatus, RunItem } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { statusLabel } from "../../helpers/status/statusLabel";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import {
  getRun, transitionRun, updateRunItem, updateRunStep,
} from "../../runs/data/run-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useRunActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const { locale, t } = useTmsLocale();
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
    state.setSelectedRunItemDetail(item);
    state.setSelectedRunItemEtag(etag);
    state.setRunItems((current) => current.map((entry) => entry.id === item.id ? summary : entry));
  }

  async function refreshRun(runId: string) {
    const run = await getRun(http, runId);
    state.setData((current) => ({
      ...current,
      runs: current.runs.map((item) => item.id === runId ? run.data : item),
    }));
    state.setSelectedRunEtag(run.etag);
  }

  async function setStepStatus(stepId: string, status: ExecutionStatus) {
    const run = derived.selectedRun;
    const item = derived.selectedRunItem;
    const etag = state.selectedRunItemEtag;
    if (!run || !item || !etag || state.connection !== "connected") return;
    const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo)
      ?? item.attempts[0];
    const result = attempt.stepResults.find((entry) => entry.stepId === stepId);
    try {
      const refreshed = await updateRunStep(http, run.id, item.id, stepId, {
        status,
        actualResult: result?.actualResult ?? "",
        comment: result?.comment ?? "",
      }, etag, crypto.randomUUID());
      commitItem(refreshed.data, refreshed.etag);
      await refreshRun(run.id);
    } catch {
      notify(t("actions.stepSaveError"));
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
    state.setSelectedRunItemDetail(next);
  }

  async function setItemStatus(status: ExecutionStatus) {
    const run = derived.selectedRun;
    const item = derived.selectedRunItem;
    const etag = state.selectedRunItemEtag;
    if (!run || !item || !etag || state.connection !== "connected") return;
    const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo)
      ?? item.attempts[0];
    if (status === "passed") {
      const required = executableSteps(item.snapshot).filter((step) => step.required);
      if (!required.every((step) => attempt.stepResults.find((entry) => entry.stepId === step.id)?.status === "passed")) {
        notify(t("actions.passRequiredFirst"));
        return;
      }
    }
    const actualResult = status === "failed"
      ? attempt.actualResult || t("inlineDefect.observedDefault")
      : attempt.actualResult;
    const blockedReason = status === "blocked"
      ? attempt.blockedReason || t("actions.executionBlockedDefault")
      : undefined;
    try {
      const refreshed = await updateRunItem(http, run.id, item.id, {
        status, actualResult, comment: attempt.comment, blockedReason,
      }, etag, crypto.randomUUID());
      commitItem(refreshed.data, refreshed.etag);
      await refreshRun(run.id);
    } catch {
      notify(t("actions.itemMarkError", statusVariables(item.caseKey, status)));
      return;
    }
    notify(t("actions.itemMarked", statusVariables(item.caseKey, status)));
    if (status !== "failed") {
      const index = state.runItems.findIndex((entry) => entry.id === item.id);
      state.setSelectedRunItemId(state.runItems[index + 1]?.id ?? item.id);
    }
  }

  async function completeRun() {
    const run = derived.selectedRun;
    if (!run || !state.selectedRunEtag || state.connection !== "connected") return;
    try {
      await transitionRun(http, run.id, "complete", state.selectedRunEtag, crypto.randomUUID());
      await refreshRun(run.id);
    } catch {
      notify(t("actions.runCannotComplete"));
      return;
    }
    notify(t("actions.runCompleted", { key: run.key }));
  }

  return {
    openRunDialog, setStepStatus, updateStepActualResult, setItemStatus, completeRun,
  };
}
