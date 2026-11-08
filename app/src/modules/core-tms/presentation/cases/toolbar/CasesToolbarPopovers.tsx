import { caseFieldFilterSections } from "./fields/CaseFieldFilterSections";
import { useRef, useState, type ReactNode, type KeyboardEvent, type RefObject } from "react";
import {
  Ban, Bot, ChartNoAxesColumnIncreasing, Check, CheckCircle2, ChevronUp, ChevronsDown, ChevronsUp,
  Circle, CircleDashed, CircleDot, Flag, Folder, Hand, ListChecks, Minus, Search, Star, Tags, Users, X,
  type LucideIcon,
} from "lucide-react";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { RunAssigneeFilter } from "../../runs/filters/assignee/RunAssigneeFilter";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import type { CaseFilters } from "../../../state/types/workspace";
import type { CaseFacetFilters, CaseFacetOptions } from "../model/caseListModel";
import { useFilterPopup } from "./filter/useFilterPopup";
import styles from "./filter/filter-panel.module.css";
import { RepositoryFilterPicker } from "./filter/picker/RepositoryFilterPicker";

export type ExtraFilterSection = { id: string; label: string; icon: ReactNode; summary: string; active: boolean; render: () => ReactNode };
const resetFilters: CaseFilters = { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false };
const priorities = ["all", "critical", "high", "medium", "low"] as const;
const lifecycles = ["all", "ready", "draft", "deprecated"] as const;
const caseTypes = ["all", "manual", "checklist", "automated"] as const;
const repositoryOrder = ["lifecycle", "owner", "priority", "type", "tag", "folders", "productGroups", "products", "regression", "maintenanceStatus"];
const repositoryValueIcons: Record<string, LucideIcon> = {
  critical: ChevronsUp, high: ChevronUp, medium: Minus, low: ChevronsDown,
  ready: CheckCircle2, draft: CircleDashed, deprecated: Ban,
  manual: Hand, checklist: ListChecks, automated: Bot,
};

type FilterProps = {
  customSectionsOnly?: boolean; extraSections?: ExtraFilterSection[]; onResetExtra?: () => void;
  repositoryTrigger?: RefObject<HTMLButtonElement>; tags?: string[];
  locale: TmsLocale; filters: CaseFilters; facets: CaseFacetFilters; options: CaseFacetOptions;
  onFilters: (value: CaseFilters) => void; onFacets: (value: CaseFacetFilters) => void; onClose: () => void;
};

