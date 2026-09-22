import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Ellipsis, ExternalLink, Link, Trash2 } from "lucide-react";
import { useAnchoredPopup } from "../../../../../presentation/common/popup/useAnchoredPopup";
import css from "./import-file-menu.module.css";

export function ImportFileMenu(props: { ru: boolean; available: boolean; canDelete: boolean; disabled: boolean;
  onOpen: () => void; onDownload: () => void; onShare: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, menu, dismiss, 230);
  useEffect(() => { if (open) menu.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true }); }, [open]);
  function choose(action: () => void) { setOpen(false); trigger.current?.focus(); action(); }
  return <div ref={root} className={css.root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    if (event.key === "Tab") setOpen(false);
    if (open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = [...menu.current!.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
        (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
  }}>
    <button type="button" ref={trigger} className={css.trigger} disabled={props.disabled} aria-haspopup="menu"
      aria-expanded={open} aria-label={props.ru ? "Действия с файлом" : "File actions"} onClick={() => setOpen(!open)}><Ellipsis size={20} /></button>
    {open && <div ref={menu} popover="manual" className={css.menu} role="menu">
      <button type="button" role="menuitem" disabled={!props.available} onClick={() => choose(props.onOpen)}><ExternalLink size={16} />{props.ru ? "Открыть" : "Open"}</button>
      <button type="button" role="menuitem" disabled={!props.available} onClick={() => choose(props.onDownload)}><Download size={16} />{props.ru ? "Скачать" : "Download"}</button>
      <button type="button" role="menuitem" onClick={() => choose(props.onShare)}><Link size={16} />{props.ru ? "Скопировать ссылку" : "Copy link"}</button>
      {props.canDelete && <button type="button" role="menuitem" className={css.danger} onClick={() => choose(props.onDelete)}><Trash2 size={16} />{props.ru ? "Удалить файл" : "Delete file"}</button>}
    </div>}
  </div>;
}
