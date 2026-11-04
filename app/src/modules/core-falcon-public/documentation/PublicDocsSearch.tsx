"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { DocumentationIcon } from "../../core-tms/documentation/presentation/icons/DocumentationIcon";
import { publicDocLabels } from "./copy";
import type { PublicDocLocale } from "./model";
import type { DocArticle } from "../../core-tms/documentation/model/article";
import { PublicDocsIcon } from "./PublicDocsIcon";
import styles from "./documentation.module.css";

export function PublicDocsSearch({ articles, locale, href, onClose, onNavigate }: {
  articles: readonly DocArticle[]; locale: PublicDocLocale; href: (id: string, section?: string) => string; onClose: () => void; onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => void;
}) {
  const labels = publicDocLabels(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const terms = query.toLocaleLowerCase(locale).trim().split(/\s+/).filter(Boolean);
  const matches = (terms.length ? articles.filter(article => {
    const searchable = `${article.title} ${article.description} ${article.keywords.join(" ")} ${JSON.stringify(article.sections)}`.toLocaleLowerCase(locale);
    return terms.every(term => searchable.includes(term));
  }) : articles.filter(article => ["quick-start", "create-test-case", "create-run", "integration-overview"].includes(article.id))).slice(0, 16);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    inputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; dialog?.close(); previousFocus?.focus(); };
  }, []);

  return <dialog ref={dialogRef} className={styles.searchDialog} aria-label={labels.search} aria-modal="true" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.searchSurface}>
      <div className={styles.searchInputRow}>
        <PublicDocsIcon name="search" />
        <input ref={inputRef} type="search" value={query} placeholder={labels.search} aria-label={labels.search} aria-controls="public-search-results" autoComplete="off" spellCheck={false} onChange={event => { setQuery(event.target.value); setSelected(0); }} onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setSelected(value => matches.length ? (value + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length : 0);
          }
          if (event.key === "Enter" && matches[selected]) { event.preventDefault(); dialogRef.current?.querySelector<HTMLAnchorElement>('a[data-selected="true"]')?.click(); }
        }} />
        <button type="button" onClick={onClose} aria-label={labels.escape}><kbd>Esc</kbd></button>
      </div>
      <div className={styles.searchResults} id="public-search-results">
        <p className={styles.searchCaption}>{terms.length ? `${labels.results} · ${matches.length}` : labels.searchHint}</p>
        {matches.map((article, index) => <a key={article.id} href={href(article.id)} data-selected={index === selected} onMouseEnter={() => setSelected(index)} onClick={event => onNavigate(event, article.id)}>
          <DocumentationIcon articleId={article.id} size={20} /><span><strong>{article.title}</strong><span>{article.description}</span></span><PublicDocsIcon name="arrow" />
        </a>)}
        {!matches.length && <div className={styles.searchEmpty}><p>{labels.empty}</p><span>{labels.emptyHint}</span></div>}
      </div>
    </div>
  </dialog>;
}
