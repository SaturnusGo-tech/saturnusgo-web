"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createAttachmentClient } from "../../../attachments/create-attachment-client";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { createTmsAccessTokenProvider } from "../../application/access-token-provider";
import { createAuthenticatedTmsHttpClient } from "../../http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../http/TmsHttpClientContext";
import {
  claimTmsInteractiveLogin,
  clearTmsLogoutIntent,
  consumeTmsLogoutIntent,
  rememberTmsLogoutIntent,
  resolveTmsAuthEntryStage,
  restoredDuringTmsLogin,
  tmsAdminLogoutReturnTo,
  tmsReturnPathFromLocation,
  tmsSignedOutDestination,
} from "../../navigation/tms-auth-route";
import { TmsSessionProvider } from "../session/TmsSessionContext";
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
  const [logoutIntent, setLogoutIntent] = useState<"checking" | "absent" | "present">("checking");
  const logoutIntentChecked = useRef(false);
  const loginStarted = useRef(false);
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
  const sessionIdentity = useMemo(() => ({
    kind: "admin" as const,
    label: auth.user?.name ?? auth.user?.email ?? "Falcon admin",
    signOut: async () => {
      // Keep the explicit admin selector through the Auth0 round trip. Without it,
      // a simultaneous cloud cookie could capture the return before the logout
      // intent is consumed by this gate.
      const returnTo = tmsAdminLogoutReturnTo(window.location.origin);
      try { rememberTmsLogoutIntent(window.sessionStorage); } catch {}
      try {
        await auth.logout({ logoutParams: { returnTo } });
      } catch (error) {
        try { clearTmsLogoutIntent(window.sessionStorage); } catch {}
        throw error;
      }
    },
  }), [auth.logout, auth.user?.email, auth.user?.name]);
  const login = useCallback(() => {
    setActionFailed(false);
    loginStarted.current = true;
    void auth.loginWithRedirect({
      appState: { returnTo: tmsReturnPathFromLocation(window.location) },
    }).catch(() => setActionFailed(true));
  }, [auth.loginWithRedirect]);

  useEffect(() => {
    if (logoutIntentChecked.current) return;
    logoutIntentChecked.current = true;
    try {
      setLogoutIntent(consumeTmsLogoutIntent(window.sessionStorage) ? "present" : "absent");
    } catch {
      setLogoutIntent("absent");
    }
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (restoredDuringTmsLogin(event, loginStarted)) setActionFailed(true);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const stage = resolveTmsAuthEntryStage({
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    hasError: Boolean(auth.error),
    redirectFailed: actionFailed,
    logoutIntent,
  });

  useEffect(() => {
    if (stage === "exit") {
      window.location.replace(tmsSignedOutDestination(window.location));
      return;
    }
    if (stage === "redirect" && claimTmsInteractiveLogin(loginStarted)) login();
  }, [login, stage]);

  if (stage === "checking" || stage === "redirect" || stage === "exit") {
    return <TmsAuthState kind="loading" />;
  }
  if (stage === "error") {
    return <TmsAuthState kind="error" onAction={login} />;
  }
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
