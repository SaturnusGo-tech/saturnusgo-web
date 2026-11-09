"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { Button, Input, Listbox, ListboxItem } from "@heroui/react";
import { ArrowLeft, CalendarDays, Check, ChevronRight, Layers, Package } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MAX_EXACT_BUILD_LENGTH, type BoardFilter, type BoardFilterKey } from "./model/board-filters";
import dashboardStyles from "../../dashboard.module.css";
import styles from "./boardTools.module.css";

export const filterIcons = { period: CalendarDays, environment: Layers, build: Package };
const inputClasses = { base: styles.search, inputWrapper: styles.inputShell, input: styles.input };
const listClasses = { base: styles.listbox, list: styles.list, emptyContent: styles.empty };
const itemClasses = { base: styles.row, title: styles.title, selectedIcon: styles.check };

function matchText(label: string, query: string) {
  return label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

function focusOption(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const options = event.currentTarget.closest("[data-board-filter-overlay]")?.querySelectorAll<HTMLElement>("[role=option]");
  const option = event.key === "ArrowDown" ? options?.[0] : options?.[options.length - 1];
  if (!option) return;
  event.preventDefault();
  option.focus({ preventScroll: true });
}

export function BoardFilterValues({ filter, ru, focus, onChoose }: {
  filter: BoardFilter; ru: boolean; focus?: boolean; onChoose(value: string): void;
}) {
  const [query, setQuery] = useState("");
  const exact = query.trim();
  const showExact = filter.allowExact && exact && !filter.options.some(option => option.value === exact);
  const valueSearch = ru ? "Найти значение" : "Find a value";
  const options = filter.options.filter(option => matchText(option.label, query));
  const chooseOption = (key: unknown) => {
    if (typeof key === "string") onChoose(key.slice(1));
  };
  return <div className={styles.menu} onKeyDownCapture={event => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || !(event.target instanceof Element)) return;
    const option = event.target.closest<HTMLElement>("[data-board-filter-value]");
    if (!option) return;
    event.preventDefault();
    event.stopPropagation();
    chooseOption(option.dataset.boardFilterValue);
  }}>
    <Input autoFocus={focus} size="sm" variant="flat" aria-label={valueSearch}
      placeholder={ru ? "Фильтр…" : "Filter…"} value={query} maxLength={MAX_EXACT_BUILD_LENGTH}
      classNames={inputClasses} onValueChange={setQuery} onKeyDown={event => {
        focusOption(event);
        if (event.key === "Enter" && !event.nativeEvent.isComposing && showExact) {
          event.preventDefault();
          onChoose(exact);
        }
      }} />
    <Listbox aria-label={filter.label} variant="light" classNames={listClasses} itemClasses={itemClasses}
      selectionMode="single" disallowEmptySelection selectedKeys={[`:${filter.value}`]}
      emptyContent={ru ? "Ничего не найдено" : "No matches"}
      onSelectionChange={keys => { if (keys !== "all") chooseOption(keys.values().next().value); }}
      onAction={chooseOption}>
      {[...options, ...(showExact ? [{ value: exact, label: ru ? `Сборка «${exact}»` : `Build “${exact}”` }] : [])].map(option =>
        <ListboxItem key={`:${option.value}`} data-board-filter-value={`:${option.value}`}
          textValue={option.label}>{option.label}</ListboxItem>)}
    </Listbox>
  </div>;
}

export function BoardFilterCategories({ filters, ru, addLabel, onChoose }: {
  filters: BoardFilter[]; ru: boolean; addLabel: string; onChoose(key: BoardFilterKey, value: string): void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BoardFilterKey | null>(null);
  const [compact, setCompact] = useState(false);
  const list = useRef<HTMLElement>(null);
  const anchor = useRef<HTMLElement>(null!);
  const search = useRef<HTMLInputElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const active = filters.find(filter => filter.key === selected);
  const shown = filters.filter(filter => matchText(filter.label, query));

  useEffect(() => {
    const media = window.matchMedia("(max-width: 540px), (hover: none)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function openFilter(key: BoardFilterKey, row: HTMLElement | null, focus: boolean) {
    if (!row) return;
    anchor.current = row;
    setSelected(key);
    if (focus) requestAnimationFrame(() => side.current?.querySelector("input")?.focus({ preventScroll: true }));
  }
  function back() {
    setSelected(null);
    requestAnimationFrame(() => search.current?.focus({ preventScroll: true }));
  }
  function escape(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    back();
  }

  const values = active && <div ref={side} className={styles.menu} data-board-filter-overlay={active.key} onKeyDownCapture={escape}>
    {compact && <Button size="sm" variant="light" className={styles.back} onPress={back}>
      <ArrowLeft size={14} aria-hidden="true" />{active.label}
    </Button>}
    <BoardFilterValues key={active.key} filter={active} ru={ru} focus={compact} onChoose={value => onChoose(active.key, value)} />
  </div>;

  if (compact && values) return values;
  return <>
    <Input ref={search} autoFocus size="sm" variant="flat" aria-label={addLabel} placeholder={`${addLabel}…`}
      classNames={inputClasses} value={query} onKeyDown={focusOption}
      onValueChange={value => { setQuery(value); setSelected(null); }} />
    <Listbox ref={list} aria-label={ru ? "Типы фильтров" : "Filter categories"} variant="light"
      classNames={listClasses} itemClasses={itemClasses} emptyContent={ru ? "Ничего не найдено" : "No matches"}
      onAction={key => openFilter(key as BoardFilterKey, list.current?.querySelector<HTMLElement>(`[data-board-filter-type="${key}"]`) ?? null, true)}
      onKeyDown={event => {
        const row = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-board-filter-type]") : null;
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" || !row) return;
        event.preventDefault();
        openFilter(row.dataset.boardFilterType as BoardFilterKey, row, true);
      }}>
      {shown.map(filter => {
        const Icon = filterIcons[filter.key];
        return <ListboxItem key={filter.key} textValue={filter.label} data-board-filter-type={filter.key}
          data-current={filter.key === selected || undefined} aria-haspopup="dialog"
          onMouseEnter={event => { if (!compact) openFilter(filter.key, event.currentTarget, false); }}
          startContent={<Icon size={15} className={styles.icon} aria-hidden="true" />}
          endContent={<ChevronRight size={13} className={styles.chevron} aria-hidden="true" />}>
          {filter.label}
        </ListboxItem>;
      })}
    </Listbox>
    {active && <FreeSoloPopover key={active.key} isOpen disableAnimation disableDialogFocus triggerRef={anchor}
      dialogProps={{ "aria-label": active.label }} placement="left-start" offset={4} crossOffset={-36}
      containerPadding={8} shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false}
      isDismissable={false} isKeyboardDismissDisabled classNames={{ base: styles.positioner, content: `${styles.surface} ${dashboardStyles.popupEnter}` }}
      style={{ zIndex: 83 }}>
      {values}
    </FreeSoloPopover>}
  </>;
}
