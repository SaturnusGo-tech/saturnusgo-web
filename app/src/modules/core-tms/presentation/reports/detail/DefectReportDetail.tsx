"use client";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";

import {
  ArrowLeft, CircleDashed, ExternalLink as ExternalLinkIcon, Link2, Paperclip, X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { ConnectorTargetLinks } from "../../../connectors/presentation/links/ConnectorTargetLinks";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel, localizedLabel } from "../../../localization/format/labels";
import { DefectDiscussion } from "./discussion/DefectDiscussion";
import { CommentShareItem } from "../../cases/collaboration/sharing/CommentShareItem";
import { buildDefectDeepLink } from "../../../defects/navigation/defect-deep-link";
import type { DefectRetest } from "../../../runs/verification/state/defect/useDefectRetest";
import { DefectRetestAction } from "./retest/DefectRetestAction";
import surface from "../reports.module.css";
import detail from "./defect-detail.module.css";

export type DetailTab = "overview" | "attachments";

export function DefectReportDetail({ workspaceId, defect, run, links, tab, onTabChange, onBack, onOpenRun, retest, connected = false, canComment = false }: {
  retest?: DefectRetest;
  connected?: boolean; canComment?: boolean;
  workspaceId?: string;
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
        <div className={detail.actions}>
          <CommentShareItem key={defect.id} compact resource="defect" ru={locale === "ru"}
            visibleLabel={locale === "ru" ? "Ссылка на дефект" : "Bug report link"} link={() => {
            const url = new URL(window.location.href); if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
            return buildDefectDeepLink(url.href, { projectId: defect.projectId, defectId: defect.id });
          }} />
          {retest && <DefectRetestAction retest={retest} defectKey={defect.key} />}
          <button className={surface.mobileBack} type="button" onClick={onBack} aria-label={t("reports.backToList")}><ArrowLeft size={17} /></button>
          <button className={surface.closeButton} type="button" onClick={onBack} aria-label={t("reports.backToList")}><X size={18} /></button>
        </div>
      </div>
      <div className={surface.detailTitle}>
        <h1>{defect.title}<span>#{defect.key}</span></h1>
        <p>
          <span className={surface.statusChip} data-status={defect.status}>
            {defect.status === "open" ? <CircleDashed size={13} aria-hidden="true" /> : defect.status === "ready_for_retest" ? null : <span aria-hidden="true" />}
            {localizedLabel(locale, defect.status)}
          </span>
          <span>{t("reports.created")} <time dateTime={defect.createdAt}>{createdAt}</time></span>
        </p>
      </div>
      <nav className={surface.tabs} aria-label={locale === "ru" ? "Разделы баг-репорта" : "Bug report sections"}>
        <button type="button" data-active={tab === "overview" || undefined} onClick={() => onTabChange("overview")}>{t("reports.overview")}</button>
        <button type="button" data-active={tab === "attachments" || undefined} onClick={() => onTabChange("attachments")}>{t("reports.attachments")} {evidenceCount > 0 && <span>{evidenceCount}</span>}</button>
      </nav>
    </header>

    <div className={surface.detailScroll}>
      {tab === "overview" ? <div className={`${surface.overviewLayout} ${detail.overview}`}>
        <main className={surface.primaryColumn}>
          <DetailSection title={t("reports.descriptionHeading")}>
            <MarkdownField value={defect.description} label={t("reports.descriptionHeading")} emptyLabel={t("reports.noDescription")} allowAttachments={false} />
          </DetailSection>
          <DetailSection title={t("reports.actualResult")} accent="danger">
            <p>{defect.actualResult || t("reports.notProvided")}</p>
          </DetailSection>
          <DetailSection title={t("reports.expectedResult")} accent="success">
            <MarkdownField value={defect.expectedResult} label={t("reports.expectedResult")} emptyLabel={t("reports.notProvided")} allowAttachments={false} />
          </DetailSection>
          <DetailSection title={t("reports.executionContext")}>
            {defect.runId ? <dl className={surface.contextList}>
              <div><dt>{locale === "ru" ? "Исходный прогон" : "Original run"}</dt><dd><button type="button" className={detail.originLink}
                onClick={() => onOpenRun(defect.runId!, defect.runItemId)}>{run ? `${run.key} · ${run.name}` : defect.runId}</button></dd></div>
              <div><dt>{t("reports.runItem")}</dt><dd>{defect.runItemId || "—"}</dd></div>
              <div><dt>{t("reports.step")}</dt><dd>{defect.stepId || "—"}</dd></div>
            </dl> : <p className={surface.mutedText}>{t("reports.noRunContext")}</p>}
          </DetailSection>
        </main>
        <aside className={surface.sideRail} aria-label={t("reports.properties")}>
          <DetailSection title={t("reports.properties")}>
            <dl className={surface.propertyList}>
              <div><dt>{t("reports.status")}</dt><dd><span className={surface.statusChip} data-status={defect.status}>
                {defect.status === "open" ? <CircleDashed size={13} aria-hidden="true" /> : defect.status === "ready_for_retest" ? null : <span aria-hidden="true" />}
                {localizedLabel(locale, defect.status)}
              </span></dd></div>
              <div><dt>{t("reports.severity")}</dt><dd><span className={surface.severityChip} data-level={defect.severity}>{localizedLabel(locale, defect.severity)}</span></dd></div>
              <div><dt>{t("reports.priority")}</dt><dd><span className={surface.severityChip} data-level={defect.priority}>{localizedLabel(locale, defect.priority)}</span></dd></div>
              <div><dt>{t("reports.reproducibility")}</dt><dd>{defect.reproducibility || "—"}</dd></div>
            </dl>
          </DetailSection>
          <DetailSection title={t("reports.location")}>
            <dl className={surface.propertyList}>
              <div><dt>{t("reports.component")}</dt><dd>{localizedComponentLabel(locale, defect.component) || "—"}</dd></div>
              <div><dt>{t("reports.assignee")}</dt><dd>{workspaceId ? <ResponsibleName workspaceId={workspaceId} identityId={defect.assigneeIdentityId} /> : t("common.unassigned")}</dd></div>
              <div><dt>{t("reports.integration")}</dt><dd>{defect.integrationTarget ? "YouTrack" :
                locale === "ru" ? "Интеграции проекта" : "Project integrations"}</dd></div>
            </dl>
          </DetailSection>
          {(defect.integrationTarget || defect.externalIssue) && <DetailSection title={t("reports.issueLink")}>
            {defect.externalIssue ? <a className={surface.issueLink} href={defect.externalIssue.url} target="_blank" rel="noreferrer">
              <span className={surface.issueProvider}>YouTrack</span>
              <strong>{defect.externalIssue.key}</strong>
              <ExternalLinkIcon size={14} aria-hidden="true" />
            </a> : <p className={surface.mutedText}>{t("reports.noIssueLink")}</p>}
          </DetailSection>}
          {workspaceId && <ConnectorTargetLinks workspaceId={workspaceId} projectId={defect.projectId} targetId={defect.id} />}
          <DetailSection title={t("reports.labels")}>
            {defect.labels.length > 0 ? <div className={surface.tagList}>{defect.labels.map((label) => <span key={label}>#{label}</span>)}</div> : <p className={surface.mutedText}>{t("reports.noLabels")}</p>}
          </DetailSection>
        </aside>
        <div className={detail.discussion}>
          <DefectDiscussion key={defect.id} defectId={defect.id} projectId={defect.projectId} connected={connected} canComment={canComment} />
        </div>
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
