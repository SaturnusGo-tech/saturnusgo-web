import { ArrowRight, Bug, Link2 } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import surface from "../dashboard.module.css";

export function DashboardOperations({
  snapshot,
  onOpenDrill,
}: {
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { locale, t } = useTmsLocale();
  const active = snapshot.defects.reduce((sum, item) => sum + item.value, 0);
  const linked: DashboardDrill = {
    id: "defects:linked", label: t("dashboard.linkedDefects"),
    filter: { entity: "defect", basis: "current", hasLink: true },
  };

  return (
    <section className={`${surface.operationsPanel} ${surface.lifecyclePanel}`}>
      <header className={surface.panelHeading}>
        <div><h2>{t("dashboard.defectLifecycle")}</h2><p>{t("dashboard.defectLifecycleHint")}</p></div>
        <button type="button" className={surface.linkMetric} onClick={() => onOpenDrill(linked)}>
          <Link2 size={14} /><strong>{snapshot.metrics.linkedDefects}</strong><span>{t("dashboard.linkedDefects")}</span>
        </button>
      </header>
      {active ? (
        <div className={surface.lifecycleFlow}>
          {snapshot.defects.map((item, index) => {
            const label = localizedLabel(locale, item.key);
            return <div className={surface.lifecycleStep} key={item.key}>
              <button type="button" className={surface[`defect_${item.key}`]} onClick={() => onOpenDrill({ ...item.drill, label })}>
                <span><Bug size={14} />{label}</span><strong>{item.value}</strong>
              </button>
              {index < snapshot.defects.length - 1 && <ArrowRight size={14} aria-hidden="true" />}
            </div>;
          })}
        </div>
      ) : <div className={surface.panelEmpty}><Bug size={22} /><span>{t("dashboard.noDefects")}</span></div>}
    </section>
  );
}
