import type { RunItemSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { runRepositoryEntries, type RunRepositoryEntry } from "../../../../runs/batches/model/repository/run-repository";

function compare(left: RunItemSummary, right: RunItemSummary) {
  if (left.rowVersion !== undefined && right.rowVersion !== undefined) return left.rowVersion - right.rowVersion;
  return Date.parse(left.updatedAt) - Date.parse(right.updatedAt) || 0;
}

// Keep confirmed item versions when the detail resource moves to another project.
// A subsequent server refresh replaces them only with an equally new or newer version.
export function reconcileRunEntries(rows: readonly RunRepositoryEntry[], live: readonly RunItemSummary[],
  remembered: Map<string, RunItemSummary>): RunRepositoryEntry[] {
  const available = new Map(rows.map(row => [row.item.id, row]));
  for (const item of live) {
    if (!available.has(item.id)) continue;
    const prior = remembered.get(item.id);
    if (!prior || compare(item, prior) >= 0) remembered.set(item.id, item);
  }
  for (const id of remembered.keys()) if (!available.has(id)) remembered.delete(id);
  return rows.map(row => {
    const cached = remembered.get(row.item.id);
    const newest = cached && compare(cached, row.item) > 0 ? cached : row.item;
    const item = { ...newest, preview: newest.preview ?? row.item.preview };
    remembered.set(item.id, item);
    return runRepositoryEntries(row.runId, row.projectId, [item])[0];
  });
}
