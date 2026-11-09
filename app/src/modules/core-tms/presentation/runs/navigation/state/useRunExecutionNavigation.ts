import { useEffect, useRef, useState } from "react";
import type { ExecutionStatus } from "../../../../../../core/tms/contracts/legacy-contract";
import type { WorkspaceModel } from "../../../../state/model/useWorkspaceModel";
import type { RunRepositoryEntry } from "../../../../runs/batches/model/repository/run-repository";
import type { RunRepositoryModel } from "../../repository/state/useRunRepository";
import { nextRemainingEntry } from "../order/ordered-run-entries";

export function useRunExecutionNavigation(model: WorkspaceModel, repository: RunRepositoryModel, dirty: boolean) {
  const { entries, browser } = repository;
  const scope = `${model.data.workspace.id}:${browser.batch?.id ?? model.selectedRunId ?? ""}`;
  const ready = browser.ready && !browser.loading && !browser.busy && !browser.error;
  const [pending, setPending] = useState(false);
  const [requestedItem, setRequestedItem] = useState<string | null>(null);
  const locked = useRef(false);
  const latest = useRef({ entries, scope, selectedId: model.selectedRunItemId, model });
  latest.current = { entries, scope, selectedId: model.selectedRunItemId, model };
  const previous = useRef({ scope, entries });
  const visible = entries.some(row => row.runId === model.selectedRunId && row.item.id === model.selectedRunItemId);
  const selected = ready && visible;
  const openingItem = requestedItem !== null && requestedItem === model.selectedRunItemId;
  useEffect(() => {
    if (requestedItem && !openingItem) setRequestedItem(null);
  }, [openingItem, requestedItem]);
  const loadError = model.runResourceError || model.runItemResourceError;
  const detailReady = selected && !loadError && model.selectedRunItem?.id === model.selectedRunItemId;
  // Preserve only the confirmed presentation during a same-owner refresh. Writes still require detailReady.
  const owner = JSON.stringify([scope, model.projectId, model.selectedRunId, model.selectedRunItemId, model.connection]);
  const shown = useRef<{ owner: string; item: WorkspaceModel["selectedRunItem"] }>({ owner, item: null });
  if (shown.current.owner !== owner || !visible || browser.error || loadError
    || (model.selectedRunItem && model.selectedRunItem.id !== model.selectedRunItemId)) shown.current = { owner, item: null };
  if (detailReady) shown.current = { owner, item: model.selectedRunItem };
  function choose(row?: RunRepositoryEntry) {
    const current = latest.current.model;
    if (row) { current.setProjectId(row.projectId); current.setSelectedRunId(row.runId); }
    current.setSelectedRunItemId(row?.item.id ?? null);
  }
  useEffect(() => {
    if (!ready || pending || dirty) return;
    if (!selected) {
      const prior = previous.current.scope === scope ? previous.current.entries : [];
      choose(nextRemainingEntry(prior, model.selectedRunItemId ?? "", entries) ?? entries[0]);
    }
    previous.current = { scope, entries };
  }, [ready, pending, dirty, selected, scope, entries, model.selectedRunItemId]);
  function select(id: string) {
    if (!ready || dirty || locked.current) return;
    const row = entries.find(entry => entry.item.id === id);
    if (row) { choose(row); setRequestedItem(id); }
  }
  function retryItem() {
    setRequestedItem(model.selectedRunItemId);
    model.retryRunItem();
  }
  async function mutate(write: () => Promise<boolean>, advance: boolean) {
    if (!detailReady || dirty || locked.current) return false;
    locked.current = true; setPending(true);
    const before = latest.current;
    try {
      const saved = await write();
      const current = latest.current;
      if (saved && advance && current.scope === before.scope && current.selectedId === before.selectedId) {
        const next = nextRemainingEntry(before.entries, before.selectedId ?? "", current.entries);
        if (next) choose(next);
      }
      return saved;
    } finally { locked.current = false; setPending(false); }
  }
  // Saving the actual-result draft is permitted while dirty; it still owns its original item.
  async function step(stepId: string, status: ExecutionStatus, value?: string) {
    if (!detailReady || locked.current) return false;
    locked.current = true; setPending(true);
    try { return await model.setStepStatus(stepId, status, value); }
    finally { locked.current = false; setPending(false); }
  }
  return { entries, pending, ready, selected, detailReady, openingItem, retryItem,
    selectedItem: shown.current.item,
    unblock: () => mutate(() => model.unblockItem(repository.rememberItem), false),
    select, step, mark: (status: ExecutionStatus) => mutate(() => model.setItemStatus(status, repository.rememberItem), status !== "failed"),
  };
}
