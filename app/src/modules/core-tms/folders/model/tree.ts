import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "./folder";

export type FolderNode = { folder: RepositoryFolder; children: FolderNode[]; cases: TestCaseSummary[]; caseIds: string[] };
export function buildFolderTree(folders: readonly RepositoryFolder[], cases: readonly TestCaseSummary[], archived = false) {
  const nodes = new Map<string, FolderNode>();
  const byPath = new Map<string, FolderNode>();
  for (const folder of folders) {
    if (Boolean(folder.archivedAt) !== archived) continue;
    const node: FolderNode = { folder, children: [], cases: [], caseIds: [] };
    nodes.set(folder.id, node); byPath.set(folder.path, node);
  }
  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.folder.parentId ? nodes.get(node.folder.parentId) : undefined;
    if (parent) parent.children.push(node); else roots.push(node);
  }
  const unfiled: TestCaseSummary[] = [];
  for (const item of cases) {
    if (Boolean(item.archivedAt) !== archived) continue;
    const node = item.folderId ? nodes.get(item.folderId) : byPath.get(item.folderPath);
    if (node) node.cases.push(item); else if (!item.folderId && item.folderPath === "/") unfiled.push(item);
  }
  function collect(node: FolderNode): string[] {
    node.children.sort((a, b) => a.folder.name.localeCompare(b.folder.name, undefined, { numeric: true }));
    node.cases.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    node.caseIds = [...node.cases.map((item) => item.id), ...node.children.flatMap(collect)];
    return node.caseIds;
  }
  roots.sort((a, b) => a.folder.name.localeCompare(b.folder.name, undefined, { numeric: true })).forEach(collect);
  return { roots, unfiled };
}

export function validFolderDestinations(folders: readonly RepositoryFolder[], moving?: RepositoryFolder) {
  return folders.filter((folder) => !folder.archivedAt && (!moving ||
    (folder.path !== moving.path && !folder.path.startsWith(`${moving.path}/`))));
}

export function dragCaseIds(draggedId: string, selected: ReadonlySet<string>) {
  return selected.has(draggedId) ? [...selected] : [draggedId];
}
