import { FreeSoloPopover } from "@heroui/popover";
import { Button, Input, Listbox, ListboxItem, PopoverContent, Switch } from "@heroui/react";
import { Archive, Check, ChevronRight } from "lucide-react";
import { useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import type { CaseFilters } from "../../../../../state/types/workspace";
import css from "./repository-filter-picker.module.css";

type Category = { id: string; label: string; icon: ReactNode; active: boolean; summary: string };
export type RepositoryFilterValue = { value: string; label: string; icon?: ReactNode; selected: boolean };

function focusFirst(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const options = event.currentTarget.closest("[data-repository-filter], [data-filter-value-panel]")?.querySelectorAll<HTMLElement>("[role='option']");
  if (!options?.length) return;
  event.preventDefault();
  options[event.key === "ArrowDown" ? 0 : options.length - 1]?.focus();
}

export function RepositoryFilterPicker({
  ru, panelId = "case-filter-panel", layer = 81, portalContainer, categories, section, categorySearch, search, filters, hasActive, trigger, extra, values, multiple,
  onCategorySearch, onSearch, openSection, onClose, onReset, onArchived, onTag, onChoose,
}: {
  ru: boolean;
  panelId?: string;
  layer?: number;
  portalContainer?: HTMLElement;
  categories: Category[];
  section: string;
  categorySearch: string;
  search: string;
  filters: CaseFilters;
  hasActive: boolean;
  trigger: RefObject<HTMLButtonElement>;
  extra: ReactNode;
  values: RepositoryFilterValue[];
  multiple: boolean;
  onCategorySearch(value: string): void;
  onSearch(value: string): void;
  openSection(section: string): void;
  onClose(): void;
  onReset(): void;
  onArchived(value: boolean): void;
  onTag(value: string): void;
  onChoose(value: string): void;
}) {
  const optionsId = useId();
  const categoryInput = useRef<HTMLInputElement>(null);
  const categoryList = useRef<HTMLElement>(null);
  const optionPanel = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement>(null!);
  const current = categories.find(item => item.id === section);
  const filterLabel = ru ? "Фильтры" : "Filters";
  const optionSearchLabel = ru ? "Фильтр по значению" : "Filter values";
  const fieldClasses = { base: css.search, inputWrapper: css.inputWrapper, input: css.input };
  const listClasses = { base: css.listbox, list: css.list, emptyContent: css.empty };
  const itemClasses = { base: css.row, title: css.title, wrapper: css.itemContent, selectedIcon: css.check };

  function activate(id: string, row: Element | null | undefined) {
    if (row && row instanceof HTMLElement) anchor.current = row;
    openSection(id);
  }
  function focusOptions() {
    requestAnimationFrame(() => optionPanel.current?.querySelector<HTMLElement>("input, [role='option']")?.focus({ preventScroll: true }));
  }
  function closeOptions() {
    openSection("");
    categoryInput.current?.focus({ preventScroll: true });
  }

  return <PopoverContent id={panelId} aria-label={filterLabel} data-testid="case-filters" data-repository-filter data-case-popover-root
      onKeyDownCapture={event => {
        if (event.key !== "Escape" || event.nativeEvent.isComposing
          || event.target instanceof Element && event.target.closest("[data-filter-value-panel]")) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
        trigger.current?.focus({ preventScroll: true });
      }}>
      <Input ref={categoryInput} autoFocus size="sm" variant="flat" aria-label={ru ? "Добавить фильтр" : "Add filter"}
        placeholder={ru ? "Добавить фильтр…" : "Add filter…"} value={categorySearch} data-input-shell
        classNames={fieldClasses} onValueChange={onCategorySearch} onKeyDown={focusFirst} />
      <Listbox ref={categoryList} aria-label={ru ? "Параметры фильтра" : "Filter categories"} variant="light" disableAnimation
        classNames={listClasses} itemClasses={itemClasses}
        emptyContent={ru ? "Ничего не найдено" : "No filters found"} onAction={key => {
          const id = String(key);
          activate(id, categoryList.current?.querySelector<HTMLElement>(`[data-filter-section="${id}"]`));
          focusOptions();
        }}
        onKeyDown={event => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          focusOptions();
        }}>
        {categories.map(item => <ListboxItem key={item.id} textValue={item.label} data-filter-section={item.id}
          data-current={section === item.id || undefined}
          aria-haspopup="dialog" aria-controls={section === item.id ? optionsId : undefined}
          onMouseEnter={event => activate(item.id, event.currentTarget)}
          onFocus={event => activate(item.id, event.currentTarget)}
          startContent={<span className={css.icon}>{item.icon}</span>}
          endContent={<span className={css.categoryEnd}>
            {item.active && <small aria-label={ru ? "Фильтр активен" : "Filter active"}>{item.summary || <Check size={12} />}</small>}
            <ChevronRight size={13} aria-hidden="true" />
          </span>}>{item.label}</ListboxItem>)}
      </Listbox>
      <div className={css.footer}>
        <Switch size="sm" isSelected={filters.includeArchived} onValueChange={onArchived}
          classNames={{ base: css.archive, hiddenInput: css.switchInput, wrapper: css.switchTrack, thumb: css.switchThumb, label: css.switchLabel }}>
          <span className={css.archiveLabel}><Archive size={15} aria-hidden="true" />{ru ? "Показывать архивные" : "Include archived"}</span>
        </Switch>
        {hasActive && <Button type="button" size="sm" variant="light" disableRipple className={css.reset} onPress={onReset}>
          {ru ? "Сбросить фильтры" : "Clear filters"}</Button>}
      </div>
      {current && <FreeSoloPopover key={section} isOpen disableDialogFocus triggerRef={anchor}
        dialogProps={{ "aria-label": current.label }} placement="left-start" offset={8} crossOffset={-38} containerPadding={10}
        shouldBlockScroll={false} shouldCloseOnBlur={false} shouldCloseOnScroll={false}
        isDismissable={false} isKeyboardDismissDisabled disableAnimation portalContainer={portalContainer}
        classNames={{ base: css.positioner, content: css.surface }} style={{ zIndex: layer }}>
        <div ref={optionPanel} id={optionsId} aria-label={current.label} className={css.values}
          data-filter-value-panel data-case-popover-root onKeyDownCapture={event => {
            if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            event.stopPropagation();
            closeOptions();
          }}>
          {extra ?? <>
            <Input size="sm" variant="flat" data-input-shell classNames={fieldClasses}
              aria-label={section === "tag" ? (ru ? "Тег" : "Tag") : optionSearchLabel}
              placeholder={section === "tag" ? (ru ? "Тег содержит…" : "Tag contains…") : (ru ? "Фильтр…" : "Filter…")}
              value={section === "tag" ? filters.tag : search}
              onValueChange={section === "tag" ? onTag : onSearch} onKeyDown={focusFirst} />
            <Listbox aria-label={current.label} variant="light" disableAnimation
              selectionMode={multiple ? "multiple" : "single"} selectionBehavior="toggle"
              selectedKeys={values.filter(value => value.selected).map(value => value.value)} hideSelectedIcon
              classNames={listClasses} itemClasses={itemClasses} emptyContent={ru ? "Ничего не найдено" : "Nothing found"}>
              {values.map(item => <ListboxItem key={item.value} textValue={item.label} startContent={item.icon}
                data-filter-value={item.value} onPress={() => onChoose(item.value)}
                endContent={item.selected && <Check size={14} className={css.check} aria-hidden="true" />}>{item.label}</ListboxItem>)}
            </Listbox>
          </>}
        </div>
      </FreeSoloPopover>}
    </PopoverContent>;
}
