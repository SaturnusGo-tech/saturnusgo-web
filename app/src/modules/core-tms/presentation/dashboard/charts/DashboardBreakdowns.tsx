"use client";
import type { CSSProperties } from "react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import styles from "./breakdowns.module.css";

const COLORS = ["var(--dash-teal)", "var(--dash-violet)", "var(--dash-orange)", "var(--dash-cyan)", "var(--dash-rose)", "var(--dash-slate)"];
export function DashboardBreakdowns({ snapshot, onOpenDrill, kind }: {
  kind?: "types" | "tags" | "coverage";
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const format = new Intl.NumberFormat(languageTag);
  const types = snapshot.caseTypes.map(item => ({ ...item, label: localizedLabel(locale, item.key) }));
  const tags = snapshot.tags.slice(0, 6);
  const tagMax = Math.max(...tags.map(item => item.value), 1);
  const coverage = snapshot.hotspots.filter(item => item.coverageRate !== null &&
    item.coveredCases !== null && item.drills.covered && item.drills.uncovered).slice(0, 6);
  const distribution = (items: typeof tags, total: number, tag = false) => <div className={styles.distribution}>
    {items.map((item, index) => <button type="button" key={item.key} className={styles.distributionRow}
      title={item.label} onClick={() => onOpenDrill({ ...item.drill, label: item.label })}
      style={{ "--row-color": COLORS[index % COLORS.length] } as CSSProperties}>
      <span className={styles.rowLabel}>{tag ? `#${item.label}` : item.label}</span>
      <strong>{format.format(item.value)}</strong>
      <span className={styles.track} aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(0, item.value / Math.max(1, total) * 100))}%` }} /></span>
    </button>)}
  </div>;
  return <div className={kind ? styles.single : styles.grid}>
    {(!kind || kind === "types") && <section className={styles.panel}>
      <header className={styles.heading}><h2>{t("dashboard.byType")}</h2><span>{format.format(snapshot.metrics.currentCases)}</span></header>
      {distribution(types, snapshot.metrics.currentCases)}
    </section>}
    {(!kind || kind === "tags") && <section className={styles.panel}>
      <header className={styles.heading}><h2>{t("dashboard.byTag")}</h2></header>
      {tags.length ? distribution(tags, tagMax, true) : <p className={styles.empty}>{t("dashboard.noTags")}</p>}
    </section>}
    {(!kind || kind === "coverage") && <section className={styles.panel}>
      <header className={styles.heading}><div><h2>{t("dashboard.coverage")}</h2><p>{t("dashboard.coverageHint")}</p></div></header>
      {coverage.length ? <div className={styles.coverage}>
        {coverage.map((item, index) => <div className={styles.coverageRow} key={item.id}
          style={{ "--row-color": COLORS[index % COLORS.length] } as CSSProperties}>
          <button type="button" className={styles.covered} onClick={() => onOpenDrill(item.drills.covered!)}
            aria-label={`${item.label}: ${t("dashboard.coveredOfTotal", { covered: item.coveredCases!, total: item.caseCount })}`}>
            <span className={styles.rowLabel} title={item.label}>{item.label}</span><strong>{format.format(item.coverageRate!)}%</strong>
            <span className={styles.track} aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(0, item.coverageRate!))}%` }} /></span>
          </button>
          <div className={styles.coverageDetails}>
            <span>{t("dashboard.coveredOfTotal", { covered: format.format(item.coveredCases!), total: format.format(item.caseCount) })}</span>
            <button type="button" onClick={() => onOpenDrill(item.drills.uncovered!)}
              aria-label={`${item.label}: ${t("dashboard.uncovered")} — ${format.format(item.caseCount - item.coveredCases!)}`}>
              {t("dashboard.uncoveredShort")} <strong>{format.format(item.caseCount - item.coveredCases!)}</strong>
            </button>
          </div>
        </div>)}
      </div> : <p className={styles.empty}>{t("dashboard.noCoverage")}</p>}
    </section>}
  </div>;
}
