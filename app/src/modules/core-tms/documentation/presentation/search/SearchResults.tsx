"use client";
import { useDocumentationCatalog } from "../../access/useDocumentationCatalog";
import { ArrowUpRight, FileSearch } from "lucide-react";
import { docGroups } from "../../content/catalog";
import { searchArticles } from "../../model/search";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import styles from "../documentation.module.css";

export function SearchResults({ query, navigation, onSelect }: {
  query: string; navigation: ReturnType<typeof useDocumentationNavigation>; onSelect: () => void;
}) {
  const { docArticles } = useDocumentationCatalog();
  const results = searchArticles(docArticles, query);
  return <section className={styles.searchResults} aria-label="Search results">
    <span className={styles.eyebrow}>Search the guide</span><h1>Search results</h1>
    <p role="status">{results.length ? `Articles found: ${results.length}` : "No matches"} · «{query}»</p>
    {results.length ? <ul>{results.map(({ article, excerpt }) => <li key={article.id}>
      <a href={navigation.link(article.id)} onClick={(event) => {
        navigation.navigate(event, article.id); if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onSelect();
      }}><span>{docGroups.find((g) => g.id === article.group)?.title}{article.status === "planned" ? " · Coming soon" : ""}</span>
        <h2>{article.title}<ArrowUpRight size={17} aria-hidden="true" /></h2><p>{excerpt}</p></a>
    </li>)}</ul> : <div className={styles.emptySearch}><FileSearch size={28} aria-hidden="true" /><h2>Try another search</h2>
      <p>Try “delete case”, “start run”, “Slack”, or “signing secret”.</p>
      <button type="button" className={styles.quietButton} onClick={onSelect}>Back to article</button></div>}
  </section>;
}
