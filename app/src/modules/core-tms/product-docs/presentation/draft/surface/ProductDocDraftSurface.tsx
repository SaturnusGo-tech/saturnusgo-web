"use client";

import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import type { ReactNode, RefObject } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocTaxonomy } from "../../../domain/product-doc-taxonomy";
import type { ProductDocDetail, ProductDocScope, ProductDocTitleHighlight } from "../../../domain/product-docs";
import type { ProductDocProperties } from "../../../domain/properties/product-doc-properties";
import type { ProductDocsCopy } from "../../../localization/copy";
import { ProductDocDraftEmbedScope } from "../../embeds/context/productDocEmbedContext";
import { ProductDocPropertiesPanel } from "../../properties/ProductDocPropertiesPanel";
import styles from "../editor.module.css";
import { ProductDocTitleInput } from "../title/ProductDocTitleInput";

const RichProductSection = dynamic(() => import("../RichProductSection"), {
  ssr: false, loading: () => <div className={styles.editorLoading} aria-busy="true" />,
});

export function ProductDocDraftSurface({
  document, scope, copy, locale, projectName, subdocs, busy, isFreshPage, title, titleHighlights, taxonomy, properties,
  editorSeed, editorRef, importInput, withinLimits, validMarkup, error, onChange, onValidity, onImport, onImportText,
  onMediaBusy, onTitle, onHighlight, onFolderSave, onTaxonomy, onProperties, onRecover, relatedCases,
}: {
  document: ProductDocDetail;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  projectName: string;
  subdocs?: ReactNode;
  relatedCases?: ReactNode;
  busy: boolean;
  isFreshPage: boolean;
  title: string;
  titleHighlights: readonly ProductDocTitleHighlight[];
  taxonomy: ProductDocTaxonomy;
  properties: ProductDocProperties;
  editorSeed: { markdown: string; epoch: number };
  editorRef: RefObject<MDXEditorMethods | null>;
  importInput: RefObject<HTMLInputElement | null>;
  withinLimits: boolean;
  validMarkup: boolean;
  error: string;
  onChange(value: string): void;
  onValidity(valid: boolean): void;
  onImport(): void;
  onImportText(file?: File): Promise<void>;
  onMediaBusy(busy: boolean): void;
  onTitle(value: string): void;
  onHighlight(value: ProductDocTitleHighlight[]): void;
  onFolderSave(): void;
  onTaxonomy(value: ProductDocTaxonomy): void;
  onProperties(value: ProductDocProperties): void;
  onRecover(): void;
}) {
  const ru = locale === "ru";
  const folder = document.kind === "folder";
  const heading = <div className={styles.pageHeading}>
    <ProductDocTitleInput title={title} highlights={titleHighlights} locale={locale} label={folder ? copy.name : copy.untitled}
      placeholder={folder ? copy.name : copy.untitledPage} disabled={busy} autoFocus={isFreshPage} folder={folder}
      onTitle={onTitle} onHighlight={onHighlight}
      onEnter={folder ? onFolderSave : () => editorRef.current?.focus(undefined, { defaultSelection: "rootStart" })} />
    <ErrorToast message={error} />
    {!withinLimits && <p className={styles.error} role="alert">{copy.draftTooLong}</p>}
  </div>;
  if (folder) return heading;
  return <div className={styles.composition}>
    <div className={styles.compositionBody} data-has-subdocs={Boolean(subdocs) || undefined}>
      <ProductDocDraftEmbedScope scope={scope} docId={document.id}>
        <RichProductSection key={editorSeed.epoch} markdown={editorSeed.markdown} title={heading}
          label={ru ? "Содержимое страницы" : "Page content"}
          placeholder={ru ? "Начните писать или нажмите / для вставки" : "Start writing or press / to insert"}
          locale={locale} disabled={busy} editorRef={editorRef}
          onChange={onChange} onValidity={onValidity} onImport={onImport} onMediaBusy={onMediaBusy} />
      </ProductDocDraftEmbedScope>
      <input ref={importInput} type="file" hidden accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={(event) => { void onImportText(event.target.files?.[0]); event.target.value = ""; }} />
      <ErrorToast message={!validMarkup ? (ru
        ? "Редактор не смог прочитать часть форматирования. Предыдущий черновик остаётся доступен."
        : "The editor couldn’t read some formatting. Your last complete draft is still available.") : null}
        retryLabel={copy.retry} onRetry={busy ? undefined : onRecover} />
      {subdocs}
    </div>
    <aside className={styles.properties}>
      <ProductDocPropertiesPanel scope={scope} locale={locale} projectName={projectName} status="draft" value={properties}
        taxonomy={taxonomy} disabled={busy} onChange={onProperties} onTaxonomy={onTaxonomy} relatedCases={relatedCases} />
    </aside>
  </div>;
}
