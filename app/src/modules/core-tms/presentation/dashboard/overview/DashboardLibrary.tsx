import { ChevronDown, Library } from "lucide-react";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { DashboardBreakdowns } from "../charts/DashboardBreakdowns";
import { DashboardOperations } from "../sections/DashboardOperations";
import surface from "../dashboard.module.css";

export function DashboardLibrary({ snapshot, onOpenDrill }: {
  snapshot: DashboardSnapshot; onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { t } = useTmsLocale();
  return <details className={surface.library}>
    <summary><Library size={18} aria-hidden="true" /><span><strong>{t("dashboard.libraryTitle")}</strong>
      <small>{t("dashboard.libraryHint", { cases: snapshot.metrics.currentCases, defects: snapshot.metrics.currentDefects })}</small></span>
      <ChevronDown size={17} className={surface.disclosureIcon} aria-hidden="true" /></summary>
    <div className={surface.libraryBody}><DashboardBreakdowns snapshot={snapshot} onOpenDrill={onOpenDrill} />
      <DashboardOperations snapshot={snapshot} onOpenDrill={onOpenDrill} /></div>
  </details>;
}
