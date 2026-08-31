import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./caseMetadata.module.css";
import { nextMetadataOption } from "./navigation/nextMetadataOption";

export type MetadataOption<T extends string> = {
  value: T;
  label: string;
  icon: ReactNode;
  tone: string;
};

export function MetadataSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  autoFocus,
}: {
  label: string;
  value: T;
  options: readonly MetadataOption<T>[];
  onChange: (value: T) => void;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function focusOption(index: number) {
    setActiveIndex(index);
    requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function openAt(index: number) {
    setOpen(true);
    focusOption(index);
  }

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function move(event: KeyboardEvent, key: "ArrowDown" | "ArrowUp" | "Home" | "End") {
    event.preventDefault();
    focusOption(nextMetadataOption(options.length, activeIndex, key));
  }

  return (
    <div
      className={styles.select}
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        autoFocus={autoFocus}
        onClick={() => {
          if (open) close(false);
          else openAt(selectedIndex);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openAt(event.key === "ArrowDown" ? selectedIndex : options.length - 1);
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            close();
          }
        }}
      >
        <span className={`${styles.chip} ${selected?.tone ?? ""}`}>{selected?.icon}{selected?.label}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      <div
        id={menuId}
        className={styles.menu}
        role="listbox"
        aria-label={label}
        aria-hidden={!open}
        data-open={open}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            move(event, event.key as "ArrowDown" | "ArrowUp" | "Home" | "End");
          } else if (event.key === "Escape") {
            event.preventDefault();
            close();
          } else if (event.key === "Tab") {
            setOpen(false);
          } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
            const query = event.key.toLocaleLowerCase();
            const index = options.findIndex((option, offset) => {
              const candidate = options[(activeIndex + offset + 1) % options.length];
              return candidate?.label.toLocaleLowerCase().startsWith(query);
            });
            if (index >= 0) focusOption((activeIndex + index + 1) % options.length);
          }
        }}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={(node) => { optionRefs.current[index] = node; }}
            type="button"
            role="option"
            aria-selected={option.value === value}
            tabIndex={open && index === activeIndex ? 0 : -1}
            data-selected={option.value === value}
            onFocus={() => setActiveIndex(index)}
            onClick={() => {
              onChange(option.value);
              close();
            }}
          >
            <span className={`${styles.chip} ${option.tone}`}>{option.icon}{option.label}</span>
            {option.value === value && <Check size={13} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
