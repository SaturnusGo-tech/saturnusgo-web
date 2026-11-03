import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal, RefreshCw, Settings2 } from "lucide-react";
import { useAnchoredPopup } from "../../common/popup/useAnchoredPopup";
import css from "./actions.module.css";
export function ApiTestingActions({ canManage, disabled, ru, onManage, onRefresh }: {
  canManage: boolean; disabled: boolean; ru: boolean; onManage(): void; onRefresh(): void;
}) {
  const [open, setOpen] = useState(false), root = useRef<HTMLDivElement>(null), id = useId();
  const trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, menu, close, 206);
  useEffect(() => { if (open) menu.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus(); }, [open]);
  const act = (action: () => void) => { close(); action(); trigger.current?.focus(); };
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); close(); trigger.current?.focus(); }
    if (open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    }
  }}>
    <button ref={trigger} type="button" className={css.trigger} aria-label={ru ? "Действия API" : "API actions"}
      aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><MoreHorizontal size={19}/></button>
    {open && <div id={id} ref={menu} className={css.menu} popover="manual" role="menu">
      {canManage && <button type="button" role="menuitem" onClick={() => act(onManage)}><Settings2 size={15}/>{ru ? "Настроить Swagger" : "Manage Swagger"}</button>}
      <button type="button" role="menuitem" disabled={disabled} onClick={() => act(onRefresh)}><RefreshCw size={15}/>{ru ? "Обновить API" : "Refresh API"}</button>
    </div>}
  </div>;
}
