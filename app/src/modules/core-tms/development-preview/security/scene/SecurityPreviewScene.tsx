"use client";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { ConfigView } from "../../../presentation/config/ConfigView";
import { createSecurityPreviewClient } from "../security-preview-client";
import { securityPreviewFetch } from "../network/security-preview-fetch";
import styles from "../security-preview.module.css";

export function SecurityPreviewScene() {
  const query = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState<"managed" | "cloud">(() => query.get("mode") === "cloud" ? "cloud" : "managed");
  const [mfa, setMfa] = useState(() => query.get("mfa") !== "false");
  const [ready, setReady] = useState(false);
  const { locale, setLocale } = useTmsLocale(), { resolvedTheme, setTheme } = useTheme();
  const fixture = useMemo(() => createSecurityPreviewClient(mfa), [mfa]);
  useEffect(() => {
    const previous = window.fetch;
    const previewFetch = securityPreviewFetch(window.location.origin, fixture.fetch, previous);
    window.fetch = previewFetch;
    const url = new URL(window.location.href);
    url.searchParams.set("view", "config"); url.searchParams.set("settings", "security");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    setReady(true);
    return () => { if (window.fetch === previewFetch) window.fetch = previous; };
  }, [fixture]);
  useEffect(() => {
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "dark" || theme === "light") setTheme(theme);
  }, [setTheme]);
  return <div className={styles.preview} data-falcon-workspace>
    <nav className={styles.tools} aria-label="Local preview controls">
      <strong>{locale === "ru" ? "Локальный пример · тестовые данные · реальные изменения отключены" : "Local preview · sample data · real security changes disabled"}</strong>
      <button type="button" onClick={() => setLocale(locale === "en" ? "ru" : "en")}>{locale === "en" ? "Русский" : "English"}</button>
      <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
      <button type="button" onClick={() => setMode(mode === "managed" ? "cloud" : "managed")}>{mode === "managed" ? "Personal account" : "Company account"}</button>
      <button type="button" aria-pressed={mfa} onClick={() => setMfa(!mfa)}>MFA {mfa ? "on" : "off"}</button>
    </nav>
    {ready && <TmsSessionProvider value={{ kind: mode, subject: "sample-security-person", label: "Alex Morgan",
      workspaceId: "sample-security-workspace", workspaceRole: "tester", signOut: () => Promise.resolve() }}>
      <TmsHttpClientProvider client={fixture.http}>
        <div className={styles.workspace} key={`${mode}:${mfa}`} onClickCapture={event => {
          if ((event.target as Element).closest("a")) { event.preventDefault(); event.stopPropagation(); }
        }}><ConfigView environments={[]} workspaceId="sample-security-workspace" offline canManageProject={false}
          onEnvironmentSaved={() => {}} onToggleEnvironment={() => {}} onProjectUpdated={() => {}}
          onToggleProject={() => {}} exchange={null}/></div>
      </TmsHttpClientProvider>
    </TmsSessionProvider>}
  </div>;
}
