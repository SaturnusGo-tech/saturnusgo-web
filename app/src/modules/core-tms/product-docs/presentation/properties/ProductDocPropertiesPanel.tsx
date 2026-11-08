"use client";

import { Box, Circle, CircleCheck, Clock3, Layers, Package } from "lucide-react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import type { ProductDocScope } from "../../domain/product-docs";
import { emptyProductDocProperties, type ProductDocProperties } from "../../domain/properties/product-doc-properties";
import { ProductDocTaxonomyFields } from "../taxonomy/control/ProductDocTaxonomyFields";
import { ProductDocAssigneeField } from "./controls/ProductDocAssigneeField";
import { ProductDocLabelField, ProductDocLabelTokens } from "./controls/ProductDocLabelField";
import { ProductDocPriorityField } from "./priority/ProductDocPriorityField";
import styles from "./product-doc-properties.module.css";

export function ProductDocPropertiesPanel({
  scope, locale, projectName, status, value = emptyProductDocProperties, taxonomy, onChange, onTaxonomy, disabled,
}: {
  scope: ProductDocScope;
  locale: TmsLocale;
  projectName: string;
  status: "draft" | "published" | "archived" | "revision";
  value?: ProductDocProperties;
  taxonomy: ProductDocTaxonomy;
  onChange?(value: ProductDocProperties): void;
  onTaxonomy?(value: ProductDocTaxonomy): void;
  disabled?: boolean;
}) {
  const ru = locale === "ru";
  const statusName = {
    draft: ru ? "Черновик" : "Draft",
    published: ru ? "Опубликовано" : "Published",
    archived: ru ? "В архиве" : "Archived",
    revision: ru ? "Прошлая версия" : "Earlier version",
  }[status];
  const StatusIcon = status === "published" ? CircleCheck : status === "draft" ? Circle : Clock3;
  return <div className={styles.panel} data-doc-property-panel>
    <section aria-label={ru ? "Свойства статьи" : "Article properties"}>
      <h2>{ru ? "Свойства" : "Properties"}</h2>
      <div className={styles.value} data-status={status}><StatusIcon size={15} aria-hidden="true" /><span>{statusName}</span></div>
      <ProductDocAssigneeField scope={scope} locale={locale} value={value.assignee}
        onChange={onChange && ((assignee) => onChange({ ...value, assignee }))} disabled={disabled} />
      <ProductDocPriorityField locale={locale} value={value.priority} disabled={disabled}
        onChange={onChange && ((priority) => onChange({ ...value, priority }))} />
    </section>
    <section aria-label={ru ? "Метки статьи" : "Article labels"}>
      <h2>{ru ? "Метки" : "Labels"}</h2>
      <ProductDocLabelTokens locale={locale} labels={value.labels}
        onRemove={onChange && !disabled ? (label) => onChange({ ...value, labels: value.labels.filter((item) => item !== label) }) : undefined} />
      {!onChange && !value.labels.length && <span className={styles.empty}>{ru ? "Без меток" : "No labels"}</span>}
      {onChange && <ProductDocLabelField locale={locale} labels={value.labels} disabled={disabled}
        onAdd={(label) => onChange({ ...value, labels: [...value.labels, label] })} />}
    </section>
    <section aria-label={ru ? "Классификация статьи" : "Article classification"}>
      <h2>{ru ? "Проект" : "Project"}</h2>
      <div className={styles.value}><Box size={15} aria-hidden="true" /><span>{projectName}</span></div>
      {onTaxonomy ? <ProductDocTaxonomyFields scope={scope} value={taxonomy} onChange={onTaxonomy} disabled={disabled} />
        : <>
          {taxonomy.productGroup && <div className={styles.value} aria-label={ru ? "Группа продуктов" : "Product group"}>
            <Layers size={15} aria-hidden="true" /><span>{taxonomy.productGroup.label}</span>
          </div>}
          {taxonomy.product && <div className={styles.value} aria-label={ru ? "Продукт" : "Product"}>
            <Package size={15} aria-hidden="true" /><span>{taxonomy.product.label}</span>
          </div>}
        </>}
    </section>
  </div>;
}
