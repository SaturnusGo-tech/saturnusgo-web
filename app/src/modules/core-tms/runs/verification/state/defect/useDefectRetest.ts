import { useEffect, useRef, useState } from "react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { useWorkspaceState } from "../../../../state/workspace/useWorkspaceState";
import type { useWorkspaceDerived } from "../../../../state/workspace-derived/useWorkspaceDerived";
import { createVerificationRunStarter } from "../../application/verification-run-starter";
import { getVerificationQueue } from "../../data/verification-api";

export function useDefectRetest(state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>, defect: Defect | null | undefined,
  openRun: (runId: string, itemId: string | null) => void) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const projectId = derived.project?.id ?? "";
  const capabilities = state.data.meta.authorization.capabilities;
  const enabled = state.connection === "connected" && defect?.projectId === projectId
    && defect.status === "ready_for_retest";
  const canStart = enabled && ["defect:read", "run:read", "run:manage", "run:execute"]
    .every((capability) => capabilities.includes(capability));
  const scope = JSON.stringify([state.data.workspace.id, projectId, defect?.id, canStart, state.view]);
  const owner = useRef(scope); owner.current = scope;
  const controller = useRef<AbortController | null>(null);
  const starter = useRef<ReturnType<typeof createVerificationRunStarter> | null>(null);
  if (!starter.current) starter.current = createVerificationRunStarter(http);
  const [form, setForm] = useState({ scope: "", open: false, pending: false, error: "", environmentId: "", build: "" });
  useEffect(() => () => controller.current?.abort(), [scope]);
  const environments = derived.projectEnvironments.filter((item) => item.status !== "archived");
  const source = derived.projectRuns.find((run) => run.id === defect?.runId);
  const defaultEnvironment = environments.find((item) => item.id === source?.environment.id)?.id
    ?? environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "";
  const current = form.scope === scope;
  const pending = current && form.pending;
  const unresolved = starter.current.pending(projectId, defect?.id);
  function open() {
    if (!enabled) return;
    setForm({ scope, open: true, pending: false, error: "",
      environmentId: unresolved?.environmentId ?? defaultEnvironment, build: unresolved?.build ?? "" });
  }
  function close() { if (!pending) setForm((value) => ({ ...value, open: false })); }
  async function start() {
    if (!canStart || !defect || pending || (controller.current && !controller.current.signal.aborted)) return;
    const fail = (error: string) => setForm((value) => ({ ...value, error }));
    if (!unresolved && !environments.some((item) => item.id === form.environmentId)) {
      fail(ru ? "Выберите окружение для проверки." : "Select an environment to verify."); return;
    }
    if (!unresolved && (!form.build.trim() || form.build.trim().length > 500)) {
      fail(ru ? "Укажите сборку с исправлением: до 500 символов." : "Enter the fixed build: up to 500 characters."); return;
    }
    const request = new AbortController(); controller.current = request;
    setForm((value) => ({ ...value, pending: true, error: "" }));
    try {
      const queue = unresolved ? null : await getVerificationQueue(http, projectId, 0, request.signal, defect.id);
      if (request.signal.aborted || owner.current !== scope) return;
      if (queue && !queue.data.totalCases) {
        setForm((value) => ({ ...value, pending: false, error: queue.data.entries.some((entry) => entry.blockedReason === "case_unavailable")
          ? (ru ? "Связанный кейс архивирован или больше недоступен. Восстановите его в репозитории перед повторной проверкой."
            : "The linked case is archived or unavailable. Restore it in the repository before retesting.")
          : queue.data.entries.some((entry) => entry.blockedReason === "step_missing")
          ? (ru ? "Проваленный шаг удалён из текущей версии кейса. Восстановите его перед повторной проверкой."
            : "The failed step was removed from the current case revision. Restore it before retesting.")
          : (ru ? "У дефекта нет связанного тест-кейса для повторной проверки."
            : "This bug report has no linked test case to retest.") })); return;
      }
      const result = await starter.current!.start(projectId, unresolved ?? {
        defectId: defect.id, scopeToken: queue!.data.scopeToken, environmentId: form.environmentId,
        build: form.build.trim(), name: `${ru ? "Повторная проверка" : "Retest"} · ${defect.key}`.slice(0, 240),
      }, request.signal);
      if (request.signal.aborted || owner.current !== scope) return;
      state.setData((data) => ({ ...data, runs: [result.data, ...data.runs.filter((run) => run.id !== result.data.id)] }));
      state.setSelectedRunEtag(result.etag);
      setForm((value) => ({ ...value, pending: false, open: false }));
      openRun(result.data.id, null);
    } catch (failure) {
      if (request.signal.aborted || owner.current !== scope) return;
      const error = failure instanceof TmsApiError && [404, 409].includes(failure.status)
        ? (ru ? "Статус или состав проверки изменился. Обновите карточку дефекта и повторите."
          : "The defect status or verification scope changed. Refresh the bug report and retry.")
        : failure instanceof TmsApiError && failure.status === 403
        ? (ru ? "Недостаточно прав для запуска повторной проверки." : "You cannot start a retest.")
        : failure instanceof TmsApiError && [400, 422].includes(failure.status)
        ? (ru ? "Проверьте окружение и сборку, затем повторите запуск." : "Check the environment and build, then retry.")
        : (ru ? "Не удалось подтвердить запуск. Повторите — второй прогон не создастся."
          : "The start was not confirmed. Retry without creating a duplicate run.");
      setForm((value) => ({ ...value, pending: false, error }));
    } finally { if (controller.current === request) controller.current = null; }
  }
  return { enabled: Boolean(enabled), canStart: Boolean(canStart), open, close, start,
    isOpen: current && form.open, pending, error: current ? form.error : "", environments,
    environmentId: current ? form.environmentId : "", build: current ? form.build : "", unresolved: Boolean(unresolved),
    setEnvironmentId: (environmentId: string) => setForm((value) => ({ ...value, environmentId, error: "" })),
    setBuild: (build: string) => setForm((value) => ({ ...value, build, error: "" })),
  };
}
export type DefectRetest = ReturnType<typeof useDefectRetest>;
