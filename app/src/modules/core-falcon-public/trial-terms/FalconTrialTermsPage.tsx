"use client";
import { useEffect, useState } from "react";
import { trialTermsCopy } from "./copy";
import styles from "../privacy/privacy.module.css";
export function FalconTrialTermsPage() {
  const [locale, setLocale] = useState<"en" | "ru">("en");
  useEffect(() => {
    const sync = () => setLocale(new URLSearchParams(window.location.search).get("lang") === "ru" ? "ru" : "en");
    sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync);
  }, []);
  const copy = trialTermsCopy(locale);
  return <div className={styles.page} lang={locale}>
    <header className={styles.header}><a className={styles.brand} href={`/?lang=${locale}`} aria-label={copy.back}>falcon<span aria-hidden="true">↗</span></a>
      <nav className={styles.languages} aria-label={copy.language}><a href="?lang=en" lang="en" aria-current={locale === "en" ? "page" : undefined}>English</a>
        <a href="?lang=ru" lang="ru" aria-current={locale === "ru" ? "page" : undefined}>Русский</a></nav></header>
    <main className={styles.content}><p className={styles.updated}>{copy.updated}</p><h1>{copy.title}</h1><p className={styles.intro}>{copy.intro}</p>
      <a className={styles.contact} href="mailto:falcon@saturnusgo.com">falcon@saturnusgo.com ↗</a>
      {copy.sections.map(([title, ...paragraphs], index) => <section key={title} aria-labelledby={`trial-term-${index}`}><h2 id={`trial-term-${index}`}>{index + 1}. {title}</h2>
        {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <footer><a href={`/privacy/?lang=${locale}`}>{copy.privacy} ↗</a><br /><br /><a href={`/signup/?lang=${locale}`}>{copy.back} ↗</a></footer>
    </main>
  </div>;
}
