"use client";

import { FreeSoloPopover } from "@heroui/popover";
import { Button } from "@heroui/react";
import { Filter, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DashboardModel } from "../model/useDashboardModel";
import { BoardFilterCategories, BoardFilterValues, filterIcons } from "./DashboardFilterOptions";
import { useBoardFilters, type BoardFilterKey } from "./model/board-filters";
import dashboardStyles from "../../dashboard.module.css";
import styles from "./boardTools.module.css";

type OpenFilter = "add" | BoardFilterKey;

export function DashboardBoardTools({ model }: { model: DashboardModel }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const { filters, setFilter } = useBoardFilters(model);
  const [open, setOpen] = useState<OpenFilter | null>(null);
  const anchor = useRef<HTMLElement>(null!);
  const filterButton = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = filters.filter(filter => filter.value !== filter.defaultValue);
  const editing = filters.find(filter => filter.key === open);
  const filterLabel = ru ? "Фильтр" : "Filter";
  const addLabel = ru ? "Добавить фильтр" : "Add filter";

  const close = () => setOpen(null);
  const closeAndFocus = (target = anchor.current) => {
    close();
    requestAnimationFrame(() => {
      const next = target?.isConnected ? target : filterButton.current;
      next?.focus({ preventScroll: true });
    });
  };
  function toggle(target: OpenFilter, trigger: Element) {
    if (!(trigger instanceof HTMLElement)) return;
    anchor.current = trigger;
    setOpen(current => current === target ? null : target);
  }
  function choose(key: BoardFilterKey, value: string) {
    setFilter(key, value);
    closeAndFocus();
  }
  function onEscape(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.nativeEvent.isComposing || event.defaultPrevented) return;
    if (!(event.target instanceof Element) || event.target.closest("[data-board-filter-overlay]") !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    closeAndFocus();
  }

  return <div className={styles.bar} data-board-filter-bar>
    {active.map(filter => {
      const Icon = filterIcons[filter.key];
      const name = filter.options.find(option => option.value === filter.value)?.label ?? filter.value;
      return <div key={filter.key} className={styles.chip} data-board-filter-chip={filter.key}>
        <span className={styles.chipLabel}><Icon size={13} aria-hidden="true" />{filter.label}</span>
        <Button size="sm" variant="light" className={styles.chipValue} aria-haspopup="dialog"
          aria-controls={open === filter.key ? menuId : undefined} aria-expanded={open === filter.key}
          onPress={event => toggle(filter.key, event.target)}>{name}</Button>
        <Button isIconOnly size="sm" variant="light" className={styles.remove}
          aria-label={ru ? `Снять фильтр: ${filter.label}` : `Remove filter: ${filter.label}`}
          onPress={event => {
            setFilter(filter.key, filter.defaultValue);
            if (event.pointerType === "keyboard") closeAndFocus(filterButton.current ?? anchor.current);
            else close();
          }}>
          <X size={13} aria-hidden="true" />
        </Button>
      </div>;
    })}
    <Button ref={filterButton} size="sm" variant="light" className={styles.filter} aria-label={filterLabel} aria-haspopup="dialog"
      aria-controls={open === "add" ? menuId : undefined} aria-expanded={open === "add"}
      onPress={event => toggle("add", event.target)}>
      <Filter size={14} aria-hidden="true" />{active.length ? null : filterLabel}
    </Button>
    {open && <FreeSoloPopover isOpen disableAnimation triggerRef={anchor} placement="bottom-start" offset={6} containerPadding={8}
      shouldCloseOnBlur={false} shouldCloseOnScroll={false} shouldBlockScroll={false} isKeyboardDismissDisabled
      onOpenChange={isOpen => { if (!isOpen) close(); }}
      shouldCloseOnInteractOutside={target => !target.closest("[data-board-filter-bar], [data-board-filter-overlay]")}
      dialogProps={{ "aria-label": editing?.label ?? addLabel }}
      classNames={{ base: styles.positioner, content: `${styles.surface} ${dashboardStyles.popupEnter}` }} style={{ zIndex: 82 }}>
      <div id={menuId} className={styles.menu} data-board-filter-overlay={open} onKeyDownCapture={onEscape}>
        {editing ? <BoardFilterValues key={editing.key} filter={editing} ru={ru} focus
          onChoose={value => choose(editing.key, value)} />
          : <BoardFilterCategories filters={filters} ru={ru} addLabel={addLabel} onChoose={choose} />}
      </div>
    </FreeSoloPopover>}
  </div>;
}
