import { useEffect, useRef, useState } from "react";
import { nextRunAfterFinish } from "../../../model/history/run-history";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { getRun, listRunItems, transitionRun, archiveRun, restoreRun } from "../../../data/run-api";
import { getRunBatch, listRunBatches, transitionRunBatch } from "../../data/batch-api";
import type { RunBatch, RunBatchTransition } from "../../model/batch";
import { runRepositoryEntries, type RunRepositoryEntry } from "../../model/repository/run-repository";

type Action = "start" | "pause" | "resume" | "complete" | "archive" | "restore";
export function useRunBrowser(input: { workspaceId: string; selected: TestRunSummary | null; selectedId?: string | null;
  knownRuns: TestRunSummary[]; connected: boolean; ru: boolean;
  onUpdate: (runs: TestRunSummary[]) => void; onRefreshSelected: () => void;
  onFinished?: (next: TestRunSummary | null) => void }) {
  const http = useTmsHttpClient(); const [batches, setBatches] = useState<RunBatch[]>([]);
  const [batchesWorkspace, setBatchesWorkspace] = useState("");
  const [loadedScope, setLoadedScope] = useState("");
  const [entries, setEntries] = useState<RunRepositoryEntry[]>([]);
  const [loading, setLoading] = useState(false); const [busy, setBusy] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  const latest = useRef(input); latest.current = input;
  const pending = useRef(false); const operation = useRef<PendingOperation | null>(null);
  const command = useRef<{ signature: string; key: string; body?: RunBatchTransition; etag?: string } | null>(null);
  const generation = useRef(0); const entriesScope = useRef("");
  useEffect(() => {
    setBatches([]); command.current = null; operation.current = null;
    generation.current += 1;
    return () => { generation.current += 1; };
  }, [input.workspaceId]);
  useEffect(() => {
    const controller = new AbortController();
    if (!input.connected) return;
    listRunBatches(http, input.workspaceId, controller.signal).then((next) => {
      if (!controller.signal.aborted) { setBatches(next); setBatchesWorkspace(input.workspaceId); }
    }).catch((err: unknown) => { if (!controller.signal.aborted) setError(formatTmsMutationFailure(toTmsMutationFailure(err), input.ru ? "Не удалось загрузить прогоны." : "Could not load runs.")); });
    return () => controller.abort();
  }, [http, input.workspaceId, input.connected, revision, input.knownRuns.length]);
  const selectedId = input.selectedId ?? input.selected?.id;
  const batch = batches.find((b) => b.runs.some((r) => r.id === selectedId));
  const memberIds = batch?.runs.map((r) => r.id).join("|") ?? selectedId ?? "";
  const selectedRuns = batch?.runs ?? (input.selected ? [input.selected] : []);
  const resolvedIds = selectedRuns.map(run => run.id).join("|");
  useEffect(() => {
    const controller = new AbortController(); generation.current += 1; setError(""); setIncomplete(false);
    const scope = `${input.workspaceId}:${memberIds}`;
    if (entriesScope.current !== scope) { setEntries([]); entriesScope.current = scope; }
    if (!memberIds || !input.connected) { setEntries([]); setLoading(false); return; }
    if (batchesWorkspace !== input.workspaceId || resolvedIds !== memberIds) { setLoading(true); return; }
    setLoading(true);
    async function load() {
      try {
        const result: RunRepositoryEntry[] = [];
        for (const run of selectedRuns) {
          const page = await listRunItems(http, run.id, controller.signal);
          result.push(...runRepositoryEntries(run.id, run.projectId, page.items));
        }
        controller.signal.throwIfAborted(); setEntries(result); setLoadedScope(`${scope}:${revision}`); setLoading(false);
      } catch (err) { if (!controller.signal.aborted) { setLoading(false); setError(formatTmsMutationFailure(toTmsMutationFailure(err), input.ru ? "Не удалось загрузить кейсы прогона." : "Could not load run cases.")); } }
    }
    void load(); return () => { controller.abort(); generation.current += 1; };
  }, [http, memberIds, resolvedIds, batchesWorkspace, input.workspaceId, input.connected, revision]);
  const batchId = batch?.id ?? input.selected?.batchId;
  useEffect(() => {
    if (!batchId || !input.connected) return;
    const controller = new AbortController();
    const refresh = () => {
      if (document.visibilityState === "hidden" || pending.current) return;
      void getRunBatch(http, input.workspaceId, batchId, controller.signal).then((next) => {
        if (!controller.signal.aborted) setBatches((values) => [...values.filter((b) => b.id !== next.id), next]);
      }).catch(() => { /* The next explicit refresh or command reports an actionable failure. */ });
    };
    refresh(); window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [http, input.workspaceId, input.connected, batchId]);
  async function act(action: Action) {
    if (pending.current || !input.selected || !input.connected) return;
    pending.current = true; setBusy(true); setError(""); const token = generation.current;
    const id = batchId ?? input.selected.id;
    const signature = JSON.stringify({ workspaceId: input.workspaceId, id, action });
    operation.current = resolvePendingOperation(operation.current, signature);
    try {
      let prepared = command.current?.signature === signature ? command.current : null;
      if (!prepared) {
        if (batchId) {
          const fresh = await getRunBatch(http, input.workspaceId, batchId);
          prepared = { signature, key: operation.current.key, body: {
            versions: Object.fromEntries(fresh.runs.map((r) => [r.id, r.rowVersion])), transition: { kind: action } } };
        } else {
          const resource = await getRun(http, input.selected.id);
          if (!resource.etag) throw new Error("Run version is unavailable");
          prepared = { signature, key: operation.current.key, etag: resource.etag };
        }
        command.current = prepared;
      }
      let updated: TestRunSummary[];
      if (batchId && prepared.body) {
        const next = await transitionRunBatch(http, input.workspaceId, batchId, prepared.body, prepared.key);
        updated = next.runs;
        if (token === generation.current) setBatches((values) => [...values.filter((b) => b.id !== next.id), next]);
      } else {
        updated = [(await (action === "archive" ? archiveRun(http, input.selected.id, prepared.etag!, prepared.key)
          : action === "restore" ? restoreRun(http, input.selected.id, prepared.etag!, prepared.key)
          : transitionRun(http, input.selected.id, action, prepared.etag!, prepared.key))).data];
      }
      command.current = null; operation.current = null; setIncomplete(false);
      if (token === generation.current) {
        latest.current.onUpdate(updated);
        if ((action === "complete" || action === "archive") && latest.current.onFinished) {
          latest.current.onFinished(nextRunAfterFinish(choices, updated));
        } else latest.current.onRefreshSelected();
        setRevision((n) => n + 1);
      }
    } catch (err) {
      const failure = toTmsMutationFailure(err);
      if (failure.code && failure.code !== "INTERNAL_ERROR") { command.current = null; operation.current = null; }
      if (token === generation.current) {
        if (action === "complete" && err instanceof TmsApiError && err.validationField === "completion") {
          setIncomplete(true); latest.current.onRefreshSelected(); return;
        }
        const conflict = ["CONFLICT", "INVALID_TRANSITION", "PRECONDITION_FAILED"].includes(failure.code ?? "");
        const message = input.ru
          ? "Не удалось изменить прогон. Обновите его состояние и повторите действие."
          : "Could not change run. Refresh its state and try again.";
        setError(formatTmsMutationFailure(conflict ? { ...failure, message: null } : failure, message));
        latest.current.onRefreshSelected();
      }
    } finally { pending.current = false; setBusy(false); }
  }
  const batchMembers = new Set(batches.flatMap((b) => b.runs.map((r) => r.id)));
  const choices = [...batches.map((b) => ({ id: b.id, name: `${b.iteration.name} · ${b.sequence}`, runs: b.runs, tags: b.iteration.tags, createdAt: b.createdAt })),
    ...input.knownRuns.filter((r) => !batchMembers.has(r.id)).map((r) => ({ id: r.id, name: r.name, runs: [r], tags: [], createdAt: r.createdAt }))]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ready: !memberIds || loadedScope === `${input.workspaceId}:${memberIds}:${revision}`, incomplete, dismissIncomplete: () => setIncomplete(false), batch, choices, entries, loading, busy, error, act, selectedRuns,
    refresh: () => setRevision((n) => n + 1) };
}
