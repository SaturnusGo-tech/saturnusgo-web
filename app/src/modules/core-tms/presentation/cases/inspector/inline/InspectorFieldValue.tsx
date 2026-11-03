import type { ReactNode } from "react";
import css from "./inlineField.module.css";

export function InspectorFieldValue({ label, children, onEdit }: {
  label: string; children: ReactNode; onEdit?: () => void;
}) {
  return onEdit ? <button type="button" className={css.value} aria-label={label} onClick={onEdit}>
    {children}
  </button> : <div className={css.readValue}>{children}</div>;
}
