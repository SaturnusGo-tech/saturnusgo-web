import { Bug } from "lucide-react";
import type { Defect, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";
import surface from "./reports.module.css";

export function ReportsView({ defects, runs, onNew }: {
  defects: Defect[];
  runs: TestRunSummary[];
  onNew: () => void;
}) {
  const { locale, t } = useTmsLocale();
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
          <td><strong>{defect.key}</strong></td>
          <td><span className={surface.summary}><b>{defect.title}</b><small>{defect.labels.join(", ")}</small>{defect.attachmentIds.length > 0 && <span className={surface.evidence}>{defect.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}</span>}</span></td>
          <td>{defect.component}</td>
          <td><span className={surface.severity} data-level={defect.severity}>{localizedLabel(locale, defect.severity)}</span></td>
          <td><span className={surface.status}>{localizedLabel(locale, defect.status)}</span></td>
          <td>{defect.assigneeIdentityId || t("common.unassigned")}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
