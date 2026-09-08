import { Link2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import styles from "./operations.module.css";

const COLORS: Record<string, string> = { open: "var(--dash-slate)", triaged: "var(--dash-violet)",
  in_progress: "var(--dash-orange)", ready_for_retest: "var(--dash-blue)", verified: "var(--dash-success)",
  closed: "var(--dash-teal)", reopened: "var(--dash-danger)" };
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
      <h2>{t("dashboard.defectLifecycle")}<span>{format.format(total)}</span></h2>
      <button type="button" onClick={() => onOpenDrill(linked)}>
        <Link2 size={13} aria-hidden="true" /><span>{t("dashboard.linkedDefects")}</span><strong>{format.format(snapshot.metrics.linkedDefects)}</strong>
      </button>
    </header>
    {total ? <div className={styles.statuses}>
      {snapshot.defects.map(item => {
        const label = localizedLabel(locale, item.key);
        return <button type="button" key={item.key} className={styles.status}
          style={{ "--status-color": COLORS[item.key] ?? "var(--dash-slate)" } as CSSProperties}
          onClick={() => onOpenDrill({ ...item.drill, label })}>
          <i className={styles.dot} aria-hidden="true" /><span title={label}>{label}</span>
          <i className={styles.track} aria-hidden="true"><i style={{ width: `${item.value / total * 100}%` }} /></i>
          <strong>{format.format(item.value)}</strong>
        </button>;
      })}
    </div> : <p className={styles.empty}>{t("dashboard.noDefects")}</p>}
  </section>;
}
