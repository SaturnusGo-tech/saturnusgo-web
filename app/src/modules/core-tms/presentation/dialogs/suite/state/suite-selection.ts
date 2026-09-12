import type { Suite, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";

export function initialSuiteSelection(suite: Suite | undefined, cases: readonly TestCaseSummary[]): string[] {
  if (suite?.type === "static") return [...new Set(suite.caseIds)];
  const tags = suite?.filter.tags ?? ["smoke"];
  return cases.filter(item => !item.archivedAt && tags.every(tag => item.tags.includes(tag))).map(item => item.id);
}

export function toggleSuiteScope(current: readonly string[], ids: readonly string[]): string[] {
  const scope = new Set(ids);
  if (!scope.size) return [...current];
  return ids.every(id => current.includes(id)) ? current.filter(id => !scope.has(id)) : [...new Set([...current, ...ids])];
}
