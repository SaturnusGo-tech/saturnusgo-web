import { Archive, ExternalLink, Plug, Repeat2, Shapes, TriangleAlert, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { ConnectorTargetLinks } from "../../../../connectors/presentation/links/ConnectorTargetLinks";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedComponentLabel, localizedLabel } from "../../../../localization/format/labels";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import rail from "../../../cases/inspector/propertyRail.module.css";
import { DefectStatusIcon } from "../../../common/properties/defect/DefectStatusIcon";
import { PriorityIcon, priorityLabel } from "../../../common/properties/PriorityIcon";
import { PropertyLabelTokens } from "../../../common/properties/metadata/PropertyLabelField";
import { PropertyValue } from "../../../common/properties/select/PropertySelect";
import detail from "../defect-detail.module.css";

export function DefectReportProperties({ defect, workspaceId }: { defect: Defect; workspaceId?: string }) {
  const { locale, t } = useTmsLocale();
  const archived = locale === "ru" ? "В архиве" : "Archived";
  const status = localizedLabel(locale, defect.status);
  const severity = localizedLabel(locale, defect.severity);
  const priority = priorityLabel(locale, defect.priority);
  const component = localizedComponentLabel(locale, defect.component);
  const assignee = t("reports.assignee");

  return <aside className={detail.rail} aria-label={t("reports.properties")}>
    <section className={detail.properties}>
      <h3>{t("reports.properties")}</h3>
      <dl className={`${rail.rows} ${detail.propertiesList}`}>
        <PropertyRow label={t("reports.status")} value={status} icon={<DefectStatusIcon status={defect.status} />} />
        {defect.archivedAt && <PropertyRow label={locale === "ru" ? "Архивный статус" : "Archive status"} icon={<Archive size={15} aria-hidden="true" />} value={archived} />}
        <PropertyRow label={t("reports.severity")} value={severity}
          icon={<TriangleAlert size={15} aria-hidden="true" className={detail.severity} data-level={defect.severity} />} />
        <PropertyRow label={t("reports.priority")} value={priority} icon={<PriorityIcon level={defect.priority} />} />
        <PropertyRow label={t("reports.reproducibility")} value={defect.reproducibility || "—"} icon={<Repeat2 size={15} aria-hidden="true" />} />
        <PropertyRow label={t("reports.component")} value={component || "—"} icon={<Shapes size={15} aria-hidden="true" />} />
        {workspaceId && defect.assigneeIdentityId ? <div className={detail.assignee}>
          <dt>{assignee}</dt>
          <dd><PropertyValue label={assignee}>
            <ResponsibleName workspaceId={workspaceId} identityId={defect.assigneeIdentityId} />
          </PropertyValue></dd>
        </div> : <PropertyRow label={assignee} value={t("common.unassigned")} icon={<UserRound size={15} aria-hidden="true" />} />}
        {(defect.integrationTarget || defect.externalIssue) && <div>
          <dt>{t("reports.integration")}</dt>
          <dd><PropertyValue label={t("reports.integration")}>
            <Plug size={15} aria-hidden="true" />
            {defect.externalIssue ? <a className={detail.issue} href={defect.externalIssue.url} target="_blank" rel="noreferrer"
              title={`YouTrack · ${defect.externalIssue.key}`}><span>YouTrack · {defect.externalIssue.key}</span><ExternalLink size={12} aria-hidden="true" /></a>
              : <span title={t("reports.noIssueLink")}>YouTrack</span>}
          </PropertyValue></dd>
        </div>}
      </dl>
    </section>
    {defect.labels.length > 0 && <section className={rail.tags}>
      <h4>{t("reports.labels")}</h4>
      <PropertyLabelTokens locale={locale} labels={defect.labels} />
    </section>}
    {!defect.archivedAt && workspaceId && <ConnectorTargetLinks workspaceId={workspaceId} projectId={defect.projectId} targetId={defect.id} />}
  </aside>;
}

function PropertyRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div title={`${label} · ${value}`}>
    <dt>{label}</dt>
    <dd><PropertyValue label={label}>{icon}<span>{value}</span></PropertyValue></dd>
  </div>;
}
