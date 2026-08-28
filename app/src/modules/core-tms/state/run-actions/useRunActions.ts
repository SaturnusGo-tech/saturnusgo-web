import type { ExecutionStatus, TestRun } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { statusLabel } from "../../helpers/status/statusLabel";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
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

  function updateRun(nextRun: TestRun) {
    state.setData((current) => ({
      ...current,
      runs: current.runs.map((item) => item.id === nextRun.id ? nextRun : item),
    }));
  }

  async function setStepStatus(stepId: string, status: ExecutionStatus) {
    if (!derived.selectedRun || !derived.selectedRunItem) return;
    const nextRun = structuredClone(derived.selectedRun);
    const item = nextRun.items.find(
      (entry) => entry.id === derived.selectedRunItem!.id)!;
    const attempt = item.attempts.find(
      (entry) => entry.id === item.activeAttemptId,
    ) ?? item.attempts[0];
    const result = attempt.stepResults.find(
      (entry) => entry.stepId === stepId,
    );
    if (result) {
      result.status = status;
      result.updatedAt = new Date().toISOString();
    }
    item.status = attempt.stepResults.some((entry) => entry.status === "failed")
      ? "failed"
      : attempt.stepResults.some((entry) => entry.status === "blocked")
        ? "blocked"
        : "in_progress";
    attempt.status = item.status;
    if (state.connection === "demo") {
      updateRun(nextRun);
      return;
    }
    try {
      await http.mutate(
        `/runs/${derived.selectedRun.id}/items/${item.id}/steps/${stepId}`,
        "PATCH",
        { status },
      );
      if (status === "failed" || status === "blocked") {
        const remote = await http.mutate<TestRun>(
          `/runs/${derived.selectedRun.id}/items/${item.id}/status`,
          "PATCH",
          {
            status,
            actualResult:
              status === "failed" ? t("actions.stepFailure") : "",
            comment:
              status === "blocked" ? t("actions.stepBlocked") : "",
          },
        );
        updateRun(remote);
      } else {
        updateRun(nextRun);
      }
    } catch {
      notify(t("actions.stepSaveError"));
    }
  }

  function updateStepActualResult(stepId: string, value: string) {
    if (!derived.selectedRun || !derived.selectedRunItem) return;
    const nextRun = structuredClone(derived.selectedRun);
    const item = nextRun.items.find(
      (entry) => entry.id === derived.selectedRunItem!.id)!;
    const attempt = item.attempts.find(
      (entry) => entry.id === item.activeAttemptId,
    ) ?? item.attempts[0];
    const result = attempt.stepResults.find(
      (entry) => entry.stepId === stepId,
    );
    if (!result) return;
    result.actualResult = value;
    attempt.actualResult = value;
    updateRun(nextRun);
    if (state.connection === "demo") return;
    const previousRun = derived.selectedRun;
    http.mutate(
      `/runs/${derived.selectedRun.id}/items/${item.id}/steps/${stepId}`,
      "PATCH",
      { status: result.status, actualResult: value, comment: result.comment },
    ).catch(() => {
      updateRun(previousRun);
      notify(t("actions.actualSaveError"));
    });
  }

  async function setItemStatus(status: ExecutionStatus) {
    if (!derived.selectedRun || !derived.selectedRunItem) return;
    const nextRun = structuredClone(derived.selectedRun);
    const item = nextRun.items.find(
      (entry) => entry.id === derived.selectedRunItem!.id)!;
    const attempt = item.attempts.find(
      (entry) => entry.id === item.activeAttemptId,
    ) ?? item.attempts[0];
    if (status === "passed") {
      const requiredStepIds = executableSteps(item.snapshot)
        .filter((step) => step.required)
        .map((step) => step.id);
      const requiredStepsPassed = requiredStepIds.every(
        (requiredId) =>
          attempt.stepResults.find((result) => result.stepId === requiredId)
            ?.status === "passed",
      );
      if (!requiredStepsPassed) {
        notify(t("actions.passRequiredFirst"));
        return;
      }
    }
    if (status === "failed" && !attempt.actualResult.trim()) {
      attempt.actualResult = t("inlineDefect.observedDefault");
    }
    if (status === "blocked" && !attempt.comment.trim()) {
      attempt.comment = t("actions.executionBlockedDefault");
    }
    item.status = status;
    attempt.status = status;
    if (state.connection === "demo") {
      updateRun(nextRun);
      notify(t("actions.itemMarked", statusVariables(item.caseKey, status)));
      if (status !== "failed") {
        const index = nextRun.items.findIndex((entry) => entry.id === item.id);
        state.setSelectedRunItemId(nextRun.items[index + 1]?.id ?? item.id);
      }
      return;
    }
    try {
      const remote = await http.mutate<TestRun>(
        `/runs/${derived.selectedRun.id}/items/${item.id}/status`,
        "PATCH",
        {
          status,
          actualResult: attempt.actualResult,
          comment: attempt.comment,
        },
      );
      updateRun(remote);
    } catch {
      notify(t("actions.itemMarkError", statusVariables(item.caseKey, status)));
      return;
    }
    notify(t("actions.itemMarked", statusVariables(item.caseKey, status)));
    if (status !== "failed") {
      const index = nextRun.items.findIndex((entry) => entry.id === item.id);
      state.setSelectedRunItemId(nextRun.items[index + 1]?.id ?? item.id);
    }
  }

  async function completeRun() {
    if (!derived.selectedRun) return;
    if (state.connection === "demo") {
      updateRun({
        ...derived.selectedRun,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      notify(t("actions.runCompleted", { key: derived.selectedRun.key }));
      return;
    }
    try {
      const remote = await http.mutate<TestRun>(
        `/runs/${derived.selectedRun.id}/complete`,
        "POST",
      );
      updateRun(remote);
    } catch {
      notify(t("actions.runCannotComplete"));
      return;
    }
    notify(t("actions.runCompleted", { key: derived.selectedRun.key }));
  }

  return {
    openRunDialog, setStepStatus, updateStepActualResult, setItemStatus, completeRun,
  };
}
