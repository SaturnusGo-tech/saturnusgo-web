"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import type { CloudSession } from "../../cloud/cloud-auth-client";
import { logoutCloudSession } from "../../cloud/cloud-auth-client";
import { createAuthenticatedTmsHttpClient } from "../../http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../http/TmsHttpClientContext";
import { TrialFeature } from "../../sign-in/composition/TrialFeature";
import { clearBrowserDesktopAttempt } from "../../continuation/desktop/browser-desktop-attempt";
import { tmsSignedOutDestination } from "../../navigation/tms-auth-route";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { TmsSessionProvider } from "../session/TmsSessionContext";
import { useSelfProfileIdentity } from "../../composition/session/profile/useSelfProfileIdentity";

export function CloudTmsGate({
  apiBase,
  children,
  session,
}: {
  readonly apiBase: string;
  readonly children: ReactNode;
  readonly session: CloudSession;
}) {
  const { locale } = useTmsLocale();
  const signingOut = useRef(false);
  const [resolvedKind, setResolvedKind] = useState<{ workspaceId: string; kind: "personal" | "company" }>();
  const workspaceKind = resolvedKind?.workspaceId === session.workspace.id ? resolvedKind.kind : undefined;
  const onKindChange = useCallback((kind: "personal" | "company") => {
    setResolvedKind({ workspaceId: session.workspace.id, kind });
  }, [session.workspace.id]);
  const privateApiBase = new URL(apiBase, window.location.origin).href;
  const attachmentClient = useMemo(
    () => createAttachmentClient({ apiBase: privateApiBase, credentials: "include" }),
    [privateApiBase],
  );
  const httpClient = useMemo(
    () => createAuthenticatedTmsHttpClient({ apiBase: privateApiBase, credentials: "include" }),
    [privateApiBase],
  );
  const { profile, updateProfile, avatarLoader } = useSelfProfileIdentity(httpClient, `cloud:${session.identity.id}`, {
    name: `${session.identity.givenName} ${session.identity.familyName}`.trim() || session.identity.email,
    hasAvatar: false, version: 0,
  });
  const sessionIdentity = useMemo(() => ({
    kind: "cloud" as const,
    subject: `cloud:${session.identity.id}`,
    workspaceId: session.workspace.id,
    workspaceKind,
    workspaceRole: session.membership.role,
    label: profile.name,
    hasAvatar: profile.hasAvatar,
    avatarVersion: profile.version,
    updateProfile,
    avatarLoader,
    signOut: async () => {
      if (signingOut.current) return;
      signingOut.current = true;
      try {
        await logoutCloudSession();
        clearBrowserDesktopAttempt();
        window.location.replace(tmsSignedOutDestination(window.location, locale));
      } finally { signingOut.current = false; }
    },
  }), [session.identity.id, session.workspace.id, session.membership.role, workspaceKind, profile, updateProfile, avatarLoader, locale]);

  return (
    <TmsSessionProvider value={sessionIdentity}>
      <TmsHttpClientProvider client={httpClient}>
        <AttachmentClientProvider client={attachmentClient}>
          {children}
          <TrialFeature key={session.workspace.id} onKindChange={onKindChange} />
        </AttachmentClientProvider>
      </TmsHttpClientProvider>
    </TmsSessionProvider>
  );
}
