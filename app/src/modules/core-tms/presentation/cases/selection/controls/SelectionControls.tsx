import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { useMemberDirectory } from "../../../../workspace/members/state/directory/useMemberDirectory";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PiFunnelSimple, PiMagnifyingGlass } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { CaseFilters } from "../../../../state/types/workspace";
import { filterCaseRows, type CaseFacetFilters } from "../../model/caseListModel";
import { CaseFilterMenu, CaseQlAutocomplete, type ExtraFilterSection } from "../../toolbar/CasesToolbarPopovers";
import css from "../../browser/controls/repository-controls.module.css";

type InitialSelectionFilters = { query?: string; qlQuery?: string; filters?: CaseFilters; facets?: CaseFacetFilters };
export function useSelectionFilters(cases: TestCaseSummary[], initial: InitialSelectionFilters = {}) {
  const people = useWorkspacePeople();
  const directory = useMemberDirectory(people.workspaceId, !people.offline && cases.some(item => Boolean(item.ownerIdentityId)));
  const [query, setQuery] = useState(initial.query ?? "");
  const [qlQuery, setQlQuery] = useState(initial.qlQuery ?? "");
  const [filters, setFilters] = useState<CaseFilters>(initial.filters ?? { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false });
  const [facets, setFacets] = useState<CaseFacetFilters>(initial.facets ?? { folders: [], components: [] });
  const deferredQuery = useDeferredValue(query); const deferredQl = useDeferredValue(qlQuery);
  const options = useMemo(() => ({ folders: [...new Set(cases.map((c) => c.folderPath))].sort(),
    components: [...new Set(cases.map((c) => c.component).filter(Boolean))].sort(), tags: [...new Set(cases.flatMap(item => item.tags))].sort() }), [cases]);
  const visible = useMemo(() => filterCaseRows(cases.filter((c) =>
    (filters.includeArchived || !c.archivedAt) && (filters.type === "all" || c.type === filters.type)
    && (filters.priority === "all" || c.priority === filters.priority)
    && (filters.lifecycle === "all" || c.lifecycle === filters.lifecycle)
    && (!filters.tag || c.tags.some((tag) => tag.toLowerCase().includes(filters.tag.toLowerCase()))))
    .map((testCase) => ({ testCase, folderPath: testCase.folderPath })), { titleQuery: deferredQuery, qlQuery: deferredQl, facets, context: { members: directory.members } })
    .map((row) => row.testCase), [cases, deferredQuery, deferredQl, filters, facets, directory.members]);
  return { query, setQuery, qlQuery, setQlQuery, filters, setFilters, facets, setFacets, options, visible, directory };
}
export function SelectionControls({ state, ru, onSelectAll, action, extraSections, onResetExtra, tools, inline = false, disabled = false }: {
  disabled?: boolean; inline?: boolean; extraSections?: ExtraFilterSection[]; onResetExtra?: () => void; tools?: ReactNode;
  state: ReturnType<typeof useSelectionFilters>; ru: boolean; onSelectAll?: () => void; action?: ReactNode;
}) {
  const qlButton = useRef<HTMLButtonElement>(null); const qlPanel = useRef<HTMLDivElement>(null);
  const [ql, setQl] = useState(false); const [filter, setFilter] = useState(false);
  useEffect(() => { if (ql) qlPanel.current?.querySelector("input")?.focus(); }, [ql]);
  useEffect(() => { if (disabled) { setQl(false); setFilter(false); } }, [disabled]);
  return <div className={css.controls} data-inline={inline || undefined} data-case-popover-root>
    <div className={css.searchRow}><label className={css.search} data-input-shell><PiMagnifyingGlass size={16} />
      <input disabled={disabled} aria-label={ru ? "Найти тест-кейс" : "Find a test case"} placeholder={ru ? "Найти тест-кейс" : "Find a test case"}
        value={state.query} onChange={(e) => state.setQuery(e.target.value)} /></label>{action}</div>
    <div className={css.tools}>
      <button ref={qlButton} className={css.tool} type="button" disabled={disabled} aria-expanded={ql} onClick={() => setQl(!ql)}>QL</button>
      <div className={css.filter}><button className={css.tool} type="button" disabled={disabled} aria-expanded={filter}
        data-active={extraSections?.some((item) => item.active) || undefined} aria-label={ru ? "Фильтры" : "Filters"} onClick={() => setFilter(!filter)}><PiFunnelSimple size={16} /></button>
        {filter && <CaseFilterMenu locale={ru ? "ru" : "en"} filters={state.filters} onFilters={state.setFilters}
          customSectionsOnly={inline} extraSections={extraSections} onResetExtra={onResetExtra} facets={state.facets} onFacets={state.setFacets} options={state.options} onClose={() => setFilter(false)} />}</div>
      {onSelectAll && <button className={css.tool} type="button" disabled={disabled} onClick={onSelectAll}>{ru ? "Выбрать все" : "Select all"}</button>}
      {tools}
    </div>
    {ql && <div ref={qlPanel} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setQl(false); qlButton.current?.focus(); } }}><CaseQlAutocomplete locale={ru ? "ru" : "en"} query={state.qlQuery} onQuery={state.setQlQuery}
      folders={state.options.folders} components={state.options.components} members={state.directory.items} tags={state.options.tags} /></div>}
  </div>;
}
