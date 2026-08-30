import { FilePlus2, Filter, Search, X } from "lucide-react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import styles from "../cases.module.css";

type Props = {
  locale: TmsLocale;
  query: string;
  countLabel: string;
  filters: CaseFilters;
  filterOpen: boolean;
  selectedFolder: string;
  onQuery: (value: string) => void;
  onFilters: (filters: CaseFilters) => void;
  onFilterOpen: () => void;
  onNew: (folder?: string) => void;
};

const defaultFilters: CaseFilters = {
  priority: "all",
  lifecycle: "all",
  tag: "",
  includeArchived: false,
};

export function CasesToolbar(props: Props) {
  const { locale, filters } = props;
  const ru = locale === "ru";
  const activeFilterCount = Number(filters.priority !== "all")
    + Number(filters.lifecycle !== "all")
    + Number(Boolean(filters.tag.trim()))
    + Number(filters.includeArchived);
  return (
    <>
      <header className={styles.listTitlebar}>
        <div>
          <h1>{ru ? "Тест-кейсы" : "Test cases"}</h1>
          <span aria-live="polite">{props.countLabel}</span>
        </div>
        <button className={styles.primaryButton} onClick={() => props.onNew(props.selectedFolder)}>
          <FilePlus2 size={15} />{ru ? "Новый кейс" : "New case"}
        </button>
      </header>
      <div className={styles.querybar}>
        <label className={styles.searchBox}>
          <Search size={16} />
          <input
            value={props.query}
            onChange={(event) => props.onQuery(event.target.value)}
            placeholder={ru ? "Поиск по ID, названию, папке или тегу" : "Search by ID, title, folder, or tag"}
            aria-label={ru ? "Поиск тест-кейсов" : "Search test cases"}
          />
          {props.query && <button type="button" onClick={() => props.onQuery("")} title={ru ? "Очистить" : "Clear"} aria-label={ru ? "Очистить поиск" : "Clear search"}><X size={14} /></button>}
        </label>
        <div className={styles.filterAnchor} data-case-popover-root>
          <button
            className={`${styles.secondaryButton} ${activeFilterCount ? styles.filterActive : ""}`}
            onClick={props.onFilterOpen}
            aria-expanded={props.filterOpen}
            aria-controls="case-filter-panel"
            data-testid="case-filter-toggle"
          >
            <Filter size={15} />{ru ? "Фильтр" : "Filter"}
            {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
          </button>
          {props.filterOpen && <div className={styles.filterPanel} id="case-filter-panel" data-testid="case-filters">
            <div className={styles.filterPanelHeader}>
              <strong>{ru ? "Фильтры" : "Filters"}</strong>
              <button onClick={() => props.onFilters(defaultFilters)}>{ru ? "Сбросить" : "Reset"}</button>
            </div>
            <label>
              <span>{ru ? "Приоритет" : "Priority"}</span>
              <select value={filters.priority} onChange={(event) => props.onFilters({ ...filters, priority: event.target.value as CaseFilters["priority"] })}>
                <option value="all">{ru ? "Все приоритеты" : "All priorities"}</option>
                <option value="critical">{ru ? "Критический" : "Critical"}</option>
                <option value="high">{ru ? "Высокий" : "High"}</option>
                <option value="medium">{ru ? "Средний" : "Medium"}</option>
                <option value="low">{ru ? "Низкий" : "Low"}</option>
              </select>
            </label>
            <label>
              <span>{ru ? "Состояние" : "Lifecycle"}</span>
              <select value={filters.lifecycle} onChange={(event) => props.onFilters({ ...filters, lifecycle: event.target.value as CaseFilters["lifecycle"] })}>
                <option value="all">{ru ? "Все состояния" : "All states"}</option>
                <option value="draft">{ru ? "Черновик" : "Draft"}</option>
                <option value="ready">{ru ? "Готов" : "Ready"}</option>
                <option value="deprecated">{ru ? "Устарел" : "Deprecated"}</option>
                <option value="archived">{ru ? "В архиве" : "Archived"}</option>
              </select>
            </label>
            <label>
              <span>{ru ? "Тег содержит" : "Tag contains"}</span>
              <input value={filters.tag} onChange={(event) => props.onFilters({ ...filters, tag: event.target.value })} placeholder="smoke" />
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={filters.includeArchived} onChange={(event) => props.onFilters({ ...filters, includeArchived: event.target.checked })} />
              <span>{ru ? "Показывать архивные" : "Include archived"}</span>
            </label>
          </div>}
        </div>
      </div>
    </>
  );
}
