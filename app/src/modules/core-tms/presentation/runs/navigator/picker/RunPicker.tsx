import { Check, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { RunNameMarquee } from "../RunNameMarquee";
import styles from "../run-navigator.module.css";

type RunPickerProps = {
  visibleRuns: TestRunSummary[];
  selectedRun: TestRunSummary | null;
  mode: "active" | "archived";
  emptyLabel: string;
  openListLabel: string;
  currentLabel: string;
  createLabel: string;
  onSelectRun: (id: string) => void;
  onCreate: () => void;
};

export function RunPicker(props: RunPickerProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = Math.max(0, props.visibleRuns.findIndex((run) => run.id === props.selectedRun?.id));
  const options = () => Array.from(
    pickerRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? [],
  );
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const openAt = (index: number) => {
    setOpen(true);
    requestAnimationFrame(() => options()[index]?.focus());
  };

  useEffect(() => setOpen(false), [props.mode, props.selectedRun?.id]);
  useEffect(() => {
    if (!open) return;
    const closeOnPointer = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnPointer);
    return () => document.removeEventListener("pointerdown", closeOnPointer);
  }, [open]);

  return <div className={styles.picker} ref={pickerRef}>
    <button
      ref={triggerRef}
      className={styles.pickerTrigger}
      type="button"
      disabled={props.visibleRuns.length === 0}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls="run-picker-list"
      aria-label={props.openListLabel}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const index = event.key === "ArrowUp" || event.key === "End"
            ? props.visibleRuns.length - 1
            : event.key === "Home" ? 0 : selectedIndex;
          openAt(index);
        }
        if (event.key === "Escape" && open) {
          event.preventDefault();
          close(true);
        }
      }}
    >
      <span className={styles.pickerTriggerText}>
        <RunNameMarquee name={props.selectedRun?.name ?? props.emptyLabel} motion="always" />
      </span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
    <button className={styles.pickerCreate} type="button" onClick={props.onCreate} aria-label={props.createLabel} title={props.createLabel}>
      <Plus size={16} />
    </button>
    {open && <div className={styles.pickerMenu} id="run-picker-list" role="listbox" aria-label={props.currentLabel} onKeyDown={(event) => {
      const pickerOptions = options();
      const current = Math.max(0, pickerOptions.indexOf(document.activeElement as HTMLButtonElement));
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        pickerOptions[(current + direction + pickerOptions.length) % pickerOptions.length]?.focus();
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        pickerOptions[event.key === "Home" ? 0 : pickerOptions.length - 1]?.focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
      if (event.key === "Tab") close();
    }}>
      {props.visibleRuns.map((run) => {
        const selected = run.id === props.selectedRun?.id;
        return <button
          className={selected ? styles.pickerOptionActive : styles.pickerOption}
          key={run.id}
          type="button"
          role="option"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          onClick={() => { props.onSelectRun(run.id); close(true); }}
        >
          <span><RunNameMarquee name={run.name} motion="interaction" /><small>{run.key}</small></span>
          {selected ? <Check size={15} aria-hidden="true" /> : <span className={styles.optionMarker} />}
        </button>;
      })}
    </div>}
  </div>;
}
