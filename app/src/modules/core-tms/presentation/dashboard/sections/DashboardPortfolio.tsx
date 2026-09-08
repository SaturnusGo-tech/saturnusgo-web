import { Layers, ChevronRight, Info, ShieldAlert } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import surface from "./portfolio.module.css";


export function DashboardPortfolio({
  snapshot,
  onOpenDrill,
}: {
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { t, languageTag } = useTmsLocale();
  const format = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 1 });
  const scopeLabel = snapshot.query.projectId ? t("dashboard.component") : t("dashboard.project");

  return (
    <section className={`${surface.operationsPanel} ${surface.portfolioPanel}`}>
      <header className={surface.panelHeading}>
        <div><h2>{t("dashboard.riskHotspots")}</h2><p>{t("dashboard.riskHint")}</p></div>
        <Layers size={17} aria-hidden="true" />
      </header>
      {snapshot.hotspots.length ? (
        <div className={surface.hotspotTable} role="table" aria-label={t("dashboard.riskHotspots")}
          aria-colcount={6} aria-rowcount={snapshot.hotspots.length + 1}>
          <div className={surface.hotspotHeader} role="row">
            <span role="columnheader" title={scopeLabel}>{scopeLabel}</span>
            <span role="columnheader" aria-label={t("dashboard.passRate")} title={t("dashboard.passRate")}>{t("dashboard.passRateShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.coverageRate")} title={t("dashboard.coverageRate")}>{t("dashboard.coverageRateShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.failedItems")} title={t("dashboard.failedItems")}>{t("dashboard.failedItemsShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.blockedItems")} title={t("dashboard.blockedItems")}>{t("dashboard.blockedItemsShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.defects")} title={t("dashboard.defects")}>{t("dashboard.defectsShort")}</span>
          </div>
          {snapshot.hotspots.map((row) => (
            <div className={surface.hotspotRow} role="row" key={row.id}
              data-risk={(row.criticalDefects ?? 0) > 0 || (row.failedItems ?? 0) > 0 ? "failed"
                : (row.blockedItems ?? 0) > 0 ? "blocked" : (row.openDefects ?? 0) > 0 ? "open" : "clear"}>
              <div role="cell"><button type="button" className={surface.hotspotName} onClick={() => onOpenDrill(row.drills.cases)}>
                <i className={surface.riskDot} aria-hidden="true" />
                <span><strong title={row.label}>{row.label}</strong>
                  {row.projectLabel && row.kind === "component" && <small>{row.projectLabel}</small>}</span><ChevronRight size={14} aria-hidden="true" />
              </button></div>
              <div role="cell">{row.passRate !== null && row.drills.passed ? <button type="button" className={surface.passRateScore} onClick={() => onOpenDrill(row.drills.passed!)} aria-label={`${t("dashboard.passRate")}: ${row.passRate}%`}>
                <strong>{format.format(row.passRate)}%</strong>
              </button> : <span className={surface.signalUnavailable}>—</span>}</div>
              <div role="cell">{row.coverageRate !== null && row.drills.covered ? <button type="button" className={surface.coverageCell} onClick={() => onOpenDrill(row.drills.covered!)} aria-label={`${t("dashboard.coverageRate")}: ${row.coverageRate}%`}>
                <progress value={row.coverageRate} max={100} aria-label={`${row.label}: ${t("dashboard.coverageRate")}`}
                  title={row.coveredCases === null ? undefined : t("dashboard.coveredOfTotal", { covered: format.format(row.coveredCases), total: format.format(row.caseCount) })} />
                <strong>{format.format(row.coverageRate)}%</strong>
              </button> : <span className={surface.signalUnavailable}>—</span>}</div>
              <div role="cell">{row.drills.failures && row.failedItems !== null ? <button type="button" className={surface.signalCell} data-active={row.failedItems > 0} onClick={() => onOpenDrill(row.drills.failures!)} aria-label={`${row.label}: ${t("dashboard.failedItems")} — ${format.format(row.failedItems)}`}>{format.format(row.failedItems)}</button>
                : <span className={surface.signalUnavailable} title={t("dashboard.unavailable")}>—</span>}</div>
              <div role="cell">{row.drills.blocked && row.blockedItems !== null ? <button type="button" className={surface.signalCell} data-active={row.blockedItems > 0} onClick={() => onOpenDrill(row.drills.blocked!)} aria-label={`${row.label}: ${t("dashboard.blockedItems")} — ${format.format(row.blockedItems)}`}>{format.format(row.blockedItems)}</button>
                : <span className={surface.signalUnavailable} title={t("dashboard.unavailable")}>—</span>}</div>
              <div role="cell" className={surface.defectSignals}>
                {row.drills.defects && row.openDefects !== null ? <button type="button" data-active={row.openDefects > 0} onClick={() => onOpenDrill(row.drills.defects!)} aria-label={`${row.label}: ${t("dashboard.openDefects")}: ${format.format(row.openDefects)}`}>{format.format(row.openDefects)}</button>
                  : <span className={surface.signalUnavailable} title={t("dashboard.unavailable")}>—</span>}
                {(row.criticalDefects ?? 0) > 0 && row.drills.criticalDefects && <button type="button" className={surface.criticalSignal} onClick={() => onOpenDrill(row.drills.criticalDefects!)} aria-label={`${t("dashboard.criticalDefects")}: ${row.criticalDefects}`}>
                  <ShieldAlert size={11} aria-hidden="true" /><span>{row.criticalDefects}</span>
                </button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className={surface.panelEmpty}>{t("dashboard.noHotspots")}</p>}
      {snapshot.dataNotes.includes("risk-truncated") && <p className={surface.dataNote}><Info size={14} />{t("dashboard.riskLimited", { count: snapshot.hotspots.length })}</p>}
      {snapshot.dataNotes.includes("component-run-attribution-unavailable") && (
        <p className={surface.dataNote}><Info size={14} />{t("dashboard.componentAttributionNote")}</p>
      )}
    </section>
  );
}
