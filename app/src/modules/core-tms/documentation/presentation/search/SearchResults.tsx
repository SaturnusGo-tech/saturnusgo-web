import { ArrowUpRight, FileSearch } from "lucide-react";
import { docArticles, docGroups } from "../../content/catalog";
import { searchArticles } from "../../model/search";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import styles from "../documentation.module.css";

export function SearchResults({ query, navigation, onSelect }: {
  query: string; navigation: ReturnType<typeof useDocumentationNavigation>; onSelect: () => void;
}) {
  const results = searchArticles(docArticles, query);
  return <section className={styles.searchResults} aria-label="Результаты поиска">
    <span className={styles.eyebrow}>Поиск по руководству</span><h1>Результаты поиска</h1>
    <p role="status">{results.length ? `Найдено статей: ${results.length}` : "Совпадений нет"} · «{query}»</p>
    {results.length ? <ul>{results.map(({ article, excerpt }) => <li key={article.id}>
      <a href={navigation.link(article.id)} onClick={(event) => {
        navigation.navigate(event, article.id); if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onSelect();
      }}><span>{docGroups.find((g) => g.id === article.group)?.title}{article.status === "planned" ? " · Скоро" : ""}</span>
        <h2>{article.title}<ArrowUpRight size={17} aria-hidden="true" /></h2><p>{excerpt}</p></a>
    </li>)}</ul> : <div className={styles.emptySearch}><FileSearch size={28} aria-hidden="true" /><h2>Попробуйте другой запрос</h2>
      <p>Например: «удалить кейс», «запустить ран», «Slack» или «секрет подписи».</p>
      <button type="button" className={styles.quietButton} onClick={onSelect}>Вернуться к статье</button></div>}
  </section>;
}
