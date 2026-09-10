import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Ellipsis, Pencil, Reply, Trash2 } from "lucide-react";
import css from "./comment-menu.module.css";
export function CommentMenu({ ru, canEdit, canDelete, canReply, disabled, onEdit, onDelete, onReply }: {
  ru: boolean; canEdit: boolean; canDelete: boolean; canReply: boolean; disabled: boolean;
  onEdit: () => void; onDelete: () => void; onReply: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      const height = root.current?.querySelector<HTMLElement>('[role="menu"]')?.offsetHeight ?? 120;
      if (bounds) setOpensUp(innerHeight - bounds.bottom < height + 12 && bounds.top > height + 12);
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => { window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  if (!canEdit && !canDelete && !canReply) return null;
  const choose = (action: () => void) => { setOpen(false); trigger.current?.focus(); action(); };
  return <div className={css.root} ref={root} onKeyDown={(event) => {
    if (event.key === "Escape") { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    if (open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = [...root.current!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
        (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
    if (event.key === "Tab") setOpen(false);
  }}>
    <button type="button" ref={trigger} className={css.trigger} disabled={disabled} aria-haspopup="menu"
      aria-expanded={open} aria-label={ru ? "Действия с комментарием" : "Comment actions"} onClick={() => setOpen(!open)}><Ellipsis size={17} /></button>
    {open && <div className={css.menu} role="menu" data-side={opensUp ? "up" : "down"}>
      {canReply && <button type="button" role="menuitem" onClick={() => choose(onReply)}><Reply size={14} />{ru ? "Ответить" : "Reply"}</button>}
      {canEdit && <button type="button" role="menuitem" onClick={() => choose(onEdit)}><Pencil size={14} />{ru ? "Изменить" : "Edit"}</button>}
      {canDelete && <button type="button" role="menuitem" className={css.danger} onClick={() => choose(onDelete)}><Trash2 size={14} />{ru ? "Удалить" : "Delete"}</button>}
    </div>}
  </div>;
}
