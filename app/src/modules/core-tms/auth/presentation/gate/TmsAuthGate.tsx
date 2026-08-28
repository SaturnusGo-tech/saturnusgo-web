"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { createTmsAccessTokenProvider } from "../../application/access-token-provider";
import { createAuthenticatedTmsHttpClient } from "../../http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../http/TmsHttpClientContext";
import { TMS_AUTH_ROUTE_PATH } from "../../navigation/tms-auth-route";
import { TmsAuthState } from "../state/TmsAuthState";

export function TmsAuthGate({
  apiBase,
  children,
}: {
  readonly apiBase: string;
  readonly children: ReactNode;
}) {
  const auth = useAuth0();
  const [actionFailed, setActionFailed] = useState(false);
  const accessToken = useMemo(
    () => createTmsAccessTokenProvider(() => auth.getAccessTokenSilently()),
    [auth.getAccessTokenSilently],
  );
  const attachmentClient = useMemo(
    () => createAttachmentClient({ apiBase, accessToken }),
    [accessToken, apiBase],
  );
  const httpClient = useMemo(
    () => createAuthenticatedTmsHttpClient({ apiBase, accessToken }),
    [accessToken, apiBase],
  );
  const login = useCallback(() => {
    setActionFailed(false);
    void auth.loginWithRedirect({
      appState: { returnTo: TMS_AUTH_ROUTE_PATH },
    }).catch(() => setActionFailed(true));
  }, [auth.loginWithRedirect]);

  if (auth.isLoading) return <TmsAuthState kind="loading" />;
  if (auth.error || actionFailed) {
    return <TmsAuthState kind="error" onAction={login} />;
  }
  if (!auth.isAuthenticated) {
    return <TmsAuthState kind="signedOut" onAction={login} />;
  }
  return (
    <TmsHttpClientProvider client={httpClient}>
      <AttachmentClientProvider client={attachmentClient}>
        {children}
      </AttachmentClientProvider>
    </TmsHttpClientProvider>
  );
}
