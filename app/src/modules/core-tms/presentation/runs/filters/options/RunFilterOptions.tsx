import { Input, Listbox, ListboxItem } from "@heroui/react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Search } from "lucide-react";
import css from "./run-filter-options.module.css";

export type RunFilterOption = { value: string; label: string; detail?: string | null; avatar?: ReactNode };
export function RunFilterOptions({ label, options, selected, onChange, search, onSearch, placeholder, children, multiple = false, popover = false }: {
  label: string; options: RunFilterOption[]; selected: readonly string[]; onChange: (value: string) => void;
  multiple?: boolean; popover?: boolean; search?: string; onSearch?: (value: string) => void; placeholder?: string; children?: ReactNode;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const query = search ?? localSearch;
  const visible = onSearch ? options : options.filter((option) => `${option.label} ${option.detail ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  if (popover) return <>
    {placeholder && <Input aria-label={placeholder} placeholder={placeholder} value={query} size="sm" variant="flat" data-input-shell
      onValueChange={onSearch ?? setLocalSearch} classNames={{ base: css.pickerSearch, inputWrapper: css.pickerInputWrapper, input: css.pickerInput }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const options = event.currentTarget.closest("[data-filter-value-panel]")?.querySelectorAll<HTMLElement>("[role='option']");
        if (!options?.length) return;
        event.preventDefault();
        options[event.key === "ArrowDown" ? 0 : options.length - 1]?.focus();
      }} />}
    <Listbox aria-label={label} selectionMode={multiple ? "multiple" : "single"} selectionBehavior="toggle"
      selectedKeys={selected} variant="light" disableAnimation hideEmptyContent hideSelectedIcon
      classNames={{ base: css.pickerListbox, list: css.pickerList }} itemClasses={{ base: css.pickerRow, wrapper: css.pickerTitle }}>
      {visible.map(option => <ListboxItem key={option.value} textValue={option.label} startContent={option.avatar} onPress={() => onChange(option.value)}
        endContent={selected.includes(option.value) && <Check size={13} aria-hidden="true" />}>
        <span className={css.label}>{option.label}{option.detail && <small>{option.detail}</small>}</span>
      </ListboxItem>)}
    </Listbox>
    {children}
  </>;
  return <div className={css.panel}>
    {placeholder && <label className={css.search} data-input-shell><Search size={13} aria-hidden="true" />
      <input aria-label={placeholder} placeholder={placeholder} value={query} onChange={(event) => (onSearch ?? setLocalSearch)(event.target.value)}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); event.currentTarget.closest(`.${css.panel}`)?.querySelector<HTMLButtonElement>("[role=option]")?.focus(); } }} /></label>}
    <div role="listbox" aria-label={label} aria-multiselectable={multiple} className={css.options} onKeyDown={(event) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const choices = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=option]")];
      if (!choices.length) return;
      event.preventDefault();
      const current = choices.indexOf(document.activeElement as HTMLButtonElement);
      choices[event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (current + (event.key === "ArrowDown" ? 1 : choices.length - 1)) % choices.length]?.focus();
    }}>
      {visible.map((option) => <button key={option.value} type="button" role="option" aria-selected={selected.includes(option.value)} onClick={() => onChange(option.value)}>
        {option.avatar}<span className={css.label}>{option.label}{option.detail && <small>{option.detail}</small>}</span>{selected.includes(option.value) && <Check size={13} />}
      </button>)}
    </div>
    {children}
  </div>;
}
