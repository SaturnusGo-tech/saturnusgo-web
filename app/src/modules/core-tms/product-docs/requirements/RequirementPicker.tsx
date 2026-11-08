import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { DraftProductDocRequirement, ProductDocDetail, ProductDocScope, ProductDocsApi } from "../domain/product-docs";
import { ProductDocsMark } from "../presentation/tree/empty/ProductDocsMark";
import styles from "./requirements.module.css";

export function RequirementPicker({api, scope, ru, disabled, onLink, onClose}: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  ru: boolean;
  disabled: boolean;
  onLink(requirement: DraftProductDocRequirement): void;
  onClose(): void;
}) {
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState<string>();
  const [results, setResults] = useState<{query: string; nodes: {id: string; title: string}[]}>();
  const [document, setDocument] = useState<ProductDocDetail>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const heading = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const firstSection = useRef<HTMLButtonElement>(null);
  const term = query.trim();

  useEffect(() => {
    if (documentId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      api.list(scope, {q: term || undefined, limit: 20, signal: controller.signal}).then(
        result => { if (!controller.signal.aborted) setResults({query: term, nodes: result.nodes.filter(node => node.kind === "page" && node.publishedVersion !== null)}); },
        () => { if (!controller.signal.aborted) setError(true); },
      );
    }, term ? 180 : 0);
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
  useLayoutEffect(() => {
    if (documentId) heading.current?.focus({preventScroll: true});
    else search.current?.focus({preventScroll: true});
  }, [documentId]);
  useLayoutEffect(() => {
    const element = heading.current;
    if (ready && documentId && element?.ownerDocument.activeElement === element) firstSection.current?.focus({preventScroll: true});
  }, [ready, documentId]);
  const choose = (sectionId: string | null, sectionTitle: string | null) => {
    if (!disabled && document?.id === documentId && document?.version != null) {
      onLink({docId: document.id, title: document.title, sectionId, sectionTitle});
    }
  };
  return <div className={styles.picker} onKeyDown={event => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
    if (event.key === "Escape" && !disabled) { event.preventDefault(); event.stopPropagation(); onClose(); }
  }}>
    <header ref={heading} tabIndex={-1} className={styles.pickerHeading}>
      <strong>{documentId ? (ru ? "Выберите раздел" : "Choose a section") : (ru ? "Добавить статью" : "Add a page")}</strong>
      <button type="button" onClick={onClose} disabled={disabled}>{ru ? "Отмена" : "Cancel"}</button>
    </header>
    {!documentId && <label className={styles.search}>
      <Search size={15} aria-hidden />
      <input ref={search} autoFocus value={query} maxLength={200}
        aria-label={ru ? "Найти опубликованную статью" : "Find a published page"}
        placeholder={ru ? "Название статьи" : "Page title"}
        onChange={event => { setError(false); setQuery(event.currentTarget.value); }} />
    </label>}
    {error ? <div className={styles.feedback} role="alert">
      <span>{ru ? "Не удалось загрузить документацию." : "Could not load Product Docs."}</span>
      <button type="button" onClick={() => { setError(false); setRetry(value => value + 1); }}>{ru ? "Повторить" : "Retry"}</button>
    </div> : !ready ? <p role="status" className={styles.feedback}>{ru ? "Загрузка…" : "Loading…"}</p> : null}
    {!documentId && ready && results && <div className={styles.options}>
      {results.nodes.map(node => <button key={node.id} type="button" disabled={disabled} onClick={() => { setError(false); setDocument(undefined); setDocumentId(node.id); }}>
        <ProductDocsMark />{node.title}
      </button>)}
      {!results.nodes.length && <p className={styles.feedback}>{ru ? "Статьи не найдены." : "No pages found."}</p>}
    </div>}
    {documentId && document?.id === documentId && <div className={styles.options}>
      <button ref={firstSection} type="button" disabled={disabled || document.version == null} onClick={() => choose(null, null)}>{ru ? "Вся статья" : "Whole page"}</button>
      {document.sections.map((section, index) => <button key={section.id} type="button" disabled={disabled}
        onClick={() => choose(section.id, section.title)}>{section.title || (ru ? `Раздел ${index + 1}` : `Section ${index + 1}`)}</button>)}
      <button type="button" disabled={disabled} onClick={() => { setError(false); setDocumentId(undefined); }}>{ru ? "Назад к поиску" : "Back to search"}</button>
    </div>}
  </div>;
}
