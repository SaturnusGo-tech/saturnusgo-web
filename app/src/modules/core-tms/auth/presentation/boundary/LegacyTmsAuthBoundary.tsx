"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import type { AppState } from "@auth0/auth0-react";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CloudSession } from "../../cloud/cloud-auth-client";
import { cloudWorkspacePathFromLocation, readCloudSession } from "../../cloud/cloud-auth-client";
import { resolveCloudSessionProbe } from "../../cloud/cloud-session-probe";
import { readTmsAuth0Configuration } from "../../config/auth0-config";
import {
  safeTmsReturnPath,
  shouldUseAdminAuth,
  TMS_AUTH_ROUTE_PATH,
} from "../../navigation/tms-auth-route";
import { TmsAuthGate } from "../gate/TmsAuthGate";
import { CloudTmsGate } from "../gate/CloudTmsGate";
import { AuthContinuation } from "../../continuation/composition/AuthContinuation";
import { SignInFeature } from "../../sign-in/composition/SignInFeature";
import { TmsAuthState } from "../state/TmsAuthState";
import { AuthenticatedWorkspaceHandoff } from "../../workspace-handoff/composition/AuthenticatedWorkspaceHandoff";
import { continuationFromLocation, hasContinuationContext } from "../../continuation/domain/continuation-path";

const configuration = readTmsAuth0Configuration({
  NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  NEXT_PUBLIC_AUTH0_AUDIENCE: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
});

function AdminAuthBoundary({ children, apiBase }: { readonly children: ReactNode; readonly apiBase: string }) {
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  useEffect(() => {
    setRedirectUri(new URL(TMS_AUTH_ROUTE_PATH, window.location.origin).href);
  }, []);
  const onRedirectCallback = useCallback((appState?: AppState) => {
    window.history.replaceState(
      {},
      document.title,
      safeTmsReturnPath(appState?.returnTo),
    );
  }, []);

  if (!configuration.ok) return <TmsAuthState kind="configuration" />;
  if (!redirectUri) return <TmsAuthState kind="loading" />;
  return (
    <Auth0Provider
      domain={configuration.value.domain}
      clientId={configuration.value.clientId}
      authorizationParams={{
        audience: configuration.value.audience,
        redirect_uri: redirectUri,
      }}
      cacheLocation="memory"
      useRefreshTokens
      useRefreshTokensFallback={false}
      onRedirectCallback={onRedirectCallback}
    >
      <TmsAuthGate apiBase={apiBase}>{children}</TmsAuthGate>
    </Auth0Provider>
  );
}

type CloudProbe = { readonly stage: "checking" | "admin" | "signin" }
  | { readonly stage: "cloud"; readonly session: CloudSession; readonly explicitContext: boolean }
  | { readonly stage: "unavailable" };

export function LegacyTmsAuthBoundary({ children, verifiedSession = null }: { readonly children: ReactNode; readonly verifiedSession?: CloudSession | null }) {
  const apiBase = process.env.NEXT_PUBLIC_TMS_API_BASE ?? "/api/v1";
  const [probe, setProbe] = useState<CloudProbe>({ stage: "checking" });
  const [probeVersion, setProbeVersion] = useState(0);

  useEffect(() => {
    const openCloud = (session: CloudSession) => {
      const original = continuationFromLocation(window.location);
      const explicitContext = original !== null && hasContinuationContext(original, window.location.origin);
      const path = cloudWorkspacePathFromLocation(window.location, session);
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== path) window.history.replaceState({}, document.title, path);
      setProbe({ stage: "cloud", session, explicitContext });
    };
    if (verifiedSession) {
      openCloud(verifiedSession);return;
    }
    if (shouldUseAdminAuth(window.location.search)) {
      setProbe({ stage: "admin" });
      return;
    }
    const controller = new AbortController();
    resolveCloudSessionProbe(() => readCloudSession(controller.signal)).then((result) => {
      if (controller.signal.aborted) return;
      if (result.stage === "cloud") {
        openCloud(result.session);
        return;
      }
      setProbe(result.stage === "admin" ? { stage: "signin" } : result);
    });
    return () => controller.abort();
  }, [probeVersion, verifiedSession]);

  if (probe.stage === "checking") return <TmsAuthState kind="loading" />;
  if (probe.stage === "unavailable") {
    return (
      <TmsAuthState
        kind="error"
        onAction={() => {
          setProbe({ stage: "checking" });
          setProbeVersion((current) => current + 1);
        }}
      />
    );
  }
  if (probe.stage === "cloud") {
    const content = <AuthContinuation workspaceId={probe.session.workspace.id} explicitContext={probe.explicitContext}>
      <CloudTmsGate apiBase="/api/v1" session={probe.session}>{children}</CloudTmsGate>
    </AuthContinuation>;
    return <AuthContinuation key={probe.session.workspace.id} workspaceId={probe.session.workspace.id} deferBrowserContinuation>
      {probe.session.workspaceHandoff === true ? <AuthenticatedWorkspaceHandoff workspaceId={probe.session.workspace.id} routeTarget={probe.explicitContext ? "workspace" : "company_home"}>
        {content}
      </AuthenticatedWorkspaceHandoff> : content}
    </AuthContinuation>;
  }
  if (probe.stage === "signin") return <SignInFeature />;
  return <AdminAuthBoundary apiBase={apiBase}>{children}</AdminAuthBoundary>;
}
