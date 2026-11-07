"use client";

import dynamic from "next/dynamic";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { productDocErrorCode } from "../../domain/errors/product-doc-response";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocDetail, ProductDocSection, ProductDocScope, ProductDocsApi } from "../../domain/product-docs";
import { productDocDraftKey, type ProductDocDraftBuffer } from "../../state/draft/draft-buffer";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";

const RichProductSection = dynamic(() => import("./RichProductSection"), { ssr: false });

export function ProductDocDraft({ api, scope, document, copy, locale, drafts, onClose, onSaved, onPublished }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  locale: TmsLocale;
  onClose(): void;
  onSaved(): void;
  onPublished(): void;
  drafts: ProductDocDraftBuffer;
}) {
  const folder = document.kind === "folder";
  const bufferKey = productDocDraftKey(scope, document.id);
  const initial = drafts.get(bufferKey);
  const [title, setTitle] = useState(initial?.title ?? document.title);
  const [sections, setSections] = useState(initial?.sections ?? document.sections);
  const [editorVersion, setEditorVersion] = useState(0);
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(() => new Set());
  const [baseline, setBaseline] = useState(initial?.baseline
    ?? { title: document.title, sections: document.sections, version: document.draftVersion });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const dirty = title !== baseline.title || JSON.stringify(sections) !== JSON.stringify(baseline.sections);
  const withinLimits = sections.length <= 100 && sections.every((section) => section.markdown.length <= 32_768)
    && sections.reduce((length, section) => length + section.markdown.length, 0) <= 262_144;
  const valid = Boolean(title.trim() && withinLimits && !invalid.size);
  const canPublish = document.canPublish && valid && sections.some((section) => section.title.trim() || section.markdown.trim());

  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useLayoutEffect(() => {
    if (!dirty) {
      drafts.delete(bufferKey);
      return;
    }
    const current = drafts.get(bufferKey);
    if (current?.title !== title || current.sections !== sections || current.baseline !== baseline) {
      drafts.set(bufferKey, { title, sections, baseline });
    }
  }, [baseline, bufferKey, dirty, drafts, sections, title]);

  function changeSection(id: string, change: Partial<ProductDocSection>) {
    setSaved(false);
    setSections((current) => current.map((section) => section.id === id ? { ...section, ...change } : section));
  }

  function markValidity(id: string, validValue: boolean) {
    setInvalid((current) => {
      if (current.has(id) !== validValue) return current;
      const next = new Set(current);
      if (validValue) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeSection(id: string) {
    markValidity(id, true);
    setSections((current) => current.filter((section) => section.id !== id));
  }

  async function importMarkdown(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    try {
      if (file.size > 131_072 || sections.length >= 100 || !/\.(?:md|markdown)$/i.test(file.name)) throw new Error("Invalid Markdown file");
      const markdown = await file.text();
      if (!markdown.trim() || markdown.length > 32_768) throw new Error("Empty Markdown file");
      setSections((current) => [...current, {
        id: crypto.randomUUID(), title: file.name.replace(/\.(?:md|markdown)$/i, "").slice(0, 200), markdown,
      }]);
      setError("");
      setSaved(false);
    } catch {
      setError(copy.importError);
    } finally {
      setBusy(false);
    }
  }

  async function save(publish: boolean) {
    if (busy || !valid || (publish && !canPublish)) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      let expectedDraftVersion = baseline.version;
      if (dirty) {
        const cleanTitle = title.trim();
        const cleanSections = sections.map((section) => ({ ...section, title: section.title.trim() }));
        const saving = drafts.get(bufferKey);
        const result = await api.save(scope, document.id, { title: cleanTitle, sections: cleanSections, expectedDraftVersion });
        expectedDraftVersion = result.draftVersion;
        if (drafts.get(bufferKey) === saving) drafts.delete(bufferKey);
        if (mounted.current) {
          setTitle(cleanTitle);
          setSections(cleanSections);
          setBaseline({ title: cleanTitle, sections: cleanSections, version: expectedDraftVersion });
          onSaved();
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

  return <div className={styles.draft}>
    <header className={styles.draftHeader}>
      <span>{folder ? copy.renameFolder : copy.draft}</span>
      <div className={styles.formActions}>
        <button type="button" className={styles.action} disabled={busy} onClick={() => {
          if (dirty && !window.confirm(copy.unsaved)) return;
          drafts.delete(bufferKey);
          onClose();
        }}>{copy.cancel}</button>
        <button type="button" className={styles.action} disabled={busy || !dirty || !valid} onClick={() => void save(false)}>
          {busy ? copy.saving : folder ? copy.saveName : copy.save}
        </button>
        {!folder && document.canPublish && <button type="button" className={styles.primary} disabled={busy || !canPublish}
          onClick={() => void save(true)}>{copy.publish}</button>}
      </div>
    </header>
    <div className={styles.draftContent}>
      <input className={styles.titleInput} type="text" aria-label={folder ? copy.name : copy.untitled} placeholder={folder ? copy.name : copy.untitled}
        maxLength={200} value={title} disabled={busy} onChange={(event) => { setTitle(event.target.value); setSaved(false); }} />
      {!withinLimits && <p className={styles.error} role="alert">{copy.draftTooLong}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {saved && !dirty && <p className={styles.metadata} role="status">{copy.saved}</p>}
      {sections.map((section) => <section key={section.id} className={styles.draftSection}>
        <div className={styles.sectionHeader}>
          <input className={styles.sectionInput} type="text" aria-label={copy.sectionTitle} placeholder={copy.sectionTitle}
            maxLength={200} value={section.title} disabled={busy} onChange={(event) => changeSection(section.id, { title: event.target.value })} />
          <button type="button" className={styles.iconButton} aria-label={copy.removeSection} title={copy.removeSection}
            disabled={busy} onClick={() => removeSection(section.id)}><Trash2 size={16} aria-hidden="true" /></button>
        </div>
        <RichProductSection key={editorVersion} markdown={section.markdown} label={copy.sectionText} locale={locale} disabled={busy}
          onChange={(markdown) => changeSection(section.id, { markdown })}
          onValidity={(ok) => markValidity(section.id, ok)} />
        {invalid.has(section.id) && <>
          <p role="alert" className={styles.error}>{copy.editorError}</p>
          <textarea aria-label={copy.sectionText} className={styles.recoveryMarkdown} value={section.markdown} disabled={busy}
            onChange={(event) => changeSection(section.id, { markdown: event.target.value })}
            onBlur={() => { markValidity(section.id, true); setEditorVersion((value) => value + 1); }} />
        </>}
      </section>)}
      {!folder && <div className={styles.draftControls}>
        <button type="button" className={styles.action} disabled={busy || sections.length >= 100} onClick={() => setSections((current) => [
          ...current, { id: crypto.randomUUID(), title: "", markdown: "" },
        ])}><Plus size={16} aria-hidden="true" /> {copy.addSection}</button>
        <button type="button" className={styles.action} disabled={busy || sections.length >= 100} onClick={() => importInput.current?.click()}>
          <FileUp size={16} aria-hidden="true" /> {copy.importMarkdown}
        </button>
        <input ref={importInput} type="file" hidden accept=".md,.markdown,text/markdown"
          onChange={(event) => { void importMarkdown(event.target.files?.[0]); event.target.value = ""; }} />
      </div>}
    </div>
  </div>;
}
