import { BookOpen, ChevronDown, FileText, Search, X } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { docArticles, docGroups } from "../../content/catalog";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import styles from "../documentation.module.css";

export function DocumentationTree({ navigation, query, onQuery, searchRef, onNavigate, onSearch }: {
  navigation: ReturnType<typeof useDocumentationNavigation>; query: string; onQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>; onNavigate: () => void; onSearch: () => void;
}) {
  const [closed, setClosed] = useState<string[]>([]);
  const group = docArticles.find((a) => a.id === navigation.articleId)?.group;
  useEffect(() => { if (group) setClosed((items) => items.filter((id) => id !== group)); }, [group]);
  return <>
    <div className={styles.treeIdentity}><BookOpen size={18} aria-hidden="true" /><div><strong>Falcon Docs</strong><span>Руководство пользователя</span></div></div>
    <form className={styles.searchField} role="search" onSubmit={(event) => { event.preventDefault(); onSearch(); }}><Search size={15} aria-hidden="true" />
      <input ref={searchRef} type="search" aria-label="Поиск по документации" placeholder="Поиск в руководстве…"
        value={query} onChange={(event) => onQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") onQuery(""); }} />
      {query ? <button type="button" aria-label="Очистить поиск" onClick={() => { onQuery(""); searchRef.current?.focus(); }}><X size={14} /></button> : <kbd>/</kbd>}
    </form>
    <nav className={styles.tree} aria-label="Статьи руководства">
      {docGroups.map((item) => <section key={item.id} className={styles.treeGroup}>
        <button type="button" className={styles.groupToggle} aria-expanded={!closed.includes(item.id)} aria-controls={`docs-group-${item.id}`}
          onClick={() => setClosed((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>
          <ChevronDown size={13} aria-hidden="true" /><span>{item.title}</span>
        </button>
        <ul id={`docs-group-${item.id}`} hidden={closed.includes(item.id)}>{docArticles.filter((article) => article.group === item.id).map((article) =>
          <li key={article.id}><a href={navigation.link(article.id)} aria-current={!query && article.id === navigation.articleId ? "page" : undefined}
            onClick={(event) => { navigation.navigate(event, article.id); if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onNavigate(); }}>
            <FileText size={14} aria-hidden="true" /><span>{article.title}</span>{article.status === "planned" && <small>Скоро</small>}
          </a></li>)}</ul>
      </section>)}
    </nav>
    <footer className={styles.treeFooter}><span className={styles.statusDot} />Актуальная версия <span>RU</span></footer>
  </>;
}
