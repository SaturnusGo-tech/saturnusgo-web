"use client";
import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { useDocumentationCatalog } from "../../access/useDocumentationCatalog";
import { ArrowUpRight, FileSearch } from "lucide-react";
import { searchArticles } from "../../model/search";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import styles from "../documentation.module.css";

export function SearchResults({ query, navigation, onSelect }: {
  query: string; navigation: ReturnType<typeof useDocumentationNavigation>; onSelect: () => void;
}) {
  const { docArticles, docGroups, locale } = useDocumentationCatalog();
  const results = searchArticles(docArticles, query, locale);
  const copy = useDocumentationCopy();
  return <section className={styles.searchResults} aria-label={copy.searchResults}>
    <span className={styles.eyebrow}>{copy.searchGuide}</span><h1>{copy.searchResults}</h1>
    <p role="status">{results.length ? `${copy.articlesFound}: ${results.length}` : copy.noMatches} · «{query}»</p>
    {results.length ? <ul>{results.map(({ article, excerpt }) => <li key={article.id}>
      <a href={navigation.link(article.id)} onClick={(event) => {
        navigation.navigate(event, article.id); if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onSelect();
      }}><span>{docGroups.find((g) => g.id === article.group)?.title}{article.status === "planned" ? ` · ${copy.comingSoon}` : ""}</span>
        <h2>{article.title}<ArrowUpRight size={17} aria-hidden="true" /></h2><p>{excerpt}</p></a>
    </li>)}</ul> : <div className={styles.emptySearch}><FileSearch size={28} aria-hidden="true" /><h2>{copy.trySearch}</h2>
      <p>{copy.searchExamples}</p>
      <button type="button" className={styles.quietButton} onClick={onSelect}>{copy.backToArticle}</button></div>}
  </section>;
}
