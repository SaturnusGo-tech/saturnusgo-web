import { useCallback, useMemo, useState } from "react";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { GoogleLinkFeature } from "../../../auth/google-link/composition/GoogleLinkFeature";
import { createAdministrationClient } from "../../../company-administration/data/administration-client";
import { useAdministrationResource } from "../../../company-administration/application/state/useAdministrationResource";
import { ProfilePasswordForm } from "../../../company-administration/presentation/profile/ProfilePasswordForm";
import { ProfileSessions } from "../../../company-administration/presentation/devices/ProfileSessions";
import { ResourceState } from "../../../company-administration/presentation/common/ResourceState";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import administration from "../../../company-administration/presentation/layout/administration.module.css";
import css from "../../../presentation/config/security/security.module.css";

export function ManagedSecurity() {
  const http = useTmsHttpClient(), session = useTmsSession();
  const { locale } = useTmsLocale();
  const client = useMemo(() => createAdministrationClient(http), [http]);
  const resource = useAdministrationResource(useCallback((signal: AbortSignal) => client.profile(signal), [client]));
  const [version, setVersion] = useState(0);
  if (!resource.value) return <ResourceState loading={resource.loading} error={resource.error} retry={resource.refresh} />;
  return <div className={`${administration.page} ${css.page}`}>
    <section className={css.section}><h3>{locale === "ru" ? "Способы входа" : "Sign-in methods"}</h3><GoogleLinkFeature company={!!session.workspaceId} /></section>
    <section className={css.section} id="security"><h3>{locale === "ru" ? "Изменить пароль" : "Change password"}</h3>
      <ProfilePasswordForm profile={resource.value} client={client} onSaved={() => setVersion(value => value + 1)} /></section>
    <section className={css.section} id="sessions"><h3>{locale === "ru" ? "Устройства и сессии" : "Devices and sessions"}</h3>
      <ProfileSessions client={client} version={version} showHeading={false} /></section>
  </div>;
}
