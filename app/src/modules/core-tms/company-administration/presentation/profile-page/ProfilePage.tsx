"use client";
import { ProfileAvatarEditor } from "../avatar/ProfileAvatarEditor";

import { useCallback, useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationResource } from "../../application/state/useAdministrationResource";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { ResourceState } from "../common/ResourceState";
import { ProfileDetailsForm } from "../profile/ProfileDetailsForm";
import { ProfilePasswordForm } from "../profile/ProfilePasswordForm";
import { ProfileSessions } from "../devices/ProfileSessions";
import styles from "../layout/administration.module.css";

export function ProfilePage({ client }: { readonly client: AdministrationPort }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal: AbortSignal) => client.profile(signal), [client]));
  const [devicesVersion, setDevicesVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const profile = resource.value;
  return <>
    <header className={styles.heading}><h1>{copy.profile}</h1></header>
    {resource.loading || !profile ? <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />
      : <div className={styles.sections}>
        {resource.error && <ResourceState loading={false} error={resource.error} retry={resource.refresh} />}
        {saved && <p className={styles.success} role="status">{copy.profileSaved}</p>}
        <ProfileAvatarEditor name={profile.name} hasAvatar={profile.hasAvatar} version={profile.version} client={client} onSaved={resource.refresh} />
        <ProfileDetailsForm key={profile.version} profile={profile} client={client} onSaved={() => { setSaved(true); resource.refresh(); }} />
        <ProfilePasswordForm profile={profile} client={client} onSaved={() => setDevicesVersion((value) => value + 1)} />
        <ProfileSessions client={client} version={devicesVersion} />
      </div>}
  </>;
}
