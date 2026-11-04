"use client";
import { ArrowUpRight, KeyRound, MonitorSmartphone, RefreshCw } from "lucide-react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
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
  const [tab, setTab] = useState<"profile" | "activity" | "account">("profile"), id = useId();
  const tabs = ["profile", "activity", "account"] as const;
  const profile = resource.profile;
  useEffect(() => { if (profile) session.updateProfile?.(profile); }, [profile, session.updateProfile]);
  const code = resource.error && typeof resource.error === "object" && "code" in resource.error ? String(resource.error.code) : "";
  const message = code === "VERSION_CONFLICT" ? copy.conflict : /IMAGE|AVATAR|BANNER|FILE/.test(code) ? copy.imageError : profile ? copy.error : copy.loadError;
  return <div className={styles.page}>
    <header className={styles.heading}><h1>{copy.title}</h1></header>
    <div className={styles.tabs} role="tablist" aria-label={copy.title}>{tabs.map((key, index) =>
      <button key={key} type="button" role="tab" id={`${id}-${key}`} aria-controls={`${id}-${key}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1}
        onClick={() => setTab(key)} onKeyDown={event => {
          const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
          if (next < 0) return; event.preventDefault(); setTab(tabs[next]);
          (event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
        }}>{copy.tabs[key]}</button>)}</div>
    {!!resource.error && <div className={styles.feedback} role="alert"><span>{message}</span><button type="button" disabled={resource.pending} onClick={resource.retry}><RefreshCw size={13} />{copy.retry}</button></div>}
    {resource.notice && !resource.error && <p className={styles.saved} role="status">{copy.saved}</p>}
    {!profile ? resource.loading ? <div className={styles.skeleton} aria-busy="true" aria-label={ru ? "Загружаем профиль" : "Loading profile"}><div /><div /></div> : null
      : <>
        <div className={styles.columns} role="tabpanel" id={`${id}-profile-panel`} aria-labelledby={`${id}-profile`} hidden={tab !== "profile"}>
          <ProfileIdentity profile={profile} totals={activity.value?.totals} days={days} ru={ru} pending={resource.pending}
            onUpload={(kind, file) => { void resource.upload(kind, file); }} onRemove={kind => { void resource.remove(kind); }} />
          <ProfileEditor profile={profile} pending={resource.pending} ru={ru} onSave={resource.save} />
        </div>
        <div className={styles.panel} role="tabpanel" id={`${id}-activity-panel`} aria-labelledby={`${id}-activity`} hidden={tab !== "activity"}>
          {tab === "activity" && <ProfileActivity value={activity.value} loading={activity.loading} error={activity.error} workspaceId={workspaceId} days={days} ru={ru} onPeriod={setDays} retry={activity.retry} />}
        </div>
        <div className={styles.account} role="tabpanel" id={`${id}-account-panel`} aria-labelledby={`${id}-account`} hidden={tab !== "account"}>
          <h2>{copy.account}</h2><p>{copy.accountHint}</p>
          <div className={styles.accountEmail}><span>{copy.email}</span><span>{profile.email}</span></div>
          {onSecurity && <nav aria-label={copy.security}>
            <button type="button" onClick={() => onSecurity("security")}><KeyRound size={16} strokeWidth={1.5} />{copy.password}<span><ArrowUpRight size={15} strokeWidth={1.5} /></span></button>
            <button type="button" onClick={() => onSecurity("sessions")}><MonitorSmartphone size={16} strokeWidth={1.5} />{copy.sessions}<span><ArrowUpRight size={15} strokeWidth={1.5} /></span></button>
          </nav>}
          {tab === "account" && accountAction}
        </div>
      </>}
  </div>;
}
