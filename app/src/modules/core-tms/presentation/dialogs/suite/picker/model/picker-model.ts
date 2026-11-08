import type { FolderAppearance } from "../../../../../folders/model/appearance/folder-appearance";
import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../../folders/model/folder";
import { buildFolderTree, type FolderNode } from "../../../../../folders/model/tree";
import { casePriority } from "../../../../../helpers/cases/caseRevision";

export type PickerFolder = { appearance?: FolderAppearance; id: string; name: string; path: string; depth: number; parentId: string | null; hasChildren: boolean; caseIds: readonly string[] };
export type PickerPriority = "all" | ReturnType<typeof casePriority>;
export const UNFILED = "suite-picker-unfiled";

export function pickerFolders(folders: readonly RepositoryFolder[], cases: readonly TestCaseSummary[]): PickerFolder[] {
  const tree = buildFolderTree(folders, cases), entries: PickerFolder[] = [];
  function collect(node: FolderNode, depth: number) {
    entries.push({ appearance: node.folder.appearance, id: node.folder.id, name: node.folder.name, path: node.folder.path, parentId: node.folder.parentId,
      depth, hasChildren: Boolean(node.children.length), caseIds: node.caseIds });
    node.children.forEach(child => collect(child, depth + 1));
  }
  tree.roots.forEach(node => collect(node, 0));
  if (tree.unfiled.length) entries.unshift({ id: UNFILED, name: "", path: "/", depth: 0, parentId: null, hasChildren: false,
    caseIds: tree.unfiled.map(item => item.id) });
  return entries;
}

export function filterPickerCases(cases: readonly TestCaseSummary[], folders: readonly PickerFolder[], filters: {
  folder: string; query: string; priority: PickerPriority; selected?: ReadonlySet<string>;
}): TestCaseSummary[] {
  const scoped = filters.folder ? new Set(folders.find(folder => folder.id === filters.folder)?.caseIds ?? []) : null;
  const tokens = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return cases.filter(item => {
    if (item.archivedAt || (scoped && !scoped.has(item.id)) || (filters.selected && !filters.selected.has(item.id))) return false;
    if (filters.priority !== "all" && casePriority(item) !== filters.priority) return false;
    const text = [item.key, item.title, item.folderPath, item.component, ...item.tags].join(" ").toLocaleLowerCase();
    return tokens.every(token => text.includes(token));
  }).sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
}

export function pickerSelection(cases: readonly TestCaseSummary[], selected: ReadonlySet<string>) {
  const ids = cases.map(item => item.id), count = ids.filter(id => selected.has(id)).length;
  return { ids, all: Boolean(ids.length && count === ids.length), partial: count > 0 && count < ids.length };
}
