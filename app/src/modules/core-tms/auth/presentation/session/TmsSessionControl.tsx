"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useTmsSession } from "./TmsSessionContext";
import styles from "../../../tms.module.css";

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : value.slice(0, 2))
    .toUpperCase();
}

export function TmsSessionControl() {
  const session = useTmsSession();
  const { t } = useTmsLocale();
  const [failed, setFailed] = useState(false);
  const label = session.label || t("auth.account");
  const signOut = () => {
    setFailed(false);
    void session.signOut().catch(() => setFailed(true));
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
