"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import type { AppState } from "@auth0/auth0-react";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { readTmsAuth0Configuration } from "../../config/auth0-config";
import { safeTmsReturnPath, TMS_AUTH_ROUTE_PATH } from "../../navigation/tms-auth-route";
import { TmsAuthGate } from "../gate/TmsAuthGate";
import { TmsAuthState } from "../state/TmsAuthState";

const configuration = readTmsAuth0Configuration({
  NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  NEXT_PUBLIC_AUTH0_AUDIENCE: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
});

export function TmsAuthBoundary({ children }: { readonly children: ReactNode }) {
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
  const apiBase = process.env.NEXT_PUBLIC_TMS_API_BASE ?? (
    process.env.NODE_ENV === "production" ? "" : "http://localhost:4100/api/v1"
  );
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
