import { Link2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { CompositionBar } from "../charts/composition/CompositionBar";
import { DEFECT_COLORS } from "../charts/model/breakdown-data";
import styles from "./operations.module.css";

export function DashboardOperations({ snapshot, onOpenDrill }: {
  snapshot: DashboardSnapshot; onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const total = snapshot.defects.reduce((sum, item) => sum + item.value, 0);
  const format = new Intl.NumberFormat(languageTag);
  const linked: DashboardDrill = { id: "defects:linked", label: t("dashboard.linkedDefects"),
    filter: { entity: "defect", basis: "current", hasLink: true } };
  return <section className={styles.panel}>
    <header className={styles.heading}>
      <h2>{t("dashboard.defectLifecycle")}</h2>
      <button type="button" onClick={() => onOpenDrill(linked)}>
        <Link2 size={13} aria-hidden="true" /><span>{t("dashboard.linkedDefects")}</span><strong>{format.format(snapshot.metrics.linkedDefects)}</strong>
      </button>
    </header>
    <div className={styles.summary}><strong>{format.format(total)}</strong>
      <CompositionBar items={snapshot.defects} colors={DEFECT_COLORS} /></div>
    {total ? <div className={styles.statuses}>
      {snapshot.defects.map(item => {
        const label = localizedLabel(locale, item.key);
        return <button type="button" key={item.key} className={styles.status}
          style={{ "--status-color": DEFECT_COLORS[item.key] ?? "var(--dash-slate)" } as CSSProperties}
          aria-label={`${label}: ${format.format(item.value)}`}
          onClick={() => onOpenDrill({ ...item.drill, label })}>
          <i className={styles.dot} aria-hidden="true" /><span title={label}>{label}</span>
          <strong>{format.format(item.value)}</strong>
        </button>;
      })}
    </div> : <p className={styles.empty}>{t("dashboard.noDefects")}</p>}
  </section>;
}
