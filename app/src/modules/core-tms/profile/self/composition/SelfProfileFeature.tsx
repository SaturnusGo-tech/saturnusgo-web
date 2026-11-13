"use client";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { createSelfProfileClient } from "../data/profile-client";
import { useSelfProfile } from "../application/useSelfProfile";
import { useProfileActivity } from "../application/useProfileActivity";
import { useProfileInsights } from "../application/insights/useProfileInsights";
import type { ProfilePeriod } from "../domain/profile-model";
import { ProfileIdentity } from "../presentation/identity/ProfileIdentity";
import { ProfileAbout } from "../presentation/about/ProfileAbout";
import { ProfileCalendar } from "../presentation/calendar/ProfileCalendar";
import { ProfileAchievements } from "../presentation/achievements/ProfileAchievements";
import { ProfileActivity } from "../presentation/activity/ProfileActivity";
import { profileCopy } from "../presentation/copy/profile-copy";
import styles from "./self-profile.module.css";

export function SelfProfileFeature({ workspaceId }: {
  workspaceId: string | null; onSecurity?: (screen: "security" | "sessions") => void; accountAction?: ReactNode;
}) {
  const http = useTmsHttpClient(), session = useTmsSession(), { locale } = useTmsLocale();
  const ru = locale === "ru", copy = profileCopy(ru), client = useMemo(() => createSelfProfileClient(http), [http]);
  const resource = useSelfProfile(client), [days, setDays] = useState<ProfilePeriod>(30);
  const [year, setYear] = useState(() => new Date().getUTCFullYear());
  const activity = useProfileActivity(client, workspaceId, days), insights = useProfileInsights(client, workspaceId, year);
  const profile = resource.profile;
  useEffect(() => { if (profile) session.updateProfile?.(profile); }, [profile, session.updateProfile]);
  const code = resource.error && typeof resource.error === "object" && "code" in resource.error ? String(resource.error.code) : "";
  const message = code === "VERSION_CONFLICT" ? copy.conflict : /IMAGE|AVATAR|BANNER|FILE/.test(code) ? copy.imageError : profile ? copy.error : copy.loadError;
  return <div className={styles.page}>
    <header className={styles.heading}><h1>{copy.title}</h1><span className={styles.saved} role="status">{resource.notice && !resource.error ? copy.saved : ""}</span></header>
    <ErrorToast message={resource.error ? message : null} retryLabel={copy.retry} onRetry={resource.pending ? undefined : resource.retry} />
    {!profile ? resource.loading ? <div className={styles.skeleton} aria-busy="true" aria-label={ru ? "Загружаем профиль" : "Loading profile"}><div /><div /></div> : null : <>
      <div className={styles.overview}>
        <aside className={styles.person}>
          <ProfileIdentity key={profile.id} profile={profile} ru={ru} pending={resource.pending} onSave={resource.save}
            onChooseAvatar={resource.chooseCharacter} onUpload={resource.upload} onRemove={kind => { void resource.remove(kind); }} />
          <ProfileAchievements value={insights.achievements.value} loading={insights.achievements.loading} error={insights.achievements.error} ru={ru} retry={insights.retry} />
        </aside>
        <div className={styles.insights}>
          <ProfileAbout profile={profile} ru={ru} pending={resource.pending} onSave={resource.save} />
          <ProfileCalendar value={insights.calendar.value} loading={insights.calendar.loading} error={insights.calendar.error} year={year} ru={ru} onYear={setYear} retry={insights.retry} />
        </div>
      </div>
      <ProfileActivity value={activity.value} loading={activity.loading} error={activity.error} workspaceId={workspaceId} days={days} ru={ru} onPeriod={setDays} retry={activity.retry} />
    </>}
  </div>;
}
