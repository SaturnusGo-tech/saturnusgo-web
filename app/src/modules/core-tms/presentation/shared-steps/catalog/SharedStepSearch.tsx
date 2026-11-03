import { useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import css from "./catalog.module.css";

export function SharedStepSearch({ value, onChange, ru }: { value: string; onChange: (value: string) => void; ru: boolean }) {
  const [open, setOpen] = useState(false), id = useId();
  const input = useRef<HTMLInputElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const close = () => { onChange(""); setOpen(false); trigger.current?.focus(); };
  return <div className={css.search} data-open={open || undefined}>
    <div className={css.searchReveal} aria-hidden={!open} ref={element => { if (element) element.inert = !open; }}>
      <label className={css.searchField} data-input-shell><Search size={15} aria-hidden="true" />
        <input ref={input} id={id} type="search" aria-label={ru ? "Найти общий шаг" : "Find a shared step"}
          placeholder={ru ? "Поиск по названию" : "Search by title"} maxLength={300} value={value}
          onChange={event => onChange(event.target.value)} onKeyDown={event => {
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
          }} />
      </label>
    </div>
    <button ref={trigger} type="button" className={css.searchToggle} aria-label={open ? (ru ? "Закрыть поиск" : "Close search") : (ru ? "Найти общий шаг" : "Search shared steps")}
      aria-expanded={open} aria-controls={id} title={ru ? "Поиск" : "Search"} onClick={() => {
        if (open) close(); else { setOpen(true); requestAnimationFrame(() => input.current?.focus()); }
      }}>{open ? <X size={17} /> : <Search size={18} />}</button>
  </div>;
}
