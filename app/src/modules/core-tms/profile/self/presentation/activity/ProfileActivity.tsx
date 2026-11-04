"use client";
import { RefreshCw } from "lucide-react";
import type { ProfilePeriod, SelfProfileActivity } from "../../domain/profile-model";
import { profileCopy } from "../copy/profile-copy";
import { ProfileActivityChart } from "./chart/ProfileActivityChart";
import styles from "./profile-activity.module.css";

export function ProfileActivity({ value, loading, error, workspaceId, days, ru, onPeriod, retry }: {
  value: SelfProfileActivity | null; loading: boolean; error: unknown; workspaceId: string | null; days: ProfilePeriod; ru: boolean;
  onPeriod: (value: ProfilePeriod) => void; retry: () => void;
}) {
  const copy = profileCopy(ru), numbers = new Intl.NumberFormat(ru ? "ru-RU" : "en-US");
  return <section className={styles.activity} aria-label={copy.activity} aria-busy={loading}>
    <header className={styles.heading}><div><h2>{copy.activity}</h2><p>{copy.scope}</p></div>
      <div className={styles.period} role="group" aria-label={copy.period}>{([30, 90, 365] as const).map(period =>
        <button key={period} type="button" aria-pressed={days === period} onClick={() => onPeriod(period)}>{ru ? `${period} дн.` : `${period}d`}</button>)}</div>
    </header>
    {error ? <div className={styles.empty} role="alert"><p>{copy.activityError}</p><button type="button" onClick={retry}><RefreshCw size={14} />{copy.retry}</button></div>
      : !workspaceId ? <div className={styles.empty}><p>{copy.noWorkspace}</p></div>
      : <div className={styles.charts}>{(["executedCases", "authoredCases", "defects", "runs"] as const).map(metric => <article key={metric} className={styles.metric} data-metric={metric}>
        <header><div><h3>{copy.metrics[metric]}</h3><strong>{value ? numbers.format(value.totals[metric]) : "—"}</strong></div><span>{copy.count(days)}</span></header>
        {loading || !value ? <div className={styles.loading} aria-label={ru ? "Загружаем результаты" : "Loading recorded work"} /> : <ProfileActivityChart value={value} metric={metric} ru={ru} />}
      </article>)}</div>}
    <p className={styles.basis}>{copy.basis}</p>
  </section>;
}
