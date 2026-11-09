import { Link2, ShieldAlert } from "lucide-react";
import type { DashboardDimensionDatum, DashboardDrill, DashboardSnapshot } from "../../../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../localization/format/labels";
import { coverageGapsFirst, DEFECT_COLORS, OUTCOME_COLORS, rankedTags, TYPE_COLORS } from "../../../../charts/model/breakdown-data";
import { WidgetAction, WidgetCard } from "../card/WidgetCard";
import { BarList, DistributionBar, DonutChart, MetricValue, TickBar } from "../../../../../../../../shared/vendor/dashboardcn";
import styles from "../dashboardcn.module.css";

type Props = { title: string; snapshot: DashboardSnapshot; openDrill?: (drill: DashboardDrill) => void };

export function DashboardcnDistribution({ title, snapshot, openDrill, kind }: Props & { kind: "types" | "defects" | "outcomes" }) {
  const { t, locale, languageTag } = useTmsLocale();
  const format = new Intl.NumberFormat(languageTag);
  const source: readonly DashboardDimensionDatum[] = kind === "types" ? snapshot.caseTypes : kind === "defects" ? snapshot.defects : snapshot.runOutcomes;
  const colors = kind === "types" ? TYPE_COLORS : kind === "defects" ? DEFECT_COLORS : OUTCOME_COLORS;
  const segments = source.map(item => ({ ...item, name: localizedLabel(locale, item.key), color: colors[item.key] ?? "var(--dash-slate)" }));
  const total = kind === "types" ? snapshot.metrics.currentCases : segments.reduce((sum, item) => sum + item.value, 0);
  const linked: DashboardDrill = { id: "defects:linked", label: t("dashboard.linkedDefects"), filter: { entity: "defect", basis: "current", hasLink: true } };
  const allCases: DashboardDrill = { id: "cases:current", label: t("dashboard.currentCases"), filter: { entity: "test_case", basis: "current" } };
  const topAction = kind === "defects" ? <WidgetAction className={styles.statAction} onClick={openDrill && (() => openDrill(linked))}>
    <Link2 size={14} aria-hidden="true" /><span>{linked.label}</span><strong>{format.format(snapshot.metrics.linkedDefects)}</strong>
  </WidgetAction> : kind === "types" ? <WidgetAction className={styles.statAction} onClick={openDrill && (() => openDrill(allCases))}>
    <span>{allCases.label}</span><strong>{format.format(total)}</strong>
  </WidgetAction> : undefined;
  const legend = <ul className={styles.legend}>{segments.map(item => <li key={item.key}>
    <WidgetAction className={styles.legendEntry} onClick={openDrill && (() => openDrill({ ...item.drill, label: item.name }))}>
      <i aria-hidden="true" style={{ background: item.color }} /><span>{item.name}</span><strong>{format.format(item.value)}</strong>
    </WidgetAction>
  </li>)}</ul>;
  return <WidgetCard heading={title} actions={topAction} subtitle={kind === "outcomes" ? t("dashboard.completedHint", { count: format.format(total) }) : undefined}>
    {kind === "defects" && total > 0 && <div className={styles.distribution}>
      <MetricValue value={format.format(total)} className={styles.total} />
      <DistributionBar segments={segments} showLegend={false} valueFormatter={format.format} />
    </div>}
    {kind !== "defects" && total > 0 ? <div className={styles.donutLayout}>
      <DonutChart data={segments} centerValue={format.format(total)} valueFormatter={format.format} animate={false} className={styles.donut} />
      {legend}
    </div> : kind === "defects" && !total ? <p className={styles.empty}>{t("dashboard.noDefects")}</p> : legend}
  </WidgetCard>;
}

export function DashboardcnTags({ title, snapshot, openDrill }: Props) {
  const { t, languageTag } = useTmsLocale();
  const tags = rankedTags(snapshot.tags);
  const format = new Intl.NumberFormat(languageTag);
  return <WidgetCard heading={title}>
    {tags.length ? <BarList className={styles.barList} color="var(--dash-blue)" sortOrder="none" valueFormatter={format.format}
      data={tags.map(item => ({ key: item.key, name: item.label, value: item.value }))} onItemClick={openDrill && (item => {
        const tag = tags.find(candidate => candidate.key === item.key);
        if (tag) openDrill({ ...tag.drill, label: tag.label });
      })} /> : <p className={styles.empty}>{t("dashboard.noTags")}</p>}
  </WidgetCard>;
}

