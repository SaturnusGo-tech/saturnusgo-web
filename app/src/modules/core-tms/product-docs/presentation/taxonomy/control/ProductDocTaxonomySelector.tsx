"use client";

import { Button, Input, Listbox, ListboxItem, Skeleton, Tab, Tabs } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { customFieldError } from "../../../../custom-fields/application/field-errors";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { useCustomFieldValues } from "../../../../custom-fields/state/values/useCustomFieldValues";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { ProductDocTaxonomy } from "../../../domain/product-doc-taxonomy";
import type { ProductDocScope } from "../../../domain/product-docs";
import styles from "../taxonomy.module.css";

export type TaxonomyDimension = "productGroup" | "product";
const dimensions: TaxonomyDimension[] = ["productGroup", "product"];
const clearKey = "clear-product-doc-taxonomy";

type Props = {
  scope: ProductDocScope;
  dimension: TaxonomyDimension;
  filter: boolean;
  value: ProductDocTaxonomy;
  labels: Record<TaxonomyDimension, string>;
  onDimension(dimension: TaxonomyDimension): void;
  onSelect(dimension: TaxonomyDimension, value: ProductDocTaxonomy[TaxonomyDimension]): void;
};

export function ProductDocTaxonomySelector(props: Props) {
  const { scope, dimension, filter, value, labels, onDimension } = props;
  const { locale } = useTmsLocale();
  const catalog = useCustomFieldCatalog(scope.workspaceId, scope.projectId);
  const openingDimension = useRef(dimension);
  const reduceMotion = useReducedMotion();
  function values(field: TaxonomyDimension) {
    const systemKey = field === "productGroup" ? "product_group" : "product";
    const fieldId = catalog.items.find((definition) => definition.systemKey === systemKey)?.id ?? "";
    const groupId = field === "product" ? value.productGroup?.id ?? null : undefined;
    return <TaxonomyValues key={groupId ?? field} {...props} dimension={field} catalog={catalog}
      fieldId={fieldId} groupId={groupId} autoFocus={!filter || field === openingDimension.current} />;
  }
  if (!filter) return <div className={styles.selector}>{values(dimension)}</div>;
  return <div className={styles.selector} data-filter>
    <Tabs classNames={{ tabList: styles.dimensions, tab: styles.dimensionTab, panel: styles.valuePanel,
      cursor: styles.dimensionCursor, tabContent: styles.dimensionContent }} size="sm"
      aria-label={locale === "ru" ? "Фильтры" : "Filters"} selectedKey={dimension}
      destroyInactiveTabPanel={false} disableAnimation={Boolean(reduceMotion)}
      onSelectionChange={(key) => { if (key === "productGroup" || key === "product") onDimension(key); }}>
      {dimensions.map((field) => <Tab key={field} title={<>{labels[field]}
        {value[field] && <span className={styles.activeDot} aria-hidden="true" />}</>}>
        {values(field)}
      </Tab>)}
    </Tabs>
  </div>;
}

function TaxonomyValues({ scope, dimension, filter, value, labels, onSelect, catalog, fieldId, groupId, autoFocus }:
  Omit<Props, "onDimension"> & {
    catalog: ReturnType<typeof useCustomFieldCatalog>;
    fieldId: string;
    groupId?: string | null;
    autoFocus: boolean;
  }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLElement>(null);
  const page = useCustomFieldValues({ ...scope, fieldId, parentValueId: groupId });
  const needsGroup = dimension === "product" && !filter && !groupId;
  const items = needsGroup ? page.items.filter((entry) => !entry.parentValueId) : page.items;
  const waiting = catalog.loading || page.loading;
  const failure = catalog.failure || page.failure;
  const { setSearch } = page;
  useEffect(() => { if (autoFocus) searchRef.current?.focus({ preventScroll: true }); }, [autoFocus]);
  const empty = ru ? "Сбросить выбор" : "Clear selection";

  return <div className={styles.values} data-dimension={dimension}>
    <div className={styles.valueSearch} data-input-shell>
      <Input ref={searchRef} type="search" size="sm" aria-label={ru ? `Найти: ${labels[dimension]}` : `Find: ${labels[dimension]}`}
        classNames={{ base: styles.input, inputWrapper: styles.inputWrapper, innerWrapper: styles.inputInner }}
        startContent={<Search size={14} aria-hidden="true" />} placeholder={ru ? "Найти значение" : "Find a value"}
        value={page.search} onValueChange={setSearch} onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          const first = optionsRef.current?.querySelector<HTMLElement>('[role="option"]');
          if (first) { event.preventDefault(); first.focus(); }
        }} />
    </div>
    <Listbox ref={optionsRef} classNames={{ base: styles.options, list: styles.optionList }}
      itemClasses={{ base: styles.option, selectedIcon: styles.optionIcon }}
      aria-label={labels[dimension]} aria-busy={waiting} variant="light" hideEmptyContent selectionMode="single"
      disallowEmptySelection selectedKeys={value[dimension] ? [value[dimension].id] : []}
      onSelectionChange={(keys) => {
        if (keys === "all") return;
        const [key] = keys;
        if (key === clearKey) return onSelect(dimension, null);
        const entry = items.find((option) => option.id === key);
        if (entry) onSelect(dimension, { id: entry.id, label: entry.label });
      }}>
      {[...(value[dimension] ? [{ id: clearKey, label: empty }] : []), ...items].map((entry) =>
        <ListboxItem key={entry.id} textValue={entry.label} endContent={entry.id === clearKey ? <X size={14} aria-hidden="true" /> : undefined}>
          {entry.label}
        </ListboxItem>
      )}
    </Listbox>
    {waiting && !items.length && <div className={styles.pending} role="status" aria-label={ru ? "Загрузка…" : "Loading…"}>
      <Skeleton className={styles.skeleton} disableAnimation />
      <Skeleton className={styles.skeleton} disableAnimation />
    </div>}
    {!waiting && !failure && !items.length && <p className={styles.hint}>{needsGroup
      ? (ru ? "Выберите группу, чтобы увидеть её продукты." : "Choose a group to see its products.")
      : (ru ? "Значения не найдены." : "No values found.")}</p>}
    {Boolean(failure) && <p className={styles.hint} role="alert">{customFieldError(failure, ru)}{" "}
      <Button disableRipple variant="light" size="sm" className={styles.catalogAction} onPress={catalog.failure ? catalog.refresh : page.refresh}>{ru ? "Повторить" : "Retry"}</Button>
    </p>}
    {(!fieldId ? catalog.cursor : page.cursor) && <Button disableRipple variant="light" size="sm" className={styles.catalogAction}
      isDisabled={catalog.pending || page.pending} onPress={() => void (fieldId ? page.more() : catalog.more())}>
      {ru ? "Показать ещё" : "Load more"}
    </Button>}
  </div>;
}
