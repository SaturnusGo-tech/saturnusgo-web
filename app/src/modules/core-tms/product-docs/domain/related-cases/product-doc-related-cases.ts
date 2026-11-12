import type { ProductDocCase } from "../product-docs";

export type ProductDocRelatedCaseSelection = { baseline: ProductDocCase[]; cases: ProductDocCase[] };

export function uniqueRelatedCases(cases: readonly ProductDocCase[]): ProductDocCase[] {
  const seen = new Set<string>();
  return cases.filter(item => !seen.has(item.caseId) && Boolean(seen.add(item.caseId)));
}

export function toggleRelatedCases(current: readonly ProductDocCase[], scope: readonly ProductDocCase[]): ProductDocCase[] {
  const selected = new Set(current.map(item => item.caseId));
  const scopeIds = new Set(scope.map(item => item.caseId));
  return scope.length && scope.every(item => selected.has(item.caseId))
    ? current.filter(item => !scopeIds.has(item.caseId)) : uniqueRelatedCases([...current, ...scope]);
}

export function relatedCasesChanged(selection?: ProductDocRelatedCaseSelection): boolean {
  if (!selection) return false;
  const baseline = new Set(selection.baseline.map(item => item.caseId));
  const cases = new Set(selection.cases.map(item => item.caseId));
  return baseline.size !== cases.size || [...baseline].some(id => !cases.has(id));
}
