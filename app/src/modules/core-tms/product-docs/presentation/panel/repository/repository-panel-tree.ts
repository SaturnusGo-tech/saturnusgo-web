import type { RepositoryFolder } from "../../../../folders/model/folder";

/** Reveal the linked folder using stable IDs, even when folder names repeat. */
export function repositoryPanelAncestors(folders: readonly RepositoryFolder[], folderId: string) {
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  const ancestors = new Set<string>();
  let folder = byId.get(folderId);
  while (folder && !ancestors.has(folder.id)) {
    ancestors.add(folder.id);
    folder = folder.parentId ? byId.get(folder.parentId) : undefined;
  }
  return ancestors;
}
