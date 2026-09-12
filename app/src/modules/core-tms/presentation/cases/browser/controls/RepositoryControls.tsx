import { RunAssigneeFilter } from "../../../runs/filters/assignee/RunAssigneeFilter";
import { useId, useRef, useState } from "react";
import { PiCheckSquare, PiFunnelSimple, PiMagnifyingGlass, PiPlus, PiUser, PiX } from "react-icons/pi";
import type { CasesViewProps } from "../../types";
import type { useCasesViewController } from "../../view/useCasesViewController";
import type { TmsLocale } from "../../../../localization/model/locale";
import { CaseFilterMenu, CaseQlAutocomplete } from "../../toolbar/CasesToolbarPopovers";
import css from "./repository-controls.module.css";

export function RepositoryControls({ props, view, locale }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; locale: TmsLocale;
}) {
  const ru = locale === "ru";
  const [qlOpen, setQlOpen] = useState(Boolean(view.qlQuery));
  const qlId = useId();
  const qlRef = useRef<HTMLDivElement>(null);
  const qlButton = useRef<HTMLButtonElement>(null);
  const filterButton = useRef<HTMLButtonElement>(null);
  const locked = Boolean(props.editor || props.folders?.busy);
  const active = Number(props.filters.type !== "all") + Number(props.filters.priority !== "all")
    + Number(props.filters.lifecycle !== "all") + Number(Boolean(props.filters.tag.trim()))
    + Number(props.filters.includeArchived) + view.facetFilters.folders.length + view.facetFilters.components.length + (view.facetFilters.owners?.length ?? 0);
  function closeFilters() { view.setFilterOpen(false); filterButton.current?.focus(); }
  return <div className={css.controls} data-case-popover-root>
    <div className={css.searchRow}>
    <label className={css.search} data-input-shell><PiMagnifyingGlass size={16} aria-hidden="true" />
      <input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder={ru ? "Найти тест-кейс" : "Find a test case"}
        aria-label={ru ? "Поиск по ID, названию, ответственному, папке, компоненту или тегу" : "Search by ID, title, assignee, folder, component, or tag"} />
      {props.query && <button type="button" onClick={() => props.onQuery("")} aria-label={ru ? "Очистить поиск" : "Clear search"}><PiX size={14} /></button>}
    </label>
      <button type="button" className={css.create} disabled={locked || view.folderArchived} onClick={() => view.createCase()}
        title={view.folderArchived ? (ru ? "Выберите активную папку" : "Select an active folder") : undefined}><PiPlus size={15} /><span>{ru ? "Новый кейс" : "New case"}</span></button>
    </div>
    <div className={css.tools}>
      <button type="button" className={css.tool} disabled={locked} aria-pressed={view.selectionMode} onClick={view.toggleSelectionMode}
        aria-label={ru ? "Выбрать тест-кейсы" : "Select test cases"} title={ru ? "Выбрать тест-кейсы" : "Select test cases"}><PiCheckSquare size={16} /><span>{ru ? "Выбрать" : "Select"}</span></button>
      <button ref={qlButton} type="button" className={css.tool} aria-label={ru ? "QL-запрос" : "QL query"} aria-expanded={qlOpen} aria-controls={qlId} data-active={Boolean(view.qlQuery) || undefined}
        onClick={() => { setQlOpen(!qlOpen); if (!qlOpen) requestAnimationFrame(() => qlRef.current?.querySelector("input")?.focus()); }}>QL</button>
      <div className={css.filter}>
        <button ref={filterButton} type="button" className={css.tool} onClick={() => view.setFilterOpen(!view.filterOpen)} aria-expanded={view.filterOpen}
          aria-label={active ? (ru ? `Фильтры, активно: ${active}` : `Filters, active: ${active}`) : (ru ? "Фильтры" : "Filters")}
          title={ru ? "Фильтры" : "Filters"} data-testid="case-filter-toggle"><PiFunnelSimple size={16} />{active > 0 && <b>{active}</b>}</button>
        {view.filterOpen && <CaseFilterMenu locale={locale} filters={props.filters} facets={view.facetFilters} options={view.facetOptions}
          onFilters={props.onFilters} onFacets={view.setFacetFilters} onClose={closeFilters}
          extraSections={[{ id: "owner", icon: <PiUser size={13} />, active: Boolean(view.facetFilters.owners?.length), label: ru ? "Ответственные" : "Assignees", summary: String(view.facetFilters.owners?.length || (ru ? "Все" : "All")),
            render: () => <RunAssigneeFilter workspaceId={view.workspaceId} ru={ru} selected={view.facetFilters.owners ?? []}
              onChange={value => view.setFacetFilters(current => ({ ...current, owners: value === "all" ? [] : current.owners?.includes(value) ? current.owners.filter(id => id !== value) : [...(current.owners ?? []), value] }))} /> }]} />}
      </div>
      <div className={css.selection} data-open={view.selectionMode || undefined} aria-hidden={!view.selectionMode}
        ref={(element) => { if (element) element.inert = !view.selectionMode; }}>
        <div className={css.selectionActions}>
          <button type="button" disabled={locked || !view.selectableVisibleCount} onClick={view.bulkSelection.selectVisible}>{ru ? "Выбрать в папке" : "Select in folder"}</button>
          <button type="button" disabled={locked || !view.selectableCount} onClick={view.bulkSelection.selectAll}>{ru ? "Выбрать все" : "Select all"}</button>
        </div>
      </div>
    </div>
    {view.directory.loading && Boolean(props.query || view.qlQuery) && <span role="status" className={css.queryHint}>{ru ? "Загружаем ответственных…" : "Loading assignees…"}</span>}
    {view.directory.error && <button type="button" className={css.tool} onClick={view.directory.retry}>{ru ? "Не удалось загрузить ответственных. Повторить" : "Could not load assignees. Retry"}</button>}
    {qlOpen && <div ref={qlRef} id={qlId} className={css.ql} onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault(); event.stopPropagation(); setQlOpen(false); qlButton.current?.focus();
    } }}><CaseQlAutocomplete locale={locale} query={view.qlQuery} folders={view.facetOptions.folders} components={view.facetOptions.components} members={view.directory.items} tags={[...new Set(props.testCases.flatMap(item => item.tags))]} onQuery={view.setQlQuery} /></div>}
  </div>;
}
