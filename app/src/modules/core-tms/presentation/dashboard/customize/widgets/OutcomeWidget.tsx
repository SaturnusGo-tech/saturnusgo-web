import type { DashboardSnapshot, DashboardDrill } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import surface from "../../dashboard.module.css";
import styles from "../layout.module.css";

export function OutcomeWidget({ snapshot, openDrill }: { snapshot: DashboardSnapshot; openDrill: (drill: DashboardDrill) => void }) {
  const { t, locale } = useTmsLocale();
  return <section className={surface.chartPanel}>
    <header className={surface.panelHeading}><h2>{t("dashboardLayout.outcomes")}</h2></header>
    <div className={styles.outcomes}>{snapshot.runOutcomes.map((item) =>
      <button type="button" key={item.key} onClick={() => openDrill({ ...item.drill, label: localizedLabel(locale, item.key) })}>
        <span>{localizedLabel(locale, item.key)}</span><strong>{item.value}</strong>
      </button>)}</div>
  </section>;
}
