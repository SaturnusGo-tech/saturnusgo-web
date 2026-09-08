import type { WorkbenchProgress } from "../../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { queueCopy, runProgress } from "./model";
import styles from "./progress.module.css";

export function RunProgress({ progress }: { progress: WorkbenchProgress }) {
  const { locale, languageTag } = useTmsLocale();
  const copy = queueCopy[locale];
  const data = runProgress(progress);
  const format = new Intl.NumberFormat(languageTag);
  const label = copy.completed(format.format(data.completed), format.format(data.total));
  const detail = data.segments.map(({ kind, count }) => `${copy[kind]}: ${format.format(count)}`).join(" · ");
  return <span className={styles.progress}>
    <span className={styles.caption}><span>{label}</span><strong>{format.format(data.percent)}%</strong></span>
    <span className={styles.track} role="progressbar" aria-label={label} title={detail}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.percent} aria-valuetext={`${label}. ${detail}`}>
      {data.segments.map(({ kind, percent }) => <span key={kind} data-status={kind} style={{ width: `${percent}%` }} />)}
    </span>
  </span>;
}
