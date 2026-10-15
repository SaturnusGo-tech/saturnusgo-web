"use client";

import { useEffect, useState } from "react";
import { en, ru } from "./content/en-ru";
import { es, pt } from "./content/es-pt";
import styles from "./privacy.module.css";

const copies = { en, ru, es, pt };
type Locale = keyof typeof copies;
const languages: { locale: Locale; label: string }[] = [
  { locale: "en", label: "English" }, { locale: "ru", label: "Русский" },
  { locale: "es", label: "Español" }, { locale: "pt", label: "Português" },
];
export function FalconPrivacyPage() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const sync = () => {
      const candidate = new URLSearchParams(window.location.search).get("lang");
      setLocale(candidate === "ru" || candidate === "es" || candidate === "pt" ? candidate : "en");
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const copy = copies[locale];
  return <div className={styles.page} lang={locale}>
    <header className={styles.header}>
      <a className={styles.brand} href={`/?lang=${locale}`} aria-label={copy.back}>falcon<span aria-hidden="true">↗</span></a>
      <nav className={styles.languages} aria-label={copy.language}>
        {languages.map(item => <a key={item.locale} href={`?lang=${item.locale}`} lang={item.locale}
          aria-current={locale === item.locale ? "page" : undefined}>{item.label}</a>)}
      </nav>
    </header>
    <main className={styles.content}>
      <p className={styles.updated}>{copy.updated}</p>
      <h1>{copy.title}</h1>
      <p className={styles.intro}>{copy.intro}</p>
      <a className={styles.contact} href="mailto:mercury143143@yahoo.com">mercury143143@yahoo.com ↗</a>
      {copy.sections.map(([heading, ...paragraphs], index) => <section key={index} aria-labelledby={`privacy-${index}`}>
        <h2 id={`privacy-${index}`}>{heading}</h2>
        {paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
      </section>)}
      <p><a href="https://www.argentina.gob.ar/aaip/datospersonales/derechos" target="_blank" rel="noopener noreferrer">{copy.rightsLink} ↗</a></p>
      <footer><a href={`/?lang=${locale}#book-demo`}>{copy.back} ↗</a></footer>
    </main>
  </div>;
}
