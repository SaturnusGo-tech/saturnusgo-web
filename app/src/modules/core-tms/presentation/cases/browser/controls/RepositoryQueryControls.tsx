import { QlSearchHint } from "../../../common/query-search/QlSearchHint";
import { isQlSearchShortcut } from "../../../common/query-search/ql-search-shortcut";
import { Button, Input, Popover, PopoverTrigger } from "@heroui/react";
import { QlDisclosure } from "../../../common/disclosure/QlDisclosure";
import { fieldFilterCount } from "../../model/fields/case-field-filters";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseFilters } from "../../../../state/types/workspace";
import type { useMemberDirectory } from "../../../../workspace/members/state/directory/useMemberDirectory";
import type { CaseFacetFilters, CaseFacetOptions } from "../../model/caseListModel";
import { CaseFilterMenu, CaseQlAutocomplete, type ExtraFilterSection } from "../../toolbar/CasesToolbarPopovers";
import picker from "../../toolbar/filter/picker/repository-filter-picker.module.css";
import css from "./repository-controls.module.css";

export function RepositoryQueryControls({
  locale, query, onQuery, qlQuery, onQlQuery, filters, onFilters, facets, onFacets, options, tags, directory,
  filterOpen, onFilterOpen, extraSections, onResetExtra, customSectionsOnly, disabled, compact, layer, portalContainer, actions,
}: {
  locale: TmsLocale; query: string; onQuery(value: string): void; qlQuery: string; onQlQuery(value: string): void;
  filters: CaseFilters; onFilters(value: CaseFilters): void; facets: CaseFacetFilters; onFacets(value: CaseFacetFilters): void;
  options: CaseFacetOptions; tags: string[]; directory: ReturnType<typeof useMemberDirectory>;
  filterOpen: boolean; onFilterOpen(open: boolean): void; extraSections?: ExtraFilterSection[]; onResetExtra?(): void;
  customSectionsOnly?: boolean; disabled?: boolean; compact?: boolean; layer?: number; portalContainer?: HTMLElement; actions?: ReactNode;
}) {
  const ru = locale === "ru";
  const [qlOpen, setQlOpen] = useState(Boolean(qlQuery));
  const [dialogPortal, setDialogPortal] = useState<HTMLElement>();
  const captureRoot = useCallback((node: HTMLDivElement | null) => {
    if (node) setDialogPortal(node.closest<HTMLElement>('[role="dialog"]') ?? undefined);
  }, []);
  // Match the existing fixed-run drawer policy and keep portals inside its focus scope.
  const overlayLayer = layer ?? (dialogPortal ? 180 : 80);
  const overlayPortal = portalContainer ?? dialogPortal;
  const qlId = useId();
  const filterId = useId();
  const qlRef = useRef<HTMLDivElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null!);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!disabled) return;
    setQlOpen(false);
    onFilterOpen(false);
  }, [disabled, onFilterOpen]);
  function openQl() {
    if (disabled) return;
    onFilterOpen(false);
    requestAnimationFrame(() => qlRef.current?.querySelector("input")?.focus({ preventScroll: true }));
    setQlOpen(true);
  }
  function closeQl() {
    setQlOpen(false);
    searchInput.current?.focus({ preventScroll: true });
  }
  function changeFilterOpen(next: boolean) {
    if (next) setQlOpen(false);
    onFilterOpen(next);
  }
  const active = (extraSections?.filter(section => section.active).length ?? 0) + fieldFilterCount(facets) + Number(filters.type !== "all") + Number(filters.priority !== "all")
    + Number(filters.lifecycle !== "all") + Number(Boolean(filters.maintenanceStatus && filters.maintenanceStatus !== "all")) + Number(Boolean(filters.tag.trim()))
    + Number(filters.includeArchived) + facets.folders.length + facets.components.length + (facets.owners?.length ?? 0);
  return <div ref={captureRoot} className={css.controls} data-repository-controls data-case-popover-root data-compact={compact || undefined}>
    <div className={css.searchRow}>
      <div className={css.repositorySearch} data-input-shell>
        <Input ref={searchInput} isDisabled={disabled} type="search" value={query} onValueChange={onQuery}
          size="sm" variant="flat" placeholder={ru ? "Найти кейсы или выполнить QL" : "Find cases or run a QL query"}
          aria-keyshortcuts="Meta+L Control+L" aria-expanded={qlOpen} aria-controls={qlOpen ? qlId : undefined} onKeyDown={event => {
            if (!isQlSearchShortcut(event) || disabled) return;
            event.preventDefault(); event.stopPropagation(); openQl();
          }}
          aria-label={ru ? "Поиск по ID, названию, ответственному, папке, компоненту или тегу" : "Search by ID, title, assignee, folder, component, or tag"}
          classNames={{ inputWrapper: css.searchControl, innerWrapper: css.searchInner, input: css.searchText }}
          startContent={<Search size={15} aria-hidden="true" />}
          endContent={<><QlSearchHint active={Boolean(qlQuery)} ru={ru} disabled={disabled} open={qlOpen} controls={qlOpen ? qlId : undefined} onOpen={openQl} />{query && <Button type="button" isDisabled={disabled} isIconOnly size="sm" variant="light" disableRipple className={css.searchClear}
            aria-label={ru ? "Очистить поиск" : "Clear search"}
            onPress={() => { onQuery(""); searchInput.current?.focus({ preventScroll: true }); }}><X size={14} aria-hidden="true" /></Button>}</>} />
      </div>
      <Popover isOpen={filterOpen} onOpenChange={changeFilterOpen} placement="bottom-end" offset={7} containerPadding={12}
        shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false} disableAnimation
        shouldCloseOnInteractOutside={element => !element.closest("[data-repository-filter], [data-filter-value-panel], [data-testid='case-filter-toggle']")}
        portalContainer={overlayPortal} classNames={{ base: picker.positioner, content: picker.surface }} style={{ zIndex: overlayLayer }}>
        <PopoverTrigger><Button ref={filterTrigger} isDisabled={disabled} type="button" size="sm" variant="light" disableRipple className={css.repositoryTool}
          aria-controls={filterOpen ? filterId : undefined}
          aria-label={active ? (ru ? `Фильтры, активно: ${active}` : `Filters, active: ${active}`) : (ru ? "Фильтры" : "Filters")}
          title={ru ? "Фильтры" : "Filters"} data-testid="case-filter-toggle">
          <SlidersHorizontal size={16} aria-hidden="true" />{active > 0 && <b aria-hidden="true">{active}</b>}
        </Button></PopoverTrigger>
        {filterOpen && <CaseFilterMenu repositoryTrigger={filterTrigger} panelId={filterId} overlayLayer={overlayLayer + 1} portalContainer={overlayPortal}
          customSectionsOnly={customSectionsOnly} extraSections={extraSections} onResetExtra={onResetExtra} locale={locale} filters={filters} facets={facets} options={options} tags={tags}
          onFilters={onFilters} onFacets={onFacets} onClose={() => onFilterOpen(false)} />}
      </Popover>
      {actions}
    </div>
    {directory.loading && Boolean(query || qlQuery) && <span role="status" className={css.queryHint}>{ru ? "Загружаем ответственных…" : "Loading assignees…"}</span>}
    {directory.error && <button type="button" className={css.tool} onClick={directory.retry}>{ru ? "Не удалось загрузить ответственных. Повторить" : "Could not load assignees. Retry"}</button>}
    {!filterOpen && <QlDisclosure open={qlOpen && !disabled}><div ref={qlRef} id={qlId} className={css.ql} onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault(); event.stopPropagation(); closeQl();
    } }}><CaseQlAutocomplete floatingSuggestions onDismiss={closeQl} locale={locale} query={qlQuery} folders={options.folders} components={options.components} members={directory.items} tags={tags} onQuery={onQlQuery} /></div></QlDisclosure>}
  </div>;
}
