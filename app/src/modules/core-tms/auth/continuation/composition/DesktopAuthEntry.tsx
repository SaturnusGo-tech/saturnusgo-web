"use client";
import { useEffect, useState, type ReactNode } from "react";
import { captureBrowserDesktopAttempt, clearBrowserDesktopAttempt } from "../desktop/browser-desktop-attempt";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
import styles from "../../managed/presentation/screen/access.module.css";
export function DesktopRestartScreen() {
  const { locale } = useTmsLocale(), ru = locale === "ru";
  return <main className={styles.page} lang={locale}><section className={styles.content} role="alert">
    <span className={styles.brand} aria-label="Falcon"><span className={styles.brandMark} aria-hidden="true" /></span>
    <h1>{ru ? "Начните вход из приложения Falcon" : "Start sign-in from the Falcon app"}</h1>
    <p className={styles.lead}>{ru ? "Не удалось сохранить или продолжить вход в приложение. Вернитесь в Falcon и начните вход ещё раз." : "App sign-in could not be saved or resumed. Return to Falcon and start sign-in again."}</p>
    <button className={styles.secondary} onClick={() => { clearBrowserDesktopAttempt(); window.location.reload(); }}>
      {ru ? "Отменить вход в приложение" : "Cancel app sign-in"}</button>
  </section></main>;
}
export function DesktopAuthEntry({ children, managedWorkspace = false }: { readonly children: ReactNode; readonly managedWorkspace?: boolean }) {
  const [status, setStatus] = useState<"checking" | "ready" | "blocked">("checking");
  useEffect(() => { setStatus(captureBrowserDesktopAttempt(managedWorkspace).status === "blocked" ? "blocked" : "ready"); }, [managedWorkspace]);
  return status === "checking" ? <TmsAuthState kind="loading" /> : status === "blocked" ? <DesktopRestartScreen /> : children;
}
