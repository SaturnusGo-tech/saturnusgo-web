import { useEffect } from "react";
import { customValueLabel } from "../../../../../custom-fields/application/field-labels";
import { useCustomFieldCatalog } from "../../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { useParentValue } from "../../../../../custom-fields/state/parent/useParentValue";
import type { DrillFacet, DrillScope, ProductFacetKey } from "./drill-facets";

export function useDrillScope(scope: DrillScope | undefined, enabled: boolean, ru: boolean) {
  const ids = { workspaceId: scope?.workspaceId ?? "", projectId: scope?.projectId ?? "" };
  const filter = scope?.filter;
  const active = Boolean(filter?.productGroupId || filter?.productId || filter?.regression !== undefined);
  const catalog = useCustomFieldCatalog(ids.workspaceId, ids.projectId, enabled || active);
  const group = catalog.items.find(field => field.systemKey === "product_group");
  const product = catalog.items.find(field => field.systemKey === "product");
  const { cursor, pending, loading, failure, more, refresh } = catalog;
  useEffect(() => {
    if ((!group || !product) && cursor && !pending && !loading && !failure) void more();
  }, [group, product, cursor, pending, loading, failure, more]);
  const groupValue = useParentValue(ids, group?.id ?? null, filter?.productGroupId ?? null);
  const productValue = useParentValue(ids, product?.id ?? null, filter?.productId ?? null);

  const facets: DrillFacet[] = [];
  const append = (key: ProductFacetKey, label: string, field: typeof group, selected: typeof groupValue.value) => {
    const value = filter?.[key];
    if (!field && typeof value !== "string") return;
    facets.push({ kind: "scope", key, label, field, selected: typeof value === "string" ? [value] : [],
      options: selected && selected.id === value ? [{ value: selected.id, label: customValueLabel(selected, ru) }] : [] });
  };
  if (scope) {
    append("productGroupId", ru ? "Группа продуктов" : "Product group", group, groupValue.value);
    append("productId", ru ? "Продукт" : "Product", product, productValue.value);
    facets.push({ kind: "scope", key: "regression", label: ru ? "Регресс" : "Regression",
      selected: filter?.regression === undefined ? [] : [String(filter.regression)],
      options: [{ value: "true", label: ru ? "Да" : "Yes" }, { value: "false", label: ru ? "Нет" : "No" }] });
  }
  return { facets, catalog: { loading, failure, refresh } };
}
