"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import {
  clearTmsLogoutIntent,
  rememberTmsLogoutIntent,
  TMS_AUTH_ROUTE_PATH,
} from "../../navigation/tms-auth-route";
import styles from "../../../tms.module.css";

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : value.slice(0, 2))
    .toUpperCase();
}

export function TmsSessionControl() {
  const { logout, user } = useAuth0();
  const { t } = useTmsLocale();
  const [failed, setFailed] = useState(false);
  const label = user?.name ?? user?.email ?? t("auth.account");
  const signOut = () => {
    setFailed(false);
    const returnTo = new URL(TMS_AUTH_ROUTE_PATH, window.location.origin).href;
    try {
      rememberTmsLogoutIntent(window.sessionStorage);
    } catch {
      // Logout still clears Auth0 even when session storage is unavailable.
    }
    void logout({ logoutParams: { returnTo } }).catch(() => {
      try {
        clearTmsLogoutIntent(window.sessionStorage);
      } catch {
        // There is no marker to clean up when session storage is unavailable.
      }
      setFailed(true);
    });
  };
  return (
    <div className={styles.authSession}>
      {failed && <span role="alert" className={styles.srOnly}>{t("auth.logoutError")}</span>}
      <button
        type="button"
        className={styles.authSessionButton}
        onClick={signOut}
        aria-label={t("auth.signOut")}
        title={`${t("auth.signedInAs", { name: label })} · ${t("auth.signOut")}`}
      >
        <span className={styles.avatar} aria-hidden="true">{initials(label) || "QA"}</span>
        <LogOut size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
