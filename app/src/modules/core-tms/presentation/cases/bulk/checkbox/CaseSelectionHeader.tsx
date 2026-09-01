import { ChevronDown, ListFilter, ListTree, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { SelectionCoverage } from "../selection/caseSelection";
import { CaseSelectionCheckbox } from "./CaseSelectionCheckbox";
import styles from "../styles/caseBulk.module.css";

export function CaseSelectionHeader(props: {
  locale: TmsLocale;
  visibleCount: number;
  allCount: number;
  selectedCount: number;
  disabled?: boolean;
  visibleCoverage: SelectionCoverage;
  onToggleVisible: () => void;
  onSelectVisible: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const ru = props.locale === "ru";
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => {
    if (props.disabled) setOpen(false);
  }, [props.disabled]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [open]);

  function navigate(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }

  const choose = (action: () => void) => {
    action();
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={root} className={styles.selectionHeader}>
      <CaseSelectionCheckbox
        coverage={props.visibleCoverage}
        disabled={props.disabled || props.visibleCount === 0}
        label={ru ? "Выбрать все найденные тест-кейсы" : "Select all matching test cases"}
        onToggle={props.onToggleVisible}
      />
      <button
        ref={trigger}
        type="button"
        className={styles.selectionMenuButton}
        aria-label={ru ? "Настройки выбора" : "Selection options"}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={props.disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <ChevronDown size={11} aria-hidden="true" />
      </button>
      {open && (
        <div ref={menuRef} className={styles.selectionMenu} role="menu" onKeyDown={navigate}>
          <button type="button" role="menuitem" disabled={props.disabled} onClick={() => choose(props.onSelectVisible)}>
            <ListFilter size={14} aria-hidden="true" />
            <span>{ru ? "Выбрать найденные" : "Select all matches"}</span>
            <small>{props.visibleCount}</small>
          </button>
          <button type="button" role="menuitem" disabled={props.disabled} onClick={() => choose(props.onSelectAll)}>
            <ListTree size={14} aria-hidden="true" />
            <span>{ru ? "Выбрать весь проект" : "Select entire project"}</span>
            <small>{props.allCount}</small>
          </button>
          <button type="button" role="menuitem" disabled={props.disabled || props.selectedCount === 0} onClick={() => choose(props.onClear)}>
            <X size={14} aria-hidden="true" />
            <span>{ru ? "Снять выделение" : "Clear selection"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
