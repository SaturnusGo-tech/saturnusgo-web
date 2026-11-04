import type { RepositoryFolder } from "../folder";
import { canDropRepositoryDrag } from "../drag/repository-drop";

export function selectionRoots(selected: ReadonlySet<string>, folders: readonly RepositoryFolder[]): RepositoryFolder[] {
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  return folders.filter(folder => {
    if (!selected.has(folder.id) || folder.archivedAt) return false;
    const seen = new Set([folder.id]);
    let parent = folder.parentId ? byId.get(folder.parentId) : undefined;
    while (parent) {
      if (selected.has(parent.id) || seen.has(parent.id)) return false;
      seen.add(parent.id);
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    return !folders.some(other => other.id !== folder.id && selected.has(other.id) && !other.archivedAt && folder.path.startsWith(`${other.path}/`));
  });
}

export function folderMovePlan(selected: ReadonlySet<string>, target: string | null, folders: readonly RepositoryFolder[]) {
  const roots = selectionRoots(selected, folders);
  const selectionExists = [...selected].every(id => folders.some(folder => folder.id === id && !folder.archivedAt));
  const moving = roots.filter(folder => folder.parentId !== target);
  const valid = selectionExists && moving.length > 0 && roots.every(folder => folder.id !== target &&
    (folder.parentId === target || canDropRepositoryDrag({ kind: "folder", folderId: folder.id, label: folder.name }, target, folders)));
  return { valid, folders: valid ? moving : [] };
}
