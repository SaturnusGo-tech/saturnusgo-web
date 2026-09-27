import type { CaseFields } from "../../../../../../core/tms/contracts/custom-fields/case-fields";
export type FieldOption = { id: string; label: string };
export type FieldFilters = { productGroups?: string[]; products?: string[]; regression?: boolean };
export type FieldOptions = { productGroups?: FieldOption[]; products?: FieldOption[] };
export function fieldFilterCount(filters: FieldFilters) { return (filters.productGroups?.length ?? 0) + (filters.products?.length ?? 0) + Number(filters.regression !== undefined); }
export function matchesFieldFilters(item: CaseFields, filters: FieldFilters = {}) {
  return (!filters.productGroups?.length || filters.productGroups.includes(item.productGroupId ?? ""))
    && (!filters.products?.length || filters.products.includes(item.productId ?? ""))
    && (filters.regression === undefined || filters.regression === (item.regression ?? false));
}
export function caseFieldOptions(items: readonly CaseFields[]): FieldOptions {
  const collect = (systemKey: "product_group" | "product") => {
    const values = new Map<string, string>();
    items.forEach(item => item.customFields?.filter(field => field.systemKey === systemKey).forEach(field => field.values.forEach(value => values.set(value.id, value.label))));
    return [...values].map(([id, label]) => ({ id, label })).sort((a,b) => a.label.localeCompare(b.label));
  };
  return { productGroups: collect("product_group"), products: collect("product") };
}
