"use client";

import { BookOpen, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useColorMode } from "../../../../shared/_hooks/useColorMode";
import { articleById } from "../content/catalog";
import { useDocumentationNavigation } from "../navigation/useDocumentationNavigation";
import { DocumentationTree } from "./navigation/DocumentationTree";
import { DocumentationArticle } from "./article/DocumentationArticle";
import { SearchResults } from "./search/SearchResults";
import styles from "./documentation.module.css";

export function DocumentationView() {
  const navigation = useDocumentationNavigation();
  const { isLight, toggleAnimated } = useColorMode();
  const [query, setQuery] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const article = articleById.get(navigation.articleId);
  const searching = Boolean(query.trim());

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("dialog[open]")) return;
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !target.closest("input,textarea,select,[contenteditable=true]")) {
        event.preventDefault(); setTreeOpen(true); requestAnimationFrame(() => searchRef.current?.focus());
      }
      if (event.key === "Escape") setTreeOpen(false);
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (searching) { scrollRef.current?.scrollTo(0, 0); return; }
    const frame = requestAnimationFrame(() => {
      const id = window.location.hash.slice(1);
      const target = id && article?.sections.some((s) => s.id === id) ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ block: "start" });
      else scrollRef.current?.scrollTo(0, 0);
      document.getElementById("docs-article-title")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [navigation.articleId, searching, article]);

  useEffect(() => {
    const root = scrollRef.current; if (!root || searching) return;
    const update = () => {
      const top = root.getBoundingClientRect().top + 80;
      const sections = [...root.querySelectorAll<HTMLElement>("[data-doc-section]")];
      const visible = sections.filter((s) => s.getBoundingClientRect().top <= top);
      const current = visible[visible.length - 1] ?? sections[0];
      setActiveSection(current?.id ?? "");
    };
    update(); root.addEventListener("scroll", update, { passive: true });
    return () => root.removeEventListener("scroll", update);
  }, [navigation.articleId, searching]);

  function select() { setQuery(""); setTreeOpen(false); }
  return <section className={styles.root} data-documentation-workspace lang="ru" aria-label="Документация Falcon">
    <header className={styles.header}>
      <button className={`${styles.quietButton} ${styles.treeToggle}`} type="button" aria-label={treeOpen ? "Скрыть дерево статей" : "Показать дерево статей"}
        aria-expanded={treeOpen} aria-controls="documentation-sidebar" onClick={() => setTreeOpen((current) => !current)}>{treeOpen ? <X size={18} /> : <Menu size={18} />}</button>
      <BookOpen size={17} aria-hidden="true" /><span>Документация</span><span className={styles.headerDivider}>/</span><strong>{searching ? "Поиск" : article?.title ?? "Статья не найдена"}</strong>
      <button className={`${styles.quietButton} ${styles.themeButton}`} type="button" aria-label={isLight ? "Включить тёмную тему" : "Включить светлую тему"}
        onClick={(event) => toggleAnimated({ x: event.clientX, y: event.clientY })}>{isLight ? <Moon size={16} /> : <Sun size={16} />}</button>
    </header>
    <div className={styles.frame}>
      <aside id="documentation-sidebar" className={styles.sidebar} data-open={treeOpen}>
        <DocumentationTree navigation={navigation} query={query} onQuery={setQuery} searchRef={searchRef} onNavigate={select} onSearch={() => setTreeOpen(false)} />
      </aside>
      <div className={styles.readingArea}>
        <div ref={scrollRef} className={styles.scroll}>
          {searching ? <SearchResults query={query.trim()} navigation={navigation} onSelect={select} /> : article
            ? <DocumentationArticle key={article.id} article={article} navigation={navigation} />
            : <section className={styles.searchResults}><span className={styles.eyebrow}>Руководство Falcon</span><h1>Статья не найдена</h1>
              <p>Возможно, ссылка устарела. Выберите статью в дереве или воспользуйтесь поиском.</p>
              <a href={navigation.link("introduction")} onClick={(event) => navigation.navigate(event, "introduction")}>Открыть руководство</a></section>}
        </div>
        {!searching && article && <nav className={styles.toc} aria-label="На этой странице"><strong>На этой странице</strong>
          {article.sections.map((s) => <a key={s.id} href={navigation.link(article.id, s.id)} aria-current={activeSection === s.id ? "location" : undefined}>{s.title}</a>)}
          <div className={styles.tocNote}>Здесь — инструкция.<br />Все изменения выполняются в рабочих разделах Falcon.</div>
        </nav>}
      </div>
    </div>
  </section>;
}
