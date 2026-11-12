"use client";
import { AnchoredPopover as Popover } from "../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";

import { Button, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { Layers, Package, SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { ProductDocTaxonomy } from "../../../domain/product-doc-taxonomy";
import type { ProductDocScope } from "../../../domain/product-docs";
import styles from "../taxonomy.module.css";
import { ProductDocTaxonomySelector, type TaxonomyDimension } from "./ProductDocTaxonomySelector";

type Props = {
  scope: ProductDocScope;
  value: ProductDocTaxonomy;
  onChange(value: ProductDocTaxonomy): void;
  filter?: boolean;
  disabled?: boolean;
};

export function ProductDocTaxonomyFields(props: Props) {
  const http = useOptionalTmsHttpClient();
  return http ? <TaxonomyFields {...props} key={`${props.scope.workspaceId}:${props.scope.projectId}`} /> : null;
}

function TaxonomyFields({ scope, value, onChange, filter = false, disabled = false }: Props) {
  const { locale } = useTmsLocale();
  const reducedMotion = useReducedMotion();
  const ru = locale === "ru";
  const filterButton = useRef<HTMLButtonElement>(null);
  const groupCrumb = useRef<HTMLButtonElement>(null);
  const productCrumb = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<TaxonomyDimension | "filter">();
  const [filterDimension, setFilterDimension] = useState<TaxonomyDimension>("productGroup");
  const copy = {
    productGroup: ru ? "Группа продуктов" : "Product group",
    product: ru ? "Продукт" : "Product",
    filters: ru ? "Фильтры поиска" : "Search filters",
    empty: ru ? "Выбрать" : "Select",
  };
  const selected = [value.productGroup?.label, value.product?.label].filter(Boolean).join(", ");

  function select(dimension: TaxonomyDimension, next: ProductDocTaxonomy[TaxonomyDimension]) {
    if (dimension === "productGroup") {
      if ((next?.id ?? null) !== (value.productGroup?.id ?? null)) onChange({ productGroup: next, product: null });
    } else onChange({ ...value, product: next });
    if (!filter) setOpen(undefined);
  }

  function picker(field: TaxonomyDimension | "filter") {
    const filtering = field === "filter";
    const dimension = filtering ? filterDimension : field;
    const label = filtering ? copy.filters : copy[dimension];
    const trigger = filtering ? filterButton : field === "productGroup" ? groupCrumb : productCrumb;
    return <Popover isOpen={open === field && !disabled}
      onOpenChange={(next) => setOpen((current) => next ? field : current === field ? undefined : current)}
      placement={filtering ? "bottom-end" : "bottom-start"} offset={7} containerPadding={12}
      disableAnimation={Boolean(reducedMotion)}
      shouldBlockScroll={false} shouldCloseOnScroll={false}
      classNames={{ base: filtering ? `${styles.popover} ${styles.searchPopover}` : `${styles.popover} ${styles.propertyPopover}`, content: styles.panel }}>
      {filtering ? <PopoverTrigger>
        <Button ref={filterButton} isIconOnly variant="light" size="sm" className={styles.filterTrigger} aria-label={label}
          aria-description={selected || undefined} data-filtered={Boolean(selected) || undefined}>
          <SlidersHorizontal size={16} aria-hidden="true" />
        </Button>
      </PopoverTrigger> : <PopoverTrigger>
        <Button ref={trigger} variant="light" size="sm" isDisabled={disabled} className={styles.valueAction}
          aria-label={`${label}, ${value[dimension]?.label ?? copy.empty}`}>
          {dimension === "productGroup" ? <Layers size={15} aria-hidden="true" /> : <Package size={15} aria-hidden="true" />}
          <span data-unset={!value[dimension] || undefined}>{value[dimension]?.label ?? label}</span>
        </Button>
      </PopoverTrigger>}
      <PopoverContent aria-label={label} onKeyDownCapture={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(undefined);
        requestAnimationFrame(() => {
          const control = trigger.current;
          control?.focus({ preventScroll: true });
        });
      }}>
        <ProductDocTaxonomySelector scope={scope} dimension={dimension} filter={filtering}
          value={value} labels={copy} onDimension={setFilterDimension} onSelect={select} />
      </PopoverContent>
    </Popover>;
  }

  return filter ? <div className={styles.filter}>{picker("filter")}</div>
    : <div className={styles.draftFields} aria-label={ru ? "Классификация статьи" : "Article classification"}>
      {picker("productGroup")}
      {picker("product")}
    </div>;
}
