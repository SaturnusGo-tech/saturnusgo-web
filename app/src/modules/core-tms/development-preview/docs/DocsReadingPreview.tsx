"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { TmsHttpClientProvider } from "../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../localization/context/TmsLocaleProvider";
import type { TmsLocale } from "../../localization/model/locale";
import { tmsMessages } from "../../localization/catalog/messages";
import { interpolateMessage } from "../../localization/model/message";
import { ProductDocsContext } from "../../product-docs/composition/context/ProductDocsContext";
import { ProductDocsView } from "../../product-docs/presentation/ProductDocsView";
import { ProductDocsPanel } from "../../product-docs/presentation/panel/ProductDocsPanel";
import type { ProductDocSelection } from "../../product-docs/domain/product-docs";
import appShell from "../../tms.module.css";
import { createReadingFixture } from "./docs-reading-fixture";
import { readingRoles, type ReadingRole } from "./fixtures/reading-access";
import { readingScope } from "./fixtures/reading-scope";
import { createReadingHttpClient } from "./network/reading-http-client";
import { readingPreviewFetch } from "./network/reading-preview-fetch";
import { DocsPreviewControls } from "./controls/DocsPreviewControls";
import styles from "./docs-reading-preview.module.css";

export function DocsReadingPreview() {
  const [locale, setLocale] = useState<TmsLocale>(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "ru");
  const [role, setRole] = useState<ReadingRole>(() => typeof window === "undefined" ? "workspace_admin"
    : readingRoles.find(value => value === new URLSearchParams(window.location.search).get("role")) ?? "workspace_admin");
  const [selection, setSelection] = useState<ProductDocSelection | undefined>({ docId: "calendar" });
  const [panel, setPanel] = useState<ProductDocSelection>(), [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0), [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null), drafts = useRef(new Map());
  const generation = useRef(0);
  const { resolvedTheme, setTheme } = useTheme();
  const fixture = useMemo(() => {
    const current = generation.current;
    return createReadingFixture(locale === "ru", role, (action, id) => {
      if (generation.current === current) setNotice(`Memory only · ${action} · ${id}`);
    });
  }, [locale, role, revision]);
  const http = useMemo(() => createReadingHttpClient(fixture, role), [fixture, role]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const previous = window.fetch, safe = readingPreviewFetch(window.location.origin, previous);
    window.fetch = safe; setReady(true);
    return () => { if (window.fetch === safe) window.fetch = previous; };
  }, []);
  useEffect(() => {
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "light" || theme === "dark") setTheme(theme);
  }, [setTheme]);
  function preference(name: string, value: string) {
    const url = new URL(window.location.href); url.searchParams.set(name, value);
    window.history.replaceState(window.history.state, "", url);
  }
  function resetDrafts() { generation.current++; drafts.current.clear(); setPanel(undefined); setNotice(""); }
  const context = { api: fixture.api, scope: readingScope, open: setPanel, openDocument: setPanel,
    openCase: (id: string) => setNotice(`${locale === "ru" ? "Выбран кейс" : "Selected case"}: ${id}`) };
  const localeContext = { locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale,
    t: (key: keyof typeof tmsMessages.en, variables?: Record<string, string | number>) => interpolateMessage(tmsMessages[locale][key], variables) };
  if (process.env.NODE_ENV === "production") return null;
  return <TmsLocaleContext.Provider value={localeContext}>
    <TmsSessionProvider value={{ kind: "managed", subject: `local-docs-${role}`, label: role, workspaceId: readingScope.workspaceId,
      workspaceRole: role, companyCapabilities: ["core"], signOut: async () => {} }}>
    <TmsHttpClientProvider client={http}><ProductDocsContext.Provider value={context}>
      <div className={`${appShell.app} ${styles.preview}`} data-falcon-workspace ref={root}>
        <DocsPreviewControls role={role} ru={locale === "ru"} dark={resolvedTheme === "dark"} notice={notice}
          onRole={next => { resetDrafts(); preference("role", next); setRole(next); }}
          onLocale={() => { resetDrafts(); const next = locale === "ru" ? "en" : "ru"; preference("lang", next); setLocale(next); }}
          onTheme={() => { const next = resolvedTheme === "dark" ? "light" : "dark"; preference("theme", next); setTheme(next); }}
          onSelect={setSelection} onReset={() => { resetDrafts(); setRevision(value => value + 1); }}
          onConflict={() => { fixture.injectConflict(); setNotice("Next lifecycle command returns PRODUCT_DOC_STALE_DRAFT"); }}/>
        {ready && <div className={styles.workspace}>
          <ProductDocsView key={`${locale}:${role}:${revision}`} api={fixture.api} scope={readingScope} locale={locale} projectName="Umbrella Host"
            drafts={drafts.current} selection={selection} onSelect={setSelection} onOpenCase={({ caseId }) => context.openCase(caseId)}/>
        </div>}
        {ready && <ProductDocsPanel key={`${locale}:${role}:${revision}`} api={fixture.api} scope={readingScope} locale={locale} projectName="Umbrella Host" contentRef={root}
          selection={panel} onClose={() => setPanel(undefined)} onOpenFull={next => { setPanel(undefined); setSelection(next); }} />}
      </div>
    </ProductDocsContext.Provider></TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
}
