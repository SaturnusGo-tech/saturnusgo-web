"use client";

import { useState } from "react";
import { InlineText } from "../../core-tms/documentation/presentation/content/InlineText";
import type { PublicDocArticle, PublicDocBlock, PublicDocLocale } from "./model";
import { publicDocLabels } from "./copy";
import styles from "./documentation.module.css";

function CodeBlock({ block, locale }: { block: Extract<PublicDocBlock, { kind: "code" }>; locale: PublicDocLocale }) {
  const [copied, setCopied] = useState(false);
  const labels = publicDocLabels(locale);
  async function copy() {
    try {
      await navigator.clipboard.writeText(block.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { setCopied(false); }
  }
  return <figure className={styles.code}>
    <figcaption>{block.caption || block.language}<button type="button" onClick={copy} aria-label={copied ? labels.copied : labels.copy} title={copied ? labels.copied : labels.copy}>
      {copied ? <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8" /></svg> : <svg viewBox="0 0 20 20"><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M12 4V3H3v9h1" /></svg>}
    </button></figcaption><pre><code>{block.text}</code></pre>
  </figure>;
}

export function ArticleContent({ block, articles, locale, onNavigate }: {
  block: PublicDocBlock; articles: readonly PublicDocArticle[]; locale: PublicDocLocale; onNavigate: (id: string) => void;
}) {
  const text = (value: string) => <InlineText text={value} />;
  switch (block.kind) {
    case "paragraph": return <p>{text(block.text)}</p>;
    case "list": return block.ordered ? <ol>{block.items.map((item, index) => <li key={index}>{text(item)}</li>)}</ol> : <ul>{block.items.map((item, index) => <li key={index}>{text(item)}</li>)}</ul>;
    case "steps": return <ol className={styles.steps}>{block.items.map((item, index) => <li key={index}><strong>{text(item.title)}</strong><p>{text(item.text)}</p></li>)}</ol>;
    case "callout": return <aside className={styles.note}><strong>{text(block.title)}</strong><p>{text(block.text)}</p></aside>;
    case "code": return <CodeBlock block={block} locale={locale} />;
    case "table": return <div className={styles.tableScroll}><table><thead><tr>{block.columns.map((column, index) => <th key={index} scope="col">{text(column)}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{text(cell)}</td>)}</tr>)}</tbody></table></div>;
    case "articles": return <div className={styles.articleLinks}>{block.ids.map(id => {
      const article = articles.find(item => item.id === id);
      return article ? <a key={id} href={`?article=${id}`} onClick={event => { event.preventDefault(); onNavigate(id); }}><span>{article.title}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10h10m-4-4 4 4-4 4" /></svg></a> : null;
    })}</div>;
  }
}
