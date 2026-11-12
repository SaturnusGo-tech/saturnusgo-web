"use client";

import { useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { DashboardView } from "../../presentation/dashboard/DashboardView";
import { TmsHttpClientProvider } from "../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../localization/context/TmsLocaleProvider";
import { tmsMessages } from "../../localization/catalog/messages";
import { interpolateMessage } from "../../localization/model/message";
import type { TmsLocale } from "../../localization/model/locale";
import { createDashboardLoadingFixture, previewScope, type PreviewMode } from "./dashboard-loading-fixture";
import styles from "./dashboard-loading-preview.module.css";

export function DashboardLoadingPreview() {
  const [mode, setMode] = useState<PreviewMode>("slow"), [revision, setRevision] = useState(0), [refresh, setRefresh] = useState(0);
  const [locale, setLocale] = useState<TmsLocale>("en"), [events, setEvents] = useState<string[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const log = useCallback((message: string) => setEvents(previous => [...previous.slice(-19), `${new Date().toLocaleTimeString()} ${message}`]), []);
  const fixture = useMemo(() => createDashboardLoadingFixture(mode, log), [mode, revision, log]);
  const analytics = useMemo(() => ({ ...fixture.analytics }), [fixture, refresh]);
  const localeContext = useMemo(() => ({ locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale,
    t: (key: keyof typeof tmsMessages.en, variables?: Record<string, string | number>) => interpolateMessage(tmsMessages[locale][key], variables) }), [locale]);
  if (process.env.NODE_ENV === "production") return null;
  const restart = (next: PreviewMode) => { setEvents([]); setMode(next); setRevision(value => value + 1); };
  return <TmsLocaleContext.Provider value={localeContext}>
    <TmsSessionProvider value={{ kind: "managed", label: "Preview QA", subject: "dashboard-local-preview", workspaceId: previewScope.workspaceId, workspaceRole: "workspace_admin", signOut: async () => undefined }}>
      <TmsHttpClientProvider client={fixture.http}>
        <div className={styles.preview} data-falcon-workspace>
          <nav className={styles.controls} aria-label="Local dashboard QA controls">
            <strong>Dashboard QA · local memory only</strong>
            <button onClick={() => restart("slow")}>Restart slow</button>
            <button onClick={() => restart("fast")}>Restart fast</button>
            <button onClick={() => restart("legacy")}>Legacy layout</button>
            <button onClick={() => restart("failure")}>Failure</button>
            <button onClick={() => restart("empty")}>Empty</button>
            <button onClick={() => { setRefresh(value => value + 1); window.dispatchEvent(new Event("focus")); }}>Background refresh</button>
            <button onClick={() => setLocale(locale === "en" ? "ru" : "en")}>{locale === "en" ? "Русский" : "English"}</button>
            <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
            <details><summary>Requests · {events.length}</summary><pre>{events.join("\n")}</pre></details>
          </nav>
          <main className={styles.dashboard} key={`${mode}:${revision}`}>
            <DashboardView data={fixture.data} projectId={previewScope.projectId} serverAnalytics analyticsSource={analytics}
              onOpenEntity={() => log("Preview: open entity")} onOpenRow={() => log("Preview: open row")} onCreateRun={() => log("Preview: prepare run")}/>
          </main>
        </div>
      </TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
}
