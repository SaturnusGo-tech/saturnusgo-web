import type { ReactNode } from "react";
import { PropertyValue } from "../../../common/properties/select/PropertySelect";
import styles from "./defect-report-properties.module.css";

export function PropertyRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className={styles.row} title={`${label} · ${value}`}>
    <dt>{icon}<span>{label}</span></dt>
    <dd><PropertyValue label={label}><span>{value}</span></PropertyValue></dd>
  </div>;
}
