"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { createManagedAccessClient } from "../data/managed-access-client";
import { useManagedAccess } from "../application/useManagedAccess";
import { ManagedSignInScreen } from "./sign-in/ManagedSignInScreen";
import { ManagedAccessScreen } from "../presentation/screen/ManagedAccessScreen";
import type { SignedInCompanySession } from "../domain/managed-access";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
import { AuthContinuation } from "../../continuation/composition/AuthContinuation";
import { ManagedOAuthResume } from "../oauth/ManagedOAuthResume";
import { DesktopAuthEntry } from "../../continuation/composition/DesktopAuthEntry";

export function ManagedAccessBoundary({ children }: {
  readonly children: (session: SignedInCompanySession, logout: () => Promise<void>) => ReactNode;
}) {
  return <DesktopAuthEntry managedWorkspace><ManagedAccessFlow>{children}</ManagedAccessFlow></DesktopAuthEntry>;
}
function ManagedAccessFlow({ children }: { readonly children: (session: SignedInCompanySession, logout: () => Promise<void>) => ReactNode }) {
  const client = useMemo(() => createManagedAccessClient(), []);
  const access = useManagedAccess(client);
  if (access.state.loading) return <TmsAuthState kind="loading" />;
  if (!access.state.session?.authenticated || access.state.recoveryCodes.length > 0) {
    return access.state.session?.stage === "anonymous" && access.state.entrypoint?.audience === "tenant"
      ? <ManagedSignInScreen access={access} /> : <ManagedAccessScreen access={access} />;
  }
  const content = children(access.state.session, access.logout);
  return access.state.session.audience === "tenant" ? <AuthContinuation key={access.state.session.workspaceId} workspaceId={access.state.session.workspaceId} managedWorkspace>
    <ManagedOAuthResume>{content}</ManagedOAuthResume>
  </AuthContinuation> : content;
}
