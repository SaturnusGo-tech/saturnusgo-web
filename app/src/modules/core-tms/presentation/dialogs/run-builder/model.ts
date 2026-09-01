import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";

export type RunScopeFilters = {
  query: string;
  scenario: "all" | "positive" | "negative" | "corner";
  platform: "all" | "ios" | "android";
  caseType: "all" | TestCaseSummary["type"];
  components: string[];
  folders: string[];
  priority: "all" | TestCaseSummary["priority"];
  lifecycle: "all" | TestCaseSummary["lifecycle"];
  sort: "updated_desc" | "key_asc" | "title_asc";
};

export const initialRunScopeFilters: RunScopeFilters = {
  query: "",
  scenario: "all",
  platform: "all",
  caseType: "all",
  components: [],
  folders: [],
  priority: "all",
  lifecycle: "all",
  sort: "updated_desc",
};

const keyCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function normalizedTags(item: TestCaseSummary) {
  return item.tags.map((tag) => tag.toLocaleLowerCase());
}

function matchesQuery(item: TestCaseSummary, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [item.key, item.title, item.folderPath, item.component, ...item.tags]
    .join(" ")
    .toLocaleLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function normalizeFolderPath(value: string) {
  const segments = value.split("/").filter(Boolean);
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function folderPrefixes(value: string) {
  const segments = normalizeFolderPath(value).split("/").filter(Boolean);
  return segments.map((_, index) => `/${segments.slice(0, index + 1).join("/")}`);
}

function isInsideFolder(folderPath: string, selectedFolder: string) {
  const folder = normalizeFolderPath(folderPath);
  const selected = normalizeFolderPath(selectedFolder);
  if (selected === "/") return true;
  return folder === selected || folder.startsWith(`${selected}/`);
}

function matchesFolders(item: TestCaseSummary, folders: readonly string[]) {
  return folders.length === 0 || folders.some((folder) => isInsideFolder(item.folderPath, folder));
}

function matchesComponents(item: TestCaseSummary, components: readonly string[]) {
  return components.length === 0 || components.includes(item.component);
}

const uniqueSorted = (values: readonly string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort(keyCollator.compare);

function allFolderOptions(cases: TestCaseSummary[]) {
  return uniqueSorted(cases.flatMap((item) => folderPrefixes(item.folderPath)));
}

function knownFolders(cases: TestCaseSummary[], values: readonly string[]) {
  const known = new Set(allFolderOptions(cases));
  return uniqueSorted(values.map(normalizeFolderPath)).filter((value) => known.has(value));
}

function knownComponents(cases: TestCaseSummary[], values: readonly string[]) {
  const known = new Set(cases.map((item) => item.component).filter(Boolean));
  return uniqueSorted(values).filter((value) => known.has(value));
}

function sameValues(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function runScopeFacetOptions(cases: TestCaseSummary[], filters: RunScopeFilters) {
  const allFolders = allFolderOptions(cases);
  const componentCases = cases.filter((item) => matchesComponents(item, filters.components));
  const eligibleFolders = new Set(componentCases.flatMap((item) => folderPrefixes(item.folderPath)));
  return {
    components: uniqueSorted(cases
      .filter((item) => matchesFolders(item, filters.folders))
      .map((item) => item.component)),
    folders: allFolders.filter((folder) => eligibleFolders.has(folder)),
  };
}

export function reconcileRunScopeFilters(cases: TestCaseSummary[], filters: RunScopeFilters) {
  let folders = knownFolders(cases, filters.folders);
  let components = knownComponents(cases, filters.components);
  if (folders.length > 0) {
    const allowed = new Set(cases.filter((item) => matchesFolders(item, folders)).map((item) => item.component));
    components = components.filter((value) => allowed.has(value));
  }
  if (components.length > 0) {
    const allowed = new Set(cases
      .filter((item) => matchesComponents(item, components))
      .flatMap((item) => folderPrefixes(item.folderPath)));
    folders = folders.filter((value) => allowed.has(value));
  }
  return sameValues(folders, filters.folders) && sameValues(components, filters.components)
    ? filters
    : { ...filters, folders, components };
}

export function updateRunScopeFolders(
  cases: TestCaseSummary[], filters: RunScopeFilters, folders: string[],
) {
  const next = {
    ...filters,
    folders: knownFolders(cases, folders),
    components: knownComponents(cases, filters.components),
  };
  const allowedComponents = new Set(runScopeFacetOptions(cases, next).components);
  return { ...next, components: next.components.filter((value) => allowedComponents.has(value)) };
}

export function updateRunScopeComponents(
  cases: TestCaseSummary[], filters: RunScopeFilters, components: string[],
) {
  const next = {
    ...filters,
    folders: knownFolders(cases, filters.folders),
    components: knownComponents(cases, components),
  };
  const allowedFolders = new Set(runScopeFacetOptions(cases, next).folders);
  return { ...next, folders: next.folders.filter((value) => allowedFolders.has(value)) };
}

export function filterRunCases(cases: TestCaseSummary[], filters: RunScopeFilters) {
  const filtered = cases.filter((item) => {
    const tags = normalizedTags(item);
    if (!matchesQuery(item, filters.query)) return false;
    if (filters.scenario !== "all" && !tags.includes(filters.scenario)) return false;
    if (filters.platform !== "all" && !tags.includes(filters.platform)) return false;
    if (filters.caseType !== "all" && item.type !== filters.caseType) return false;
    if (!matchesComponents(item, filters.components)) return false;
    if (!matchesFolders(item, filters.folders)) return false;
    if (filters.priority !== "all" && item.priority !== filters.priority) return false;
    if (filters.lifecycle !== "all" && item.lifecycle !== filters.lifecycle) return false;
    return true;
  });
  return filtered.sort((left, right) => {
    if (filters.sort === "key_asc") return keyCollator.compare(left.key, right.key);
    if (filters.sort === "title_asc") return keyCollator.compare(left.title, right.title);
    return right.updatedAt.localeCompare(left.updatedAt) || keyCollator.compare(left.key, right.key);
  });
}

export function activeRunFilterCount(filters: RunScopeFilters) {
  return Number(Boolean(filters.query.trim()))
    + Number(filters.scenario !== "all")
    + Number(filters.platform !== "all")
    + Number(filters.caseType !== "all")
    + Number(filters.components.length > 0)
    + Number(filters.folders.length > 0)
    + Number(filters.priority !== "all")
    + Number(filters.lifecycle !== "all");
}

export function createDefaultRunName(input: {
  projectName: string;
  scope?: string;
  typeLabel: string;
  build: string;
  timestamp: string;
}) {
  return [input.projectName, input.scope, input.typeLabel, input.build || "—", input.timestamp]
    .filter(Boolean)
    .join(" · ");
}
