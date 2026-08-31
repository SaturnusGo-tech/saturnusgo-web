import { Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { AnimatedMultiSelect } from "../../common/select/AnimatedMultiSelect";
import type { RunDialogCopy } from "../run/copy";
import {
  activeRunFilterCount,
  filterRunCases,
  initialRunScopeFilters,
  reconcileRunScopeFilters,
  runScopeFacetOptions,
  type RunScopeFilters,
  updateRunScopeComponents,
  updateRunScopeFolders,
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
  const facets = useMemo(() => runScopeFacetOptions(cases, filters), [cases, filters]);
  const selected = useMemo(() => new Set(caseIds), [caseIds]);
  const filterCount = activeRunFilterCount(filters);
  const update = <K extends keyof RunScopeFilters>(key: K, value: RunScopeFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const selectMatches = () => setCaseIds((current) => Array.from(new Set([...current, ...visibleCases.map((item) => item.id)])));
  const clearMatches = () => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)));

  useEffect(() => {
    setFilters((current) => reconcileRunScopeFilters(cases, current));
  }, [cases]);

  return <div className={styles.scopeBuilder} data-testid="run-case-picker">
    <div className={styles.scopeToolbar}>
      <label className={styles.scopeSearch}>
        <Search size={16} />
        <input autoFocus aria-label={copy.searchAria} value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder={copy.searchPlaceholder} />
      </label>
      <button type="button" className={filterCount ? styles.filterActive : styles.filterButton} onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
        <Filter size={15} />{filtersOpen ? copy.hideFilters : copy.showFilters}{filterCount > 0 && <b>{filterCount}</b>}
      </button>
      <div className={styles.sortField}><span>{copy.sort}</span><AnimatedSelect label={copy.sort} value={filters.sort}
        onChange={(value) => update("sort", value as RunScopeFilters["sort"])}
        options={[{ value: "updated_desc", label: copy.updatedRecently }, { value: "key_asc", label: copy.keyAsc }, { value: "title_asc", label: copy.titleAsc }]} /></div>
    </div>

    {filtersOpen && <div className={styles.filterGrid}>
      <FilterSelect label={copy.scenario} value={filters.scenario} onChange={(value) => update("scenario", value as RunScopeFilters["scenario"])} options={[["all", copy.allScenarios], ["positive", copy.positive], ["negative", copy.negative], ["corner", copy.corner]]} />
      <FilterSelect label={copy.platform} value={filters.platform} onChange={(value) => update("platform", value as RunScopeFilters["platform"])} options={[["all", copy.allPlatforms], ["ios", copy.ios], ["android", copy.android]]} />
      <div className={styles.filterField}><span>{copy.component}</span><AnimatedMultiSelect
        label={copy.component}
        values={filters.components}
        options={facets.components.map((value) => ({ value, label: localizedComponentLabel(locale, value) }))}
        allLabel={copy.allComponents}
        selectedLabel={copy.selected}
        onChange={(values) => setFilters((current) => updateRunScopeComponents(cases, current, values))}
      /></div>
      <div className={styles.filterField}><span>{copy.folder}</span><AnimatedMultiSelect
        label={copy.folder}
        values={filters.folders}
        options={facets.folders.map((value) => ({ value, label: value }))}
        allLabel={copy.allFolders}
        selectedLabel={copy.selected}
        onChange={(values) => setFilters((current) => updateRunScopeFolders(cases, current, values))}
      /></div>
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
  return <div className={styles.filterField}><span>{label}</span><AnimatedSelect label={label} value={value} onChange={onChange}
    options={options.map(([optionValue, optionLabel]) => ({ value: optionValue, label: optionLabel }))} /></div>;
}
