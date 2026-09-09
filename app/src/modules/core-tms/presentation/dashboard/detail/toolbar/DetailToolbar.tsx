import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardLocalFilters } from "../../inspector/dashboard-drill-navigation";
import { DashboardDrillFacets } from "../../inspector/facets/DashboardDrillFacets";
import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import styles from "../detail.module.css";
export type DetailSort = "recent" | "title" | "priority_desc" | "priority_asc";
export const emptyDetailFilters = (): DashboardLocalFilters => ({ query: "", project: [], type: [], component: [], status: [], priority: [] });

export function DetailToolbar({ rows, filters, onFilters, sort, onSort, partial }: {
  rows: DashboardDrillRow[]; filters: DashboardLocalFilters; onFilters: (next: DashboardLocalFilters) => void;
  sort: DetailSort; onSort: (next: DetailSort) => void; partial: boolean;
}) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const [open, setOpen] = useState(false); const wrap = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  const count = Object.entries(filters).reduce((n, [key, value]) => n + (key === "query" ? 0 : value.length), 0);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <><div className={styles.toolbar}>
    <label className={styles.search} data-input-shell><Search size={15} /><input type="search" aria-label={t("dashboard.searchRecords")}
      placeholder={ru ? "Поиск по названию, ключу или компоненту" : "Search by title, key or component"} value={filters.query}
      onChange={event => onFilters({ ...filters, query: event.target.value })} /></label>
    <div ref={wrap} className={styles.filterWrap} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
      <button type="button" ref={trigger} className={styles.filterButton} aria-expanded={open}
        onClick={() => setOpen(value => !value)}><SlidersHorizontal size={14} />{ru ? "Фильтры" : "Filters"}{count > 0 && <span>{count}</span>}</button>
      {open && <div className={styles.popover}><DashboardDrillFacets rows={rows} value={filters} onChange={onFilters} /></div>}
    </div>
    <AnimatedSelect compact className={styles.sort} label={t("dashboard.sort")} value={sort} onChange={value => onSort(value as DetailSort)}
      options={[{ value: "recent", label: t("dashboard.sortRecent") }, { value: "title", label: t("dashboard.sortTitle") },
        ...(rows.some(row => row.priority) ? [{ value: "priority_desc", label: ru ? "Приоритет: по убыванию" : "Priority: highest first" },
          { value: "priority_asc", label: ru ? "Приоритет: по возрастанию" : "Priority: lowest first" }] : [])]} />
  </div>{partial && <p className={styles.hint}>{ru ? "Поиск, фильтры и сортировка — по загруженным записям. Загрузите ещё, чтобы расширить выборку." : "Search, filters and sorting apply to loaded records. Load more to expand the list."}</p>}</>;
}
