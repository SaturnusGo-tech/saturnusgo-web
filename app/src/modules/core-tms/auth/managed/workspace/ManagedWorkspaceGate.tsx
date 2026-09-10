"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ManagedAvatarGrant } from "../domain/managed-avatar";
import type { SignedInCompanySession } from "../domain/managed-access";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { createAuthenticatedTmsHttpClient } from "../../http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../presentation/session/TmsSessionContext";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";

export function ManagedWorkspaceGate({ children, session, logout }: {
  readonly children: ReactNode; readonly session: SignedInCompanySession; readonly logout: () => Promise<void>;
}) {
  const [ready, setReady] = useState(false);
  const apiBase = `${window.location.origin}/api/v1`;
  const http = useMemo(() => createAuthenticatedTmsHttpClient({ apiBase, credentials: "include" }), [apiBase]);
  const attachments = useMemo(() => createAttachmentClient({ apiBase, credentials: "include" }), [apiBase]);
  const avatarLoader = useCallback(async (signal: AbortSignal) =>
    (await http.getResource<ManagedAvatarGrant>("/profile/avatar", signal)).data, [http]);
  useEffect(() => {
    if (session.audience !== "tenant" || !session.workspaceId) { window.location.replace("/sandbox/"); return; }
    const url = new URL(window.location.href);
    if (url.searchParams.has("workspaceId") && url.searchParams.get("workspaceId") !== session.workspaceId) {
      for (const key of ["projectId", "caseId", "runId", "runItemId", "suiteId", "catalogProjectId", "portfolioId"]) url.searchParams.delete(key);
    }
    url.searchParams.set("workspaceId", session.workspaceId);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    setReady(true);
  }, [session.workspaceId, session.audience]);
  if (!ready) return <TmsAuthState kind="loading" />;
  return <TmsSessionProvider value={{ kind: "managed", subject: session.identity.id, label: session.identity.name,
    companyCapabilities: session.capabilities, profilePath: "/profile/", hasAvatar: session.identity.hasAvatar, avatarLoader,
    administrationPath: session.identity.role === "workspace_admin" ? "/admin/" : undefined, signOut: logout }}>
    <TmsHttpClientProvider client={http}><AttachmentClientProvider client={attachments}>{children}</AttachmentClientProvider></TmsHttpClientProvider>
  </TmsSessionProvider>;
}
