import { ExternalLink, Plug, Repeat2, Shapes, TriangleAlert, UserRound } from "lucide-react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { ConnectorTargetLinks } from "../../../../connectors/presentation/links/ConnectorTargetLinks";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedComponentLabel, localizedLabel } from "../../../../localization/format/labels";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { PriorityIcon, priorityLabel } from "../../../common/properties/PriorityIcon";
import { PropertyLabelTokens } from "../../../common/properties/metadata/PropertyLabelField";
import { PropertyValue } from "../../../common/properties/select/PropertySelect";
import { PropertyRow } from "./PropertyRow";
import styles from "./defect-report-properties.module.css";

export function DefectReportProperties({ defect, workspaceId }: { defect: Defect; workspaceId?: string }) {
  const { locale, t } = useTmsLocale();
  const severity = localizedLabel(locale, defect.severity);
  const priority = priorityLabel(locale, defect.priority);
  const component = localizedComponentLabel(locale, defect.component);
  const assignee = t("reports.assignee");

  return <aside className={styles.rail} aria-label={t("reports.properties")}>
    <section className={styles.properties}>
      <h3>{t("reports.properties")}</h3>
      <dl className={styles.list}>
        <PropertyRow label={t("reports.severity")} value={severity}
          icon={<TriangleAlert size={15} aria-hidden="true" className={styles.severity} data-level={defect.severity} />} />
        <PropertyRow label={t("reports.priority")} value={priority} icon={<PriorityIcon level={defect.priority} empty="circle" />} />
        <PropertyRow label={locale === "ru" ? "Повторяемость" : t("reports.reproducibility")} value={defect.reproducibility || "—"} icon={<Repeat2 size={15} aria-hidden="true" />} />
        <PropertyRow label={t("reports.component")} value={component || "—"} icon={<Shapes size={15} aria-hidden="true" />} />
        {workspaceId && defect.assigneeIdentityId ? <div className={`${styles.row} ${styles.assignee}`}>
          <dt><UserRound size={15} aria-hidden="true" /><span>{assignee}</span></dt>
          <dd><PropertyValue label={assignee}>
            <ResponsibleName workspaceId={workspaceId} identityId={defect.assigneeIdentityId} />
          </PropertyValue></dd>
        </div> : <PropertyRow label={assignee} value={t("common.unassigned")} icon={<UserRound size={15} aria-hidden="true" />} />}
      </dl>
    </section>
    {(defect.integrationTarget || defect.externalIssue) && <section className={styles.integration}>
      <h4>{t("reports.integration")}</h4>
      <div className={styles.issueValue}>
        <Plug size={15} aria-hidden="true" />
        {defect.externalIssue ? <a className={styles.issue} href={defect.externalIssue.url} target="_blank" rel="noreferrer"
          title={`YouTrack · ${defect.externalIssue.key}`}><span>YouTrack · {defect.externalIssue.key}</span><ExternalLink size={12} aria-hidden="true" /></a>
          : <span title={t("reports.noIssueLink")}>YouTrack</span>}
      </div>
    </section>}
    {defect.labels.length > 0 && <section className={styles.tags}>
      <h4>{t("reports.labels")}</h4>
      <PropertyLabelTokens locale={locale} labels={defect.labels} />
    </section>}
    {!defect.archivedAt && workspaceId && <ConnectorTargetLinks hideEmpty workspaceId={workspaceId} projectId={defect.projectId} targetId={defect.id} />}
  </aside>;
}
