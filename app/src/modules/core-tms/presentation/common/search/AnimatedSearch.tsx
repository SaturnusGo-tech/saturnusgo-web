import { useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import css from "./search.module.css";

export function AnimatedSearch({ value, onChange, label, placeholder, openLabel = label, closeLabel }: {
  value: string; onChange: (value: string) => void; label: string; placeholder: string; openLabel?: string; closeLabel: string;
}) {
  const [open, setOpen] = useState(Boolean(value)), id = useId();
  const input = useRef<HTMLInputElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const close = () => { onChange(""); setOpen(false); trigger.current?.focus(); };
  return <div className={css.search} data-open={open || undefined}>
    <div className={css.reveal} aria-hidden={!open} ref={element => { if (element) element.inert = !open; }}>
      <label className={css.field} data-input-shell><Search size={15} aria-hidden="true" />
        <input ref={input} id={id} type="search" aria-label={label} placeholder={placeholder} maxLength={300} value={value}
          onChange={event => onChange(event.target.value)} onKeyDown={event => {
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
          }} />
      </label>
    </div>
    <button ref={trigger} type="button" className={css.toggle} aria-label={open ? closeLabel : openLabel}
      aria-expanded={open} aria-controls={id} title={open ? closeLabel : openLabel} onClick={() => {
        if (open) close(); else { setOpen(true); requestAnimationFrame(() => input.current?.focus()); }
      }}>{open ? <X size={17} /> : <Search size={18} />}</button>
  </div>;
}
