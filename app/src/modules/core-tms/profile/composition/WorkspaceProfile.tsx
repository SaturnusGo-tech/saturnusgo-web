"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { settingsSectionLink } from "../../presentation/config/navigation/settings-section-route";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import { SelfProfileFeature } from "../self/composition/SelfProfileFeature";
import { PublicProfileFeature } from "../public/composition/PublicProfileFeature";
import { readMemberProfileIdentity } from "../navigation/member-profile-route";
import { HISTORY_CHANGE } from "../../state/navigation/browser/workspace-history";
import administration from "../../company-administration/presentation/layout/administration.module.css";
import styles from "./workspace-profile.module.css";

export function WorkspaceProfile({ workspaceId }: { workspaceId?: string | null }) {
  const session = useTmsSession(), scope=workspaceId??session.workspaceId??null;
  const href=useSyncExternalStore(listener=>{
    window.addEventListener("popstate",listener);window.addEventListener(HISTORY_CHANGE,listener);
    return()=>{window.removeEventListener("popstate",listener);window.removeEventListener(HISTORY_CHANGE,listener);};
  },()=>window.location.href,()=>"");
  const memberId=scope&&href?readMemberProfileIdentity(href,scope):null;
  useEffect(() => {
    if (!["#security", "#sessions"].includes(window.location.hash)) return;
    const hash = window.location.hash;
    navigateWorkspace(`${settingsSectionLink(window.location.href, "security")}${hash}`, true);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  }, []);
  return <section className={`${administration.page} ${styles.profile}`} data-testid="workspace-profile">
    <div className={styles.content}>{scope&&memberId?<PublicProfileFeature key={`${scope}:${memberId}`} workspaceId={scope} identityId={memberId}/>:<SelfProfileFeature key={session.subject ?? session.kind} workspaceId={scope} />}</div>
  </section>;
}
