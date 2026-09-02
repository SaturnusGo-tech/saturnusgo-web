import { Search, SlidersHorizontal } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import surface from "../../dashboard.module.css";
import type { DashboardLocalFilters } from "../dashboard-drill-navigation";

type FacetKey = Exclude<keyof DashboardLocalFilters, "query">;

const facetValues = (rows: DashboardDrillRow[], key: FacetKey) => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key === "project" ? row.project : row[key];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
};

export function DashboardDrillFacets({ rows, value, onChange }: {
  rows: DashboardDrillRow[];
  value: DashboardLocalFilters;
  onChange: (value: DashboardLocalFilters) => void;
}) {
  const { locale, t } = useTmsLocale();
  const label = (key: FacetKey) => ({
    project: t("dashboard.project"), type: t("dashboard.type"), component: t("dashboard.component"),
    status: t("dashboard.status"), priority: t("dashboard.priority"),
  }[key]);
  return <aside className={surface.drillFacets} aria-label={t("dashboard.refineList")}>
    <h3><SlidersHorizontal size={14} />{t("dashboard.refineList")}</h3>
    <label className={surface.drillSearch}><span>{t("dashboard.searchRecords")}</span><div><Search size={14} /><input type="search" value={value.query}
      onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder={t("dashboard.searchPlaceholder")} /></div></label>
    {(["type", "project", "component", "status", "priority"] as const).map((key) => {
      const options = facetValues(rows, key);
      if (!options.length) return null;
      return <fieldset key={key}><legend>{label(key)}</legend>{options.slice(0, 8).map(([option, count]) => <label key={option}>
        <input type="checkbox" checked={value[key] === option} onChange={() => onChange({
          ...value, [key]: value[key] === option ? "" : option,
        })} /><span>{key === "project" || key === "component" ? option : localizedLabel(locale, option)}</span><b>{count}</b>
      </label>)}</fieldset>;
    })}
    {Object.values(value).some(Boolean) && <button type="button" onClick={() => onChange({
      query: "", project: "", type: "", component: "", status: "", priority: "",
    })}>{locale === "ru" ? "Сбросить уточнения" : "Reset refinements"}</button>}
  </aside>;
}
