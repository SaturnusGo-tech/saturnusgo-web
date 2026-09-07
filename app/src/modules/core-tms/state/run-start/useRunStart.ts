import { useEffect, useRef, useState } from "react";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../core/tms/errors/mutation-failure";
import { canStartDraftRun, createDraftRunStarter } from "../../application/runs/start/startDraftRun";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useRunStart(state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const starter = useRef<ReturnType<typeof createDraftRunStarter> | null>(null);
  if (!starter.current) starter.current = createDraftRunStarter(http);
  const scope = JSON.stringify([state.data.workspace.id, state.projectId, derived.selectedRun?.id,
    state.connection, state.data.meta.authorization.capabilities.includes("run:manage")]);
  const currentScope = useRef(scope); currentScope.current = scope;
  const controller = useRef<AbortController | null>(null);
  const [operation, setOperation] = useState({ scope: "", pending: false, error: "" });
  useEffect(() => () => controller.current?.abort(), [scope]);
  const canStartRun = Boolean(derived.selectedRun && canStartDraftRun({
    run: derived.selectedRun, projectId: state.projectId,
    connected: state.connection === "connected",
    canManage: state.data.meta.authorization.capabilities.includes("run:manage"),
  }));
  async function startSelectedRun() {
    const run = derived.selectedRun;
    if (!run || !canStartRun || (controller.current && !controller.current.signal.aborted)) return;
    const request = new AbortController(); controller.current = request;
    setOperation({ scope, pending: true, error: "" });
    try {
      const started = await starter.current!.start({ run, projectId: state.projectId,
        connected: state.connection === "connected", canManage: canStartRun,
        etag: state.selectedRunEtag, signal: request.signal });
      if (currentScope.current !== scope) return;
      state.setData((data) => ({ ...data,
        runs: data.runs.map((entry) => entry.id === run.id ? started.data : entry) }));
      state.setSelectedRunEtag(started.etag);
      setOperation({ scope, pending: false, error: "" });
    } catch (error) {
      if (currentScope.current !== scope || request.signal.aborted) return;
      setOperation({ scope, pending: false, error: formatTmsMutationFailure(
        toTmsMutationFailure(error), locale === "ru"
          ? "Не удалось начать прогон. Повторите запуск." : "Could not start the run. Try again.") });
    } finally {
      if (controller.current === request) controller.current = null;
    }
  }
  return { canStartRun, startSelectedRun, startPending: operation.scope === scope && operation.pending,
    startError: operation.scope === scope ? operation.error : "" };
}
