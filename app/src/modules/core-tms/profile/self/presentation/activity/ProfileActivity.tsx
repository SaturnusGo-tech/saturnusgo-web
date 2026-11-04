"use client";
import { Activity, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { ActivityMetric, ProfilePeriod, SelfProfileActivity } from "../../domain/profile-model";
import { profileCopy } from "../copy/profile-copy";
import { ProfileActivityChart } from "./chart/ProfileActivityChart";
import styles from "./profile-activity.module.css";

export function ProfileActivity({ value, loading, error, workspaceId, days, ru, onPeriod, retry }: {
  value: SelfProfileActivity | null; loading: boolean; error: unknown; workspaceId: string | null; days: ProfilePeriod; ru: boolean;
  onPeriod: (value: ProfilePeriod) => void; retry: () => void;
}) {
  const copy = profileCopy(ru), [metric, setMetric] = useState<ActivityMetric>("executedCases");
  const empty = value && Object.values(value.totals).every(count => count === 0);
  return <section className={styles.activity} aria-label={copy.activity} aria-busy={loading}>
    <header className={styles.heading}><div><h2>{copy.activity}</h2><p>{copy.scope}</p></div>
      <div className={styles.period} role="group" aria-label={copy.period}>{([30, 90, 365] as const).map(period =>
        <button key={period} type="button" aria-pressed={days === period} onClick={() => onPeriod(period)}>{ru ? `${period} дн.` : `${period}d`}</button>)}</div>
    </header>
    <div className={styles.metrics} role="group" aria-label={copy.activity}>
      {(["executedCases", "authoredCases", "defects", "runs"] as const).map(key => <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)}>
        <span className={styles.dot} data-metric={key} /><span>{copy.metrics[key]}</span><strong>{value ? new Intl.NumberFormat(ru ? "ru-RU" : "en-US").format(value.totals[key]) : "—"}</strong>
      </button>)}
    </div>
    {loading ? <div className={styles.loading} aria-label={ru ? "Загружаем активность" : "Loading activity"}><span /><span /><span /></div>
      : error ? <div className={styles.empty} role="alert"><p>{copy.activityError}</p><button type="button" onClick={retry}><RefreshCw size={14} />{copy.retry}</button></div>
      : !workspaceId ? <div className={styles.empty}><p>{copy.noWorkspace}</p></div>
      : empty || !value ? <div className={styles.empty}><Activity size={27} strokeWidth={1.4} /><h3>{copy.noActivity}</h3><p>{copy.noActivityHint}</p></div>
      : <ProfileActivityChart value={value} metric={metric} ru={ru} />}
    <p className={styles.basis}>{copy.basis}</p>
  </section>;
}
