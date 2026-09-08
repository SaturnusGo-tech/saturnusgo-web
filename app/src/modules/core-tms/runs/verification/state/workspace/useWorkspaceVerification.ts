import { useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { useWorkspaceState } from "../../../../state/workspace/useWorkspaceState";
import type { useWorkspaceDerived } from "../../../../state/workspace-derived/useWorkspaceDerived";
import { createVerificationRunStarter } from "../../application/verification-run-starter";
import { buildVerificationRunRequest } from "../../application/request/build-verification-run-request";
import { useVerificationQueue } from "../useVerificationQueue";

export function useWorkspaceVerification(state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>, openRun: (runId: string, itemId: string | null) => void) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const projectId = derived.project?.id ?? "";
  const capabilities = state.data.meta.authorization.capabilities;
  const connected = state.connection === "connected" && Boolean(projectId);
  const canRead = connected && capabilities.includes("defect:read") && capabilities.includes("run:read");
  const canStart = canRead && capabilities.includes("run:manage") && capabilities.includes("run:execute");
  const queue = useVerificationQueue(projectId, canRead, ru);
  const environments = derived.projectEnvironments.filter((item) => item.status !== "archived");
  const defaultEnvironment = environments.find((item) => item.id === derived.selectedRun?.environment.id)?.id
    ?? environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "";
  const defaultBuild = derived.selectedRun?.build ?? "local-current";
  const editorOpen = state.dialog === "case" || state.caseSubmitting;
  const scope = JSON.stringify([state.data.workspace.id, projectId, connected, canStart, editorOpen]);
  const owner = useRef(scope); owner.current = scope;
  const controller = useRef<AbortController | null>(null);
  const starter = useRef<ReturnType<typeof createVerificationRunStarter> | null>(null);
  if (!starter.current) starter.current = createVerificationRunStarter(http);
  const [operation, setOperation] = useState({ scope: "", pending: false, error: "" });
  useEffect(() => {
    setOperation({ scope, pending: false, error: "" });
    return () => controller.current?.abort();
  }, [scope]);
  const unresolved = starter.current.pending(projectId);
  const environmentId = unresolved?.environmentId ?? defaultEnvironment;
  const build = unresolved?.build ?? defaultBuild;
  const pending = operation.scope === scope && operation.pending;
  const error = operation.scope === scope ? operation.error : "";
  const environmentAvailable = derived.projectEnvironments.some((item) => item.id === environmentId && item.status !== "archived");
  const disabledReason = !canStart ? (ru ? "Недостаточно прав для запуска проверки." : "You cannot start verification runs.")
    : editorOpen ? (ru ? "Сначала сохраните изменения." : "Save your changes first.")
    : !environmentAvailable && !unresolved ? (ru ? "Добавьте окружение в настройках проекта." : "Add an environment in project settings.")
    : !build.trim() ? (ru ? "Укажите проверяемую сборку." : "Enter the build to verify.")
    : build.trim().length > 500 ? (ru ? "Идентификатор сборки: до 500 символов." : "Build reference: up to 500 characters.")
    : queue.data && !queue.data.totalCases && !queue.error && !unresolved ? (ru ? "Связанных кейсов на проверку пока нет." : "No linked cases are waiting for QA.") : "";
  async function start() {
    if (disabledReason || pending || (controller.current && !controller.current.signal.aborted)) return;
    const request = new AbortController(); controller.current = request;
    setOperation({ scope, pending: true, error: "" });
    try {
      const latest = !unresolved && (queue.error || !queue.data) ? await queue.refresh() : queue.data;
      if (owner.current !== scope || request.signal.aborted) return;
      const token = unresolved?.scopeToken ?? latest?.scopeToken;
      if (!token || (!unresolved && !latest?.totalCases)) {
        state.setNotice(latest ? (ru ? "Связанных кейсов на проверку пока нет." : "No linked cases are waiting for QA.")
          : (ru ? "Не удалось загрузить исправления. Повторите попытку." : "Could not load the fixes. Please retry."));
        setOperation({ scope, pending: false, error: "" });
        return;
      }
      const result = await starter.current!.start(projectId,
        buildVerificationRunRequest(token, environmentId, build, ru), request.signal);
      if (owner.current !== scope || request.signal.aborted) return;
      state.setData((data) => ({ ...data, runs: [result.data, ...data.runs.filter((run) => run.id !== result.data.id)] }));
      state.setSelectedRunEtag(result.etag);
      setOperation({ scope, pending: false, error: "" });
      openRun(result.data.id, result.data.id === derived.selectedRun?.id
        ? derived.selectedRunItem?.id ?? state.runItems[0]?.id ?? null : null);
      void queue.refresh();
    } catch (failure) {
      if (owner.current !== scope || request.signal.aborted) return;
      const changed = failure instanceof TmsApiError && failure.status === 409 && failure.code !== "INVALID_TRANSITION";
      if (changed) void queue.refresh();
      const message = changed ? (ru ? "Состав исправлений изменился. Нажмите «Проверить исправления» ещё раз."
        : "The fixes changed. Select Verify fixes again.")
        : failure instanceof TmsApiError && failure.status === 403
        ? (ru ? "Недостаточно прав для запуска проверки." : "You cannot start verification runs.")
        : failure instanceof TmsApiError && ([400, 404, 422].includes(failure.status) || failure.code === "INVALID_TRANSITION")
        ? (ru ? "Не удалось создать прогон. Проверьте окружение и сборку в настройках проекта."
          : "Could not create the run. Check the environment and build in project settings.")
        : (ru ? "Запуск не подтверждён. Повторите: Falcon проверит тот же запрос без дублирования прогона."
          : "The start was not confirmed. Retry: Falcon will reuse the same request without duplicating the run.");
      setOperation({ scope, pending: false, error: message });
      state.setNotice(message);
    } finally { if (controller.current === request) controller.current = null; }
  }
  return { ...queue, enabled: canRead, canStart, pendingStart: pending, startError: error, start,
    disabledReason, environmentId, build, unresolved: Boolean(unresolved) };
}
export type WorkspaceVerification = ReturnType<typeof useWorkspaceVerification>;
