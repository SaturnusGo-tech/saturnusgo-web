"use client";

import { Button, Input, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { ChartNoAxesColumnIncreasing, Check, CircleAlert, Minus } from "lucide-react";
import { useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocProperties } from "../../../domain/properties/product-doc-properties";
import styles from "../product-doc-properties.module.css";

const priorityLevels = [
  { key: "none", en: "No priority", ru: "Без приоритета" },
  { key: "critical", en: "Urgent", ru: "Срочный" },
  { key: "high", en: "High", ru: "Высокий" },
  { key: "medium", en: "Medium", ru: "Средний" },
  { key: "low", en: "Low", ru: "Низкий" },
] as const;

function PriorityIcon({ level }: { level: (typeof priorityLevels)[number]["key"] }) {
  if (level === "none") return <Minus size={15} aria-hidden="true" />;
  if (level === "critical") return <CircleAlert size={15} aria-hidden="true" />;
  return <ChartNoAxesColumnIncreasing size={15} strokeWidth={3.3} className={styles.prioritySignal}
    data-level={level} aria-hidden="true" />;
}

export function ProductDocPriorityField({ locale, value, onChange, disabled, compact }: {
  locale: TmsLocale;
  value: ProductDocProperties["priority"];
  onChange?(value: ProductDocProperties["priority"]): void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const label = locale === "ru" ? "Приоритет" : "Priority";
  const search = locale === "ru" ? "Изменить приоритет…" : "Change priority to…";
  const priority = priorityLevels.find((item) => item.key === value) ?? priorityLevels[0];
  const current = <><PriorityIcon level={priority.key} /><span>{priority[locale]}</span></>;
  const name = `${label}, ${priority[locale]}`;
  if (!onChange) return <div className={styles.value} data-compact={compact || undefined} aria-label={name}>{current}</div>;

  function setMenu(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  return <Popover placement="bottom-start" offset={4} isOpen={open && !disabled} onOpenChange={setMenu}
    classNames={{ base: styles.positioner, content: styles.popover }}>
    <PopoverTrigger><Button type="button" variant="light" className={styles.trigger} isDisabled={disabled}
      data-compact={compact || undefined} aria-label={name}>{current}</Button></PopoverTrigger>
    <PopoverContent aria-label={label}>
      <Input autoFocus size="sm" aria-label={search} placeholder={search} value={query} onValueChange={setQuery}
        classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, input: styles.searchInput }} />
      <Listbox aria-label={label} classNames={{ base: styles.list, list: styles.options }}
        selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys={[priority.key]}
        emptyContent={locale === "ru" ? "Ничего не найдено" : "No results"}
        itemClasses={{ base: styles.option, title: styles.optionTitle }}
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const [key] = keys;
          const option = priorityLevels.find((item) => item.key === key);
          if (!option) return;
          onChange(option.key === "none" ? null : option.key);
          setMenu(false);
        }}>
        {priorityLevels.filter((item) => item[locale].toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)))
          .map(({ key, ...labels }) => <ListboxItem key={key} startContent={<PriorityIcon level={key} />}
            endContent={key === priority.key ? <Check className={styles.selectedIcon} size={14} aria-hidden="true" /> : undefined}>
            {labels[locale]}
          </ListboxItem>)}
      </Listbox>
    </PopoverContent>
  </Popover>;
}
