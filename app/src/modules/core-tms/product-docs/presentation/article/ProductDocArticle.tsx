"use client";

import { useEffect, useId, useRef } from "react";
import { ProductDocMarkdown } from "./markdown/ProductDocMarkdown";
import { ProductDocTitleText } from "../draft/title/ProductDocTitleText";
import type { ProductDocDetail } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import reader from "./reader.module.css";
import styles from "../product-docs.module.css";

export function ProductDocArticle({ document, copy, versionPinned, sectionId, context, onSelectSection }: {
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  versionPinned?: boolean;
  sectionId?: string;
  context?: React.ReactNode;
  onSelectSection?(id: string): void;
}) {
  const prefix = useId();
  const sectionElements = useRef(new Map<string, HTMLElement>());
  function goToSection(id: string, focus = false) {
    const element = sectionElements.current.get(id);
    if (!element) return;
    element.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
    if (focus) element.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!sectionId) return;
    const frame = window.requestAnimationFrame(() => goToSection(sectionId, true));
    return () => window.cancelAnimationFrame(frame);
  }, [document.id, document.version, sectionId]);

  const outlineSections = document.sections.filter((section) => section.title);
  const historical = document.version !== null && document.version !== document.publishedVersion;
  const sectionMissing = sectionId && !document.sections.some((section) => section.id === sectionId);
  return <div className={styles.articleLayout}>
    <article className={`${styles.article} ${reader.article}`}>
      <h1><ProductDocTitleText title={document.title} highlights={document.titleHighlights} /></h1>
      {(versionPinned || historical) && document.version !== null && <p className={reader.version}>
        {copy.viewingVersion} {document.version}
      </p>}
      {sectionMissing && <p className={styles.historical}>{copy.sectionUnavailable}</p>}
      {document.kind === "folder" && <p className={styles.metadata}>{copy.folderEmpty}</p>}
      {document.sections.map((section) => <section key={section.id} id={prefix + section.id} tabIndex={-1}
        ref={(element) => {
          if (element) sectionElements.current.set(section.id, element);
          else sectionElements.current.delete(section.id);
        }}
        className={styles.articleSection}>
        {section.title && <h2><ProductDocTitleText title={section.title} highlights={section.titleHighlights} /></h2>}
        <div className={`${styles.prose} ${reader.prose}`}>
          <ProductDocMarkdown markdown={section.markdown} copy={copy} />
        </div>
      </section>)}
    </article>
    {Boolean(outlineSections.length || context) && <aside className={styles.context}>
      {outlineSections.length > 0 && <nav aria-label={copy.outline} className={`${styles.outline} ${reader.outline}`}>
        <h2>{copy.outline}</h2>
        <ul>{outlineSections.map((section) => <li key={section.id}>
          <a href={"#" + prefix + section.id} aria-current={sectionId === section.id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (sectionId !== section.id && onSelectSection) onSelectSection(section.id);
              else goToSection(section.id, true);
            }}>
            {section.title}
          </a>
        </li>)}</ul>
      </nav>}
      {context}
    </aside>}
  </div>;
}
