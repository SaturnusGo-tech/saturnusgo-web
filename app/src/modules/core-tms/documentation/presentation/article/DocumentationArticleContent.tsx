"use client";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Link as LinkIcon } from "lucide-react";
import type { documentationCopy } from "../../localization/ui-copy";
import type { DocArticle, DocBlock } from "../../model/article";
import { documentationArticleImage } from "../../model/library";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { DocumentationIcon } from "../icons/DocumentationIcon";
import styles from "./reading.module.css";

type ArticleNavigation = Pick<ReturnType<typeof useDocumentationNavigation>, "link" | "navigate">;
type ArticleCopy = { [Key in keyof typeof documentationCopy.en]: string };

export function DocumentationArticleSections({ article, navigation, sectionLinkLabel, renderBlocks }: {
  article: DocArticle;
  navigation: ArticleNavigation;
  sectionLinkLabel: string;
  renderBlocks: (blocks: DocBlock[]) => ReactNode;
}) {
  return <>{article.sections.map(section => <section key={section.id} id={section.id} className={styles.articleSection} data-doc-section>
    <h2>{section.title}<a href={navigation.link(article.id, section.id)} aria-label={`${sectionLinkLabel}: ${section.title}`}><LinkIcon size={16} /></a></h2>
    {renderBlocks(section.blocks)}
  </section>)}</>;
}

export function DocumentationArticleContent({ article, navigation, copy, locale = "en", related = [], previous, next, renderBlocks, articleLink }: {
  article: DocArticle;
  navigation: ArticleNavigation;
  copy: ArticleCopy;
  locale?: "en" | "ru";
  related?: readonly DocArticle[];
  previous?: DocArticle;
  next?: DocArticle;
  renderBlocks: (blocks: DocBlock[]) => ReactNode;
  articleLink?: ReactNode;
}) {
  const image = documentationArticleImage(article.id, locale);
  const adjacent = [{ label: copy.previousArticle, article: previous, Icon: ArrowLeft },
    { label: copy.nextArticle, article: next, Icon: ArrowRight }];
  return <article className={styles.article} aria-labelledby="docs-article-title">
    <header className={styles.articleHeader}>
      <h1 id="docs-article-title" tabIndex={-1}>{article.title}</h1><p className={styles.lead}>{article.description}</p>
      {article.status === "planned" && <span className={styles.planned}>{copy.comingToFalcon}</span>}
      {image && <figure className={styles.articleImage}><img src={image.src} alt={image.alt} width={image.width} height={image.height} decoding="async" /></figure>}
    </header>
    <details className={styles.mobileToc}><summary>{copy.onThisPage}</summary><nav aria-label={copy.articleContents}>
      {article.sections.map((s) => <a key={s.id} href={navigation.link(article.id, s.id)}>{s.title}</a>)}</nav></details>
    <DocumentationArticleSections article={article} navigation={navigation} sectionLinkLabel={copy.sectionLink} renderBlocks={renderBlocks} />
    {article.sources && <section className={styles.sources} aria-label={copy.officialDocumentation}>
      <h2>{copy.officialDocumentation}</h2><p>{copy.serviceSetup}</p>
      {article.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={14} /></a>)}
    </section>}
    {related.length > 0 && <section className={styles.related} aria-label={copy.relatedArticles}><h2>{copy.relatedArticles}</h2>
      {related.map(neighbor => <a key={neighbor.id} href={navigation.link(neighbor.id)}
        onClick={(event) => navigation.navigate(event, neighbor.id)}><DocumentationIcon articleId={neighbor.id} size={16} /><span>{neighbor.title}</span><ArrowUpRight size={13} /></a>)}</section>}
    <nav className={styles.pagination} aria-label={copy.adjacentArticles}>{adjacent.map(({ label, article: neighbor, Icon }) => neighbor
      ? <a key={label} href={navigation.link(neighbor.id)} onClick={(event) => navigation.navigate(event, neighbor.id)}>
        <span>{label}</span><strong><Icon size={15} />{neighbor.title}</strong></a> : <span key={label} />)}</nav>
    <footer className={styles.articleFooter}><span>{copy.updated}</span>
      {articleLink}
    </footer>
  </article>;
}
