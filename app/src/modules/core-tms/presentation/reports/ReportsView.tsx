"use client";

import { ErrorToast } from "../common/error/ErrorToast";
import { useNavigationValue } from "../../state/navigation/context/useNavigationValue";
import { useCallback } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { DefectBrowser } from "./browser/DefectBrowser";
import { DefectReportDetail, type DetailTab } from "./detail/DefectReportDetail";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useDefectCommentTab } from "../../state/defect-navigation/useDefectCommentTab";
import type { DefectRetest } from "../../runs/verification/state/defect/useDefectRetest";
import surface from "./reports.module.css";

export function ReportsView({ workspaceId, projectId, projectName = "", defects, runs, links, selectedDefectId, onSelectDefect,
  selectedDefectStatus, onRetrySelectedDefect, onNew, onOpenRun, defectRetest, connected = false, canComment = false, creating = false }: {
  defectRetest?: DefectRetest;
  connected?: boolean; canComment?: boolean; creating?: boolean;
  workspaceId?: string; projectId?: string; projectName?: string;
  defects: Defect[];
  runs: TestRunSummary[];
  links: ExternalLink[];
  selectedDefectId: string | null;
  onSelectDefect: (defectId: string | null) => void;
  selectedDefectStatus: "idle" | "loading" | "ready" | "error";
  onRetrySelectedDefect: () => void;
  onNew: () => void;
  onOpenRun: (runId: string, runItemId: string | null) => void;
}) {
  const { locale, t } = useTmsLocale();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useNavigationValue(`reports:${workspaceId}:${projectId}:query`, "");
  const [detailTab, setDetailTab] = useNavigationValue<DetailTab>(`reports:${workspaceId}:${projectId}:tab`, "overview");
  useDefectCommentTab(projectId, selectedDefectId, useCallback(() => setDetailTab("overview"), [setDetailTab]));
  const [severitySort, setSeveritySort] = useNavigationValue<"asc" | "desc" | null>(`reports:${workspaceId}:${projectId}:sort`, null);
  const selectedDefect = selectedDefectStatus === "ready" ? defects.find((item) => item.id === selectedDefectId) : undefined;
  const browseDefects = selectedDefect?.archivedAt ? defects.filter(item => item.id !== selectedDefect.id) : defects;

  function selectDefect(defectId: string | null) {
    if (defectId !== selectedDefectId) setDetailTab("overview");
    onSelectDefect(defectId);
  }

  function createDefect() {
    if (selectedDefectId) selectDefect(null);
    onNew();
  }

  return <div className={surface.workspace} data-testid="reports-view" data-detail-open={!creating && Boolean(selectedDefectId) || undefined}>
    <DefectBrowser workspaceId={workspaceId} projectId={projectId} projectName={projectName}
      connected={connected} defects={browseDefects} query={query} onQueryChange={setQuery}
      severitySort={severitySort} onSeveritySortChange={setSeveritySort}
      selectedDefectId={selectedDefectId} onSelectDefect={selectDefect} onNew={createDefect} />

    {!creating && <AnimatePresence>
    {selectedDefectId && <motion.div key="detail-space" className={surface.detailSpace} aria-hidden="true"
      initial={{ width: 0 }} animate={{ width: "var(--report-panel-width)" }} exit={{ width: 0 }}
      transition={{ duration: reducedMotion ? 0 : .26, ease: [.2,.75,.25,1] }} />}
    {selectedDefectId && <motion.aside key={`${workspaceId}:${projectId}`} className={surface.detailPanel}
      initial={{ x: reducedMotion ? 0 : "100%" }} animate={{ x: 0 }}
      exit={{ x: reducedMotion ? 0 : "100%" }} transition={{ duration: reducedMotion ? 0 : .26, ease: [.2,.75,.25,1] }} aria-label={locale === "ru" ? "Баг-репорт" : "Bug report"}>
      {selectedDefect
        ? <DefectReportDetail
            connected={connected} canComment={canComment} workspaceId={workspaceId} defect={selectedDefect}
            run={runs.find((item) => item.id === selectedDefect.runId)}
            links={links.filter((link) => link.owner.kind === "defect" && link.owner.defectId === selectedDefect.id)}
            tab={detailTab}
            onTabChange={setDetailTab}
            onBack={() => selectDefect(null)}
            onOpenRun={onOpenRun} retest={defectRetest}
          />
        : selectedDefectStatus === "error"
          ? <ErrorToast message={locale === "ru" ? "Не удалось открыть баг-репорт" : "Could not open the bug report"}
            retryLabel={locale === "ru" ? "Повторить" : "Retry"} onRetry={onRetrySelectedDefect} />
          : <TessiqLoader pane label={locale === "ru" ? "Загрузка баг-репорта" : "Loading bug report"} testId="defect-detail-loading" />}
    </motion.aside>}</AnimatePresence>}
  </div>;
}
