import { AlertTriangle, ChevronRight, Info } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import surface from "../dashboard.module.css";

export function DashboardPortfolio({
  snapshot,
  onOpenDrill,
}: {
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { t } = useTmsLocale();
  const scopeLabel = snapshot.query.projectId ? t("dashboard.component") : t("dashboard.project");

  return (
    <section className={`${surface.operationsPanel} ${surface.portfolioPanel}`}>
      <header className={surface.panelHeading}>
        <div><h2>{t("dashboard.riskHotspots")}</h2><p>{t("dashboard.riskHint")}</p></div>
        <AlertTriangle size={17} aria-hidden="true" />
      </header>
      {snapshot.hotspots.length ? (
        <div className={surface.hotspotTable} role="table" aria-label={t("dashboard.riskHotspots")}>
          <div className={surface.hotspotHeader} role="row">
            <span role="columnheader" title={scopeLabel}>{scopeLabel}</span>
            <span role="columnheader" aria-label={t("dashboard.passRate")} title={t("dashboard.passRate")}>{t("dashboard.passRateShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.coverageRate")} title={t("dashboard.coverageRate")}>{t("dashboard.coverageRateShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.failedItems")} title={t("dashboard.failedItems")}>{t("dashboard.failedItemsShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.blockedItems")} title={t("dashboard.blockedItems")}>{t("dashboard.blockedItemsShort")}</span>
            <span role="columnheader" aria-label={t("dashboard.defects")} title={t("dashboard.defects")}>{t("dashboard.defectsShort")}</span>
          </div>
          {snapshot.hotspots.map((row) => (
            <div className={surface.hotspotRow} role="row" key={row.id}>
              <div role="cell"><button type="button" className={surface.hotspotName} onClick={() => onOpenDrill(row.drills.cases)}>
                <span><strong>{row.label}</strong>{row.projectLabel && row.kind === "component" && <small>{row.projectLabel}</small>}</span><ChevronRight size={14} aria-hidden="true" />
              </button></div>
              <div role="cell">{row.passRate !== null && row.drills.passed ? <button type="button" className={surface.riskCell} onClick={() => onOpenDrill(row.drills.passed!)} aria-label={`${t("dashboard.passRate")}: ${row.passRate}%`}>
                <progress value={row.passRate} max={100} /><strong>{row.passRate}%</strong>
              </button> : <span className={surface.signalUnavailable}>—</span>}</div>
              <div role="cell">{row.coverageRate !== null && row.drills.covered ? <button type="button" className={surface.riskCell} onClick={() => onOpenDrill(row.drills.covered!)} aria-label={`${t("dashboard.coverageRate")}: ${row.coverageRate}%`}>
                <progress value={row.coverageRate} max={100} /><strong>{row.coverageRate}%</strong>
              </button> : <span className={surface.signalUnavailable}>—</span>}</div>
              <div role="cell">{row.drills.failures ? <button type="button" className={surface.signalCell} onClick={() => onOpenDrill(row.drills.failures!)}>{row.failedItems}</button>
                : <span className={surface.signalUnavailable} title={t("dashboard.unavailable")}>—</span>}</div>
              <div role="cell">{row.drills.blocked ? <button type="button" className={surface.signalCell} onClick={() => onOpenDrill(row.drills.blocked!)}>{row.blockedItems}</button>
                : <span className={surface.signalUnavailable} title={t("dashboard.unavailable")}>—</span>}</div>
              <div role="cell" className={surface.defectSignals}>
                {row.drills.defects && <button type="button" onClick={() => onOpenDrill(row.drills.defects!)} aria-label={`${t("dashboard.openDefects")}: ${row.openDefects}`}>{row.openDefects}</button>}
                {row.drills.criticalDefects && <button type="button" className={surface.criticalSignal} onClick={() => onOpenDrill(row.drills.criticalDefects!)} aria-label={`${t("dashboard.criticalDefects")}: ${row.criticalDefects}`}>C {row.criticalDefects}</button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className={surface.panelEmpty}>{t("dashboard.noHotspots")}</p>}
      {snapshot.dataNotes.includes("component-run-attribution-unavailable") && (
        <p className={surface.dataNote}><Info size={14} />{t("dashboard.componentAttributionNote")}</p>
      )}
    </section>
  );
}
