"use client";

import { Button, Input, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger, type PopoverProps } from "@heroui/react";
import { Check } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "../property-controls.module.css";

type ValueProps = {
  label: string;
  children: ReactNode;
  compact?: boolean;
  disabled?: boolean;
  onEdit?: () => void;
};

export function PropertyValue({ label, children, compact, disabled, onEdit }: ValueProps) {
  const attributes = { "aria-label": label, "data-compact": compact || undefined };
  return onEdit ? <Button type="button" variant="light" className={styles.trigger}
    isDisabled={disabled} onPress={onEdit} {...attributes}>{children}</Button>
    : <div className={styles.value} {...attributes}>{children}</div>;
}

export function PropertyPopover({
  label, triggerLabel, trigger, open, onOpenChange, compact, disabled, autoFocus, invalid, errorId, children, onMenuKeyDown,
  placement = "bottom-start", narrow, portalContainer, menuClassName,
}: {
  label: string;
  triggerLabel?: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange(value: boolean): void;
  compact?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  errorId?: string;
  children: ReactNode;
  onMenuKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  placement?: PopoverProps["placement"];
  narrow?: boolean;
  portalContainer?: HTMLElement;
  menuClassName?: string;
}) {
  const button = useRef<HTMLButtonElement>(null);
  // HeroUI’s retained exit can flash at full opacity just before unmounting.
  return <Popover disableAnimation placement={placement} offset={4} isOpen={open && !disabled} onOpenChange={onOpenChange}
    shouldBlockScroll={false} portalContainer={portalContainer} classNames={{ base: styles.positioner, content: [styles.popover, narrow && styles.narrowMenu, menuClassName].filter(Boolean).join(" ") }}>
    <PopoverTrigger><Button ref={button} type="button" variant="light" className={styles.trigger}
      autoFocus={autoFocus} isDisabled={disabled} data-compact={compact || undefined} aria-label={triggerLabel ?? label}
      aria-invalid={invalid || undefined} aria-describedby={errorId}>{trigger}</Button></PopoverTrigger>
    <PopoverContent aria-label={label} onKeyDownCapture={(event) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
        requestAnimationFrame(() => button.current?.focus({ preventScroll: true }));
      } else onMenuKeyDown?.(event);
    }}>{children}</PopoverContent>
  </Popover>;
}

export function PropertySearch({ label, value, onChange, disabled, maxLength }: {
  label: string; value: string; onChange(value: string): void; disabled?: boolean; maxLength?: number;
}) {
  return <Input autoFocus size="sm" aria-label={label} placeholder={label} value={value} onValueChange={onChange}
    isDisabled={disabled} maxLength={maxLength} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const options = event.currentTarget.closest("[role=dialog]")?.querySelectorAll<HTMLElement>('[role=option]:not([aria-disabled=true])');
      if (!options?.length) return;
      event.preventDefault();
      options[event.key === "ArrowDown" ? 0 : options.length - 1]?.focus();
    }}
    classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, input: styles.searchInput }} />;
}

export type PropertyOption<K extends string> = { value: K; label: string; icon?: ReactNode; shortcut?: string };

export function PropertySelect<K extends string>({
  locale, label, searchLabel, value, options, onChange, disabled, compact, autoFocus, autoOpen, onRequestEdit, displayValue, triggerLabel, menuClassName,
}: {
  locale: TmsLocale;
  label: string;
  searchLabel: string;
  value: K;
  options: readonly PropertyOption<K>[];
  onChange?(value: K): void;
  disabled?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
  autoOpen?: boolean;
  onRequestEdit?: () => void;
  displayValue?: ReactNode;
  triggerLabel?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const interactive = Boolean(onChange) && !disabled;
  useEffect(() => {
    if (!interactive) {
      setOpen(false);
      setQuery("");
    } else if (autoOpen) setOpen(true);
  }, [autoOpen, interactive]);
  const selected = options.find((option) => option.value === value);
  const name = triggerLabel ?? (selected ? `${label}, ${selected.label}` : label);
  const trigger = displayValue ?? <>{selected?.icon}<span>{selected?.label}</span></>;
  if (!onChange) return <PropertyValue label={name} compact={compact} disabled={disabled} onEdit={onRequestEdit}>{trigger}</PropertyValue>;

  function setMenu(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const choose = (next: K) => {
    onChange(next);
    setMenu(false);
  };
  const search = query.trim().toLocaleLowerCase(locale);
  return <PropertyPopover label={label} triggerLabel={name} trigger={trigger} compact={compact} disabled={disabled}
    autoFocus={autoFocus} open={open} onOpenChange={setMenu} menuClassName={menuClassName} onMenuKeyDown={(event) => {
      if (query || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const match = options.find((option) => option.shortcut === event.key);
      if (!match) return;
      event.preventDefault();
      event.stopPropagation();
      choose(match.value);
    }}>
    <PropertySearch label={searchLabel} value={query} onChange={setQuery} />
    <Listbox aria-label={label} classNames={{ base: styles.list, list: styles.options }}
      selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys={[value]}
      emptyContent={locale === "ru" ? "Ничего не найдено" : "No results"}
      itemClasses={{ base: styles.option, title: styles.optionTitle }}>
      {options.filter((option) => option.label.toLocaleLowerCase(locale).includes(search)).map((option) =>
        <ListboxItem key={option.value} textValue={option.label} startContent={option.icon} onPress={() => choose(option.value)} endContent={<span className={styles.optionEnd}>
          {option.value === value && <Check className={styles.selectedIcon} size={14} aria-hidden="true" />}
          {option.shortcut && <span className={styles.menuShortcut} aria-hidden="true">{option.shortcut}</span>}
        </span>}>{option.label}</ListboxItem>)}
    </Listbox>
  </PropertyPopover>;
}
