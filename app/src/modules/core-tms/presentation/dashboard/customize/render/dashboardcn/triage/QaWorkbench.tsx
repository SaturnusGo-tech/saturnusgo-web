import { ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { DashboardSegments, dashboardTabId } from "../../../../common/segments/DashboardSegments";
import type { DashboardViewProps } from "../../../../dashboard-view";
import { WorkbenchStatus } from "../../../../workbench/controls/WorkbenchStatus";
import { WorkbenchRows } from "../../../../workbench/rows/WorkbenchRows";
import { WidgetAction } from "../card/WidgetCard";
import type { Workbench } from "../workbench/DashboardcnWorkbench";
import { triageCopy } from "./copy/triage-copy";
import shared from "../dashboardcn.module.css";
import styles from "./triage.module.css";

const reasons = ["readyForRetest", "blockedItems", "outdatedItems", "runsWithoutBuild", "activeRuns"] as const;

export function QaWorkbench({ model, onOpenRow }: { model: Workbench; onOpenRow?: DashboardViewProps["onOpenRow"] }) {
  const { locale, t, languageTag } = useTmsLocale();
  const copy = triageCopy[locale];
  const panelId = useId();
  const [reason, setReason] = useState<(typeof reasons)[number] | null>(null);
  const queues = model.snapshot?.queues;
  const selected = reason ?? reasons.find(key => (queues?.[key].total ?? 0) > 0) ?? reasons[0];
  const queue = queues?.[selected];
  const rows = queue?.rows.slice(0, 3) ?? [];
  const format = new Intl.NumberFormat(languageTag);
  return <section className={styles.workbench} aria-label={copy.checks} aria-busy={model.loading}>
    <DashboardSegments<(typeof reasons)[number]> label={copy.checks} panelId={panelId} selectedKey={selected} listClassName={styles.tabs}
      onSelect={setReason} items={reasons.map(key => ({
        key, label: copy.reasons[key], badge: queues ? format.format(queues[key].total) : "—",
      }))} />
    <div className={styles.workbenchPanel} role="tabpanel" id={panelId} aria-labelledby={dashboardTabId(panelId, selected)} tabIndex={0}>
      <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={Boolean(model.snapshot)}
        enabled={model.enabled} onRetry={model.refresh} />
      {queue && <>
        <p className={styles.context}>{copy.hints[selected]}</p>
        <WorkbenchRows queue={{ ...queue, rows }} onOpenRow={onOpenRow} detail />
        {queue.total > 0 && <div className={shared.queueFooter}>
          <span>{t("dashboardWorkbench.totalRows", { shown: rows.length, total: queue.total })}</span>
          {model.openDrill && <WidgetAction onClick={() => model.openDrill?.(selected)}>
            {t("dashboardWorkbench.viewAll")} <ArrowUpRight size={13} aria-hidden="true" />
          </WidgetAction>}
        </div>}
      </>}
    </div>
  </section>;
}
