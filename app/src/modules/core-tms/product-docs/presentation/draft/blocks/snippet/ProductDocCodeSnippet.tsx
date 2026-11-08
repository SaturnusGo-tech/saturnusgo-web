"use client";

import { classHighlighter, highlightCode } from "@lezer/highlight";
import { CodeXml } from "lucide-react";
import { useEffect, useState } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { productDocCodeLanguage, productDocCodeLanguageLabel } from "../engine/codeLanguage";
import { productDocCodeSettings } from "../engine/codeSettings";
import { CopySnippet } from "./CopySnippet";
import styles from "../productDocBlocks.module.css";

type Token = { text: string; style?: string };

export function ProductDocCodeSnippet({ code, language, meta }: { code: string; language: string; meta: string }) {
  const { locale } = useTmsLocale();
  const [highlighted, setHighlighted] = useState<{ code: string; language: string; lines: Token[][] }>();
  const syntax = productDocCodeLanguage(language);
  const { wrap, lineNumbers } = productDocCodeSettings(meta);
  const lines = highlighted?.code === code && highlighted.language === language
    ? highlighted.lines : code.split("\n").map((text): Token[] => [{ text }]);
  const label = productDocCodeLanguageLabel(language, locale === "ru" ? "Обычный текст" : "Plain text");

  useEffect(() => {
    let cancelled = false;
    void syntax?.load().then(({ language: grammar }) => {
      if (cancelled) return;
      const lines: Token[][] = [[]];
      highlightCode(code, grammar.parser.parse(code), classHighlighter,
        (text, style) => lines[lines.length - 1].push({ text, style }), () => lines.push([]));
      setHighlighted({ code, language, lines });
    }, () => undefined);
    return () => { cancelled = true; };
  }, [code, language, syntax]);

  return <div className={styles.snippet}>
    <div className={styles.snippetToolbar}>
      <span className={styles.languageName}><CodeXml size={13} aria-hidden="true" />{label}</span>
      <div className={styles.snippetActions}><CopySnippet code={code} locale={locale} /></div>
    </div>
    <pre className={styles.codePreview} data-wrap={wrap} data-numbers={lineNumbers}><code>
      {lines.map((line, index) => <span className={styles.codeLine} key={index}>
        {lineNumbers && <span aria-hidden="true" className={styles.lineNumber}>{index + 1}</span>}
        <span>{line.map((token, tokenIndex) => <span key={tokenIndex} className={token.style}>{token.text}</span>)}</span>
      </span>)}
    </code></pre>
  </div>;
}
