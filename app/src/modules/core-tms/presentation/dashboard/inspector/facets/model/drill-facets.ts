import { CircleDot, FolderKanban, Layers, ListTree, Package, RotateCcw, Signal, Tag, type LucideIcon } from "lucide-react";
import type { CustomFieldDefinition } from "../../../../../custom-fields/model/custom-field";
import type { DashboardDrillFilter, DashboardDrillRow, DashboardProductFilters } from "../../../../../dashboards/model/dashboard-analytics";
import { localizedLabel } from "../../../../../localization/format/labels";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { priorityLabel, priorityLevels } from "../../../../common/properties/PriorityIcon";
import type { DashboardLocalFilters } from "../../dashboard-drill-navigation";

const listKeys = ["type", "project", "status", "priority", "component"] as const;
export type ListFacetKey = (typeof listKeys)[number];
export type ProductFacetKey = keyof DashboardProductFilters;
export type DrillFacetKey = ListFacetKey | ProductFacetKey;
export type FacetOption = { value: string; label: string; count?: number };
export type FacetChip = FacetOption & { facet: DrillFacetKey; category: string };
export type DrillScope = {
  workspaceId: string; projectId: string; filter: DashboardDrillFilter;
  onSelect(value: DashboardProductFilters, label?: string): void;
};
type BaseFacet = { label: string; options: FacetOption[]; selected: string[] };
export type DrillFacet = BaseFacet & (
  { kind: "list"; key: ListFacetKey; entity?: DashboardDrillRow["entity"] } |
  { kind: "scope"; key: ProductFacetKey; field?: CustomFieldDefinition }
);

export const drillFacetIcons: Record<DrillFacetKey, LucideIcon> = {
  type: Tag, project: FolderKanban, status: CircleDot, priority: Signal, component: ListTree,
  productGroupId: Layers, productId: Package, regression: RotateCcw,
};

export function listFacets(rows: readonly DashboardDrillRow[], value: DashboardLocalFilters, locale: TmsLocale,
  labels: Record<ListFacetKey, string>): DrillFacet[] {
  return listKeys.flatMap(key => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const option = row[key];
      if (option) counts.set(option, (counts.get(option) ?? 0) + 1);
    }
    for (const option of value[key]) if (!counts.has(option)) counts.set(option, 0);
    if (!counts.size || (key === "component" && !value.component.length)) return [];
    const options = [...counts].map(([option, count]) => ({
      value: option, label: key === "project" || key === "component" ? option
        : key === "priority" && priorityLevels.some(level => level.key === option) ? priorityLabel(locale, option)
        : localizedLabel(locale, option), count,
    })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, locale));
    return [{ kind: "list", key, label: labels[key], options, selected: value[key], entity: rows[0]?.entity }];
  });
}

export function facetChips(facets: readonly DrillFacet[]): FacetChip[] {
  return facets.flatMap(facet => facet.selected.map(value => ({
    facet: facet.key, category: facet.label, value,
    label: facet.options.find(option => option.value === value)?.label ?? facet.label,
  })));
}

export function updateListFacet(filters: DashboardLocalFilters, key: ListFacetKey, next: string, replace?: string): DashboardLocalFilters {
  const selected = filters[key];
  if (replace === next) return filters;
  const without = selected.filter(value => value !== (replace ?? next));
  const remove = (replace === undefined && selected.includes(next)) || without.includes(next);
  return { ...filters, [key]: remove ? without : [...without, next] };
}

export function updateProductScope(scope: DashboardProductFilters, key: ProductFacetKey, value?: string, parentValueId?: string | null): DashboardProductFilters {
  const { productGroupId, productId, regression } = scope;
  if (key === "productGroupId") return { productGroupId: value, regression };
  if (key === "productId") return { productId: value, productGroupId: value ? parentValueId ?? undefined : productGroupId, regression };
  return { productGroupId, productId, regression: value === undefined ? undefined : value === "true" };
}
