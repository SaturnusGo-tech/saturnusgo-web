"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { DocArticle } from "../../core-tms/documentation/model/article";
import { buildDocumentationFolders } from "../../core-tms/documentation/model/library";
import { documentationCopy } from "../../core-tms/documentation/localization/ui-copy";
import { DocumentationArticleContent, DocumentationArticleSections } from "../../core-tms/documentation/presentation/article/DocumentationArticleContent";
import { DocumentationBlocks } from "../../core-tms/documentation/presentation/content/blocks/DocumentationBlocks";
import { DocumentationHome } from "../../core-tms/documentation/presentation/home/DocumentationHome";
import { ArticleCopyButton } from "./ArticleContent";
import { publicDocLabels } from "./copy";
import type { PublicDocCatalog, PublicDocLocale } from "./model";
import { PublicDocsIcon } from "./PublicDocsIcon";
import { PublicDocsNavigation } from "./PublicDocsNavigation";
import { PublicDocsSearch } from "./PublicDocsSearch";
import styles from "./documentation.module.css";

const mark = "/falcon/landing/2026-11/falcon-line-mark.svg";
export type DocumentationReaderCatalog = { articles: readonly DocArticle[]; groups: readonly { id: string; title: string }[] };
export type DocumentationReaderProps = {
  catalog: DocumentationReaderCatalog;
  locale: PublicDocLocale;
  activeId: string;
  href: (id: string, section?: string) => string;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => void;
  renderArticle?: (article: DocArticle) => ReactNode;
  renderHome?: (article: DocArticle) => ReactNode;
  onAskAI?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onLocaleChange?: (locale: PublicDocLocale) => void;
  aiHref?: string;
  appHref?: string;
  embedded?: boolean;
};

