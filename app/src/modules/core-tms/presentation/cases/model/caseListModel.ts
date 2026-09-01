import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { CaseListRow, CaseSort } from "../types";

export type CaseListViewMode = "list" | "dynamic";
export type CaseGroupBy = "none" | "folder" | "component" | "priority" | "lifecycle";
export type CaseQlField = "text" | "key" | "title" | "lifecycle" | "priority" | "component" | "folder" | "tag" | "type" | "owner";
export type CaseQlTerm = { field: CaseQlField; value: string; exclude: boolean };
export type CaseRowGroup = { key: string; value: string; rows: CaseListRow[] };
export type CaseFacetFilters = { folders: string[]; components: string[] };
export type CaseFacetOptions = { folders: string[]; components: string[] };

const priorityRank = { low: 0, medium: 1, high: 2, critical: 3 } as const;
const lifecycleRank = { draft: 0, ready: 1, deprecated: 2, archived: 3 } as const;
const fieldAliases: Record<string, CaseQlField> = {
  id: "key", key: "key", ид: "key", title: "title", name: "title", название: "title",
  status: "lifecycle", state: "lifecycle", lifecycle: "lifecycle", статус: "lifecycle", состояние: "lifecycle",
  priority: "priority", приоритет: "priority", component: "component", functionality: "component", компонент: "component",
  folder: "folder", path: "folder", папка: "folder", tag: "tag", тег: "tag", type: "type", тип: "type",
  owner: "owner", assignee: "owner", владелец: "owner", ответственный: "owner",
};

export function flattenCaseGroups(groups: Array<[string, TestCaseSummary[]]>): CaseListRow[] {
  return groups.flatMap(([folderPath, testCases]) => testCases.map((testCase) => ({ testCase, folderPath })));
}

export function parseCaseQlQuery(query: string): CaseQlTerm[] {
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  return tokens.map((rawToken) => {
    const exclude = rawToken.startsWith("-");
    const token = exclude ? rawToken.slice(1) : rawToken;
    const separator = token.indexOf(":");
    const rawField = separator > 0 ? token.slice(0, separator).toLocaleLowerCase() : "";
    const field = fieldAliases[rawField] ?? "text";
    const rawValue = separator > 0 && field !== "text" ? token.slice(separator + 1) : token;
    return { field, value: rawValue.replace(/^"|"$/g, "").trim(), exclude };
  }).filter((term) => term.value.length > 0);
}

function normalized(value: string | null | undefined) { return (value ?? "").trim().toLocaleLowerCase(); }

function aliases(value: string) {
  const map: Record<string, string[]> = {
    ready: ["ready", "готов", "actual", "актуальный"], draft: ["draft", "черновик"],
    deprecated: ["deprecated", "устарел"], archived: ["archived", "архив"],
    critical: ["critical", "критический"], high: ["high", "высокий"],
    medium: ["medium", "средний"], low: ["low", "низкий"], manual: ["manual", "ручной"],
    checklist: ["checklist", "чеклист"], automated: ["automated", "автоматизированный", "автотест"],
  };
  return map[value] ?? [value];
}

function termMatches(row: CaseListRow, term: CaseQlTerm) {
  const item = row.testCase;
  const values: Record<CaseQlField, string[]> = {
    text: [item.key, item.title, row.folderPath, item.component, ...item.tags], key: [item.key], title: [item.title],
    lifecycle: aliases(item.archivedAt ? "archived" : item.lifecycle), priority: aliases(item.priority), component: [item.component],
    folder: [row.folderPath], tag: item.tags, type: aliases(item.type), owner: [item.ownerIdentityId ?? ""],
  };
  const needle = normalized(term.value);
  const matches = values[term.field].some((value) => normalized(value).includes(needle));
  return term.exclude ? !matches : matches;
}

function matchesFolder(row: CaseListRow, folders: string[]) {
  return folders.length === 0 || folders.some((folder) => row.folderPath === folder || row.folderPath.startsWith(`${folder}/`));
}

function folderPrefixes(folderPath: string) {
  const trimmed = folderPath.trim();
  const segments = trimmed.split("/").filter(Boolean);
  const leadingSlash = trimmed.startsWith("/") ? "/" : "";
  return segments.map((_, index) => `${leadingSlash}${segments.slice(0, index + 1).join("/")}`);
}

