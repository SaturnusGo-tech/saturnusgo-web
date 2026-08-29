import { useRef, useState } from "react";
import type { TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../core/tms/idempotency/pending-operation";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { archiveRun, mutateRunWithEtagRecovery, restoreRun } from "../../runs/data/run-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useRunArchive(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const { t } = useTmsLocale();
  const [archivePending, setArchivePending] = useState(false);
  const operation = useRef<PendingOperation | null>(null);
  const canArchiveRun = state.connection === "connected" &&
    state.data.meta.authorization.capabilities.includes("run:archive");

  async function archiveSelectedRun(run: TestRunSummary) {
    if (!canArchiveRun || archivePending) return;
    setArchivePending(true);
    try {
      const reason = t("runs.removeReason");
      const currentEtag = state.selectedRunId === run.id ? state.selectedRunEtag : null;
      const archived = await mutateRunWithEtagRecovery(
        http,
        run.id,
        currentEtag,
        (etag) => {
          operation.current = resolvePendingOperation(
            operation.current,
            JSON.stringify({ action: "archive", runId: run.id, etag, reason }),
          );
          return archiveRun(http, run.id, etag, operation.current.key, reason);
        },
      );
      operation.current = null;
      const remaining = derived.projectRuns.filter((item) => !item.archivedAt && item.id !== run.id);
      state.setData((current) => ({
        ...current,
        runs: current.runs.map((item) => item.id === run.id ? archived.data : item),
      }));
      state.setSelectedRunId(remaining[0]?.id ?? null);
      state.setSelectedRunItemId(null);
      notify(t("runs.removed", { key: run.key }));
    } catch (error) {
      notify(formatTmsMutationFailure(
        toTmsMutationFailure(error),
        t("runs.removeError"),
      ));
    } finally {
      setArchivePending(false);
    }
  }

  async function restoreSelectedRun(run: TestRunSummary) {
    if (!canArchiveRun || archivePending) return;
    setArchivePending(true);
    try {
      const currentEtag = state.selectedRunId === run.id ? state.selectedRunEtag : null;
      const restored = await mutateRunWithEtagRecovery(
        http,
        run.id,
        currentEtag,
        (etag) => {
          operation.current = resolvePendingOperation(
            operation.current,
            JSON.stringify({ action: "restore", runId: run.id, etag }),
          );
          return restoreRun(http, run.id, etag, operation.current.key);
        },
      );
      operation.current = null;
      state.setData((current) => ({
        ...current,
        runs: current.runs.map((item) => item.id === run.id ? restored.data : item),
      }));
      state.setSelectedRunId(run.id);
      state.setSelectedRunItemId(null);
      notify(t("runs.restored", { key: run.key }));
    } catch (error) {
      notify(formatTmsMutationFailure(
        toTmsMutationFailure(error),
        t("runs.restoreError"),
      ));
    } finally {
      setArchivePending(false);
    }
  }

  return { archiveSelectedRun, restoreSelectedRun, archivePending, canArchiveRun };
}
