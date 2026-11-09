"use client";

import { useId, useState } from "react";
import type { WorkbenchScope } from "../../../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { DashboardSegments, dashboardTabId } from "../../../../common/segments/DashboardSegments";
import type { DashboardViewProps } from "../../../../dashboard-view";
import type { Workbench } from "../workbench/DashboardcnWorkbench";
import { triageCopy } from "./copy/triage-copy";
import { DefectIntake } from "./intake/DefectIntake";
import { QaWorkbench } from "./QaWorkbench";
import styles from "./triage.module.css";

type Props = {
  title: string;
  projectName?: string;
  model: Workbench;
  onOpenRow?: DashboardViewProps["onOpenRow"];
  interactive?: boolean;
  canManageDefects?: boolean;
  scope?: WorkbenchScope;
  onTriageChange?: () => void;
};
type Surface = "inbox" | "snoozed" | "checks";

export function DashboardcnTriage({ title, projectName, model, onOpenRow, interactive = false, canManageDefects = false,
  scope = model.snapshot?.scope, onTriageChange = model.refresh }: Props) {
  const { locale } = useTmsLocale();
  const copy = triageCopy[locale];
  const [surface, setSurface] = useState<Surface>("inbox");
  const panelId = useId();
  const regionLabel = projectName ? `${title} · ${projectName}` : title;
  return <section className={styles.shell} aria-label={regionLabel} data-triage-surface={surface}>
    <header className={styles.toolbar}>
      <h2>{copy.triage}</h2>
      {interactive && <DashboardSegments<Surface> label={copy.triage} panelId={panelId}
        selectedKey={surface} listClassName={styles.surfaceTabs} tabClassName={styles.surfaceTab}
        onSelect={setSurface} items={[
          { key: "inbox", label: copy.inbox }, { key: "snoozed", label: copy.snoozed }, { key: "checks", label: copy.qaChecks },
        ]} />}
    </header>
    {interactive ? <div id={panelId} role="tabpanel" aria-labelledby={dashboardTabId(panelId, surface)} tabIndex={0}>
      <div key={surface} className={styles.panelContent}>
        {surface === "checks" ? <QaWorkbench model={model} onOpenRow={onOpenRow} />
          : scope?.projectId ? <DefectIntake key={JSON.stringify([scope.workspaceId, scope.projectId])} view={surface}
            scope={{ workspaceId: scope.workspaceId, projectId: scope.projectId }} canManage={canManageDefects}
            onChange={onTriageChange} onOpenRow={onOpenRow} />
          : <p className={styles.placeholder}>{copy.chooseProject}</p>}
      </div>
    </div> : <p className={styles.placeholder}>{copy.preview}</p>}
  </section>;
}
