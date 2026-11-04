"use client";

import { useState } from "react";
import { DocumentationBlocks } from "../../core-tms/documentation/presentation/content/blocks/DocumentationBlocks";
import type { PublicDocArticle, PublicDocBlock, PublicDocLocale } from "./model";
import { publicDocLabels } from "./copy";
import { PublicDocsIcon } from "./PublicDocsIcon";
import styles from "./documentation.module.css";

export function ArticleCopyButton({ value, locale }: { value: string; locale: PublicDocLocale }) {
  const [copied, setCopied] = useState(false);
  const labels = publicDocLabels(locale);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  }
  return <button type="button" className={styles.copyPage} onClick={copy} aria-label={copied ? labels.copied : labels.copy}><PublicDocsIcon name={copied ? "check" : "copy"} /><span aria-live="polite">{copied ? labels.copied : labels.copy}</span></button>;
}

export function ArticleContent({ block, articles, locale, onNavigate }: {
  block: PublicDocBlock; articles: readonly PublicDocArticle[]; locale: PublicDocLocale; onNavigate: (id: string) => void;
}) {
  const basePath = locale === "ru" ? "/ru/docs/" : "/docs/";
  return <DocumentationBlocks blocks={[block]} articleById={new Map(articles.map(article => [article.id, article]))}
    navigation={{ link: (id, section) => `${basePath}?article=${id}${section ? `#${section}` : ""}`, navigate: (event, id) => { event.preventDefault(); onNavigate(id); } }}
    renderCopy={value => <ArticleCopyButton value={value} locale={locale} />} />;
}
