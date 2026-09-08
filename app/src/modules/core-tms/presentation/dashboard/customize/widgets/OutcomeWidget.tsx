import type { DashboardSnapshot, DashboardDrill } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import type { CSSProperties } from "react";
import { CompositionBar } from "../../charts/composition/CompositionBar";
import { OUTCOME_COLORS } from "../../charts/model/breakdown-data";
import styles from "./outcomes.module.css";

export function OutcomeWidget({ snapshot, openDrill }: { snapshot: DashboardSnapshot; openDrill: (drill: DashboardDrill) => void }) {
  const { t, locale, languageTag } = useTmsLocale();
  const format = new Intl.NumberFormat(languageTag);
  const total = snapshot.runOutcomes.reduce((sum, item) => sum + item.value, 0);
  return <section className={styles.panel}>
    <header className={styles.heading}><h2>{t("dashboardLayout.outcomes")}</h2>
      <span>{t("dashboard.completedHint", { count: format.format(total) })}</span></header>
    <div className={styles.composition}><CompositionBar items={snapshot.runOutcomes} colors={OUTCOME_COLORS} /></div>
    <div className={styles.outcomes}>{snapshot.runOutcomes.map((item) =>
      <button type="button" key={item.key} onClick={() => openDrill({ ...item.drill, label: localizedLabel(locale, item.key) })}
        style={{ "--outcome-color": OUTCOME_COLORS[item.key] ?? "var(--dash-slate)" } as CSSProperties}
        aria-label={`${localizedLabel(locale, item.key)}: ${format.format(item.value)}`}>
        <i aria-hidden="true" /><span>{localizedLabel(locale, item.key)}</span><strong>{format.format(item.value)}</strong>
      </button>)}</div>
  </section>;
}