export function DashboardcnCoverage({ title, snapshot, openDrill }: Props) {
  const { t, languageTag } = useTmsLocale();
  const coverage = coverageGapsFirst(snapshot.hotspots);
  const format = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 1 });
  return <WidgetCard heading={title} subtitle={t("dashboard.coverageHint")}>
    {coverage.length ? <ul className={styles.coverage}>{coverage.map(item => <li key={item.id}>
      <WidgetAction className={styles.coverageLabel} onClick={openDrill && (() => openDrill(item.drills.covered!))}>
        <span>{item.label}</span><strong>{format.format(item.coverageRate)}%</strong>
      </WidgetAction>
      <TickBar value={item.coverageRate} segments={28} animate={false} color="var(--dash-success)"
        trackColor="var(--control-hover)" aria-label={`${item.label}: ${t("dashboard.coverageRate")}`} className={styles.coverageMeter} />
      <div className={styles.coverageMeta}>
        <span>{t("dashboard.coveredOfTotal", { covered: format.format(item.coveredCases), total: format.format(item.caseCount) })}</span>
        <WidgetAction onClick={openDrill && (() => openDrill(item.drills.uncovered!))}>
          {t("dashboard.uncoveredShort")} <strong>{format.format(item.uncoveredCases)}</strong>
        </WidgetAction>
      </div>
    </li>)}</ul> : <p className={styles.empty}>{t("dashboard.noCoverage")}</p>}
  </WidgetCard>;
}

export function DashboardcnPortfolio({ title, snapshot, openDrill }: Props) {
  const { t, languageTag } = useTmsLocale();
  const format = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 1 });
  const column = snapshot.query.projectId ? t("dashboard.component") : t("dashboard.project");
  const headers = [column, t("dashboard.passRateShort"), t("dashboard.coverageRateShort"),
    t("dashboard.failedItemsShort"), t("dashboard.blockedItemsShort"), t("dashboard.defectsShort")];
  const renderValue = (value: number | null, drill?: DashboardDrill, suffix = "") => value == null ? "—" : <WidgetAction
    onClick={openDrill && drill && (() => openDrill(drill))}><MetricValue value={`${format.format(value)}${suffix}`} /></WidgetAction>;
  return <WidgetCard heading={title} subtitle={t("dashboard.riskHint")}>
    {snapshot.hotspots.length ? <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={title}>
      <table className={styles.table}>
        <thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
        <tbody>{snapshot.hotspots.map(row => <tr key={row.id}>
          <th scope="row"><WidgetAction className={styles.riskName} onClick={openDrill && (() => openDrill(row.drills.cases))}>
            <span>{row.label}</span>{row.projectLabel && row.kind === "component" && <small>{row.projectLabel}</small>}
          </WidgetAction></th>
          <td>{renderValue(row.passRate, row.drills.passed, "%")}</td>
          <td>{row.coverageRate == null ? "—" : <WidgetAction className={styles.riskCoverage}
            onClick={openDrill && row.drills.covered && (() => openDrill(row.drills.covered!))}>
            <TickBar className={styles.riskMeter} value={row.coverageRate} segments={12} animate={false} color="var(--dash-success)" aria-hidden="true" />
            <MetricValue value={`${format.format(row.coverageRate)}%`} />
          </WidgetAction>}</td>
          <td>{renderValue(row.failedItems, row.drills.failures)}</td>
          <td>{renderValue(row.blockedItems, row.drills.blocked)}</td>
          <td><div className={styles.riskDefects}>{renderValue(row.openDefects, row.drills.defects)}
            {row.criticalDefects != null && row.criticalDefects > 0 && <WidgetAction className={styles.critical}
              title={t("dashboard.criticalDefects")} onClick={openDrill && row.drills.criticalDefects && (() => openDrill(row.drills.criticalDefects!))}>
              <ShieldAlert size={13} aria-hidden="true" />{format.format(row.criticalDefects)}
            </WidgetAction>}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div> : <p className={styles.empty}>{t("dashboard.noHotspots")}</p>}
    {snapshot.dataNotes.includes("risk-truncated") && <p className={styles.note}>{t("dashboard.riskLimited", { count: snapshot.hotspots.length })}</p>}
    {snapshot.dataNotes.includes("component-run-attribution-unavailable") && <p className={styles.note}>{t("dashboard.componentAttributionNote")}</p>}
  </WidgetCard>;
}
