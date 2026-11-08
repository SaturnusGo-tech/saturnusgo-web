import { Button, Input, Popover, PopoverTrigger } from "@heroui/react";
import { QlDisclosure } from "../../../common/disclosure/QlDisclosure";
import { fieldFilterCount } from "../../model/fields/case-field-filters";
import { useId, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CasesViewProps } from "../../types";
import type { useCasesViewController } from "../../view/useCasesViewController";
import type { TmsLocale } from "../../../../localization/model/locale";
import { CaseFilterMenu, CaseQlAutocomplete } from "../../toolbar/CasesToolbarPopovers";
import picker from "../../toolbar/filter/picker/repository-filter-picker.module.css";
import css from "./repository-controls.module.css";

export function RepositoryControls({ props, view, locale }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; locale: TmsLocale;
}) {
  const ru = locale === "ru";
  const [qlOpen, setQlOpen] = useState(Boolean(view.qlQuery));
  const qlId = useId();
  const qlRef = useRef<HTMLDivElement>(null);
  const qlButton = useRef<HTMLButtonElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null!);
  const searchInput = useRef<HTMLInputElement>(null);
  const tags = useMemo(() => [...new Set(props.testCases.flatMap(item => item.tags))].sort(), [props.testCases]);
  const active = fieldFilterCount(view.facetFilters) + Number(props.filters.type !== "all") + Number(props.filters.priority !== "all")
    + Number(props.filters.lifecycle !== "all") + Number(Boolean(props.filters.maintenanceStatus && props.filters.maintenanceStatus !== "all")) + Number(Boolean(props.filters.tag.trim()))
    + Number(props.filters.includeArchived) + view.facetFilters.folders.length + view.facetFilters.components.length + (view.facetFilters.owners?.length ?? 0);
  return <div className={css.controls} data-repository-controls data-case-popover-root>
    <div className={css.searchRow}>
      <div className={css.repositorySearch} data-input-shell>
        <Input ref={searchInput} type="search" value={props.query} onValueChange={props.onQuery}
          size="sm" variant="flat" placeholder={ru ? "Найти тест-кейс" : "Find a test case"}
          aria-label={ru ? "Поиск по ID, названию, ответственному, папке, компоненту или тегу" : "Search by ID, title, assignee, folder, component, or tag"}
          classNames={{ inputWrapper: css.searchControl, innerWrapper: css.searchInner, input: css.searchText }}
          startContent={<Search size={15} aria-hidden="true" />}
          endContent={props.query && <Button type="button" isIconOnly size="sm" variant="light" disableRipple className={css.searchClear}
            aria-label={ru ? "Очистить поиск" : "Clear search"}
            onPress={() => { props.onQuery(""); searchInput.current?.focus({ preventScroll: true }); }}><X size={14} aria-hidden="true" /></Button>} />
      </div>
      <Button ref={qlButton} type="button" size="sm" variant="light" disableRipple className={css.repositoryTool}
        aria-label={ru ? "QL-запрос" : "QL query"} aria-expanded={qlOpen} aria-controls={qlOpen ? qlId : undefined} data-active={Boolean(view.qlQuery) || undefined}
        onPress={() => { setQlOpen(!qlOpen); if (!qlOpen) requestAnimationFrame(() => qlRef.current?.querySelector("input")?.focus({ preventScroll: true })); }}>QL</Button>
      <Popover isOpen={view.filterOpen} onOpenChange={view.setFilterOpen} placement="bottom-end" offset={7} containerPadding={12}
        shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false} disableAnimation
        shouldCloseOnInteractOutside={element => !element.closest("[data-repository-filter], [data-filter-value-panel], [data-testid='case-filter-toggle']")}
        classNames={{ base: picker.positioner, content: picker.surface }} style={{ zIndex: 80 }}>
        <PopoverTrigger><Button ref={filterTrigger} type="button" size="sm" variant="light" disableRipple className={css.repositoryTool}
          aria-controls={view.filterOpen ? "case-filter-panel" : undefined}
          aria-label={active ? (ru ? `Фильтры, активно: ${active}` : `Filters, active: ${active}`) : (ru ? "Фильтры" : "Filters")}
          title={ru ? "Фильтры" : "Filters"} data-testid="case-filter-toggle">
          <SlidersHorizontal size={16} aria-hidden="true" />{active > 0 && <b aria-hidden="true">{active}</b>}
        </Button></PopoverTrigger>
        {view.filterOpen && <CaseFilterMenu repositoryTrigger={filterTrigger} locale={locale} filters={props.filters} facets={view.facetFilters} options={view.facetOptions} tags={tags}
          onFilters={props.onFilters} onFacets={view.setFacetFilters} onClose={() => view.setFilterOpen(false)} />}
      </Popover>
    </div>
    {view.directory.loading && Boolean(props.query || view.qlQuery) && <span role="status" className={css.queryHint}>{ru ? "Загружаем ответственных…" : "Loading assignees…"}</span>}
    {view.directory.error && <button type="button" className={css.tool} onClick={view.directory.retry}>{ru ? "Не удалось загрузить ответственных. Повторить" : "Could not load assignees. Retry"}</button>}
    <QlDisclosure open={qlOpen}><div ref={qlRef} id={qlId} className={css.ql} onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault(); event.stopPropagation(); setQlOpen(false); qlButton.current?.focus();
    } }}><CaseQlAutocomplete floatingSuggestions locale={locale} query={view.qlQuery} folders={view.facetOptions.folders} components={view.facetOptions.components} members={view.directory.items} tags={tags} onQuery={view.setQlQuery} /></div></QlDisclosure>
  </div>;
}
