import type { Suite, SuiteSummary } from "../../../../core/tms/contracts/legacy-contract";
export type SuiteCatalogFilter = "all" | "static" | "dynamic";
export type SuiteCatalogSort = "updated" | "name" | "created";

export function filterSuiteCatalog(suites: readonly SuiteSummary[], query: string,
  filter: SuiteCatalogFilter, sort: SuiteCatalogSort, locale: string) {
  const terms = query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
  return suites.filter(suite => {
    const text = `${suite.name} ${suite.key} ${suite.description}`.toLocaleLowerCase(locale);
    return (filter === "all" || suite.type === filter) && terms.every(term => text.includes(term));
  }).sort((a, b) => {
    const order = sort === "name" ? a.name.localeCompare(b.name, locale, { numeric: true })
      : Date.parse(sort === "created" ? b.createdAt : b.updatedAt) - Date.parse(sort === "created" ? a.createdAt : a.updatedAt);
    return order || a.id.localeCompare(b.id);
  });
}

export function hasResolvedSuiteCount(suite: SuiteSummary, detail: Suite | null): detail is Suite {
  return detail?.id === suite.id && detail.projectId === suite.projectId
    && detail.type === suite.type && detail.updatedAt === suite.updatedAt;
}

export function suiteCatalogCount(suite: SuiteSummary, detail: Suite | null) {
  // The list counts stored memberships; resolved scope excludes archived cases.
  if (hasResolvedSuiteCount(suite, detail)) return detail.resolvedCaseCount;
  return suite.type === "static" ? suite.caseCount : null;
}
