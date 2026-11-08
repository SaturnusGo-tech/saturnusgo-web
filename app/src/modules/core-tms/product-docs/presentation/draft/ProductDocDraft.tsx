"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { TmsLocale } from "../../../localization/model/locale";
import { productDocErrorCode } from "../../domain/errors/product-doc-response";
import type { ProductDocDetail, ProductDocScope, ProductDocsApi } from "../../domain/product-docs";
import { productDocsCopy, type ProductDocsCopy } from "../../localization/copy";
import { productDocDraftKey, type ProductDocDraftBuffer } from "../../state/draft/draft-buffer";
import chrome from "../product-docs.module.css";
import { DraftActions } from "./actions/DraftActions";
import { ProductDocTitleInput } from "./title/ProductDocTitleInput";
import { changeTitleHighlights, trimTitleHighlights } from "./title/model/productDocTitleHighlights";
import styles from "./editor.module.css";
import { editorMarkdownToSections, readProductDocImport, sectionsToEditorMarkdown } from "./sections/productDocMarkdown";

const RichProductSection = dynamic(() => import("./RichProductSection"), {
  ssr: false, loading: () => <div className={styles.editorLoading} aria-busy="true" />,
});

export function ProductDocDraft({ api, scope, document, copy, locale, drafts, editorActionsRef, onClose, onSaved, onPublished }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  onClose(): void;
  onSaved(): void;
  onPublished(): void;
  drafts: ProductDocDraftBuffer;
  editorActionsRef?: RefObject<HTMLDivElement | null>;
}) {
  const ru = locale === "ru";
  const folder = document.kind === "folder";
  const bufferKey = productDocDraftKey(scope, document.id);
  const initial = drafts.get(bufferKey);
  const isFreshPage = !initial && !folder && document.publishedVersion === null
    && document.sections.length === 0 && document.draftVersion === 1;
  const isDefaultTitle = document.title === productDocsCopy("en").untitledPage
    || document.title === productDocsCopy("ru").untitledPage;
  const startingTitle = isFreshPage && isDefaultTitle ? "" : document.title;
  const [title, setTitle] = useState(initial?.title ?? startingTitle);
  const [titleHighlights, setTitleHighlights] = useState(initial?.titleHighlights ?? document.titleHighlights ?? []);
  const [sections, setSections] = useState(initial?.sections ?? document.sections);
  const [editorSeed, setEditorSeed] = useState(() => ({ markdown: sectionsToEditorMarkdown(sections), epoch: 0 }));
  const [baseline, setBaseline] = useState(initial?.baseline
    ?? { title: startingTitle, titleHighlights: document.titleHighlights, sections: document.sections, version: document.draftVersion });
  const [validMarkup, setValidMarkup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [actionsHost, setActionsHost] = useState<HTMLDivElement | null>(null);
  const [introId] = useState(() => crypto.randomUUID());
  const importInput = useRef<HTMLInputElement>(null);
  const readingFile = useRef(false);
  const editorRef = useRef<MDXEditorMethods>(null);
  const titleFormattingChanged = JSON.stringify(titleHighlights) !== JSON.stringify(baseline.titleHighlights ?? []);
  const dirty = title !== baseline.title || titleFormattingChanged || JSON.stringify(sections) !== JSON.stringify(baseline.sections);
  const withinLimits = sections.length <= 100 && sections.every((section) => section.title.length <= 200 && section.markdown.length <= 32_768)
    && sections.reduce((length, section) => length + section.markdown.length, 0) <= 262_144;
  const valid = Boolean(title.trim() && withinLimits && validMarkup);
  const canPublish = document.canPublish && valid && sections.some((section) => section.title.trim() || section.markdown.trim());

  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useLayoutEffect(() => { setActionsHost(editorActionsRef?.current ?? null); }, [editorActionsRef]);
  useLayoutEffect(() => {
    if (!dirty) {
      drafts.delete(bufferKey);
      return;
    }
    const current = drafts.get(bufferKey);
    if (current?.title !== title || current.titleHighlights !== titleHighlights || current.sections !== sections || current.baseline !== baseline) {
      drafts.set(bufferKey, { title, titleHighlights, sections, baseline });
    }
  }, [baseline, bufferKey, dirty, drafts, sections, title, titleHighlights]);

  function changeMarkdown(markdown: string) {
    setSections(editorMarkdownToSections(markdown, introId));
    setSaved(false);
  }

  const chooseFile = useCallback(() => importInput.current?.click(), []);

  async function importText(file?: File) {
    if (!file || busy || readingFile.current || !editorRef.current) return;
    readingFile.current = true;
    try {
      const content = await readProductDocImport(file);
      if (!mounted.current) return;
      editorRef.current?.focus(() => editorRef.current?.insertMarkdown(content),
        { defaultSelection: "rootEnd", preventScroll: true });
      setError("");
    } catch {
      if (mounted.current) setError(copy.importError);
    } finally {
      readingFile.current = false;
    }
  }

  async function save(publish: boolean) {
    if (busy || mediaBusy || readingFile.current || !valid || (publish ? !canPublish : !dirty)) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      let expectedDraftVersion = baseline.version;
      if (dirty) {
        const cleanTitle = title.trim();
        const cleanTitleHighlights = trimTitleHighlights(title, titleHighlights);
        const cleanSections = sections.map((section) => ({ ...section, title: section.title.trim() }));
        const previouslyMarkedSections = new Set(baseline.sections.filter((section) => section.titleHighlights?.length)
          .map((section) => section.id));
        const savedSections = cleanSections.map((section) => !section.titleHighlights?.length && previouslyMarkedSections.has(section.id)
          ? { ...section, titleHighlights: [] } : section);
        const saving = drafts.get(bufferKey);
        const result = await api.save(scope, document.id, { title: cleanTitle, sections: savedSections, expectedDraftVersion,
          ...(titleFormattingChanged || titleHighlights.length ? { titleHighlights: cleanTitleHighlights } : {}) });
        expectedDraftVersion = result.draftVersion;
        if (drafts.get(bufferKey) === saving) drafts.delete(bufferKey);
        if (mounted.current) {
          setTitle(cleanTitle);
          setTitleHighlights(cleanTitleHighlights);
          setSections(cleanSections);
          setBaseline({ title: cleanTitle, titleHighlights: cleanTitleHighlights, sections: cleanSections, version: expectedDraftVersion });
          if (!publish) onSaved();
          setSaved(true);
          if (folder) onClose();
        }
      }
      if (publish) {
        await api.publish(scope, document.id, { expectedDraftVersion });
        if (mounted.current) onPublished();
      }
    } catch (failure) {
      if (!mounted.current) return;
      const code = productDocErrorCode(failure);
      setError(code === "PRODUCT_DOC_STALE_DRAFT" ? copy.staleDraft
        : code === "PRODUCT_DOC_PARENT_UNPUBLISHED" ? copy.unpublishedParent : copy.saveError);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const publishLabel = document.publishedVersion === null ? copy.publish : ru ? "Обновить" : "Update";
  const actions = <DraftActions copy={copy} locale={locale} scope={scope} folder={folder} busy={busy} mediaBusy={mediaBusy} saved={saved}
    canPublish={!folder && document.canPublish} publishLabel={publishLabel}
    canSave={!busy && !mediaBusy && dirty && valid} canSubmit={!busy && !mediaBusy && canPublish}
    onSave={(publish) => { void save(publish); }}
    onClose={() => {
      if (dirty && !window.confirm(copy.unsaved)) return;
      drafts.delete(bufferKey);
      onClose();
    }} />;
  const heading = <div className={styles.pageHeading}>
    <ProductDocTitleInput title={title} highlights={titleHighlights} locale={locale} label={folder ? copy.name : copy.untitled}
      placeholder={folder ? copy.name : copy.untitledPage} disabled={busy} autoFocus={isFreshPage} folder={folder}
      onTitle={(value) => {
        setTitleHighlights((current) => changeTitleHighlights(title, value, current));
        setTitle(value);
        setSaved(false);
      }}
      onHighlight={(value) => { setTitleHighlights(value); setSaved(false); }}
      onEnter={() => folder ? void save(false) : editorRef.current?.focus(undefined, { defaultSelection: "rootStart" })} />
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!withinLimits && <p className={styles.error} role="alert">{copy.draftTooLong}</p>}
  </div>;
  return <div className={styles.draft} data-local-actions={!actionsHost || undefined}
    onKeyDown={(event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      void save(false);
    }}>
    {actionsHost ? createPortal(actions, actionsHost) : <header className={styles.actionHeader}>{actions}</header>}
    {folder ? heading : <>
      <RichProductSection key={editorSeed.epoch} markdown={editorSeed.markdown} title={heading}
        label={ru ? "Содержимое страницы" : "Page content"}
        placeholder={ru ? "Начните писать или нажмите / для вставки" : "Start writing or press / to insert"}
        locale={locale} disabled={busy} editorRef={editorRef}
        onChange={changeMarkdown} onValidity={setValidMarkup} onImport={chooseFile} onMediaBusy={setMediaBusy} />
      <input ref={importInput} type="file" hidden accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={(event) => { void importText(event.target.files?.[0]); event.target.value = ""; }} />
      {!validMarkup && <div className={styles.recovery}>
        <p className={styles.error} role="alert">{ru
          ? "Редактор не смог прочитать часть форматирования. Предыдущий черновик остаётся доступен."
          : "The editor couldn’t read some formatting. Your last complete draft is still available."}</p>
        <button className={chrome.action} type="button" disabled={busy} onClick={() => {
          setValidMarkup(true);
          setEditorSeed((value) => ({ markdown: sectionsToEditorMarkdown(sections), epoch: value.epoch + 1 }));
        }}>{copy.retry}</button>
      </div>}
    </>}
  </div>;
}
