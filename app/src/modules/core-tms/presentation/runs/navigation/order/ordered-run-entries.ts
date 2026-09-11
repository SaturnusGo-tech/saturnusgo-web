import { buildFolderTree, type FolderNode } from "../../../../folders/model/tree";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { runRepositoryFolders, type RunRepositoryEntry } from "../../../../runs/batches/model/repository/run-repository";

// Match the tree's group → child folder → case order; a case repeated by tag grouping is visited once.
export function orderedRunEntries(workspaceId: string, groups: readonly { id: string; cases: TestCaseSummary[] }[],
  rows: readonly RunRepositoryEntry[], includeArchived: boolean): RunRepositoryEntry[] {
  const lookup = new Map(rows.map(row => [row.item.id, row]));
  const seen = new Set<string>(); const result: RunRepositoryEntry[] = [];
  const add = (item: TestCaseSummary) => {
    const row = lookup.get(item.id);
    if (!row || seen.has(`${row.runId}:${item.id}`)) return;
    seen.add(`${row.runId}:${item.id}`); result.push(row);
  };
  const walk = (node: FolderNode) => { node.children.forEach(walk); node.cases.forEach(add); };
  for (const group of groups) {
    const tree = buildFolderTree(runRepositoryFolders(workspaceId, `group:${group.id}`, group.cases), group.cases, false, includeArchived);
    tree.roots.forEach(walk); tree.unfiled.forEach(add);
  }
  return result;
}

export function nextRemainingEntry(previous: readonly RunRepositoryEntry[], currentId: string,
  available: readonly RunRepositoryEntry[]): RunRepositoryEntry | undefined {
  const remaining = new Map(available.map(row => [row.item.id, row]));
  const index = previous.findIndex(row => row.item.id === currentId);
  for (const row of previous.slice(index + 1)) {
    const next = remaining.get(row.item.id);
    if (next && !next.item.archivedAt) return next;
  }
  return undefined;
}
