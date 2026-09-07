import { Bug, CirclePause, PlayCircle, RotateCcw } from "lucide-react";
import type { useDashboardWorkbench } from "../../../dashboards/workbench/application/useDashboardWorkbench";
import type { WorkbenchKind } from "../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import surface from "../dashboard.module.css";

export function DashboardMetrics({ model }: { model: ReturnType<typeof useDashboardWorkbench> }) {
  const { t, languageTag } = useTmsLocale();
  const counts = model.snapshot?.counts;
  const format = new Intl.NumberFormat(languageTag);
  const metrics = [
    { kind: "activeRuns", value: counts?.activeRuns, label: "dashboard.currentActiveRuns", hint: "dashboard.currentActiveRunsHint", icon: PlayCircle },
    { kind: "readyForRetest", value: counts?.readyForRetest, label: "dashboard.currentRetest", hint: "dashboard.currentRetestHint", icon: RotateCcw },
    { kind: "blockedItems", value: counts?.blockedActiveItems, label: "dashboard.currentBlocked", hint: "dashboard.currentBlockedHint", icon: CirclePause },
    { kind: "openDefects", value: counts?.openDefects, label: "dashboard.currentDefects", hint: "dashboard.currentDefectsHint", icon: Bug },
  ] as const;
  return <section className={surface.ledger} aria-label={t("dashboard.currentSummary")} aria-busy={model.loading}>
    {metrics.map(({ kind, value, label, hint, icon: Icon }) => <button key={kind} type="button"
      className={surface.metric} disabled={!counts || model.loading}
      onClick={() => model.openDrill(kind as WorkbenchKind)}>
      <div className={surface.metricContent}><span>{t(label)}</span>
        <strong>{value === undefined ? "—" : format.format(value)}</strong><small>{t(hint)}</small></div>
      <span className={surface.metricIcon} aria-hidden="true"><Icon size={29} strokeWidth={1.25} /></span>
    </button>)}
  </section>;
}
