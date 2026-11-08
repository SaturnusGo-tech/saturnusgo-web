"use client";

import { useEffect, useRef, useState } from "react";
import { writeClipboardText } from "../../../shared/lib/clipboard";
import { documentationCopy } from "../../core-tms/documentation/localization/ui-copy";
import { DocumentationBlocks } from "../../core-tms/documentation/presentation/content/blocks/DocumentationBlocks";
import { ArticleWalkthrough } from "../../core-tms/documentation/presentation/walkthrough/ArticleWalkthrough";
import type { PublicDocArticle, PublicDocBlock, PublicDocLocale } from "./model";
import { publicDocLabels } from "./copy";
import { PublicDocsIcon } from "./PublicDocsIcon";
import styles from "./documentation.module.css";

export function ArticleCopyButton({ value, locale, isPrompt = false }: { value: string; locale: PublicDocLocale; isPrompt?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const labels = publicDocLabels(locale);
  const copyLabel = isPrompt ? documentationCopy[locale].copyPrompt : labels.copy;
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  async function copy() {
    clearTimeout(resetTimer.current);
    setFailed(false);
    try {
      await writeClipboardText(value);
      setCopied(true);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    }
    catch { setCopied(false); setFailed(true); }
  }
  return <span className={styles.copyControl}>
    <button type="button" className={styles.copyPage} onClick={copy} aria-label={copyLabel}><PublicDocsIcon name={copied ? "check" : "copy"} /><span aria-live="polite">{copied ? labels.copied : copyLabel}</span></button>
    {failed && <small role="status">{documentationCopy[locale].copyFailed}</small>}
  </span>;
}

export function ArticleContent({ block, articles, locale, onNavigate }: {
  block: PublicDocBlock; articles: readonly PublicDocArticle[]; locale: PublicDocLocale; onNavigate: (id: string) => void;
}) {
  const basePath = locale === "ru" ? "/ru/docs/" : "/docs/";
  return <DocumentationBlocks blocks={[block]} articleById={new Map(articles.map(article => [article.id, article]))}
    navigation={{ link: (id, section) => `${basePath}?article=${id}${section ? `#${section}` : ""}`, navigate: (event, id) => { event.preventDefault(); onNavigate(id); } }}
    renderWalkthrough={block => <ArticleWalkthrough block={block} copy={documentationCopy[locale]} />}
    renderCopy={(value, isPrompt) => <ArticleCopyButton value={value} locale={locale} isPrompt={isPrompt} />} />;
}
