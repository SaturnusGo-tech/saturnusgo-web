"use client";

import { Button, Chip, Input, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { Plus, Tag, X } from "lucide-react";
import { useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "../product-doc-properties.module.css";

export function ProductDocLabelTokens({ locale, labels, onRemove }: {
  locale: TmsLocale;
  labels: readonly string[];
  onRemove?(label: string): void;
}) {
  return <div className={styles.labels}>
    {labels.map((label) => <Chip key={label} size="sm" classNames={{ base: styles.chip, content: styles.chipContent }}
      startContent={<span className={styles.labelDot} aria-hidden="true" />}
      endContent={onRemove && <Button type="button" isIconOnly variant="light" size="sm" disableRipple className={styles.labelRemove}
        aria-label={locale === "ru" ? `Убрать метку «${label}»` : `Remove ${label}`} onPress={() => onRemove(label)}>
        <X size={11} aria-hidden="true" />
      </Button>}>
      {label}
    </Chip>)}
  </div>;
}

export function ProductDocLabelField({ locale, labels, disabled, compact, onAdd, onRemove }: {
  locale: TmsLocale;
  labels: readonly string[];
  disabled?: boolean;
  compact?: boolean;
  onAdd(label: string): void;
  onRemove?(label: string): void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const ru = locale === "ru";
  const action = ru ? "Добавить метку" : "Add label";
  const placeholder = ru ? "Название метки" : "Label name";
  const text = value.trim();
  const duplicate = labels.some((label) => label.toLowerCase() === text.toLowerCase());
  const limitReached = labels.length >= 12;
  const compactTitle = ru ? "Метки" : "Labels";
  if (limitReached && !compact) return null;
  return <Popover placement="bottom-start" offset={4} isOpen={open && !disabled} onOpenChange={(next) => {
    setOpen(next);
    if (!next) setValue("");
  }} classNames={{ base: styles.positioner, content: styles.popover }}>
    <PopoverTrigger><Button type="button" variant="light" className={styles.trigger} isDisabled={disabled} data-compact={compact || undefined}
      aria-label={compact ? compactTitle : action} aria-description={compact && labels.length ? labels.join(", ") : undefined}>
      <Tag size={15} aria-hidden="true" /><span>{compact ? (labels[0] ?? compactTitle) : action}</span>
      {compact && labels.length > 1 && <span className={styles.count} aria-hidden="true">+{labels.length - 1}</span>}
    </Button></PopoverTrigger>
    <PopoverContent aria-label={action}>
      <form className={styles.labelForm} onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!text || duplicate || limitReached) return;
        onAdd(text);
        setOpen(false);
        setValue("");
      }}>
        <Input autoFocus size="sm" aria-label={placeholder} placeholder={ru ? "Добавить метки…" : "Add labels…"} isDisabled={limitReached}
          classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, input: styles.searchInput }}
          maxLength={48} value={value} onValueChange={(next) => setValue(next.replace(/[\u0000-\u001f\u007f]/g, ""))} />
        {compact && <ProductDocLabelTokens locale={locale} labels={labels} onRemove={onRemove} />}
        <Button size="sm" variant="light" className={styles.add} type="submit" isDisabled={!text || duplicate || limitReached}
          aria-label={ru ? "Добавить" : "Add"}>
          <Plus size={14} aria-hidden="true" />{text ? (ru ? `Создать «${text}»` : `Create “${text}”`) : action}
        </Button>
      </form>
    </PopoverContent>
  </Popover>;
}