export function CaseFilterMenu(props: FilterProps) {
  const ru = props.locale === "ru";
  const repository = Boolean(props.repositoryTrigger);
  const people = useWorkspacePeople();
  const sections = [...(props.extraSections ?? []), ...(!props.customSectionsOnly ? caseFieldFilterSections(props.facets, props.options, props.onFacets, ru, repository) : [])];
  if (!props.customSectionsOnly && !sections.some(item => item.id === "owner" || item.id === "assignee")) {
    sections.unshift({ id: "owner", label: ru ? "Ответственные" : "Assignees", icon: <Users size={16} />,
      active: Boolean(props.facets.owners?.length), summary: String(props.facets.owners?.length || (ru ? "Все" : "All")),
      render: () => <RunAssigneeFilter workspaceId={people.workspaceId} ru={ru} popover={repository} selected={props.facets.owners ?? []}
        onChange={value => props.onFacets({ ...props.facets, owners: value === "all" ? [] : props.facets.owners?.includes(value)
          ? props.facets.owners.filter(id => id !== value) : [...(props.facets.owners ?? []), value] })} /> });
  }
  const [requestedSection, setSection] = useState(repository ? "" : props.customSectionsOnly ? sections[0]?.id ?? "" : "lifecycle");
  const [categorySearch, setCategorySearch] = useState("");
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const labels: Record<string, string> = { folders: ru ? "Папки" : "Folders", components: ru ? "Компоненты" : "Components", type: ru ? "Тип" : "Type", priority: ru ? "Приоритет" : "Priority", lifecycle: ru ? "Статус" : "Status", tag: ru ? "Теги" : "Tags" };
  const valueLabel = (value: string) => {
    const values: Record<string, string> = ru
      ? { all: "Все", needs_update: "На доработке", current: "Актуальные", manual: "Ручной", checklist: "Чек-лист", automated: "Автоматизированный", critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий", ready: "Готово", draft: "Черновик", deprecated: "Устарел" }
      : { all: "All", needs_update: "Needs update", current: "Current", manual: "Manual", checklist: "Checklist", automated: "Automated", critical: "Critical", high: "High", medium: "Medium", low: "Low", ready: "Ready", draft: "Draft", deprecated: "Deprecated" };
    return values[value] ?? value;
  };
  const navigation = [...sections, ...(!props.customSectionsOnly ? [
    { id: "folders", label: labels.folders, icon: <Folder size={16} />, active: !!props.facets.folders.length, summary: String(props.facets.folders.length) },
    { id: "type", label: labels.type, icon: repository ? <ListChecks size={16} /> : <Bot size={16} />, active: props.filters.type !== "all", summary: "" },
    { id: "priority", label: labels.priority, icon: repository ? <ChartNoAxesColumnIncreasing size={16} /> : <Flag size={16} />, active: props.filters.priority !== "all", summary: "" },
    { id: "lifecycle", label: labels.lifecycle, icon: <CircleDot size={16} />, active: props.filters.lifecycle !== "all", summary: "" },
    { id: "maintenanceStatus", label: ru ? "На доработке" : "Maintenance", icon: <Star size={16} />, active: Boolean(props.filters.maintenanceStatus && props.filters.maintenanceStatus !== "all"), summary: "" },
    { id: "tag", label: labels.tag, icon: <Tags size={16} />, active: !!props.filters.tag.trim(), summary: "" },
  ] : [])];
  const categoryQuery = categorySearch.trim().toLocaleLowerCase();
  const categories = repository
    ? navigation.filter(item => item.label.toLocaleLowerCase().includes(categoryQuery))
      .sort((a, b) => repositoryOrder.indexOf(a.id) - repositoryOrder.indexOf(b.id))
    : navigation;
  const section = categories.some(item => item.id === requestedSection) ? requestedSection : repository ? "" : categories[0]?.id ?? "";
  const current = navigation.find(item => item.id === section);
  useFilterPopup(panelRef, props.onClose);
  const extra = sections.find(item => item.id === section);
  const values = section === "tag" ? props.tags ?? [] : section === "maintenanceStatus" ? ["all", "needs_update", "current"] : section === "folders" ? props.options.folders : section === "components" ? props.options.components : section === "type" ? caseTypes : section === "priority" ? priorities : lifecycles;
  const optionLabel = (value: string) => section === "components" ? localizedComponentLabel(props.locale, value) : section === "tag" ? value : valueLabel(value);
  const valueQuery = (section === "tag" ? props.filters.tag : search).trim().toLocaleLowerCase();
  const visibleValues = values.filter(value => optionLabel(value).toLocaleLowerCase().includes(valueQuery));
  function openSection(next: string) {
    if (next === requestedSection) return;
    setSearch("");
    setSection(next);
  }
  function choose(value: string) {
    if (section === "folders" || section === "components") {
      const currentValues = props.facets[section];
      props.onFacets({ ...props.facets, [section]: currentValues.includes(value) ? currentValues.filter(item => item !== value) : [...currentValues, value] });
    } else if (section === "tag") {
      props.onFilters({ ...props.filters, tag: props.filters.tag === value ? "" : value });
    } else if (section === "type" || section === "priority" || section === "lifecycle" || section === "maintenanceStatus") {
      props.onFilters({ ...props.filters, [section]: value });
    }
  }
  function navigate(event: KeyboardEvent<HTMLElement>, selector: string) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(selector)];
    if (!buttons.length) return;
    event.preventDefault();
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }
  function close() { props.onClose(); panelRef.current?.parentElement?.querySelector<HTMLButtonElement>("button")?.focus(); }
  function reset() { props.onFilters(resetFilters); props.onFacets({ folders: [], components: [], owners: [] }); props.onResetExtra?.(); }
  const searchOptions = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    optionsRef.current?.querySelector<HTMLElement>("[role='option']")?.focus();
  };
  const multiple = section === "folders" || section === "components";
  const valueOptions = visibleValues.map(value => {
    const selected = section === "tag" ? props.filters.tag === value : section === "folders" ? props.facets.folders.includes(value) : section === "components" ? props.facets.components.includes(value)
      : section === "maintenanceStatus" ? (props.filters.maintenanceStatus ?? "all") === value : section === "type" ? props.filters.type === value : section === "priority" ? props.filters.priority === value : props.filters.lifecycle === value;
    const showsStatus = section === "lifecycle" || section === "priority";
    const ValueIcon = repository && (showsStatus || section === "type") ? repositoryValueIcons[value] : showsStatus && value !== "all" ? Circle : undefined;
    return { value, selected, label: optionLabel(value),
      icon: ValueIcon && <ValueIcon size={14} strokeWidth={2.5} className={styles.tone} data-value={value} aria-hidden="true" /> };
  });
  if (props.repositoryTrigger) return <RepositoryFilterPicker ru={ru} categories={categories} section={section}
    categorySearch={categorySearch} search={search} filters={props.filters} trigger={props.repositoryTrigger}
    extra={extra?.render()} values={valueOptions} multiple={multiple} onChoose={choose}
    hasActive={navigation.some(item => item.active) || props.filters.includeArchived}
    onCategorySearch={value => { setCategorySearch(value); openSection(""); }} onSearch={setSearch} openSection={openSection}
    onClose={props.onClose} onReset={reset} onArchived={includeArchived => props.onFilters({ ...props.filters, includeArchived })}
    onTag={tag => props.onFilters({ ...props.filters, tag })} />;
  return <div ref={panelRef} popover="manual" role="dialog" aria-label={ru ? "Фильтры" : "Filters"}
    className={styles.panel} id="case-filter-panel" data-testid="case-filters" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
    <header className={styles.header}><strong>{ru ? "Фильтры" : "Filters"}</strong>
      <button type="button" onClick={close} aria-label={ru ? "Закрыть фильтры" : "Close filters"}><X size={16} /></button></header>
    <div className={styles.body}>
      <div className={styles.navigation} role="tablist" aria-orientation="vertical" aria-label={ru ? "Параметры фильтра" : "Filter categories"}
        onKeyDown={event => { navigate(event, "[role='tab']"); if (event.key === "ArrowRight") {
          event.preventDefault(); panelRef.current?.querySelector<HTMLElement>("[role='tabpanel'] input, [role='tabpanel'] [role='option']")?.focus();
        } }}>
        {navigation.map(item => <button key={item.id} type="button" role="tab" id={`filter-tab-${item.id}`} aria-controls="filter-detail"
          aria-selected={section === item.id} tabIndex={section === item.id ? 0 : -1} data-filter-section={item.id}
          onFocus={() => openSection(item.id)} onClick={() => openSection(item.id)}>
          {item.icon}<span>{item.label}</span>{item.active && <small aria-label={ru ? "Фильтр активен" : "Filter active"}>{item.summary || <Check size={12} />}</small>}
        </button>)}
      </div>
      <section className={styles.detail} role="tabpanel" id="filter-detail" aria-labelledby={current ? `filter-tab-${section}` : undefined}>
        <h3>{current?.label}</h3>
        <div className={styles.content} key={section}>
          {extra ? extra.render() : section === "tag" ? <label className={styles.tag}>
            <input aria-label={ru ? "Тег" : "Tag"} value={props.filters.tag} onChange={event => props.onFilters({ ...props.filters, tag: event.target.value })} placeholder={ru ? "Содержит…" : "Contains…"} />
          </label> : <>
            {(section === "folders" || section === "components") && <label className={styles.search} data-input-shell><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)}
              onKeyDown={searchOptions}
              aria-label={section === "folders" ? (ru ? "Поиск папок" : "Search folders") : (ru ? "Поиск компонентов" : "Search components")}
              placeholder={ru ? "Поиск" : "Search"} /></label>}
            <div ref={optionsRef} className={styles.options} role="listbox" aria-multiselectable={multiple} aria-label={current?.label}
              onKeyDown={event => navigate(event, "[role='option']")}>
              {valueOptions.map(item => <button type="button" role="option" aria-selected={item.selected} key={item.value} onClick={() => choose(item.value)}>
                {item.icon}<span title={item.label}>{item.label}</span>{item.selected && <Check size={14} />}</button>)}
              {!valueOptions.length && <p className={styles.empty}>{ru ? "Ничего не найдено" : "Nothing found"}</p>}
            </div>
          </>}
        </div>
        <footer className={styles.footer}>
          <label className={styles.archive}><span>{ru ? "Показывать архивные" : "Include archived"}</span>
            <input type="checkbox" role="switch" checked={props.filters.includeArchived} onChange={event => props.onFilters({ ...props.filters, includeArchived: event.target.checked })} /></label>
          <button type="button" className={styles.reset} onClick={reset}>{ru ? "Сбросить" : "Reset"}</button>
        </footer>
      </section>
    </div>
  </div>;
}

export { CaseQlAutocomplete } from "./ql/CaseQlAutocomplete";
