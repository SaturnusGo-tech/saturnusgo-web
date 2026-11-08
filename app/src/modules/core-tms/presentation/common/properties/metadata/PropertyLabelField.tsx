"use client";

import { Button, Chip, Input } from "@heroui/react";
import { Plus, Tag, X } from "lucide-react";
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
  const duplicate = labels.some((label) => label.toLowerCase() === text.toLowerCase());
  const limitReached = labels.length >= maxCount;
  const title = ru ? (tag ? "Теги" : "Метки") : tag ? "Tags" : "Labels";
  const canAdd = Boolean(text) && !duplicate && !limitReached && (isValid?.(text) ?? true);
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
    compact={compact} disabled={disabled} open={open} onOpenChange={setMenu}>
    <form className={styles.labelForm} onSubmit={(event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!canAdd) return;
      onAdd(text);
      setMenu(false);
    }}>
      <Input autoFocus size="sm" aria-label={placeholder}
        placeholder={ru ? (tag ? "Добавить теги…" : "Добавить метки…") : tag ? "Add tags…" : "Add labels…"} isDisabled={limitReached}
        classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, input: styles.searchInput }}
        maxLength={maxLength} value={value} onValueChange={(next) => setValue(next.replace(/[\u0000-\u001f\u007f]/g, ""))} />
      {(compact || tag) && <PropertyLabelTokens locale={locale} labels={labels} onRemove={onRemove} tag={tag} />}
      <Button size="sm" variant="light" className={styles.add} type="submit" isDisabled={!canAdd}
        aria-label={ru ? "Добавить" : "Add"}>
        <Plus size={14} aria-hidden="true" />{text ? (ru ? `Создать «${text}»` : `Create “${text}”`) : action}
      </Button>
    </form>
  </PropertyPopover>;
}
