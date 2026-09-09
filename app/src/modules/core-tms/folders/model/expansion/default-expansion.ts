import type { FolderNode } from "../tree";

/** Show the route to each first case-bearing folder, without opening its cases. */
export function defaultFolderExpansion(roots: readonly FolderNode[]): Set<string> {
  const result = new Set<string>();
  function visit(node: FolderNode) {
    if (node.cases.length || !node.caseIds.length || !node.children.length) return;
    result.add(node.folder.id);
    node.children.forEach(visit);
  }
  roots.forEach(visit);
  return result;
}

export function resolveFolderExpansion(defaults: ReadonlySet<string>, overrides: ReadonlyMap<string, boolean>, revealed: ReadonlySet<string>) {
  const result = new Set([...defaults, ...revealed]);
  for (const [id, open] of overrides) open ? result.add(id) : result.delete(id);
  return result;
}
