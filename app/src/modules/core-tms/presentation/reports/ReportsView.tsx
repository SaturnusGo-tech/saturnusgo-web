import { Bug } from "lucide-react";
import type { Defect, TestRun } from "../../../../core/tms/contracts/legacy-contract";
import { formatCount } from "../../localization/format/count";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
export function ReportsView({ defects, runs, onNew }: { defects: Defect[]; runs: TestRun[]; onNew: () => void }) {
  const { locale, t } = useTmsLocale();
  const open = defects.filter((item) => !["closed", "verified"].includes(item.status)).length;
  const critical = defects.filter((item) => item.severity === "critical").length;
  const completed = runs.filter((item) => item.status === "completed").length;
  const openLabel = formatCount(locale, open, ["open defect", "open defects"], ["открытый дефект", "открытых дефекта", "открытых дефектов"]);
  const criticalLabel = formatCount(locale, critical, ["critical defect", "critical defects"], ["критический дефект", "критических дефекта", "критических дефектов"]);
  const completedLabel = formatCount(locale, completed, ["completed run", "completed runs"], ["завершённый прогон", "завершённых прогона", "завершённых прогонов"]);
  return <div className={styles.pageScroll} data-testid="reports-view"><SectionHeading eyebrow={t("reports.eyebrow")} title={t("reports.title")} description={t("reports.description")} action={<button className={styles.primaryButton} onClick={onNew}><Bug size={16} /> {t("reports.newBug")}</button>} /><div className={styles.reportStats}><span><b>{open}</b>{openLabel.slice(String(open).length + 1)}</span><span><b>{critical}</b>{criticalLabel.slice(String(critical).length + 1)}</span><span><b>{completed}</b>{completedLabel.slice(String(completed).length + 1)}</span></div>{defects.length === 0 ? <div className={styles.panel}><EmptyState icon={<Bug size={32} />} title={t("reports.empty")} text={t("reports.emptyHint")} /></div> : <div className={styles.defectTable}><div className={styles.defectTableHead}>{[t("reports.key"), t("reports.summary"), t("reports.severity"), t("reports.status"), t("reports.assignee")].map((header) => <span key={header}>{header}</span>)}</div>{defects.map((defect) => <div className={styles.defectRow} key={defect.id}><strong>{defect.key}</strong><span><b>{defect.title}</b><small>{defect.component} · {defect.labels.join(", ")}</small></span><span className={styles[`priority_${defect.severity}`]}>{localizedLabel(locale, defect.severity)}</span><span>{localizedLabel(locale, defect.status)}</span><span>{defect.assignee || t("common.unassigned")}</span></div>)}</div>}</div>;
}
