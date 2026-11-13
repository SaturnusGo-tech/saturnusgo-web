import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../../folders/model/folder";
import { buildFolderTree, type FolderNode } from "../../../../../folders/model/tree";
import type { FolderAppearance } from "../../../../../folders/model/appearance/folder-appearance";

export type RelatedCaseFolder = {
  id: string; name: string; path: string; parentId: string | null; depth: number;
  appearance?: FolderAppearance; caseIds: readonly string[]; hasChildren: boolean;
};
export const RELATED_UNFILED = "related-cases-unfiled";

/** Counts and navigation derive from the same filtered cases, before applying the open folder. */
export function relatedCaseView({ folders, cases, folder, selected, selectedOnly, prune, includeArchived }: {
  folders: readonly RepositoryFolder[]; cases: readonly TestCaseSummary[]; folder: string;
  selected: ReadonlySet<string>; selectedOnly: boolean; prune: boolean; includeArchived: boolean;
}) {
  const matching = selectedOnly && selected.size ? cases.filter(item => selected.has(item.id)) : [...cases];
  const tree = buildFolderTree(folders, matching, false, includeArchived);
  const entries: RelatedCaseFolder[] = [];
  function collect(node: FolderNode, depth: number) {
    entries.push({ id: node.folder.id, name: node.folder.name, path: node.folder.path, parentId: node.folder.parentId,
      appearance: node.folder.appearance, caseIds: node.caseIds, depth, hasChildren: node.children.length > 0 });
    node.children.forEach(child => collect(child, depth + 1));
  }
  tree.roots.forEach(node => collect(node, 0));
  if (tree.unfiled.length) entries.unshift({ id: RELATED_UNFILED, name: "", path: "/", parentId: null, depth: 0,
    caseIds: tree.unfiled.map(item => item.id), hasChildren: false });
  const current = entries.find(entry => entry.id === folder);
  const ids = current ? new Set(current.caseIds) : null;
  const navigation = prune || selectedOnly ? entries.filter(entry => entry.caseIds.length > 0) : entries;
  const remaining = new Set(navigation.map(entry => entry.parentId));
  return { folders: navigation.map(entry => ({ ...entry, hasChildren: remaining.has(entry.id) })), current,
    total: matching.length, visible: matching.filter(item => !ids || ids.has(item.id))
      .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true })) };
}
