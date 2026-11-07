import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import type { ProductDocDetail, ProductDocScope, ProductDocsApi } from "../domain/product-docs";
import styles from "./requirements.module.css";

export function RequirementPicker({api, scope, ru, disabled, onLink, onClose}: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  ru: boolean;
  disabled: boolean;
  onLink(docId: string, sectionId: string | null): void;
  onClose(): void;
}) {
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState<string>();
  const [results, setResults] = useState<{query: string; nodes: {id: string; title: string}[]}>();
  const [document, setDocument] = useState<ProductDocDetail>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const term = query.trim();

  useEffect(() => {
    if (!term || documentId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      api.list(scope, {q: term, limit: 20, signal: controller.signal}).then(
        result => { if (!controller.signal.aborted) setResults({query: term, nodes: result.nodes.filter(node => node.kind === "page" && node.publishedVersion !== null)}); },
        () => { if (!controller.signal.aborted) setError(true); },
      );
    }, 180);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [api, scope, term, documentId, retry]);

  useEffect(() => {
    if (!documentId) return;
    const controller = new AbortController();
    api.get(scope, documentId, {signal: controller.signal}).then(
      article => { if (!controller.signal.aborted) setDocument(article); },
      () => { if (!controller.signal.aborted) setError(true); },
    );
    return () => controller.abort();
  }, [api, scope, documentId, retry]);

  const ready = documentId ? document?.id === documentId : results?.query === term;
  return <div className={styles.picker}>
    <header className={styles.pickerHeading}>
      <strong>{documentId ? (ru ? "Выберите раздел" : "Choose a section") : (ru ? "Связать правило" : "Link a requirement")}</strong>
      <button type="button" onClick={onClose} disabled={disabled}>{ru ? "Отмена" : "Cancel"}</button>
    </header>
    {!documentId && <label className={styles.search}>
      <Search size={15} aria-hidden />
      <input autoFocus value={query} maxLength={200}
        aria-label={ru ? "Найти опубликованную статью" : "Find a published page"}
        placeholder={ru ? "Название статьи" : "Page title"}
        onChange={event => { setError(false); setQuery(event.currentTarget.value); }} />
    </label>}
    {error ? <div className={styles.feedback} role="alert">
      <span>{ru ? "Не удалось загрузить документацию." : "Could not load Product Docs."}</span>
      <button type="button" onClick={() => { setError(false); setRetry(value => value + 1); }}>{ru ? "Повторить" : "Retry"}</button>
    </div> : (term || documentId) && !ready ? <p role="status" className={styles.feedback}>{ru ? "Загрузка…" : "Loading…"}</p> : null}
    {!documentId && ready && results && <div className={styles.options}>
      {results.nodes.map(node => <button key={node.id} type="button" onClick={() => { setDocument(undefined); setDocumentId(node.id); }}>
        <FileText size={16} aria-hidden />{node.title}
      </button>)}
      {!results.nodes.length && <p className={styles.feedback}>{ru ? "Статьи не найдены." : "No pages found."}</p>}
    </div>}
    {documentId && document?.id === documentId && <div className={styles.options}>
      <button type="button" disabled={disabled} onClick={() => onLink(documentId, null)}>{ru ? "Вся статья" : "Whole page"}</button>
      {document.sections.map((section, index) => <button key={section.id} type="button" disabled={disabled}
        onClick={() => onLink(documentId, section.id)}>{section.title || (ru ? `Раздел ${index + 1}` : `Section ${index + 1}`)}</button>)}
      <button type="button" disabled={disabled} onClick={() => { setError(false); setDocumentId(undefined); }}>{ru ? "Назад к поиску" : "Back to search"}</button>
    </div>}
  </div>;
}
