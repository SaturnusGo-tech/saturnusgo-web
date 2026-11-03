import type { DashboardDrill, DashboardProductFilters } from "../../../../dashboards/model/dashboard-analytics";

/** Product restrictions refine a metric; they never change its entity or time basis. */
export function scopedDashboardDrill(drill: DashboardDrill, products: DashboardProductFilters, scopeLabel?: string): DashboardDrill {
  const { productGroupId: _group, productId: _product, regression: _regression, ...metric } = drill.filter;
  const filter = { ...metric,
    ...(products.productGroupId !== undefined ? { productGroupId: products.productGroupId } : {}),
    ...(products.productId !== undefined ? { productId: products.productId } : {}),
    ...(products.regression !== undefined ? { regression: products.regression } : {}) };
  const productContext = drill.id.startsWith("product-context:");
  const label = productContext && scopeLabel ? scopeLabel : drill.label;
  const identity = JSON.stringify([drill.projectId, label, drill.window, filter]);
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index++) hash = Math.imul(hash ^ identity.charCodeAt(index), 16777619);
  return { ...drill, id: `${productContext ? "product-context" : "product-scope"}:${(hash >>> 0).toString(36)}`, label, filter };
}
