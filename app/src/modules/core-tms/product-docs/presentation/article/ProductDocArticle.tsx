"use client";

import { useEffect, useId, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProductDocDetail } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";

export function ProductDocArticle({ document, copy, sectionId, context, onSelectSection }: {
  document: ProductDocDetail;
  copy: ProductDocsCopy;
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

  const historical = document.version !== null && document.version !== document.publishedVersion;
  const sectionMissing = sectionId && !document.sections.some((section) => section.id === sectionId);
  return <div className={styles.articleLayout}>
    <article className={styles.article}>
      <h1>{document.title}</h1>
      {document.version !== null && <p className={styles.metadata}>
        {copy.published}<span aria-hidden="true"> · </span>{copy.version} {document.version}
      </p>}
      {historical && <p className={styles.historical}>{copy.historical}</p>}
      {sectionMissing && <p className={styles.historical}>{copy.sectionUnavailable}</p>}
      {document.kind === "folder" && <p className={styles.metadata}>{copy.folderEmpty}</p>}
      {document.sections.map((section) => <section key={section.id} id={prefix + section.id} tabIndex={-1}
        ref={(element) => {
          if (element) sectionElements.current.set(section.id, element);
          else sectionElements.current.delete(section.id);
        }}
        className={styles.articleSection}>
        {section.title && <h2>{section.title}</h2>}
        <div className={styles.prose}>
          <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h3>{children}</h3>,
              h2: ({ children }) => <h4>{children}</h4>,
              img: ({ alt }) => alt ? <span>{alt}</span> : null,
            }}>
            {section.markdown}
          </ReactMarkdown>
        </div>
      </section>)}
    </article>
    {Boolean(document.sections.length || context) && <aside className={styles.context}>
      {document.sections.length > 0 && <nav aria-label={copy.outline} className={styles.outline}>
        <h2>{copy.outline}</h2>
        <ul>{document.sections.map((section) => <li key={section.id}>
          <a href={"#" + prefix + section.id} aria-current={sectionId === section.id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (sectionId !== section.id && onSelectSection) onSelectSection(section.id);
              else goToSection(section.id, true);
            }}>
            {section.title || copy.untitledSection}
          </a>
        </li>)}</ul>
      </nav>}
      {context}
    </aside>}
  </div>;
}