export function resolveDependentCaseFacets(rows: CaseListRow[], facets: CaseFacetFilters): CaseFacetOptions {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const componentRows = facets.folders.length === 0 ? rows : rows.filter((row) => matchesFolder(row, facets.folders));
  const allFolders = new Set(rows.flatMap((row) => folderPrefixes(row.folderPath)));
  return {
    folders: [...allFolders].sort(collator.compare),
    components: [...new Set(componentRows.map((row) => row.testCase.component).filter(Boolean))].sort(collator.compare),
  };
}

export function sanitizeDependentCaseFacets(rows: CaseListRow[], facets: CaseFacetFilters): CaseFacetFilters {
  const options = resolveDependentCaseFacets(rows, facets);
  return {
    folders: facets.folders,
    components: facets.components.filter((component) => options.components.includes(component)),
  };
}

export function dynamicGroupBy(current: CaseGroupBy): CaseGroupBy {
  return current === "none" ? "folder" : current;
}

export function visibleCaseTabStop(
  groups: CaseRowGroup[],
  collapsed: ReadonlySet<string>,
  selectedCaseId: string,
): string | null {
  const visible = groups
    .filter((group) => !collapsed.has(group.key))
    .flatMap((group) => group.rows);
  return visible.some((row) => row.testCase.id === selectedCaseId)
    ? selectedCaseId
    : (visible[0]?.testCase.id ?? null);
}

export function filterCaseRows(rows: CaseListRow[], query: { titleQuery?: string; qlQuery?: string; facets?: CaseFacetFilters }): CaseListRow[] {
  const titleNeedle = normalized(query.titleQuery);
  const terms = parseCaseQlQuery(query.qlQuery ?? "");
  return rows.filter((row) => {
    const titleMatches = !titleNeedle || [
      row.testCase.title,
      row.testCase.key,
      row.folderPath,
      row.testCase.component,
      ...row.testCase.tags,
    ].some((value) => normalized(value).includes(titleNeedle));
    const folderMatches = matchesFolder(row, query.facets?.folders ?? []);
    const componentMatches = !query.facets?.components.length || query.facets.components.includes(row.testCase.component);
    return titleMatches && folderMatches && componentMatches && terms.every((term) => termMatches(row, term));
  });
}

export function groupCaseRows(rows: CaseListRow[], groupBy: CaseGroupBy): CaseRowGroup[] {
  if (groupBy === "none") return [{ key: "all", value: "", rows }];
  const groups = new Map<string, CaseListRow[]>();
  rows.forEach((row) => {
    const item = row.testCase;
    const value = groupBy === "folder" ? row.folderPath : groupBy === "lifecycle" ? (item.archivedAt ? "archived" : item.lifecycle) : item[groupBy] || "—";
    groups.set(value, [...(groups.get(value) ?? []), row]);
  });
  return [...groups.entries()].map(([value, groupedRows]) => ({ key: `${groupBy}:${value}`, value, rows: groupedRows }));
}

export function sortCaseRows(rows: CaseListRow[], sort: CaseSort, languageTag: string): CaseListRow[] {
  const collator = new Intl.Collator(languageTag, { numeric: true, sensitivity: "base" });
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    let comparison = 0;
    if (sort.key === "key") comparison = collator.compare(left.testCase.key, right.testCase.key);
    else if (sort.key === "title") comparison = collator.compare(left.testCase.title, right.testCase.title);
    else if (sort.key === "lifecycle") comparison = lifecycleRank[left.testCase.lifecycle] - lifecycleRank[right.testCase.lifecycle];
    else if (sort.key === "priority") comparison = priorityRank[left.testCase.priority] - priorityRank[right.testCase.priority];
    else if (sort.key === "component") comparison = collator.compare(left.testCase.component, right.testCase.component);
    else comparison = (left.testCase.estimatedMinutes ?? Number.MAX_SAFE_INTEGER) - (right.testCase.estimatedMinutes ?? Number.MAX_SAFE_INTEGER);
    return comparison === 0 ? collator.compare(left.testCase.key, right.testCase.key) : comparison * direction;
  });
}
