import type { DashboardProductFilters } from "../dashboard-analytics";
export function hasDashboardProducts(filter: DashboardProductFilters) {
  return Boolean(filter.productGroupId || filter.productId || filter.regression !== undefined);
}
export function matchesDashboardProducts(value: { productGroupId?: string | null; productId?: string | null; regression?: boolean }, filter: DashboardProductFilters) {
  return (!filter.productGroupId || filter.productGroupId === value.productGroupId)
    && (!filter.productId || filter.productId === value.productId)
    && (filter.regression === undefined || filter.regression === (value.regression ?? false));
}