export function DocumentationReader({ catalog: { articles, groups }, locale, activeId, href, onNavigate, renderArticle, renderHome, onAskAI, onLocaleChange, aiHref, appHref, embedded = false }: DocumentationReaderProps) {
  const labels = publicDocLabels(locale);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [lightTheme, setLightTheme] = useState(false);
  const [copied, setCopied] = useState(false);
  const active = articles.find(article => article.id === activeId) ?? articles[0];
  const isHome = active.id === "introduction";
  const folders = buildDocumentationFolders(articles, groups, locale);
  const groupTitle = groups.find(group => group.id === active.group)?.title;
  const articleById = new Map(articles.map(article => [article.id, article]));
  const navigation = { link: href, navigate };

  useEffect(() => {
    try { setLightTheme(window.localStorage.getItem("falcon-docs-theme") === "light"); } catch { /* Theme switching also works without storage. */ }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setNavigationOpen(false); setSearchOpen(false); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let section = "";
      try { section = decodeURIComponent(window.location.hash.slice(1)); } catch { /* An invalid hash opens the article from the top. */ }
      const target = active.sections.some(item => item.id === section) ? document.getElementById(section) : null;
      if (target && layoutRef.current?.contains(target)) target.scrollIntoView({ block: "start" });
      else if (embedded) layoutRef.current?.scrollTo({ top: 0, behavior: "instant" });
      else window.scrollTo({ top: 0, behavior: "instant" });
      layoutRef.current?.querySelector<HTMLElement>("#docs-article-title")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active.id, embedded, locale]);

  useEffect(() => {
    setActiveSection(active.sections[0]?.id ?? "");
    if (isHome || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { root: embedded ? layoutRef.current : null, rootMargin: "-90px 0px -65% 0px", threshold: 0 });
    active.sections.forEach(section => { const element = document.getElementById(section.id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [active, isHome, embedded]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { setNavigationOpen(false); setSearchOpen(false); setCopied(false); }
    onNavigate(event, id, section);
  }

  function changeTheme() {
    setLightTheme(value => {
      try { window.localStorage.setItem("falcon-docs-theme", value ? "dark" : "light"); } catch { /* The current selection remains usable. */ }
      return !value;
    });
  }

  async function copyPage() {
    try {
      const text = [active.title, active.description, ...active.sections.flatMap(section => [section.title, ...section.blocks.map(block => {
        if (block.kind === "paragraph" || block.kind === "callout" || block.kind === "code") return block.text;
        if (block.kind === "list") return block.items.join("\n");
        if (block.kind === "steps") return block.items.map((item, index) => `${index + 1}. ${item.title}\n${item.text}`).join("\n");
        if (block.kind === "table") return [block.columns, ...block.rows].map(row => row.join(" | ")).join("\n");
        if (block.kind === "articles") return block.ids.flatMap(id => articleById.get(id)?.title ?? []).join("\n");
        return block.title;
      })])].join("\n\n");
      await navigator.clipboard.writeText(text); setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }

  const defaultArticle = <DocumentationArticleContent article={active} navigation={navigation} copy={documentationCopy[locale]} locale={locale}
    related={active.related.flatMap(id => articleById.get(id) ?? [])} previous={articles[articles.indexOf(active) - 1]} next={articles[articles.indexOf(active) + 1]}
    renderBlocks={blocks => <DocumentationBlocks blocks={blocks} navigation={navigation} articleById={articleById} renderCopy={value => <ArticleCopyButton value={value} locale={locale} />} />} />;

  return <div className={styles.page} lang={locale} data-documentation-reader data-theme={lightTheme ? "light" : "dark"} data-embedded={embedded}>
    <a className={styles.skipLink} href="#public-doc-content">{labels.onPage}</a>
    {navigationOpen && <button className={styles.mobileBackdrop} type="button" aria-label={labels.close} onClick={() => setNavigationOpen(false)} />}
    <aside id="public-doc-nav" className={`${styles.sidebar} ${navigationOpen ? styles.sidebarOpen : ""}`} aria-label={labels.browse}>
      <div className={styles.sidebarBrand}>
        <a href={locale === "ru" ? "/ru/" : "/"} className={styles.brand} aria-label={labels.home}><img src={mark} alt="" width="24" height="24" /><span>Falcon</span></a>
        <span className={styles.brandDivider} />
        <a href={href("introduction")} className={styles.docLabel} onClick={event => navigate(event, "introduction")}>Docs</a>
        <button type="button" className={styles.searchButton} onClick={() => setSearchOpen(true)} aria-label={labels.search} title={`${labels.search} (⌘K)`}><PublicDocsIcon name="search" /></button>
      </div>
      <div className={styles.sidebarScroll}><PublicDocsNavigation folders={folders} articles={articles} activeId={active.id} href={href} onNavigate={navigate} /></div>
      <footer className={styles.sidebarFooter}>
        <a href={href("contact-support")} onClick={event => navigate(event, "contact-support")}>{labels.support}<PublicDocsIcon name="arrow" /></a>
        <a href={locale === "ru" ? "/ru/" : "/"}>{labels.website}<PublicDocsIcon name="external" /></a>
        <div className={styles.languages} aria-label={labels.language}><a href={`/docs/?article=${active.id}`} aria-current={locale === "en" ? "page" : undefined} lang="en" onClick={onLocaleChange ? event => { event.preventDefault(); onLocaleChange("en"); } : undefined}>English</a><span>/</span><a href={`/ru/docs/?article=${active.id}`} aria-current={locale === "ru" ? "page" : undefined} lang="ru" onClick={onLocaleChange ? event => { event.preventDefault(); onLocaleChange("ru"); } : undefined}>Русский</a></div>
      </footer>
    </aside>
    <header className={styles.header}>
      <button className={styles.mobileToggle} type="button" onClick={() => setNavigationOpen(value => !value)} aria-expanded={navigationOpen} aria-controls="public-doc-nav" aria-label={navigationOpen ? labels.close : labels.browse}><PublicDocsIcon name={navigationOpen ? "close" : "menu"} /></button>
      <nav className={styles.breadcrumbs} aria-label={labels.browse}><a href={href("introduction")} onClick={event => navigate(event, "introduction")}>{isHome ? "Falcon Docs" : groupTitle}</a>{!isHome && <><PublicDocsIcon name="chevron" /><span>{active.title}</span></>}</nav>
      <div className={styles.headerActions}>
        <button className={`${styles.iconButton} ${styles.mobileSearch}`} type="button" onClick={() => setSearchOpen(true)} aria-label={labels.search}><PublicDocsIcon name="search" /></button>
        <button className={styles.iconButton} type="button" onClick={changeTheme} aria-label={labels.theme} title={labels.theme} aria-pressed={lightTheme}><PublicDocsIcon name="theme" /></button>
        <button className={styles.copyPage} type="button" onClick={copyPage} aria-label={copied ? labels.copied : labels.copyPage}><PublicDocsIcon name={copied ? "check" : "copy"} /><span aria-live="polite">{copied ? labels.copied : labels.copyPage}</span></button>
        <a className={styles.openApp} href={appHref ?? `/cloud-login/?lang=${locale}`}>{labels.open}<PublicDocsIcon name="arrow" /></a>
      </div>
    </header>
    <div ref={layoutRef} className={`${styles.layout} ${isHome ? styles.homeLayout : ""}`}>
      <main id="public-doc-content" className={`${styles.main} ${isHome ? styles.homeMain : ""}`}>
        {isHome ? renderHome?.(active) ?? <DocumentationHome catalog={{ docArticles: articles, docGroups: groups, articleById, locale }} href={href} onNavigate={navigate} renderIntroduction={article => <DocumentationArticleSections article={article} navigation={navigation} sectionLinkLabel={documentationCopy[locale].sectionLink} renderBlocks={blocks => <DocumentationBlocks blocks={blocks} navigation={navigation} articleById={articleById} renderCopy={value => <ArticleCopyButton value={value} locale={locale} />} />} />} /> : renderArticle?.(active) ?? defaultArticle}
      </main>
      {!isHome && <aside className={styles.outline} aria-label={labels.onPage}><p>{labels.onPage}</p><nav>{active.sections.map(section => <a key={section.id} href={href(active.id, section.id)} aria-current={activeSection === section.id ? "location" : undefined} onClick={() => setActiveSection(section.id)}>{section.title}</a>)}</nav></aside>}
    </div>
    <a className={styles.aiPill} href={aiHref ?? `/cloud-login/?lang=${locale}&guide=chat`} aria-label={onAskAI ? "Falcon AI" : labels.ai} onClick={onAskAI}><img src={mark} alt="" width="20" height="20" /><span>Falcon AI</span></a>
    {searchOpen && <PublicDocsSearch articles={articles} locale={locale} href={href} onClose={() => setSearchOpen(false)} onNavigate={navigate} />}
  </div>;
}

export function PublicDocumentation({ articles, groups, locale }: PublicDocCatalog & { locale: PublicDocLocale }) {
  const basePath = locale === "ru" ? "/ru/docs/" : "/docs/";
  const [activeId, setActiveId] = useState("introduction");
  const active = articles.find(article => article.id === activeId) ?? articles[0];
  const href = (id: string, section?: string) => `${basePath}?article=${encodeURIComponent(id)}${section ? `#${encodeURIComponent(section)}` : ""}`;
  useEffect(() => {
    const sync = () => { const id = new URLSearchParams(window.location.search).get("article"); setActiveId(articles.some(article => article.id === id) ? id! : "introduction"); };
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [articles]);
  useEffect(() => { document.title = active.id === "introduction" ? "Falcon Docs" : `${active.title} · Falcon Docs`; document.documentElement.lang = locale; }, [active, locale]);
  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !articles.some(article => article.id === id)) return;
    event.preventDefault(); setActiveId(id); window.history.pushState(null, "", href(id, section));
    if (!section) window.scrollTo({ top: 0, behavior: "instant" });
    window.requestAnimationFrame(() => section ? document.getElementById(section)?.scrollIntoView() : document.getElementById("docs-article-title")?.focus({ preventScroll: true }));
  }
  return <DocumentationReader catalog={{ articles, groups }} locale={locale} activeId={active.id} href={href} onNavigate={navigate} />;
}
