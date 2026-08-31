"use client";

import { AlertTriangle, LogIn } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { TessiqLoader } from "../../../presentation/common/loading/TessiqLoader";
import styles from "../../../tms.module.css";

type AuthStateKind = "configuration" | "error" | "loading";

const copy = {
  configuration: ["auth.configurationTitle", "auth.configurationDescription"],
  error: ["auth.errorTitle", "auth.errorDescription"],
} as const;

export function TmsAuthState({
  kind,
  onAction,
}: {
  readonly kind: AuthStateKind;
  readonly onAction?: () => void;
}) {
  const { t } = useTmsLocale();
  if (kind === "loading") {
    return (
      <main className={`${styles.app} ${styles.authLoaderPage}`}>
        <TessiqLoader label={t("auth.loadingTitle")} testId="auth-session-loading" />
      </main>
    );
  }
  const [title, description] = copy[kind];
  return (
    <main className={`${styles.app} ${styles.authPage}`}>
      <section
        className={styles.authPanel}
        role={kind === "error" || kind === "configuration" ? "alert" : "status"}
        aria-live="polite"
      >
        <AlertTriangle size={24} aria-hidden="true" />
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
        {onAction && (
          <button type="button" className={styles.authAction} onClick={onAction}>
            <LogIn size={17} aria-hidden="true" />
            {t("auth.retry")}
          </button>
        )}
      </section>
    </main>
  );
}
