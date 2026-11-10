import { ErrorToast } from "../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../shared/components/loading/LoadingOrb";
import { Button, Input, Listbox, ListboxItem } from "@heroui/react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DraftProductDocRequirement, ProductDocDetail, ProductDocScope, ProductDocsApi } from "../domain/product-docs";
import { ProductDocModal } from "../presentation/overlay/ProductDocModal";
import { ProductDocsMark } from "../presentation/tree/empty/ProductDocsMark";
import styles from "./requirements.module.css";

type PageOption = { id: string; title: string };

export function RequirementPicker({ api, scope, ru, disabled, linkFailed, onLink, onClose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  ru: boolean;
  disabled: boolean;
  linkFailed?: boolean;
  onLink(requirement: DraftProductDocRequirement): void;
  onClose(): void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<PageOption>();
  const [results, setResults] = useState<{ query: string; nodes: PageOption[] }>();
  const [document, setDocument] = useState<ProductDocDetail>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>();
  const search = useRef<HTMLInputElement>(null);
  const step = useRef<HTMLDivElement>(null);
  const term = query.trim();
  const pageId = page?.id;
  const activeDocument = pageId && document?.id === pageId ? document : undefined;
  const visiblePages = results?.query === term ? results.nodes : undefined;

  useEffect(() => {
    if (pageId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      api.list(scope, { q: term || undefined, limit: 20, signal: controller.signal }).then(
        result => {
          if (!controller.signal.aborted) {
            setResults({ query: term, nodes: result.nodes.filter(node => node.kind === "page" && node.publishedVersion !== null) });
          }
        },
        () => { if (!controller.signal.aborted) setError(true); },
      );
    }, term ? 180 : 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [api, scope, term, pageId, retry]);

  useEffect(() => {
    if (!pageId) return;
    const controller = new AbortController();
    api.get(scope, pageId, { signal: controller.signal }).then(
      article => { if (!controller.signal.aborted) setDocument(article); },
      () => { if (!controller.signal.aborted) setError(true); },
    );
    return () => controller.abort();
  }, [api, scope, pageId, retry]);

  useLayoutEffect(() => {
    if (!content) return;
    const measure = () => setHeight(content.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [content]);

  useLayoutEffect(() => {
    (pageId ? step.current : search.current)?.focus({ preventScroll: true });
  }, [pageId]);

  useLayoutEffect(() => {
    const element = step.current;
    if (activeDocument && element && element.ownerDocument.activeElement === element) {
      element.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])')?.focus({ preventScroll: true });
    }
  }, [activeDocument]);

  function choose(sectionId: string | null, sectionTitle: string | null) {
    if (!disabled && activeDocument?.version != null) {
      onLink({ docId: activeDocument.id, title: activeDocument.title, sectionId, sectionTitle });
    }
  }

  const title = page ? (ru ? "Выберите раздел" : "Choose a section") : (ru ? "Добавить статью" : "Add a page");
  const sectionOptions = activeDocument ? [
    { key: "whole", label: ru ? "Вся статья" : "Whole page", id: null, title: null },
    ...activeDocument.sections.map((section, index) => ({
      key: `section:${section.id}`,
      label: section.title || (ru ? `Раздел ${index + 1}` : `Section ${index + 1}`),
      id: section.id,
      title: section.title,
    })),
  ] : [];
  const listLabel = page ? (ru ? "Разделы статьи" : "Page sections") : (ru ? "Опубликованные статьи" : "Published pages");
  const showLoading = !error && (page ? !activeDocument : !visiblePages);
  return <ProductDocModal title={title} closeLabel={ru ? "Отмена" : "Cancel"} busy={disabled}
    className={styles.pickerDialog} onClose={onClose}>
    <div className={styles.pickerViewport} style={{ blockSize: height }}>
      <div className={styles.pickerContent} ref={setContent}>
        <div className={styles.pickerStep} key={page ? "sections" : "pages"} data-section-step={Boolean(page)} ref={step} tabIndex={-1}
          onKeyDown={event => {
            // The dialog is portalled from a form when creating a case.
            if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
          }}>
          {!page && <Input ref={search} autoFocus size="sm" variant="flat" radius="full" value={query} maxLength={200} isDisabled={disabled}
            aria-label={ru ? "Найти опубликованную статью" : "Find a published page"} placeholder={ru ? "Название статьи" : "Page title"}
            startContent={<Search size={16} aria-hidden="true" />}
            classNames={{ inputWrapper: styles.pickerSearch, input: styles.pickerSearchInput, innerWrapper: styles.pickerSearchInner }}
            onValueChange={value => { setError(false); setQuery(value); }} />}
          <ErrorToast message={error ? (ru ? "Не удалось загрузить документацию." : "Could not load Product Docs.") : null}
            retryLabel={ru ? "Повторить" : "Retry"} onRetry={disabled ? undefined : () => { setError(false); setRetry(value => value + 1); }} />
          {showLoading && <div role="status" className={styles.pickerMessage}>
            <LoadingOrb />
            {ru ? "Загрузка…" : "Loading…"}
          </div>}
          {!page && visiblePages && (visiblePages.length ? <Listbox aria-label={listLabel} items={visiblePages}
            classNames={{ base: styles.pickerList, list: styles.pickerListItems }} disabledKeys={disabled ? visiblePages.map(node => node.id) : []}>
            {node => <ListboxItem key={node.id} textValue={node.title} className={styles.pickerOption}
              startContent={<ProductDocsMark />} endContent={<ChevronRight size={14} aria-hidden="true" />}
              onPress={() => { setError(false); setDocument(undefined); setPage(node); }}>{node.title}</ListboxItem>}
          </Listbox> : <p className={styles.pickerMessage}>{ru ? "Статьи не найдены." : "No pages found."}</p>)}
          {page && <>
            <p className={styles.pickerPageTitle}>{page.title}</p>
            <ErrorToast message={linkFailed ? (ru ? "Не удалось изменить связь." : "Could not update the link.") : null} />
            {activeDocument && <Listbox aria-label={listLabel} items={sectionOptions} classNames={{ base: styles.pickerList, list: styles.pickerListItems }}
              disabledKeys={disabled || activeDocument.version == null ? sectionOptions.map(section => section.key) : []}>
              {section => <ListboxItem key={section.key} textValue={section.label} className={styles.pickerOption}
                onPress={() => choose(section.id, section.title)}>{section.label}</ListboxItem>}
            </Listbox>}
            <Button size="sm" variant="light" className={styles.pickerAction} isDisabled={disabled} startContent={<ArrowLeft size={15} aria-hidden="true" />}
              onPress={() => { setError(false); setPage(undefined); }}>{ru ? "Назад к поиску" : "Back to search"}</Button>
          </>}
        </div>
      </div>
    </div>
  </ProductDocModal>;
}
