"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { ProductDocMarkdown } from "./markdown/ProductDocMarkdown";
import { ProductDocTitleText } from "../draft/title/ProductDocTitleText";
import type { TmsLocale } from "../../../localization/model/locale";
import { emptyProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import { ProductDocPropertiesPanel } from "../properties/ProductDocPropertiesPanel";
import type { ProductDocDetail, ProductDocScope } from "../../domain/product-docs";
import { ProductDocEmbedContext } from "../embeds/context/productDocEmbedContext";
import type { ProductDocsCopy } from "../../localization/copy";
import reader from "./reader.module.css";
import styles from "../product-docs.module.css";

export function ProductDocArticle({ document, copy, scope, versionPinned, sectionId, projectName, locale, subdocs, context, relatedCases, onSelectSection }: {
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  scope?: ProductDocScope;
  versionPinned?: boolean;
  sectionId?: string;
  context?: React.ReactNode;
  relatedCases?: React.ReactNode;
  projectName?: string;
  locale?: TmsLocale;
  subdocs?: React.ReactNode;
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
  const embedDocument = useMemo(() => scope ? {
    workspaceId: scope.workspaceId, projectId: scope.projectId, docId: document.id,
    draft: document.version === null, version: document.version ?? undefined, archived: Boolean(document.archivedAt),
  } : null, [scope, document.id, document.version, document.archivedAt]);
  const status = document.archivedAt ? "archived" : versionPinned || historical ? "revision" : document.version === null ? "draft" : "published";
  const showProperties = scope && projectName && locale;
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
          <ProductDocEmbedContext.Provider value={embedDocument}>
            <ProductDocMarkdown markdown={section.markdown} copy={copy} />
          </ProductDocEmbedContext.Provider>
        </div>
      </section>)}
      {subdocs}
    </article>
    {Boolean(showProperties || outlineSections.length || context) && <aside className={styles.context} data-doc-properties={Boolean(showProperties) || undefined}>
      {showProperties && scope && projectName && locale && <div className={reader.properties}>
        <ProductDocPropertiesPanel scope={scope} projectName={projectName} locale={locale} status={status}
          value={document.properties} taxonomy={document.taxonomy ?? emptyProductDocTaxonomy} relatedCases={relatedCases} />
      </div>}
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
