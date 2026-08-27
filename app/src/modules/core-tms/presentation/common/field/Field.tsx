import type { ReactNode } from "react";
import styles from "../../../tms.module.css";

export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`${styles.formField} ${wide ? styles.formFieldWide : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
