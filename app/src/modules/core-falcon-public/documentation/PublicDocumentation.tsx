"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { FalconBrandMark } from "../../../shared/components/brand/FalconBrandMark";
import { writeClipboardText } from "../../../shared/lib/clipboard";
import type { DocArticle, DocBlock } from "../../core-tms/documentation/model/article";
import { buildDocumentationFolders } from "../../core-tms/documentation/model/library";
import { barChartText } from "../../core-tms/documentation/model/search";
import { documentationCopy } from "../../core-tms/documentation/localization/ui-copy";
import { DocumentationArticleContent, DocumentationArticleSections } from "../../core-tms/documentation/presentation/article/DocumentationArticleContent";
import { DocumentationBlocks } from "../../core-tms/documentation/presentation/content/blocks/DocumentationBlocks";
import { ArticleWalkthrough } from "../../core-tms/documentation/presentation/walkthrough/ArticleWalkthrough";
import { DocumentationHome } from "../../core-tms/documentation/presentation/home/DocumentationHome";
import { ArticleCopyButton } from "./ArticleContent";
import { publicDocLabels } from "./copy";
import type { PublicDocCatalog, PublicDocLocale } from "./model";
import { PublicDocsIcon } from "./PublicDocsIcon";
import { DocumentationOpenAppAction } from "./DocumentationOpenAppAction";
import { PublicDocsNavigation } from "./PublicDocsNavigation";
import { PublicDocsSearch } from "./PublicDocsSearch";
import styles from "./documentation.module.css";

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
  supportHref?: string;
  embedded?: boolean;
  panelLocation?: { id: string; section?: string };
};

