"use client";
import { useEffect } from "react";
import { useTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { settingsSectionLink } from "../../presentation/config/navigation/settings-section-route";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import { SelfProfileFeature } from "../self/composition/SelfProfileFeature";
import administration from "../../company-administration/presentation/layout/administration.module.css";
import styles from "./workspace-profile.module.css";

export function WorkspaceProfile({ workspaceId }: { workspaceId?: string | null }) {
  const session = useTmsSession();
  useEffect(() => {
    if (!["#security", "#sessions"].includes(window.location.hash)) return;
    const hash = window.location.hash;
    navigateWorkspace(`${settingsSectionLink(window.location.href, "security")}${hash}`, true);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  }, []);
  return <section className={`${administration.page} ${styles.profile}`} data-testid="workspace-profile">
    <div className={styles.content}><SelfProfileFeature key={session.subject ?? session.kind} workspaceId={workspaceId ?? session.workspaceId ?? null} /></div>
  </section>;
}
