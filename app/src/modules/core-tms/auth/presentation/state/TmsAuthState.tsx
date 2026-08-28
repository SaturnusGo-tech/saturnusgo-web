"use client";

import { AlertTriangle, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";

type AuthStateKind = "configuration" | "error" | "loading" | "signedOut";

const copy = {
  configuration: ["auth.configurationTitle", "auth.configurationDescription"],
  error: ["auth.errorTitle", "auth.errorDescription"],
  loading: ["auth.loadingTitle", "auth.loadingDescription"],
  signedOut: ["auth.signInTitle", "auth.signInDescription"],
} as const;

export function TmsAuthState({
  kind,
  onAction,
}: {
  readonly kind: AuthStateKind;
  readonly onAction?: () => void;
}) {
  const { t } = useTmsLocale();
  const [title, description] = copy[kind];
  const Icon = kind === "loading"
    ? LoaderCircle
    : kind === "signedOut"
      ? ShieldCheck
      : AlertTriangle;
  return (
    <main className={`${styles.app} ${styles.authPage}`}>
      <section
        className={styles.authPanel}
        role={kind === "error" || kind === "configuration" ? "alert" : "status"}
        aria-live="polite"
      >
        <Icon
          className={kind === "loading" ? styles.authSpinner : undefined}
          size={24}
          aria-hidden="true"
        />
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
        {onAction && (
          <button type="button" className={styles.authAction} onClick={onAction}>
            <LogIn size={17} aria-hidden="true" />
            {t(kind === "signedOut" ? "auth.signIn" : "auth.retry")}
          </button>
        )}
      </section>
    </main>
  );
}
