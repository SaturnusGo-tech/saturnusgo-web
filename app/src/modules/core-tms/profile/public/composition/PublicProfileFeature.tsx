'use client';
import { useMemo,useState } from 'react';
import { useTmsHttpClient } from '../../../auth/http/TmsHttpClientContext';
import { useTmsLocale } from '../../../localization/context/useTmsLocale';
import { memberRoleLabel } from '../../../company-administration/presentation/permissions/member-role-label';
import { ErrorToast } from '../../../presentation/common/error/ErrorToast';
import { createPublicProfileClient } from '../data/public-profile-client';
import { codexProfileCopy } from '../content/codex-profile-copy';
import { usePublicProfile } from '../application/usePublicProfile';
import { useProfileActivity } from '../../self/application/useProfileActivity';
import { useProfileInsights } from '../../self/application/insights/useProfileInsights';
import { ProfileIdentity } from '../../self/presentation/identity/ProfileIdentity';
import { ProfileAbout } from '../../self/presentation/about/ProfileAbout';
import { ProfileAchievements } from '../../self/presentation/achievements/ProfileAchievements';
import { ProfileCalendar } from '../../self/presentation/calendar/ProfileCalendar';
import { ProfileActivity } from '../../self/presentation/activity/ProfileActivity';
import type { ProfilePeriod } from '../../self/domain/profile-model';
import styles from '../../self/composition/self-profile.module.css';
export function PublicProfileFeature({workspaceId,identityId}:{workspaceId:string;identityId:string}) {
 const http=useTmsHttpClient(),{locale}=useTmsLocale(),ru=locale==='ru';
 const client=useMemo(()=>createPublicProfileClient(http,workspaceId,identityId),[http,workspaceId,identityId]);
 const resource=usePublicProfile(client),[days,setDays]=useState<ProfilePeriod>(30),[year,setYear]=useState(()=>new Date().getUTCFullYear());
 const activity=useProfileActivity(client,workspaceId,days),insights=useProfileInsights(client,workspaceId,year);
 const profile=resource.profile?.kind==='agent'?{...resource.profile,...codexProfileCopy(ru)}:resource.profile;
 return <div className={styles.page} data-testid='public-member-profile'>
  <header className={styles.heading}><h1>{ru?'Профиль':'Profile'}</h1>
   {profile&&<span className={styles.saved}>{profile.kind==='agent'?`${ru?'Агент Codex':'Codex agent'}${profile.status==='inactive'?(ru?' · Неактивен':' · Inactive'):''}`:memberRoleLabel(profile.role,locale)}</span>}</header>
  <ErrorToast message={resource.error?(ru?'Профиль недоступен.':'This profile is unavailable.'):null} />
  {!profile?resource.loading?<div className={styles.skeleton} aria-busy='true' aria-label={ru?'Загружаем профиль':'Loading profile'}><div/><div/></div>:null:<>
   <div className={styles.overview}><aside className={styles.person}>
    <ProfileIdentity profile={profile} ru={ru} readOnly />
    <ProfileAchievements value={insights.achievements.value} loading={insights.achievements.loading} error={insights.achievements.error} ru={ru} retry={insights.retry}/>
   </aside><div className={styles.insights}>
    <ProfileAbout profile={profile} ru={ru} readOnly/>
    <ProfileCalendar value={insights.calendar.value} loading={insights.calendar.loading} error={insights.calendar.error} year={year} ru={ru} readOnly onYear={setYear} retry={insights.retry}/>
   </div></div>
   <ProfileActivity value={activity.value} loading={activity.loading} error={activity.error} workspaceId={workspaceId} days={days} ru={ru} readOnly onPeriod={setDays} retry={activity.retry}/>
  </>}
 </div>;
}
