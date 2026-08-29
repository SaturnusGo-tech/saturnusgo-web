import { Bug, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedComponentLabel, localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";
import { DefectReportDetail } from "./detail/DefectReportDetail";
import surface from "./reports.module.css";

export function ReportsView({ defects, runs, links, onNew, onOpenRun }: {
  defects: Defect[];
  runs: TestRunSummary[];
  links: ExternalLink[];
  onNew: () => void;
  onOpenRun: (runId: string, runItemId: string | null) => void;
}) {
  const { locale, t } = useTmsLocale();
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const selectedDefect = defects.find((item) => item.id === selectedDefectId);
  if (selectedDefect) {
    return <DefectReportDetail
      defect={selectedDefect}
      run={runs.find((item) => item.id === selectedDefect.runId)}
      links={links.filter((link) => link.owner.kind === "defect" && link.owner.defectId === selectedDefect.id)}
      onBack={() => setSelectedDefectId(null)}
      onOpenRun={onOpenRun}
    />;
  }
  const open = defects.filter((item) => !["closed", "verified"].includes(item.status)).length;
  const critical = defects.filter((item) => item.severity === "critical").length;
  const completed = runs.filter((item) => item.status === "completed").length;
  return <div className={`${styles.pageScroll} ${surface.page}`} data-testid="reports-view">
    <header className={surface.header}><div><h1>{t("reports.title")}</h1><p>{t("reports.description")}</p></div><button className={styles.primaryButton} onClick={onNew}><Bug size={16} /> {t("reports.newBug")}</button></header>
    <dl className={surface.ledger} aria-label={t("reports.title")}>
      <div><dt>{t("reports.openDefectsLabel")}</dt><dd>{open}</dd></div>
      <div><dt>{t("reports.criticalDefectsLabel")}</dt><dd>{critical}</dd></div>
      <div><dt>{t("reports.completedRunsLabel")}</dt><dd>{completed}</dd></div>
    </dl>
    <div className={surface.tableViewport}>
      <table className={surface.table}>
        <thead><tr>{[t("reports.key"), t("reports.summary"), t("reports.component"), t("reports.severity"), t("reports.status"), t("reports.assignee")].map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
        <tbody>{defects.length === 0 ? <tr><td colSpan={6}><div className={surface.empty}><Bug size={20} /><span><strong>{t("reports.empty")}</strong><small>{t("reports.emptyHint")}</small></span></div></td></tr> : defects.map((defect) => <tr key={defect.id}>
          <td><button className={surface.keyLink} type="button" onClick={() => setSelectedDefectId(defect.id)}>{defect.key}</button></td>
          <td><span className={surface.summary}><button className={surface.defectLink} type="button" onClick={() => setSelectedDefectId(defect.id)}><span><b>{defect.title}</b><small>{defect.labels.join(", ")}</small></span><ChevronRight size={16} aria-hidden="true" /></button>{defect.attachmentIds.length > 0 && <span className={surface.evidence}>{defect.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}</span>}</span></td>
          <td>{localizedComponentLabel(locale, defect.component)}</td>
          <td><span className={surface.severity} data-level={defect.severity}>{localizedLabel(locale, defect.severity)}</span></td>
          <td><span className={surface.status}>{localizedLabel(locale, defect.status)}</span></td>
          <td>{defect.assigneeIdentityId || t("common.unassigned")}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
