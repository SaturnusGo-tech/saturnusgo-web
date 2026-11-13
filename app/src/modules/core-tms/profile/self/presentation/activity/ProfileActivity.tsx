"use client";
import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import { RefreshCw } from "lucide-react";
import type { ProfilePeriod, SelfProfileActivity } from "../../domain/profile-model";
import { profileCopy } from "../copy/profile-copy";
import { ProfileActivityChart } from "./chart/ProfileActivityChart";
import styles from "./profile-activity.module.css";

export function ProfileActivity({ value, loading, error, workspaceId, days, ru, onPeriod, retry, readOnly = false }: {
  value: SelfProfileActivity | null; loading: boolean; error: unknown; workspaceId: string | null; days: ProfilePeriod; ru: boolean;
  onPeriod: (value: ProfilePeriod) => void; retry: () => void; readOnly?: boolean;
}) {
  const copy = profileCopy(ru), activityLabel=readOnly?(ru?"Активность":"Activity"):copy.activity, scope=readOnly?(ru?"Записанные действия в текущем пространстве · UTC":"Recorded work in this workspace · UTC"):copy.scope, numbers = new Intl.NumberFormat(ru ? "ru-RU" : "en-US");
  return <section className={styles.activity} aria-label={activityLabel} aria-busy={loading}>
    <header className={styles.heading}><div><h2>{activityLabel}</h2><p>{scope}</p></div>
      <div className={styles.period} role="group" aria-label={copy.period}>{([30, 90, 365] as const).map(period =>
        <button key={period} type="button" aria-pressed={days === period} onClick={() => onPeriod(period)}>{ru ? `${period} дн.` : `${period}d`}</button>)}</div>
    </header>
    {error ? <ErrorToast message={copy.activityError} retryLabel={copy.retry} onRetry={retry} />
      : !workspaceId ? <div className={styles.empty}><p>{copy.noWorkspace}</p></div>
      : <div className={styles.charts}>{(["executedCases", "authoredCases", "defects", "runs"] as const).map(metric => <article key={metric} className={styles.metric} data-metric={metric}>
        <header><div><h3>{copy.metrics[metric]}</h3><strong>{value ? numbers.format(value.totals[metric]) : "—"}</strong></div><span>{copy.count(days)}</span></header>
        {loading || !value ? <div className={styles.loading} aria-label={ru ? "Загружаем результаты" : "Loading recorded work"} /> : <ProfileActivityChart value={value} metric={metric} ru={ru} />}
      </article>)}</div>}
    <p className={styles.basis}>{copy.basis}</p>
  </section>;
}
