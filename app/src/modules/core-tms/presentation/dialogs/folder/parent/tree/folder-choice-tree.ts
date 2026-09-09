export type FolderChoice = { value: string; label: string };
export type FolderChoiceRow = FolderChoice & { name: string; depth: number; parent: string; hasChildren: boolean };
export function folderChoiceRows(options: readonly FolderChoice[], expanded: ReadonlySet<string>, query: string): FolderChoiceRow[] {
  const values = new Set(options.map((option) => option.value));
  const search = query.trim().toLocaleLowerCase();
  return options.flatMap((option) => {
    const parts = option.value.split("/").filter(Boolean);
    const ancestors = parts.slice(0, -1).map((_, index) => `/${parts.slice(0, index + 1).join("/")}`);
    if (search ? !option.label.toLocaleLowerCase().includes(search) : ancestors.some((ancestor) => values.has(ancestor) && !expanded.has(ancestor))) return [];
    return [{ ...option, name: parts[parts.length - 1] ?? option.label, depth: ancestors.filter((ancestor) => values.has(ancestor)).length,
      parent: ancestors[ancestors.length - 1] ?? "/", hasChildren: options.some((child) => child.value !== option.value && child.value.startsWith(`${option.value}/`)) }];
  });
}
export function folderChoiceAncestors(path: string): Set<string> {
  const parts = path.split("/").filter(Boolean);
  return new Set(parts.slice(0, -1).map((_, index) => `/${parts.slice(0, index + 1).join("/")}`));
}
