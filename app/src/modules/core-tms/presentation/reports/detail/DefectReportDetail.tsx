"use client";

import { Link } from "@heroui/react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { DefectRetest } from "../../../runs/verification/state/defect/useDefectRetest";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import files from "../../cases/detail/tabs/attachments/case-attachments.module.css";
import empty from "../../cases/detail/tabs/empty/case-tab-empty.module.css";
import inspector from "../../cases/inspector/caseInspector.module.css";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import { DefectRetestMetadata } from "./context/DefectRetestMetadata";
import { DefectDiscussion } from "./discussion/DefectDiscussion";
import { DefectReportHeader, type DetailTab } from "./header/DefectReportHeader";
import { DefectReportProperties } from "./properties/DefectReportProperties";
import detail from "./defect-detail.module.css";

export type { DetailTab } from "./header/DefectReportHeader";

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
  const { locale, t } = useTmsLocale();
  const tabsId = useId();
  const archived = Boolean(defect.archivedAt);

  return <article className={`${inspector.shell} ${detail.shell}`} data-testid="defect-report-detail" data-defect-archived={archived || undefined}>
    <DefectReportHeader workspaceId={workspaceId} defect={defect} evidenceCount={defect.attachmentIds.length + links.length}
      retest={archived ? undefined : retest} tabsId={tabsId} tab={tab} onTabChange={onTabChange} onBack={onBack} />
    <div className={`${inspector.scroll} ${detail.scroll}`} id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} tabIndex={0}>
      {tab === "overview" ? <div className={detail.overview}>
        <div className={inspector.primaryColumn}>
          <DetailSection title={t("reports.descriptionHeading")}>
            <MarkdownField value={defect.description} label={t("reports.descriptionHeading")} emptyLabel={t("reports.noDescription")} allowAttachments={false} />
          </DetailSection>
          <DetailSection title={t("reports.actualResult")}>
            <MarkdownField value={defect.actualResult} label={t("reports.actualResult")} emptyLabel={t("reports.notProvided")} allowAttachments={false} />
          </DetailSection>
          <DetailSection title={t("reports.expectedResult")}>
            <MarkdownField value={defect.expectedResult} label={t("reports.expectedResult")} emptyLabel={t("reports.notProvided")} allowAttachments={false} />
          </DetailSection>
          <DetailSection title={t("reports.executionContext")}>
            {defect.runId ? <dl className={inspector.compactSummary}>
              <div><dt>{locale === "ru" ? "Исходный прогон" : "Original run"}</dt><dd><button type="button" className={detail.originLink}
                onClick={() => onOpenRun(defect.runId!, defect.runItemId)}>{run ? `${run.key} · ${run.name}` : defect.runId}</button></dd></div>
              <div><dt>{t("reports.runItem")}</dt><dd>{defect.runItemId || "—"}</dd></div>
              <div><dt>{t("reports.step")}</dt><dd>{defect.stepId || "—"}</dd></div>
            </dl> : defect.sourceCaseId ? <a className={detail.originLink} href={buildCaseDeepLink(
              typeof window === "undefined" ? "https://tms.saturnusgo.com/" : window.location.href,
              { projectId: defect.projectId, caseId: defect.sourceCaseId })}>
              {locale === "ru" ? "Открыть тест-кейс" : "Open test case"}
            </a> : <p className={detail.muted}>{t("reports.noRunContext")}</p>}
            {!archived && retest && (retest.latest || retest.contextError) && <div className={detail.retestContext}>
              <DefectRetestMetadata retest={retest} />
            </div>}
          </DetailSection>
        </div>
        <DefectReportProperties defect={defect} workspaceId={workspaceId} />
        {!archived && <div className={detail.discussion}>
          <DefectDiscussion key={defect.id} defectId={defect.id} projectId={defect.projectId} connected={connected} canComment={canComment} />
        </div>}
      </div> : <DefectReportAttachments attachmentIds={defect.attachmentIds} links={links} />}
    </div>
  </article>;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className={inspector.section}>
    <header><h3>{title}</h3></header>
    <div className={inspector.sectionBody}>{children}</div>
  </section>;
}

function DefectReportAttachments({ attachmentIds, links }: { attachmentIds: string[]; links: ExternalLink[] }) {
  const { locale, t } = useTmsLocale();
  if (attachmentIds.length === 0 && links.length === 0) return <div className={empty.empty}>
    <div className={empty.content}>
      <img className={empty.illustration} src="/falcon/cases/empty-attachments.webp" width={174} height={116} alt="" />
      <h3>{locale === "ru" ? "Вложений пока нет" : "No attachments yet"}</h3>
      <p>{t("reports.noEvidence")}</p>
    </div>
  </div>;
  return <div className={files.content}>
    {attachmentIds.length > 0 && <div className={files.list}>
      {attachmentIds.map(id => <AttachmentLink key={id} attachmentId={id} presentation="media" variant="gallery" />)}
    </div>}
    {links.length > 0 && <div className={files.list}>
      {links.map(link => <Link key={link.id} className={files.fileRecord} href={link.targetUri} target="_blank" rel="noopener noreferrer">
        <ExternalLinkIcon size={15} aria-hidden="true" /><span>{link.label}</span>
      </Link>)}
    </div>}
  </div>;
}
