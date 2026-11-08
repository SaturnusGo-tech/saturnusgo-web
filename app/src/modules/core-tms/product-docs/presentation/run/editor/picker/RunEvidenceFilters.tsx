"use client";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { localizedComponentLabel, localizedLabel } from "../../../../../localization/format/labels";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { emptyRunFilters, runFilterValues, type RunFilterState } from "../../../../../presentation/runs/filters/run-filter-model";
import type { ProductDocScope } from "../../../../domain/product-docs";
import { useRunEvidenceCatalog, useRunEvidenceProjects } from "../../../../state/run/catalog/useRunEvidenceCatalog";
import { RunEvidenceAssigneeOptions, RunEvidenceFilterOptions } from "./filters/RunEvidenceFilterOptions";
import { RunEvidenceFolderFilter } from "./filters/RunEvidenceFolderFilter";
import styles from "./filters/run-filter-popover.module.css";
import drawerStyles from "./run-evidence-inspector.module.css";

type Field = keyof RunFilterState;

export function runEvidenceFilterCount(filters: RunFilterState) {
  return Object.entries(filters).filter(([key, values]) => key !== "groups" && values.length > 0).length;
}

type Props = {
  scope: ProductDocScope;
  locale: TmsLocale;
  filters: RunFilterState;
  disabled: boolean;
  tags: string[];
  components: string[];
  open: boolean;
  instantClose?: boolean;
  portalContainer?: HTMLElement | null;
  onOpenChange(open: boolean): void;
  onChange(filters: RunFilterState): void;
};

