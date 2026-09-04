"use client";

import {
  ArrowLeft, ExternalLink as ExternalLinkIcon, Link2, Paperclip, PlayCircle, X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import surface from "../reports.module.css";

export type DetailTab = "overview" | "attachments";

export function DefectReportDetail({ defect, run, links, tab, onTabChange, onBack, onOpenRun }: {
  defect: Defect;
  run?: TestRunSummary;
  links: ExternalLink[];
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onBack: () => void;
  onOpenRun: (runId: string, runItemId: string | null) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const createdAt = new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(defect.createdAt));
  const evidenceCount = defect.attachmentIds.length + links.length;

  return <article className={surface.detail} data-testid="defect-report-detail">
    <header className={surface.detailHeader}>
      <div className={surface.detailUtility}>
        <span className={surface.detailEyebrow}>{locale === "ru" ? "Карточка баг-репорта" : "Bug report"}</span>
        <div className={surface.detailActions}>
          {defect.externalIssue && <a href={defect.externalIssue.url} target="_blank" rel="noreferrer">
            {defect.externalIssue.key}<ExternalLinkIcon size={14} />
          </a>}
          {defect.runId && <button type="button" onClick={() => onOpenRun(defect.runId!, defect.runItemId)}>
            <PlayCircle size={15} />{t("reports.openRun")}
          </button>}
          <button className={surface.mobileBack} type="button" onClick={onBack} aria-label={t("reports.backToList")}><ArrowLeft size={17} /></button>
          <button className={surface.closeButton} type="button" onClick={onBack} aria-label={t("reports.backToList")}><X size={18} /></button>
        </div>
      </div>
      <div className={surface.detailTitle}>
        <h1>{defect.title}<span>#{defect.key}</span></h1>
        <p>
          <span className={surface.statusChip} data-status={defect.status}>{localizedLabel(locale, defect.status)}</span>
          <span>{t("reports.created")} <time dateTime={defect.createdAt}>{createdAt}</time></span>
        </p>
      </div>
      <nav className={surface.tabs} aria-label={locale === "ru" ? "Разделы баг-репорта" : "Bug report sections"}>
        <button type="button" data-active={tab === "overview" || undefined} onClick={() => onTabChange("overview")}>{t("reports.overview")}</button>
        <button type="button" data-active={tab === "attachments" || undefined} onClick={() => onTabChange("attachments")}>{t("reports.attachments")} {evidenceCount > 0 && <span>{evidenceCount}</span>}</button>
      </nav>
    </header>

    <div className={surface.detailScroll}>
      {tab === "overview" ? <div className={surface.overviewLayout}>
        <main className={surface.primaryColumn}>
          <DetailSection title={t("reports.descriptionHeading")}>
            <p>{defect.description || t("reports.noDescription")}</p>
          </DetailSection>
          <DetailSection title={t("reports.actualResult")} accent="danger">
            <p>{defect.actualResult || t("reports.notProvided")}</p>
          </DetailSection>
          <DetailSection title={t("reports.expectedResult")} accent="success">
            <p>{defect.expectedResult || t("reports.notProvided")}</p>
          </DetailSection>
          <DetailSection title={t("reports.executionContext")}>
            {defect.runId ? <dl className={surface.contextList}>
              <div><dt>{t("reports.run")}</dt><dd>{run ? `${run.key} · ${run.name}` : defect.runId}</dd></div>
              <div><dt>{t("reports.runItem")}</dt><dd>{defect.runItemId || "—"}</dd></div>
              <div><dt>{t("reports.step")}</dt><dd>{defect.stepId || "—"}</dd></div>
            </dl> : <p className={surface.mutedText}>{t("reports.noRunContext")}</p>}
          </DetailSection>
        </main>
        <aside className={surface.sideRail} aria-label={t("reports.properties")}>
          <DetailSection title={t("reports.properties")}>
            <dl className={surface.propertyList}>
              <div><dt>{t("reports.status")}</dt><dd><span className={surface.statusChip} data-status={defect.status}>{localizedLabel(locale, defect.status)}</span></dd></div>
              <div><dt>{t("reports.severity")}</dt><dd><span className={surface.severityChip} data-level={defect.severity}>{localizedLabel(locale, defect.severity)}</span></dd></div>
              <div><dt>{t("reports.priority")}</dt><dd><span className={surface.severityChip} data-level={defect.priority}>{localizedLabel(locale, defect.priority)}</span></dd></div>
              <div><dt>{t("reports.reproducibility")}</dt><dd>{defect.reproducibility || "—"}</dd></div>
            </dl>
          </DetailSection>
          <DetailSection title={t("reports.location")}>
            <dl className={surface.propertyList}>
              <div><dt>{t("reports.component")}</dt><dd>{localizedComponentLabel(locale, defect.component) || "—"}</dd></div>
              <div><dt>{t("reports.assignee")}</dt><dd>{defect.assigneeIdentityId || t("common.unassigned")}</dd></div>
              <div><dt>{t("reports.integration")}</dt><dd>{defect.integrationTarget ? localizedLabel(locale, defect.integrationTarget) : "—"}</dd></div>
            </dl>
          </DetailSection>
          <DetailSection title={t("reports.labels")}>
            {defect.labels.length > 0 ? <div className={surface.tagList}>{defect.labels.map((label) => <span key={label}>#{label}</span>)}</div> : <p className={surface.mutedText}>{t("reports.noLabels")}</p>}
          </DetailSection>
        </aside>
      </div> : <section className={surface.attachmentsPanel}>
        <header><div><h2>{t("reports.evidence")}</h2><p>{t("reports.evidenceHint")}</p></div><span><Paperclip size={15} />{evidenceCount}</span></header>
        {evidenceCount > 0 ? <div className={surface.attachmentGallery}>
          {defect.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} presentation="media" variant="gallery" />)}
          {links.map((link) => <a className={surface.externalEvidence} key={link.id} href={link.targetUri} target="_blank" rel="noreferrer"><Link2 size={16} /><span>{link.label}</span><ExternalLinkIcon size={14} /></a>)}
        </div> : <div className={surface.attachmentEmpty}><Paperclip size={24} /><strong>{t("reports.noEvidence")}</strong></div>}
      </section>}
    </div>
  </article>;
}

function DetailSection({ title, accent, children }: {
  title: string;
  accent?: "danger" | "success";
  children: ReactNode;
}) {
  return <section className={surface.detailSection} data-accent={accent}>
    <header><h2>{title}</h2></header>
    <div className={surface.sectionBody}>{children}</div>
  </section>;
}
