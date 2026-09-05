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
import { TmsAuthState } from "../state/TmsAuthState";

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

type CloudProbe = { readonly stage: "checking" | "admin" }
  | { readonly stage: "cloud"; readonly session: CloudSession }
  | { readonly stage: "unavailable" };

export function TmsAuthBoundary({ children }: { readonly children: ReactNode }) {
  const apiBase = process.env.NEXT_PUBLIC_TMS_API_BASE ?? (
    process.env.NODE_ENV === "production" ? "" : "http://localhost:4100/api/v1"
  );
  const [probe, setProbe] = useState<CloudProbe>({ stage: "checking" });
  const [probeVersion, setProbeVersion] = useState(0);

  useEffect(() => {
    if (shouldUseAdminAuth(window.location.search)) {
      setProbe({ stage: "admin" });
      return;
    }
    const controller = new AbortController();
    resolveCloudSessionProbe(() => readCloudSession(controller.signal)).then((result) => {
      if (controller.signal.aborted) return;
      if (result.stage === "cloud") {
        const contextualPath = cloudWorkspacePathFromLocation(window.location, result.session);
        if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== contextualPath) {
          window.history.replaceState({}, document.title, contextualPath);
        }
        setProbe(result);
        return;
      }
      setProbe(result);
    });
    return () => controller.abort();
  }, [probeVersion]);

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
    return <CloudTmsGate apiBase={apiBase} session={probe.session}>{children}</CloudTmsGate>;
  }
  return <AdminAuthBoundary apiBase={apiBase}>{children}</AdminAuthBoundary>;
}
