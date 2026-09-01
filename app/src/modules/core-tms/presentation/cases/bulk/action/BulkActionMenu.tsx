import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import styles from "../styles/caseBulk.module.css";

export type BulkMenuOption<T extends string> = {
  value: T;
  label: string;
  icon: ReactNode;
};

export function BulkActionMenu<T extends string>(props: {
  id: string;
  label: string;
  compactLabel: string;
  open: boolean;
  disabled: boolean;
  options: readonly BulkMenuOption<T>[];
  onToggle: () => void;
  onClose: () => void;
  onSelect: (value: T) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (props.open) menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [props.open]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
      triggerRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const current = Math.max(0, options.indexOf(document.activeElement as HTMLButtonElement));
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  }

  return (
    <div className={styles.bulkMenuRoot} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.bulkAction}
        disabled={props.disabled}
        aria-haspopup="menu"
        aria-label={props.label}
        aria-expanded={props.open}
        aria-controls={`${props.id}-menu`}
        onClick={props.onToggle}
        onKeyDown={(event) => {
          if (!props.open && ["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            props.onToggle();
          }
        }}
      >
        <span className={styles.bulkLongLabel}>{props.label}</span>
        <span className={styles.bulkShortLabel} aria-hidden="true">{props.compactLabel}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      {props.open && (
        <div ref={menuRef} id={`${props.id}-menu`} className={styles.bulkMenu} role="menu">
          {props.options.map((option) => (
            <button key={option.value} type="button" role="menuitem" onClick={() => {
              props.onSelect(option.value);
              triggerRef.current?.focus();
            }}>
              {option.icon}<span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
