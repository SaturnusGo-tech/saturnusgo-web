"use client";
import { useMemo } from "react";
import { useTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { createAdministrationClient } from "../../company-administration/data/administration-client";
import { GoogleLinkFeature } from "../../auth/google-link/composition/GoogleLinkFeature";
import { ProfilePage } from "../../company-administration/presentation/profile-page/ProfilePage";
import { useProfileScreen } from "../../company-administration/presentation/profile-page/useProfileScreen";
import { SelfProfileFeature } from "../self/composition/SelfProfileFeature";
import administration from "../../company-administration/presentation/layout/administration.module.css";
import styles from "./workspace-profile.module.css";

export function WorkspaceProfile({ workspaceId }: { workspaceId?: string | null }) {
  const session = useTmsSession();
  const http = useTmsHttpClient();
  const client = useMemo(() => createAdministrationClient(http), [http]);
  const { screen, navigate } = useProfileScreen();
  const managed = session.kind === "managed";
  return <section className={`${administration.page} ${styles.profile}`} data-testid="workspace-profile">
    <div className={styles.content}>{managed && screen !== "profile" ? <ProfilePage client={client} />
      : <SelfProfileFeature key={session.subject ?? session.kind} workspaceId={workspaceId ?? session.workspaceId ?? null} onSecurity={managed ? navigate : undefined}
        accountAction={managed ? <GoogleLinkFeature company={!!session.workspaceId} /> : undefined} />}</div>
  </section>;
}
