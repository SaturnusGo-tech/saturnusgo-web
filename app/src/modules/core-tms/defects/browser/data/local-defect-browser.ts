import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import type { DefectBrowserSource, DefectCounts } from "../model/defect-browser";
const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replaceAll("ё", "е");
const matches = (item: Defect, q: string) => !q || [item.key, item.title, item.description,
  item.component, item.assigneeIdentityId ?? "", ...item.labels].some((value) => normalize(value).includes(normalize(q)));
const counts = (items: Defect[]): DefectCounts => ({ total: items.length,
  open: items.filter((item) => !["verified", "closed"].includes(item.status)).length,
  critical: items.filter((item) => !["verified", "closed"].includes(item.status) && item.severity === "critical").length });
/** Isolated offline previews only. Connected views always use authoritative server projections. */
export function createLocalDefectBrowser(defects: Defect[]): DefectBrowserSource {
  return {
    async groups(query) {
      const items = defects.filter((item) => item.projectId === query.projectId && matches(item, query.q));
      const grouped = new Map<string, Defect[]>();
      items.forEach((item) => grouped.set(item.component, [...(grouped.get(item.component) ?? []), item]));
      return { groups: [...grouped].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
        .map(([component, members]) => ({ component, ...counts(members) })),
        totals: counts(items), groupCount: grouped.size, nextCursor: null };
    },
    async records(query, component) {
      const items = defects.filter((item) => item.projectId === query.projectId &&
        item.component === component && matches(item, query.q));
      if (query.severitySort) {
        const ranks = { low: 1, medium: 2, high: 3, critical: 4 };
        const direction = query.severitySort === "asc" ? 1 : -1;
        items.sort((a, b) => direction * (ranks[a.severity] - ranks[b.severity]) || b.id.localeCompare(a.id));
      }
      return { items, nextCursor: null };
    },
  };
}
