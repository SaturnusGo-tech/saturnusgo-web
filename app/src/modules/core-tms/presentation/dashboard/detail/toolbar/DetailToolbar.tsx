import { FreeSoloPopover } from "@heroui/popover";
import { Button } from "@heroui/react";
import { ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import type { DashboardLocalFilters } from "../../inspector/dashboard-drill-navigation";
import { DashboardDrillFacets, DrillFacetValues } from "../../inspector/facets/DashboardDrillFacets";
import { drillFacetIcons, facetChips, listFacets, updateListFacet, updateProductScope,
  type DrillFacet, type DrillFacetKey, type DrillScope, type FacetChip } from "../../inspector/facets/model/drill-facets";
import { useDrillScope } from "../../inspector/facets/model/useDrillScope";
import { drillFacetPopoverClasses, FacetPicker } from "../../inspector/facets/picker/FacetPicker";
import styles from "./toolbar.module.css";

export type DetailSort = "recent" | "title" | "priority_desc" | "priority_asc";
export const emptyDetailFilters = (): DashboardLocalFilters => ({ query: "", project: [], type: [], component: [], status: [], priority: [] });
type Menu = { type: "filters" | "sort" } | { type: "edit"; facet: DrillFacetKey; value: string };

export function DetailToolbar({ rows, filters, onFilters, sort, onSort, partial, scope }: {
  rows: DashboardDrillRow[]; filters: DashboardLocalFilters; onFilters: (next: DashboardLocalFilters) => void;
  sort: DetailSort; onSort: (next: DetailSort) => void; partial: boolean; scope?: DrillScope;
}) {
  const { locale, t } = useTmsLocale();
  const ru = locale === "ru";
  const [open, setOpen] = useState<Menu | null>(null);
  const menuId = useId();
  const anchor = useRef<HTMLElement>(null!);
  const filterButton = useRef<HTMLButtonElement>(null);
  const { facets: scopeFacets, catalog } = useDrillScope(scope, open?.type === "filters", ru);
  const facets = [...listFacets(rows, filters, locale, {
    type: t("dashboard.type"), project: t("dashboard.project"), component: t("dashboard.component"),
    status: t("dashboard.status"), priority: t("dashboard.priority"),
  }), ...scopeFacets];
  const chips = facetChips(facets);
  const edit = open?.type === "edit" ? facets.find(facet => facet.key === open.facet) : undefined;
  const filterLabel = ru ? "Фильтры" : "Filters";
  const sortLabel = t("dashboard.sort");
  const sortOptions: { value: DetailSort; label: string }[] = [
    { value: "recent", label: t("dashboard.sortRecent") }, { value: "title", label: t("dashboard.sortTitle") },
  ];
  if (rows.some(row => row.priority) || sort.startsWith("priority_")) sortOptions.push(
    { value: "priority_desc", label: ru ? "Сначала высокий приоритет" : "Highest priority first" },
    { value: "priority_asc", label: ru ? "Сначала низкий приоритет" : "Lowest priority first" });
  const openFilters = open?.type === "filters";
  const openSort = open?.type === "sort";

  function toggle(menu: Menu, trigger: Element) {
    if (!(trigger instanceof HTMLElement)) return;
    const same = open?.type === menu.type && (open.type !== "edit" || menu.type === "edit" && open.facet === menu.facet && open.value === menu.value);
    anchor.current = trigger;
    setOpen(same ? null : menu);
  }
  function close(target = anchor.current) {
    setOpen(null);
    requestAnimationFrame(() => (target?.isConnected ? target : filterButton.current)?.focus({ preventScroll: true }));
  }
  function chooseFacet(facet: DrillFacet, value: string, parentValueId?: string | null, label?: string) {
    if (facet.kind === "list") {
      onFilters(updateListFacet(filters, facet.key, value, open?.type === "edit" ? open.value : undefined));
      if (open?.type === "edit" || window.matchMedia("(hover: none)").matches) close();
    } else if (scope) {
      scope.onSelect(updateProductScope(scope.filter, facet.key, value, parentValueId), label);
      close();
    }
  }
  function removeChip(chip: FacetChip, keyboard: boolean) {
    const facet = facets.find(item => item.key === chip.facet);
    if (facet?.kind === "list") onFilters({ ...filters, [facet.key]: filters[facet.key].filter(value => value !== chip.value) });
    if (facet?.kind === "scope" && scope) scope.onSelect(updateProductScope(scope.filter, facet.key));
    if (keyboard) close(filterButton.current ?? anchor.current);
    else setOpen(null);
  }
  function dismissOnEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || event.nativeEvent.isComposing || event.defaultPrevented) return;
    if (event.target instanceof Element && event.target.closest("[data-drill-facet-values]")) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }

  return <div className={styles.toolbar} data-detail-toolbar>
    <div className={styles.controls}>
      <label className={styles.search} data-input-shell><Search size={15} aria-hidden="true" />
        <input type="search" aria-label={t("dashboard.searchRecords")} placeholder={ru ? "Найти запись" : "Find a record"}
          value={filters.query} onChange={event => onFilters({ ...filters, query: event.target.value })} />
      </label>
      {chips.length > 0 && <div className={styles.chips} aria-label={ru ? "Применённые фильтры" : "Applied filters"}>
        {chips.map(chip => {
          const Icon = drillFacetIcons[chip.facet];
          const expanded = open?.type === "edit" && open.facet === chip.facet && open.value === chip.value;
          return <div className={styles.chip} key={`${chip.facet}:${chip.value}`} data-detail-filter-chip={chip.facet}>
            <Button type="button" size="sm" variant="light" className={styles.chipValue} aria-haspopup="dialog"
              aria-expanded={expanded} aria-controls={expanded ? menuId : undefined}
              aria-label={ru ? `Изменить фильтр: ${chip.label}` : `Edit filter: ${chip.label}`}
              title={`${chip.category} · ${chip.label}`} onPress={event => toggle({ type: "edit", facet: chip.facet, value: chip.value }, event.target)}>
              <Icon size={13} aria-hidden="true" /><span>{chip.label}</span>
            </Button>
            <Button type="button" isIconOnly size="sm" variant="light" className={styles.remove}
              aria-label={ru ? `Убрать фильтр: ${chip.label}` : `Remove filter: ${chip.label}`}
              onPress={event => removeChip(chip, event.pointerType === "keyboard")}>
              <X size={12} aria-hidden="true" />
            </Button>
          </div>;
        })}
      </div>}
      <div className={styles.actions}>
        <Button ref={filterButton} type="button" isIconOnly size="sm" variant="light" className={styles.round}
          aria-label={filterLabel} title={filterLabel} aria-haspopup="dialog" aria-expanded={openFilters}
          aria-controls={openFilters ? menuId : undefined} data-active={chips.length > 0 || undefined}
          onPress={event => toggle({ type: "filters" }, event.target)}>
          <ListFilter size={15} aria-hidden="true" />
        </Button>
        <Button type="button" isIconOnly size="sm" variant="light" className={styles.round}
          aria-label={sortLabel} title={sortLabel} aria-haspopup="dialog" aria-expanded={openSort} aria-controls={openSort ? menuId : undefined}
          data-active={sort !== "recent" || undefined} onPress={event => toggle({ type: "sort" }, event.target)}>
          <SlidersHorizontal size={15} aria-hidden="true" />
        </Button>
      </div>
    </div>
    {open && <FreeSoloPopover isOpen disableAnimation triggerRef={anchor} placement={edit ? "bottom-start" : "bottom-end"} offset={5}
      containerPadding={8} shouldCloseOnBlur={false} shouldCloseOnScroll={false} shouldBlockScroll={false} isKeyboardDismissDisabled
      onOpenChange={isOpen => { if (!isOpen) setOpen(null); }}
      shouldCloseOnInteractOutside={target => !target.closest("[data-detail-toolbar], [data-drill-facet-values], [data-drill-menu]")}
      dialogProps={{ "aria-label": edit?.label ?? (openSort ? sortLabel : filterLabel) }}
      classNames={drillFacetPopoverClasses} style={{ zIndex: 83 }}>
      <div id={menuId} data-drill-menu={open.type} onKeyDownCapture={dismissOnEscape}>
        {openSort ? <FacetPicker label={sortLabel} options={sortOptions} selected={[sort]} single onChoose={value => {
          onSort(value as DetailSort);
          close();
        }} /> : edit ? <DrillFacetValues key={edit.key} facet={edit} scope={scope} ru={ru} focus onChoose={chooseFacet} />
          : <DashboardDrillFacets facets={facets} scope={scope} catalog={catalog} ru={ru} onChoose={chooseFacet} />}
      </div>
    </FreeSoloPopover>}
    {partial && <p className={styles.hint}>{ru ? "Поиск, фильтры списка и сортировка — по загруженным записям. Загрузите ещё, чтобы расширить список." : "Search, list filters and sorting apply to loaded records. Load more to expand the list."}</p>}
  </div>;
}
