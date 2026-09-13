import { Check, ChevronDown } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import type { AnimatedSelectOption } from "./AnimatedSelect";
import { useAnchoredPopup } from "../popup/useAnchoredPopup";
import { OverflowLabel } from "./overflow/OverflowLabel";
import styles from "./animated-select.module.css";

export function AnimatedMultiSelect({
  label, values, options, allLabel, selectedLabel, onChange, textOnly = false,
}: {
  label: string; textOnly?: boolean;
  values: readonly string[];
  options: readonly AnimatedSelectOption[];
  allLabel: string;
  selectedLabel: string;
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = new Set(values);
  const summary = values.length === 0
    ? allLabel
    : values.length === 1
      ? options.find((option) => option.value === values[0])?.label ?? selectedLabel
      : `${selectedLabel}: ${values.length}`;

  const menuRef = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, rootRef, triggerRef, menuRef, dismiss, 340);

  function optionButtons() {
    return Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []);
  }

  function openAndFocus() {
    setOpen(true);
    requestAnimationFrame(() => optionButtons()[0]?.focus());
  }

  function toggle(value: string) {
    const next = selected.has(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    onChange(next);
  }

  return <div className={styles.root} ref={rootRef}>
    <button
      ref={triggerRef}
      className={`${styles.trigger} ${styles.compactTrigger} ${textOnly ? styles.textTrigger : ""}`}
      type="button"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openAndFocus();
        }
        if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      }}
    >
      <span>{summary}</span><ChevronDown size={15} aria-hidden="true" />
    </button>
    <div
      ref={menuRef}
      popover="manual"
      className={styles.menu}
      id={menuId}
      role="listbox"
      aria-label={label}
      aria-multiselectable="true"
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
          setOpen(false);
          requestAnimationFrame(() => triggerRef.current?.focus());
        }
        if (event.key === "Tab") setOpen(false);
      }}
    >
      <button type="button" role="option" aria-selected={values.length === 0} data-selected={values.length === 0} tabIndex={open ? 0 : -1} onClick={() => onChange([])}>
        <span>{allLabel}</span>{values.length === 0 && <Check size={15} aria-hidden="true" />}
      </button>
      {options.map((option) => {
        const active = selected.has(option.value);
        return <button key={option.value} type="button" role="option" aria-selected={active} data-selected={active} tabIndex={-1} onClick={() => toggle(option.value)}>
          <OverflowLabel text={option.label} />{active && <Check size={15} aria-hidden="true" />}
        </button>;
      })}
    </div>
  </div>;
}
