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

export function suiteCatalogCount(suite: SuiteSummary, detail: Suite | null) {
  if (suite.type === "static") return suite.caseCount;
  // A dynamic summary counts explicit members, not cases resolved by its tags.
  return detail?.id === suite.id && detail.projectId === suite.projectId ? detail.resolvedCaseCount : null;
}
