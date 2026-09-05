"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import type { CloudSession } from "../../cloud/cloud-auth-client";
import { logoutCloudSession } from "../../cloud/cloud-auth-client";
import { createAuthenticatedTmsHttpClient } from "../../http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../http/TmsHttpClientContext";
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
  const attachmentClient = useMemo(
    () => createAttachmentClient({ apiBase, credentials: "include" }),
    [apiBase],
  );
  const httpClient = useMemo(
    () => createAuthenticatedTmsHttpClient({ apiBase, credentials: "include" }),
    [apiBase],
  );
  const sessionIdentity = useMemo(() => ({
    kind: "cloud" as const,
    label: `${session.identity.givenName} ${session.identity.familyName}`.trim()
      || session.identity.email,
    signOut: async () => {
      await logoutCloudSession();
      window.location.replace("/");
    },
  }), [session.identity]);

  return (
    <TmsSessionProvider value={sessionIdentity}>
      <TmsHttpClientProvider client={httpClient}>
        <AttachmentClientProvider client={attachmentClient}>
          {children}
        </AttachmentClientProvider>
      </TmsHttpClientProvider>
    </TmsSessionProvider>
  );
}
