import { PiCheck, PiCaretDown, PiCaretRight, PiMagnifyingGlass, PiFolderSimpleDuotone, PiFolderOpenDuotone } from "react-icons/pi";
import { useCallback, useId, useRef, useState } from "react";
import { sortFolderOptions } from "./folder-options";
import { folderChoiceAncestors, folderChoiceRows } from "./tree/folder-choice-tree";
import { FolderBreadcrumb } from "../breadcrumb/FolderBreadcrumb";
import { useFolderPopup } from "./popup/useFolderPopup";
import css from "./parent-folder-picker.module.css";

export function ParentFolderPicker({ value, options, label, searchLabel, emptyLabel, onChange, inline = false }: {
  value: string; options: readonly { value: string; label: string }[];
  label: string; searchLabel: string; emptyLabel: string; onChange: (value: string) => void; inline?: boolean;
}) {
  const [open, setOpen] = useState(inline);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => folderChoiceAncestors(value));
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useFolderPopup(open, inline, root, trigger, menu, dismiss);
  const visible = folderChoiceRows(sortFolderOptions(options), expanded, query);
  function close() { if (!inline) { setOpen(false); trigger.current?.focus(); } }
  function buttons() { return Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []); }
  function toggle(path: string) { setExpanded((current) => { const next = new Set(current); next.has(path) ? next.delete(path) : next.add(path); return next; }); }
  const current = options.find((option) => option.value === value);
  return <div className={css.picker} ref={root} onKeyDown={(event) => {
    if (event.key === "Escape" && open && !inline) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    {!inline && <button ref={trigger} type="button" className={css.trigger} aria-label={`${label}: ${current?.label ?? value}`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => {
        setOpen(!open); setQuery(""); setExpanded(folderChoiceAncestors(value));
        if (!open) requestAnimationFrame(() => search.current?.focus());
      }}>
      <PiFolderSimpleDuotone size={18} aria-hidden="true" /><FolderBreadcrumb path={value} root={current?.label} />
      <PiCaretDown size={14} aria-hidden="true" />
    </button>}
    {(open || inline) && <div ref={menu} popover={inline ? undefined : "manual"} className={css.browser} data-inline={inline || undefined}>
      <div className={css.search} data-input-shell><PiMagnifyingGlass size={15} aria-hidden="true" />
        <input ref={search} value={query} aria-label={searchLabel} placeholder={searchLabel} onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); buttons()[0]?.focus(); } }} />
      </div>
      <div className={css.list} id={id} role="listbox" aria-label={label} onKeyDown={(event) => {
        const items = buttons(); const index = items.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); const next = index + (event.key === "ArrowDown" ? 1 : -1);
          if (next < 0) search.current?.focus(); else items[Math.min(next, items.length - 1)]?.focus();
        }
        if (event.key === "Home" || event.key === "End") { event.preventDefault(); items[event.key === "Home" ? 0 : items.length - 1]?.focus(); }
        const row = visible[index];
        if (row && event.key === "ArrowRight" && row.hasChildren && !expanded.has(row.value)) { event.preventDefault(); toggle(row.value); }
        if (row && event.key === "ArrowLeft" && expanded.has(row.value)) { event.preventDefault(); toggle(row.value); }
      }}>
        {visible.map((option) => <div className={css.row} key={option.value} style={{ paddingLeft: query ? 0 : Math.min(option.depth, 10) * 18 }}>
          <button type="button" className={css.disclosure} tabIndex={-1} aria-hidden={!option.hasChildren || undefined}
            aria-label={option.name} aria-expanded={option.hasChildren ? expanded.has(option.value) : undefined} disabled={!option.hasChildren}
            onClick={() => toggle(option.value)}>{option.hasChildren && (expanded.has(option.value) ? <PiCaretDown size={12} /> : <PiCaretRight size={12} />)}</button>
          <button type="button" role="option" aria-selected={option.value === value}
            tabIndex={option.value === value || (!visible.some((item) => item.value === value) && option === visible[0]) ? 0 : -1}
            onClick={() => { onChange(option.value); close(); }}>
            {expanded.has(option.value) ? <PiFolderOpenDuotone size={18} /> : <PiFolderSimpleDuotone size={18} />}
            <span>{option.name}{query && option.depth > 0 && <small><FolderBreadcrumb path={option.parent} /></small>}</span>
            {option.value === value && <PiCheck size={15} className={css.check} aria-hidden="true" />}
          </button>
        </div>)}
      </div>
      {!visible.length && <p className={css.empty} role="status">{emptyLabel}</p>}
    </div>}
  </div>;
}
