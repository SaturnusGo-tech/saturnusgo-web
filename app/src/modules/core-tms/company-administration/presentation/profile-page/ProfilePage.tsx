"use client";
import { ProfileAvatarEditor } from "../avatar/ProfileAvatarEditor";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { ProfileDetailsForm } from "../profile/ProfileDetailsForm";
import { ProfilePasswordForm } from "../profile/ProfilePasswordForm";
import { ProfileSessions } from "../devices/ProfileSessions";
import styles from "../layout/administration.module.css";
import { useProfileScreen } from "./useProfileScreen";
import { ArrowLeft, ChevronRight, KeyRound, MonitorSmartphone } from "lucide-react";
import { Modal } from "../../../presentation/common/modal/Modal";
import profileStyles from "./profile-page.module.css";

export function ProfilePage({ client, onLoaded }: { readonly client: AdministrationPort; readonly onLoaded?: (profile: Profile) => void }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal: AbortSignal) => client.profile(signal), [client]));
  const [devicesVersion, setDevicesVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const { security, navigate } = useProfileScreen();
  const profile = resource.value;
  useEffect(() => { if (profile) onLoaded?.(profile); }, [profile, onLoaded]);
  return <>
    {security && <button type="button" className={profileStyles.back} onClick={() => navigate(false)}>
      <ArrowLeft size={16} aria-hidden="true" />{locale === "ru" ? "К профилю" : "Back to profile"}
    </button>}
    <header className={styles.heading}><h1>{security ? copy.updatePassword : copy.profile}</h1></header>
    {resource.loading || !profile ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />
      : security ? <ProfilePasswordForm profile={profile} client={client} onSaved={() => setDevicesVersion((value) => value + 1)} />
      : <div className={profileStyles.content}>
        {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
        {saved && <p className={styles.success} role="status">{copy.profileSaved}</p>}
        <ProfileAvatarEditor name={profile.name} hasAvatar={profile.hasAvatar} version={profile.version} client={client} onSaved={resource.refresh} />
        <ProfileDetailsForm key={profile.version} profile={profile} client={client} onSaved={() => { setSaved(true); resource.refresh(); }} />
        <nav className={profileStyles.accountActions} aria-label={locale === "ru" ? "Безопасность аккаунта" : "Account security"}>
          <button type="button" className={profileStyles.security} onClick={() => navigate(true)}>
            <KeyRound size={17} strokeWidth={1.6} aria-hidden="true" />
            <span>{copy.updatePassword}</span><ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className={profileStyles.security} aria-haspopup="dialog" onClick={() => setSessionsOpen(true)}>
            <MonitorSmartphone size={18} strokeWidth={1.6} aria-hidden="true" />
            <span>{copy.sessions}</span><ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
        {sessionsOpen && <Modal title={copy.sessions} onClose={() => setSessionsOpen(false)} panelClassName={profileStyles.sessionsDialog}
          subtitle={locale === "ru" ? "Проверьте активные устройства и завершите ненужные сессии." : "Review active devices and end sessions you no longer need."}>
          <div className={profileStyles.sessionsBody}><ProfileSessions client={client} version={devicesVersion} showHeading={false} /></div>
        </Modal>}
      </div>}
  </>;
}
