"use client";

import { Button, Input, Textarea } from "@heroui/react";
import { Box, Circle } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { ProductDocScope } from "../../../domain/product-docs";
import { emptyProductDocProperties, productDocPropertiesInput, type ProductDocPropertiesInput } from "../../../domain/properties/product-doc-properties";
import type { ProductDocsCopy } from "../../../localization/copy";
import { ProductDocAssigneeField } from "../../properties/controls/ProductDocAssigneeField";
import { ProductDocLabelField } from "../../properties/controls/ProductDocLabelField";
import { ProductDocPriorityField } from "../../properties/priority/ProductDocPriorityField";
import styles from "./subpage-composer.module.css";

export interface ProductDocSubpageInput {
  title: string;
  description?: string;
  properties?: ProductDocPropertiesInput;
}

export function ProductDocSubpageComposer({ id, scope, projectName, copy, disabled, onCancel, onCreate }: {
  id: string;
  scope: ProductDocScope;
  projectName?: string;
  copy: ProductDocsCopy;
  disabled: boolean;
  onCancel(): void;
  onCreate(input: ProductDocSubpageInput): void;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState(emptyProductDocProperties);
  const fieldSlots = { base: styles.field, inputWrapper: styles.fieldWrapper, input: styles.fieldInput };
  const detail = description.trim();
  const hasProperties = properties.priority || properties.assignee || properties.labels.length > 0;

  return <form id={id} className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    if (!title.trim() || disabled) return;
    onCreate({
      title: title.trim(),
      description: detail ? description : undefined,
      properties: hasProperties ? productDocPropertiesInput(properties) : undefined,
    });
  }} onKeyDown={(event) => {
    if (event.defaultPrevented || event.key !== "Escape" || disabled || !(event.target instanceof Node)
      || !event.currentTarget.contains(event.target) || event.currentTarget.querySelector('[aria-expanded="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  }}>
    <div className={styles.title}>
      <Circle size={14} aria-label={ru ? "Черновик" : "Draft"} role="img" />
      <Input autoFocus data-inline-title type="text" size="sm" aria-label={copy.name}
        placeholder={ru ? "Название подстраницы" : "Subpage title"} value={title}
        onValueChange={setTitle} maxLength={200} isDisabled={disabled} classNames={fieldSlots} />
    </div>
    <Textarea data-inline-title minRows={1} maxRows={5} maxLength={32768} aria-label={ru ? "Описание" : "Description"}
      placeholder={ru ? "Добавить описание…" : "Add description…"} value={description} onValueChange={setDescription}
      isDisabled={disabled} classNames={fieldSlots} />
    <div className={styles.footer}>
      <div className={styles.properties} role="group" aria-label={ru ? "Свойства подстраницы" : "Subpage properties"}>
        {projectName && <span className={styles.project} title={projectName}><Box size={13} aria-hidden="true" /><span>{projectName}</span></span>}
        <ProductDocPriorityField compact locale={locale} value={properties.priority} disabled={disabled}
          onChange={(priority) => setProperties((current) => ({ ...current, priority }))} />
        <ProductDocAssigneeField compact scope={scope} locale={locale} value={properties.assignee} disabled={disabled}
          onChange={(assignee) => setProperties((current) => ({ ...current, assignee }))} />
        <ProductDocLabelField compact locale={locale} labels={properties.labels} disabled={disabled}
          onAdd={(label) => setProperties((current) => ({ ...current, labels: [...current.labels, label] }))}
          onRemove={(label) => setProperties((current) => ({ ...current, labels: current.labels.filter((item) => item !== label) }))} />
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="light" size="sm" disableRipple className={styles.cancel} isDisabled={disabled} onPress={onCancel}>
          {copy.cancel}
        </Button>
        <Button type="submit" variant="light" size="sm" disableRipple className={styles.create} isDisabled={disabled || !title.trim()}
          isLoading={disabled}>{copy.new}</Button>
      </div>
    </div>
  </form>;
}
