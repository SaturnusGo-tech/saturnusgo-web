import { DetailStatus } from "../../../../../../presentation/dashboard/detail/records/RecordSignals";
import type { RunEvidenceCandidate } from "../../../../../domain/run/productDocRunCandidates";
import styles from "../run-evidence-inspector.module.css";

export function RunEvidenceRow({ run, showProject, shortDate, fullDate }: {
  run: RunEvidenceCandidate;
  showProject: boolean;
  shortDate: Intl.DateTimeFormat;
  fullDate: Intl.DateTimeFormat;
}) {
  const context = [showProject ? run.projectName : "", run.environmentName].filter(Boolean).join(" · ");
  const created = Number.isFinite(Date.parse(run.createdAt)) ? new Date(run.createdAt) : null;
  return <>
    <span className={styles.runKey} title={run.key}>{run.key}</span>
    <strong className={styles.runTitle} title={run.name}>{run.name}</strong>
    <span className={styles.runContext} title={context}>{context}</span>
    <span className={styles.runStatus}><DetailStatus status={run.status} /></span>
    {created && <time className={styles.runDate} dateTime={run.createdAt} title={fullDate.format(created)}>{shortDate.format(created)}</time>}
  </>;
}
