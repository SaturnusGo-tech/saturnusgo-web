import { Search, SlidersHorizontal, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardLocalFilters } from "../../inspector/dashboard-drill-navigation";
import { DashboardDrillFacets } from "../../inspector/facets/DashboardDrillFacets";
import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import styles from "../detail.module.css";
export type DetailSort = "recent" | "title" | "priority_desc" | "priority_asc";
export const emptyDetailFilters = (): DashboardLocalFilters => ({ query: "", project: [], type: [], component: [], status: [], priority: [] });

export function DetailToolbar({ rows, filters, onFilters, sort, onSort, partial, scopeFields, scopeCount = 0 }: {
  rows: DashboardDrillRow[]; filters: DashboardLocalFilters; onFilters: (next: DashboardLocalFilters) => void;
  sort: DetailSort; onSort: (next: DetailSort) => void; partial: boolean; scopeFields?: ReactNode; scopeCount?: number;
}) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const [open, setOpen] = useState(false); const trigger = useRef<HTMLButtonElement>(null); const id = useId();
  const selected = Object.entries(filters).flatMap(([key, values]) => key === "query" ? [] : (values as string[]).map(value => ({ key, value })));
  const count = selected.length + scopeCount;
  return <div className={styles.filterArea} onKeyDown={event => {
    if (event.key === "Escape" && open && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <div className={styles.toolbar}>
      <label className={styles.search} data-input-shell><Search size={16} /><input type="search" aria-label={t("dashboard.searchRecords")}
        placeholder={ru ? "Найти запись" : "Find a record"} value={filters.query} onChange={event => onFilters({ ...filters, query: event.target.value })} /></label>
      <button type="button" ref={trigger} className={styles.filterButton} aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(value => !value)}><SlidersHorizontal size={15} />{ru ? "Фильтры" : "Filters"}{count > 0 && <span>{count}</span>}</button>
      <AnimatedSelect compact className={styles.sort} label={t("dashboard.sort")} value={sort} onChange={value => onSort(value as DetailSort)}
        options={[{ value: "recent", label: t("dashboard.sortRecent") }, { value: "title", label: t("dashboard.sortTitle") },
          ...(rows.some(row => row.priority) ? [{ value: "priority_desc", label: ru ? "Приоритет: по убыванию" : "Priority: highest first" },
            { value: "priority_asc", label: ru ? "Приоритет: по возрастанию" : "Priority: lowest first" }] : [])]} />
    </div>
    {count > 0 && <div className={styles.applied} aria-label={ru ? "Применённые фильтры" : "Applied filters"}>
      {scopeCount > 0 && <button type="button" onClick={() => setOpen(true)}>{ru ? "Поля продукта" : "Product scope"}<span>{scopeCount}</span></button>}
      {selected.map(item => <button type="button" key={`${item.key}:${item.value}`} title={localizedLabel(locale, item.value)}
        aria-label={`${ru ? "Убрать фильтр" : "Remove filter"}: ${localizedLabel(locale, item.value)}`}
        onClick={() => onFilters({ ...filters, [item.key]: (filters[item.key as keyof DashboardLocalFilters] as string[]).filter(value => value !== item.value) })}>
        <span>{localizedLabel(locale, item.value)}</span><X size={12} /></button>)}
    </div>}
    <div id={id} className={styles.filterReveal} data-open={open} aria-hidden={!open} inert={!open}>
      <div><div className={styles.filterPanel}>
        {scopeFields}
        <DashboardDrillFacets rows={rows} value={filters} onChange={onFilters} />
      </div></div>
    </div>
    {partial && <p className={styles.hint}>{ru ? "Поиск, фильтры списка и сортировка — по загруженным записям. Загрузите ещё, чтобы расширить список." : "Search, list filters and sorting apply to loaded records. Load more to expand the list."}</p>}
  </div>;
}
