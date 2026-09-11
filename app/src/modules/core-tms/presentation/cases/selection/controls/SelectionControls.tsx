import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PiFunnelSimple, PiMagnifyingGlass } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { CaseFilters } from "../../../../state/types/workspace";
import { filterCaseRows, type CaseFacetFilters } from "../../model/caseListModel";
import { CaseFilterMenu, CaseQlAutocomplete } from "../../toolbar/CasesToolbarPopovers";
import css from "../../browser/controls/repository-controls.module.css";

export function useSelectionFilters(cases: TestCaseSummary[]) {
  const [query, setQuery] = useState("");
  const [qlQuery, setQlQuery] = useState("");
  const [filters, setFilters] = useState<CaseFilters>({ type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
  const [facets, setFacets] = useState<CaseFacetFilters>({ folders: [], components: [] });
  const options = useMemo(() => ({ folders: [...new Set(cases.map((c) => c.folderPath))].sort(),
    components: [...new Set(cases.map((c) => c.component).filter(Boolean))].sort() }), [cases]);
  const visible = useMemo(() => filterCaseRows(cases.filter((c) =>
    (filters.includeArchived || !c.archivedAt) && (filters.type === "all" || c.type === filters.type)
    && (filters.priority === "all" || c.priority === filters.priority)
    && (filters.lifecycle === "all" || c.lifecycle === filters.lifecycle)
    && (!filters.tag || c.tags.some((tag) => tag.toLowerCase().includes(filters.tag.toLowerCase()))))
    .map((testCase) => ({ testCase, folderPath: testCase.folderPath })), { titleQuery: query, qlQuery, facets })
    .map((row) => row.testCase), [cases, query, qlQuery, filters, facets]);
  return { query, setQuery, qlQuery, setQlQuery, filters, setFilters, facets, setFacets, options, visible };
}
export function SelectionControls({ state, ru, onSelectAll, action }: {
  state: ReturnType<typeof useSelectionFilters>; ru: boolean; onSelectAll?: () => void; action?: ReactNode;
}) {
  const qlButton = useRef<HTMLButtonElement>(null); const qlPanel = useRef<HTMLDivElement>(null);
  const [ql, setQl] = useState(false); const [filter, setFilter] = useState(false);
  useEffect(() => { if (ql) qlPanel.current?.querySelector("input")?.focus(); }, [ql]);
  return <div className={css.controls} data-case-popover-root>
    <div className={css.searchRow}><label className={css.search} data-input-shell><PiMagnifyingGlass size={16} />
      <input aria-label={ru ? "Найти тест-кейс" : "Find a test case"} placeholder={ru ? "Найти тест-кейс" : "Find a test case"}
        value={state.query} onChange={(e) => state.setQuery(e.target.value)} /></label>{action}</div>
    <div className={css.tools}>
      <button ref={qlButton} className={css.tool} type="button" aria-expanded={ql} onClick={() => setQl(!ql)}>QL</button>
      <div className={css.filter}><button className={css.tool} type="button" aria-expanded={filter}
        aria-label={ru ? "Фильтры" : "Filters"} onClick={() => setFilter(!filter)}><PiFunnelSimple size={16} /></button>
        {filter && <CaseFilterMenu locale={ru ? "ru" : "en"} filters={state.filters} onFilters={state.setFilters}
          facets={state.facets} onFacets={state.setFacets} options={state.options} onClose={() => setFilter(false)} />}</div>
      {onSelectAll && <button className={css.tool} type="button" onClick={onSelectAll}>{ru ? "Выбрать все" : "Select all"}</button>}
    </div>
    {ql && <div ref={qlPanel} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setQl(false); qlButton.current?.focus(); } }}><CaseQlAutocomplete locale={ru ? "ru" : "en"} query={state.qlQuery} onQuery={state.setQlQuery}
      folders={state.options.folders} components={state.options.components} /></div>}
  </div>;
}
