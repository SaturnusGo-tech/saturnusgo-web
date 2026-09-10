"use client";
import { useMemo } from "react";
import { useTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { createAdministrationClient } from "../../company-administration/data/administration-client";
import { ProfilePage } from "../../company-administration/presentation/profile-page/ProfilePage";
import administration from "../../company-administration/presentation/layout/administration.module.css";
import styles from "./workspace-profile.module.css";

export function WorkspaceProfile() {
  const session = useTmsSession();
  const http = useTmsHttpClient();
  const client = useMemo(() => createAdministrationClient(http), [http]);
  return <section className={`${administration.page} ${styles.profile}`} data-testid="workspace-profile">
    <div className={styles.content}><ProfilePage client={client} onLoaded={session.updateProfile} /></div>
  </section>;
}
