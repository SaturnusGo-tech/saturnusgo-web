"use client";
import { KeyRound, MonitorSmartphone, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { createSelfProfileClient } from "../data/profile-client";
import { useSelfProfile } from "../application/useSelfProfile";
import { useProfileActivity } from "../application/useProfileActivity";
import type { ProfilePeriod } from "../domain/profile-model";
import { ProfileIdentity } from "../presentation/identity/ProfileIdentity";
import { ProfileEditor } from "../presentation/editor/ProfileEditor";
import { ProfileActivity } from "../presentation/activity/ProfileActivity";
import { profileCopy } from "../presentation/copy/profile-copy";
import styles from "./self-profile.module.css";

export function SelfProfileFeature({ workspaceId, onSecurity, accountAction }: {
  workspaceId: string | null; onSecurity?: (screen: "security" | "sessions") => void; accountAction?: ReactNode;
}) {
  const http = useTmsHttpClient(), session = useTmsSession(), { locale } = useTmsLocale();
  const ru = locale === "ru", copy = profileCopy(ru);
  const client = useMemo(() => createSelfProfileClient(http), [http]);
  const resource = useSelfProfile(client), [days, setDays] = useState<ProfilePeriod>(30);
  const activity = useProfileActivity(client, workspaceId, days);
  const profile = resource.profile;
  useEffect(() => { if (profile) session.updateProfile?.(profile); }, [profile, session.updateProfile]);
  const code = resource.error && typeof resource.error === "object" && "code" in resource.error ? String(resource.error.code) : "";
  const message = code === "VERSION_CONFLICT" ? copy.conflict : /IMAGE|AVATAR|BANNER|FILE/.test(code) ? copy.imageError : profile ? copy.error : copy.loadError;
  return <div className={styles.page}>
    <header className={styles.heading}><div><p>Falcon</p><h1>{copy.title}</h1></div>
      {onSecurity && <nav aria-label={copy.security}>
        <button type="button" onClick={() => onSecurity("security")}><KeyRound size={15} strokeWidth={1.6} /><span>{copy.password}</span></button>
        <button type="button" onClick={() => onSecurity("sessions")}><MonitorSmartphone size={16} strokeWidth={1.6} /><span>{copy.sessions}</span></button>
      </nav>}
    </header>
    {!!resource.error && <div className={styles.feedback} role="alert"><span>{message}</span><button type="button" disabled={resource.pending} onClick={resource.retry}><RefreshCw size={13} />{copy.retry}</button></div>}
    {resource.notice && !resource.error && <p className={styles.saved} role="status">{copy.saved}</p>}
    {!profile ? resource.loading ? <div className={styles.skeleton} aria-busy="true" aria-label={ru ? "Загружаем профиль" : "Loading profile"}><div /><div /></div> : null
      : <>
        <div className={styles.columns}>
          <ProfileIdentity profile={profile} totals={activity.value?.totals} days={days} ru={ru} pending={resource.pending}
            onUpload={(kind, file) => { void resource.upload(kind, file); }} onRemove={kind => { void resource.remove(kind); }} />
          <div><ProfileEditor profile={profile} pending={resource.pending} ru={ru} onSave={resource.save} />{accountAction && <div className={styles.account}>{accountAction}</div>}</div>
        </div>
        <ProfileActivity value={activity.value} loading={activity.loading} error={activity.error} workspaceId={workspaceId} days={days} ru={ru} onPeriod={setDays} retry={activity.retry} />
      </>}
  </div>;
}
