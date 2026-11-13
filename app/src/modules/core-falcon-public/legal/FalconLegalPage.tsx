"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FalconLegalHeader } from "../navigation/presentation/FalconLegalHeader";
import styles from "../privacy/privacy.module.css";
import type { LegalDocument } from "./readLegalDocument";

type Locale = "en" | "ru";

const labels = {
  en: { language: "Document language", related: "Related policies", terms: "Terms of Service", privacy: "Privacy Policy", billing: "Subscription and Billing" },
  ru: { language: "Язык документа", related: "Другие документы", terms: "Условия использования", privacy: "Политика конфиденциальности", billing: "Условия подписки и оплаты" },
};
const routes: Record<LegalDocument, string> = { terms: "/terms/", privacy: "/privacy/", billing: "/billing-terms/" };

export function FalconLegalPage({ document, versions }: { document: LegalDocument; versions: Record<Locale, string> }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const syncLocale = () => setLocale(new URLSearchParams(window.location.search).get("lang") === "ru" ? "ru" : "en");
    syncLocale();
    window.addEventListener("popstate", syncLocale);
    return () => window.removeEventListener("popstate", syncLocale);
  }, []);

  const copy = labels[locale];
  return <div className={styles.page} lang={locale}>
    <FalconLegalHeader locale={locale} languageLabel={copy.language} browserHome={locale === "ru" ? "/ru/" : "/"}>
      <a href="?lang=en" lang="en" aria-current={locale === "en" ? "page" : undefined}>English</a>
      <a href="?lang=ru" lang="ru" aria-current={locale === "ru" ? "page" : undefined}>Русский</a>
    </FalconLegalHeader>
    <main className={styles.content}>
      <article className={styles.legalBody}>
        <Markdown remarkPlugins={[remarkGfm]} components={{
          table: ({ children }) => <div className={styles.legalTable}><table>{children}</table></div>,
        }}>{versions[locale]}</Markdown>
      </article>
      <footer>
        <nav className={styles.legalFooter} aria-label={copy.related}>
          {(Object.keys(routes) as LegalDocument[]).filter(key => key !== document).map(key => (
            <a key={key} href={`${routes[key]}?lang=${locale}`}>{copy[key]}</a>
          ))}
        </nav>
      </footer>
    </main>
  </div>;
}
