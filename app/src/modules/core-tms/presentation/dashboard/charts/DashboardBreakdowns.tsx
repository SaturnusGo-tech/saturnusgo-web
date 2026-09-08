"use client";
import { Files } from "lucide-react";
import type { CSSProperties } from "react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { CompositionBar } from "./composition/CompositionBar";
import { coverageGapsFirst, rankedTags, TYPE_COLORS } from "./model/breakdown-data";
import styles from "./breakdowns.module.css";

export function DashboardBreakdowns({ snapshot, onOpenDrill, kind }: {
  kind?: "types" | "tags" | "coverage";
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const format = new Intl.NumberFormat(languageTag);
  const percent = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 1 });
  const types = snapshot.caseTypes.map(item => ({ ...item, label: localizedLabel(locale, item.key) }));
  const tags = rankedTags(snapshot.tags);
  const tagMax = Math.max(...tags.map(item => item.value), 1);
  const coverage = coverageGapsFirst(snapshot.hotspots);
  const allCases: DashboardDrill = { id: "cases:current", label: t("dashboard.currentCases"),
    filter: { entity: "test_case", basis: "current" } };
  const distribution = (items: typeof tags, total: number) => <div className={styles.distribution}>
    {items.map(item => <button type="button" key={item.key} className={styles.distributionRow}
      title={item.label} onClick={() => onOpenDrill({ ...item.drill, label: item.label })}
      style={{ "--row-color": "var(--dash-blue)" } as CSSProperties}
      aria-label={`${item.label}: ${format.format(item.value)}`}>
      <span className={styles.rowLabel}>{item.label}</span>
      <span className={styles.track} aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(0, item.value / Math.max(1, total) * 100))}%` }} /></span>
      <strong>{format.format(item.value)}</strong>
    </button>)}
  </div>;
  return <div className={kind ? styles.single : styles.grid}>
    {(!kind || kind === "types") && <section className={styles.panel}>
      <header className={styles.heading}><h2>{t("dashboard.byType")}</h2></header>
      <button type="button" className={styles.inventory} onClick={() => onOpenDrill(allCases)}
        aria-label={`${t("dashboard.currentCases")}: ${format.format(snapshot.metrics.currentCases)}`}>
        <strong>{format.format(snapshot.metrics.currentCases)}</strong><Files size={36} strokeWidth={1.4} aria-hidden="true" />
      </button>
      <div className={styles.composition}><CompositionBar items={types} colors={TYPE_COLORS} /></div>
      <div className={styles.distribution}>{types.map(item => <button type="button" key={item.key}
        className={styles.typeRow} onClick={() => onOpenDrill({ ...item.drill, label: item.label })}
        style={{ "--row-color": TYPE_COLORS[item.key] ?? "var(--dash-slate)" } as CSSProperties}
        aria-label={`${item.label}: ${format.format(item.value)}`}>
        <i className={styles.dot} aria-hidden="true" /><span className={styles.rowLabel}>{item.label}</span>
        <strong>{format.format(item.value)}</strong>
      </button>)}</div>
    </section>}
    {(!kind || kind === "tags") && <section className={styles.panel}>
      <header className={styles.heading}><h2>{t("dashboard.byTag")}</h2></header>
      {tags.length ? distribution(tags, tagMax) : <p className={styles.empty}>{t("dashboard.noTags")}</p>}
    </section>}
    {(!kind || kind === "coverage") && <section className={styles.panel}>
      <header className={styles.heading}><div><h2>{t("dashboard.coverage")}</h2><p>{t("dashboard.coverageHint")}</p></div></header>
      {coverage.length ? <div className={styles.coverage}>
        {coverage.map(item => <div className={styles.coverageRow} key={item.id} data-gap={item.uncoveredCases > 0}
          style={{ "--row-color": "var(--dash-success)" } as CSSProperties}>
          <button type="button" className={styles.covered} onClick={() => onOpenDrill(item.drills.covered!)}
            aria-label={`${item.label}: ${t("dashboard.coveredOfTotal", { covered: item.coveredCases!, total: item.caseCount })}`}>
            <span className={styles.rowLabel} title={item.label}>{item.label}</span><strong>{percent.format(item.coverageRate)}%</strong>
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
