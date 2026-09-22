import type { RepositoryFolder } from "../folder";
import { dragCaseIds } from "../tree";

export type RepositoryDrag =
  | { kind: "case"; ids: readonly string[]; label: string }
  | { kind: "folder"; folderId: string; label: string };

export function repositoryDrag(data: Record<string, unknown> | undefined, selected: ReadonlySet<string>, folders: readonly RepositoryFolder[]): RepositoryDrag | null {
  if (data?.kind === "case" && typeof data.caseId === "string" && data.caseId && !data.archived) {
    return { kind: "case", ids: dragCaseIds(data.caseId, selected), label: typeof data.name === "string" ? data.name : "" };
  }
  if (data?.kind !== "folder") return null;
  const folder = folders.find(item => item.id === data.folderId && !item.archivedAt);
  return folder ? { kind: "folder", folderId: folder.id, label: folder.name } : null;
}

export function canDropRepositoryDrag(drag: RepositoryDrag | null, target: unknown, folders: readonly RepositoryFolder[]): target is string | null {
  if (!drag || (target !== null && typeof target !== "string")) return false;
  const destination = target === null ? null : folders.find(item => item.id === target);
  if (target !== null && (!destination || destination.archivedAt)) return false;
  if (drag.kind === "case") return drag.ids.length > 0;
  const source = folders.find(item => item.id === drag.folderId);
  if (!source || source.archivedAt || source.id === target || source.parentId === target) return false;
  if (destination && (destination.path === source.path || destination.path.startsWith(`${source.path}/`))) return false;
  // Parent IDs also protect against a stale path while the tree refreshes after a move.
  const seen = new Set<string>();
  let parent = destination;
  while (parent) {
    if (parent.id === source.id || seen.has(parent.id)) return false;
    seen.add(parent.id);
    parent = parent.parentId ? folders.find(item => item.id === parent!.parentId) : null;
  }
  return true;
}
