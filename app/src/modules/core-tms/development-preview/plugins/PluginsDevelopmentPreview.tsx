"use client";

import { useEffect, useMemo, useState } from "react";
import { createAttachmentClient } from "../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../attachments/presentation/context/AttachmentClientProvider";
import { createAuthenticatedTmsHttpClient } from "../../auth/http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider, type TmsSessionIdentity } from "../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleProvider } from "../../localization/context/TmsLocaleProvider";
import { LocalizedWorkspace } from "../../presentation/workspace/LocalizedWorkspace";

import { WelcomeDevelopmentPreview } from "./WelcomeDevelopmentPreview";

const apiBase = process.env.NEXT_PUBLIC_TMS_PREVIEW_API_BASE ?? "http://127.0.0.1:4573/api/v1";
const identity: TmsSessionIdentity = {
  kind: "managed", subject: "preview:mercury", label: "Mercury Rucks",
  workspaceId: "workspace_ui_preview", workspaceRole: "workspace_admin",
  companyCapabilities: ["core", "integrations", "api_testing", "analytics", "automation"],
  signOut: async () => {},
};

/** A local-only synthetic session; the production page returns 404 before this client is rendered. */
export function PluginsDevelopmentPreview() {
  const [ready, setReady] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const http = useMemo(() => createAuthenticatedTmsHttpClient({ apiBase, credentials: "include" }), []);
  const attachments = useMemo(() => createAttachmentClient({ apiBase, credentials: "include" }), []);
  useEffect(() => {
    const url = new URL(window.location.href);
    setWelcome(url.searchParams.get("onboarding") === "welcome");
    url.searchParams.set("workspaceId", "workspace_ui_preview");
    url.searchParams.set("projectId", "project_ui_preview");
    if (!url.searchParams.has("view")) { url.searchParams.set("view", "hooks"); url.searchParams.set("integration", "codex"); }
    window.history.replaceState(window.history.state, "", url);
    setReady(true);
  }, []);
  if (process.env.NODE_ENV === "production" || !ready) return null;
  return <TmsSessionProvider value={identity}>
    <TmsHttpClientProvider client={http}><AttachmentClientProvider client={attachments}>
      <TmsLocaleProvider><LocalizedWorkspace /><WelcomeDevelopmentPreview enabled={welcome} /></TmsLocaleProvider>
    </AttachmentClientProvider></TmsHttpClientProvider>
  </TmsSessionProvider>;
}
