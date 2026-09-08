import type { CSSProperties } from "react";
import type { DashboardDimensionDatum } from "../../../../dashboards/model/dashboard-analytics";
import { composition } from "../model/breakdown-data";
import styles from "./composition.module.css";

export function CompositionBar({ items, colors }: {
  items: readonly DashboardDimensionDatum[]; colors: Readonly<Record<string, string>>;
}) {
  return <div className={styles.bar} aria-hidden="true">
    {composition(items).map((item) => <span key={item.key} data-segment={item.key}
      style={{ width: `${item.share}%`, "--segment-color": colors[item.key] ?? "var(--dash-slate)" } as CSSProperties} />)}
  </div>;
}
