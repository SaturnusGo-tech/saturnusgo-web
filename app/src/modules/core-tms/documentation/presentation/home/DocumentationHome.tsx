"use client";

import type { MouseEvent, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { DocArticle } from "../../model/article";
import { DocumentationIcon } from "../icons/DocumentationIcon";
import reading from "../article/reading.module.css";
import styles from "./home.module.css";

const popularIds = ["quick-start", "create-test-case", "create-run", "integration-overview"];
const preferredBasics = ["workspace", "navigation", "dashboard", "create-test-case", "edit-test-case", "shared-steps",
  "create-run", "execute-run", "retest", "create-defect", "notifications", "integration-overview", "tools"];

type HomeNavigation = {
  link: (id: string, section?: string) => string;
  navigate: (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => void;
};

export type DocumentationHomeCatalog = {
  docArticles: readonly DocArticle[];
  docGroups: readonly { id: string; title: string }[];
  articleById: ReadonlyMap<string, DocArticle>;
  locale: "en" | "ru";
};

export function DocumentationHome({ catalog, href: link, onNavigate, renderIntroduction }: {
  catalog: DocumentationHomeCatalog;
  href: HomeNavigation["link"];
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => void;
  renderIntroduction?: (article: DocArticle, navigation: HomeNavigation) => ReactNode;
}) {
  const { docArticles, docGroups, articleById, locale } = catalog;
  const introduction = articleById.get("introduction");
  const popular = popularIds.flatMap(id => { const article = articleById.get(id); return article ? [article] : []; });
  const navigation = { link, navigate: onNavigate };

  return <article className={`${reading.article} ${styles.home}`} aria-labelledby="docs-article-title">
    <header className={styles.header}>
      <h1 id="docs-article-title" tabIndex={-1}>Falcon Docs</h1>
      <p className={reading.lead}>{introduction?.description}</p>
    </header>

    <section className={styles.popular} aria-labelledby="docs-popular-title">
      <h2 id="docs-popular-title" className={styles.sectionTitle}>{locale === "ru" ? "Популярные статьи" : "Popular"}</h2>
      <div className={styles.popularGrid}>{popular.map(article => <a key={article.id} className={styles.popularCard}
        href={link(article.id)} onClick={event => onNavigate(event, article.id)}>
        <span className={styles.cardVisual} aria-hidden="true"><DocumentationIcon articleId={article.id} size={40} /></span>
        <div className={styles.cardCopy}><h3>{article.title}</h3><p>{article.description}</p></div>
      </a>)}</div>
    </section>

    <section className={styles.basics} aria-labelledby="docs-basics-title">
      <h2 id="docs-basics-title" className={styles.sectionTitle}>{locale === "ru" ? "Основы Falcon" : "Falcon basics"}</h2>
      <div className={styles.basicsGrid}>{docGroups.map(group => {
        const available = docArticles.filter(article => article.group === group.id && article.id !== "introduction");
        if (!available.length) return null;
        const ordered = [...available].sort((a, b) => {
          const aIndex = preferredBasics.indexOf(a.id), bIndex = preferredBasics.indexOf(b.id);
          return (aIndex < 0 ? preferredBasics.length : aIndex) - (bIndex < 0 ? preferredBasics.length : bIndex);
        });
        return <div key={group.id} className={styles.basicsCard}>
          <h3><DocumentationIcon articleId={ordered[0].id} size={18} />{group.title}</h3>
          <ul>{ordered.slice(0, 3).map(article => <li key={article.id}><a href={link(article.id)}
            onClick={event => onNavigate(event, article.id)}>{article.title}<ArrowRight size={13} aria-hidden="true" /></a></li>)}</ul>
        </div>;
      })}</div>
    </section>

    {introduction && renderIntroduction && <div className={styles.guide}>{renderIntroduction(introduction, navigation)}</div>}
  </article>;
}
