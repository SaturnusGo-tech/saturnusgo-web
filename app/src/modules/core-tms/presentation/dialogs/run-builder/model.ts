import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";

export type RunScopeFilters = {
  query: string;
  scenario: "all" | "positive" | "negative" | "corner";
  platform: "all" | "ios" | "android";
  components: string[];
  folder: string;
  priority: "all" | TestCaseSummary["priority"];
  lifecycle: "all" | TestCaseSummary["lifecycle"];
  sort: "updated_desc" | "key_asc" | "title_asc";
};

export const initialRunScopeFilters: RunScopeFilters = {
  query: "",
  scenario: "all",
  platform: "all",
  components: [],
  folder: "all",
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

export function filterRunCases(cases: TestCaseSummary[], filters: RunScopeFilters) {
  const filtered = cases.filter((item) => {
    const tags = normalizedTags(item);
    if (!matchesQuery(item, filters.query)) return false;
    if (filters.scenario !== "all" && !tags.includes(filters.scenario)) return false;
    if (filters.platform !== "all" && !tags.includes(filters.platform)) return false;
    if (filters.components.length > 0 && !filters.components.includes(item.component)) return false;
    if (filters.folder !== "all" && item.folderPath !== filters.folder && !item.folderPath.startsWith(`${filters.folder}/`)) return false;
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
    + Number(filters.components.length > 0)
    + Number(filters.folder !== "all")
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
