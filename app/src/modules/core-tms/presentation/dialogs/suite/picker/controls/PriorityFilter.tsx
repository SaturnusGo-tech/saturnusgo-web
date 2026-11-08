import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "@openai/apps-sdk-ui/components/Icon";
import { useAnchoredPopup } from "../../../../common/popup/useAnchoredPopup";
import type { PickerPriority } from "../model/picker-model";
import { priorityLabel, priorityLevels } from "../../../../common/properties/PriorityIcon";
import styles from "../suite-picker.module.css";

export function PriorityFilter({ value, ru, onChange }: { value: PickerPriority; ru: boolean; onChange: (value: PickerPriority) => void }) {
  const [open, setOpen] = useState(false), id = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, dismiss, 180);
  useEffect(() => { if (open) panel.current?.querySelector<HTMLElement>("button[aria-checked=true]")?.focus({ preventScroll: true }); }, [open]);
  const close = () => { dismiss(); trigger.current?.focus({ preventScroll: true }); };
  return <div ref={root} className={styles.filter} onBlur={event => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss();
  }} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); close(); }
    if (!open && event.key === "ArrowDown") { event.preventDefault(); setOpen(true); }
    if (!open || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = [...(panel.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    event.preventDefault(); items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  }}>
    <button ref={trigger} type="button" className={styles.filterTrigger} aria-label={ru ? "Приоритет" : "Priority"}
      aria-expanded={open} aria-haspopup="menu" aria-controls={open ? id : undefined} data-active={value !== "all" || undefined}
      onClick={() => setOpen(current => !current)}>{value === "all" ? (ru ? "Приоритет" : "Priority") : priorityLabel(ru ? "ru" : "en", value)}<ChevronDown width={14} height={14} /></button>
    {open && <div ref={panel} id={id} role="menu" popover="manual" aria-label={ru ? "Приоритет" : "Priority"} className={styles.priorityMenu}>
      {(["all", ...priorityLevels.map(({ key }) => key)] as const).map(priority => <button type="button" key={priority} role="menuitemradio"
        aria-checked={value === priority} onClick={() => { onChange(priority); close(); }}>
        <span>{priority === "all" ? (ru ? "Любой приоритет" : "Any priority") : priorityLabel(ru ? "ru" : "en", priority)}</span>
        {value === priority && <Check width={15} height={15} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
