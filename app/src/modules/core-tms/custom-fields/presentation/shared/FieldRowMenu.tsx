import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import { useAnchoredPopup } from "../../../presentation/common/popup/useAnchoredPopup";
import css from "./customFields.module.css";
export function FieldRowMenu({ ru, name, archived, disabled, canArchive = true, onEdit, onTransition }: {
  canArchive?: boolean; ru: boolean; name: string; archived: boolean; disabled: boolean; onEdit(): void; onTransition(): void;
}) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null); const menu = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, menu, close, 180);
  useEffect(() => { if (open) menu.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, [open]);
  const invoke = (action: () => void) => { close(); trigger.current?.focus(); action(); };
  return <div ref={root} className={css.menuRoot} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); trigger.current?.focus(); } }}
    onBlur={event => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) close(); }}>
    <button ref={trigger} type="button" className={css.icon} disabled={disabled} onClick={() => setOpen(value => !value)}
      aria-label={`${ru ? "Действия" : "Actions"}: ${name}`} aria-haspopup="menu" aria-expanded={open}><MoreHorizontal size={17} /></button>
    {open && <div ref={menu} className={css.menu} popover="manual" role="menu" aria-label={name}
      onKeyDown={event => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []);
        if (!items.length) return;
        event.preventDefault();
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }}>
      <button type="button" role="menuitem" onClick={() => invoke(onEdit)}><Pencil size={14} />{ru ? "Изменить" : "Edit"}</button>
      {canArchive && <button type="button" role="menuitem" onClick={() => invoke(onTransition)}>{archived ? <RotateCcw size={14} /> : <Archive size={14} />}
        {archived ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}</button>}
    </div>}
  </div>;
}
