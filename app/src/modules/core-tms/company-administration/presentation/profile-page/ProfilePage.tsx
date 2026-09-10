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

export function ProfilePage({ client, onLoaded }: { readonly client: AdministrationPort; readonly onLoaded?: (profile: Profile) => void }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const resource = useAdministrationResource(useCallback((signal: AbortSignal) => client.profile(signal), [client]));
  const [devicesVersion, setDevicesVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const profile = resource.value;
  useEffect(() => { if (profile) onLoaded?.(profile); }, [profile, onLoaded]);
  useEffect(() => {
    let frame = 0;
    const reveal = () => {
      if (window.location.hash !== "#security") return;
      frame = requestAnimationFrame(() => document.getElementById("security")?.scrollIntoView({ block: "start" }));
    };
    reveal(); window.addEventListener("popstate", reveal);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("popstate", reveal); };
  }, [profile?.version]);
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
