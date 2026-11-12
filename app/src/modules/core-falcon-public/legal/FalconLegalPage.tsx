"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FalconBrandMark } from "../../../shared/components/brand/FalconBrandMark";
import styles from "../privacy/privacy.module.css";
import type { LegalDocument } from "./readLegalDocument";

type Locale = "en" | "ru";

const labels = {
  en: { home: "Falcon home", language: "Document language", related: "Related policies", terms: "Terms of Service", privacy: "Privacy Policy", billing: "Subscription and Billing", deletion: "Data Deletion Policy" },
  ru: { home: "Главная Falcon", language: "Язык документа", related: "Другие документы", terms: "Условия использования", privacy: "Политика конфиденциальности", billing: "Условия подписки и оплаты", deletion: "Политика удаления данных" },
};
const routes: Record<LegalDocument, string> = { terms: "/terms/", privacy: "/privacy/", billing: "/billing-terms/", deletion: "/data-deletion/" };

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
    <header className={styles.header}>
      <a className={styles.brand} href={locale === "ru" ? "/ru/" : "/"} aria-label={copy.home}>
        <FalconBrandMark className={styles.brandMark} />
        falcon<span className={styles.brandArrow} aria-hidden="true">↗</span>
      </a>
      <nav className={styles.languages} aria-label={copy.language}>
        <a href="?lang=en" lang="en" aria-current={locale === "en" ? "page" : undefined}>English</a>
        <a href="?lang=ru" lang="ru" aria-current={locale === "ru" ? "page" : undefined}>Русский</a>
      </nav>
    </header>
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
