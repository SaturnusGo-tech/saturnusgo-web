"use client";

import { useNavigationValue } from "../../state/navigation/context/useNavigationValue";
import { Bug } from "lucide-react";
import { useCallback } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { DefectBrowser } from "./browser/DefectBrowser";
import { DefectReportDetail, type DetailTab } from "./detail/DefectReportDetail";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useDefectCommentTab } from "../../state/defect-navigation/useDefectCommentTab";
import surface from "./reports.module.css";

export function ReportsView({ workspaceId, projectId, projectName = "", defects, runs, links, selectedDefectId, onSelectDefect,
  selectedDefectStatus, onRetrySelectedDefect, onNew, onOpenRun, connected = false, canComment = false }: {
  connected?: boolean; canComment?: boolean;
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
  const selectedDefect = defects.find((item) => item.id === selectedDefectId);

  function selectDefect(defectId: string | null) {
    if (defectId !== selectedDefectId) setDetailTab("overview");
    onSelectDefect(defectId);
  }

  return <div className={surface.workspace} data-testid="reports-view" data-detail-open={Boolean(selectedDefectId) || undefined}>
    <DefectBrowser workspaceId={workspaceId} projectId={projectId} projectName={projectName}
      connected={connected} defects={defects} query={query} onQueryChange={setQuery}
      severitySort={severitySort} onSeveritySortChange={setSeveritySort}
      selectedDefectId={selectedDefectId} onSelectDefect={selectDefect} onNew={onNew} />

    <AnimatePresence>
    {selectedDefectId && <motion.aside key={`${workspaceId}:${projectId}`} className={surface.detailPanel}
      initial={{ x: reducedMotion ? 0 : -28, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: reducedMotion ? 0 : -28, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .24, ease: [.22,.68,.25,1] }} aria-label={locale === "ru" ? "Баг-репорт" : "Bug report"}>
      {selectedDefect
        ? <DefectReportDetail
            connected={connected} canComment={canComment} workspaceId={workspaceId} defect={selectedDefect}
            run={runs.find((item) => item.id === selectedDefect.runId)}
            links={links.filter((link) => link.owner.kind === "defect" && link.owner.defectId === selectedDefect.id)}
            tab={detailTab}
            onTabChange={setDetailTab}
            onBack={() => selectDefect(null)}
            onOpenRun={onOpenRun}
          />
        : selectedDefectStatus === "error"
          ? <div className={surface.detailError} role="alert"><Bug size={22} /><strong>{locale === "ru" ? "Не удалось открыть баг-репорт" : "Could not open the bug report"}</strong><span>{locale === "ru" ? "Проверьте подключение и повторите." : "Check the connection and try again."}</span><button type="button" onClick={onRetrySelectedDefect}>{locale === "ru" ? "Повторить" : "Retry"}</button></div>
          : <TessiqLoader pane label={locale === "ru" ? "Загрузка баг-репорта" : "Loading bug report"} testId="defect-detail-loading" />}
    </motion.aside>}</AnimatePresence>
  </div>;
}
