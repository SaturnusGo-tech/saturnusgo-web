import { ChevronDown } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { useAnchoredPopup } from "../../../../common/popup/useAnchoredPopup";
import styles from "./picker.module.css";

export function FacetPicker({ label, allLabel, options, selected, onToggle }: {
  label: string; allLabel: string; options: Array<{ value: string; label: string; count: number }>;
  selected: string[]; onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false); const id = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, close, 260);
  const summary = selected.length ? selected.map(value => options.find(option => option.value === value)?.label ?? value).join(", ") : allLabel;
  return <div className={styles.field} ref={root} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); trigger.current?.focus(); }
  }} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) close(); }}>
    <span className={styles.label}>{label}</span>
    <button type="button" ref={trigger} className={styles.trigger} title={summary} aria-label={`${label}: ${summary}`}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>
      <span>{summary}</span><ChevronDown size={14} />
    </button>
    {open && <div ref={panel} id={id} className={styles.menu} popover="manual" role="dialog" aria-label={label}>
      {options.map(option => <label key={option.value} title={option.label}>
        <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
        <span>{option.label}</span><small>{option.count}</small>
      </label>)}
    </div>}
  </div>;
}