export function DocumentationReader({ catalog: { articles, groups }, locale, activeId, href, onNavigate, renderArticle, renderHome, onAskAI, onLocaleChange, aiHref, appHref, supportHref, embedded = false, panelLocation }: DocumentationReaderProps) {
  const labels = publicDocLabels(locale);
  const panel = Boolean(panelLocation);
  const panelNavigationId = useId();
  const navigationId = panel ? panelNavigationId : "public-doc-nav";
  const readerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const navigationToggleRef = useRef<HTMLButtonElement>(null);
  const restoreArticleFocus = useRef(false);
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
  const navigation = { link: href, navigate, navigateSection: panel ? navigate : undefined };
  const renderCopy = (value: string, isPrompt: boolean) => <ArticleCopyButton value={value} locale={locale} isPrompt={isPrompt} />;

  useEffect(() => {
    try { setLightTheme(window.localStorage.getItem("falcon-docs-theme") === "light"); } catch { /* Theme switching also works without storage. */ }
    const keyboard = (event: KeyboardEvent) => {
      if (event.defaultPrevented || (panel && !readerRef.current?.parentElement?.contains(document.activeElement))) return;
      if (event.key === "Escape") { setNavigationOpen(false); setSearchOpen(false); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [panel]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let section = panelLocation?.section ?? "";
      if (!panelLocation) try { section = decodeURIComponent(window.location.hash.slice(1)); } catch { /* An invalid hash opens the article from the top. */ }
      const target = active.sections.some(item => item.id === section) ? layoutRef.current?.querySelector(`#${CSS.escape(section)}`) : null;
      if (target) target.scrollIntoView({ block: "start" });
      else if (embedded) layoutRef.current?.scrollTo({ top: 0, behavior: "instant" });
      else window.scrollTo({ top: 0, behavior: "instant" });
      if (!panel || restoreArticleFocus.current) {
        (target?.querySelector<HTMLAnchorElement>("h2 a") ?? layoutRef.current?.querySelector<HTMLElement>("#docs-article-title"))?.focus({ preventScroll: true });
        restoreArticleFocus.current = false;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active.id, embedded, locale, panel, panelLocation]);

  useEffect(() => {
    setActiveSection(active.sections[0]?.id ?? "");
    if (isHome || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { root: embedded ? layoutRef.current : null, rootMargin: "-90px 0px -65% 0px", threshold: 0 });
    active.sections.forEach(section => {
      const element = layoutRef.current?.querySelector(`#${CSS.escape(section.id)}`);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [active, isHome, embedded]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      restoreArticleFocus.current = panel;
      setNavigationOpen(false); setSearchOpen(false); setCopied(false);
    }
    onNavigate(event, id, section);
  }

  function closeNavigation() {
    setNavigationOpen(false);
    if (panel) navigationToggleRef.current?.focus({ preventScroll: true });
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
        if (block.kind === "bar-chart") return barChartText(block);
        return block.title;
      })])].join("\n\n");
      await writeClipboardText(text); setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }

  const renderBlocks = (blocks: DocBlock[]) =>
    <DocumentationBlocks blocks={blocks} navigation={navigation} articleById={articleById} renderCopy={renderCopy}
      renderWalkthrough={block => <ArticleWalkthrough block={block} copy={documentationCopy[locale]} />} />;
  const defaultArticle = <DocumentationArticleContent article={active} navigation={navigation} copy={documentationCopy[locale]} locale={locale}
    related={active.related.flatMap(id => articleById.get(id) ?? [])} previous={articles[articles.indexOf(active) - 1]} next={articles[articles.indexOf(active) + 1]}
    renderBlocks={renderBlocks} />;

  const header = <header className={styles.header}>
    <button ref={navigationToggleRef} className={styles.mobileToggle} type="button" onClick={() => navigationOpen ? closeNavigation() : setNavigationOpen(true)}
      aria-expanded={navigationOpen} aria-controls={navigationId} aria-label={navigationOpen ? labels.close : labels.browse} title={navigationOpen ? labels.close : labels.browse}>
      <PublicDocsIcon name={navigationOpen ? "close" : "menu"} />
    </button>
    <nav className={styles.breadcrumbs} aria-label={labels.browse}>
      {panel
        ? <span className={styles.panelTitle}>{active.title}</span>
        : <><a href={href("introduction")} onClick={event => navigate(event, "introduction")}>{isHome ? "Falcon Docs" : groupTitle}</a>{!isHome && <><span className={styles.breadcrumbDivider} aria-hidden="true" /><span>{active.title}</span></>}</>}
    </nav>
    <div className={styles.headerActions}>
      <button className={`${styles.iconButton} ${styles.mobileSearch}`} type="button" onClick={() => setSearchOpen(true)} aria-label={labels.search} title={labels.search}><PublicDocsIcon name="search" /></button>
      {!panel && <button className={styles.iconButton} type="button" onClick={changeTheme} aria-label={labels.theme} title={labels.theme} aria-pressed={lightTheme}><PublicDocsIcon name="theme" /></button>}
      <button className={styles.copyPage} type="button" onClick={copyPage} aria-label={copied ? labels.copied : labels.copyPage} title={copied ? labels.copied : labels.copyPage}><PublicDocsIcon name={copied ? "check" : "copy"} /><span aria-live="polite">{copied ? labels.copied : labels.copyPage}</span></button>
      {!panel && <DocumentationOpenAppAction href={appHref ?? `/cloud-login/?lang=${locale}`} label={labels.open} />}
    </div>
  </header>;

  return <div ref={readerRef} className={styles.page} lang={locale} data-documentation-reader data-theme={lightTheme ? "light" : "dark"} data-embedded={embedded} data-guide-panel={panel || undefined}
    onKeyDown={panel ? event => {
      if (event.key === "Escape" && navigationOpen && !(event.target as HTMLElement).closest("dialog[open]")) {
        event.preventDefault(); event.stopPropagation(); closeNavigation();
      }
    } : undefined}>
    <a className={styles.skipLink} href="#public-doc-content" onClick={panel ? event => {
      event.preventDefault();
      const content = layoutRef.current?.querySelector<HTMLElement>("#public-doc-content");
      content?.focus({ preventScroll: true });
      content?.scrollIntoView({ block: "start" });
    } : undefined}>{labels.onPage}</a>
    {panel && header}
    {navigationOpen && <button className={styles.mobileBackdrop} type="button" tabIndex={panel ? -1 : undefined} aria-label={labels.close} onClick={closeNavigation} />}
    <aside id={navigationId} className={`${styles.sidebar} ${navigationOpen ? styles.sidebarOpen : ""}`} aria-label={labels.browse}
      ref={element => { if (element && panel) element.inert = !navigationOpen; }}>
      <div className={styles.sidebarBrand}>
        <a href={panel ? href("introduction") : locale === "ru" ? "/ru/" : "/"} onClick={panel ? event => navigate(event, "introduction") : undefined} className={styles.brand} aria-label={labels.home}>
          <FalconBrandMark className={styles.brandMark} />
          <span>Falcon</span>
        </a>
        <span className={styles.brandDivider} />
        <a href={href("introduction")} className={styles.docLabel} onClick={event => navigate(event, "introduction")}>Docs</a>
        <button type="button" className={styles.searchButton} onClick={() => setSearchOpen(true)} aria-label={labels.search} title={`${labels.search} (⌘K)`}><PublicDocsIcon name="search" /></button>
      </div>
      <div className={styles.sidebarScroll}><PublicDocsNavigation folders={folders} articles={articles} activeId={active.id} href={href} onNavigate={navigate} /></div>
      <footer className={styles.sidebarFooter}>
        <a href={supportHref ?? href("contact-support")} onClick={supportHref ? undefined : event => navigate(event, "contact-support")}>{labels.support}<PublicDocsIcon name="arrow" /></a>
        {!panel && <a href={locale === "ru" ? "/ru/" : "/"}>{labels.website}<PublicDocsIcon name="external" /></a>}
        {!panel && <div className={styles.languages} aria-label={labels.language}><a href={`/docs/?article=${active.id}`} aria-current={locale === "en" ? "page" : undefined} lang="en" onClick={onLocaleChange ? event => { event.preventDefault(); onLocaleChange("en"); } : undefined}>English</a><span>/</span><a href={`/ru/docs/?article=${active.id}`} aria-current={locale === "ru" ? "page" : undefined} lang="ru" onClick={onLocaleChange ? event => { event.preventDefault(); onLocaleChange("ru"); } : undefined}>Русский</a></div>}
      </footer>
    </aside>
    {!panel && header}
    <div ref={element => {
      layoutRef.current = element;
      if (element && panel) element.inert = navigationOpen;
    }} className={`${styles.layout} ${isHome ? styles.homeLayout : ""}`}>
      <main id="public-doc-content" tabIndex={panel ? -1 : undefined} className={`${styles.main} ${isHome ? styles.homeMain : ""}`}>
        {isHome ? renderHome?.(active) ?? <DocumentationHome catalog={{ docArticles: articles, docGroups: groups, articleById, locale }} href={href} onNavigate={navigate} renderIntroduction={article => <DocumentationArticleSections article={article} navigation={navigation} sectionLinkLabel={documentationCopy[locale].sectionLink} renderBlocks={renderBlocks} />} /> : renderArticle?.(active) ?? defaultArticle}
      </main>
      {!isHome && <aside className={styles.outline} aria-label={labels.onPage}><p>{labels.onPage}</p><nav>{active.sections.map(section => <a key={section.id} href={href(active.id, section.id)} aria-current={activeSection === section.id ? "location" : undefined} onClick={event => { setActiveSection(section.id); if (panel) navigate(event, active.id, section.id); }}>{section.title}</a>)}</nav></aside>}
    </div>
    {!panel && <a className={styles.aiPill} href={aiHref ?? `/cloud-login/?lang=${locale}&guide=chat`} aria-label={onAskAI ? "Falcon AI" : labels.ai} onClick={onAskAI}>
      <FalconBrandMark className={styles.aiMark} />
      <span>Falcon AI</span>
    </a>}
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
  return <DocumentationReader catalog={{ articles, groups }} locale={locale} activeId={active.id} href={href} onNavigate={navigate} supportHref={locale === "ru" ? "/ru/contact-support/" : "/contact-support/"} />;
}
