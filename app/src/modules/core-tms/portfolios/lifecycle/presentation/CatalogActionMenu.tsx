import { Ellipsis, Archive, RotateCcw, FolderMinus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CatalogAction } from "../model/action";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./catalog-actions.module.css";

export function CatalogActionMenu({ target, disabled, onAction }: {
  target: Omit<Extract<CatalogAction, { kind: "portfolio" }>, "action"> | Omit<Extract<CatalogAction, { kind: "project" }>, "action">;
  disabled?: boolean; onAction: (action: CatalogAction) => void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null); const menu = useRef<HTMLDivElement>(null);
  const close = () => { setPosition(null); trigger.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null); };
    const dismiss = () => setPosition(null);
    document.addEventListener("pointerdown", outside); window.addEventListener("resize", dismiss); window.addEventListener("scroll", dismiss, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", dismiss, true); };
  }, [position]);
  const choose = (action: CatalogAction) => { close(); onAction(action); };
  return <><button ref={trigger} type="button" className={css.trigger} disabled={disabled} aria-haspopup="menu" aria-expanded={!!position}
    aria-label={`${ru ? "Действия" : "Actions"}: ${target.item.name}`} onClick={() => {
      if (position) { close(); return; }
      const rect = trigger.current!.getBoundingClientRect();
      setPosition({ top: Math.max(8, Math.min(rect.bottom + 6, innerHeight - 156)), right: Math.max(8, innerWidth - rect.right) });
    }}><Ellipsis size={18} /></button>
    {position && createPortal(<div className={css.menu} style={position} ref={menu} role="menu" aria-label={target.item.name} onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); close(); }
      if (event.key === "Tab") setPosition(null);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault(); const items = [...menu.current!.querySelectorAll<HTMLButtonElement>("button")];
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (i + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
      }
    }}>
      {target.kind === "project" && target.item.portfolioId && <button type="button" role="menuitem" onClick={() => choose({ ...target, action: "detach" })}><FolderMinus size={16} />{ru ? "Убрать из портфеля" : "Remove from portfolio"}</button>}
      <button type="button" role="menuitem" onClick={() => choose({ ...target, action: target.item.status === "archived" ? "restore" : "archive" })}>
        {target.item.status === "archived" ? <RotateCcw size={16} /> : <Archive size={16} />}{target.item.status === "archived" ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}</button>
      {target.kind === "portfolio" && target.item.projectCount === 0 && <button type="button" role="menuitem" className={css.danger} onClick={() => choose({ ...target, action: "remove" })}><Trash2 size={16} />{ru ? "Удалить пустой портфель" : "Delete empty portfolio"}</button>}
    </div>, trigger.current?.closest("[data-testid=\"tms-workspace\"]") ?? document.body)}</>;
}
