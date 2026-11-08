"use client";

import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { TmsLocale } from "../../../localization/model/locale";
import { productDocSaveError } from "./actions/navigation/productDocSaveError";
import { emptyProductDocTaxonomy } from "../../domain/product-doc-taxonomy";
import type { ProductDocDetail, ProductDocScope, ProductDocsApi } from "../../domain/product-docs";
import { productDocsCopy, type ProductDocsCopy } from "../../localization/copy";
import { productDocDraftKey, type ProductDocDraftBuffer } from "../../state/draft/draft-buffer";
import { useProductDocMarkdownImport } from "./import/useProductDocMarkdownImport";
import { useBufferedProductDocDraft } from "../../state/draft/buffer/useBufferedProductDocDraft";
import { ProductDocReviewAction } from "../review/ProductDocReviewAction";
import { emptyProductDocProperties } from "../../domain/properties/product-doc-properties";
import { ProductDocDraftNavigation } from "./actions/navigation/ProductDocDraftNavigation";
import { ProductDocPublishPreview } from "./impact/ProductDocPublishPreview";
import { DraftActions } from "./actions/DraftActions";
import { changeTitleHighlights, trimTitleHighlights } from "./title/model/productDocTitleHighlights";
import styles from "./editor.module.css";
import { ProductDocDraftSurface } from "./surface/ProductDocDraftSurface";
import { editorMarkdownToSections, sectionsToEditorMarkdown } from "./sections/productDocMarkdown";
export type RequestNewProductDoc = (create: () => void) => void;

