import type { components } from "../../../../../core/tms/generated/tms-api";

type MoveResult = components["schemas"]["RepositoryFolderMoveCasesResult"];
export type MoveUndoGroup = { targetFolderId: string | null; items: { id: string; ifMatch: string }[]; key: string };
export type MoveReceipt = { id: string; count: number; expiresAt: number; groups: MoveUndoGroup[] };

/** Use the write response versions, never refreshed versions which could include someone else's edits. */
export function createMoveReceipt(before: readonly { id: string; folderId?: string | null }[], after: MoveResult,
  key: () => string = () => crypto.randomUUID(), now = Date.now()): MoveReceipt | null {
  const groups = new Map<string | null, MoveUndoGroup>();
  for (const item of after.items ?? []) {
    const original = before.find(candidate => candidate.id === item.id);
    if (!item.changed || !original) continue;
    const target = original.folderId ?? null;
    const group = groups.get(target) ?? { targetFolderId: target, items: [], key: key() };
    group.items.push({ id: item.id, ifMatch: item.etag }); groups.set(target, group);
  }
  const count = [...groups.values()].reduce((sum, group) => sum + group.items.length, 0);
  return count ? { id: key(), count, expiresAt: now + 15_000, groups: [...groups.values()] } : null;
}

/** Completed groups are removed immediately; a network retry reuses the outstanding group's key. */
export async function restoreMove(receipt: MoveReceipt, write: (group: MoveUndoGroup) => Promise<unknown>) {
  while (receipt.groups.length) {
    await write(receipt.groups[0]);
    receipt.groups.shift();
  }
}
