import { Button, Input, Listbox, ListboxItem } from "@heroui/react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import dashboardStyles from "../../../dashboard.module.css";
import styles from "./picker.module.css";

type Option = { value: string; label: string; count?: number; disabled?: boolean; icon?: ReactNode };
type Search = { label: string; value: string; onChange(value: string): void };

export const drillFacetPopoverClasses = { base: styles.positioner, content: `${styles.surface} ${dashboardStyles.popupEnter}` };

export function FacetPicker({ label, options, selected, search, empty, onChoose, onHover, onBack, children, focus = true, single, busy }: {
  label: string; options: readonly Option[]; selected?: string[]; search?: Search; empty?: string | null;
  onChoose(value: string, row: HTMLElement): void;
  onHover?(value: string, row: HTMLElement): void;
  onBack?(): void;
  children?: ReactNode; focus?: boolean; single?: boolean; busy?: boolean;
}) {
  function handleOptionKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    const row = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-drill-facet-option]") : null;
    if (!row || row.closest("[data-drill-facet-picker]") !== event.currentTarget || row.getAttribute("aria-disabled") === "true") return;
    if (event.key === "Enter" || event.key === " " || (onHover && event.key === "ArrowRight")) {
      event.preventDefault();
      event.stopPropagation();
      onChoose(row.dataset.drillFacetOption!, row);
    }
  }
  function focusOption(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const options = event.currentTarget.closest("[data-drill-facet-picker]")?.querySelectorAll<HTMLElement>("[data-drill-facet-option]:not([aria-disabled=true])");
    const option = event.key === "ArrowDown" ? options?.[0] : options?.[options.length - 1];
    if (!option) return;
    event.preventDefault();
    option.focus({ preventScroll: true });
  }
  return <div className={styles.menu} data-drill-facet-picker onKeyDownCapture={handleOptionKey}>
    {onBack && <Button size="sm" variant="light" className={styles.back} onPress={onBack}>
      <ArrowLeft size={14} aria-hidden="true" />{label}
    </Button>}
    {search && <Input autoFocus={focus} size="sm" variant="flat" aria-label={search.label} placeholder={search.label} value={search.value}
      classNames={{ base: styles.search, inputWrapper: styles.inputShell, input: styles.input }} onValueChange={search.onChange} onKeyDown={focusOption} />}
    <Listbox aria-label={label} aria-busy={busy} variant="light" selectionMode={selected ? single ? "single" : "multiple" : "none"}
      selectedKeys={selected} hideSelectedIcon autoFocus={!search && focus} emptyContent={empty}
      disabledKeys={options.filter(option => option.disabled).map(option => option.value)}
      classNames={{ base: styles.listbox, list: styles.list, emptyContent: styles.empty }} itemClasses={{ base: styles.row, title: styles.title }}>
      {options.map(option => <ListboxItem key={option.value} textValue={option.label} data-drill-facet-option={option.value}
        onPress={event => { if (event.target instanceof HTMLElement) onChoose(option.value, event.target); }}
        onMouseEnter={onHover ? event => onHover(option.value, event.currentTarget) : undefined}
        startContent={option.icon} endContent={onHover ? <ChevronRight className={styles.detail} size={13} aria-hidden="true" />
          : <>{option.count !== undefined && <small className={styles.detail}>{option.count}</small>}
            {selected?.includes(option.value) && <Check size={14} className={styles.detail} aria-hidden="true" />}</>}>
        {option.label}
      </ListboxItem>)}
    </Listbox>
    {children}
  </div>;
}
