"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { AttachmentClientProvider } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ImportCasesPage } from "../../../test-cases/exchange/library/presentation/page/ImportCasesPage";
import { createExchangeFixture, exchangeProjects, exchangeWorkspace } from "../exchange-fixture";
import css from "../import-exchange-preview.module.css";

export function ExchangePreviewWorkspace() {
  const { locale, setLocale } = useTmsLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const [events, setEvents] = useState<string[]>([]);
  const fixture = useMemo(() => createExchangeFixture(message => setEvents(rows => [...rows, message])), []);
  const project = exchangeProjects[0];
  if (process.env.NODE_ENV === "production") return null;
  return <TmsSessionProvider value={{ kind: "managed", subject: "preview-human", label: "Alex Morgan", workspaceId: exchangeWorkspace,
    workspaceRole: "qa_manager", signOut: () => Promise.resolve() }}>
    <TmsHttpClientProvider client={fixture.http}><AttachmentClientProvider client={fixture.attachments}>
      <div className={css.preview} data-falcon-workspace>
        <nav className={css.controls} aria-label="Local preview controls">
          <strong>Local development preview · example data · no production requests</strong>
          <button onClick={() => setLocale(locale === "en" ? "ru" : "en")}>{locale === "en" ? "Русский" : "English"}</button>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
          <span role="status" data-preview-writes>Recorded writes: {events.filter(event => event.startsWith("WRITE ")).length}</span>
        </nav>
        <div className={css.workspace} onClickCapture={event => {
          const link = (event.target as Element).closest("a");
          if (link && !link.href.startsWith("blob:") && !link.getAttribute("href")?.startsWith("#")) {
            event.preventDefault(); event.stopPropagation();
            setEvents(rows => [...rows, "NAVIGATION blocked in local-only preview"]);
          }
        }}><ImportCasesPage project={project} workspaceId={exchangeWorkspace} canManage exportEnabled
          onBack={() => setEvents(rows => [...rows, "NAVIGATION Settings"])}
          onImported={() => Promise.resolve()} /></div>
        {events.length > 0 && <details className={css.events}><summary>Local request log</summary><pre>{events.join("\n")}</pre></details>}
      </div>
    </AttachmentClientProvider></TmsHttpClientProvider>
  </TmsSessionProvider>;
}
