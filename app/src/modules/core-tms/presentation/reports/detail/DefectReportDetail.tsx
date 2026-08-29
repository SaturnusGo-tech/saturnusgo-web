import {
  ArrowLeft, Bug, CalendarDays, ExternalLink as ExternalLinkIcon,
  Link2, ListChecks, Paperclip, PlayCircle,
} from "lucide-react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import styles from "../../../tms.module.css";
import surface from "../reports.module.css";

export function DefectReportDetail({ defect, run, links, onBack, onOpenRun }: {
  defect: Defect;
  run?: TestRunSummary;
  links: ExternalLink[];
  onBack: () => void;
  onOpenRun: (runId: string, runItemId: string | null) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const date = new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(defect.createdAt));
  const hasEvidence = defect.attachmentIds.length > 0 || links.length > 0;

  return <article className={`${styles.pageScroll} ${surface.page} ${surface.detail}`} data-testid="defect-report-detail">
    <button className={surface.backButton} type="button" onClick={onBack}><ArrowLeft size={16} />{t("reports.backToList")}</button>
    <header className={surface.detailHeader}>
      <div className={surface.detailHeading}>
        <span className={surface.detailKey}><Bug size={15} />{defect.key}</span>
        <h1>{defect.title}</h1>
        <p>{defect.description || t("reports.noDescription")}</p>
      </div>
      {defect.runId && <button className={styles.primaryButton} type="button" onClick={() => onOpenRun(defect.runId!, defect.runItemId)}>
        <PlayCircle size={16} />{t("reports.openRun")}
      </button>}
    </header>

    <dl className={surface.detailMeta}>
      <div><dt>{t("reports.status")}</dt><dd>{localizedLabel(locale, defect.status)}</dd></div>
      <div><dt>{t("reports.severity")}</dt><dd className={surface.severity} data-level={defect.severity}>{localizedLabel(locale, defect.severity)}</dd></div>
      <div><dt>{t("reports.priority")}</dt><dd>{localizedLabel(locale, defect.priority)}</dd></div>
      <div><dt>{t("reports.component")}</dt><dd>{localizedComponentLabel(locale, defect.component) || "—"}</dd></div>
      <div><dt>{t("reports.reproducibility")}</dt><dd>{defect.reproducibility || "—"}</dd></div>
      <div><dt>{t("reports.assignee")}</dt><dd>{defect.assigneeIdentityId || t("common.unassigned")}</dd></div>
    </dl>

    <div className={surface.detailColumns}>
      <section className={surface.detailSection}>
        <h2>{t("reports.expectedResult")}</h2>
        <p>{defect.expectedResult || t("reports.notProvided")}</p>
      </section>
      <section className={`${surface.detailSection} ${surface.actualSection}`}>
        <h2>{t("reports.actualResult")}</h2>
        <p>{defect.actualResult || t("reports.notProvided")}</p>
      </section>
    </div>

    <section className={surface.contextSection}>
      <h2><ListChecks size={17} />{t("reports.executionContext")}</h2>
      {defect.runId ? <dl className={surface.contextList}>
        <div><dt>{t("reports.run")}</dt><dd>{run ? `${run.key} · ${run.name}` : defect.runId}</dd></div>
        <div><dt>{t("reports.runItem")}</dt><dd>{defect.runItemId || "—"}</dd></div>
        <div><dt>{t("reports.step")}</dt><dd>{defect.stepId || "—"}</dd></div>
        <div><dt><CalendarDays size={14} />{t("reports.created")}</dt><dd><time dateTime={defect.createdAt}>{date}</time></dd></div>
      </dl> : <p className={surface.mutedText}>{t("reports.noRunContext")}</p>}
    </section>

    <section className={surface.evidenceSection}>
      <div className={surface.sectionHeading}><h2><Paperclip size={17} />{t("reports.evidence")}</h2><span>{defect.attachmentIds.length + links.length}</span></div>
      {hasEvidence ? <div className={surface.detailEvidence}>
        {defect.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}
        {links.map((link) => <a key={link.id} href={link.targetUri} target="_blank" rel="noreferrer"><Link2 size={14} /><span>{link.label}</span><ExternalLinkIcon size={13} /></a>)}
      </div> : <p className={surface.mutedText}>{t("reports.noEvidence")}</p>}
    </section>

    <section className={surface.labelsSection}>
      <h2>{t("reports.labels")}</h2>
      <p>{defect.labels.length > 0 ? defect.labels.map((label) => `#${label}`).join("  ") : t("reports.noLabels")}</p>
    </section>
  </article>;
}
