import { FreeSoloPopover } from "@heroui/popover";
import { Button } from "@heroui/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { customValueLabel } from "../../../../custom-fields/application/field-labels";
import { useCustomFieldValues } from "../../../../custom-fields/state/values/useCustomFieldValues";
import { PriorityIcon, priorityLevels } from "../../../common/properties/PriorityIcon";
import { DefectStatusIcon } from "../../../common/properties/defect/DefectStatusIcon";
import { drillFacetIcons, type DrillFacet, type DrillFacetKey, type DrillScope } from "./model/drill-facets";
import { drillFacetPopoverClasses, FacetPicker } from "./picker/FacetPicker";
import styles from "./picker/picker.module.css";

type Choose = (facet: DrillFacet, value: string, parentValueId?: string | null, label?: string) => void;
const matches = (text: string, query: string) => text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

function ProductFacetValues({ facet, scope, ru, focus, onChoose, onBack }: {
  facet: Extract<DrillFacet, { kind: "scope" }>; scope: DrillScope; ru: boolean; focus: boolean; onChoose: Choose; onBack?: () => void;
}) {
  const parentValueId = facet.key === "productId" ? scope.filter.productGroupId : undefined;
  const page = useCustomFieldValues({ workspaceId: scope.workspaceId, projectId: scope.projectId,
    fieldId: facet.field?.id ?? "", parentValueId });
  const options = page.items.map(value => ({ value: value.id, label: customValueLabel(value, ru),
    disabled: facet.key === "productId" && !parentValueId && Boolean(value.parentValueId) }));
  return <FacetPicker label={facet.label} options={options} selected={facet.selected} single focus={focus}
    onChoose={id => {
      const option = page.items.find(value => value.id === id);
      if (option) onChoose(facet, id, option.parentValueId, customValueLabel(option, ru));
    }} onBack={onBack} busy={page.loading}
    search={{ label: ru ? "Найти значение…" : "Find a value…", value: page.search, onChange: page.setSearch }}
    empty={page.loading || page.failure ? null : ru ? "Ничего не найдено" : "No matches"}>
    {page.loading && <p className={styles.status} role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
    {Boolean(page.failure) && <Button variant="light" size="sm" className={styles.footerButton} onPress={page.refresh}>
      {ru ? "Повторить загрузку" : "Retry loading"}
    </Button>}
    {page.cursor && <Button variant="light" size="sm" className={styles.footerButton} isDisabled={page.pending} onPress={() => void page.more()}>
      {ru ? "Показать ещё" : "Load more"}
    </Button>}
    {facet.key === "productId" && !parentValueId && <p className={styles.status}>{ru
      ? "Выберите группу, чтобы увидеть её продукты."
      : "Select a group to see its products."}</p>}
  </FacetPicker>;
}

export function DrillFacetValues({ facet, scope, ru, focus, onChoose, onBack }: {
  facet: DrillFacet; scope?: DrillScope; ru: boolean; focus: boolean; onChoose: Choose; onBack?: () => void;
}) {
  const [query, setQuery] = useState("");
  if (scope && facet.kind === "scope" && facet.field)
    return <ProductFacetValues facet={facet} scope={scope} ru={ru} focus={focus} onChoose={onChoose} onBack={onBack} />;
  const options = facet.options.filter(option => matches(option.label, query)).map(option => {
    if (facet.key === "status" && facet.kind === "list" && facet.entity === "defect")
      return { ...option, icon: <DefectStatusIcon status={option.value} label={option.label} /> };
    if (facet.key === "priority") {
      const level = priorityLevels.find(item => item.key === option.value)?.key;
      return { ...option, icon: <PriorityIcon level={level} empty="circle" /> };
    }
    return option;
  });
  return <FacetPicker label={facet.label} options={options}
    selected={facet.selected} single={facet.kind === "scope"} onChoose={value => onChoose(facet, value)}
    onBack={onBack} focus={focus} empty={ru ? "Ничего не найдено" : "No matches"}
    search={{ label: ru ? "Найти значение…" : "Find a value…", value: query, onChange: setQuery }} />;
}

export function DashboardDrillFacets({ facets, scope, catalog, ru, onChoose }: {
  facets: DrillFacet[]; scope?: DrillScope; catalog: { loading: boolean; failure: unknown; refresh(): void };
  ru: boolean; onChoose: Choose;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DrillFacetKey | null>(null);
  const [compact, setCompact] = useState(false);
  const anchor = useRef<HTMLElement>(null!);
  const categories = useRef<HTMLDivElement>(null);
  const values = useRef<HTMLDivElement>(null);
  const active = facets.find(facet => facet.key === selected);
  const addLabel = ru ? "Добавить фильтр…" : "Add filter…";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 540px), (hover: none)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function openFacet(key: string, row: HTMLElement, focus: boolean) {
    anchor.current = row;
    setSelected(key as DrillFacetKey);
    if (focus) requestAnimationFrame(() => values.current?.querySelector("input")?.focus({ preventScroll: true }));
  }
  function back() {
    setSelected(null);
    requestAnimationFrame(() => {
      const next = anchor.current?.isConnected ? anchor.current : categories.current?.querySelector("input");
      next?.focus({ preventScroll: true });
    });
  }
  function onBackKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || (event.key !== "Escape" && event.key !== "ArrowLeft")) return;
    if (event.key === "ArrowLeft" && event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    event.stopPropagation();
    back();
  }

  const valuesMenu = active && <div ref={values} className={styles.menu} data-drill-facet-values onKeyDownCapture={onBackKey}>
    <DrillFacetValues key={active.key} facet={active} scope={scope} ru={ru} focus={compact} onChoose={onChoose} onBack={compact ? back : undefined} />
  </div>;
  if (compact && valuesMenu) return valuesMenu;
  return <>
    <div ref={categories} className={styles.menu}>
      <FacetPicker label={ru ? "Типы фильтров" : "Filter categories"}
        search={{ label: addLabel, value: query, onChange: value => { setQuery(value); setSelected(null); } }}
        options={facets.filter(facet => matches(facet.label, query)).map(facet => {
          const Icon = drillFacetIcons[facet.key];
          return { value: facet.key, label: facet.label, icon: <Icon size={15} aria-hidden="true" /> };
        })}
        onChoose={(key, row) => openFacet(key, row, true)}
        onHover={(key, row) => { if (!compact) openFacet(key, row, false); }}
        busy={catalog.loading} empty={catalog.loading ? null : ru ? "Нет доступных фильтров" : "No available filters"}>
        {catalog.loading && <p role="status" className={styles.status}>{ru ? "Загрузка полей…" : "Loading fields…"}</p>}
        {Boolean(catalog.failure) && <Button variant="light" size="sm" className={styles.footerButton} onPress={catalog.refresh}>
          {ru ? "Повторить загрузку полей" : "Retry loading fields"}
        </Button>}
      </FacetPicker>
    </div>
    {active && <FreeSoloPopover key={active.key} isOpen disableAnimation disableDialogFocus triggerRef={anchor} placement="left-start" offset={4} crossOffset={-4}
      containerPadding={8} shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false}
      isDismissable={false} isKeyboardDismissDisabled dialogProps={{ "aria-label": active.label }}
      classNames={drillFacetPopoverClasses} style={{ zIndex: 84 }}>{valuesMenu}</FreeSoloPopover>}
  </>;
}
