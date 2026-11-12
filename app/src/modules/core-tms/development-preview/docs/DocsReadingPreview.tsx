"use client";

import { useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../auth/http/TmsHttpClientContext";
import { TmsLocaleContext } from "../../localization/context/TmsLocaleProvider";
import type { TmsLocale } from "../../localization/model/locale";
import { ProductDocsContext } from "../../product-docs/composition/context/ProductDocsContext";
import { ProductDocsView } from "../../product-docs/presentation/ProductDocsView";
import { ProductDocsPanel } from "../../product-docs/presentation/panel/ProductDocsPanel";
import type { ProductDocSelection } from "../../product-docs/domain/product-docs";
import { createReadingFixture, readingScope } from "./docs-reading-fixture";
import styles from "./docs-reading-preview.module.css";

export function DocsReadingPreview() {
  const [locale, setLocale] = useState<TmsLocale>("ru");
  const [selection, setSelection] = useState<ProductDocSelection | undefined>({ docId: "calendar" });
  const [panel, setPanel] = useState<ProductDocSelection>();
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const drafts = useRef(new Map());
  const { resolvedTheme, setTheme } = useTheme();
  const fixture = useMemo(() => createReadingFixture(locale === "ru"), [locale]);
  const http = useMemo(() => {
    const meta = { hasMore: false, nextCursor: null, limit: 100 };
    const catalog = fixture.cases.map((c, i) => ({ id: c.caseId, title: c.title, projectId: "host", key: `HOST-TC-${i + 1}`,
      folderPath: i === 2 ? "Calendar/Recovery" : "Calendar", folderId: i === 2 ? "recovery" : "calendar", currentRevision: 1,
      type: "manual", lifecycle: "ready", priority: "high", component: "Calendar", ownerIdentityId: "qa", tags: [],
      estimatedMinutes: 5, revisionCount: 1, archivedAt: null, createdAt: "2026-11-12T03:00:00Z", updatedAt: "2026-11-12T03:00:00Z", etag: "1" }));
    return {
      async get(path: string) {
        if (path.includes("/actors")) return { data: [{ identityId: "qa", name: "Alex Morgan", kind: "human", email: null,
          role: "qa_manager", presence: "online", lastSignedInAt: "2026-11-12T03:00:00Z", workspaceName: "Preview" }], meta };
        if (path.includes("/folders")) return { data: [{ id: "calendar", name: "Calendar", path: "Calendar", parentId: null, projectId: "host" },
          { id: "recovery", name: "Recovery", path: "Calendar/Recovery", parentId: "calendar", projectId: "host" }], meta };
        if (path.startsWith("/test-cases")) return { data: catalog, meta };
        return { data: [], meta };
      },
      async mutateResource(_path: string, _method: string, body: {kind: string; id: string}) {
        const doc = fixture.docs.find(d => d.id === body.id), testcase = catalog.find(c => c.id === body.id);
        return { data: { kind: body.kind, title: doc?.title ?? testcase?.title ?? body.id, description: null,
          host: null, path: [], status: doc ? doc.publishedVersion ? "published" : "draft" : "ready", priority: testcase?.priority } };
      },
    } as unknown as TmsHttpClient;
  }, [fixture]);
  const context = { api: fixture.api, scope: readingScope, open: setPanel, openDocument: setPanel,
    openCase: (id: string) => setNotice(`${locale === "ru" ? "Выбран кейс" : "Selected case"}: ${id}`) };
  return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale, t: key => key }}>
    <TmsHttpClientProvider client={http}><ProductDocsContext.Provider value={context}>
      <div className={styles.preview} data-falcon-workspace ref={root}>
        <nav className={styles.controls} aria-label="Local preview controls">
          <span>{locale === "ru" ? "Локальная проверка · пример данных" : "Local preview · sample data"}</span>
          <button onClick={() => { setLocale(locale === "ru" ? "en" : "ru"); drafts.current.clear(); }}>{locale === "ru" ? "English" : "Русский"}</button>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "Light" : "Dark"}</button>
          {notice && <span role="status">{notice}</span>}
        </nav>
        <div className={styles.workspace}>
          <ProductDocsView key={locale} api={fixture.api} scope={readingScope} locale={locale} projectName="Umbrella Host"
            drafts={drafts.current} selection={selection} onSelect={setSelection} onOpenCase={({caseId}) => context.openCase(caseId)} />
        </div>
        <ProductDocsPanel api={fixture.api} scope={readingScope} locale={locale} projectName="Umbrella Host" contentRef={root}
          selection={panel} onClose={() => setPanel(undefined)} onOpenFull={next => { setPanel(undefined); setSelection(next); }} />
      </div>
    </ProductDocsContext.Provider></TmsHttpClientProvider>
  </TmsLocaleContext.Provider>;
}
