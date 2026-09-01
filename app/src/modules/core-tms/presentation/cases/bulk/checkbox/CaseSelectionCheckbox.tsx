import { useEffect, useRef } from "react";
import type { SelectionCoverage } from "../selection/caseSelection";
import styles from "../styles/caseBulk.module.css";

export function CaseSelectionCheckbox({
  coverage,
  label,
  disabled,
  onToggle,
}: {
  coverage: SelectionCoverage;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = coverage === "some";
  }, [coverage]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={styles.selectionCheckbox}
      checked={coverage === "all"}
      disabled={disabled}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      onChange={onToggle}
    />
  );
}
