import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import styles from "../../detail/detail.module.css";
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
  const selectedCount = Object.entries(value).reduce((total, [key, selected]) =>
    key === "query" ? total : total + (selected as string[]).length, 0);
  const toggle = (key: FacetKey, option: string) => {
    const selected = value[key];
    onChange({
      ...value,
      [key]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option],
    });
  };
  return <div aria-label={t("dashboard.refineList")}>
    {(["type", "project", "component", "status", "priority"] as const).map((key) => {
      const options = facetValues(rows, key);
      if (!options.length) return null;
      return <fieldset key={key}><legend>{label(key)}</legend>{options.map(([option, count]) => <label key={option}>
        <input type="checkbox" checked={value[key].includes(option)} onChange={() => toggle(key, option)} />
        <span>{key === "project" || key === "component" ? option : localizedLabel(locale, option)}</span><b>{count}</b>
      </label>)}</fieldset>;
    })}
    {(Boolean(value.query) || selectedCount > 0) && <button type="button" className={styles.quiet} onClick={() => onChange({
      query: "", project: [], type: [], component: [], status: [], priority: [],
    })}>{locale === "ru" ? "Сбросить уточнения" : "Reset refinements"}</button>}
  </div>;
}
