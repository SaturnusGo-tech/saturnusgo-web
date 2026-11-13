"use client";

import { useId } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { useDefectSourceNavigation } from "../../../defects/traceability/state/useDefectSourceNavigation";
import { useDefectExecutionContext } from "../../../defects/execution-context/state/useDefectExecutionContext";
import type { DefectRetest } from "../../../runs/verification/state/defect/useDefectRetest";
import inspector from "../../cases/inspector/caseInspector.module.css";
import { DefectReportAttachments } from "./attachments/DefectReportAttachments";
import { DefectReportContent } from "./content/DefectReportContent";
import { DefectExecutionContext } from "./context/DefectExecutionContext";
import { DefectDiscussion } from "./discussion/DefectDiscussion";
import { DefectReportHeader, type DetailTab } from "./header/DefectReportHeader";
import { DefectReportProperties } from "./properties/DefectReportProperties";
import detail from "./defect-detail.module.css";

export type { DetailTab } from "./header/DefectReportHeader";

export function DefectReportDetail({ workspaceId, defect, run, links, tab, onTabChange, onBack, onOpenRun, onOpenFolder, folders, projectName, retest, connected = false, canComment = false }: {
  retest?: DefectRetest;
  folders?: readonly RepositoryFolder[]; projectName?: string;
  onOpenFolder?: (projectId: string, path: string, folderId: string | null) => void;
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
  const tabsId = useId();
  const archived = Boolean(defect.archivedAt);
  const source = useDefectSourceNavigation({ workspaceId: workspaceId ?? "", defect, connected: Boolean(workspaceId) && connected,
    folders, onOpenFolder });
  const context = useDefectExecutionContext({ workspaceId: workspaceId ?? "", defect, run, connected: Boolean(workspaceId) && connected });

  return <article className={`${inspector.shell} ${detail.shell}`} data-testid="defect-report-detail" data-defect-archived={archived || undefined}>
    <DefectReportHeader workspaceId={workspaceId} defect={defect} evidenceCount={defect.attachmentIds.length + links.length}
      retest={archived ? undefined : retest} tabsId={tabsId} tab={tab} onTabChange={onTabChange} onBack={onBack} />
    <div className={`${inspector.scroll} ${detail.scroll}`} id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} tabIndex={0}>
      {tab === "overview" ? <div className={detail.overview}>
        <div className={detail.primary}>
          <DefectExecutionContext defect={defect} context={context} retest={archived ? undefined : retest} onOpenRun={onOpenRun} />
          <DefectReportContent defect={defect} />
          {!archived && <div className={detail.discussion}>
            <DefectDiscussion key={defect.id} defectId={defect.id} projectId={defect.projectId} connected={connected} canComment={canComment} />
          </div>}
        </div>
        <DefectReportProperties defect={defect} workspaceId={workspaceId}
          onOpenSource={source.canOpen ? source.open : undefined} sourcePending={source.pending} sourceError={source.error} projectName={projectName} />
      </div> : <DefectReportAttachments attachmentIds={defect.attachmentIds} links={links} />}
    </div>
  </article>;
}
