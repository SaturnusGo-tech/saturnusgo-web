"use client";
import { useEffect, useState } from "react";
import { FalconLegalHeader } from "../navigation/presentation/FalconLegalHeader";
import { usePublicReturnNavigation } from "../navigation/browser/usePublicReturnNavigation";
import { trialTermsCopy } from "./copy";
import styles from "../privacy/privacy.module.css";
export function FalconTrialTermsPage() {
  const [locale, setLocale] = useState<"en" | "ru">("en");
  const navigation = usePublicReturnNavigation(`/?lang=${locale}`, `/signup/?lang=${locale}`);
  useEffect(() => {
    const sync = () => setLocale(new URLSearchParams(window.location.search).get("lang") === "ru" ? "ru" : "en");
    sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync);
  }, []);
  const copy = trialTermsCopy(locale);
  return <div className={styles.page} lang={locale}>
    <FalconLegalHeader locale={locale} languageLabel={copy.language} browserHome={`/?lang=${locale}`} browserBack={`/signup/?lang=${locale}`}>
      <a href="?lang=en" lang="en" aria-current={locale === "en" ? "page" : undefined}>English</a>
      <a href="?lang=ru" lang="ru" aria-current={locale === "ru" ? "page" : undefined}>Русский</a>
    </FalconLegalHeader>
    <main className={styles.content}><p className={styles.updated}>{copy.updated}</p><h1>{copy.title}</h1><p className={styles.intro}>{copy.intro}</p>
      <a className={styles.contact} href="mailto:falcon@saturnusgo.com">falcon@saturnusgo.com ↗</a>
      {copy.sections.map(([title, ...paragraphs], index) => <section key={title} aria-labelledby={`trial-term-${index}`}><h2 id={`trial-term-${index}`}>{index + 1}. {title}</h2>
        {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <footer><a href={`/privacy/?lang=${locale}`}>{copy.privacy} ↗</a><br /><br /><a href={navigation.desktop ? navigation.backHref : `/signup/?lang=${locale}`}>{copy.back} ↗</a></footer>
    </main>
  </div>;
}