export function ProductDocDraft({ api, scope, document, copy, locale, drafts, editorActionsRef, requestNewPageRef, projectName, subdocs, onClose, onSaved, onPublished }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  projectName: string;
  subdocs?: ReactNode;
  locale: TmsLocale;
  onClose(): void;
  onSaved(): void;
  onPublished(): void;
  drafts: ProductDocDraftBuffer;
  editorActionsRef?: RefObject<HTMLDivElement | null>;
  requestNewPageRef?: RefObject<RequestNewProductDoc | null>;
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
  const [taxonomy, setTaxonomy] = useState(initial?.taxonomy ?? document.taxonomy ?? emptyProductDocTaxonomy);
  const [properties, setProperties] = useState(initial?.properties ?? document.properties ?? emptyProductDocProperties);
  const { baseline, setBaseline, dirty, titleFormattingChanged, taxonomyChanged, draftTaxonomy,
    propertiesChanged, draftProperties } = useBufferedProductDocDraft(
    drafts, bufferKey, initial?.baseline ?? { title: startingTitle, titleHighlights: document.titleHighlights,
      sections: document.sections, taxonomy: document.taxonomy, properties: document.properties, version: document.draftVersion },
    { title, titleHighlights, sections, taxonomy, properties },
  );
  const [validMarkup, setValidMarkup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [nextPage, setNextPage] = useState<{ create: () => void }>();
  const [previewVersion, setPreviewVersion] = useState<number>();
  const [saved, setSaved] = useState(false);
  const [actionsHost, setActionsHost] = useState<HTMLDivElement | null>(null);
  const [introId] = useState(() => crypto.randomUUID());
  const editorRef = useRef<MDXEditorMethods>(null), savingRef = useRef(false);
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
  const { importInput, readingFile, chooseFile, importText } = useProductDocMarkdownImport(editorRef, mounted, busy,
    () => setError(""), () => setError(copy.importError));

  function changeMarkdown(markdown: string) {
    setSections(editorMarkdownToSections(markdown, introId));
    setSaved(false);
  }
  async function save(publish: boolean, confirmedVersion?: number, useDefaultTitle = false) {
    const titleToSave = title.trim() || (useDefaultTitle ? copy.untitledPage : "");
    if (savingRef.current || mediaBusy || readingFile.current || !titleToSave || !withinLimits || !validMarkup
      || (publish ? !canPublish : !dirty)) return false;
    if (confirmedVersion !== undefined && (dirty || baseline.version !== confirmedVersion)) return false;
    if (confirmedVersion !== undefined) setPreviewVersion(undefined);
    savingRef.current = true;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      let expectedDraftVersion = baseline.version;
      if (dirty) {
        const cleanTitle = titleToSave;
        const cleanTitleHighlights = trimTitleHighlights(title, titleHighlights);
        const cleanSections = sections.map((section) => ({ ...section, title: section.title.trim() }));
        const previouslyMarkedSections = new Set(baseline.sections.filter((section) => section.titleHighlights?.length)
          .map((section) => section.id));
        const savedSections = cleanSections.map((section) => !section.titleHighlights?.length && previouslyMarkedSections.has(section.id)
          ? { ...section, titleHighlights: [] } : section);
        const saving = drafts.get(bufferKey);
        const result = await api.save(scope, document.id, { title: cleanTitle, sections: savedSections, expectedDraftVersion,
          ...(titleFormattingChanged || titleHighlights.length ? { titleHighlights: cleanTitleHighlights } : {}),
          ...(taxonomyChanged ? { taxonomy: draftTaxonomy } : {}),
          ...(propertiesChanged ? { properties: draftProperties } : {}) });
        expectedDraftVersion = result.draftVersion;
        if (drafts.get(bufferKey) === saving) drafts.delete(bufferKey);
        if (mounted.current) {
          setTitle(cleanTitle);
          setTitleHighlights(cleanTitleHighlights);
          setSections(cleanSections);
          setBaseline({ title: cleanTitle, titleHighlights: cleanTitleHighlights, sections: cleanSections, taxonomy, properties, version: expectedDraftVersion });
          onSaved();
          setSaved(true);
          if (folder) onClose();
        }
      }
      if (confirmedVersion !== undefined) {
        await api.publish(scope, document.id, { expectedDraftVersion: confirmedVersion });
        if (mounted.current) onPublished();
      } else if (publish && mounted.current) setPreviewVersion(expectedDraftVersion);
      return true;
    } catch (failure) {
      if (!mounted.current) return false;
      setError(productDocSaveError(failure, copy, locale));
      return false;
    } finally {
      savingRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  useImperativeHandle(requestNewPageRef, () => (create) => {
    if (savingRef.current || mediaBusy || readingFile.current || nextPage || previewVersion !== undefined) return;
    if (dirty) {
      setError("");
      setNextPage({ create });
    } else create();
  });
  function discardDraft() {
    drafts.delete(bufferKey);
    onClose();
  }

  const publishLabel = document.publishedVersion === null ? copy.publish : ru ? "Обновить" : "Update";
  const actions = <DraftActions copy={copy} locale={locale} scope={scope} folder={folder} busy={busy} mediaBusy={mediaBusy} saved={saved}
    review={!folder && document.canEdit && <ProductDocReviewAction target={{ ...scope, docId: document.id }} locale={locale}
      source={{ kind: "draft", draftVersion: baseline.version, dirty: dirty || !baseline.title.trim(),
        canPublish: document.canPublish, sections: baseline.sections }} disabled={busy || mediaBusy} />}
    canPublish={!folder && document.canPublish} publishLabel={publishLabel}
    canSave={!busy && !mediaBusy && dirty && valid} canSubmit={!busy && !mediaBusy && canPublish}
    onSave={(publish) => { void save(publish); }}
    onClose={() => { if (dirty) setDiscardOpen(true); else discardDraft(); }} />;
  return <div className={styles.draft} data-local-actions={!actionsHost || undefined}
    onKeyDown={(event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (!nextPage && !discardOpen && previewVersion === undefined) void save(false);
    }}>
    {actionsHost ? createPortal(actions, actionsHost) : <header className={styles.actionHeader}>{actions}</header>}
    <ProductDocDraftNavigation copy={copy} ru={ru} busy={busy} error={error} discardOpen={discardOpen}
      createPending={Boolean(nextPage)} canSave={withinLimits && validMarkup && !mediaBusy && (!folder || valid)}
      validationError={!withinLimits ? copy.draftTooLong : !validMarkup ? copy.fixFormattingBeforeCreate : ""}
      onKeep={() => setDiscardOpen(false)} onDiscard={discardDraft} onCancel={() => setNextPage(undefined)}
      onSave={async () => {
        if (!nextPage || !await save(false, undefined, !folder) || !mounted.current) return;
        setNextPage(undefined);
        nextPage.create();
      }} />
    {previewVersion !== undefined && <ProductDocPublishPreview api={api} scope={scope} docId={document.id} locale={locale}
      version={previewVersion} isUpdate={document.publishedVersion !== null} onClose={() => setPreviewVersion(undefined)}
      onPublish={(version) => { void save(true, version); }} />}
    <ProductDocDraftSurface document={document} scope={scope} copy={copy} locale={locale} projectName={projectName}
      subdocs={subdocs} busy={busy} isFreshPage={isFreshPage} title={title} titleHighlights={titleHighlights}
      taxonomy={taxonomy} properties={properties} editorSeed={editorSeed} editorRef={editorRef} importInput={importInput}
      withinLimits={withinLimits} validMarkup={validMarkup} error={error} onChange={changeMarkdown}
      onValidity={setValidMarkup} onImport={chooseFile} onImportText={importText} onMediaBusy={setMediaBusy}
      onTitle={(value) => {
        setTitleHighlights((current) => changeTitleHighlights(title, value, current));
        setTitle(value);
        setSaved(false);
      }} onHighlight={(value) => { setTitleHighlights(value); setSaved(false); }}
      onFolderSave={() => { void save(false); }}
      onTaxonomy={(value) => { setTaxonomy(value); setSaved(false); }}
      onProperties={(value) => { setProperties(value); setSaved(false); }}
      onRecover={() => {
        setValidMarkup(true);
        setEditorSeed((value) => ({ markdown: sectionsToEditorMarkdown(sections), epoch: value.epoch + 1 }));
      }} />
  </div>;
}
