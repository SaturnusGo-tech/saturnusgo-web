"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { TmsHttpClientProvider } from "../../auth/http/TmsHttpClientContext";
import { TmsLocaleContext } from "../../localization/context/TmsLocaleProvider";
import type { TmsLocale } from "../../localization/model/locale";
import { ApiSourceManager } from "../../api-sources/presentation/ApiSourceManager";
import { createApiTestingFixture, previewProject, previewSpecification, previewWorkspace } from "./api-testing-fixture";
import styles from "./api-testing-preview.module.css";

const SwaggerDocument = dynamic(() => import("../../presentation/api-testing/renderer/SwaggerDocument"), { ssr: false });

export function ApiTestingPreview() {
  const [locale, setLocale] = useState<TmsLocale>("en");
  const [tab, setTab] = useState<"connections" | "requests">("connections");
  const [notice, setNotice] = useState("");
  const { resolvedTheme, setTheme } = useTheme();
  const http = useMemo(createApiTestingFixture, []);
  if (process.env.NODE_ENV === "production") return null;
  return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale, t: key => key }}>
    <TmsHttpClientProvider client={http}>
      <div className={styles.preview} data-falcon-workspace>
        <nav className={styles.controls} aria-label="Local preview controls">
          <span>Local-only preview · sample connections · edits stay in memory</span>
          <button onClick={() => setLocale(locale === "ru" ? "en" : "ru")}>{locale === "ru" ? "English" : "Русский"}</button>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
        </nav>
        <div className={styles.tabs}>
          <button aria-pressed={tab === "connections"} onClick={() => setTab("connections")}>API connections</button>
          <button aria-pressed={tab === "requests"} onClick={() => setTab("requests")}>API Testing · public GET</button>
          <span role="status">{notice}</span>
        </div>
        <main className={tab === "connections" ? styles.settings : styles.requests}>
          {tab === "connections" ? <ApiSourceManager workspaceId={previewWorkspace} projectId={previewProject}
            onBack={() => setNotice("Preview navigation: Swagger")}
            onSaved={source => setNotice(`Saved locally: ${source.name}`)}/> : <>
            <h1>{locale === "ru" ? "API-тестирование" : "API Testing"}</h1>
            <p className={styles.warning}>Public echo service: use only <code>falcon-preview</code> as the token. Do not enter real credentials.</p>
            <SwaggerDocument specification={previewSpecification} sourceUrl="https://example.com/openapi.json"/>
          </>}
        </main>
      </div>
    </TmsHttpClientProvider>
  </TmsLocaleContext.Provider>;
}
