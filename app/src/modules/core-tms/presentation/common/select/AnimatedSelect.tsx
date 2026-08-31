import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./animated-select.module.css";

export type AnimatedSelectOption = {
  value: string;
  label: string;
};

export function AnimatedSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly AnimatedSelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function optionButtons() {
    return Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []);
  }

  function openAndFocus(index: number) {
    setOpen(true);
    requestAnimationFrame(() => optionButtons()[index]?.focus());
  }

  function closeAndRestoreFocus() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openAndFocus(event.key === "ArrowDown" ? selectedIndex : options.length - 1);
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            closeAndRestoreFocus();
          }
        }}
      >
        <span>{selected?.label ?? "—"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div
        className={styles.menu}
        id={menuId}
        role="listbox"
        aria-label={label}
        aria-hidden={!open}
        data-open={open}
        onKeyDown={(event) => {
          const buttons = optionButtons();
          const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            buttons[(current + direction + buttons.length) % buttons.length]?.focus();
          }
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            buttons[event.key === "Home" ? 0 : buttons.length - 1]?.focus();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeAndRestoreFocus();
          }
          if (event.key === "Tab") setOpen(false);
        }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              tabIndex={open && active ? 0 : -1}
              data-selected={active}
              onClick={() => {
                onChange(option.value);
                closeAndRestoreFocus();
              }}
            >
              <span>{option.label}</span>
              {active && <Check size={15} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
