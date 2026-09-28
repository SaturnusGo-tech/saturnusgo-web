"use client";
import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { useDocumentationCatalog } from "../../access/useDocumentationCatalog";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, Link as LinkIcon } from "lucide-react";
import type { DocArticle } from "../../model/article";
import { readingMinutes } from "../../model/search";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { ArticleBlocks } from "../content/ArticleBlocks";
import { CopyButton } from "../controls/CopyButton";
import styles from "../documentation.module.css";

export function DocumentationArticle({ article, navigation }: {
  article: DocArticle; navigation: ReturnType<typeof useDocumentationNavigation>;
}) {
  const { docArticles, articleById, docGroups } = useDocumentationCatalog();
  const index = docArticles.indexOf(article);
  const copy = useDocumentationCopy();
  const adjacent = [{ label: copy.previousArticle, article: docArticles[index - 1], Icon: ArrowLeft },
    { label: copy.nextArticle, article: docArticles[index + 1], Icon: ArrowRight }];
  return <article className={styles.article} aria-labelledby="docs-article-title">
    <header className={styles.articleHeader}>
      <span className={styles.eyebrow}>{docGroups.find((g) => g.id === article.group)?.title}</span>
      <h1 id="docs-article-title" tabIndex={-1}>{article.title}</h1><p className={styles.lead}>{article.description}</p>
      <div className={styles.articleMeta}><span><Clock3 size={13} aria-hidden="true" />{readingMinutes(article)} {copy.minRead}</span>
        {article.status === "planned" && <span className={styles.planned}>{copy.comingToFalcon}</span>}
        <CopyButton value={() => new URL(navigation.link(article.id), window.location.origin).href} label={copy.articleLink} />
      </div>
    </header>
    <details className={styles.mobileToc}><summary>{copy.onThisPage}</summary><nav aria-label={copy.articleContents}>
      {article.sections.map((s) => <a key={s.id} href={navigation.link(article.id, s.id)}>{s.title}</a>)}</nav></details>
    {article.sections.map((s) => <section key={s.id} id={s.id} className={styles.articleSection} data-doc-section>
      <h2>{s.title}<a href={navigation.link(article.id, s.id)} aria-label={`${copy.sectionLink}: ${s.title}`}><LinkIcon size={16} /></a></h2>
      <ArticleBlocks blocks={s.blocks} navigation={navigation} />
    </section>)}
    {article.sources && <section className={styles.sources} aria-label={copy.officialDocumentation}>
      <h2>{copy.officialDocumentation}</h2><p>{copy.serviceSetup}</p>
      {article.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={14} /></a>)}
    </section>}
    <section className={styles.related} aria-label={copy.relatedArticles}><h2>{copy.relatedArticles}</h2>
      {article.related.map((id) => { const related = articleById.get(id); return related && <a key={id} href={navigation.link(id)}
        onClick={(event) => navigation.navigate(event, id)}>{related.title}<ArrowUpRight size={14} /></a>; })}</section>
    <nav className={styles.pagination} aria-label={copy.adjacentArticles}>{adjacent.map(({ label, article: neighbor, Icon }) => neighbor
      ? <a key={label} href={navigation.link(neighbor.id)} onClick={(event) => navigation.navigate(event, neighbor.id)}>
        <span>{label}</span><strong><Icon size={15} />{neighbor.title}</strong></a> : <span key={label} />)}</nav>
    <footer className={styles.articleFooter}>Falcon · {copy.userGuide}<span>{copy.updated}</span></footer>
  </article>;
}
