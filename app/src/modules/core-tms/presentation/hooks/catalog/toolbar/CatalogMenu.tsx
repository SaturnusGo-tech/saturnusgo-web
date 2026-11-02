import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useAnchoredPopup } from "../../../common/popup/useAnchoredPopup";
import styles from "../catalog.module.css";

export function CatalogMenu({ label, trigger, children, connect = false, active = false, disabled = false }: {
  label: string; trigger: ReactNode; children: (close: () => void) => ReactNode;
  connect?: boolean; active?: boolean; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false), id = useId();
  const root = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  const close = () => { dismiss(); button.current?.focus({ preventScroll: true }); };
  useAnchoredPopup(open, false, root, button, panel, dismiss, 280);
  useEffect(() => { if (open) panel.current?.querySelector<HTMLElement>("button:not(:disabled),a[href]")?.focus({ preventScroll: true }); }, [open]);
  return <div ref={root} className={styles.menu} onBlur={event => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss();
  }} onKeyDown={event => {
    if (!open) {
      if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); }
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = [...(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]") ?? [])];
    if (!items.length) return;
    event.preventDefault(); const index = items.indexOf(document.activeElement as HTMLElement);
    items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  }}>
    <button ref={button} type="button" className={connect ? styles.connectButton : `${styles.iconButton} ${styles.menuTrigger}`}
      aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      disabled={disabled} data-active={active || undefined} title={label} onClick={() => setOpen(value => !value)}>{trigger}</button>
    {open && <div ref={panel} id={id} popover="manual" className={styles.menuPopover} role="dialog" aria-label={label}>{children(close)}</div>}
  </div>;
}
