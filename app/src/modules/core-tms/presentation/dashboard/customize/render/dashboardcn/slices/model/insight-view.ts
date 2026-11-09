import type { DashboardDrill, DashboardDrillFilter } from "../../../../../../../dashboards/model/dashboard-analytics";
import type {
  DashboardDefectBreakdown, DashboardDefectBreakdownRequest, DashboardDefectGroup,
} from "../../../../../../../dashboards/model/breakdown/dashboard-defect-breakdown";
import { localizedComponentLabel, localizedLabel } from "../../../../../../../localization/format/labels";
import type { TmsLocale } from "../../../../../../../localization/model/locale";
import type { Slice } from "../dashboardcn-slices";

export type InsightMeasure = { key: string; label: string; count?: number; drill?: DashboardDrill; color: string };
export type InsightGroup = InsightMeasure & { cells: InsightMeasure[] };
type InsightView = { groups: InsightGroup[]; total?: number; groupCount: number; truncated?: boolean };

const palette: Record<string, string> = {
  open: "var(--insight-iris)", triaged: "#a3aabb", in_progress: "#c7a34c", ready_for_retest: "#72977f",
  verified: "#8096c5", closed: "#727987", reopened: "#b57b95", manual: "var(--insight-iris)",
  checklist: "#919bad", automated: "#6e9b85", low: "#7f899e", medium: "var(--insight-iris)",
  high: "#bb925d", critical: "#be7f90",
};
const color = (key: string) => palette[key] ?? "var(--insight-iris)";
const statusOrder = ["open", "triaged", "in_progress", "ready_for_retest", "verified", "closed", "reopened"];
const levels = ["low", "medium", "high", "critical"] as const;
type Level = (typeof levels)[number];
type DefectFilter = Extract<DashboardDrillFilter, { entity: "defect" }>;

function constraint(axis: DashboardDefectGroup, key: string | null): Partial<DefectFilter> {
  switch (axis) {
    case "component": return key === null ? { componentIsEmpty: true } : { component: key };
    case "assignee": return key === null ? { unassigned: true } : { assigneeIdentityId: key };
    case "status": return key === null ? {} : { status: key };
    case "priority": return { priority: key as Level };
    case "severity": return { severity: key as Level };
    case "project": return {};
  }
}

export function defectInsightView(result: DashboardDefectBreakdown, request: DashboardDefectBreakdownRequest,
  locale: TmsLocale): InsightView {
  const { basis, groupBy, segmentBy, hasLink } = request;
  const knownKeys = segmentBy === "status" ? statusOrder : segmentBy === "none" ? [] : levels;
  const observed = new Set(result.groups.flatMap(group => group.segments.map(part => part.key)));
  const segmentKeys = knownKeys.filter(key => observed.delete(key)).concat([...observed]);
  const series = segmentKeys.map(key => ({ key, label: localizedLabel(locale, key), color: color(key) }));
  const labelFor = (key: string | null, label: string | null) => {
    if (key === null) return groupBy === "assignee" ? (locale === "ru" ? "Не назначен" : "Unassigned")
      : (locale === "ru" ? "Без продукта" : "No product");
    if (groupBy === "component") return localizedComponentLabel(locale, label ?? key);
    if (groupBy === "assignee") return label ?? (locale === "ru" ? "Недоступный участник" : "Unavailable assignee");
    if (groupBy === "project") return label ?? key;
    return localizedLabel(locale, key);
  };
  const groups = result.groups.map(group => {
    const key = group.key ?? "";
    const label = labelFor(group.key, group.label);
    const filter: DefectFilter = { entity: "defect", basis, ...(hasLink === undefined ? {} : { hasLink }),
      ...constraint(groupBy, group.key) };
    const id = `insights:defect:${basis}:${groupBy}:${encodeURIComponent(key)}:${String(hasLink)}`;
    const drill: DashboardDrill = { id, label, filter,
      ...(groupBy === "project" && group.key ? { projectId: group.key } : {}),
      ...(result.periodApplied ? { window: result.period } : {}),
    };
    const counts = new Map(group.segments.map(item => [item.key, item.count]));
    const cells = series.map(item => {
      const count = counts.get(item.key) ?? 0;
      return { ...item, count, drill: segmentBy !== "none" && count > 0 ? { ...drill,
        id: `${id}:${segmentBy}:${item.key}`, label: `${label} · ${item.label}`,
        filter: { ...filter, ...constraint(segmentBy, item.key) },
      } : undefined };
    });
    return { key, label, count: group.count, color: color(key), drill, cells };
  });
  return { groups, total: result.total, groupCount: result.groupCount, truncated: result.truncated };
}

export function sliceInsightView(all: Slice, slices: Slice[], locale: TmsLocale, type = "all"): InsightView {
  const groups = slices.filter(item => type === "all" || item.key === type).map(item => ({ key: item.key,
    label: localizedLabel(locale, item.key), count: item.count, drill: item.count === undefined ? undefined : { ...item.drill, label: localizedLabel(locale, item.key) },
    color: color(item.key), cells: [],
  }));
  return { groups, total: type === "all" ? all.count : groups[0]?.count, groupCount: groups.length };
}

export function insightAxis(values: readonly (number | undefined)[]) {
  const max = Math.max(0, ...values.map(value => value ?? 0));
  const targetStep = Math.max(1, max / 7);
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const step = ([1, 2, 5, 10].find(tick => tick * magnitude >= targetStep) ?? 10) * magnitude;
  const scale = Math.max(max > 0 ? step * Math.ceil(max / step) : 7, step * 4);
  return { scale, ticks: Array.from({ length: scale / step + 1 }, (_, index) => scale - index * step) };
}
