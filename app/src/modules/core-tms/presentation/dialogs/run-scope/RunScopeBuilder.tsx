import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { RunDialogCopy } from "../run/copy";
import {
  activeRunFilterCount,
  filterRunCases,
  initialRunScopeFilters,
  type RunScopeFilters,
} from "../run-builder/model";
import styles from "../run/RunDialog.module.css";

type Props = {
  cases: TestCaseSummary[];
  caseIds: string[];
  setCaseIds: Dispatch<SetStateAction<string[]>>;
  copy: RunDialogCopy;
};

export function RunScopeBuilder({ cases, caseIds, setCaseIds, copy }: Props) {
  const { locale } = useTmsLocale();
  const [filters, setFilters] = useState<RunScopeFilters>(initialRunScopeFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const visibleCases = useMemo(() => filterRunCases(cases, filters), [cases, filters]);
  const components = useMemo(() => Array.from(new Set(cases.map((item) => item.component).filter(Boolean))).sort(), [cases]);
  const folders = useMemo(() => Array.from(new Set(cases.map((item) => item.folderPath))).sort(), [cases]);
  const selected = useMemo(() => new Set(caseIds), [caseIds]);
  const filterCount = activeRunFilterCount(filters);
  const update = <K extends keyof RunScopeFilters>(key: K, value: RunScopeFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const selectMatches = () => setCaseIds((current) => Array.from(new Set([...current, ...visibleCases.map((item) => item.id)])));
  const clearMatches = () => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)));

  return <div className={styles.scopeBuilder} data-testid="run-case-picker">
    <div className={styles.scopeToolbar}>
      <label className={styles.scopeSearch}>
        <Search size={16} />
        <input autoFocus aria-label={copy.searchAria} value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder={copy.searchPlaceholder} />
      </label>
      <button type="button" className={filterCount ? styles.filterActive : styles.filterButton} onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
        <Filter size={15} />{filtersOpen ? copy.hideFilters : copy.showFilters}{filterCount > 0 && <b>{filterCount}</b>}
      </button>
      <label className={styles.sortField}><span>{copy.sort}</span><select value={filters.sort} onChange={(event) => update("sort", event.target.value as RunScopeFilters["sort"])}><option value="updated_desc">{copy.updatedRecently}</option><option value="key_asc">{copy.keyAsc}</option><option value="title_asc">{copy.titleAsc}</option></select></label>
    </div>

    {filtersOpen && <div className={styles.filterGrid}>
      <FilterSelect label={copy.scenario} value={filters.scenario} onChange={(value) => update("scenario", value as RunScopeFilters["scenario"])} options={[["all", copy.allScenarios], ["positive", copy.positive], ["negative", copy.negative], ["corner", copy.corner]]} />
      <FilterSelect label={copy.platform} value={filters.platform} onChange={(value) => update("platform", value as RunScopeFilters["platform"])} options={[["all", copy.allPlatforms], ["ios", copy.ios], ["android", copy.android]]} />
      <FilterSelect label={copy.component} value={filters.component} onChange={(value) => update("component", value)} options={[["all", copy.allComponents], ...components.map((value) => [value, localizedComponentLabel(locale, value)] as [string, string])]} />
      <FilterSelect label={copy.folder} value={filters.folder} onChange={(value) => update("folder", value)} options={[["all", copy.allFolders], ...folders.map((value) => [value, value] as [string, string])]} />
      <FilterSelect label={copy.priority} value={filters.priority} onChange={(value) => update("priority", value as RunScopeFilters["priority"])} options={[["all", copy.allPriorities], ["critical", copy.critical], ["high", copy.high], ["medium", copy.medium], ["low", copy.low]]} />
      <FilterSelect label={copy.lifecycle} value={filters.lifecycle} onChange={(value) => update("lifecycle", value as RunScopeFilters["lifecycle"])} options={[["all", copy.allStates], ["ready", copy.ready], ["draft", copy.draft], ["deprecated", copy.deprecated]]} />
      <button type="button" className={styles.resetFilters} onClick={() => setFilters(initialRunScopeFilters)} disabled={filterCount === 0}>{copy.resetFilters}</button>
    </div>}

    <div className={styles.scopeStatus} aria-live="polite">
      <span>{copy.loaded} <strong>{cases.length}</strong><i />{copy.matched} <strong>{visibleCases.length}</strong><i />{copy.selected} <strong>{caseIds.length}</strong></span>
      <span><button type="button" onClick={selectMatches} disabled={visibleCases.length === 0}>{copy.selectAllMatching}</button><button type="button" onClick={clearMatches} disabled={visibleCases.every((item) => !selected.has(item.id))}>{copy.clearMatching}</button></span>
    </div>

    <div className={styles.caseList} role="group" aria-label={copy.searchAria}>
      {visibleCases.map((item) => <label key={item.id} className={selected.has(item.id) ? styles.caseSelected : styles.caseRow}>
        <input type="checkbox" checked={selected.has(item.id)} onChange={() => setCaseIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />
        <span><strong>{item.key}</strong><b>{item.title}</b><small>{item.folderPath} · {item.component ? localizedComponentLabel(locale, item.component) : "—"}</small></span>
        <em>{copy[item.priority]}</em>
      </label>)}
      {visibleCases.length === 0 && <div className={styles.emptyCases}>{copy.noMatching}</div>}
    </div>
  </div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <label className={styles.filterField}><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