export function RunEvidenceFilters({
  scope, locale, filters, disabled, tags, components, open, instantClose, portalContainer, onOpenChange, onChange,
}: Props) {
  const ru = locale === "ru";
  const [field, setField] = useState<Field>();
  const trigger = useRef<HTMLButtonElement>(null);
  const previousField = useRef<Field>(undefined);
  const reduced = useReducedMotion();
  const projects = useRunEvidenceProjects(scope.workspaceId, open);
  const projectOptions = projects.status === "ready" ? projects.data : [];
  const projectIds = filters.projects.length ? filters.projects : projectOptions.map((item) => item.value);
  const catalogField = field === "folders" || field === "products" || field === "productGroups";
  const catalog = useRunEvidenceCatalog(scope, projectIds, open && catalogField ? field : undefined);
  const labels = filterLabels(ru);
  const count = runEvidenceFilterCount(filters);
  const panelLabel = ru ? "Фильтры прогонов" : "Run filters";
  const change = (values: string[]) => { if (field) onChange({ ...filters, [field]: values }); };

  function changeOpen(next: boolean) {
    if (next) {
      setField(undefined);
      previousField.current = undefined;
    }
    onOpenChange(next);
  }

  const options = !field ? [] : field === "projects" ? projectOptions
    : catalogField ? (catalog.status === "ready" ? catalog.data : [])
    : field === "groups" ? [
      { value: "project", label: ru ? "По проектам" : "By project" },
      { value: "component", label: ru ? "По продуктам" : "By product" },
      { value: "tag", label: ru ? "По тегам" : "By tag" },
    ] : field === "owners" ? []
    : field === "tags" || field === "components" ? [...new Set([...filters[field], ...(field === "tags" ? tags : components)])].map((value) => ({
      value, label: field === "components" ? localizedComponentLabel(locale, value) : value,
    }))
    : runFilterValues[field].map((value) => ({ value, label: localizedLabel(locale, value) }));
  const resource = field === "projects" ? projects : catalogField ? catalog : undefined;
  const placeholder = field === "tags" ? (ru ? "Найти или ввести тег" : "Find or enter a tag")
    : field === "components" ? (ru ? "Найти или ввести компонент" : "Find or enter a component")
    : field === "projects" || catalogField ? (ru ? "Найти значение" : "Find a value") : undefined;

  return <Popover isOpen={open} onOpenChange={changeOpen} placement="bottom-end" offset={7} containerPadding={12}
    disableAnimation={instantClose || Boolean(reduced)} shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false}
    shouldCloseOnInteractOutside={(element) => !element.closest("[data-run-picker-tool]")}
    portalContainer={portalContainer ?? trigger.current?.closest('[role="dialog"]') ?? undefined}
    classNames={{ base: styles.positioner, content: styles.surface }} style={{ zIndex: 5 }}>
    <PopoverTrigger>
      <Button ref={trigger} isIconOnly size="sm" variant="light" className={drawerStyles.searchTool}
        data-run-picker-tool="filters" aria-label={panelLabel} title={panelLabel} isDisabled={disabled} data-filtered={count > 0 || undefined}>
        <SlidersHorizontal size={16} aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    {!instantClose && <PopoverContent aria-label={panelLabel} onKeyDownCapture={(event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      changeOpen(false);
      requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    }}>
      <div className={styles.header}>
        {field && <Button isIconOnly className={styles.iconButton} aria-label={ru ? "Назад к фильтрам" : "Back to filters"}
          onPress={() => { previousField.current = field; setField(undefined); }}><ArrowLeft size={15} aria-hidden="true" /></Button>}
        <strong>{field ? labels[field] : panelLabel}</strong>
        <Button isIconOnly className={styles.iconButton} aria-label={ru ? "Закрыть фильтры" : "Close filters"} onPress={() => changeOpen(false)}>
          <X size={15} aria-hidden="true" />
        </Button>
      </div>
      <FilterViewport>
          <FilterPage key={field ?? "index"} direction={field ? "forward" : previousField.current ? "back" : undefined}
            focus={Boolean(field || previousField.current)}
            focusSelector={!field && previousField.current ? `[data-facet="${previousField.current}"]` : undefined}>
            {!field ? <>
              <div className={styles.index}>
                {(Object.keys(labels) as Field[]).map((name) => <Button key={name} className={styles.facet} disableRipple
                  aria-label={labels[name]} aria-description={name !== "groups" && filters[name].length
                    ? (ru ? `Выбрано ${filters[name].length}` : `${filters[name].length} selected`) : undefined}
                  data-facet={name} onPress={() => setField(name)}>
                  <span>{labels[name]}</span>
                  {filters[name].length > 0 && name !== "groups" && <small>{filters[name].length}</small>}
                  <ChevronRight size={13} aria-hidden="true" />
                </Button>)}
              </div>
              {count > 0 && <Button className={styles.action} onPress={() => onChange({ ...emptyRunFilters(), groups: filters.groups })}>
                {ru ? "Сбросить фильтры" : "Clear filters"}
              </Button>}
            </> : field === "owners"
              ? <RunEvidenceAssigneeOptions workspaceId={scope.workspaceId} selected={filters.owners} onChange={change} ru={ru} label={labels.owners} />
              : field === "folders"
                ? <RunEvidenceFolderFilter options={options} selected={filters.folders} onChange={change} ru={ru} loading={resource?.status !== "ready"} />
                : <RunEvidenceFilterOptions label={labels[field]} options={options} selected={filters[field]} onChange={change} ru={ru}
                  single={field === "groups"} placeholder={placeholder} allowCustom={field === "tags" || field === "components"} />}
            {resource?.status === "loading" && <p className={styles.note} role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
            {resource?.status === "error" && <Button className={styles.action} onPress={resource.retry}>
              {ru ? "Повторить загрузку" : "Retry loading"}
            </Button>}
          </FilterPage>
      </FilterViewport>
    </PopoverContent>}
  </Popover>;
}

function FilterViewport({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className={styles.viewport} style={{ blockSize: height }}>
    <div ref={content} className={styles.viewportContent}>{children}</div>
  </div>;
}

function FilterPage({ direction, focus, focusSelector, children }: {
  direction?: "forward" | "back"; focus: boolean; focusSelector?: string; children: ReactNode;
}) {
  const layer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!focus) return;
    const frame = requestAnimationFrame(() => {
      const target = focusSelector ? layer.current?.querySelector<HTMLElement>(focusSelector) : layer.current;
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, focusSelector]);
  return <div ref={layer} className={styles.page} tabIndex={-1} data-filter-page data-direction={direction}>{children}</div>;
}

function filterLabels(ru: boolean): Record<Field, string> {
  return {
    projects: ru ? "Проекты" : "Projects", results: ru ? "Результаты" : "Results",
    groups: ru ? "Группировка" : "Group by", folders: ru ? "Папки" : "Folders",
    productGroups: ru ? "Группы продуктов" : "Product groups", products: ru ? "Продукты" : "Products",
    regression: ru ? "Регресс" : "Regression", types: ru ? "Тип" : "Type", priorities: ru ? "Приоритет" : "Priority",
    statuses: ru ? "Статус кейса" : "Case status", owners: ru ? "Ответственные" : "Assignees", tags: ru ? "Теги" : "Tags",
    components: ru ? "Компоненты" : "Components",
  };
}
