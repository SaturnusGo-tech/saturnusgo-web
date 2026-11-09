"use client";

import { Button, Chip, Input, Listbox, ListboxItem, ListboxSection } from "@heroui/react";
import { Check, Plus, Tag, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { PropertyPopover, PropertyValue } from "../select/PropertySelect";
import styles from "../property-controls.module.css";

export function PropertyLabelTokens({ locale, labels, onRemove, tag }: {
  locale: TmsLocale;
  labels: readonly string[];
  onRemove?(label: string): void;
  tag?: boolean;
}) {
  return <span className={styles.labels}>
    {labels.map((label) => <Chip key={label} size="sm" classNames={{ base: styles.chip, content: styles.chipContent }}
      startContent={<span className={styles.labelDot} aria-hidden="true" />}
      endContent={onRemove && <Button type="button" isIconOnly variant="light" size="sm" disableRipple className={styles.labelRemove}
        aria-label={locale === "ru" ? `Убрать ${tag ? "тег" : "метку"} «${label}»` : `Remove ${label}`} onPress={() => onRemove(label)}>
        <X size={11} aria-hidden="true" />
      </Button>}>
      {label}
    </Chip>)}
  </span>;
}

export function PropertyLabelField({
  locale, labels, disabled, compact, onAdd, onRemove, onRequestEdit, autoOpen, tag, maxLength = 48, maxCount = 12, isValid, displayValue,
  suggestions = [],
}: {
  locale: TmsLocale;
  labels: readonly string[];
  disabled?: boolean;
  compact?: boolean;
  onAdd?(label: string): void;
  onRequestEdit?(): void;
  autoOpen?: boolean;
  tag?: boolean;
  maxLength?: number;
  maxCount?: number;
  isValid?(label: string): boolean;
  suggestions?: readonly string[];
  displayValue?: ReactNode;
  onRemove?(label: string): void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const ru = locale === "ru";
  const interactive = Boolean(onAdd) && !disabled;
  useEffect(() => {
    if (!interactive) {
      setOpen(false);
      setValue("");
    } else if (autoOpen) setOpen(true);
  }, [autoOpen, interactive]);
  const action = ru ? (tag ? "Добавить тег" : "Добавить метку") : tag ? "Add tag" : "Add label";
  const placeholder = ru ? (tag ? "Название тега" : "Название метки") : tag ? "Tag name" : "Label name";
  const text = value.trim();
  const normalized = text.toLocaleLowerCase(locale);
  const available = tag ? [...new Set([...labels, ...suggestions])]
    .filter((label) => label.toLocaleLowerCase(locale).includes(normalized)) : [];
  const duplicate = labels.some((label) => label.toLowerCase() === text.toLowerCase());
  const limitReached = labels.length >= maxCount;
  const title = ru ? (tag ? "Теги" : "Метки") : tag ? "Tags" : "Labels";
  const canAdd = Boolean(text) && !duplicate && !limitReached && (isValid?.(text) ?? true);
  const exactTag = available.find((label) => label.toLocaleLowerCase(locale) === normalized);
  const triggerLabel = compact || displayValue ? title : action;
  const trigger = displayValue ?? <><Tag size={15} aria-hidden="true" /><span>{compact ? (labels[0] ?? title) : action}</span>
    {compact && labels.length > 1 && <span className={styles.count} aria-hidden="true">+{labels.length - 1}</span>}</>;
  if (!onAdd) return <PropertyValue label={triggerLabel} compact={compact} onEdit={onRequestEdit} disabled={disabled}>{trigger}</PropertyValue>;
  if (limitReached && !compact && !onRemove) return null;
  function setMenu(next: boolean) {
    setOpen(next);
    if (!next) setValue("");
  }
  return <PropertyPopover label={action} triggerLabel={triggerLabel} trigger={trigger}
    compact={compact} disabled={disabled} open={open} onOpenChange={setMenu}
    placement={tag ? "left-start" : undefined} narrow={tag}>
    <form className={styles.labelForm} onSubmit={(event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!canAdd) return;
      onAdd(exactTag ?? text);
      setMenu(false);
    }}>
      <Input autoFocus size="sm" aria-label={placeholder}
        placeholder={ru ? (tag ? "Добавить теги…" : "Добавить метки…") : tag ? "Add tags…" : "Add labels…"} isDisabled={limitReached}
        classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, input: styles.searchInput }}
        maxLength={maxLength} value={value} onValueChange={(next) => setValue(next.replace(/[\u0000-\u001f\u007f]/g, ""))} />
      {tag && available.length > 0 && <Listbox aria-label={title} classNames={{ base: styles.list, list: styles.options }}
        itemClasses={{ base: styles.option, title: styles.optionTitle }} selectionMode="multiple" selectedKeys={labels}
        disabledKeys={limitReached ? available.filter((label) => !labels.includes(label)) : []} hideSelectedIcon>
        <ListboxSection title={ru ? "Теги проекта" : "Project tags"} classNames={{ heading: styles.optionSection }}>
          {available.map((label) => <ListboxItem key={label} textValue={label}
            startContent={<span className={styles.labelDot} aria-hidden="true" />}
            endContent={labels.includes(label) ? <Check className={styles.selectedIcon} size={14} aria-hidden="true" /> : undefined}
            onPress={() => labels.includes(label) ? onRemove?.(label) : onAdd(label)}>
            {label}
          </ListboxItem>)}
        </ListboxSection>
      </Listbox>}
      {compact && !tag && <PropertyLabelTokens locale={locale} labels={labels} onRemove={onRemove} />}
      {(!tag || canAdd && !exactTag) && <Button size="sm" variant="light" className={styles.add} type="submit" isDisabled={!canAdd}
        aria-label={ru ? "Добавить" : "Add"}>
        <Plus size={14} aria-hidden="true" />{text ? (ru ? `Создать «${text}»` : `Create “${text}”`) : action}
      </Button>}
    </form>
  </PropertyPopover>;
}
