"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import type { CloudSession } from "../../cloud/cloud-auth-client";
import { logoutCloudSession } from "../../cloud/cloud-auth-client";
import { createAuthenticatedTmsHttpClient } from "../../http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../http/TmsHttpClientContext";
import { TrialFeature } from "../../sign-in/composition/TrialFeature";
import { clearBrowserDesktopAttempt } from "../../continuation/desktop/browser-desktop-attempt";
import { signedOutPath } from "../../sign-in/domain/desktop-mode";
import { TmsSessionProvider } from "../session/TmsSessionContext";

export function CloudTmsGate({
  apiBase,
  children,
  session,
}: {
  readonly apiBase: string;
  readonly children: ReactNode;
  readonly session: CloudSession;
}) {
  const privateApiBase = new URL(apiBase, window.location.origin).href;
  const attachmentClient = useMemo(
    () => createAttachmentClient({ apiBase: privateApiBase, credentials: "include" }),
    [privateApiBase],
  );
  const httpClient = useMemo(
    () => createAuthenticatedTmsHttpClient({ apiBase: privateApiBase, credentials: "include" }),
    [privateApiBase],
  );
  const sessionIdentity = useMemo(() => ({
    kind: "cloud" as const,
    subject: `cloud:${session.identity.id}`,
    workspaceId: session.workspace.id,
    workspaceRole: session.membership.role,
    label: `${session.identity.givenName} ${session.identity.familyName}`.trim()
      || session.identity.email,
    signOut: async () => {
      clearBrowserDesktopAttempt();
      await logoutCloudSession();
      window.location.replace(signedOutPath());
    },
  }), [session.identity, session.workspace.id, session.membership.role]);

  return (
    <TmsSessionProvider value={sessionIdentity}>
      <TmsHttpClientProvider client={httpClient}>
        <AttachmentClientProvider client={attachmentClient}>
          {children}
          <TrialFeature key={session.workspace.id} />
        </AttachmentClientProvider>
      </TmsHttpClientProvider>
    </TmsSessionProvider>
  );
}
