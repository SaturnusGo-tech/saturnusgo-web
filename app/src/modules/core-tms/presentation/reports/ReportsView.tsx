import { Bug } from "lucide-react";
import type { Defect, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";

export function ReportsView({ defects, runs, onNew }: {
  defects: Defect[];
  runs: TestRunSummary[];
  onNew: () => void;
}) {
  const { locale, t } = useTmsLocale();
  const open = defects.filter((item) => !["closed", "verified"].includes(item.status)).length;
  const critical = defects.filter((item) => item.severity === "critical").length;
  const completed = runs.filter((item) => item.status === "completed").length;
  return <div className={styles.pageScroll} data-testid="reports-view">
    <SectionHeading
      eyebrow={t("reports.eyebrow")}
      title={t("reports.title")}
      description={t("reports.description")}
      action={<button className={styles.primaryButton} onClick={onNew}><Bug size={16} /> {t("reports.newBug")}</button>}
    />
    <div className={styles.reportStats}>
      <span><b>{open}</b><small>{t("reports.openDefects", { count: open })}</small></span>
      <span><b>{critical}</b><small>{t("reports.criticalDefects", { count: critical })}</small></span>
      <span><b>{completed}</b><small>{t("reports.completedRuns", { count: completed })}</small></span>
    </div>
    {defects.length === 0 ? <div className={styles.panel}>
      <EmptyState icon={<Bug size={32} />} title={t("reports.empty")} text={t("reports.emptyHint")} />
    </div> : <div className={styles.defectTable}>
      <div className={styles.defectTableHead}>
        {[t("reports.key"), t("reports.summary"), t("reports.severity"), t("reports.status"), t("reports.assignee")].map((header) => <span key={header}>{header}</span>)}
      </div>
      {defects.map((defect) => <div className={styles.defectRow} key={defect.id}>
        <strong>{defect.key}</strong>
        <span><b>{defect.title}</b><small>{defect.component} · {defect.labels.join(", ")}</small>{defect.attachmentIds.length > 0 && <span className={styles.defectEvidence}>{defect.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}</span>}</span>
        <span><em className={styles[`priority_${defect.severity}`]}>{localizedLabel(locale, defect.severity)}</em></span>
        <span><em className={`${styles.statusPill} ${styles[`status_${defect.status}`]}`}>{localizedLabel(locale, defect.status)}</em></span>
        <span>{defect.assigneeIdentityId || t("common.unassigned")}</span>
      </div>)}
    </div>}
  </div>;
}
