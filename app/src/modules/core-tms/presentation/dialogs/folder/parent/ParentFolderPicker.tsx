import { Check, ChevronDown, Folder, Search } from "lucide-react";
import { useId, useRef, useState } from "react";
import css from "./parent-folder-picker.module.css";

export function ParentFolderPicker({ value, options, label, searchLabel, emptyLabel, onChange }: {
  value: string; options: readonly { value: string; label: string }[];
  label: string; searchLabel: string; emptyLabel: string; onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const visible = options.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  function close() { setOpen(false); trigger.current?.focus(); }
  function buttons() { return Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []); }
  return <div className={css.picker} ref={root} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button ref={trigger} type="button" className={css.trigger} aria-label={`${label}: ${options.find((option) => option.value === value)?.label ?? value}`}
      aria-expanded={open} aria-controls={id} onClick={() => {
        setOpen(!open); setQuery("");
        if (!open) requestAnimationFrame(() => search.current?.focus());
      }}>
      <Folder size={16} aria-hidden="true" /><span>{options.find((option) => option.value === value)?.label ?? value}</span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div className={css.browser}>
      <div className={css.search} data-input-shell><Search size={15} aria-hidden="true" />
        <input ref={search} value={query} aria-label={searchLabel} placeholder={searchLabel} onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); buttons()[0]?.focus(); } }} />
      </div>
      <div className={css.list} id={id} role="listbox" aria-label={label} onKeyDown={(event) => {
        const items = buttons(); const current = items.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); const next = current + (event.key === "ArrowDown" ? 1 : -1);
          if (next < 0) search.current?.focus(); else items[Math.min(next, items.length - 1)]?.focus();
        }
        if (event.key === "Home" || event.key === "End") { event.preventDefault(); items[event.key === "Home" ? 0 : items.length - 1]?.focus(); }
      }}>
        {visible.map((option) => <button type="button" role="option" key={option.value} aria-selected={option.value === value}
          tabIndex={option.value === value || (!visible.some((item) => item.value === value) && option === visible[0]) ? 0 : -1}
          title={option.label} onClick={() => { onChange(option.value); close(); }}>
          <Folder size={15} aria-hidden="true" /><span>{option.value === "/" ? option.label : option.value.split("/").filter(Boolean).join(" / ")}</span>
          {option.value === value && <Check size={15} aria-hidden="true" />}
        </button>)}
      </div>
      {!visible.length && <p className={css.empty} role="status">{emptyLabel}</p>}
    </div>}
  </div>;
}
