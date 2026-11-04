"use client";

import { useEffect, useRef, useState } from "react";
import { ArticleContent } from "./ArticleContent";
import { publicDocLabels } from "./copy";
import type { PublicDocCatalog, PublicDocLocale } from "./model";
import styles from "./documentation.module.css";

function Icon({ name }: { name: "search" | "menu" | "close" | "arrow" }) {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "search" ? <><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></> : name === "menu" ? <path d="M3 5h14M3 10h14M3 15h14" /> : name === "close" ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="m8 5 5 5-5 5" />}
  </svg>;
}

export function PublicDocumentation({ articles, groups, locale }: PublicDocCatalog & { locale: PublicDocLocale }) {
  const labels = publicDocLabels(locale);
  const basePath = locale === "ru" ? "/ru/docs/" : "/docs/";
  const [activeId, setActiveId] = useState("introduction");
  const [query, setQuery] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const active = articles.find(article => article.id === activeId) ?? articles[0];
  const terms = query.toLocaleLowerCase(locale).trim().split(/\s+/).filter(Boolean);
  const matches = terms.length ? articles.filter(article => {
    const searchable = `${article.title} ${article.description} ${article.keywords.join(" ")} ${JSON.stringify(article.sections)}`.toLocaleLowerCase(locale);
    return terms.every(term => searchable.includes(term));
  }) : [];

  useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(window.location.search).get("article");
      setActiveId(articles.some(article => article.id === id) ? id! : "introduction");
    };
    sync();
    window.addEventListener("popstate", sync);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavigationOpen(false); searchRef.current?.blur(); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setNavigationOpen(true);
        window.requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("keydown", keyboard); };
  }, [articles]);

  useEffect(() => {
    document.title = `${active.title} · Falcon Docs`;
    document.documentElement.lang = locale;
  }, [active.title, locale]);

  function navigate(id: string) {
    setActiveId(id); setQuery(""); setNavigationOpen(false);
    window.history.pushState(null, "", `${basePath}?article=${encodeURIComponent(id)}`);
    window.scrollTo({ top: 0, behavior: "instant" });
    window.requestAnimationFrame(() => document.getElementById("public-doc-title")?.focus({ preventScroll: true }));
  }

  return <div className={styles.page} lang={locale}>
    <a className={styles.skipLink} href="#public-doc-content">{labels.onPage}</a>
    <header className={styles.header}>
      <div className={styles.headerBrand}>
        <button className={styles.mobileToggle} type="button" onClick={() => setNavigationOpen(!navigationOpen)} aria-expanded={navigationOpen} aria-controls="public-doc-nav" aria-label={navigationOpen ? labels.close : labels.browse}><Icon name={navigationOpen ? "close" : "menu"} /></button>
        <a href={locale === "ru" ? "/ru/" : "/"} className={styles.brand} aria-label={labels.home}><img src="/falcon/landing/2026-11/falcon-line-mark.svg" style={{ filter: "invert(1)" }} alt="" width="30" height="30" /><span>Falcon</span></a><span className={styles.brandDivider} /><span className={styles.docLabel}>{labels.docs}</span>
      </div>
      <nav className={styles.headerActions} aria-label={locale === "ru" ? "Язык и приложение" : "Language and app"}>
        <div className={styles.languages}><a href={`/docs/?article=${active.id}`} aria-current={locale === "en" ? "page" : undefined} lang="en">EN</a><a href={`/ru/docs/?article=${active.id}`} aria-current={locale === "ru" ? "page" : undefined} lang="ru">RU</a></div>
        <a className={styles.openApp} href={`/cloud-login/?lang=${locale}`}>{labels.open}<Icon name="arrow" /></a>
      </nav>
    </header>
    <div className={styles.layout}>
      <aside id="public-doc-nav" className={`${styles.sidebar} ${navigationOpen ? styles.sidebarOpen : ""}`} aria-label={labels.browse}>
        <div className={styles.search}><Icon name="search" /><input ref={searchRef} type="search" placeholder={labels.search} aria-label={labels.search} value={query} onChange={event => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div>
        {terms.length ? <div className={styles.searchResults}><p className={styles.groupTitle}>{labels.results} <span>{matches.length}</span></p>{matches.map(article => <a key={article.id} href={`?article=${article.id}`} onClick={event => { event.preventDefault(); navigate(article.id); }}>{article.title}</a>)}{!matches.length && <p className={styles.noResults}>{labels.empty}</p>}</div> : <nav>{groups.map(group => <section key={group.id} className={styles.navGroup}><p className={styles.groupTitle}>{group.title}</p>{articles.filter(article => article.group === group.id).map(article => <a key={article.id} href={`?article=${article.id}`} aria-current={article.id === active.id ? "page" : undefined} onClick={event => { event.preventDefault(); navigate(article.id); }}>{article.title}</a>)}</section>)}</nav>}
      </aside>
      <main id="public-doc-content" className={styles.main}>
        <div className={styles.eyebrow}>{groups.find(group => group.id === active.group)?.title}<span>·</span>{Math.max(1, Math.ceil(JSON.stringify(active.sections).split(/\s+/).length / 180))} {labels.min}</div>
        <h1 id="public-doc-title" tabIndex={-1}>{active.id === "introduction" ? labels.introduction : active.title}</h1>
        <p className={styles.description}>{active.id === "introduction" ? labels.introductionText : active.description}</p>
        <article className={styles.prose}>{active.sections.map(section => <section id={section.id} key={section.id} className={styles.section}><h2><a href={`#${section.id}`}>{section.title}</a></h2>{section.blocks.map((block, index) => <ArticleContent key={`${section.id}-${index}`} block={block} articles={articles} locale={locale} onNavigate={navigate} />)}</section>)}</article>
        {active.related.length > 0 && <footer className={styles.related}><h2>{labels.next}</h2><ArticleContent block={{ kind: "articles", ids: active.related }} articles={articles} locale={locale} onNavigate={navigate} /></footer>}
      </main>
      <aside className={styles.outline} aria-label={labels.onPage}><p>{labels.onPage}</p><nav>{active.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav></aside>
    </div>
  </div>;
}
